require('dotenv').config();
const { User, Module, Question, DailyStory, QuizAttempt } = require('../models');

// ============================================================
//  MUUNGANO WETU AI — USSD Service
//  Compatible with Africa's Talking USSD API
//
//  Africa's Talking POSTs these fields to our endpoint:
//    sessionId   — unique per call session
//    phoneNumber — user's phone (e.g. +255712345678)
//    networkCode — network provider
//    serviceCode — the USSD code dialed (*XXX#)
//    text        — user's input path (e.g. "" → "1" → "1*2" → "1*2*1")
//
//  We respond with:
//    "CON <message>" — continue (show menu and wait for input)
//    "END <message>" — end session (close USSD dialog)
//
//  USSD character limit: ~182 chars per response page
// ============================================================

// Active USSD quiz sessions stored in memory
// Key: sessionId, Value: { moduleId, questions, currentIndex, score }
// NOTE: For multi-server production, move this to Redis
const ussdQuizSessions = new Map();

/**
 * Truncate text to fit USSD limit while keeping it readable
 */
function ussdTrunc(text, maxLen = 160) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 3) + '...';
}

/**
 * Build the main USSD menu (Level 0)
 */
function buildMainMenu() {
  return (
    'CON 🇹🇿 MUUNGANO WETU AI\n' +
    'Elimu ya Historia ya Tanzania\n\n' +
    '1. Cheza Quiz\n' +
    '2. Hadithi ya Leo\n' +
    '3. Orodha ya Bora\n' +
    '4. Pointi Zangu\n' +
    '0. Ondoka'
  );
}

/**
 * Main USSD handler — processes user input path and returns CON/END response
 */
