// Use the global API URL from config
const API_URL = window.API_URL || 'https://scrs-backend.onrender.com/api';
let authToken = localStorage.getItem('token');
let currentUser = null;

console.log('🔌 Using API URL:', API_URL);

// All your existing functions remain the same, just using API_URL
// ... (paste your existing app_complete.js content here)

// Make sure all fetch/axios calls use API_URL
