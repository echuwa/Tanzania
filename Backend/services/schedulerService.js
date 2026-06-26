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

        const result = await whatsappService.sendWhatsAppMessage(user.phone_number, message, 'reminder');
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

  // '0 5 * * *' = Every day at 05:00 UTC = 08:00 AM EAT (Tanzania)
  cron.schedule('0 5 * * *', async () => {
    console.log('[Scheduler] 📅 Checking for Tanzanian National Calendar Events...');
    const NATIONAL_EVENTS = {
      '01-12': {
        title: 'Siku ya Mapinduzi ya Zanzibar 🌴',
        description: 'Leo tunaadhimisha Mapinduzi ya Zanzibar ya tarehe 12 Januari 1964. Huu ulikuwa msingi mkuu uliofungua njia ya Muungano wetu miezi michache baadaye! Mzee Abeid Amani Karume aliongoza harakati hizi za ukombozi.'
      },
      '04-07': {
        title: 'Siku ya Kumbukumbu ya Mzee Abeid Amani Karume 🕊️',
        description: 'Leo ni siku ya kumbukumbu ya Rais wa Kwanza wa Zanzibar na Makamu wa Kwanza wa Rais wa Tanzania, Mzee Abeid Amani Karume. Alikuwa nguzo imara ya Muungano wetu na mstari wa mbele katika kuleta usawa.'
      },
      '04-26': {
        title: '🎉 Siku Kuu ya Muungano wa Tanzania! 🇹🇿',
        description: 'Tarehe 26 Aprili 1964 ndipo Tanganyika na Zanzibar zilipoungana rasmi kuwa Jamhuri ya Muungano wa Tanzania! Huu ni muungano wa kipekee na wa mfano barani Afrika. Hatua hii ilikamilishwa na waasisi wetu wapendwa, Mwalimu Nyerere na Mzee Karume.'
      },
      '07-07': {
        title: 'Siku ya Saba Saba (Maonyesho ya Biashara) 📈',
        description: 'Saba Saba inaleta kumbukumbu ya kuanzishwa kwa chama cha TANU mwaka 1954 na leo ni sherehe kubwa ya maonyesho ya kibiashara nchini Tanzania.'
      },
      '08-08': {
        title: 'Siku ya Wakulima (Nane Nane) 🌾',
        description: 'Tunawapongeza wakulima wote wa Tanzania Bara na Visiwani. Kilimo ni utabiri wa uchumi wetu, na nguvu yetu kuu ya maendeleo.'
      },
      '10-14': {
        title: 'Kumbukumbu ya Baba wa Taifa (Mwalimu Nyerere) 🎓',
        description: 'Mwalimu Julius Kambarage Nyerere alifariki tarehe 14 Oktoba 1999. Leo tunamkumbuka kwa uzalendo, falsafa ya Azimio la Arusha, na juhudi zake za kuleta amani na umoja.'
      },
      '12-09': {
        title: 'Siku ya Uhuru wa Tanganyika! 🇹🇿',
        description: 'Tarehe 9 Desemba 1961, Tanganyika ilipata uhuru wake chini ya uongozi wa Mwalimu Julius Nyerere. Huu ulikuwa ukombozi wa kwanza uliofuatiwa na ukombozi wa Zanzibar, na hatimaye kuzaliwa kwa Tanzania.'
      }
    };

    try {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const key = `${month}-${day}`;

      const event = NATIONAL_EVENTS[key];
      if (!event) {
        console.log(`[Scheduler] ℹ️  No national event today (${key})`);
        return;
      }

      console.log(`[Scheduler] 🎉 Found National Event: ${event.title}. Broadcasting...`);

      // Get all registered users
      const users = await User.findAll({
        where: { role: 'user', is_registered: true },
        attributes: ['phone_number', 'full_name']
      });

      const whatsappUsers = users.filter(u => u.phone_number);

      if (whatsappUsers.length === 0) return;

      let sent = 0;
      for (const user of whatsappUsers) {
        const name = user.full_name || 'Kijana';
        const message = 
          `🇹🇿 *${event.title}* 🇹🇿\n\n` +
          `Ndugu ${name},\n\n` +
          `${event.description}\n\n` +
          `Tuendelee kudumisha amani na umoja wetu wa kihistoria. Andika *QUIZ* kupima uelewa wako wa siku hii ya leo! 🏆`;

        const result = await whatsappService.sendWhatsAppMessage(user.phone_number, message, 'broadcast');
        if (result.success) sent++;

        await new Promise(r => setTimeout(r, 600)); // 600ms delay to avoid rate limiting
      }

      console.log(`[Scheduler] ✅ National event broadcast completed: ${sent}/${whatsappUsers.length} sent.`);
    } catch (error) {
      console.error('[Scheduler] ❌ Error in national event scheduler:', error.message);
    }
  }, {
    timezone: 'Africa/Dar_es_Salaam'
  });

  console.log('[Scheduler] ✅ Daily reminder scheduler started — fires at 10:00 AM EAT every day');
  console.log('[Scheduler] ✅ National events scheduler started — checks at 08:00 AM EAT every day');
}

module.exports = { startScheduler };
