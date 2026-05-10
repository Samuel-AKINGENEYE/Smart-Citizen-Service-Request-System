// Notification Center
let notificationInterval = null;

async function loadNotifications() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(`${API_URL}/notifications?limit=20`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const notifications = response.data.notifications;
        const unreadCount = notifications.filter(n => !n.is_read).length;
        
        // Update bell icon
        updateNotificationBell(unreadCount);
        
        return notifications;
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBell(count) {
    let bellContainer = document.getElementById('notification-bell');
    if (!bellContainer) {
        // Add bell icon to navbar
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            const bellHtml = `
                <div id="notification-bell" class="relative cursor-pointer" onclick="toggleNotificationPanel()">
                    <i class="fas fa-bell text-gray-600 text-xl"></i>
                    ${count > 0 ? `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1 min-w-[18px] text-center">${count > 9 ? '9+' : count}</span>` : ''}
                </div>
            `;
            userInfo.insertAdjacentHTML('afterbegin', bellHtml);
        }
    } else {
        const badge = bellContainer.querySelector('span');
        if (count > 0) {
            if (badge) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.classList.remove('hidden');
            } else {
                bellContainer.innerHTML += `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-1 min-w-[18px] text-center">${count > 9 ? '9+' : count}</span>`;
            }
        } else if (badge) {
            badge.classList.add('hidden');
        }
    }
}

async function toggleNotificationPanel() {
    let panel = document.getElementById('notification-panel');
    
    if (panel) {
        panel.remove();
        return;
    }
    
    const notifications = await loadNotifications();
    if (!notifications) return;
    
    panel = document.createElement('div');
    panel.id = 'notification-panel';
    panel.className = 'absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 border';
    panel.innerHTML = `
        <div class="p-3 border-b flex justify-between items-center">
            <h4 class="font-bold">Notifications</h4>
            ${notifications.filter(n => !n.is_read).length > 0 ? 
                `<button onclick="markAllRead()" class="text-xs text-blue-600">Mark all read</button>` : ''}
        </div>
        <div class="max-h-96 overflow-y-auto">
            ${notifications.length === 0 ? 
                '<p class="text-center text-gray-500 py-8">No notifications</p>' :
                notifications.map(n => `
                    <div class="p-3 border-b hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <p class="text-sm font-medium">${n.title || n.type}</p>
                                <p class="text-xs text-gray-600 mt-1">${n.message}</p>
                                <span class="text-xs text-gray-400">${new Date(n.created_at).toLocaleString()}</span>
                            </div>
                            ${!n.is_read ? `
                                <button onclick="markNotificationRead(${n.id})" class="text-xs text-blue-600 ml-2">
                                    Mark read
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;
    
    const bell = document.getElementById('notification-bell');
    bell.parentNode.style.position = 'relative';
    bell.parentNode.appendChild(panel);
}

async function markNotificationRead(id) {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/notifications/${id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toggleNotificationPanel();
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification read:', error);
    }
}

async function markAllRead() {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/notifications/read-all`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toggleNotificationPanel();
        loadNotifications();
    } catch (error) {
        console.error('Error marking all read:', error);
    }
}

// Start polling for notifications every 30 seconds
function startNotificationPolling() {
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        if (localStorage.getItem('token')) {
            loadNotifications();
        }
    }, 30000);
}

// Call this after login
window.startNotificationPolling = startNotificationPolling;

console.log('✅ Notification center loaded');
