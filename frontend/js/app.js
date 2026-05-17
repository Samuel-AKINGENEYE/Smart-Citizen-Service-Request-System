/* ============================================================
   SMART CITIZEN REQUEST SYSTEM — App Controller
   ============================================================ */

const App = window.App = {};

/* ---- State ---- */
const state = {
  token: null,
  user:  null,
  categories: [],
  myRequests: [],
  adminRequests: [],
  adminFiltered: [],
  adminStats: null,
  editingRequestId: null,
  form: { step: 1, categoryId: null, categoryName: '', title: '', description: '', location: '', priority: 'medium', photos: [] },
  adminSortCol: 'created_at',
  adminSortDir: 'desc',
  adminPage: 1,
  adminPageSize: 10,
  adminSearch: '',
  adminStatusFilter: '',
  adminCategoryFilter: '',
  selectedRequestId: null,
      if (isEdit) {
        state.myRequests = state.myRequests.map(function(r) {
          return r.id === state.editingRequestId ? requestItem : r;
        });
      } else {
        state.myRequests.unshift(requestItem);
      }

      var currentPts = (state.user && state.user.points) || 0;
      var newPts     = isEdit ? currentPts : currentPts + 10;
      if (state.user) state.user.points = newPts;
      if (!isEdit) floatXP(10, document.getElementById('header-xp'));

      count = (diff <= 1) ? count + 1 : 1;
    }
    localStorage.setItem(this.KEY_DATE,  today);
    localStorage.setItem(this.KEY_COUNT, String(count));
    return count;
  },
  get: function() {
    return parseInt(localStorage.getItem(this.KEY_COUNT) || '0', 10);
  },
  render: function() {
    var count = this.get();
    var badge = document.getElementById('streak-badge');
    var text  = document.getElementById('streak-text');
    if (!badge) return;
    if (count >= 2) {
      badge.style.display = '';
      if (text) text.textContent = count + ' day streak';
    } else {
      badge.style.display = 'none';
    }
  },
};

/* ============================================================
   ACHIEVEMENTS SYSTEM
   ============================================================ */
var ACHIEVEMENTS = [
  { id: 'first_report',  name: 'First Report',    desc: 'Submitted first request',  emoji: '🌟', pts: 5,  type: 'requests', threshold: 1 },
  { id: 'civic_5',       name: 'Civic Helper',     desc: '5 requests submitted',     emoji: '🏙️', pts: 15, type: 'requests', threshold: 5 },
  { id: 'civic_10',      name: 'Urban Champion',   desc: '10 requests submitted',    emoji: '🏆', pts: 30, type: 'requests', threshold: 10 },
  { id: 'rater',         name: 'Voice Heard',      desc: 'Rated a response',         emoji: '⭐', pts: 5,  type: 'rating',   threshold: 1 },
  { id: 'level_2',       name: 'Engaged',          desc: 'Reached Level 2',          emoji: '📈', pts: 10, type: 'level',    threshold: 2 },
  { id: 'level_3',       name: 'Active Citizen',   desc: 'Reached Level 3',          emoji: '🎖️', pts: 20, type: 'level',    threshold: 3 },
  { id: 'level_5',       name: 'City Champion',    desc: 'Reached max level',        emoji: '👑', pts: 50, type: 'level',    threshold: 5 },
  { id: 'streak_3',      name: 'Consistent',       desc: '3-day activity streak',    emoji: '🔥', pts: 10, type: 'streak',   threshold: 3 },
  { id: 'streak_7',      name: 'Dedicated',        desc: '7-day activity streak',    emoji: '💪', pts: 25, type: 'streak',   threshold: 7 },
];

var Achievements = {
  KEY: 'scrs-achievements',
  getUnlocked: function() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch (e) { return []; }
  },
  unlock: function(id) {
    var unlocked = this.getUnlocked();
    if (unlocked.indexOf(id) === -1) {
      unlocked.push(id);
      localStorage.setItem(this.KEY, JSON.stringify(unlocked));
      return true;
    }
    return false;
  },
  check: function(context) {
    var unlocked = this.getUnlocked();
    var newOnes  = [];
    var reqs     = (context.requests || 0);
    var lvl      = (context.level   || 1);
    var streak   = Streak.get();
    var rated    = (context.rated   || 0);

    ACHIEVEMENTS.forEach(function(a) {
      if (unlocked.indexOf(a.id) > -1) return;
      var earned = false;
      if (a.type === 'requests' && reqs >= a.threshold) earned = true;
      if (a.type === 'level'    && lvl  >= a.threshold) earned = true;
      if (a.type === 'streak'   && streak >= a.threshold) earned = true;
      if (a.type === 'rating'   && rated >= a.threshold) earned = true;
      if (earned) { Achievements.unlock(a.id); newOnes.push(a); }
    });
    return newOnes;
  },
  render: function() {
    var grid     = document.getElementById('achievements-grid');
    var countEl  = document.getElementById('achievements-count');
    if (!grid) return;
    var unlocked = this.getUnlocked();
    var total    = ACHIEVEMENTS.length;
    var doneCount = unlocked.length;
    if (countEl) countEl.textContent = doneCount + ' / ' + total;

    grid.innerHTML = ACHIEVEMENTS.map(function(a) {
      var isUnlocked = unlocked.indexOf(a.id) > -1;
      return '<div class="achievement-card ' + (isUnlocked ? 'unlocked' : 'locked') + '"' +
        ' title="' + escapeHtml(a.desc) + '">' +
        (isUnlocked ? '<span class="achievement-unlocked-badge">✓</span>' : '') +
        '<div class="achievement-emoji">' + a.emoji + '</div>' +
        '<div class="achievement-name">' + escapeHtml(a.name) + '</div>' +
        '<div class="achievement-desc">' + escapeHtml(a.desc) + '</div>' +
        '<div class="achievement-pts">+' + a.pts + ' pts</div>' +
      '</div>';
    }).join('');
  },
};

/* ============================================================
   FLOATING XP ANIMATION
   ============================================================ */
function floatXP(amount, fromEl) {
  var container = document.getElementById('xp-float-container');
  if (!container) return;
  var el = document.createElement('div');
  el.className = 'xp-float';
  el.textContent = '+' + amount + ' pts';
  var rect = fromEl
    ? fromEl.getBoundingClientRect()
    : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  el.style.left = (rect.left + rect.width / 2) + 'px';
  el.style.top  = (rect.top  + rect.height / 2) + 'px';
  document.body.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1600);
}

/* ============================================================
   LEVEL-UP CELEBRATION
   ============================================================ */
function showLevelUp(levelInfo) {
  var overlay = document.createElement('div');
  overlay.className = 'levelup-overlay';
  overlay.innerHTML =
    '<div class="levelup-card">' +
      '<div class="levelup-emoji">' + levelInfo.emoji + '</div>' +
      '<div class="levelup-title">Level Up!</div>' +
      '<div class="levelup-subtitle">You\'re now a <strong>' + escapeHtml(levelInfo.name) + '</strong></div>' +
      '<div class="levelup-badge">Level ' + levelInfo.level + ' achieved</div>' +
    '</div>';
  document.body.appendChild(overlay);
  setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 3200);
}

/* ============================================================
   TOAST SYSTEM
   ============================================================ */
const Toast = {
  show(title, message, type) {
    message = message || '';
    type    = type    || 'info';
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML =
      '<span class="toast-icon" aria-hidden="true">' + (icons[type] || icons.info) + '</span>' +
      '<div class="toast-body">' +
        '<div class="toast-title">' + escapeHtml(title) + '</div>' +
        (message ? '<div class="toast-msg">' + escapeHtml(message) + '</div>' : '') +
      '</div>' +
      '<button class="toast-close" aria-label="Dismiss">×</button>' +
      '<div class="toast-progress"></div>';
    toast.querySelector('.toast-close').addEventListener('click', function() { Toast._dismiss(toast); });
    container.appendChild(toast);
    toast._timer = setTimeout(function() { Toast._dismiss(toast); }, 4500);
  },
  _dismiss(toast) {
    clearTimeout(toast._timer);
    toast.classList.add('toast-exit');
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  },
};

/* ============================================================
   UTILITIES
   ============================================================ */
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

