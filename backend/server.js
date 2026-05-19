// build: 2026-05-17
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const mysql      = require('mysql2/promise');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const nodemailer = require('nodemailer');

const app  = express();
app.set('trust proxy', true);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(helmet());

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'scrs_secret_key_2026';
const BASE_URL   = process.env.BASE_URL   || 'https://scrs-api.onrender.com';

// ========================
// MIDDLEWARE
// ========================
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// ========================
// DATABASE
// ========================
const pool = mysql.createPool({
  host:              process.env.DB_HOST     || 'localhost',
  user:              process.env.DB_USER     || 'samuel',
  password:          process.env.DB_PASSWORD || 'Samuel@2025!',
  database:          process.env.DB_NAME     || 'smart_city',
  waitForConnections: true,
  connectionLimit:   10,
  multipleStatements: false,
});

async function q(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// ========================
// EMAIL
// ========================
const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
});

async function sendOtpEmail(toEmail, toName, otp) {
  if (!process.env.EMAIL_USER) {
    console.log(`[Email] DEV MODE — OTP for ${toEmail}: ${otp}`);
    return true;
  }
  try {
    await mailer.sendMail({
      from: `"Smart Citizen System" <${process.env.EMAIL_USER}>`,
      to:   toEmail,
      subject: 'Your Smart Citizen Verification Code',
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="background:#4F46E5;width:56px;height:56px;border-radius:14px;margin:0 auto 12px;line-height:56px;font-size:28px;">🏛️</div>
            <h2 style="color:#1e293b;margin:0;">Smart Citizen</h2>
            <p style="color:#64748b;margin:4px 0 0;">Request System</p>
          </div>
          <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
            <h3 style="color:#1e293b;margin:0 0 8px;">Hi ${toName || 'there'},</h3>
            <p style="color:#475569;margin:0 0 24px;">Here is your 6-digit verification code. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:16px 40px;">
                <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#4F46E5;font-family:monospace;">${otp}</span>
              </div>
            </div>
            <p style="color:#94a3b8;font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:16px;">© 2026 Smart Citizen Request System</p>
        </div>`,
    });
    return true;
  } catch (err) {
    console.error('[Email] OTP send failed:', err.message);
    return false;
  }
}

async function sendResponseNotification(toEmail, toName, refNumber, responseMsg) {
  if (!process.env.EMAIL_USER) return;
  try {
    await mailer.sendMail({
      from: `"Smart Citizen System" <${process.env.EMAIL_USER}>`,
      to:   toEmail,
      subject: `Official response on your request ${refNumber}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;padding:32px;border-radius:12px;">
          <h2 style="color:#4F46E5;">Smart Citizen Request System</h2>
          <p>Dear ${toName || 'Citizen'},</p>
          <p>Your request <strong>${refNumber}</strong> has received an official response from our team:</p>
          <div style="background:#fff;border-left:4px solid #4F46E5;padding:16px 20px;border-radius:8px;margin:16px 0;">
            <p style="color:#1e293b;margin:0;">${responseMsg}</p>
          </div>
          <p>Log in to <a href="https://smart-citizen-service-request-syste.vercel.app">Smart Citizen</a> to view full details and rate our response.</p>
          <p style="color:#94a3b8;font-size:12px;">© 2026 Smart Citizen Request System</p>
        </div>`,
    });
  } catch (err) {
    console.error('[Email] Response notification failed:', err.message);
  }
}

// ========================
// FILE UPLOAD
// ========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const uniq = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniq + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only images allowed')),
});

// ========================
// AUTH MIDDLEWARE
// ========================
function authenticateToken(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!['super_admin', 'department_admin'].includes(req.user?.role))
    return res.status(403).json({ success: false, message: 'Admin access required' });
  next();
}

// ========================
// GAMIFICATION
// ========================
async function awardPoints(userId, pts, reason) {
  try {
    await q('UPDATE users SET points = COALESCE(points,0) + ? WHERE id = ?', [pts, userId]);
    const [u] = await q('SELECT points FROM users WHERE id = ?', [userId]);
    if (!u) return;
    const total = u.points || 0;
    let level = 1, badge = 'Newcomer';
    if      (total >= 500) { level = 5; badge = 'City Champion'; }
    else if (total >= 200) { level = 4; badge = 'Community Hero'; }
    else if (total >= 100) { level = 3; badge = 'Active Citizen'; }
    else if (total >=  30) { level = 2; badge = 'Engaged Citizen'; }
    await q('UPDATE users SET level = ?, badge = ? WHERE id = ?', [level, badge, userId]);
    console.log(`[XP] +${pts} → user ${userId} (${reason}): total ${total} pts, ${badge} Lv${level}`);
  } catch (err) {
    console.error('[XP] Error:', err.message);
  }
}

// ========================
// HEALTH
// ========================
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// ========================
// AUTH ROUTES
// ========================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, phone, password, full_name, national_id } = req.body;
    if (!email || !phone || !password || !full_name)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const emailClean = email.trim().toLowerCase();
    const phoneClean = phone.trim();
    const nameClean  = full_name.trim();

    const existing = await q('SELECT id FROM users WHERE email = ?', [emailClean]);
    if (existing.length)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const otp  = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await q(
      `INSERT INTO users (email, phone, password_hash, full_name, national_id, otp_code, otp_expires_at, points, level, badge)
       VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, 1, 'Newcomer')`,
      [emailClean, phoneClean, hash, nameClean, national_id ? national_id.trim() : 'N/A', otp]
    );

    await sendOtpEmail(email.trim().toLowerCase(), full_name.trim(), otp);

    res.status(201).json({ success: true, message: 'Account created! Check your email for the verification code.', userId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    const emailClean = email.trim().toLowerCase();
    const [u] = await q('SELECT id, otp_code, otp_expires_at FROM users WHERE email = ?', [emailClean]);
    if (!u) return res.status(404).json({ success: false, message: 'Email not found' });
    if (u.otp_code !== otp) return res.status(400).json({ success: false, message: 'Incorrect verification code' });
    if (new Date() > new Date(u.otp_expires_at)) return res.status(400).json({ success: false, message: 'Code expired — please request a new one' });

    await q('UPDATE users SET is_verified = 1, otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [u.id]);
    await awardPoints(u.id, 5, 'Account verified');

    res.json({ success: true, message: 'Account verified! You can now sign in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const emailClean = email.trim().toLowerCase();
    const [u] = await q('SELECT id, full_name, is_verified FROM users WHERE email = ?', [emailClean]);
    if (!u) return res.status(404).json({ success: false, message: 'Email not found' });
    if (u.is_verified) return res.status(400).json({ success: false, message: 'Account is already verified' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await q('UPDATE users SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?', [otp, u.id]);
    await sendOtpEmail(email, u.full_name, otp);

    res.json({ success: true, message: 'New code sent to your email.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const emailClean = email.trim().toLowerCase();
    const [u] = await q(
      'SELECT id, email, password_hash, full_name, role, is_active, is_verified, points, level, badge FROM users WHERE email = ?',
      [emailClean]
    );
    if (!u) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!u.is_active) return res.status(401).json({ success: false, message: 'Account deactivated — contact support' });

    const validPw = await bcrypt.compare(password, u.password_hash);
    if (!validPw) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isDemoAccount = ['admin@scrs.gov', 'citizen@test.com'].includes(u.email);
    if (!isDemoAccount && !u.is_verified)
      return res.status(401).json({ success: false, message: 'Please verify your email first. Check your inbox for the code.' });

    const token = jwt.sign({ userId: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '30d' });
    await q('UPDATE users SET last_login = NOW() WHERE id = ?', [u.id]);

    res.json({
      success: true,
      token,
      user: { id: u.id, email: u.email, full_name: u.full_name, role: u.role, points: u.points || 0, level: u.level || 1, badge: u.badge || 'Newcomer' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// CATEGORIES
// ========================
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await q('SELECT id, name, description, sla_hours FROM categories WHERE is_active = 1 ORDER BY name');
    res.json({ success: true, categories: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// CITIZEN REQUESTS
// ========================

// Submit request
app.post('/api/requests', authenticateToken, upload.array('attachments', 5), async (req, res) => {
  try {
    const { category_id, title, description, location_address, priority } = req.body;
    const citizenId = req.user.userId;
    if (!title || !description)
      return res.status(400).json({ success: false, message: 'Title and description are required' });

    const refNum = 'SCRS-' + Date.now().toString().slice(-6) + '-' + String(Math.floor(Math.random() * 100)).padStart(2, '0');

    const result = await q(
      `INSERT INTO requests (reference_number, citizen_id, category_id, title, description, location_address, priority, status, created_at, review_deadline, citizen_confirmed)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR), 0)`,
      [refNum, citizenId, category_id || null, title.trim(), description.trim(), location_address?.trim() || null, priority || 'medium']
    );
    const reqId = result.insertId;

    // Save attachments
    if (req.files?.length) {
      for (const file of req.files) {
        const fileUrl = `${BASE_URL}/uploads/${file.filename}`;
        await q(
          'INSERT INTO request_attachments (request_id, file_url, file_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?)',
          [reqId, fileUrl, file.originalname, file.size, file.mimetype]
        );
      }
    }

    // Timeline
    await q(
      'INSERT INTO request_timeline (request_id, user_id, action, new_status, is_public, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
      [reqId, citizenId, 'Request submitted', 'open']
    );

    // Gamification: +10 pts for submitting
    await awardPoints(citizenId, 10, 'Submitted a request');

    const [createdRequest] = await q(
      `SELECT r.id, r.reference_number, r.title, r.description, r.status, r.priority,
              r.location_address, r.created_at, r.updated_at, r.resolved_at,
              r.citizen_confirmed, r.citizen_confirmed_at, r.review_deadline,
              c.name AS category_name, c.id AS category_id
       FROM requests r
       LEFT JOIN categories c ON r.category_id = c.id
       WHERE r.id = ?`,
      [reqId]
    );
    if (createdRequest) {
      createdRequest.attachments = await q(
        'SELECT id, file_url, file_name, file_size FROM request_attachments WHERE request_id = ?',
        [reqId]
      );
      createdRequest.responses = [];
    }

    res.status(201).json({
      success: true,
      message: 'Request submitted successfully',
      request_id: reqId,
      reference_number: refNum,
      request: createdRequest || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// My requests (with images + responses + rating)
app.get('/api/requests/my-requests', authenticateToken, async (req, res) => {
  try {
    const citizenId = req.user.userId;
    const requests  = await q(
      `SELECT r.id, r.reference_number, r.title, r.description, r.status, r.priority,
              r.location_address, r.created_at, r.updated_at, r.resolved_at,
              r.citizen_confirmed, r.citizen_confirmed_at, r.review_deadline,
              c.name AS category_name, c.id AS category_id
       FROM requests r
       LEFT JOIN categories c ON r.category_id = c.id
       WHERE r.citizen_id = ?
       ORDER BY r.created_at DESC`,
      [citizenId]
    );

    for (const row of requests) {
      row.attachments = await q(
        'SELECT id, file_url, file_name, file_size FROM request_attachments WHERE request_id = ?',
        [row.id]
      );
      row.responses = await q(
        `SELECT rr.id, rr.message, rr.created_at, u.full_name AS admin_name
         FROM request_responses rr
         JOIN users u ON rr.admin_id = u.id
         WHERE rr.request_id = ? AND rr.is_public = 1
         ORDER BY rr.created_at ASC`,
        [row.id]
      );
      const [rating] = await q(
        'SELECT rating, feedback FROM request_ratings WHERE request_id = ? AND citizen_id = ?',
        [row.id, citizenId]
      );
      row.my_rating = rating || null;
    }

    res.json({ success: true, requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const citizenId = req.user.userId;
    const [row] = await q(
      `SELECT r.id, r.reference_number, r.title, r.description, r.status, r.priority,
              r.location_address, r.created_at, r.updated_at, r.resolved_at,
              r.citizen_confirmed, r.citizen_confirmed_at, r.review_deadline,
              c.name AS category_name, c.id AS category_id
       FROM requests r
       LEFT JOIN categories c ON r.category_id = c.id
       WHERE r.id = ? AND r.citizen_id = ?`,
      [id, citizenId]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Request not found' });

    row.attachments = await q(
      'SELECT id, file_url, file_name, file_size FROM request_attachments WHERE request_id = ?',
      [id]
    );
    row.responses = await q(
      `SELECT rr.id, rr.message, rr.created_at, u.full_name AS admin_name
       FROM request_responses rr
       JOIN users u ON rr.admin_id = u.id
       WHERE rr.request_id = ? AND rr.is_public = 1
       ORDER BY rr.created_at ASC`,
      [id]
    );
    const [rating] = await q(
      'SELECT rating, feedback FROM request_ratings WHERE request_id = ? AND citizen_id = ?',
      [id, citizenId]
    );
    row.my_rating = rating || null;

    res.json({ success: true, request: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const citizenId = req.user.userId;
    const { category_id, title, description, location_address, priority } = req.body;
    if (!title || !description)
      return res.status(400).json({ success: false, message: 'Title and description are required' });

    const [existing] = await q('SELECT citizen_id, status FROM requests WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found' });
    if (existing.citizen_id !== citizenId)
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (existing.status === 'resolved' || existing.status === 'rejected')
      return res.status(400).json({ success: false, message: 'Cannot edit a closed request' });

    await q(
      'UPDATE requests SET category_id = ?, title = ?, description = ?, location_address = ?, priority = ?, updated_at = NOW() WHERE id = ?',
      [category_id || null, title.trim(), description.trim(), location_address?.trim() || null, priority || 'medium', id]
    );

    const [updated] = await q(
      `SELECT r.id, r.reference_number, r.title, r.description, r.status, r.priority,
              r.location_address, r.created_at, r.updated_at, r.resolved_at,
              r.citizen_confirmed, r.citizen_confirmed_at, r.review_deadline,
              c.name AS category_name, c.id AS category_id
       FROM requests r
       LEFT JOIN categories c ON r.category_id = c.id
       WHERE r.id = ?`,
      [id]
    );
    if (updated) {
      updated.attachments = await q(
        'SELECT id, file_url, file_name, file_size FROM request_attachments WHERE request_id = ?',
        [id]
      );
      updated.responses = await q(
        `SELECT rr.id, rr.message, rr.created_at, u.full_name AS admin_name
         FROM request_responses rr
         JOIN users u ON rr.admin_id = u.id
         WHERE rr.request_id = ? AND rr.is_public = 1
         ORDER BY rr.created_at ASC`,
        [id]
      );
    }

    res.json({ success: true, request: updated || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/requests/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const citizenId = req.user.userId;
    const [existing] = await q('SELECT citizen_id, status FROM requests WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found' });
    if (existing.citizen_id !== citizenId)
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (existing.status === 'resolved' || existing.status === 'rejected')
      return res.status(400).json({ success: false, message: 'Cannot delete a closed request' });

    await q('DELETE FROM request_attachments WHERE request_id = ?', [id]);
    await q('DELETE FROM request_timeline WHERE request_id = ?', [id]);
    await q('DELETE FROM request_responses WHERE request_id = ?', [id]);
    await q('DELETE FROM request_ratings WHERE request_id = ?', [id]);
    await q('DELETE FROM requests WHERE id = ?', [id]);

    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Confirm request submission details (within 24 hours)
app.post('/api/requests/:id/confirm', authenticateToken, async (req, res) => {
  try {
    const reqId     = parseInt(req.params.id);
    const citizenId = req.user.userId;
    const [existing] = await q(
      `SELECT id, status, citizen_confirmed, review_deadline
       FROM requests
       WHERE id = ? AND citizen_id = ?`,
      [reqId, citizenId]
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found' });
    if (existing.citizen_confirmed) return res.status(400).json({ success: false, message: 'Request is already confirmed' });
    if (!existing.review_deadline || new Date() > new Date(existing.review_deadline))
      return res.status(400).json({ success: false, message: 'Confirmation window has expired' });

    await q(
      'UPDATE requests SET citizen_confirmed = 1, citizen_confirmed_at = NOW() WHERE id = ?',
      [reqId]
    );
    await q(
      'INSERT INTO request_timeline (request_id, user_id, action, old_status, new_status, is_public, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [reqId, citizenId, 'Request confirmed by citizen', existing.status, existing.status]
    );

    res.json({ success: true, message: 'Request confirmed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Rate a request
app.post('/api/requests/:id/rate', authenticateToken, async (req, res) => {
  try {
    const reqId     = parseInt(req.params.id);
    const citizenId = req.user.userId;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be 1–5 stars' });

    const [existing] = await q('SELECT id FROM requests WHERE id = ? AND citizen_id = ?', [reqId, citizenId]);
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found' });

    const [prev] = await q('SELECT id FROM request_ratings WHERE request_id = ? AND citizen_id = ?', [reqId, citizenId]);
    if (prev) {
      await q('UPDATE request_ratings SET rating = ?, feedback = ?, created_at = NOW() WHERE request_id = ? AND citizen_id = ?',
        [rating, feedback || null, reqId, citizenId]);
    } else {
      await q('INSERT INTO request_ratings (request_id, citizen_id, rating, feedback) VALUES (?, ?, ?, ?)',
        [reqId, citizenId, rating, feedback || null]);
      await awardPoints(citizenId, 5, 'Provided rating/feedback');
    }

    res.json({ success: true, message: 'Thank you for your feedback!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User profile / gamification
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const [u] = await q('SELECT id, email, full_name, points, level, badge, created_at FROM users WHERE id = ?', [req.user.userId]);
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: u });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// ADMIN ROUTES
// ========================

app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [totalRows, openRows, inProgressRows, resolvedRows, rejectedRows] = await Promise.all([
      q('SELECT COUNT(*) AS n FROM requests'),
      q("SELECT COUNT(*) AS n FROM requests WHERE status = 'open'"),
      q("SELECT COUNT(*) AS n FROM requests WHERE status = 'in_progress'"),
      q("SELECT COUNT(*) AS n FROM requests WHERE status = 'resolved'"),
      q("SELECT COUNT(*) AS n FROM requests WHERE status = 'rejected'"),
    ]);

    res.json({
      success: true,
      stats: {
        total: totalRows[0]?.n || 0,
        open: openRows[0]?.n || 0,
        inProgress: inProgressRows[0]?.n || 0,
        resolved: resolvedRows[0]?.n || 0,
        rejected: rejectedRows[0]?.n || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await q(
      `SELECT r.id, r.reference_number, r.title, r.description, r.status, r.priority,
              r.location_address, r.created_at, r.updated_at, r.citizen_confirmed, r.citizen_confirmed_at,
              c.name AS category_name, c.id AS category_id,
              u.full_name AS citizen_name, u.email AS citizen_email, u.phone AS citizen_phone
       FROM requests r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.citizen_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json({ success: true, requests: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await q(
      `SELECT r.id, r.reference_number, r.title, r.description, r.status, r.priority,
              r.location_address, r.created_at, r.updated_at, r.citizen_confirmed, r.citizen_confirmed_at, r.review_deadline,
              c.name AS category_name, c.id AS category_id,
              u.id AS citizen_id, u.full_name AS citizen_name, u.email AS citizen_email, u.phone AS citizen_phone
       FROM requests r
       LEFT JOIN categories c ON r.category_id = c.id
       LEFT JOIN users u ON r.citizen_id = u.id
       WHERE r.id = ?`,
      [id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Request not found' });

    row.attachments = await q(
      'SELECT id, file_url, file_name, file_size FROM request_attachments WHERE request_id = ?', [id]
    );
    row.timeline = await q(
      `SELECT rt.action, rt.old_status, rt.new_status, rt.comment, rt.is_public, rt.created_at, u.full_name AS actor_name
       FROM request_timeline rt
       LEFT JOIN users u ON rt.user_id = u.id
       WHERE rt.request_id = ?
       ORDER BY rt.created_at DESC`,
      [id]
    );
    row.responses = await q(
      `SELECT rr.id, rr.message, rr.is_public, rr.created_at, u.full_name AS admin_name
       FROM request_responses rr
       JOIN users u ON rr.admin_id = u.id
       WHERE rr.request_id = ?
       ORDER BY rr.created_at DESC`,
      [id]
    );
    const [rating] = await q('SELECT rating, feedback, created_at FROM request_ratings WHERE request_id = ?', [id]);
    row.rating = rating || null;

    res.json({ success: true, request: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/requests/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const { status } = req.body;
    if (!['open','in_progress','resolved','rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const [existing] = await q('SELECT status, citizen_id FROM requests WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found' });

    await q(
      'UPDATE requests SET status = ?, updated_at = NOW(), resolved_at = ? WHERE id = ?',
      [status, status === 'resolved' ? new Date() : null, id]
    );
    await q(
      'INSERT INTO request_timeline (request_id, user_id, action, old_status, new_status, is_public, created_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [id, req.user.userId, 'Status updated', existing.status, status]
    );

    if (status === 'resolved' && existing.citizen_id)
      await awardPoints(existing.citizen_id, 20, 'Request resolved');

    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/admin/requests/:id/priority', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id     = parseInt(req.params.id);
    const { priority } = req.body;
    if (!['low','medium','high','urgent'].includes(priority))
      return res.status(400).json({ success: false, message: 'Invalid priority' });

    await q('UPDATE requests SET priority = ?, updated_at = NOW() WHERE id = ?', [priority, id]);
    await q(
      'INSERT INTO request_timeline (request_id, user_id, action, is_public, created_at) VALUES (?, ?, ?, 0, NOW())',
      [id, req.user.userId, `Priority set to ${priority}`]
    );
    res.json({ success: true, message: 'Priority updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin private note (not visible to citizen)
app.post('/api/admin/requests/:id/notes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id   = parseInt(req.params.id);
    const { note } = req.body;
    if (!note?.trim()) return res.status(400).json({ success: false, message: 'Note cannot be empty' });

    await q(
      'INSERT INTO request_timeline (request_id, user_id, action, comment, is_public, created_at) VALUES (?, ?, ?, ?, 0, NOW())',
      [id, req.user.userId, 'Internal note', note.trim()]
    );
    res.json({ success: true, message: 'Note saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin public response (visible to citizen, sends email)
app.post('/api/admin/requests/:id/response', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id  = parseInt(req.params.id);
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Response message cannot be empty' });

    await q(
      'INSERT INTO request_responses (request_id, admin_id, message, is_public, created_at) VALUES (?, ?, ?, 1, NOW())',
      [id, req.user.userId, message.trim()]
    );
    await q(
      'INSERT INTO request_timeline (request_id, user_id, action, comment, is_public, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
      [id, req.user.userId, 'Official response posted', message.trim()]
    );

    // Notify citizen by email
    const [reqData] = await q(
      `SELECT r.reference_number, u.email AS citizen_email, u.full_name AS citizen_name
       FROM requests r JOIN users u ON r.citizen_id = u.id WHERE r.id = ?`,
      [id]
    );
    if (reqData) await sendResponseNotification(reqData.citizen_email, reqData.citizen_name, reqData.reference_number, message.trim());

    res.json({ success: true, message: 'Response posted and citizen notified by email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/admin/requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [existing] = await q('SELECT id FROM requests WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ success: false, message: 'Request not found' });

    await q('DELETE FROM request_attachments WHERE request_id = ?', [id]);
    await q('DELETE FROM request_timeline WHERE request_id = ?', [id]);
    await q('DELETE FROM request_responses WHERE request_id = ?', [id]);
    await q('DELETE FROM request_ratings WHERE request_id = ?', [id]);
    await q('DELETE FROM requests WHERE id = ?', [id]);

    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ========================
// DATABASE INIT
// ========================
async function initDb() {
  const safeExec = async (sql) => { try { await pool.query(sql); } catch (_) {} };

  await safeExec('ALTER TABLE users ADD COLUMN IF NOT EXISTS points INT DEFAULT 0');
  await safeExec("ALTER TABLE users ADD COLUMN IF NOT EXISTS level INT DEFAULT 1");
  await safeExec("ALTER TABLE users ADD COLUMN IF NOT EXISTS badge VARCHAR(50) DEFAULT 'Newcomer'");
  await safeExec('ALTER TABLE request_timeline ADD COLUMN IF NOT EXISTS is_public TINYINT(1) DEFAULT 1');
  await safeExec('ALTER TABLE requests ADD COLUMN IF NOT EXISTS citizen_confirmed TINYINT(1) DEFAULT 0');
  await safeExec('ALTER TABLE requests ADD COLUMN IF NOT EXISTS citizen_confirmed_at TIMESTAMP NULL');
  await safeExec('ALTER TABLE requests ADD COLUMN IF NOT EXISTS review_deadline TIMESTAMP NULL');

  await safeExec(`
    CREATE TABLE IF NOT EXISTS request_responses (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      request_id INT NOT NULL,
      admin_id   INT NOT NULL,
      message    TEXT NOT NULL,
      is_public  TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_req (request_id),
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    )`);

  await safeExec(`
    CREATE TABLE IF NOT EXISTS request_ratings (
      id         INT PRIMARY KEY AUTO_INCREMENT,
      request_id INT NOT NULL,
      citizen_id INT NOT NULL,
      rating     INT NOT NULL,
      feedback   TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_rating (request_id, citizen_id),
      FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE
    )`);

  console.log('[DB] Schema ready');
}

// ========================
// START
// ========================
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, async () => {
  console.log(`✅ SCRS API running on port ${PORT}`);
  await initDb().catch(err => console.error('[DB] Init failed:', err.message));
});

module.exports = app;
