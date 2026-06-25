require('dotenv').config();

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
    return { success: response.ok, data };
  } catch (error) {
    console.error('[Telegram Service] Error sending message:', error);
    return { success: false, error };
  }
}

module.exports = {
  sendTelegramMessage
};
