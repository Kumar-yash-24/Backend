const express = require('express');
const router = express.Router();

const { generateGeminiResponse } = require('../controllers/apiCalling.Controller');
const { authenticateUser } = require('../middleware/auth_middleware');

router.post('/gemini', authenticateUser, generateGeminiResponse);

module.exports = router;
