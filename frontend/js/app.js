// Smart Citizen Request System - Main Application
const API_URL = window.API_URL || 'https://scrs-backend.onrender.com/api';
let authToken = localStorage.getItem('token');
let currentUser = null;

console.log('🚀 SCRS Frontend Starting...');
console.log('🌐 API URL:', API_URL);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    if (authToken) {
        loadUserData();
    } else {
        showLogin();
    }
});

// Test backend connection
async function testConnection() {
    try {
        const response = await axios.get(API_URL.replace('/api', '') + '/health');
        console.log('✅ Backend connected:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
        return false;
    }
}
testConnection();

// Load categories
async function loadCategories() {
    try {
        const response = await axios.get(`${API_URL}/categories`);
        const select = document.getElementById('req-category');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' +
                response.data.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// UI Functions
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
        const response = await axios.post(`${API_URL}/auth/register`, data);
        if (response.data.success) {
            alert(`Registration successful! OTP: ${response.data.otp}`);
            showLogin();
        }
    } catch (error) {
        alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
}

// Login
async function login(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        if (response.data.success) {
            authToken = response.data.token;
            currentUser = response.data.user;
            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(currentUser));
            await loadUserData();
        }
    } catch (error) {
        alert('Login failed: ' + (error.response?.data?.message || error.message));
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
        const response = await axios.post(`${API_URL}/requests`, formData, {
            headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
            alert(`✅ Request submitted! Reference: ${response.data.reference_number}`);
            document.getElementById('req-title').value = '';
            document.getElementById('req-description').value = '';
            document.getElementById('req-location').value = '';
            document.getElementById('req-photos').value = '';
            document.getElementById('image-preview').innerHTML = '';
            loadMyRequests();
        }
    } catch (error) {
        alert('Failed: ' + (error.response?.data?.message || error.message));
    }
}

// Load my requests
async function loadMyRequests() {
    try {
        const response = await axios.get(`${API_URL}/requests/my-requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const requests = response.data.requests;
        const container = document.getElementById('requests-list');
        if (!requests || requests.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center">No requests yet</p>';
            return;
        }
        container.innerHTML = requests.map(req => `
            <div class="border rounded-lg p-4">
                <div class="flex justify-between">
                    <div>
                        <h4 class="font-bold">${req.title}</h4>
                        <p class="text-sm text-gray-600">${req.description?.substring(0, 100)}</p>
                        <span class="text-xs bg-gray-200 px-2 py-1 rounded mt-2 inline-block">${req.status}</span>
                        <span class="text-xs bg-gray-200 px-2 py-1 rounded ml-2">${req.priority}</span>
                        <p class="text-xs text-gray-500 mt-1">Ref: ${req.reference_number}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Admin functions
async function loadAdminStats() {
    try {
        const response = await axios.get(`${API_URL}/admin/stats`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const stats = response.data.stats;
        document.getElementById('total-requests').textContent = stats.total || 0;
        document.getElementById('open-requests').textContent = stats.open || 0;
        document.getElementById('progress-requests').textContent = stats.inProgress || 0;
        document.getElementById('resolved-requests').textContent = stats.resolved || 0;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadAllRequests() {
    try {
        const response = await axios.get(`${API_URL}/admin/requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const requests = response.data.requests;
        const container = document.getElementById('admin-requests-list');
        if (!requests || requests.length === 0) {
            container.innerHTML = '<p class="text-center">No requests</p>';
            return;
        }
        container.innerHTML = `
            <table class="min-w-full">
                <thead class="bg-gray-50">
                    <tr><th class="px-4 py-2">Ref</th><th>Citizen</th><th>Title</th><th>Status</th><th>Priority</th><th>Date</th></tr>
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
                                </select>
                            </td>
                            <td class="px-4 py-2">${req.priority}</td>
                            <td class="px-4 py-2">${new Date(req.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error:', error);
    }
}

window.updateStatus = async function(requestId, newStatus) {
    try {
        await axios.put(`${API_URL}/admin/requests/${requestId}/status`, { status: newStatus }, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        alert('Status updated!');
        loadAllRequests();
        loadAdminStats();
    } catch (error) {
        alert('Failed to update status');
    }
};

function logout() {
    localStorage.clear();
    authToken = null;
    currentUser = null;
    showLogin();
}

// Make functions global
window.showLogin = showLogin;
window.showRegister = showRegister;
window.login = login;
window.register = register;
window.submitRequest = submitRequest;
window.logout = logout;
window.updateStatus = updateStatus;

// Image preview
document.getElementById('req-photos')?.addEventListener('change', function(e) {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    const files = Array.from(e.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-20 h-20 object-cover rounded border';
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
});

console.log('✅ Frontend ready!');
