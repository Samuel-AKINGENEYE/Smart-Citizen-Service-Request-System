// Smart Citizen Request System - Production Frontend
console.log('🚀 SCRS Frontend Starting...');

// Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://scrs-backend.onrender.com/api';

console.log('📍 Environment:', window.location.hostname);
console.log('🌐 API URL:', API_URL);

let authToken = localStorage.getItem('token');
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Loaded');
    loadCategories();
    
    if (authToken) {
        console.log('🔐 Token found, loading user data...');
        loadUserData();
    } else {
        console.log('👤 No token, showing login form');
        showLogin();
    }
});

// Test backend connection on load
async function testBackendConnection() {
    try {
        const response = await axios.get(`${API_URL.replace('/api', '')}/health`);
        console.log('✅ Backend connected:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
        console.log('⚠️ Make sure backend is deployed at:', API_URL);
        return false;
    }
}

// Call this to check connection
setTimeout(testBackendConnection, 1000);

// Load categories
async function loadCategories() {
    try {
        console.log('📋 Loading categories from:', `${API_URL}/categories`);
        const response = await axios.get(`${API_URL}/categories`);
        const categories = response.data.categories;
        const select = document.getElementById('req-category');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' +
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            console.log('✅ Categories loaded:', categories.length);
        }
    } catch (error) {
        console.error('❌ Error loading categories:', error);
        // Show fallback categories
        const select = document.getElementById('req-category');
        if (select) {
            select.innerHTML = `
                <option value="">Select Category</option>
                <option value="1">Roads - Pothole</option>
                <option value="2">Water - Leakage</option>
                <option value="3">Electricity - Outage</option>
            `;
        }
    }
}

// Show login form
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

// Register user
async function register(event) {
    event.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;

    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            full_name: name,
            email: email,
            phone: phone,
            password: password,
            national_id: 'TEMP' + Date.now()
        });

        if (response.data.success) {
            alert(`Registration successful! Your OTP is: ${response.data.otp}`);
            showLogin();
        }
    } catch (error) {
        alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
}

// Login user
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

// Load user data after login
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

// Submit a new request
async function submitRequest(event) {
    event.preventDefault();
    const category_id = document.getElementById('req-category').value;
    const title = document.getElementById('req-title').value;
    const description = document.getElementById('req-description').value;
    const location_address = document.getElementById('req-location').value;
    const priority = document.getElementById('req-priority').value;

    if (!category_id || !title || !description) {
        alert('Please fill all required fields');
        return;
    }

    const formData = new FormData();
    formData.append('category_id', category_id);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('location_address', location_address);
    formData.append('priority', priority);

    const photos = document.getElementById('req-photos').files;
    for (let i = 0; i < photos.length; i++) {
        formData.append('attachments', photos[i]);
    }

    try {
        const response = await axios.post(`${API_URL}/requests`, formData, {
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        if (response.data.success) {
            alert(`✅ Request submitted!\nReference: ${response.data.reference_number}`);
            document.getElementById('req-title').value = '';
            document.getElementById('req-description').value = '';
            document.getElementById('req-location').value = '';
            document.getElementById('req-photos').value = '';
            document.getElementById('image-preview').innerHTML = '';
            loadMyRequests();
        }
    } catch (error) {
        alert('Failed to submit: ' + (error.response?.data?.message || error.message));
    }
}

// Load citizen's requests
async function loadMyRequests() {
    try {
        const response = await axios.get(`${API_URL}/requests/my-requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const requests = response.data.requests;
        const container = document.getElementById('requests-list');
        
        if (!requests || requests.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-500 py-8">No requests yet</div>';
            return;
        }

        container.innerHTML = requests.map(req => `
            <div class="border rounded-lg p-4 mb-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-bold">${req.title || req.category_name?.name || 'Request'}</h4>
                        <p class="text-sm text-gray-600">${req.description?.substring(0, 100)}</p>
                        <div class="flex gap-2 mt-2">
                            <span class="text-xs px-2 py-1 rounded bg-gray-200">${req.status}</span>
                            <span class="text-xs px-2 py-1 rounded bg-gray-200">${req.priority}</span>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">Ref: ${req.reference_number}</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading requests:', error);
        document.getElementById('requests-list').innerHTML = '<p class="text-red-500">Error loading requests</p>';
    }
}

// Load admin stats
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

// Load all requests for admin
async function loadAllRequests() {
    try {
        const response = await axios.get(`${API_URL}/admin/requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const requests = response.data.requests;
        const container = document.getElementById('admin-requests-list');
        
        if (!requests || requests.length === 0) {
            container.innerHTML = '<p class="text-center">No requests found</p>';
            return;
        }

        container.innerHTML = `
            <table class="min-w-full">
                <thead><tr><th>Ref</th><th>Citizen</th><th>Title</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                    ${requests.map(req => `
                        <tr>
                            <td class="border px-4 py-2">${req.reference_number}</td>
                            <td class="border px-4 py-2">${req.citizen_name}</td>
                            <td class="border px-4 py-2">${req.title || '-'}</td>
                            <td class="border px-4 py-2">
                                <select onchange="updateStatus(${req.id}, this.value)" class="border rounded px-2 py-1">
                                    <option value="open" ${req.status === 'open' ? 'selected' : ''}>Open</option>
                                    <option value="in_progress" ${req.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="resolved" ${req.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                </select>
                            </td>
                            <td class="border px-4 py-2">${new Date(req.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading all requests:', error);
    }
}

// Update request status
window.updateStatus = async function(requestId, newStatus) {
    try {
        await axios.put(`${API_URL}/admin/requests/${requestId}/status`, 
            { status: newStatus },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        alert('Status updated!');
        loadAllRequests();
        loadAdminStats();
    } catch (error) {
        alert('Failed to update status');
    }
};

// Logout
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

console.log('✅ Frontend initialized with API URL:', API_URL);
