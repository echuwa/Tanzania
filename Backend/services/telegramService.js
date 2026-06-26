require('dotenv').config();
const FailedMessage = require('../models/FailedMessage');

/**
 * Sends a message via Telegram Bot API
 */
async function sendTelegramMessage(chatId, text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  console.log(`[Telegram Outbound] To: ${chatId} | Message: ${text}`);

  if (!token) {
    console.log('[Telegram Service] TELEGRAM_BOT_TOKEN missing. Running in MOCK Mode.');
    return { success: true, mock: true };
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[Telegram Outbound] ❌ SEND FAILED — HTTP ${response.status}`);
      try {
        await FailedMessage.create({
          phone_number: chatId,
          message_text: text,
          error_code: String(data?.error_code || response.status),
          error_message: data?.description || 'Telegram API Error',
          channel: 'telegram',
          message_type: 'reply'
        });
      } catch (dbErr) {
        console.error('❌ Failed to log failed Telegram message in DB:', dbErr.message);
      }
    }
    return { success: response.ok, data };
  } catch (error) {
    console.error('[Telegram Service] Error sending message:', error);
    try {
      await FailedMessage.create({
        phone_number: chatId,
        message_text: text,
        error_code: 'NETWORK_ERROR',
        error_message: error.message,
        channel: 'telegram',
        message_type: 'reply'
      });
    } catch (dbErr) {
      console.error('❌ Failed to log failed Telegram message in DB:', dbErr.message);
    }
    return { success: false, error };
  }
}

module.exports = {
  sendTelegramMessage
};
