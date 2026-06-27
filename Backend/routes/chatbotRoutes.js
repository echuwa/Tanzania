const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// WhatsApp Webhook GET (verification) and POST (messages)
router.get('/webhooks/whatsapp', chatbotController.handleWhatsAppWebhook);
router.post('/webhooks/whatsapp', chatbotController.handleWhatsAppWebhook);

// Telegram Webhook POST
router.post('/webhooks/telegram', chatbotController.handleTelegramWebhook);

// Africa's Talking SMS Webhook POST
router.post('/webhooks/sms', chatbotController.handleSMSWebhook);

// Africa's Talking USSD Webhook POST
router.post('/webhooks/ussd', chatbotController.handleUSSDWebhook);

// Mock chat endpoint for testing from admin dashboard
router.post('/mock-chat', chatbotController.handleMockWebchat);

module.exports = router;