var _apiBase = 'https://scrs-api.onrender.com';
function _imgUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return _apiBase + url;
  return url;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch (e) { return dateStr; }
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return dateStr; }
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(function(w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase() || '?';
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function setButtonLoading(btnId, loading) {
  var btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  var text    = btn.querySelector('.btn-text');
  var spinner = btn.querySelector('.btn-spinner');
  if (text)    text.style.opacity = loading ? '0' : '1';
  if (spinner) spinner.classList.toggle('hidden', !loading);
}

function showView(id) {
  ['auth-view','citizen-view','admin-view'].forEach(function(v) {
    var el = document.getElementById(v);
    if (el) el.classList.add('hidden');
  });
  var target = document.getElementById(id);
  if (target) target.classList.remove('hidden');
}

/* ============================================================
   CATEGORY METADATA
   ============================================================ */
function getCategoryMeta(name) {
  name = (name || '').toLowerCase();
  if (name.indexOf('road') > -1 || name.indexOf('pothole') > -1)
    return { emoji: '🛣️', color: '#F97316', bg: '#FFF7ED' };
  if (name.indexOf('water') > -1 || name.indexOf('leakage') > -1)
    return { emoji: '💧', color: '#3B82F6', bg: '#EFF6FF' };
  if (name.indexOf('electric') > -1 || name.indexOf('light') > -1)
    return { emoji: '⚡', color: '#EAB308', bg: '#FEFCE8' };
  if (name.indexOf('sanitation') > -1 || name.indexOf('garbage') > -1)
    return { emoji: '🗑️', color: '#10B981', bg: '#ECFDF5' };
  if (name.indexOf('safety') > -1 || name.indexOf('security') > -1)
    return { emoji: '🚨', color: '#EF4444', bg: '#FEF2F2' };
  if (name.indexOf('park') > -1 || name.indexOf('tree') > -1)
    return { emoji: '🌳', color: '#22C55E', bg: '#F0FDF4' };
  return { emoji: '📋', color: '#6366F1', bg: '#EEF2FF' };
}

/* ============================================================
   BADGES
   ============================================================ */
var STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', rejected: 'Rejected' };

function statusBadge(status) {
  var s = status || 'open';
  var label = STATUS_LABELS[s] || s;
  return '<span class="badge badge-' + s + ' badge-animate" aria-label="Status: ' + label + '">' +
    '<span class="badge-dot" style="background:currentColor" aria-hidden="true"></span>' + label + '</span>';
}

function priorityBadge(priority) {
  var p       = priority || 'medium';
  var classMap = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high', urgent: 'badge-urgent-p' };
  var label   = p.charAt(0).toUpperCase() + p.slice(1);
  return '<span class="badge ' + (classMap[p] || 'badge-low') + '" aria-label="Priority: ' + label + '">' + label + '</span>';
}

/* ============================================================
   GAMIFICATION DISPLAY
   ============================================================ */
var GAMIFICATION_LEVELS = [
  { level: 1, name: 'Newcomer',        emoji: '🌱', minPts: 0,   maxPts: 29  },
  { level: 2, name: 'Engaged Citizen', emoji: '🏅', minPts: 30,  maxPts: 99  },
  { level: 3, name: 'Active Citizen',  emoji: '⭐', minPts: 100, maxPts: 199 },
  { level: 4, name: 'Community Hero',  emoji: '🌟', minPts: 200, maxPts: 499 },
  { level: 5, name: 'City Champion',   emoji: '🏆', minPts: 500, maxPts: 9999 },
];

function getLevelInfo(points) {
  var pts = points || 0;
  for (var i = GAMIFICATION_LEVELS.length - 1; i >= 0; i--) {
    if (pts >= GAMIFICATION_LEVELS[i].minPts) return GAMIFICATION_LEVELS[i];
  }
  return GAMIFICATION_LEVELS[0];
}

function renderGamification(points, prevPoints) {
  var pts     = points || 0;
  var info    = getLevelInfo(pts);
  var nextLvl = GAMIFICATION_LEVELS[Math.min(info.level, GAMIFICATION_LEVELS.length - 1)];
  var progress = info.level >= 5 ? 100 :
    Math.round(((pts - info.minPts) / (nextLvl.minPts - info.minPts)) * 100);
  var toNext   = info.level >= 5 ? 0 : nextLvl.minPts - pts;

  // Detect level-up (only when prevPoints was provided and level increased)
  if (prevPoints !== undefined && prevPoints !== null) {
    var prevInfo = getLevelInfo(prevPoints);
    if (info.level > prevInfo.level) {
      setTimeout(function() { showLevelUp(info); }, 300);
    }
  }

  // Header badge
  var hdrIcon   = document.getElementById('header-badge-icon');
  var hdrPoints = document.getElementById('header-points');
  if (hdrIcon)   hdrIcon.textContent   = info.emoji;
  if (hdrPoints) hdrPoints.textContent = pts + ' pts';

  // Level card
  var lvlNum    = document.getElementById('xp-level-num');
  var badgeName = document.getElementById('xp-badge-name');
  var ptsVal    = document.getElementById('xp-pts-value');
  var ptsNext   = document.getElementById('xp-pts-next');
  var progBar   = document.getElementById('xp-progress-bar');
  var avatar    = document.getElementById('xp-avatar-emoji');

  if (lvlNum)    lvlNum.textContent    = info.level;
  if (badgeName) badgeName.textContent = info.name;
  if (ptsVal)    ptsVal.textContent    = pts;
  if (avatar)    avatar.textContent    = info.emoji;
  if (ptsNext)   ptsNext.textContent   = info.level >= 5 ? 'Max level reached! 🏆' : toNext + ' pts to next level';
  if (progBar)   progBar.style.width   = progress + '%';

  // Streak
  Streak.render();
}

/* ============================================================
   REAL-TIME VALIDATION
   ============================================================ */
var Validator = {
  rules: {
    email:    { test: function(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }, msg: 'Enter a valid email address' },
    password: { test: function(v) { return v.length >= 6; }, msg: 'Password must be at least 6 characters' },
    name:     { test: function(v) { return v.trim().length >= 2; }, msg: 'Full name is required (min 2 chars)' },
    phone:    { test: function(v) { return /^[+\d\s\-()]{7,}$/.test(v); }, msg: 'Enter a valid phone number' },
    required: { test: function(v) { return v.trim().length > 0; }, msg: 'This field is required' },
  },
  validate: function(inputEl, ruleKey, errId, iconId) {
    var val    = inputEl.value;
    var rule   = this.rules[ruleKey];
    var errEl  = errId  ? document.getElementById(errId)  : null;
    var iconEl = iconId ? document.getElementById(iconId) : null;
    if (!val) {
      inputEl.classList.remove('field-valid', 'field-invalid');
      if (errEl)  errEl.textContent  = '';
      if (iconEl) iconEl.textContent = '';
      return null;
    }
    var ok = rule.test(val);
    inputEl.classList.toggle('field-valid',   ok);
    inputEl.classList.toggle('field-invalid', !ok);
    if (errEl)  errEl.textContent  = ok ? '' : rule.msg;
    if (iconEl) { iconEl.textContent = ok ? '✓' : '✗'; iconEl.style.color = ok ? 'var(--border-ok)' : 'var(--border-error)'; }
    return ok;
  },
};

/* ============================================================
   SOCIAL LOGIN
   ============================================================ */
App.socialLogin = function(provider) {
  var labels = { google: 'Google', apple: 'Apple', facebook: 'Facebook', twitter: 'X (Twitter)' };
  Toast.show('Coming soon', (labels[provider] || provider) + ' login will be available soon.', 'info');
};

/* ============================================================
   OTP RESEND + TIMER
   ============================================================ */
App.resendOtp = function() {
  var otpInput = document.getElementById('otp-input');
  var email    = otpInput ? otpInput.dataset.email : '';
  if (!email) { Toast.show('Error', 'Email not found. Please go back and try again.', 'error'); return; }

  var resendBtn = document.getElementById('resend-btn');
  var timerEl   = document.getElementById('resend-timer');
  if (resendBtn) { resendBtn.disabled = true; resendBtn.classList.add('hidden'); }
  if (timerEl)   timerEl.classList.remove('hidden');

  API.auth.resendOtp(email)
    .then(function() {
      Toast.show('Code resent! ✉️', 'Check your inbox for a new 6-digit verification code.', 'success');
      _startResendTimer(60, timerEl, resendBtn);
    })
    .catch(function(err) {
      Toast.show('Failed to resend', err.message || 'Please try again shortly.', 'error');
      if (resendBtn) { resendBtn.disabled = false; resendBtn.classList.remove('hidden'); }
      if (timerEl)   timerEl.classList.add('hidden');
    });
};

function _startResendTimer(seconds, timerEl, btn) {
  var remaining = seconds;
  if (timerEl) timerEl.textContent = 'Resend in ' + remaining + 's';
  var interval = setInterval(function() {
    remaining--;
    if (timerEl) timerEl.textContent = 'Resend in ' + remaining + 's';
    if (remaining <= 0) {
      clearInterval(interval);
      if (timerEl) timerEl.classList.add('hidden');
      if (btn) { btn.disabled = false; btn.classList.remove('hidden'); }
    }
  }, 1000);
}

/* ============================================================
   PASSWORD TOGGLE
   ============================================================ */
App.togglePassword = function(inputId, btn) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var isPassword = inp.type === 'password';
  inp.type = isPassword ? 'text' : 'password';
  btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
  var svg = btn.querySelector('svg');
  if (!svg) return;
  svg.innerHTML = isPassword
    ? '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>'
    : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
};

/* ============================================================
   USER DROPDOWN
   ============================================================ */
App.toggleUserMenu = function(prefix) {
  var btn  = document.getElementById(prefix + '-menu-btn');
  var menu = document.getElementById(prefix + '-dropdown');
  if (!btn || !menu) return;
  var open = !menu.classList.contains('hidden');
  menu.classList.toggle('hidden', open);
  btn.setAttribute('aria-expanded', String(!open));
};

document.addEventListener('click', function(e) {
  ['citizen','admin'].forEach(function(prefix) {
    var btn  = document.getElementById(prefix + '-menu-btn');
    var menu = document.getElementById(prefix + '-dropdown');
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
});

/* ============================================================
   AUTH TABS
   ============================================================ */
App.switchAuthTab = function(tab) {
  var panels  = { signin: 'panel-signin', register: 'panel-register', otp: 'panel-otp' };
  var tabBtns = { signin: 'tab-signin',  register: 'tab-register' };

  Object.keys(panels).forEach(function(key) {
    var el = document.getElementById(panels[key]);
    if (el) el.classList.add('hidden');
  });
  var target = document.getElementById(panels[tab]);
  if (target) target.classList.remove('hidden');

  Object.keys(tabBtns).forEach(function(key) {
    var btnEl = document.getElementById(tabBtns[key]);
    if (btnEl) {
      var active = key === tab;
      btnEl.classList.toggle('active', active);
      btnEl.setAttribute('aria-selected', String(active));
    }
  });
};

/* ============================================================
   SIGN IN
   ============================================================ */
function handleSignIn(e) {
  e.preventDefault();
  var emailEl = document.getElementById('signin-email');
  var pwEl    = document.getElementById('signin-password');
  var emailOk = Validator.validate(emailEl, 'email',    'signin-email-err',    'signin-email-icon');
  var pwOk    = Validator.validate(pwEl,    'password', 'signin-password-err', null);
  if (!emailOk || !pwOk) return;

  setButtonLoading('signin-btn', true);
  hideError('signin-error');

  API.auth.login(emailEl.value.trim(), pwEl.value)
    .then(function(data) {
      state.token = data.token;
      state.user  = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return enterApp();
    })
    .catch(function(err) {
      showError('signin-error', 'signin-error-text', err.message || 'Login failed. Check your credentials.');
    })
    .finally(function() { setButtonLoading('signin-btn', false); });
}

/* ============================================================
   REGISTER
   ============================================================ */
function handleRegister(e) {
  e.preventDefault();
  var nameEl  = document.getElementById('reg-name');
  var emailEl = document.getElementById('reg-email');
  var phoneEl = document.getElementById('reg-phone');
  var pwEl    = document.getElementById('reg-password');

  var results = [
    Validator.validate(nameEl,  'name',     'reg-name-err',     'reg-name-icon'),
    Validator.validate(emailEl, 'email',    'reg-email-err',    'reg-email-icon'),
    Validator.validate(phoneEl, 'phone',    'reg-phone-err',    'reg-phone-icon'),
    Validator.validate(pwEl,    'password', 'reg-password-err', null),
  ];
  if (results.some(function(r) { return !r; })) return;

  setButtonLoading('register-btn', true);
  hideError('register-error');

  var registeredEmail = emailEl.value.trim();
  API.auth.register(nameEl.value.trim(), registeredEmail, phoneEl.value.trim(), pwEl.value)
    .then(function() {
      var otpInput = document.getElementById('otp-input');
      if (otpInput) { otpInput.dataset.email = registeredEmail; otpInput.value = ''; }
      var otpEmailDisplay = document.getElementById('otp-email-display');
      if (otpEmailDisplay) otpEmailDisplay.textContent = registeredEmail;
      Toast.show('Account created! ✉️', 'A 6-digit code was sent to ' + registeredEmail, 'success');
      App.switchAuthTab('otp');
    })
    .catch(function(err) { showError('register-error', 'register-error-text', err.message || 'Registration failed'); })
    .finally(function() { setButtonLoading('register-btn', false); });
}

/* ============================================================
   VERIFY OTP
   ============================================================ */
App.verifyOtp = function() {
  var otpInput = document.getElementById('otp-input');
  var email    = otpInput ? otpInput.dataset.email : '';
  var otp      = otpInput ? otpInput.value.trim()  : '';
  if (!otp || otp.length < 6) { Toast.show('Invalid code', 'Please enter the 6-digit code from your email.', 'error'); return; }

  setButtonLoading('verify-btn', true);
  API.auth.verifyOtp(email, otp)
    .then(function() {
      Toast.show('Account verified! 🎉', 'You can now sign in.', 'success');
      App.switchAuthTab('signin');
    })
    .catch(function(err) { Toast.show('Verification failed', err.message, 'error'); })
    .finally(function() { setButtonLoading('verify-btn', false); });
};

/* ============================================================
   ENTER APP
   ============================================================ */
function enterApp() {
  var authView = document.getElementById('auth-view');
  return new Promise(function(resolve) {
    if (authView) {
      authView.classList.add('fade-out');
      setTimeout(function() {
        authView.classList.add('hidden');
        authView.classList.remove('fade-out');
        _launchView();
        resolve();
      }, 200);
    } else {
      _launchView();
      resolve();
    }
  });
}

function _launchView() {
  var role    = (state.user && state.user.role) || 'citizen';
  var isAdmin = role === 'super_admin' || role === 'department_admin';
  if (isAdmin) initAdminView();
  else         initCitizenView();
}

/* ============================================================
   LOGOUT
   ============================================================ */
App.logout = function() {
  localStorage.clear();
  state.token = null; state.user = null; state.myRequests = [];
  showView('auth-view');
  App.switchAuthTab('signin');
  ['signin-form','register-form'].forEach(function(id) { var f = document.getElementById(id); if (f) f.reset(); });
};

/* ============================================================
   ERROR HELPERS
   ============================================================ */
function showError(bannerId, textId, message) {
  var banner = document.getElementById(bannerId);
  var text   = document.getElementById(textId);
  if (banner) banner.classList.remove('hidden');
  if (text)   text.textContent = message;
}
function hideError(bannerId) {
  var banner = document.getElementById(bannerId);
  if (banner) banner.classList.add('hidden');
}

/* ============================================================
   CITIZEN VIEW
   ============================================================ */
function initCitizenView() {
  showView('citizen-view');
  var avatar = document.getElementById('citizen-avatar');
  var nameEl = document.getElementById('citizen-name');
  var uname  = (state.user && state.user.full_name) || (state.user && state.user.email) || '';
  if (avatar) avatar.textContent = getInitials(uname);
  if (nameEl) nameEl.textContent = uname;
  // Update streak and render gamification from login data immediately
  Streak.update();
  renderGamification((state.user && state.user.points) || 0);
  Achievements.render();
  loadCitizenData();
}

function loadCitizenData() {
  // Fetch requests and gamification profile in parallel
  Promise.all([
    API.requests.getMy(state.token).catch(function() { return { requests: [] }; }),
    API.user.getProfile(state.token).catch(function() { return { user: null }; }),
  ]).then(function(results) {
    state.myRequests = results[0].requests || [];
    var profile = results[1].user;
    if (profile) {
      var newPts = profile.points || 0;
      if (state.user) state.user.points = newPts;
      renderGamification(newPts);
    }
    renderCitizenStats();
    renderCitizenRequests(null);
    // Check level-based achievements after data loads
    var pts = (state.user && state.user.points) || 0;
    var ratedCount = state.myRequests.filter(function(r) { return r.my_rating; }).length;
    Achievements.check({ requests: state.myRequests.length, level: getLevelInfo(pts).level, rated: ratedCount });
    Achievements.render();
  });
}

function renderCitizenStats() {
  var reqs = state.myRequests;
  var grid = document.getElementById('citizen-stats-grid');
  if (!grid) return;

  var stats = [
    { label: 'Total',       value: reqs.length,                                                emoji: '📋', color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Open',        value: reqs.filter(function(r){return r.status==='open';}).length,        emoji: '🔵', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'In Progress', value: reqs.filter(function(r){return r.status==='in_progress';}).length, emoji: '🟡', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Resolved',    value: reqs.filter(function(r){return r.status==='resolved';}).length,    emoji: '✅', color: '#10B981', bg: '#ECFDF5' },
  ];

  grid.innerHTML = stats.map(function(s) {
    return '<div class="stat-card">' +
      '<div class="stat-icon-wrap" style="background:' + s.bg + '" aria-hidden="true">' + s.emoji + '</div>' +
      '<div class="stat-label">' + s.label + '</div>' +
      '<div class="stat-value" style="color:' + s.color + '">' + s.value + '</div>' +
    '</div>';
  }).join('');
}

function renderCitizenRequests(newRefNum) {
  var list  = document.getElementById('citizen-requests-list');
  var count = document.getElementById('citizen-req-count');
  if (!list) return;
  var reqs = state.myRequests;
  if (count) count.textContent = reqs.length;

  if (reqs.length === 0) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-state-icon">📭</div>' +
        '<h3 class="empty-state-title">No requests yet</h3>' +
        '<p class="empty-state-desc">Submit your first service request to get started.</p>' +
        '<button class="btn btn-primary" onclick="App.openRequestModal()">+ Submit Your First Request</button>' +
      '</div>';
    return;
  }

  list.innerHTML = reqs.map(function(req) {
    var meta   = getCategoryMeta(req.category_name || '');
    var isNew  = req.reference_number === newRefNum;
    var hasImages = req.attachments && req.attachments.length > 0;
    var hasResp   = req.responses   && req.responses.length  > 0;
    var myRating  = req.my_rating;

    /* Image thumbnails */
    var imagesHtml = '';
    if (hasImages) {
      imagesHtml = '<div class="req-images-row" aria-label="Attached photos">';
      req.attachments.forEach(function(att, idx) {
        var url  = _imgUrl(att.file_url || att.url || '');
        var name = escapeHtml(att.file_name || ('Image ' + (idx + 1)));
        imagesHtml += '<button type="button" class="req-img-thumb" ' +
          'onclick="event.stopPropagation();App.openCitizenLightboxById(' + req.id + ',' + idx + ')" ' +
          'aria-label="View ' + name + '">' +
          '<img src="' + escapeHtml(url) + '" alt="' + name + '" loading="lazy">' +
        '</button>';
      });
      imagesHtml += '</div>';
    }

    /* Admin responses */
    var responsesHtml = '';
    if (hasResp) {
      responsesHtml = '<div class="req-responses">';
      req.responses.forEach(function(resp) {
        responsesHtml +=
          '<div class="req-response-card">' +
            '<div class="req-response-header">' +
              '<span class="req-response-badge">Official Response</span>' +
              '<span class="req-response-by">' + escapeHtml(resp.admin_name || 'Admin') + '</span>' +
              '<span class="req-response-date">' + formatDate(resp.created_at) + '</span>' +
            '</div>' +
            '<p class="req-response-msg">' + escapeHtml(resp.message) + '</p>' +
          '</div>';
      });
      responsesHtml += '</div>';
    }

    /* Rating section */
    var ratingHtml = '';
    if (req.status === 'resolved' || req.status === 'rejected') {
      if (myRating) {
        var stars = '';
        for (var s = 1; s <= 5; s++) {
          stars += '<span class="star-display ' + (s <= myRating.rating ? 'filled' : '') + '">★</span>';
        }
        ratingHtml = '<div class="req-rating-done">' +
          '<span class="req-rating-label">Your rating:</span>' +
          '<span class="stars-display">' + stars + '</span>' +
          (myRating.feedback ? '<span class="req-rating-fb">"' + escapeHtml(myRating.feedback) + '"</span>' : '') +
          '<button class="btn-rate-update" onclick="event.stopPropagation();App.openRatingModal(' + req.id + ',' + myRating.rating + ')" aria-label="Update rating">Edit</button>' +
        '</div>';
      } else {
        ratingHtml = '<div class="req-rating-cta">' +
          '<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();App.openRatingModal(' + req.id + ', 0)" aria-label="Rate this request">' +
            '⭐ Rate this response — earn +5 pts' +
          '</button>' +
        '</div>';
      }
    }

    var confirmed  = req.citizen_confirmed;
    var deadline   = req.review_deadline ? new Date(req.review_deadline) : null;
    var confirmAllowed = !confirmed && deadline && new Date() <= deadline && req.status !== 'resolved' && req.status !== 'rejected';
    var confirmHtml = '';
    if (confirmed) {
      confirmHtml = '<div class="req-confirm-badge">✅ Confirmed on ' + formatDateTime(req.citizen_confirmed_at || req.created_at) + '</div>';
    } else if (confirmAllowed) {
      confirmHtml = '<div class="req-confirm-cta">' +
        '<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();App.confirmRequest(' + req.id + ')">Confirm details within 24h</button>' +
        '<span class="req-confirm-note">You can confirm this request within 24 hours of submission.</span>' +
      '</div>';
    } else if (req.review_deadline) {
      confirmHtml = '<div class="req-confirm-expired">Confirmation window expired on ' + formatDateTime(req.review_deadline) + '</div>';
    }

    var actionButtons = '';
    if (!req.status || req.status === 'open' || req.status === 'in_progress') {
      actionButtons = '<div class="req-action-row">' +
        '<button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();App.openRequestEditModal(' + req.id + ')">Edit</button>' +
        '<button class="btn btn-danger btn-sm" onclick="event.stopPropagation();App.deleteRequest(' + req.id + ')">Delete</button>' +
      '</div>';
    }

    var descPreview = req.description && String(req.description).trim()
      ? escapeHtml(req.description.length > 90 ? req.description.slice(0, 90) + '…' : req.description)
      : '';

    return '<div class="request-card' + (isNew ? ' highlight' : '') + '"' +
      ' tabindex="0" role="button"' +
      ' data-status="' + escapeHtml(req.status || 'open') + '"' +
      ' aria-label="Request: ' + escapeHtml(req.title) + ', Status: ' + (req.status || 'open') + '"' +
      ' onclick="App.toggleRequestCard(this)"' +
      ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')App.toggleRequestCard(this)">' +
      '<div class="request-card-header">' +
        '<div class="req-cat-icon" style="background:' + meta.bg + '" aria-hidden="true">' + meta.emoji + '</div>' +
        '<div class="req-card-meta">' +
          '<div class="req-card-title">' + escapeHtml(req.title) + '</div>' +
          (descPreview ? '<div class="req-desc-preview">' + descPreview + '</div>' : '') +
          '<div class="req-card-badges">' + statusBadge(req.status) + priorityBadge(req.priority) + '</div>' +
          '<div class="req-card-info">' +
            '<span>📎 ' + escapeHtml(req.reference_number || '—') + '</span>' +
            '<span>📅 ' + formatDate(req.created_at) + '</span>' +
            (req.location_address ? '<span>📍 ' + escapeHtml(req.location_address) + '</span>' : '') +
            (hasImages ? '<span>🖼️ ' + req.attachments.length + ' photo' + (req.attachments.length > 1 ? 's' : '') + '</span>' : '') +
            (hasResp   ? '<span class="resp-indicator">💬 ' + req.responses.length + ' response' + (req.responses.length > 1 ? 's' : '') + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<svg class="req-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>' +
      '</div>' +
      '<div class="req-card-body hidden">' +
        '<div class="req-desc-text">' + escapeHtml(req.description && String(req.description).trim() ? req.description : 'No description provided.') + '</div>' +
        (req.category_name ? '<p class="req-cat-label">Category: ' + escapeHtml(req.category_name) + '</p>' : '') +
        confirmHtml +
        actionButtons +
        imagesHtml +
        responsesHtml +
        ratingHtml +
      '</div>' +
    '</div>';
  }).join('');
}

App.toggleRequestCard = function(card) {
  var body = card.querySelector('.req-card-body');
  if (!body) return;
  var expanded = !body.classList.contains('hidden');
  body.classList.toggle('hidden', expanded);
  card.classList.toggle('expanded', !expanded);
};

/* Open lightbox from citizen card (receives array + index) */
App.openCitizenLightbox = function(attachments, index) {
  state.lightboxAttachments = attachments;
  App.openLightbox(index);
};

App.confirmRequest = function(id) {
  API.requests.confirm(id, state.token)
    .then(function() {
      var req = state.myRequests.find(function(r) { return r.id === id; });
      if (req) {
        req.citizen_confirmed = 1;
        req.citizen_confirmed_at = new Date().toISOString();
      }
      renderCitizenRequests();
      Toast.show('Confirmed', 'Your request details are now validated for 24 hours.', 'success');
    })
    .catch(function(err) {
      Toast.show('Confirmation failed', err.message || 'Could not confirm the request details.', 'error');
    });
};

/* ============================================================
   RATING MODAL
   ============================================================ */
App.openRatingModal = function(requestId, existingRating) {
  state.ratingRequestId = requestId;
  state.ratingValue     = existingRating || 0;

  document.getElementById('rating-request-id').value = requestId;
  document.getElementById('rating-feedback').value   = '';

  // Reset + set stars
  App.setRatingStar(existingRating || 0);

  var modal = document.getElementById('rating-modal');
  if (modal) modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

App.closeRatingModal = function() {
  var modal = document.getElementById('rating-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  state.ratingValue = 0;
};

App.setRatingStar = function(val) {
  state.ratingValue = val;
  var stars = document.querySelectorAll('#star-rating .star');
  var labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  stars.forEach(function(star) {
    var starVal = parseInt(star.dataset.val, 10);
    star.classList.toggle('active', starVal <= val);
  });
  var label = document.getElementById('rating-selected-label');
  if (label) label.textContent = val > 0 ? labels[val] + ' (' + val + '/5)' : 'Tap a star to rate';
};

App.submitRating = function() {
  var reqId    = state.ratingRequestId;
  var rating   = state.ratingValue;
  var feedback = (document.getElementById('rating-feedback') || {}).value || '';

  if (!rating || rating < 1) { Toast.show('Please select a rating', 'Tap on one of the stars first.', 'warning'); return; }

  setButtonLoading('submit-rating-btn', true);
  API.requests.rate(reqId, rating, feedback, state.token)
    .then(function() {
      Toast.show('Thank you! ⭐', 'Your feedback earns you +5 civic points.', 'success');
      App.closeRatingModal();

      // Float XP and update gamification optimistically
      floatXP(5, document.getElementById('header-xp'));
      var currentPts = (state.user && state.user.points) || 0;
      var newPts     = currentPts + 5;
      if (state.user) state.user.points = newPts;
      renderGamification(newPts, currentPts);

      // Check rating achievement
      var newAchievements = Achievements.check({ requests: state.myRequests.length, level: getLevelInfo(newPts).level, rated: 1 });
      newAchievements.forEach(function(a) {
        Toast.show('Achievement unlocked! ' + a.emoji, a.name + ' — ' + a.desc, 'success');
      });
      Achievements.render();

      // Refresh citizen data to update rating display
      loadCitizenData();
    })
    .catch(function(err) { Toast.show('Rating failed', err.message, 'error'); })
    .finally(function() { setButtonLoading('submit-rating-btn', false); });
};

/* ============================================================
   ADMIN VIEW
   ============================================================ */
function initAdminView() {
  showView('admin-view');
  var avatar = document.getElementById('admin-avatar');
  var nameEl = document.getElementById('admin-name');
  var uname  = (state.user && state.user.full_name) || (state.user && state.user.email) || '';
  if (avatar) avatar.textContent = getInitials(uname);
  if (nameEl) nameEl.textContent = uname;
  loadAdminData();
  populateAdminCategoryFilter();
}

function loadAdminData() {
  Promise.all([
    API.admin.getStats(state.token).catch(function() { return { stats: {} }; }),
    API.admin.getAll(state.token).catch(function()   { return { requests: [] }; }),
  ]).then(function(results) {
    state.adminStats    = results[0].stats    || {};
    state.adminRequests = results[1].requests || [];
    state.adminFiltered = state.adminRequests.slice();
    renderAdminStats();
    renderAdminTable();
  });
}

function renderAdminStats() {
  var s    = state.adminStats  || {};
  var reqs = state.adminRequests;
  var total      = s.total      != null ? s.total      : reqs.length;
  var open       = s.open       != null ? s.open       : reqs.filter(function(r){return r.status==='open';}).length;
  var inProgress = s.inProgress != null ? s.inProgress : reqs.filter(function(r){return r.status==='in_progress';}).length;
  var resolved   = s.resolved   != null ? s.resolved   : reqs.filter(function(r){return r.status==='resolved';}).length;

  var stats = [
    { label: 'Total',       value: total,      emoji: '📋', color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Open',        value: open,       emoji: '🔵', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'In Progress', value: inProgress, emoji: '🟡', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Resolved',    value: resolved,   emoji: '✅', color: '#10B981', bg: '#ECFDF5' },
  ];

  var grid = document.getElementById('admin-stats-grid');
  if (!grid) return;
  grid.innerHTML = stats.map(function(s) {
    return '<div class="stat-card">' +
      '<div class="stat-icon-wrap" style="background:' + s.bg + '" aria-hidden="true">' + s.emoji + '</div>' +
      '<div class="stat-label">' + s.label + '</div>' +
      '<div class="stat-value" style="color:' + s.color + '">' + s.value + '</div>' +
    '</div>';
  }).join('');
}

/* ---- Filter & Sort ---- */
App.adminFilter = function() {
  state.adminSearch         = ((document.getElementById('admin-search') || {}).value || '').toLowerCase();
  state.adminStatusFilter   = ((document.getElementById('admin-status-filter')   || {}).value || '');
  state.adminCategoryFilter = ((document.getElementById('admin-category-filter') || {}).value || '');
  state.adminPage = 1;

  state.adminFiltered = state.adminRequests.filter(function(req) {
    var matchSearch   = !state.adminSearch ||
      (req.title            || '').toLowerCase().indexOf(state.adminSearch) > -1 ||
      (req.citizen_name     || '').toLowerCase().indexOf(state.adminSearch) > -1 ||
      (req.reference_number || '').toLowerCase().indexOf(state.adminSearch) > -1;
    var matchStatus   = !state.adminStatusFilter   || req.status === state.adminStatusFilter;
    var matchCategory = !state.adminCategoryFilter || String(req.category_id) === state.adminCategoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  applyAdminSort();
  renderAdminTable();
};

App.adminSort = function(col) {
  if (state.adminSortCol === col) { state.adminSortDir = state.adminSortDir === 'asc' ? 'desc' : 'asc'; }
  else { state.adminSortCol = col; state.adminSortDir = 'asc'; }
  state.adminPage = 1;
  applyAdminSort();
  renderAdminTable();
  updateSortIndicators();
};

function applyAdminSort() {
  var col = state.adminSortCol;
  var dir = state.adminSortDir === 'asc' ? 1 : -1;
  state.adminFiltered.sort(function(a, b) {
    var av = a[col] || '', bv = b[col] || '';
    return av < bv ? -dir : av > bv ? dir : 0;
  });
}

function updateSortIndicators() {
  document.querySelectorAll('.requests-table th[data-col]').forEach(function(th) {
    th.classList.remove('sort-asc','sort-desc');
    th.setAttribute('aria-sort','none');
    var ind = th.querySelector('.sort-indicator');
    if (ind) ind.textContent = '↕';
  });
  var active = document.querySelector('.requests-table th[data-col="' + state.adminSortCol + '"]');
  if (active) {
    active.classList.add(state.adminSortDir === 'asc' ? 'sort-asc' : 'sort-desc');
    active.setAttribute('aria-sort', state.adminSortDir === 'asc' ? 'ascending' : 'descending');
    var ind = active.querySelector('.sort-indicator');
    if (ind) ind.textContent = state.adminSortDir === 'asc' ? '↑' : '↓';
  }
}

function renderAdminTable() {
  var tbody = document.getElementById('admin-tbody');
  var count = document.getElementById('admin-req-count');
  if (!tbody) return;
  var total = state.adminFiltered.length;
  if (count) count.textContent = total;

  if (total === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="table-empty">No requests found. Try adjusting your filters.</td></tr>';
    renderPagination(0);
    return;
  }

  var start = (state.adminPage - 1) * state.adminPageSize;
  var paged = state.adminFiltered.slice(start, start + state.adminPageSize);

  tbody.innerHTML = paged.map(function(req) {
    var meta     = getCategoryMeta(req.category_name || '');
    var selected = req.id === state.selectedRequestId;
    var descSnippet = req.description ? escapeHtml(req.description.slice(0, 80)) + (req.description.length > 80 ? '…' : '') : '—';
    var confirmBadge = '';
    if (req.citizen_confirmed) {
      confirmBadge = '<span class="admin-confirm-chip confirmed">Confirmed</span>';
    } else if (req.review_deadline && new Date(req.review_deadline) > new Date()) {
      confirmBadge = '<span class="admin-confirm-chip pending">Pending review</span>';
    } else if (req.review_deadline) {
      confirmBadge = '<span class="admin-confirm-chip expired">Review expired</span>';
    }
    return '<tr class="' + (selected ? 'selected' : '') + '"' +
      ' onclick="App.openSidePanel(' + req.id + ')"' +
      ' data-id="' + req.id + '"' +
      ' tabindex="0" role="row" aria-selected="' + selected + '"' +
      ' onkeydown="if(event.key===\'Enter\')App.openSidePanel(' + req.id + ')">' +
      '<td class="td-mono">' + escapeHtml(req.reference_number || '—') + '</td>' +
      '<td>' +
        '<div class="citizen-name">' + escapeHtml(req.citizen_name || '—') + '</div>' +
        (req.citizen_email ? '<div class="citizen-email">' + escapeHtml(req.citizen_email) + '</div>' : '') +
      '</td>' +
      '<td><span style="display:inline-flex;align-items:center;gap:5px">' +
        '<span aria-hidden="true">' + meta.emoji + '</span>' + escapeHtml(req.category_name || '—') +
      '</span></td>' +
      '<td class="truncate" style="max-width:200px">' + escapeHtml(req.title || '—') + confirmBadge + '</td>' +
      '<td class="truncate" style="max-width:260px">' + descSnippet + '</td>' +
      '<td>' +
        '<select class="status-select status-' + (req.status||'open') + '"' +
          ' aria-label="Update status"' +
          ' onchange="App.updateStatus(' + req.id + ', this.value, this)"' +
          ' onclick="event.stopPropagation()">' +
          '<option value="open"'        + (req.status==='open'        ? ' selected':'') + '>Open</option>' +
          '<option value="in_progress"' + (req.status==='in_progress' ? ' selected':'') + '>In Progress</option>' +
          '<option value="resolved"'    + (req.status==='resolved'    ? ' selected':'') + '>Resolved</option>' +
          '<option value="rejected"'    + (req.status==='rejected'    ? ' selected':'') + '>Rejected</option>' +
        '</select>' +
      '</td>' +
      '<td>' + priorityBadge(req.priority) + '</td>' +
      '<td>' + formatDate(req.created_at) + '</td>' +
    '</tr>';
  }).join('');

  renderPagination(total);
}

function renderPagination(total) {
  var paginationEl = document.getElementById('admin-pagination');
  if (!paginationEl) return;
  var pages = Math.ceil(total / state.adminPageSize);
  if (pages <= 1) { paginationEl.innerHTML = ''; return; }

  var start = (state.adminPage - 1) * state.adminPageSize + 1;
  var end   = Math.min(state.adminPage * state.adminPageSize, total);
  var btns  = '<button class="page-btn" onclick="App.adminChangePage(' + (state.adminPage - 1) + ')"' +
    (state.adminPage === 1 ? ' disabled' : '') + ' aria-label="Previous page">‹</button>';

  for (var p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - state.adminPage) <= 1) {
      btns += '<button class="page-btn' + (p === state.adminPage ? ' active' : '') + '"' +
        ' onclick="App.adminChangePage(' + p + ')" aria-label="Page ' + p + '">' + p + '</button>';
    } else if (Math.abs(p - state.adminPage) === 2) {
      btns += '<span class="page-btn" style="cursor:default;color:var(--text-muted)">…</span>';
    }
  }
  btns += '<button class="page-btn" onclick="App.adminChangePage(' + (state.adminPage + 1) + ')"' +
    (state.adminPage === pages ? ' disabled' : '') + ' aria-label="Next page">›</button>';

  paginationEl.innerHTML =
    '<span class="pagination-info">Showing ' + start + '–' + end + ' of ' + total + '</span>' +
    '<div class="pagination-btns" role="navigation" aria-label="Page navigation">' + btns + '</div>';
}

App.adminChangePage = function(page) {
  var pages = Math.ceil(state.adminFiltered.length / state.adminPageSize);
  if (page < 1 || page > pages) return;
  state.adminPage = page;
  renderAdminTable();
  var wrap = document.querySelector('.table-wrap');
  if (wrap) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ---- Status update ---- */
App.updateStatus = function(id, newStatus, selectEl) {
  selectEl.className = 'status-select status-' + newStatus;
  API.admin.updateStatus(id, newStatus, state.token)
    .then(function() {
      var req  = state.adminRequests.find(function(r) { return r.id === id; });
      var reqF = state.adminFiltered.find(function(r)  { return r.id === id; });
      if (req)  req.status  = newStatus;
      if (reqF) reqF.status = newStatus;
      renderAdminStats();
      Toast.show('Status updated', 'Moved to "' + (STATUS_LABELS[newStatus] || newStatus) + '"', 'success');
      if (state.selectedRequestId === id) {
        var panelSel = document.getElementById('panel-status-select');
        if (panelSel) { panelSel.value = newStatus; panelSel.className = 'status-select status-' + newStatus; }
      }
    })
    .catch(function(err) { Toast.show('Update failed', err.message, 'error'); });
};

/* ---- Priority update ---- */
App.updatePriority = function(id, newPriority, selectEl) {
  selectEl.className = 'priority-select priority-' + newPriority;
  API.admin.updatePriority(id, newPriority, state.token)
    .then(function() {
      var req  = state.adminRequests.find(function(r) { return r.id === id; });
      var reqF = state.adminFiltered.find(function(r)  { return r.id === id; });
      if (req)  req.priority  = newPriority;
      if (reqF) reqF.priority = newPriority;
      renderAdminTable();
      Toast.show('Priority updated', 'Changed to "' + newPriority.charAt(0).toUpperCase() + newPriority.slice(1) + '"', 'success');
    })
    .catch(function(err) { Toast.show('Update failed', err.message, 'error'); });
};

/* ---- Admin private note ---- */
App.saveAdminNote = function(id) {
  var textarea = document.getElementById('panel-note');
  var note     = textarea ? textarea.value.trim() : '';
  if (!note) { Toast.show('Note is empty', 'Write a note before saving.', 'warning'); return; }

  setButtonLoading('save-note-btn', true);
  API.admin.addNote(id, note, state.token)
    .then(function() {
      Toast.show('Note saved', 'Internal note added to this case.', 'success');
      if (textarea) textarea.value = '';
      App.refreshPanel();
    })
    .catch(function(err) { Toast.show('Save failed', err.message || 'Could not save note.', 'error'); })
    .finally(function() { setButtonLoading('save-note-btn', false); });
};

/* ---- Admin public response ---- */
App.sendAdminResponse = function(id) {
  var textarea = document.getElementById('panel-response');
  var message  = textarea ? textarea.value.trim() : '';
  if (!message) { Toast.show('Response is empty', 'Write a response message before sending.', 'warning'); return; }

  setButtonLoading('send-response-btn', true);
  API.admin.addResponse(id, message, state.token)
    .then(function() {
      Toast.show('Response sent! ✉️', 'Citizen has been notified by email.', 'success');
      if (textarea) textarea.value = '';
      App.refreshPanel();
    })
    .catch(function(err) { Toast.show('Failed to send', err.message || 'Could not send response.', 'error'); })
    .finally(function() { setButtonLoading('send-response-btn', false); });
};

/* ---- Side panel ---- */
App.openSidePanel = function(id) {
  state.selectedRequestId = id;
  var cached = state.adminRequests.find(function(r) { return r.id === id; }) ||
               state.adminFiltered.find(function(r)  { return r.id === id; });
  if (!cached) return;

  var panel    = document.getElementById('admin-side-panel');
  var body     = document.getElementById('panel-body');
  var panelRef = document.getElementById('panel-ref');
  var subtitle = document.getElementById('panel-subtitle');
  if (!panel || !body) return;

  panel.classList.remove('hidden');
  if (panelRef) panelRef.textContent = cached.reference_number || 'Request Details';
  if (subtitle) subtitle.textContent = cached.title || '';
  body.innerHTML = _panelSkeleton();

  document.querySelectorAll('#admin-tbody tr').forEach(function(tr) {
    tr.classList.toggle('selected', Number(tr.dataset.id) === id);
  });

  API.admin.getRequestDetail(id, state.token)
    .then(function(data) { _renderPanelContent(body, Object.assign({}, cached, data.request || data)); })
    .catch(function()    { _renderPanelContent(body, cached); });
};

App.refreshPanel = function() {
  if (state.selectedRequestId) App.openSidePanel(state.selectedRequestId);
};

App.closeSidePanel = function() {
  state.selectedRequestId   = null;
  state.lightboxAttachments = [];
  var panel = document.getElementById('admin-side-panel');
  if (panel) panel.classList.add('hidden');
  document.querySelectorAll('#admin-tbody tr').forEach(function(tr) { tr.classList.remove('selected'); });
};

/* ---- Panel helpers ---- */
function _panelSkeleton() {
  return '<div class="panel-section">' +
    '<div class="skeleton skel-title" style="width:55%;margin-bottom:10px"></div>' +
    '<div class="skeleton skel-title" style="width:80%;margin-bottom:10px"></div>' +
    '<div style="display:flex;gap:6px"><div class="skeleton skel-badge"></div><div class="skeleton skel-badge"></div></div>' +
  '</div>' +
  '<div class="panel-section">' +
    '<div class="skeleton skel-text" style="width:40%;margin-bottom:14px"></div>' +
    '<div class="skeleton skel-text" style="width:100%;margin-bottom:8px"></div>' +
    '<div class="skeleton skel-text" style="width:75%"></div>' +
  '</div>';
}

function _panelInfoRow(icon, label, value) {
  if (!value) return '';
  return '<div class="panel-info-row">' +
    '<div class="panel-info-icon" aria-hidden="true">' + icon + '</div>' +
    '<div><div class="panel-info-label">' + label + '</div>' +
         '<div class="panel-info-value">' + escapeHtml(value) + '</div></div>' +
  '</div>';
}

function _renderPanelContent(container, req) {
  var meta        = getCategoryMeta(req.category_name || '');
  var attachments = req.attachments || [];
  var timeline    = req.timeline    || [];
  var responses   = req.responses   || [];
  var rating      = req.rating;
  state.lightboxAttachments = attachments;

  var html = '';

  /* Section 1: Case header */
  html += '<div class="panel-section">' +
    '<div class="panel-case-header">' +
      '<span class="panel-ref-chip">' + escapeHtml(req.reference_number || '—') + '</span>' +
      '<div class="panel-title-text">' + escapeHtml(req.title || '—') + '</div>' +
      '<div class="panel-badges">' +
        '<span id="panel-status-badge">' + statusBadge(req.status) + '</span>' +
        priorityBadge(req.priority) +
      '</div>' +
    '</div>' +
  '</div>';

  /* Section 2: Issue details */
  html += '<div class="panel-section">' +
    '<div class="panel-section-title">Issue Details</div>' +
    '<div class="panel-info-grid">' +
      _panelInfoRow(meta.emoji, 'Category', req.category_name) +
      _panelInfoRow('📍', 'Location', req.location_address) +
      _panelInfoRow('📅', 'Submitted', formatDate(req.created_at)) +
    '</div>' +
  '</div>';

  /* Section 3: Description */
  html += '<div class="panel-section">' +
    '<div class="panel-section-title">Description</div>' +
    '<div class="panel-desc-full">' + escapeHtml(req.description && String(req.description).trim() ? req.description : 'No description provided.') + '</div>' +
  '</div>';

  /* Section 4: Citizen info */
  html += '<div class="panel-section">' +
    '<div class="panel-section-title">Citizen</div>' +
    '<div class="panel-info-grid">' +
      _panelInfoRow('👤', 'Name',  req.citizen_name  || req.full_name) +
      _panelInfoRow('✉️', 'Email', req.citizen_email || req.email) +
      _panelInfoRow('📞', 'Phone', req.citizen_phone || req.phone) +
      _panelInfoRow('✅', 'Confirmed', req.citizen_confirmed ? 'Yes' : 'No') +
      _panelInfoRow('⏰', 'Review deadline', req.review_deadline ? formatDateTime(req.review_deadline) : 'Not available') +
    '</div>' +
  '</div>';

  /* Section 5: Attachments */
  html += '<div class="panel-section">' +
    '<div class="panel-section-title">Attachments' +
      (attachments.length ? ' <span class="attach-count">' + attachments.length + '</span>' : '') +
    '</div>' +
    '<div class="attachment-gallery">';

  if (!attachments.length) {
    html += '<div class="attach-no-images">📷 No images attached</div>';
  } else {
    attachments.forEach(function(att, idx) {
      var url  = _imgUrl(att.file_url || att.url || String(att));
      var name = escapeHtml(att.file_name || att.name || ('Image ' + (idx + 1)));
      html += '<div class="attach-thumb" role="button" tabindex="0" aria-label="View ' + name + '"' +
        ' onclick="App.openLightbox(' + idx + ')"' +
        ' onkeydown="if(event.key===\'Enter\'||event.key===\' \')App.openLightbox(' + idx + ')">' +
        '<img src="' + escapeHtml(url) + '" alt="' + name + '" loading="lazy">' +
        '<div class="attach-overlay" aria-hidden="true">🔍</div>' +
      '</div>';
    });
  }
  html += '</div></div>';

  /* Section 6: Admin responses posted */
  if (responses.length) {
    html += '<div class="panel-section">' +
      '<div class="panel-section-title">Responses Posted <span class="attach-count">' + responses.length + '</span></div>';
    responses.forEach(function(r) {
      html += '<div class="panel-response-item">' +
        '<div class="panel-response-meta">' +
          '<span class="panel-response-admin">' + escapeHtml(r.admin_name || 'Admin') + '</span>' +
          '<span class="panel-response-date">' + formatDateTime(r.created_at) + '</span>' +
          '<span class="panel-response-vis">' + (r.is_public ? '👁️ Citizen visible' : '🔒 Internal') + '</span>' +
        '</div>' +
        '<p class="panel-response-msg">' + escapeHtml(r.message) + '</p>' +
      '</div>';
    });
    html += '</div>';
  }

  /* Section 7: Citizen rating */
  if (rating) {
    var starsHtml = '';
    for (var s = 1; s <= 5; s++) {
      starsHtml += '<span class="star-display ' + (s <= rating.rating ? 'filled' : '') + '">★</span>';
    }
    html += '<div class="panel-section">' +
      '<div class="panel-section-title">Citizen Rating</div>' +
      '<div class="panel-rating-row">' +
        '<span class="stars-display">' + starsHtml + '</span>' +
        '<span class="panel-rating-val">' + rating.rating + '/5</span>' +
      '</div>' +
      (rating.feedback ? '<div class="panel-rating-feedback">"' + escapeHtml(rating.feedback) + '"</div>' : '') +
    '</div>';
  }

  /* Section 8: Activity timeline */
  if (timeline.length) {
    html += '<div class="panel-section">' +
      '<div class="panel-section-title">Activity</div>' +
      '<div class="timeline">';
    timeline.forEach(function(item) {
      var dotClass = 'timeline-dot';
      if (item.new_status === 'resolved') dotClass += ' dot-resolved';
      else if (item.new_status === 'rejected') dotClass += ' dot-rejected';
      else if (item.new_status === 'open')     dotClass += ' dot-open';
      else if (!item.new_status)               dotClass += ' dot-created';
      html += '<div class="timeline-item">' +
        '<div class="timeline-spine"><div class="' + dotClass + '"></div><div class="timeline-line"></div></div>' +
        '<div class="timeline-content">' +
          '<div class="timeline-action">' + escapeHtml(item.action || 'Update') + '</div>' +
          '<div class="timeline-meta">' +
            (item.actor_name ? escapeHtml(item.actor_name) + ' · ' : '') + formatDate(item.created_at) +
            (item.is_public === 0 ? ' · <span class="timeline-private">Internal</span>' : '') +
          '</div>' +
          (item.comment ? '<div class="timeline-note">"' + escapeHtml(item.comment) + '"</div>' : '') +
        '</div>' +
      '</div>';
    });
    html += '</div></div>';
  }

  /* Section 9: Admin Actions */
  html += '<div class="panel-section">' +
    '<div class="panel-section-title">Admin Actions</div>' +
    '<div class="admin-action-card">' +

      '<div class="admin-action-row">' +
        '<div class="select-wrap">' +
          '<span class="select-wrap-label">Status</span>' +
          '<select id="panel-status-select" class="status-select status-' + (req.status||'open') + '"' +
            ' aria-label="Update status" onchange="App.updateStatus(' + req.id + ', this.value, this)">' +
            '<option value="open"'        + (req.status==='open'        ?' selected':'') + '>Open</option>' +
            '<option value="in_progress"' + (req.status==='in_progress' ?' selected':'') + '>In Progress</option>' +
            '<option value="resolved"'    + (req.status==='resolved'    ?' selected':'') + '>Resolved</option>' +
            '<option value="rejected"'    + (req.status==='rejected'    ?' selected':'') + '>Rejected</option>' +
          '</select>' +
        '</div>' +
        '<div class="select-wrap">' +
          '<span class="select-wrap-label">Priority</span>' +
          '<select id="panel-priority-select" class="priority-select priority-' + (req.priority||'medium') + '"' +
            ' aria-label="Update priority" onchange="App.updatePriority(' + req.id + ', this.value, this)">' +
            '<option value="low"'    + (req.priority==='low'    ?' selected':'') + '>Low</option>' +
            '<option value="medium"' + (req.priority==='medium' ?' selected':'') + '>Medium</option>' +
            '<option value="high"'   + (req.priority==='high'   ?' selected':'') + '>High</option>' +
            '<option value="urgent"' + (req.priority==='urgent' ?' selected':'') + '>Urgent</option>' +
          '</select>' +
        '</div>' +
      '</div>' +

      /* Public response to citizen */
      '<div class="panel-action-block response-block">' +
        '<div class="panel-action-block-label">' +
          '<span class="panel-action-block-icon response-icon">💬</span>' +
          '<div>' +
            '<div class="panel-action-block-title">Public Response</div>' +
            '<div class="panel-action-block-sub">Visible to citizen · sends email notification</div>' +
          '</div>' +
        '</div>' +
        '<textarea id="panel-response" class="panel-note-textarea"' +
          ' placeholder="Write an official response that the citizen will see on their dashboard…"' +
          ' aria-label="Public response to citizen"></textarea>' +
        '<button class="btn btn-primary btn-full" id="send-response-btn"' +
          ' onclick="App.sendAdminResponse(' + req.id + ')">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
          '<span class="btn-text">Send Response to Citizen</span>' +
          '<span class="btn-spinner hidden" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +

      /* Private internal note */
      '<div class="panel-action-block note-block">' +
        '<div class="panel-action-block-label">' +
          '<span class="panel-action-block-icon note-icon">🔒</span>' +
          '<div>' +
            '<div class="panel-action-block-title">Internal Note</div>' +
            '<div class="panel-action-block-sub">Not visible to citizen · team only</div>' +
          '</div>' +
        '</div>' +
        '<textarea id="panel-note" class="panel-note-textarea"' +
          ' placeholder="Add an internal note for your team…"' +
          ' aria-label="Internal admin note"></textarea>' +
        '<button class="btn btn-secondary btn-full" id="save-note-btn"' +
          ' onclick="App.saveAdminNote(' + req.id + ')">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
          '<span class="btn-text">Save Internal Note</span>' +
          '<span class="btn-spinner hidden" aria-hidden="true"></span>' +
        '</button>' +
      '</div>' +

    '</div>' +
  '</div>';

  container.innerHTML = html;
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
App.openLightbox = function(index) {
  var attachments = state.lightboxAttachments;
  if (!attachments || !attachments.length) return;
  state.lightboxIndex = index;
  var att    = attachments[index];
  var url    = att.file_url || att.url || String(att);
  var name   = att.file_name || att.name || ('Image ' + (index + 1));
  var lb     = document.getElementById('lightbox');
  var img    = document.getElementById('lightbox-img');
  var caption = document.getElementById('lightbox-caption');
  var counter = document.getElementById('lightbox-counter');
  var prevBtn = document.getElementById('lightbox-prev');
  var nextBtn = document.getElementById('lightbox-next');
  if (!lb || !img) return;
  img.src = url; img.alt = name;
  if (caption) caption.textContent = name;
  if (counter) counter.textContent = (index + 1) + ' / ' + attachments.length;
  if (prevBtn) prevBtn.disabled = index === 0;
  if (nextBtn) nextBtn.disabled = index === attachments.length - 1;
  lb.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  var closeBtn = document.getElementById('lightbox-close-btn');
  if (closeBtn) closeBtn.focus();
};

App.openCitizenLightboxById = function(requestId, index) {
  var req = state.myRequests.find(function(r) { return r.id === requestId; });
  if (!req || !req.attachments || !req.attachments.length) return;
  state.lightboxAttachments = req.attachments;
  App.openLightbox(index);
};

App.openRequestEditModal = function(requestId) {
  var req = state.myRequests.find(function(r) { return r.id === requestId; });
  if (!req) return;
  state.editingRequestId = requestId;
  state.form = {
    step: 2,
    categoryId: req.category_id || null,
    categoryName: req.category_name || '',
    title: req.title || '',
    description: req.description || '',
    location: req.location_address || '',
    priority: req.priority || 'medium',
    photos: [],
  };
  renderStep(2);
  updateModalProgress(2);
  renderCategoryGrid();
  var titleEl = document.getElementById('req-title');
  var descEl  = document.getElementById('req-description');
  var locEl   = document.getElementById('req-location');
  if (titleEl) titleEl.value = state.form.title;
  if (descEl)  descEl.value  = state.form.description;
  if (locEl)   locEl.value   = state.form.location;
  document.querySelectorAll('input[name="req-priority"]').forEach(function(r) { r.checked = r.value === state.form.priority; });
  var previews = document.getElementById('photo-previews');
  if (previews) previews.innerHTML = '<div class="field-note">Editing text only; photo changes are not supported in this version.</div>';
  var photoInput = document.getElementById('photo-input');
  if (photoInput) photoInput.value = '';
  var modal = document.getElementById('request-modal');
  if (modal) modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  var titleText = document.getElementById('modal-title-text');
  if (titleText) titleText.textContent = 'Edit Request';
};

App.deleteRequest = function(requestId) {
  if (!confirm('Delete this request? This cannot be undone.')) return;
  API.requests.remove(requestId, state.token)
    .then(function() {
      state.myRequests = state.myRequests.filter(function(r) { return r.id !== requestId; });
      renderCitizenStats();
      renderCitizenRequests();
      Toast.show('Request deleted', 'The request has been removed from your dashboard.', 'success');
    })
    .catch(function(err) { Toast.show('Delete failed', err.message || 'Could not delete request.', 'error'); });
};

App.closeLightbox = function() {
  var lb = document.getElementById('lightbox');
  if (lb) lb.classList.add('hidden');
  document.body.style.overflow = '';
};

App.lightboxPrev = function() {
  if (state.lightboxIndex > 0) App.openLightbox(state.lightboxIndex - 1);
};

App.lightboxNext = function() {
  if (state.lightboxIndex < state.lightboxAttachments.length - 1)
    App.openLightbox(state.lightboxIndex + 1);
};

function populateAdminCategoryFilter() {
  var sel = document.getElementById('admin-category-filter');
  if (!sel) return;
  (state.categories || []).forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name;
    sel.appendChild(opt);
  });
}

/* ============================================================
   REQUEST MODAL
   ============================================================ */
App.openRequestModal = function() {
  state.form = { step: 1, categoryId: null, categoryName: '', title: '', description: '', location: '', priority: 'medium', photos: [] };
  state.editingRequestId = null;
  renderStep(1); updateModalProgress(1); renderCategoryGrid();
  ['req-title','req-description','req-location'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('field-invalid','field-valid'); }
  });
  document.querySelectorAll('input[name="req-priority"]').forEach(function(r) { r.checked = r.value === 'medium'; });
  var previews = document.getElementById('photo-previews');
  if (previews) previews.innerHTML = '';
  var photoInput = document.getElementById('photo-input');
  if (photoInput) photoInput.value = '';
  state.form.photos = [];
  var modal = document.getElementById('request-modal');
  if (modal) modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  var titleText = document.getElementById('modal-title-text');
  if (titleText) titleText.textContent = 'Submit New Request';
  setTimeout(function() {
    var first = modal && (modal.querySelector('.category-tile') || modal.querySelector('input, button'));
    if (first) first.focus();
  }, 100);
};

App.closeRequestModal = function() {
  var modal = document.getElementById('request-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  state.editingRequestId = null;
  var titleText = document.getElementById('modal-title-text');
  if (titleText) titleText.textContent = 'Submit New Request';
};

document.addEventListener('DOMContentLoaded', function() {
  var modalOverlay = document.getElementById('request-modal');
  if (modalOverlay) modalOverlay.addEventListener('click', function(e) { if (e.target === modalOverlay) App.closeRequestModal(); });
  var lightbox = document.getElementById('lightbox');
  if (lightbox) lightbox.addEventListener('click', function(e) { if (e.target === lightbox) App.closeLightbox(); });
  var ratingModal = document.getElementById('rating-modal');
  if (ratingModal) ratingModal.addEventListener('click', function(e) { if (e.target === ratingModal) App.closeRatingModal(); });
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var lb = document.getElementById('lightbox');
    if (lb && !lb.classList.contains('hidden')) { App.closeLightbox(); return; }
    App.closeRatingModal();
    App.closeRequestModal();
    App.closeSidePanel();
  }
  if (e.key === 'ArrowLeft')  App.lightboxPrev();
  if (e.key === 'ArrowRight') App.lightboxNext();
});

/* ============================================================
   MULTI-STEP NAVIGATION
   ============================================================ */
function renderStep(step) {
  [1,2,3,4].forEach(function(s) {
    var panel = document.getElementById('step-panel-' + s);
    if (panel) panel.classList.toggle('active', s === step);
  });
  var backBtn  = document.getElementById('modal-back-btn');
  var nextBtn  = document.getElementById('modal-next-btn');
  var nextText = nextBtn && nextBtn.querySelector('.btn-text');
  if (backBtn)  backBtn.style.display = step > 1 ? '' : 'none';
  if (nextText) nextText.textContent  = step === 4 ? 'Submit Request' : 'Next';
  state.form.step = step;
}

function updateModalProgress(step) {
  var bar = document.getElementById('step-progress-bar');
  if (bar) bar.setAttribute('aria-valuenow', step);
  [1,2,3,4].forEach(function(s) {
    var item = document.getElementById('step-indicator-' + s);
    var conn = document.getElementById('step-conn-' + s);
    if (item) { item.classList.toggle('active', s === step); item.classList.toggle('done', s < step); }
    if (conn)   conn.classList.toggle('done', s < step);
  });
}

App.modalNext = function() {
  var step = state.form.step;
  if (step === 1) {
    if (!state.form.categoryId) {
      var errEl = document.getElementById('step1-error');
      if (errEl) errEl.textContent = 'Please select a category to continue.';
      return;
    }
    var err1 = document.getElementById('step1-error');
    if (err1) err1.textContent = '';
    renderStep(2); updateModalProgress(2);
  } else if (step === 2) {
    var titleEl = document.getElementById('req-title');
    var descEl  = document.getElementById('req-description');
    var titleOk = titleEl && titleEl.value.trim().length >= 3;
    var descOk  = descEl  && descEl.value.trim().length  >= 10;
    if (titleEl) titleEl.classList.toggle('field-invalid', !titleOk);
    if (descEl)  descEl.classList.toggle('field-invalid',  !descOk);
    var titleErr = document.getElementById('req-title-err');
    var descErr  = document.getElementById('req-desc-err');
    if (titleErr) titleErr.textContent = titleOk ? '' : 'Title must be at least 3 characters.';
    if (descErr)  descErr.textContent  = descOk  ? '' : 'Description must be at least 10 characters.';
    if (!titleOk || !descOk) return;
    state.form.title       = titleEl.value.trim();
    state.form.description = descEl.value.trim();
    var locEl = document.getElementById('req-location');
    state.form.location = locEl ? locEl.value.trim() : '';
    renderStep(3); updateModalProgress(3);
  } else if (step === 3) {
    var checked = document.querySelector('input[name="req-priority"]:checked');
    state.form.priority = checked ? checked.value : 'medium';
    buildReviewSummary();
    renderStep(4); updateModalProgress(4);
  } else if (step === 4) {
    submitRequest();
  }
};

App.modalBack = function() {
  var step = state.form.step;
  if (step > 1) { renderStep(step - 1); updateModalProgress(step - 1); }
};

/* ============================================================
   CATEGORY GRID
   ============================================================ */
function renderCategoryGrid() {
  var grid = document.getElementById('category-grid');
  if (!grid) return;
  if (!state.categories.length) {
    grid.innerHTML = '<p style="grid-column:1/-1;color:var(--text-muted);font-size:.867rem">Loading categories…</p>';
    return;
  }
  grid.innerHTML = state.categories.map(function(cat) {
    var meta = getCategoryMeta(cat.name);
    var sel  = state.form.categoryId === cat.id;
    return '<button type="button"' +
      ' class="category-tile' + (sel ? ' selected' : '') + '"' +
      ' role="radio" aria-checked="' + sel + '"' +
      ' aria-label="Category: ' + escapeHtml(cat.name) + '"' +
      ' onclick="App.selectCategory(' + cat.id + ', \'' + escapeHtml(cat.name).replace(/'/g, "\\'") + '\', this)">' +
      '<div class="category-tile-icon" style="background:' + meta.bg + '" aria-hidden="true">' + meta.emoji + '</div>' +
      '<span class="category-tile-name">' + escapeHtml(cat.name) + '</span>' +
    '</button>';
  }).join('');
}

App.selectCategory = function(id, name, el) {
  state.form.categoryId   = id;
  state.form.categoryName = name;
  document.querySelectorAll('.category-tile').forEach(function(t) {
    t.classList.remove('selected'); t.setAttribute('aria-checked', 'false');
  });
  el.classList.add('selected'); el.setAttribute('aria-checked', 'true');
  var errEl = document.getElementById('step1-error');
  if (errEl) errEl.textContent = '';
};

/* ============================================================
   CHAR COUNTS
   ============================================================ */
function initCharCounts() {
  [['req-title','title-count',100],['req-description','desc-count',500]].forEach(function(item) {
    var input   = document.getElementById(item[0]);
    var counter = document.getElementById(item[1]);
    var max     = item[2];
    if (!input || !counter) return;
    var update = function() { counter.textContent = input.value.length + ' / ' + max; };
    input.addEventListener('input', update);
    update();
  });
}

/* ============================================================
   PHOTO UPLOAD
   ============================================================ */
function initPhotoUpload() {
  var dropzone   = document.getElementById('dropzone');
  var photoInput = document.getElementById('photo-input');
  if (!dropzone || !photoInput) return;
  dropzone.addEventListener('click', function() { photoInput.click(); });
  dropzone.addEventListener('keydown', function(e) { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); photoInput.click(); } });
  dropzone.addEventListener('dragover',  function(e) { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', function()  { dropzone.classList.remove('drag-over'); });
  dropzone.addEventListener('drop', function(e) {
    e.preventDefault(); dropzone.classList.remove('drag-over'); addPhotos(Array.from(e.dataTransfer.files));
  });
  photoInput.addEventListener('change', function(e) { addPhotos(Array.from(e.target.files)); photoInput.value = ''; });
}

function addPhotos(files) {
  var images = files.filter(function(f) { return f.type.startsWith('image/'); });
  if (state.form.photos.length + images.length > 5) {
    Toast.show('Too many photos', 'Maximum 5 photos allowed.', 'warning');
    images = images.slice(0, 5 - state.form.photos.length);
  }
  images.forEach(function(file) {
    var index = state.form.photos.length;
    state.form.photos.push(file);
    renderPhotoThumb(file, index);
  });
}

function renderPhotoThumb(file, index) {
  var previews = document.getElementById('photo-previews');
  if (!previews) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var div = document.createElement('div');
    div.className = 'photo-thumb'; div.dataset.index = index;
    div.innerHTML =
      '<img src="' + e.target.result + '" alt="' + escapeHtml(file.name) + '" loading="lazy">' +
      '<button type="button" class="photo-thumb-remove" aria-label="Remove photo ' + escapeHtml(file.name) + '"' +
        ' onclick="App.removePhoto(' + index + ', this.parentElement)">×</button>' +
      '<span class="photo-thumb-info" title="' + escapeHtml(file.name) + '">' + escapeHtml(file.name) + '</span>' +
      '<span class="photo-thumb-info" style="color:var(--text-muted)">' + formatBytes(file.size) + '</span>';
    previews.appendChild(div);
  };
  reader.readAsDataURL(file);
}

App.removePhoto = function(index, thumbEl) {
  state.form.photos.splice(index, 1);
  if (thumbEl && thumbEl.parentNode) thumbEl.parentNode.removeChild(thumbEl);
  document.querySelectorAll('.photo-thumb').forEach(function(t, i) {
    t.dataset.index = i;
    var btn = t.querySelector('.photo-thumb-remove');
    if (btn) btn.setAttribute('onclick', 'App.removePhoto(' + i + ', this.parentElement)');
  });
};

/* ============================================================
   REVIEW SUMMARY
   ============================================================ */
function buildReviewSummary() {
  var container = document.getElementById('review-content');
  if (!container) return;
  var f = state.form;
  container.innerHTML =
    '<div class="review-row"><span class="review-label">Category</span><span class="review-value">' + escapeHtml(f.categoryName) + '</span></div>' +
    '<div class="review-divider"></div>' +
    '<div class="review-row"><span class="review-label">Title</span><span class="review-value font-semibold">' + escapeHtml(f.title) + '</span></div>' +
    '<div class="review-divider"></div>' +
    '<div class="review-row"><span class="review-label">Details</span><span class="review-value">' + escapeHtml(f.description) + '</span></div>' +
    (f.location ?
      '<div class="review-divider"></div>' +
      '<div class="review-row"><span class="review-label">Location</span><span class="review-value">📍 ' + escapeHtml(f.location) + '</span></div>' : '') +
    '<div class="review-divider"></div>' +
    '<div class="review-row"><span class="review-label">Priority</span><span class="review-value">' + priorityBadge(f.priority) + '</span></div>' +
    (f.photos.length > 0 ?
      '<div class="review-divider"></div>' +
      '<div class="review-row"><span class="review-label">Photos</span><span class="review-value">🖼️ ' + f.photos.length + ' file(s) attached</span></div>' : '');
}

/* ============================================================
   SUBMIT REQUEST
   ============================================================ */
function submitRequest() {
  var f = state.form;
  var formData = new FormData();
  formData.append('category_id',      f.categoryId);
  formData.append('title',            f.title);
  formData.append('description',      f.description);
  formData.append('location_address', f.location);
  formData.append('priority',         f.priority);
  f.photos.forEach(function(file) { formData.append('attachments', file); });

  setButtonLoading('modal-next-btn', true);
  var requestPromise = state.editingRequestId
    ? API.requests.update(state.editingRequestId, {
        category_id: f.categoryId,
        title: f.title,
        description: f.description,
        location_address: f.location,
        priority: f.priority,
      }, state.token)
    : API.requests.submit(formData, state.token);

  requestPromise
    .then(function(data) {
      var isEdit = Boolean(state.editingRequestId);
      var ref = data.reference_number || 'N/A';
      App.closeRequestModal();
      Toast.show(isEdit ? 'Request updated' : 'Request submitted! 🎉', 'Reference: ' + ref + (isEdit ? '' : ' — You earned +10 civic points!'), 'success');

      var requestItem = data.request || {
        id: Date.now(), reference_number: ref, title: f.title, description: f.description,
        location_address: f.location, priority: f.priority, status: 'open',
        category_id: f.categoryId, category_name: f.categoryName,
        created_at: new Date().toISOString(), attachments: [], responses: [], my_rating: null,
      };

      if (data.request) {
        requestItem.description = data.request.description != null ? data.request.description : f.description;
        requestItem.attachments = Array.isArray(data.request.attachments) && data.request.attachments.length
          ? data.request.attachments
          : f.photos.map(function(file, idx) {
              return { file_url: URL.createObjectURL(file), file_name: file.name, file_size: file.size, mime_type: file.type };
            });
        requestItem.responses = Array.isArray(data.request.responses) ? data.request.responses : [];
      } else if (f.photos.length) {
        requestItem.attachments = f.photos.map(function(file) {
          return { file_url: URL.createObjectURL(file), file_name: file.name, file_size: file.size, mime_type: file.type };
        });
      }

      state.myRequests.unshift(requestItem);

      if (isEdit) {
        state.myRequests = state.myRequests.map(function(r) {
          return r.id === state.editingRequestId ? requestItem : r;
        });
      } else {
        state.myRequests.unshift(requestItem);
      }
      } else {
        state.myRequests.unshift(requestItem);
      }
      var newPts     = isEdit ? currentPts : currentPts + 10;
      // Update gamification optimistically with level-up detection
      var currentPts = (state.user && state.user.points) || 0;
      var newPts     = currentPts + 10;
      if (state.user) state.user.points = newPts;
      if (!isEdit) floatXP(10, document.getElementById('header-xp'));

      // Float XP from header badge
      floatXP(10, document.getElementById('header-xp'));

      // Update streak and check achievements
      Streak.update();
      var newAchievements = Achievements.check({
        requests: state.myRequests.length,
        level:    getLevelInfo(newPts).level,
        rated:    0,
      });
      newAchievements.forEach(function(a) {
        Toast.show('Achievement unlocked! ' + a.emoji, a.name + ' — ' + a.desc, 'success');
      });
      Achievements.render();

      renderCitizenStats();
      renderCitizenRequests(ref);

      // Refresh the request list from the server to ensure full details are shown
      loadCitizenData();
    })
    .catch(function(err) { Toast.show('Submission failed', err.message || 'Please try again.', 'error'); })
    .finally(function() { setButtonLoading('modal-next-btn', false); });
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
  var signinForm   = document.getElementById('signin-form');
  var registerForm = document.getElementById('register-form');
  if (signinForm)   signinForm.addEventListener('submit',   handleSignIn);
  if (registerForm) registerForm.addEventListener('submit', handleRegister);

  var validationMap = [
    ['signin-email',    'email',    'signin-email-err',    'signin-email-icon'],
    ['signin-password', 'password', 'signin-password-err', null],
    ['reg-name',        'name',     'reg-name-err',        'reg-name-icon'],
    ['reg-email',       'email',    'reg-email-err',       'reg-email-icon'],
    ['reg-phone',       'phone',    'reg-phone-err',       'reg-phone-icon'],
    ['reg-password',    'password', 'reg-password-err',    null],
  ];
  validationMap.forEach(function(item) {
    var el = document.getElementById(item[0]);
    if (el) {
      (function(el, rule, errId, iconId) {
        el.addEventListener('blur', function() { Validator.validate(el, rule, errId, iconId); });
      })(el, item[1], item[2], item[3]);
    }
  });

  initPhotoUpload();
  initCharCounts();

  API.categories.getAll()
    .then(function(data) { state.categories = data.categories || []; })
    .catch(function() {
      state.categories = [
        { id: 1, name: 'Roads - Pothole' },    { id: 2, name: 'Roads - Street Damage' },
        { id: 3, name: 'Water - Leakage' },    { id: 4, name: 'Water - Supply Issue' },
        { id: 5, name: 'Electricity - Outage' },{ id: 6, name: 'Electricity - Streetlight' },
        { id: 7, name: 'Sanitation - Garbage' },{ id: 8, name: 'Sanitation - Drainage' },
        { id: 9, name: 'Public Safety - Lighting' },{ id: 10, name: 'Public Safety - Other' },
      ];
    });

  API.healthCheck();

  var savedToken = localStorage.getItem('token');
  var savedUser  = localStorage.getItem('user');
  if (savedToken && savedUser) {
    try {
      state.token = savedToken;
      state.user  = JSON.parse(savedUser);
      enterApp();
    } catch (e) {
      localStorage.clear();
      showView('auth-view');
    }
  } else {
    showView('auth-view');
  }
});
