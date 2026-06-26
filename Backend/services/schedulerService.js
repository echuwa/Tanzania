const cron = require('node-cron');
const { User } = require('../models');
const whatsappService = require('./whatsappService');

// ─────────────────────────────────────────────────────────────
//  Daily Reminder Scheduler
//  Sends a motivational reminder every day at 10:00 AM (EAT)
//  EAT = UTC+3, so cron runs at 07:00 UTC
// ─────────────────────────────────────────────────────────────

function startScheduler() {
  // Cron format: second minute hour day month weekday
  // '0 7 * * *' = Every day at 07:00 UTC = 10:00 AM EAT (Tanzania)
  cron.schedule('0 7 * * *', async () => {
    console.log('[Scheduler] 🌅 Running daily WhatsApp reminder...');
    try {
      // Get all registered WhatsApp users
      const users = await User.findAll({
        where: { role: 'user', is_registered: true },
        attributes: ['full_name', 'phone_number', 'points']
      });

      const whatsappUsers = users.filter(u => u.phone_number);

      if (whatsappUsers.length === 0) {
        console.log('[Scheduler] ℹ️  No WhatsApp users to remind.');
        return;
      }

      console.log(`[Scheduler] 📤 Sending reminders to ${whatsappUsers.length} users...`);

      // Get today's motivational tip (rotates daily)
      const tips = [
        'Je, unajua Muungano wa Tanzania ni mfano bora wa umoja barani Afrika? 🌍',
        'Leo ni siku nzuri ya kujifunza historia ya Muungano wetu mtukufu! 📚',
        'Kujifunza historia ni kujua utambulisho wako — endelea kujifunza! 🇹🇿',
        'Ujuzi ni nguvu! Kila swali unalolisoma linakufanya mwanazuoni zaidi. 🎓',
        'Vijana wa Tanzania ndio mustakabali wa taifa — jiunge na quiz leo! 🚀',
        'Mwalimu Nyerere alisema: "Elimu ni silaha yenye nguvu kubwa." Tumia leo! ⚡',
        'Historia inafundisha, maisha yanabadilika. Jibu QUIZ leo upate pointi! 🏆'
      ];
      const todayTip = tips[new Date().getDay() % tips.length];

      // Send to each user with a small delay to avoid Meta rate limits
      let sent = 0;
      for (const user of whatsappUsers) {
        const name = user.full_name || 'Kijana';
        const message =
          `🌅 *Habari za asubuhi, ${name}!*\n\n` +
          `${todayTip}\n\n` +
          `Alama zako za sasa: *${user.points} pts* 🏅\n\n` +
          `Andika *QUIZ* kupata alama zaidi au *HADITHI* kusoma ya leo! 🇹🇿`;

        const result = await whatsappService.sendWhatsAppMessage(user.phone_number, message);
        if (result.success) sent++;

        // 500ms delay between sends to avoid hitting Meta rate limits
        await new Promise(r => setTimeout(r, 500));
      }

      console.log(`[Scheduler] ✅ Daily reminders sent: ${sent}/${whatsappUsers.length} successful`);
    } catch (err) {
      console.error('[Scheduler] ❌ Error sending daily reminders:', err.message);
    }
  }, {
    timezone: 'Africa/Dar_es_Salaam' // Tanzania timezone (EAT UTC+3)
  });

  console.log('[Scheduler] ✅ Daily reminder scheduler started — fires at 10:00 AM EAT every day');
}

module.exports = { startScheduler };
