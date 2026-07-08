const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin, isSuperAdminOnly, isAdminOnly } = require('../middleware/auth');

// ── PUBLIC ROUTES (no token required) ─────────────────────────
// Admin Login
router.post('/login', adminController.login);

// Google Sign-In Login
router.post('/google-login', adminController.googleLogin);

// Forgot Password — sends reset email to admin
router.post('/forgot-password', adminController.forgotPassword);

// Reset Password — validates token and sets new password
router.post('/reset-password/:token', adminController.resetPassword);

// Verify Invitation — set password and activate account
router.post('/verify-invite', adminController.verifyInvite);

// ── PROTECTED ROUTES (valid JWT + Admin/SuperAdmin role required) ──

// Dashboard Stats
router.get('/stats', verifyToken, isAdmin, adminController.getStats);

// Users (students) — Viewable and manageable by both admins
router.get('/users', verifyToken, isAdmin, adminController.getUsers);
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);
router.post('/users/:id/reset-points', verifyToken, isAdmin, adminController.resetUserPoints);

// Quiz / Module Management — Super admin only
router.get('/quizzes', verifyToken, isAdmin, isSuperAdminOnly, adminController.getQuizzes);
router.post('/modules', verifyToken, isAdmin, isSuperAdminOnly, adminController.createModule);
router.delete('/modules/:id', verifyToken, isAdmin, isSuperAdminOnly, adminController.deleteModule);
router.post('/questions', verifyToken, isAdmin, isSuperAdminOnly, adminController.createQuestion);
router.delete('/questions/:id', verifyToken, isAdmin, isSuperAdminOnly, adminController.deleteQuestion);

// Daily Stories Management — Super admin only
router.get('/stories', verifyToken, isAdmin, isSuperAdminOnly, adminController.getStories);
router.post('/stories', verifyToken, isAdmin, isSuperAdminOnly, adminController.createStory);
router.put('/stories/:id', verifyToken, isAdmin, isSuperAdminOnly, adminController.updateStory);
router.delete('/stories/:id', verifyToken, isAdmin, isSuperAdminOnly, adminController.deleteStory);

// Analytics — old chart-based (kept for backward compat)
router.get('/analytics', verifyToken, isAdmin, adminController.getAnalytics);

// System Analytics — new real-data dashboard
router.get('/system-analytics', verifyToken, isAdmin, adminController.getSystemAnalytics);

// Broadcast — Send WhatsApp/SMS message to all users
router.post('/broadcast', verifyToken, isAdmin, adminController.broadcastMessage);

// Broadcast Jobs — list and delete
router.get('/broadcast-jobs', verifyToken, isAdmin, adminController.getBroadcastJobs);
router.delete('/broadcast-jobs/:id', verifyToken, isAdmin, adminController.deleteBroadcastJob);

// Failed Messages Log
router.get('/failed-messages', verifyToken, isAdmin, adminController.getFailedMessages);
router.delete('/failed-messages/:id', verifyToken, isAdmin, adminController.deleteFailedMessage);

// Chat Logs
router.get('/chat-logs', verifyToken, isAdmin, adminController.getChatLogs);
router.delete('/chat-logs/:id', verifyToken, isAdmin, adminController.deleteChatLog);
router.get('/chat-logs/user/:userId', verifyToken, isAdmin, adminController.getUserChatHistory);
router.get('/live-chats', verifyToken, isAdmin, adminController.getLiveChatsStream);

// Admin Management — Super admin only
router.get('/admins', verifyToken, isAdmin, isSuperAdminOnly, adminController.getAdmins);
router.post('/admins', verifyToken, isAdmin, isSuperAdminOnly, adminController.createAdmin);
router.delete('/admins/:id', verifyToken, isAdmin, isSuperAdminOnly, adminController.deleteAdmin);

// Admin Profile — self-update (name, email, phone, password)
router.put('/profile', verifyToken, isAdmin, adminController.updateProfile);

// System Settings — Viewable by admins, editable by superadmins only
router.get('/settings', verifyToken, isAdmin, adminController.getSettings);
router.put('/settings', verifyToken, isAdmin, isSuperAdminOnly, adminController.updateSettings);

module.exports = router;
