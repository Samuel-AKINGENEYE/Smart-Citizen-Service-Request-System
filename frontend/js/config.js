// API Configuration - Production
// This URL is your deployed backend on Render
const PRODUCTION_API_URL = 'https://scrs-backend.onrender.com/api';

// For local development, keep localhost
const LOCAL_API_URL = 'http://localhost:3000/api';

// Automatically detect environment
const API_URL = window.location.hostname === 'localhost' 
    ? LOCAL_API_URL 
    : PRODUCTION_API_URL;

// Make it available globally
window.API_URL = API_URL;

console.log('🔧 API Configuration loaded');
console.log('📍 Environment:', window.location.hostname === 'localhost' ? 'Development' : 'Production');
console.log('🌐 API URL:', API_URL);
