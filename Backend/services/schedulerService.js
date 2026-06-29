const cron = require('node-cron');
const { User } = require('../models');
const whatsappService = require('./whatsappService');
const jobProcessor = require('./jobProcessor');

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

      console.log(`[Scheduler] 📤 Enqueuing daily reminders to ${whatsappUsers.length} users...`);

      // Get today's motivational tip (rotates daily)
      const tips = [
        'Did you know that the Union of Tanzania is one of the most successful integration models in Africa? 🌍',
        'Today is a great day to learn about the history of our glorious Union! 📚',
        'Learning history is knowing your true identity — keep learning, compatriot! 🇹🇿',
        'Knowledge is power! Every question you answer builds your understanding. 🎓',
        'The youth of Tanzania are the bright future of our nation — join the quiz today! 🚀',
        'Mwalimu Nyerere once said: "Education is a powerful weapon." Use it today! ⚡',
        'History educates, and life progresses. Answer the QUIZ today to earn points! 🏆'
      ];
      const todayTip = tips[new Date().getDay() % tips.length];

      const recipients = whatsappUsers.map(user => {
        const name = user.full_name || 'Friend';
        return {
          phone_number: user.phone_number,
          message: `🌅 *Good morning, ${name}!* \n\n` +
            `${todayTip}\n\n` +
            `Your current score: *${user.points} pts* 🏅\n\n` +
            `Type *QUIZ* to earn points, or *STORY* to read today's history! 🇹🇿`
        };
      });

      await jobProcessor.enqueueJob(`Daily Reminder: ${todayTip.substring(0, 40)}...`, recipients, 'reminder');
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
        title: 'Zanzibar Revolution Day 🌴',
        description: 'Today we commemorate the Zanzibar Revolution of January 12, 1964. This historic event paved the way for the historic Union of Tanganyika and Zanzibar just a few months later, led by Mzee Abeid Amani Karume.'
      },
      '04-07': {
        title: 'Mzee Abeid Amani Karume Memorial Day 🕊️',
        description: 'Today we honor the memory of the first President of Zanzibar and the First Vice President of Tanzania, Mzee Abeid Amani Karume. He was a pillar of the Union and a champion of social equality.'
      },
      '04-26': {
        title: '🎉 Union Day Anniversary! 🇹🇿',
        description: 'On April 26, 1964, Tanganyika and Zanzibar officially united to form the United Republic of Tanzania! This remains a unique and exemplary integration in Africa, founded by Mwalimu Julius Nyerere and Mzee Abeid Karume.'
      },
      '07-07': {
        title: 'Saba Saba Day (International Trade Fair) 📈',
        description: 'Saba Saba commemorates the founding of the TANU political party in 1954 and is celebrated today as a major trade fair and exhibition day in Tanzania.'
      },
      '08-08': {
        title: 'Nane Nane Day (Farmers\' Day) 🌾',
        description: 'We honor all farmers in Mainland and Island Tanzania. Agriculture is the backbone of our economy and the engine of national development.'
      },
      '10-14': {
        title: 'Mwalimu Nyerere Memorial Day 🎓',
        description: 'Mwalimu Julius Kambarage Nyerere passed away on October 14, 1999. Today we reflect on his patriotism, his principles of self-reliance, and his lifelong work for peace and unity.'
      },
      '12-09': {
        title: 'Tanganyika Independence Day! 🇹🇿',
        description: 'On December 9, 1961, Tanganyika achieved independence under the leadership of Mwalimu Julius Nyerere. This was the first milestone towards self-determination, leading to the creation of Tanzania.'
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

      console.log(`[Scheduler] 🎉 Found National Event: ${event.title}. Enqueuing broadcast...`);

      // Get all registered users
      const users = await User.findAll({
        where: { role: 'user', is_registered: true },
        attributes: ['phone_number', 'full_name']
      });

      const whatsappUsers = users.filter(u => u.phone_number);

      if (whatsappUsers.length === 0) return;

      const recipients = whatsappUsers.map(user => {
        const name = user.full_name || 'Friend';
        return {
          phone_number: user.phone_number,
          message: `🇹🇿 *${event.title}* 🇹🇿\n\n` +
            `Dear ${name},\n\n` +
            `${event.description}\n\n` +
            `Let us continue to uphold our peace and national unity. Type *QUIZ* to test your knowledge of today's milestone! 🏆`
        };
      });

      await jobProcessor.enqueueJob(`National Event: ${event.title}`, recipients, 'broadcast');
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
