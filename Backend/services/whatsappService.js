require('dotenv').config();

/**
 * Sends a message via WhatsApp Business Cloud API
 */
async function sendWhatsAppMessage(toPhoneNumber, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  console.log(`[WhatsApp Outbound] To: ${toPhoneNumber} | Message: ${text}`);

  if (!token || !phoneNumberId) {
    console.log('[WhatsApp Service] Credentials missing. Running in MOCK Mode.');
    return { success: true, mock: true };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhoneNumber,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      })
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (error) {
    console.error('[WhatsApp Service] Error sending message:', error);
    return { success: false, error };
  }
}

module.exports = {
  sendWhatsAppMessage
};
