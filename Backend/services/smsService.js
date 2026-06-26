require('dotenv').config();
const FailedMessage = require('../models/FailedMessage');

/**
 * Sends SMS via Africa's Talking SMS Gateway
 */
async function sendSMS(toPhoneNumber, text) {
  const username = process.env.AT_USERNAME || 'sandbox';
  const apiKey = process.env.AT_API_KEY;

  console.log(`[SMS Outbound] To: ${toPhoneNumber} | Message: ${text}`);

  if (!apiKey) {
    console.log('[SMS Service] AT_API_KEY missing. Running in MOCK Mode.');
    return { success: true, mock: true };
  }

  try {
    const url = username === 'sandbox' 
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging';

    const params = new URLSearchParams();
    params.append('username', username);
    params.append('to', toPhoneNumber);
    params.append('message', text);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey
      },
      body: params
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`[SMS Outbound] ❌ SEND FAILED — HTTP ${response.status}`);
      try {
        await FailedMessage.create({
          phone_number: toPhoneNumber,
          message_text: text,
          error_code: String(response.status),
          error_message: JSON.stringify(data) || 'SMS API Error',
          channel: 'sms',
          message_type: 'reply'
        });
      } catch (dbErr) {
        console.error('❌ Failed to log failed SMS message in DB:', dbErr.message);
      }
    }
    return { success: response.ok, data };
  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', error);
    try {
      await FailedMessage.create({
        phone_number: toPhoneNumber,
        message_text: text,
        error_code: 'NETWORK_ERROR',
        error_message: error.message,
        channel: 'sms',
        message_type: 'reply'
      });
    } catch (dbErr) {
      console.error('❌ Failed to log failed SMS message in DB:', dbErr.message);
    }
    return { success: false, error };
  }
}

module.exports = {
  sendSMS
};
