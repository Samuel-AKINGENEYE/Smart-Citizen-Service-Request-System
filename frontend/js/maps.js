// Leaflet maps for location picker and heatmap
let map = null;
let marker = null;
let currentLocation = { lat: -1.9441, lng: 30.0619 }; // Kigali, Rwanda

// Initialize location picker
function initLocationPicker() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        // Load Leaflet CSS and JS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
            createMap();
        };
        document.head.appendChild(script);
    } else {
        createMap();
    }
}

function createMap() {
    const mapContainer = document.getElementById('location-picker-map');
    if (!mapContainer) return;
    
    // Initialize map
    map = L.map('location-picker-map').setView([currentLocation.lat, currentLocation.lng], 13);
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add marker
    marker = L.marker([currentLocation.lat, currentLocation.lng], {
        draggable: true
    }).addTo(map);
    
    // Update location when marker is dragged
    marker.on('dragend', function(e) {
        const pos = marker.getLatLng();
        currentLocation = { lat: pos.lat, lng: pos.lng };
        updateLocationFields(pos.lat, pos.lng);
    });
    
    // Update location when map is clicked
    map.on('click', function(e) {
        const pos = e.latlng;
        currentLocation = { lat: pos.lat, lng: pos.lng };
        marker.setLatLng(pos);
        updateLocationFields(pos.lat, pos.lng);
    });
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
            currentLocation = pos;
            map.setView(pos, 15);
            marker.setLatLng(pos);
            updateLocationFields(pos.lat, pos.lng);
        }, function() {
            console.log('Geolocation failed or denied');
        });
    }
}

function updateLocationFields(lat, lng) {
    document.getElementById('location-lat').value = lat;
    document.getElementById('location-lng').value = lng;
    
    // Reverse geocoding to get address
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(response => response.json())
        .then(data => {
            if (data.display_name) {
                document.getElementById('location-address').value = data.display_name;
            }
        })
        .catch(error => console.error('Reverse geocoding error:', error));
}

// Initialize heatmap for admin
function initHeatmap() {
    if (typeof L === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
            createHeatmap();
        };
        document.head.appendChild(script);
    } else {
        createHeatmap();
    }
}

async function createHeatmap() {
    const heatmapContainer = document.getElementById('heatmap-container');
    if (!heatmapContainer) return;
    
    // Load heatmap library
    if (typeof L.heatLayer === 'undefined') {
        const heatScript = document.createElement('script');
        heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        heatScript.onload = () => {
            loadHeatmapData();
        };
        document.head.appendChild(heatScript);
    } else {
        loadHeatmapData();
    }
}

async function loadHeatmapData() {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/admin/requests`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        const requests = response.data.requests;
        
        // Filter requests with location data
        const points = requests
            .filter(r => r.location_latitude && r.location_longitude)
            .map(r => [parseFloat(r.location_latitude), parseFloat(r.location_longitude), getPriorityWeight(r.priority)]);
        
        if (points.length === 0) {
            document.getElementById('heatmap-container').innerHTML = '<p class="text-center text-gray-500 py-8">No location data available for heatmap</p>';
            return;
        }
        
        // Create map
        const map = L.map('heatmap-container').setView([points[0][0], points[0][1]], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add heat layer
        const heat = L.heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            minOpacity: 0.5
        }).addTo(map);
        
        // Add markers with popups
        requests.forEach(req => {
            if (req.location_latitude && req.location_longitude) {
                const marker = L.marker([req.location_latitude, req.location_longitude])
                    .bindPopup(`
                        <strong>${req.reference_number}</strong><br>
                        ${req.title || req.category_name}<br>
                        Status: ${req.status}<br>
                        Priority: ${req.priority}
                    `);
                marker.addTo(map);
            }
        });
        
    } catch (error) {
        console.error('Error loading heatmap data:', error);
    }
}

function getPriorityWeight(priority) {
    const weights = {
        'low': 0.3,
        'medium': 0.5,
        'high': 0.8,
        'urgent': 1.0
    };
    return weights[priority] || 0.5;
}

// Add location picker to submission form
function addLocationPicker() {
    const formContainer = document.querySelector('#citizen-dashboard .bg-white');
    if (!formContainer || document.querySelector('#location-picker-map')) return;
    
    const locationHtml = `
        <div class="mb-4">
            <label class="block text-gray-700 mb-2">Location (Pick on Map)</label>
            <div id="location-picker-map" style="height: 300px; width: 100%;" class="border rounded-lg"></div>
            <div class="grid grid-cols-2 gap-2 mt-2">
                <input type="hidden" id="location-lat" value="">
                <input type="hidden" id="location-lng" value="">
                <input type="text" id="location-address" placeholder="Address will appear here" class="col-span-2 px-3 py-2 border rounded text-sm" readonly>
            </div>
            <p class="text-xs text-gray-500 mt-1">Click on map or drag marker to set location</p>
        </div>
    `;
    
    // Insert after the location input
    const locationInput = document.getElementById('req-location');
    if (locationInput) {
        locationInput.parentElement.insertAdjacentHTML('afterend', locationHtml);
        initLocationPicker();
    }
}

// Add heatmap tab to admin dashboard
function addHeatmapTab() {
    const adminContainer = document.querySelector('#admin-dashboard');
    if (!adminContainer || document.querySelector('#heatmap-tab-btn')) return;
    
    // Add heatmap button to tabs
    const tabsContainer = document.querySelector('.border-b');
    if (tabsContainer) {
        const heatmapBtn = document.createElement('button');
        heatmapBtn.id = 'heatmap-tab-btn';
        heatmapBtn.className = 'tab-button px-4 py-2 text-gray-600 hover:text-blue-600';
        heatmapBtn.innerHTML = '📍 Heatmap';
        heatmapBtn.onclick = () => showTab('heatmap');
        tabsContainer.appendChild(heatmapBtn);
        
        // Add heatmap container
        const heatmapContainer = document.createElement('div');
        heatmapContainer.id = 'heatmap-tab';
        heatmapContainer.className = 'hidden';
        heatmapContainer.innerHTML = '<div id="heatmap-container" style="height: 500px;"></div>';
        adminContainer.appendChild(heatmapContainer);
    }
}

// Override showTab to include heatmap
const originalShowTab = window.showTab;
window.showTab = function(tab) {
    if (originalShowTab) {
        originalShowTab(tab);
    }
    
    const requestsTab = document.getElementById('requests-tab');
    const analyticsTab = document.getElementById('analytics-tab');
    const slaTab = document.getElementById('sla-tab');
    const heatmapTab = document.getElementById('heatmap-tab');
    
    if (requestsTab) requestsTab.classList.toggle('hidden', tab !== 'requests');
    if (analyticsTab) analyticsTab.classList.toggle('hidden', tab !== 'analytics');
    if (slaTab) slaTab.classList.toggle('hidden', tab !== 'sla');
    if (heatmapTab) heatmapTab.classList.toggle('hidden', tab !== 'heatmap');
    
    if (tab === 'heatmap') {
        initHeatmap();
    }
};

console.log('✅ Maps and Heatmap module loaded');
