require('dotenv').config();

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
    return { success: response.ok, data };
  } catch (error) {
    console.error('[SMS Service] Error sending SMS:', error);
    return { success: false, error };
  }
}

module.exports = {
  sendSMS
};
