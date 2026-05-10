const API_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('token');
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    if (authToken) {
        loadUserData();
    } else {
        showLogin();
    }
});

// Load categories for dropdown
async function loadCategories() {
    try {
        const response = await axios.get(`${API_URL}/categories`);
        const categories = response.data.categories;
        const select = document.getElementById('req-category');
        if (select) {
            select.innerHTML = '<option value="">Select Category</option>' +
                categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
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

// Show register form
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
            alert(`Registration successful! Your OTP is: ${response.data.otp}\nPlease use this to verify your account.`);
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
        addAdminFeatures(); // Add search/filter/export
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
            alert(`✅ Request submitted!\n📋 Reference: ${response.data.reference_number}\n📎 Attachments: ${response.data.attachments}`);
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

// Load citizen's requests with cancel and rate buttons
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
            <div class="border rounded-lg p-4 card-hover mb-4">
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
                        </div>
                    </div>
                    <div class="flex flex-col space-y-2">
                        ${req.status === 'open' ? `
                            <button onclick="cancelRequest(${req.id})" class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">
                                <i class="fas fa-times"></i> Cancel
                            </button>
                        ` : ''}
                        ${req.status === 'resolved' ? `
                            <button onclick="showRatingModal(${req.id}, '${req.reference_number}')" class="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600">
                                <i class="fas fa-star"></i> Rate
                            </button>
                        ` : ''}
                        <button onclick="viewRequestDetail(${req.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) { 
        console.error('Error loading requests:', error);
    }
}

// SCRS-014: Cancel request
window.cancelRequest = async function(requestId) {
    if (!confirm('Are you sure you want to cancel this request? This action cannot be undone.')) return;
    
    try {
        const response = await axios.put(`${API_URL}/requests/${requestId}/cancel`, {}, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        if (response.data.success) {
            alert('✅ Request cancelled successfully');
            loadMyRequests();
        }
    } catch (error) {
        alert('Failed to cancel: ' + (error.response?.data?.message || error.message));
    }
};

// SCRS-015: Show rating modal
window.showRatingModal = async function(requestId, referenceNumber) {
    const rating = prompt(`Rate request ${referenceNumber} (1-5 stars):\n1 - Very Poor\n2 - Poor\n3 - Average\n4 - Good\n5 - Excellent`);
    if (rating && rating >= 1 && rating <= 5) {
        const review = prompt('Leave a review (optional):');
        try {
            const response = await axios.post(`${API_URL}/requests/${requestId}/rate`, 
                { rating: parseInt(rating), review: review },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            alert('✅ ' + response.data.message);
            loadMyRequests();
        } catch (error) {
            alert('Failed to submit rating: ' + (error.response?.data?.message || error.message));
        }
    }
};

// SCRS-021: Add admin features (search, filter, export)
function addAdminFeatures() {
    const adminPanel = document.querySelector('#admin-requests-list');
    if (!adminPanel || document.querySelector('#admin-search-panel')) return;
    
    const searchPanel = document.createElement('div');
    searchPanel.id = 'admin-search-panel';
    searchPanel.className = 'bg-gray-50 p-4 rounded-lg mb-4';
    searchPanel.innerHTML = `
        <h4 class="font-bold mb-3 text-lg">🔍 Search & Filters</h4>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <input type="text" id="search-text" placeholder="Search by ref, title, citizen..." class="px-3 py-2 border rounded text-sm">
            <select id="search-status" class="px-3 py-2 border rounded text-sm">
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
            </select>
            <select id="search-priority" class="px-3 py-2 border rounded text-sm">
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
            </select>
            <button id="export-csv-btn" class="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700">
                <i class="fas fa-download"></i> Export CSV
            </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <input type="date" id="search-date-from" class="px-3 py-2 border rounded text-sm" placeholder="From Date">
            <input type="date" id="search-date-to" class="px-3 py-2 border rounded text-sm" placeholder="To Date">
        </div>
        <div class="flex gap-2">
            <button id="search-btn" class="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                <i class="fas fa-search"></i> Search
            </button>
            <button id="reset-search-btn" class="bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600">
                <i class="fas fa-undo"></i> Reset
            </button>
        </div>
    `;
    
    adminPanel.parentNode.insertBefore(searchPanel, adminPanel);
    
    document.getElementById('search-btn')?.addEventListener('click', searchRequests);
    document.getElementById('reset-search-btn')?.addEventListener('click', resetSearch);
    document.getElementById('export-csv-btn')?.addEventListener('click', exportToCSV);
}

// Search requests
window.searchRequests = async function() {
    const search = document.getElementById('search-text')?.value;
    const status = document.getElementById('search-status')?.value;
    const priority = document.getElementById('search-priority')?.value;
    const date_from = document.getElementById('search-date-from')?.value;
    const date_to = document.getElementById('search-date-to')?.value;
    
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    if (date_from) params.append('date_from', date_from);
    if (date_to) params.append('date_to', date_to);
    
    try {
        const response = await axios.get(`${API_URL}/admin/requests/search?${params.toString()}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        displaySearchResults(response.data.requests);
    } catch (error) {
        alert('Search failed: ' + error.message);
    }
};

// Display search results
function displaySearchResults(requests) {
    const container = document.getElementById('admin-requests-list');
    if (!requests || requests.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No requests found</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Citizen</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(req => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 text-sm font-mono">${req.reference_number}</td>
                            <td class="px-4 py-3 text-sm">${req.citizen_name}</td>
                            <td class="px-4 py-3 text-sm max-w-xs truncate">${req.title || '-'}</td>
                            <td class="px-4 py-3">
                                <select onchange="updateStatus(${req.id}, this.value)" class="text-sm border rounded px-2 py-1">
                                    <option value="open" ${req.status === 'open' ? 'selected' : ''}>Open</option>
                                    <option value="in_progress" ${req.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                                    <option value="resolved" ${req.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                                    <option value="rejected" ${req.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                                </select>
                            </td>
                            <td class="px-4 py-3">
                                <select onchange="updatePriority(${req.id}, this.value)" class="text-sm border rounded px-2 py-1">
                                    <option value="low" ${req.priority === 'low' ? 'selected' : ''}>Low</option>
                                    <option value="medium" ${req.priority === 'medium' ? 'selected' : ''}>Medium</option>
                                    <option value="high" ${req.priority === 'high' ? 'selected' : ''}>High</option>
                                    <option value="urgent" ${req.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
                                </select>
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
}

// Reset search
window.resetSearch = async function() {
    if (document.getElementById('search-text')) document.getElementById('search-text').value = '';
    if (document.getElementById('search-status')) document.getElementById('search-status').value = '';
    if (document.getElementById('search-priority')) document.getElementById('search-priority').value = '';
    if (document.getElementById('search-date-from')) document.getElementById('search-date-from').value = '';
    if (document.getElementById('search-date-to')) document.getElementById('search-date-to').value = '';
    loadAllRequests();
};

// SCRS-024: Export to CSV
window.exportToCSV = async function() {
    try {
        window.location.href = `${API_URL}/admin/export/csv?token=${authToken}`;
    } catch (error) {
        alert('Export failed: ' + error.message);
    }
};

// Update priority
window.updatePriority = async function(requestId, newPriority) {
    try {
        const response = await axios.put(`${API_URL}/admin/requests/${requestId}/priority`,
            { priority: newPriority },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        alert('✅ ' + response.data.message);
        loadAllRequests();
        loadAdminStats();
    } catch (error) {
        alert('Failed to update priority: ' + (error.response?.data?.message || error.message));
    }
};

// Load all requests for admin
async function loadAllRequests() {
    try {
        const response = await axios.get(`${API_URL}/admin/requests`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        displaySearchResults(response.data.requests);
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

// Load admin statistics
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

// Update request status
window.updateStatus = async function(requestId, newStatus) {
    try {
        await axios.put(`${API_URL}/admin/requests/${requestId}/status`, 
            { status: newStatus },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        alert('Status updated successfully!');
        loadAllRequests();
        loadAdminStats();
    } catch (error) {
        alert('Failed to update status: ' + (error.response?.data?.message || error.message));
    }
};

// View request detail with attachments
window.viewRequestDetail = async function(requestId) {
    try {
        const response = await axios.get(`${API_URL}/requests/${requestId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const request = response.data.request;
        const attachmentsResp = await axios.get(`${API_URL}/requests/${requestId}/attachments`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const attachments = attachmentsResp.data.attachments;
        
        let modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onclick="this.remove()">
                <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6" onclick="event.stopPropagation()">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold">Request Details</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    <div class="space-y-4 max-h-96 overflow-y-auto">
                        <div><strong>Reference:</strong> ${request.reference_number}</div>
                        <div><strong>Title:</strong> ${request.title}</div>
                        <div><strong>Description:</strong> ${request.description}</div>
                        <div><strong>Category:</strong> ${request.category_name}</div>
                        <div><strong>Status:</strong> <span class="px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}">${request.status}</span></div>
                        <div><strong>Priority:</strong> <span class="px-2 py-1 text-xs rounded-full ${getPriorityColor(request.priority)}">${request.priority}</span></div>
                        ${request.location_address ? `<div><strong>Location:</strong> ${request.location_address}</div>` : ''}
                        ${attachments && attachments.length > 0 ? `
                            <div>
                                <strong>Photos:</strong>
                                <div class="flex gap-2 flex-wrap mt-2">
                                    ${attachments.map(att => `
                                        <a href="http://localhost:3000${att.file_url}" target="_blank">
                                            <img src="http://localhost:3000${att.file_url}" class="w-32 h-32 object-cover rounded-lg border hover:shadow-lg transition">
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
        alert('Error loading details: ' + error.message);
    }
};

// Helper functions
function getStatusColor(status) {
    const colors = {
        'open': 'bg-yellow-100 text-yellow-800',
        'in_progress': 'bg-blue-100 text-blue-800',
        'resolved': 'bg-green-100 text-green-800',
        'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityColor(priority) {
    const colors = {
        'low': 'bg-gray-100 text-gray-800',
        'medium': 'bg-blue-100 text-blue-800',
        'high': 'bg-orange-100 text-orange-800',
        'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
}

// Logout
function logout() {
    localStorage.clear();
    authToken = null;
    currentUser = null;
    showLogin();
    alert('Logged out successfully');
}

// Make functions global
window.showLogin = showLogin;
window.showRegister = showRegister;
window.login = login;
window.register = register;
window.submitRequest = submitRequest;
window.logout = logout;
window.updateStatus = updateStatus;
window.updatePriority = updatePriority;
window.cancelRequest = cancelRequest;
window.showRatingModal = showRatingModal;
window.searchRequests = searchRequests;
window.resetSearch = resetSearch;
window.exportToCSV = exportToCSV;
window.viewRequestDetail = viewRequestDetail;

// Update submitRequest to handle anonymous
const originalSubmit = window.submitRequest;
window.submitRequest = async function(event) {
    event.preventDefault();
    const category_id = document.getElementById('req-category').value;
    const title = document.getElementById('req-title').value;
    const description = document.getElementById('req-description').value;
    const location_address = document.getElementById('req-location').value;
    const priority = document.getElementById('req-priority').value;
    const is_anonymous = document.getElementById('req-anonymous')?.checked ? 1 : 0;

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
    formData.append('is_anonymous', is_anonymous);

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
            alert(`✅ Request submitted ${is_anonymous ? 'anonymously' : ''}!\n📋 Reference: ${response.data.reference_number}\n📎 Attachments: ${response.data.attachments}`);
            document.getElementById('req-title').value = '';
            document.getElementById('req-description').value = '';
            document.getElementById('req-location').value = '';
            document.getElementById('req-photos').value = '';
            document.getElementById('image-preview').innerHTML = '';
            if (document.getElementById('req-anonymous')) {
                document.getElementById('req-anonymous').checked = false;
            }
            loadMyRequests();
        }
    } catch (error) {
        alert('Failed to submit: ' + (error.response?.data?.message || error.message));
    }
};

// Override loadUserData to include notifications and analytics
const originalLoadUserData = window.loadUserData;
window.loadUserData = async function() {
    await originalLoadUserData();
    
    // Start notification polling
    if (typeof startNotificationPolling === 'function') {
        startNotificationPolling();
        loadNotifications();
    }
    
    // Add analytics tab for admin
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'department_admin') {
        if (typeof addAnalyticsTab === 'function') {
            addAnalyticsTab();
        }
    }
};

// Override loadUserData to add location picker and heatmap
const finalLoadUserData = window.loadUserData;
window.loadUserData = async function() {
    await finalLoadUserData();
    
    // Add location picker for citizens
    if (currentUser?.role === 'citizen') {
        if (typeof addLocationPicker === 'function') {
            setTimeout(addLocationPicker, 500);
        }
    }
    
    // Add heatmap tab for admins
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'department_admin') {
        if (typeof addHeatmapTab === 'function') {
            setTimeout(addHeatmapTab, 500);
        }
    }
};

// Final submit request with location picker
window.submitRequest = async function(event) {
    event.preventDefault();
    const category_id = document.getElementById('req-category').value;
    const title = document.getElementById('req-title').value;
    const description = document.getElementById('req-description').value;
    const location_address = document.getElementById('location-address')?.value || document.getElementById('req-location')?.value || '';
    const priority = document.getElementById('req-priority').value;
    const is_anonymous = document.getElementById('req-anonymous')?.checked ? 1 : 0;
    const location_lat = document.getElementById('location-lat')?.value || null;
    const location_lng = document.getElementById('location-lng')?.value || null;

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
    formData.append('is_anonymous', is_anonymous);
    if (location_lat) formData.append('location_lat', location_lat);
    if (location_lng) formData.append('location_lng', location_lng);

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
            alert(`✅ Request submitted ${is_anonymous ? 'anonymously' : ''}!\n📋 Reference: ${response.data.reference_number}\n📎 Attachments: ${response.data.attachments}`);
            document.getElementById('req-title').value = '';
            document.getElementById('req-description').value = '';
            document.getElementById('location-address').value = '';
            if (document.getElementById('req-location')) document.getElementById('req-location').value = '';
            document.getElementById('req-photos').value = '';
            document.getElementById('image-preview').innerHTML = '';
            if (document.getElementById('req-anonymous')) {
                document.getElementById('req-anonymous').checked = false;
            }
            if (window.marker) {
                window.marker.setLatLng([-1.9441, 30.0619]);
                if (window.map) window.map.setView([-1.9441, 30.0619], 13);
            }
            loadMyRequests();
        }
    } catch (error) {
        alert('Failed to submit: ' + (error.response?.data?.message || error.message));
    }
};
