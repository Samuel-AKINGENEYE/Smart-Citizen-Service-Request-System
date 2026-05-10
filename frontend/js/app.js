// Smart Citizen Request System - Production Frontend
const API_URL = window.API_URL || 'https://scrs-backend.onrender.com/api';
let authToken = localStorage.getItem('token');
let currentUser = null;

console.log('🔧 SCRS Frontend v2.0 Loaded');
console.log('📍 API URL:', API_URL);
console.log('🔐 Token exists:', !!authToken);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    if (authToken) {
        loadUserData();
    } else {
        showLogin();
    }
});

// Load categories
async function loadCategories() {
    try {
        const res = await axios.get(`${API_URL}/categories`);
        const select = document.getElementById('req-category');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' +
                res.data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
            console.log('Categories loaded:', res.data.categories.length);
        }
    } catch (err) {
        console.error('Categories error:', err);
    }
}

function showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('citizen-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('nav-buttons').classList.remove('hidden');
    document.getElementById('user-info').classList.add('hidden');
}

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('citizen-dashboard').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
}

// Register
async function register(event) {
    event.preventDefault();
    const data = {
        full_name: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        password: document.getElementById('reg-password').value,
        national_id: 'TEMP' + Date.now()
    };
    try {
        const res = await axios.post(`${API_URL}/auth/register`, data);
        if (res.data.success) {
            alert(`✅ Registration successful!\nYour OTP: ${res.data.otp}\nPlease verify your account.`);
            showLogin();
        }
    } catch (err) {
        alert('❌ Registration failed: ' + (err.response?.data?.message || err.message));
    }
}

// Login
async function login(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        if (res.data.success) {
            authToken = res.data.token;
            currentUser = res.data.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            console.log('Login successful:', currentUser);
            await loadUserData();
        }
    } catch (err) {
        alert('❌ Login failed: ' + (err.response?.data?.message || err.message));
    }
}

// Load user data
async function loadUserData() {
    document.getElementById('nav-buttons').classList.add('hidden');
    document.getElementById('user-info').classList.remove('hidden');
    document.getElementById('user-name').textContent = currentUser?.full_name;
    document.getElementById('user-role').textContent = currentUser?.role;
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');

    if (currentUser?.role === 'super_admin' || currentUser?.role === 'department_admin') {
        document.getElementById('admin-dashboard').classList.remove('hidden');
        document.getElementById('citizen-dashboard').classList.add('hidden');
        loadAdminStats();
        loadAllRequests();
    } else {
        document.getElementById('citizen-dashboard').classList.remove('hidden');
        document.getElementById('admin-dashboard').classList.add('hidden');
        loadMyRequests();
    }
}

// Submit request
async function submitRequest(event) {
    event.preventDefault();
    const formData = new FormData();
    formData.append('category_id', document.getElementById('req-category').value);
    formData.append('title', document.getElementById('req-title').value);
    formData.append('description', document.getElementById('req-description').value);
    formData.append('location_address', document.getElementById('req-location').value);
    formData.append('priority', document.getElementById('req-priority').value);
    
    const photos = document.getElementById('req-photos').files;
    for (let i = 0; i < photos.length; i++) {
        formData.append('attachments', photos[i]);
    }
    
    try {
        const res = await axios.post(`${API_URL}/requests`, formData, {
            headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.success) {
            alert(`✅ Request submitted!\nReference: ${res.data.reference_number}`);
            document.getElementById('req-title').value = '';
            document.getElementById('req-description').value = '';
            document.getElementById('req-location').value = '';
            document.getElementById('req-photos').value = '';
            document.getElementById('image-preview').innerHTML = '';
            loadMyRequests();
        }
    } catch (err) {
        alert('❌ Failed: ' + (err.response?.data?.message || err.message));
    }
}

// Load my requests
async function loadMyRequests() {
    try {
        const res = await axios.get(`${API_URL}/requests/my-requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const requests = res.data.requests;
        const container = document.getElementById('requests-list');
        if (!requests || requests.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">No requests yet</p>';
            return;
        }
        container.innerHTML = requests.map(req => `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold">${req.title || 'Request'}</h4>
                        <p class="text-sm text-gray-600 mt-1">${req.description?.substring(0, 100)}</p>
                        <div class="flex gap-2 mt-2">
                            <span class="text-xs px-2 py-1 rounded ${req.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">${req.status}</span>
                            <span class="text-xs px-2 py-1 rounded bg-gray-100">${req.priority}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-2">Ref: ${req.reference_number}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Error:', err);
        document.getElementById('requests-list').innerHTML = '<p class="text-red-500 text-center">Error loading requests</p>';
    }
}

// Admin functions
async function loadAdminStats() {
    try {
        const res = await axios.get(`${API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const s = res.data.stats;
        document.getElementById('total-requests').textContent = s.total || 0;
        document.getElementById('open-requests').textContent = s.open || 0;
        document.getElementById('progress-requests').textContent = s.inProgress || 0;
        document.getElementById('resolved-requests').textContent = s.resolved || 0;
    } catch (err) { console.error('Stats error:', err); }
}

async function loadAllRequests() {
    try {
        const res = await axios.get(`${API_URL}/admin/requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const requests = res.data.requests;
        const container = document.getElementById('admin-requests-list');
        if (!requests || requests.length === 0) {
            container.innerHTML = '<p class="text-center py-8">No requests found</p>';
            return;
        }
        container.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr><th class="px-4 py-2 text-left">Ref</th><th class="px-4 py-2 text-left">Citizen</th><th class="px-4 py-2 text-left">Title</th><th class="px-4 py-2 text-left">Status</th><th class="px-4 py-2 text-left">Priority</th><th class="px-4 py-2 text-left">Date</th></tr>
                </thead>
                <tbody>
                    ${requests.map(req => `
                        <tr class="border-t">
                            <td class="px-4 py-2">${req.reference_number}</td>
                            <td class="px-4 py-2">${req.citizen_name}</td>
                            <td class="px-4 py-2">${req.title || '-'}</td>
                            <td class="px-4 py-2">
                                <select onchange="updateStatus(${req.id}, this.value)" class="border rounded px-2 py-1">
                                    <option value="open" ${req.status === 'open' ? 'selected' : ''}>Open</option>
                                    <option value="in_progress" ${req.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="resolved" ${req.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                    <option value="rejected" ${req.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                </select>
                            </td>
                            <td class="px-4 py-2">${req.priority}</td>
                            <td class="px-4 py-2">${new Date(req.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) { console.error('Admin error:', err); }
}

window.updateStatus = async function(id, status) {
    try {
        await axios.put(`${API_URL}/admin/requests/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        alert('✅ Status updated');
        loadAllRequests();
        loadAdminStats();
    } catch (err) { alert('❌ Failed to update'); }
};

function logout() {
    localStorage.clear();
    authToken = null;
    currentUser = null;
    showLogin();
    alert('Logged out');
}

// Image preview
document.getElementById('req-photos')?.addEventListener('change', function(e) {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-16 h-16 object-cover rounded border';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

// Make global
window.showLogin = showLogin;
window.showRegister = showRegister;
window.login = login;
window.register = register;
window.submitRequest = submitRequest;
window.logout = logout;
