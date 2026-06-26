require('dotenv').config();

/**
 * Sends a message via WhatsApp Business Cloud API
 * Includes detailed error logging so admin knows exactly what went wrong
 */
async function sendWhatsAppMessage(toPhoneNumber, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Truncate log to avoid flooding terminal with long messages
  const preview = text.length > 80 ? text.substring(0, 80) + '...' : text;
  console.log(`[WhatsApp OUT] ➤ To: +${toPhoneNumber} | "${preview}"`);

  if (!token || !phoneNumberId) {
    console.warn('[WhatsApp Service] ⚠️  Credentials missing (WHATSAPP_TOKEN or PHONE_NUMBER_ID). Running in MOCK mode.');
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

    if (response.ok) {
      console.log(`[WhatsApp OUT] ✅ Delivered! Message ID: ${data?.messages?.[0]?.id}`);
      return { success: true, data };
    } else {
      // ── Detailed error logging ──────────────────────────────────
      const errCode = data?.error?.code;
      const errMsg  = data?.error?.message || 'Unknown error';
      const errData = data?.error?.error_data?.details || '';

      console.error(`[WhatsApp OUT] ❌ SEND FAILED — HTTP ${response.status}`);
      console.error(`   Code    : ${errCode}`);
      console.error(`   Message : ${errMsg}`);
      if (errData) console.error(`   Details : ${errData}`);

      // Give admin a clear hint for the most common errors
      if (errCode === 190) {
        console.error('   ⛔ ACTION NEEDED: WHATSAPP_TOKEN has EXPIRED. Go to Meta Developer Dashboard and generate a new token!');
      } else if (errCode === 131030) {
        console.error(`   ⛔ ACTION NEEDED: +${toPhoneNumber} is NOT in the allowed recipient list. Add it in Meta Dev Dashboard under "Test recipients".`);
      } else if (errCode === 100) {
        console.error('   ⛔ Bad request — check the phone number format or message body.');
      }

      return { success: false, error: data?.error };
    }
  } catch (error) {
    console.error('[WhatsApp OUT] ❌ Network/Fetch error:', error.message);
    return { success: false, error };
  }
}

module.exports = {
  sendWhatsAppMessage
};
