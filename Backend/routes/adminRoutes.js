const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// ── PUBLIC ROUTES (no token required) ─────────────────────────
// Admin Login
router.post('/login', adminController.login);

// Google Sign-In Login
router.post('/google-login', adminController.googleLogin);

// Forgot Password — sends reset email to admin
router.post('/forgot-password', adminController.forgotPassword);

// Reset Password — validates token and sets new password
router.post('/reset-password/:token', adminController.resetPassword);

// ── PROTECTED ROUTES (valid JWT + Admin role required) ─────────

// Dashboard Stats
router.get('/stats', verifyToken, isAdmin, adminController.getStats);

// Users (students)
router.get('/users', verifyToken, isAdmin, adminController.getUsers);

// Quiz / Module Management
router.get('/quizzes', verifyToken, isAdmin, adminController.getQuizzes);
router.post('/modules', verifyToken, isAdmin, adminController.createModule);
router.delete('/modules/:id', verifyToken, isAdmin, adminController.deleteModule);
router.post('/questions', verifyToken, isAdmin, adminController.createQuestion);
router.delete('/questions/:id', verifyToken, isAdmin, adminController.deleteQuestion);

// Daily Stories Management
router.get('/stories', verifyToken, isAdmin, adminController.getStories);
router.post('/stories', verifyToken, isAdmin, adminController.createStory);
router.put('/stories/:id', verifyToken, isAdmin, adminController.updateStory);
router.delete('/stories/:id', verifyToken, isAdmin, adminController.deleteStory);

// Analytics
router.get('/analytics', verifyToken, isAdmin, adminController.getAnalytics);

// Broadcast — Send WhatsApp message to all users
router.post('/broadcast', verifyToken, isAdmin, adminController.broadcastMessage);

// Failed Messages Log
router.get('/failed-messages', verifyToken, isAdmin, adminController.getFailedMessages);

// Delete Chat Log
router.delete('/chat-logs/:id', verifyToken, isAdmin, adminController.deleteChatLog);

// Admin Management
router.get('/admins', verifyToken, isAdmin, adminController.getAdmins);
router.post('/admins', verifyToken, isAdmin, adminController.createAdmin);
router.delete('/admins/:id', verifyToken, isAdmin, adminController.deleteAdmin);

// Admin Profile — self-update (name, email, phone, password)
router.put('/profile', verifyToken, isAdmin, adminController.updateProfile);

module.exports = router;
