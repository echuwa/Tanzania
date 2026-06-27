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

// Users (students) — Standard sub-admin only
router.get('/users', verifyToken, isAdmin, isAdminOnly, adminController.getUsers);

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

// Analytics
router.get('/analytics', verifyToken, isAdmin, adminController.getAnalytics);

// Broadcast — Send WhatsApp message to all users (Standard sub-admin only)
router.post('/broadcast', verifyToken, isAdmin, isAdminOnly, adminController.broadcastMessage);

// Failed Messages Log (Standard sub-admin only)
router.get('/failed-messages', verifyToken, isAdmin, isAdminOnly, adminController.getFailedMessages);

// Delete Chat Log (Standard sub-admin only)
router.delete('/chat-logs/:id', verifyToken, isAdmin, isAdminOnly, adminController.deleteChatLog);

// Admin Management — Super admin only
router.get('/admins', verifyToken, isAdmin, isSuperAdminOnly, adminController.getAdmins);
router.post('/admins', verifyToken, isAdmin, isSuperAdminOnly, adminController.createAdmin);
router.delete('/admins/:id', verifyToken, isAdmin, isSuperAdminOnly, adminController.deleteAdmin);

// Admin Profile — self-update (name, email, phone, password)
router.put('/profile', verifyToken, isAdmin, adminController.updateProfile);

module.exports = router;
