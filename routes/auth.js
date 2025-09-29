const express = require('express');
const router = express.Router();


const { registerUser, loginUser, logoutUser, getCurrentUser, updateUserPlan, resetPasswordWithToken ,googleAuth} = require('../controllers/authController');

const { authenticateUser } = require('../middleware/auth_middleware');

// Normal auth
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Google auth
router.post('/google', googleAuth);
// router.post('/forgot-password', sendResetPasswordLink);
// router.post('/reset-password', resetPassword);

// Protected route
router.get('/me', authenticateUser, getCurrentUser);
router.patch('/plan', authenticateUser, updateUserPlan);
router.put('/password', resetPasswordWithToken);

module.exports = router;
