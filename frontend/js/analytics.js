// Analytics Dashboard
async function loadAnalytics() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await axios.get(`${API_URL}/admin/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = response.data.analytics;
        displayAnalytics(data);
        
        // Also load SLA breaches
        loadSLABreaches();
    } catch (error) {
        console.error('Error loading analytics:', error);
    }
}

function displayAnalytics(data) {
    const analyticsContainer = document.getElementById('analytics-container');
    if (!analyticsContainer) return;
    
    analyticsContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- SLA Compliance -->
            <div class="bg-white rounded-lg shadow p-4">
                <h4 class="font-bold mb-3">SLA Compliance</h4>
                <div class="text-center">
                    <div class="text-4xl font-bold text-green-600">${data.slaCompliance.rate}%</div>
                    <p class="text-sm text-gray-600">Compliant: ${data.slaCompliance.compliant} | Breached: ${data.slaCompliance.breached}</p>
                </div>
            </div>
            
            <!-- Requests by Priority -->
            <div class="bg-white rounded-lg shadow p-4">
                <h4 class="font-bold mb-3">Requests by Priority</h4>
                ${data.byPriority.map(p => `
                    <div class="flex justify-between items-center mb-2">
                        <span class="capitalize">${p.priority}</span>
                        <span class="font-bold">${p.count}</span>
                    </div>
                `).join('')}
            </div>
            
            <!-- Category Distribution -->
            <div class="bg-white rounded-lg shadow p-4">
                <h4 class="font-bold mb-3">By Category</h4>
                ${data.byCategory.slice(0, 5).map(c => `
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm">${c.name}</span>
                        <span class="font-bold">${c.count}</span>
                    </div>
                `).join('')}
            </div>
            
            <!-- Average Resolution Time -->
            <div class="bg-white rounded-lg shadow p-4">
                <h4 class="font-bold mb-3">Avg Resolution Time (hours)</h4>
                ${data.avgResolution.slice(0, 5).map(a => `
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm">${a.name}</span>
                        <span class="font-bold">${Math.round(a.avg_hours)}h</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Monthly Trend -->
        <div class="bg-white rounded-lg shadow p-4 mt-6">
            <h4 class="font-bold mb-3">Monthly Trend (Last 6 months)</h4>
            <div class="flex items-end space-x-4 h-48">
                ${data.monthlyTrend.map(m => `
                    <div class="flex-1 text-center">
                        <div class="bg-blue-500 rounded-t" style="height: ${(m.count / Math.max(...data.monthlyTrend.map(mm => mm.count)) * 100)}px"></div>
                        <p class="text-xs mt-2">${m.month}</p>
                        <p class="text-xs font-bold">${m.count}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function loadSLABreaches() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/sla-breaches`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const breaches = response.data;
        const breachContainer = document.getElementById('sla-breaches-container');
        if (!breachContainer) return;
        
        if (breaches.breached.length === 0 && breaches.approaching_sla.length === 0) {
            breachContainer.innerHTML = '<div class="bg-green-50 text-green-800 p-4 rounded">✅ No SLA breaches or approaching deadlines</div>';
            return;
        }
        
        breachContainer.innerHTML = `
            ${breaches.breached.length > 0 ? `
                <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                    <h4 class="font-bold text-red-800">⚠️ SLA Breached (${breaches.breached.length})</h4>
                    ${breaches.breached.map(b => `
                        <div class="mt-2 text-sm">
                            <strong>${b.reference_number}</strong> - ${b.category_name}<br>
                            Overdue by: ${b.hours_passed - b.sla_hours} hours
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${breaches.approaching_sla.length > 0 ? `
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                    <h4 class="font-bold text-yellow-800">⚠️ Approaching SLA (${breaches.approaching_sla.length})</h4>
                    ${breaches.approaching_sla.map(a => `
                        <div class="mt-2 text-sm">
                            <strong>${a.reference_number}</strong> - ${a.category_name}<br>
                            ${a.percentage_used}% of SLA time used
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        `;
    } catch (error) {
        console.error('Error loading SLA breaches:', error);
    }
}

// Add analytics tab to admin dashboard
function addAnalyticsTab() {
    const adminContainer = document.querySelector('#admin-dashboard');
    if (!adminContainer || document.querySelector('#analytics-tab')) return;
    
    const tabsHtml = `
        <div class="mb-4 border-b">
            <button class="tab-button px-4 py-2 text-gray-600 hover:text-blue-600" onclick="showTab('requests')">All Requests</button>
            <button class="tab-button px-4 py-2 text-gray-600 hover:text-blue-600" onclick="showTab('analytics')">Analytics</button>
            <button class="tab-button px-4 py-2 text-gray-600 hover:text-blue-600" onclick="showTab('sla')">SLA Monitor</button>
        </div>
        <div id="requests-tab"></div>
        <div id="analytics-tab" class="hidden"></div>
        <div id="sla-tab" class="hidden"></div>
    `;
    
    // Move existing content to requests tab
    const existingContent = adminContainer.innerHTML;
    adminContainer.innerHTML = tabsHtml;
    
    document.getElementById('requests-tab').innerHTML = existingContent;
    document.getElementById('analytics-tab').innerHTML = '<div id="analytics-container"></div>';
    document.getElementById('sla-tab').innerHTML = '<div id="sla-breaches-container"></div>';
}

window.showTab = function(tab) {
    document.getElementById('requests-tab').classList.toggle('hidden', tab !== 'requests');
    document.getElementById('analytics-tab').classList.toggle('hidden', tab !== 'analytics');
    document.getElementById('sla-tab').classList.toggle('hidden', tab !== 'sla');
    
    if (tab === 'analytics') {
        loadAnalytics();
    } else if (tab === 'sla') {
        loadSLABreaches();
    }
};

console.log('✅ Analytics module loaded');