async function handleUSSD(sessionId, phoneNumber, text) {
  // Normalize phone number (remove leading + for DB lookup)
  const phone = phoneNumber.replace(/^\+/, '');

  // Parse the input path — split by * to get menu navigation levels
  const levels = text === '' ? [] : text.split('*');
  const depth = levels.length;

  try {
    // ── LEVEL 0: Main Menu ────────────────────────────────────
    if (depth === 0 || text === '') {
      return buildMainMenu();
    }

    const choice1 = levels[0]; // First menu choice

    // ── OPTION 0: Exit ────────────────────────────────────────
    if (choice1 === '0') {
      ussdQuizSessions.delete(sessionId);
      return 'END Asante kwa kutumia MUUNGANO WETU AI! 🇹🇿\nEndelea kujifunza historia ya Taifa letu!';
    }

    // ── OPTION 1: QUIZ ────────────────────────────────────────
    if (choice1 === '1') {
      const allModules = await Module.findAll({ order: [['order_index', 'ASC']] });

      if (allModules.length === 0) {
        return 'END ⚠️ Hakuna moduli za quiz zilizowekwa. Wasiliana na msimamizi.';
      }

      // Level 1*X: User chose a module
      if (depth === 1) {
        // Show module selection menu
        let menu = 'CON Chagua Sura ya Quiz:\n\n';
        allModules.forEach((mod, i) => {
          const title = ussdTrunc(mod.title, 30);
          menu += `${mod.order_index}. ${title}\n`;
        });
        menu += '0. Rudi nyuma';
        return ussdTrunc(menu, 182);
      }

      const moduleChoice = levels[1];
      if (moduleChoice === '0') return buildMainMenu();

      const chosenModule = allModules.find(m => String(m.order_index) === moduleChoice);
      if (!chosenModule) {
        return 'CON ⚠️ Nambari batili. Jaribu tena.\n\n' + buildMainMenu().replace('CON ', '');
      }

      // Load questions for chosen module
      const questions = await Question.findAll({
        where: { module_id: chosenModule.id },
        order: [['id', 'ASC']]
      });

      if (questions.length === 0) {
        return 'END ⚠️ Sura hii haina maswali bado. Jaribu sura nyingine.';
      }

      // Level 1*X*Y: User is answering a question
      // levels[2] onward = answers to questions
      const answerDepth = depth - 2; // how many answers given so far

      if (depth === 2) {
        // Show first question
        const q = questions[0];
        // Store session
        ussdQuizSessions.set(sessionId, {
          moduleId: chosenModule.id,
          moduleName: chosenModule.title,
          questions: questions.map(q => ({
            id: q.id,
            text: q.question_text,
            options: q.options,
            correct: q.correct_option,
            points: q.points
          })),
          currentIndex: 0,
          score: 0
        });

        return buildQuestionMenu(q, 0, questions.length);
      }

      // User is answering questions (depth >= 3)
      const session = ussdQuizSessions.get(sessionId);
      if (!session) {
        // Session lost — restart
        return buildMainMenu();
      }

      const answerIndex = depth - 3; // index of the question being answered
      const userAnswer = levels[depth - 1]; // latest answer given

      // Process the answer
      const q = session.questions[answerIndex];
      if (!q) return buildMainMenu();

      // Map input "1"=A, "2"=B, "3"=C, "4"=D
      const answerMap = { '1': 0, '2': 1, '3': 2, '4': 3 };
      const userAnswerIndex = answerMap[userAnswer];

      if (userAnswerIndex === undefined) {
        // Invalid answer — re-show same question
        return buildQuestionMenu(q, answerIndex, session.questions.length, '⚠️ Jibu batili! Chagua 1-4.\n\n');
      }

      // Check if correct
      let isCorrect = userAnswerIndex === q.correct;
      if (isCorrect) session.score += q.points;

      // Move to next question or finish
      const nextIndex = answerIndex + 1;

      if (nextIndex < session.questions.length) {
        // Show next question
        const nextQ = session.questions[nextIndex];
        const prefix = isCorrect ? '✅ Sahihi!\n\n' : `❌ Jibu: ${['A','B','C','D'][q.correct]}\n\n`;
        return buildQuestionMenu(nextQ, nextIndex, session.questions.length, prefix);
      } else {
        // Quiz complete!
        const finalScore = session.score;
        ussdQuizSessions.delete(sessionId);

        // Save to DB in background
        try {
          let user = await User.findOne({ where: { phone_number: phone } });
          if (!user) {
            user = await User.create({
              phone_number: phone,
              full_name: `USSD User (${phone})`,
              role: 'user',
              is_registered: true
            });
          }
          await QuizAttempt.create({
            user_id: user.id,
            module_id: session.moduleId,
            score: finalScore,
            completed: true
          });
          user.points = (user.points || 0) + finalScore;
          await user.save();
        } catch (dbErr) {
          console.error('[USSD] DB save error:', dbErr.message);
        }

        const resultMsg = isCorrect ? '✅ Sahihi!\n\n' : `❌ Jibu: ${['A','B','C','D'][q.correct]}\n\n`;
        return (
          `END ${resultMsg}` +
          `🎉 QUIZ IMEKAMILIKA!\n` +
          `Alama: ${finalScore} pointi\n\n` +
          `Piga *${process.env.USSD_CODE || '*384#'}* tena kucheza!`
        );
      }
    }

    // ── OPTION 2: STORY ───────────────────────────────────────
    if (choice1 === '2') {
      const today = new Date().toISOString().split('T')[0];
      let story = await DailyStory.findOne({ where: { publish_date: today } });
      if (!story) {
        story = await DailyStory.findOne({ order: [['publish_date', 'DESC']] });
      }

      if (!story) {
        return 'END ⚠️ Hakuna hadithi iliyoandaliwa leo. Jaribu kesho!';
      }

      // USSD can only show ~160 chars — show title + excerpt
      const excerpt = ussdTrunc(story.content, 100);
      return `END 📚 ${ussdTrunc(story.title, 30)}\n\n${excerpt}\n\n(Fungua WhatsApp au Telegram kwa hadithi kamili)`;
    }

    // ── OPTION 3: LEADERBOARD ─────────────────────────────────
    if (choice1 === '3') {
      const topUsers = await User.findAll({
        where: { role: 'user' },
        order: [['points', 'DESC']],
        limit: 5,
        attributes: ['full_name', 'points']
      });

      const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
      let board = 'END 🏆 ORODHA YA BORA\n\n';
      if (topUsers.length === 0) {
        board += 'Bado hakuna washiriki.';
      } else {
        topUsers.forEach((u, i) => {
          const name = ussdTrunc(u.full_name || 'Mzalendo', 15);
          board += `${medals[i]} ${name} - ${u.points}pt\n`;
        });
      }
      return board;
    }

    // ── OPTION 4: MY POINTS ───────────────────────────────────
    if (choice1 === '4') {
      const user = await User.findOne({ where: { phone_number: phone } });
      if (!user || !user.points) {
        return 'END Pointi Zako: 0\n\nChagua 1 kucheza Quiz na kupata pointi!';
      }

      // Get user rank
      const rank = await User.count({
        where: { role: 'user', points: { [require('sequelize').Op.gt]: user.points } }
      });

      return (
        `END 🏅 POINTI ZAKO\n\n` +
        `Jina: ${ussdTrunc(user.full_name, 20)}\n` +
        `Pointi: ${user.points}\n` +
        `Nafasi: #${rank + 1}\n\n` +
        `Piga *${process.env.USSD_CODE || '*384#'}* kucheza Quiz!`
      );
    }

    // Unknown choice
    return buildMainMenu();

  } catch (error) {
    console.error('[USSD] Processing error:', error.message);
    return 'END ⚠️ Hitilafu imetokea. Tafadhali jaribu tena baadaye.';
  }
}

/**
 * Build a quiz question menu for USSD
 * Maps A=1, B=2, C=3, D=4 (since USSD only accepts numbers)
 */
function buildQuestionMenu(q, index, total, prefix = '') {
  const letters = ['A', 'B', 'C', 'D'];
  let menu = `CON ${prefix}❓ Swali ${index + 1}/${total}:\n`;
  menu += ussdTrunc(q.text || q.question_text, 60) + '\n\n';

  const opts = q.options || [];
  opts.forEach((opt, i) => {
    // Strip letter prefix if already there (e.g. "A. Option" → "Option")
    const cleanOpt = opt.replace(/^[A-Da-d][.)]\s*/, '');
    menu += `${i + 1}. ${ussdTrunc(cleanOpt, 30)}\n`;
  });

  return ussdTrunc(menu, 182);
}

module.exports = { handleUSSD };
