/* ============================================================
   API SERVICE — All backend calls centralized here
   ============================================================ */

const API_URL = 'https://scrs-api.onrender.com/api';

/* ---- Internal helper ---- */
async function _request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body && !(body instanceof FormData)) {
    opts.body = JSON.stringify(body);
  } else if (body instanceof FormData) {
    delete headers['Content-Type']; // let browser set multipart boundary
    opts.body = body;
  }

  const res = await fetch(API_URL + path, opts);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, data);
  }
  return data;
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/* ============================================================
   AUTH
   ============================================================ */
const auth = {
  async login(email, password) {
    return _request('POST', '/auth/login', { email, password });
  },

  async register(full_name, email, phone, password) {
    const national_id = 'TEMP' + Date.now();
    return _request('POST', '/auth/register', { full_name, email, phone, password, national_id });
  },

  async verifyOtp(email, otp) {
    return _request('POST', '/auth/verify-otp', { email, otp });
  },
};

/* ============================================================
   CATEGORIES
   ============================================================ */
const categories = {
  async getAll() {
    return _request('GET', '/categories');
  },
};

/* ============================================================
   REQUESTS (citizen)
   ============================================================ */
const requests = {
  async getMy(token) {
    return _request('GET', '/requests/my-requests', null, token);
  },

  async submit(formData, token) {
    const res = await fetch(API_URL + '/requests', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new ApiError(data.message || 'Submission failed', res.status, data);
    }
    return data;
  },
};

/* ============================================================
   ADMIN
   ============================================================ */
const admin = {
  async getStats(token) {
    return _request('GET', '/admin/stats', null, token);
  },

  async getAll(token) {
    return _request('GET', '/admin/requests', null, token);
  },

  async updateStatus(id, status, token) {
    return _request('PUT', `/admin/requests/${id}/status`, { status }, token);
  },
};

/* ============================================================
   HEALTH CHECK
   ============================================================ */
async function healthCheck() {
  try {
    const res = await fetch(API_URL.replace('/api', '/health'));
    const data = await res.json();
    console.log('[API] Health:', data.status);
    return true;
  } catch {
    console.warn('[API] Backend unreachable');
    return false;
  }
}

/* Export to global scope */
window.API = { auth, categories, requests, admin, healthCheck, ApiError };
