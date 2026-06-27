require('dotenv').config();
const nodemailer = require('nodemailer');

// ============================================================
//  MUUNGANO WETU AI — Email Service
//  Uses Gmail via App Password (no OAuth needed for sending)
//  Set in .env:
//    GMAIL_USER=youremail@gmail.com
//    GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx   (16-char App Password)
//    FRONTEND_URL=https://your-dashboard-domain.com
// ============================================================

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null; // mock mode
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

/**
 * Send Password Reset Email to Admin
 * @param {string} toEmail  - Recipient admin email
 * @param {string} resetUrl - Full URL with token (expires in 15 min)
 * @param {string} adminName - Admin's full name for personalisation
 */
async function sendPasswordResetEmail(toEmail, resetUrl, adminName = 'Administrator') {
  const transporter = createTransporter();

  const appName = 'MUUNGANO WETU AI';
  const subject = `🔐 Password Reset Request — ${appName}`;

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
      .container { max-width: 580px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #1a6b3c, #0d4a2b); padding: 30px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 22px; }
      .header p  { color: #a8d5b5; margin: 6px 0 0; font-size: 13px; }
      .body { padding: 35px 40px; color: #333; }
      .body p  { line-height: 1.7; margin: 0 0 16px; }
      .btn-wrap { text-align: center; margin: 30px 0; }
      .btn { background: #1a6b3c; color: #fff !important; text-decoration: none; padding: 14px 36px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block; }
      .note { background: #fff8e1; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #78350f; }
      .footer { background: #f4f4f4; padding: 20px 40px; text-align: center; font-size: 12px; color: #888; }
      .flag { font-size: 24px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="flag">🇹🇿</div>
        <h1>${appName}</h1>
        <p>Admin Dashboard — Password Reset</p>
      </div>
      <div class="body">
        <p>Dear <strong>${adminName}</strong>,</p>
        <p>We received a request to reset your administrator password for the <strong>${appName}</strong> dashboard. Click the button below to create a new password:</p>
        <div class="btn-wrap">
          <a href="${resetUrl}" class="btn">🔐 Reset My Password</a>
        </div>
        <div class="note">
          ⏰ <strong>This link expires in 15 minutes.</strong> If you did not request a password reset, please ignore this email — your password will remain unchanged.
        </div>
        <p style="margin-top:24px; font-size:13px; color:#666;">
          If the button above does not work, copy and paste this URL into your browser:<br/>
          <span style="color:#1a6b3c; word-break:break-all;">${resetUrl}</span>
        </p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} MUUNGANO WETU AI — Tanzania 🇹🇿<br/>
        This is an automated security email. Do not reply.
      </div>
    </div>
  </body>
  </html>
  `;

  const textBody = `
Dear ${adminName},

You have requested a password reset for your MUUNGANO WETU AI admin account.

Reset your password here: ${resetUrl}

This link expires in 15 minutes. If you did not request this, ignore this email.

— MUUNGANO WETU AI Team 🇹🇿
  `.trim();

  if (!transporter) {
    // MOCK MODE — log to console when credentials not configured
    console.log('\n─────────────────────────────────────────────');
    console.log('[Email Service] 📧 MOCK MODE — Email not sent (credentials missing)');
    console.log(`   To      : ${toEmail}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   Reset URL: ${resetUrl}`);
    console.log('─────────────────────────────────────────────\n');
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"MUUNGANO WETU AI 🇹🇿" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody
    });
    console.log(`[Email Service] ✅ Password reset email sent to ${toEmail} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] ❌ Failed to send email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Welcome Email to newly created Admin
 */
async function sendAdminWelcomeEmail(toEmail, adminName, tempPassword) {
  const transporter = createTransporter();
  const dashboardUrl = process.env.FRONTEND_URL || 'https://your-dashboard.com';

  const subject = `🇹🇿 Welcome to MUUNGANO WETU AI — Admin Account Created`;

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
      .container { max-width: 580px; margin: auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #1a6b3c, #0d4a2b); padding: 30px; text-align: center; }
      .header h1 { color: #fff; margin: 0; font-size: 22px; }
      .body { padding: 35px 40px; color: #333; }
      .cred-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px 20px; margin: 20px 0; font-family: monospace; }
      .cred-box p { margin: 6px 0; font-size: 15px; }
      .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #7f1d1d; }
      .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #888; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🇹🇿 MUUNGANO WETU AI</h1>
      </div>
      <div class="body">
        <p>Dear <strong>${adminName}</strong>,</p>
        <p>Your administrator account for the MUUNGANO WETU AI Dashboard has been created. Here are your login credentials:</p>
        <div class="cred-box">
          <p>🌐 <strong>Dashboard URL:</strong> ${dashboardUrl}</p>
          <p>📧 <strong>Email:</strong> ${toEmail}</p>
          ${tempPassword ? `<p>🔐 <strong>Temporary Password:</strong> ${tempPassword}</p>` : ''}
        </div>
        ${tempPassword ? '<div class="warning">⚠️ <strong>Important:</strong> Please change your password immediately after logging in for the first time.</div>' : ''}
        <p style="margin-top:20px;">Welcome to the team! You are now part of the MUUNGANO WETU AI mission to educate Tanzanian youth. 🇹🇿</p>
      </div>
      <div class="footer">&copy; ${new Date().getFullYear()} MUUNGANO WETU AI — Tanzania</div>
    </div>
  </body>
  </html>
  `;

  if (!transporter) {
    console.log('[Email Service] 📧 MOCK — Welcome email not sent (credentials missing)');
    console.log(`   To: ${toEmail} | Temp PW: ${tempPassword || 'N/A'}`);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"MUUNGANO WETU AI 🇹🇿" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject,
      html: htmlBody
    });
    console.log(`[Email Service] ✅ Welcome email sent to ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] ❌ Failed to send welcome email:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send Verification / Invitation Email to newly invited Admin
 */
async function sendAdminInviteEmail(toEmail, adminName, inviteUrl) {
  const transporter = createTransporter();
  const subject = `🇹🇿 Muungano Wetu AI — Administrator Invitation`;

  const htmlBody = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <style>
      body { font-family: 'Segoe UI', Arial, sans-serif; background: #0b0f19; margin: 0; padding: 20px; color: #e2e8f0; }
      .container { max-width: 580px; margin: auto; background: #111827; border: 1px solid #1f2937; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
      .header { background: linear-gradient(135deg, #10b981, #047857); padding: 40px 30px; text-align: center; border-bottom: 1px solid #1f2937; }
      .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
      .header p { color: #a7f3d0; margin: 8px 0 0; font-size: 14px; font-weight: 500; }
      .body { padding: 40px; }
      .body p { line-height: 1.8; margin: 0 0 20px; font-size: 15px; color: #9ca3af; }
      .body strong { color: #e2e8f0; }
      .btn-wrap { text-align: center; margin: 36px 0; }
      .btn { background: #10b981; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); transition: all 0.3s ease; }
      .note { background: rgba(245, 158, 11, 0.08); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; font-size: 13.5px; color: #f59e0b; line-height: 1.6; }
      .footer { background: #0b0f19; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
      .flag { font-size: 28px; margin-bottom: 10px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="flag">🇹🇿</div>
        <h1>MUUNGANO WETU AI</h1>
        <p>Dashboard Administration Access</p>
      </div>
      <div class="body">
        <p>Dear <strong>${adminName}</strong>,</p>
        <p>You have been invited by the Super Administrator to join the **Muungano Wetu AI** administration and support team. As a Sub-Admin, you will be responsible for resolving user questions and managing chatbot feedback.</p>
        <p>To accept this invitation and complete your account registration (including setting your login password), please click the verification button below:</p>
        <div class="btn-wrap">
          <a href="${inviteUrl}" class="btn">🚀 Verify & Set Password</a>
        </div>
        <div class="note">
          ⏰ <strong>Security Notice:</strong> This invitation link will expire in 24 hours. If you did not expect this invitation, please contact your Super Administrator.
        </div>
        <p style="margin-top:28px; font-size:13px; color:#4b5563;">
          If the button above does not work, copy and paste this URL into your browser:<br/>
          <span style="color:#10b981; word-break:break-all;">${inviteUrl}</span>
        </p>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} MUUNGANO WETU AI — Tanzania 🇹🇿<br/>
        This is an automated system security email. Please do not reply.
      </div>
    </div>
  </body>
  </html>
  `;

  const textBody = `
Dear ${adminName},

You have been invited to join the MUUNGANO WETU AI administration team.

To accept this invitation and set your account password, click this link:
${inviteUrl}

This link expires in 24 hours.

— MUUNGANO WETU AI Team 🇹🇿
  `.trim();

  if (!transporter) {
    console.log('\n─────────────────────────────────────────────');
    console.log('[Email Service] 📧 MOCK MODE — Invite Email not sent (credentials missing)');
    console.log(`   To      : ${toEmail}`);
    console.log(`   Subject : ${subject}`);
    console.log(`   Invite URL: ${inviteUrl}`);
    console.log('─────────────────────────────────────────────\n');
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"MUUNGANO WETU AI 🇹🇿" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject,
      text: textBody,
      html: htmlBody
    });
    console.log(`[Email Service] ✅ Invite email sent to ${toEmail} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] ❌ Failed to send invite email to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendPasswordResetEmail, sendAdminWelcomeEmail, sendAdminInviteEmail };
