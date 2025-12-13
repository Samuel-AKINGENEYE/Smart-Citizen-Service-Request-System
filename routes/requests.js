const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');

// Get all requests
router.get('/', requestController.getAllRequests);

// Add new request
router.post('/', requestController.createRequest);

module.exports = router;
