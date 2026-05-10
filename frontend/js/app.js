const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('token');
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupImagePreview();
    if (authToken) loadUserData(); else showLogin();
});

function setupImagePreview() {
    const fileInput = document.getElementById('req-photos');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = '';
            const files = Array.from(e.target.files);
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const div = document.createElement('div');
                    div.className = 'image-preview';
                    div.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <div class="remove-image" onclick="removeImage(${index})">×</div>
                    `;
                    preview.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
        });
    }
}

window.removeImage = (index) => {
    const dt = new DataTransfer();
    const files = Array.from(document.getElementById('req-photos').files);
    files.splice(index, 1);
    files.forEach(file => dt.items.add(file));
    document.getElementById('req-photos').files = dt.files;
    setupImagePreview();
};

async function loadCategories() {
    try {
        const response = await axios.get(`${API_URL}/categories`);
        const select = document.getElementById('req-category');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' +
                response.data.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
    } catch (error) { console.error(error); }
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
            alert(`Registration successful! OTP: ${response.data.otp}\nPlease verify your account.`);
            showLogin();
        }
    } catch (error) {
        alert('Registration failed: ' + (error.response?.data?.message || error.message));
    }
}

async function login(event) {
    event.preventDefault();
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value
        });
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

async function loadUserData() {
    const storedUser = localStorage.getItem('user');
    if (storedUser) currentUser = JSON.parse(storedUser);
    
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
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        if (response.data.success) {
            alert(`Request submitted! Reference: ${response.data.reference_number}\nAttachments: ${response.data.attachments}`);
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
            <div class="border rounded-lg p-4 card-hover">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(req.status)}">${req.status}</span>
                            <span class="px-2 py-1 text-xs rounded-full ${getPriorityColor(req.priority)}">${req.priority}</span>
                        </div>
                        <h4 class="font-bold text-lg">${req.title || req.category_name}</h4>
                        <p class="text-gray-600 text-sm mt-1">${req.description?.substring(0, 150)}...</p>
                        <div class="flex items-center space-x-4 mt-2">
                            <span class="text-xs text-gray-500"><i class="fas fa-hashtag"></i> ${req.reference_number}</span>
                            <span class="text-xs text-gray-500"><i class="far fa-calendar-alt"></i> ${new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) { console.error(error); }
}

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
    } catch (error) { console.error(error); }
}

async function loadAllRequests() {
    try {
        const response = await axios.get(`${API_URL}/admin/requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const requests = response.data.requests;
        const container = document.getElementById('admin-requests-list');
        if (!requests || requests.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">No requests found</p>';
            return;
        }
        container.innerHTML = `
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citizen</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th><th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr>
                </thead>
                <tbody>
                    ${requests.map(req => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm">${req.reference_number}</td>
                            <td class="px-4 py-3 text-sm">${req.citizen_name}</td>
                            <td class="px-4 py-3 text-sm">${req.category_name}</td>
                            <td class="px-4 py-3 text-sm">${req.title || '-'}</td>
                            <td class="px-4 py-3"><select onchange="updateStatus(${req.id}, this.value)" class="text-sm border rounded px-2 py-1"><option value="open" ${req.status === 'open' ? 'selected' : ''}>Open</option><option value="in_progress" ${req.status === 'in_progress' ? 'selected' : ''}>In Progress</option><option value="resolved" ${req.status === 'resolved' ? 'selected' : ''}>Resolved</option><option value="rejected" ${req.status === 'rejected' ? 'selected' : ''}>Rejected</option></select></td>
                            <td class="px-4 py-3"><span class="px-2 py-1 text-xs rounded-full ${getPriorityColor(req.priority)}">${req.priority}</span></td>
                            <td class="px-4 py-3 text-sm">${new Date(req.created_at).toLocaleDateString()}</td>
                            <td class="px-4 py-3"><button onclick="viewRequest(${req.id})" class="text-blue-600 hover:text-blue-800"><i class="fas fa-eye"></i> View</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) { console.error(error); }
}

async function updateStatus(requestId, newStatus) {
    try {
        await axios.put(`${API_URL}/admin/requests/${requestId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${authToken}` } });
        alert('Status updated!');
        loadAllRequests();
        loadAdminStats();
    } catch (error) { alert('Failed: ' + (error.response?.data?.message)); }
}

function viewRequest(requestId) { alert(`📋 Request #${requestId}\nFull details coming soon!`); }

function getStatusColor(status) {
    const colors = { 'open': 'bg-yellow-100 text-yellow-800', 'in_progress': 'bg-blue-100 text-blue-800', 'resolved': 'bg-green-100 text-green-800', 'rejected': 'bg-red-100 text-red-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority) {
    const colors = { 'low': 'bg-gray-100 text-gray-800', 'medium': 'bg-blue-100 text-blue-800', 'high': 'bg-orange-100 text-orange-800', 'urgent': 'bg-red-100 text-red-800' };
    return colors[priority] || 'bg-gray-100 text-gray-800';
}

function logout() {
    localStorage.clear();
    authToken = null;
    currentUser = null;
    showLogin();
    alert('Logged out');
}

window.showLogin = showLogin; window.showRegister = showRegister; window.login = login; window.register = register;
window.submitRequest = submitRequest; window.logout = logout; window.updateStatus = updateStatus; window.viewRequest = viewRequest;
window.removeImage = removeImage;

// Override the submitRequest function with better error handling
window.submitRequest = async function(event) {
    event.preventDefault();
    
    // Validate required fields
    const category = document.getElementById('req-category').value;
    const title = document.getElementById('req-title').value;
    const description = document.getElementById('req-description').value;
    
    if (!category) {
        alert('Please select a category');
        return;
    }
    
    if (!title) {
        alert('Please enter a title');
        return;
    }
    
    if (!description) {
        alert('Please enter a description');
        return;
    }
    
    const formData = new FormData();
    formData.append('category_id', category);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('location_address', document.getElementById('req-location').value);
    formData.append('priority', document.getElementById('req-priority').value);
    
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
            alert(`✅ Request submitted!\n📋 Reference: ${response.data.reference_number}\n📎 Attachments: ${response.data.attachments}`);
            // Clear form
            document.getElementById('req-title').value = '';
            document.getElementById('req-description').value = '';
            document.getElementById('req-location').value = '';
            document.getElementById('req-photos').value = '';
            document.getElementById('image-preview').innerHTML = '';
            // Reload requests
            loadMyRequests();
        }
    } catch (error) {
        console.error('Submit error:', error);
        const errorMsg = error.response?.data?.message || error.message;
        alert(`❌ Failed to submit request: ${errorMsg}`);
    }
};

// Function to load and display attachments for a request
async function loadAttachments(requestId) {
    try {
        const response = await axios.get(`${API_URL}/requests/${requestId}/attachments`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        return response.data.attachments;
    } catch (error) {
        console.error('Error loading attachments:', error);
        return [];
    }
}

// Override the loadMyRequests function to show photos
const originalLoadMyRequests = window.loadMyRequests;
window.loadMyRequests = async function() {
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
        
        // Load attachments for each request
        for (let req of requests) {
            const attachments = await loadAttachments(req.id);
            req.attachments = attachments;
        }
        
        container.innerHTML = requests.map(req => `
            <div class="border rounded-lg p-4 card-hover">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-2 mb-2">
                            <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(req.status)}">${req.status}</span>
                            <span class="px-2 py-1 text-xs rounded-full ${getPriorityColor(req.priority)}">${req.priority}</span>
                        </div>
                        <h4 class="font-bold text-lg">${req.title || req.category_name}</h4>
                        <p class="text-gray-600 text-sm mt-1">${req.description?.substring(0, 150)}${req.description?.length > 150 ? '...' : ''}</p>
                        <div class="flex items-center space-x-4 mt-2">
                            <span class="text-xs text-gray-500"><i class="fas fa-hashtag"></i> ${req.reference_number}</span>
                            <span class="text-xs text-gray-500"><i class="far fa-calendar-alt"></i> ${new Date(req.created_at).toLocaleDateString()}</span>
                            ${req.location_address ? `<span class="text-xs text-gray-500"><i class="fas fa-map-marker-alt"></i> ${req.location_address}</span>` : ''}
                            ${req.attachments && req.attachments.length > 0 ? `<span class="text-xs text-blue-500"><i class="fas fa-image"></i> ${req.attachments.length} photo(s)</span>` : ''}
                        </div>
                        ${req.attachments && req.attachments.length > 0 ? `
                            <div class="mt-3 flex gap-2 flex-wrap">
                                ${req.attachments.map(att => `
                                    <a href="http://localhost:3000${att.file_url}" target="_blank" class="inline-block">
                                        <img src="http://localhost:3000${att.file_url}" alt="Attachment" class="w-16 h-16 object-cover rounded border hover:shadow-lg transition">
                                    </a>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) { 
        console.error('Error loading requests:', error);
    }
};

// Also update admin view to show photos
const originalLoadAllRequests = window.loadAllRequests;
window.loadAllRequests = async function() {
    try {
        const response = await axios.get(`${API_URL}/admin/requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const requests = response.data.requests;
        const container = document.getElementById('admin-requests-list');
        
        if (!requests || requests.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500 py-8">No requests found</p>';
            return;
        }
        
        // Load attachments for each request
        for (let req of requests) {
            const attachments = await loadAttachments(req.id);
            req.hasPhotos = attachments && attachments.length > 0;
        }
        
        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citizen</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photos</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${requests.map(req => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-4 py-3 text-sm font-mono">${req.reference_number}</td>
                                <td class="px-4 py-3 text-sm">${req.citizen_name}</td>
                                <td class="px-4 py-3 text-sm">${req.category_name}</td>
                                <td class="px-4 py-3 text-sm max-w-xs truncate">${req.title || '-'}</td>
                                <td class="px-4 py-3 text-sm">
                                    ${req.hasPhotos ? '<i class="fas fa-image text-blue-500"></i> Yes' : '<i class="fas fa-image text-gray-300"></i> No'}
                                </td>
                                <td class="px-4 py-3">
                                    <select onchange="updateStatus(${req.id}, this.value)" class="text-sm border rounded px-2 py-1">
                                        <option value="open" ${req.status === 'open' ? 'selected' : ''}>Open</option>
                                        <option value="in_progress" ${req.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                        <option value="resolved" ${req.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                        <option value="rejected" ${req.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                    </select>
                                </td>
                                <td class="px-4 py-3">
                                    <span class="px-2 py-1 text-xs rounded-full ${getPriorityColor(req.priority)}">${req.priority}</span>
                                </td>
                                <td class="px-4 py-3 text-sm">${new Date(req.created_at).toLocaleDateString()}</td>
                                <td class="px-4 py-3">
                                    <button onclick="viewRequestDetail(${req.id})" class="text-blue-600 hover:text-blue-800">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (error) { 
        console.error('Error loading all requests:', error);
    }
};

// View request detail with full photos
window.viewRequestDetail = async function(requestId) {
    try {
        const response = await axios.get(`${API_URL}/requests/${requestId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const request = response.data.request;
        const attachments = await loadAttachments(requestId);
        
        let modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="this.remove()">
                <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold">Request Details</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div><label class="font-semibold">Reference:</label> ${request.reference_number}</div>
                        <div><label class="font-semibold">Title:</label> ${request.title}</div>
                        <div><label class="font-semibold">Description:</label> ${request.description}</div>
                        <div><label class="font-semibold">Category:</label> ${request.category_name}</div>
                        <div><label class="font-semibold">Status:</label> <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}">${request.status}</span></div>
                        <div><label class="font-semibold">Priority:</label> <span class="px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}">${request.priority}</span></div>
                        ${request.location_address ? `<div><label class="font-semibold">Location:</label> ${request.location_address}</div>` : ''}
                        ${attachments && attachments.length > 0 ? `
                            <div>
                                <label class="font-semibold block mb-2">Photos:</label>
                                <div class="flex gap-2 flex-wrap">
                                    ${attachments.map(att => `
                                        <a href="http://localhost:3000${att.file_url}" target="_blank">
                                            <img src="http://localhost:3000${att.file_url}" alt="Photo" class="w-32 h-32 object-cover rounded-lg border hover:shadow-lg transition">
                                        </a>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="mt-6 flex justify-end">
                        <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Close</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        alert('Error loading request details: ' + error.message);
    }
};

console.log('✅ Frontend updated with photo viewing capability!');
