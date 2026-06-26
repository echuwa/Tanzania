const { User, Module, Question, DailyStory, ChatLog, QuizAttempt } = require('../models');
const aiService = require('../services/aiService');
const whatsappService = require('../services/whatsappService');
const telegramService = require('../services/telegramService');
const smsService = require('../services/smsService');

// ─────────────────────────────────────────────────────────────
//  FIX 4: Per-user Rate Limiting (Anti-Spam)
//  Allow 1 message per user every 3 seconds
// ─────────────────────────────────────────────────────────────
const lastMessageTime = new Map();
const RATE_LIMIT_MS = 3000; // 3 seconds between messages per user

function isRateLimited(identifier) {
  const now = Date.now();
  const last = lastMessageTime.get(identifier) || 0;
  if (now - last < RATE_LIMIT_MS) return true;
  lastMessageTime.set(identifier, now);
  return false;
}

// ─────────────────────────────────────────────────────────────
//  FIX 1: Session Helpers — Read/Write from DB (not RAM)
//  Sessions now survive server restarts
// ─────────────────────────────────────────────────────────────
function getSession(user) {
  return user.session_data || null;
}

async function setSession(user, sessionData) {
  user.session_data = sessionData;
  await user.save();
}

async function clearSession(user) {
  user.session_data = null;
  await user.save();
}

/**
 * Helper to normalize and find/create user based on channel and identifier
 */
async function getOrCreateUser(identifier, channel) {
  let user = null;

  if (channel === 'telegram') {
    user = await User.findOne({ where: { telegram_id: identifier } });
    if (!user) {
      user = await User.create({
        telegram_id: identifier,
        full_name: `Mtumiaji wa Telegram (${identifier})`,
        role: 'user'
      });
    }
  } else {
    // WhatsApp or SMS (identifier is phone number)
    user = await User.findOne({ where: { phone_number: identifier } });
    if (!user) {
      user = await User.create({
        phone_number: identifier,
        full_name: `Mtumiaji wa Simu (${identifier})`,
        role: 'user'
      });
    }
  }
  return user;
}

/**
 * Helper: Build and start a quiz session for a given module
 */
async function startQuizForModule(user, module) {
  const questions = await Question.findAll({
    where: { module_id: module.id },
    order: [['id', 'ASC']]
  });

  if (questions.length === 0) {
    return `⚠️ Samahani! Moduli "${module.title}" haina maswali kwa sasa. Jaribu moduli nyingine au andika *QUIZ* tena.`;
  }

  // Set new quiz session state in DB
  const session = {
    state: 'quiz',
    module_id: module.id,
    questions,
    current_index: 0,
    score: 0
  };
  await setSession(user, session);

  const q = questions[0];
  let prompt = `🎯 *MCHEZO WA MASWALI UMEANDALIWA!* 🎯\n\n`;
  prompt += `📖 *Sura: ${module.order_index}. ${module.title}*\n`;
  prompt += `${module.description}\n\n`;
  prompt += `*Swali la 1/${questions.length}:*\n${q.question_text}\n\n`;
  q.options.forEach(opt => { prompt += `${opt}\n`; });
  prompt += `\n👉 _Jibu kwa kuandika herufi ya jibu sahihi pekee (A, B, C, au D)._`;
  return prompt;
}

/**
 * Main state machine processor
 * Returns the text response that needs to be sent to the user
 */
async function processMessage(user, messageText, channel) {
  const cleanMsg = messageText.trim().toLowerCase();

  // Read session from DB (persists across restarts)
  let session = getSession(user);

  // ─────────────────────────────────────────────────────────
  //  USER REGISTRATION FLOW — Ask new users for their name
  // ─────────────────────────────────────────────────────────
  if (!user.is_registered) {
    if (session && session.state === 'awaiting_name') {
      // User is replying with their name
      const providedName = messageText.trim();
      if (providedName.length < 2 || providedName.length > 50) {
        return '⚠️ Tafadhali weka jina lako halisi (herufi 2–50).\n\nJina lako ni nani? 😊';
      }
      // Save name and mark as registered
      user.full_name = providedName;
      user.is_registered = true;
      await clearSession(user);
      await user.save();
      return (
        `🎉 *Karibu, ${providedName}!* 🇹🇿\n\n` +
        `Nimefurahi kukujua! Mimi ni *MUUNGANO WETU AI* — msaidizi wako wa kujifunza historia ya Tanzania.\n\n` +
        `Unaweza:\n` +
        `🎯 Andika *QUIZ* — Mchezo wa maswali na pointi\n` +
        `📚 Andika *HADITHI* — Hadithi ya kihistoria ya leo\n` +
        `🏆 Andika *LEADERBOARD* — Vijana wanaoongoza\n` +
        `ℹ️ Andika *MSAADA* — Maelekezo zaidi\n\n` +
        `Au niulize swali lolote la historia ya Tanzania! 😊`
      );
    }
    // First-ever message — greet and ask for name
    await setSession(user, { state: 'awaiting_name' });
    return (
      `🇹🇿 *Karibu kwenye MUUNGANO WETU AI!*\n\n` +
      `Ninafurahi kukuona hapa. Mimi ni chatbot ya elimu inayofundisha historia ya Muungano wa Tanzania.\n\n` +
      `Kabla hatujaanza, *niambie jina lako ni nani?* 😊\n\n` +
      `_(Andika jina lako tu, mfano: "Ahmed" au "Amina")_`
    );
  }


  if (cleanMsg === 'msaada' || cleanMsg === 'help' || cleanMsg === 'amri' || cleanMsg === 'commands') {
    await clearSession(user);
    return `ℹ️ *MSAADA WA MUUNGANO WETU AI* 🇹🇿\n\nAmri zinazoweza kutumika:\n\n🎯 *QUIZ* - Anza mchezo wa maswali (chagua moduli)\n📚 *HADITHI* - Soma hadithi ya kihistoria ya leo\n🏆 *LEADERBOARD* - Angalia vijana wanaoongoza kwa alama\n⭐ *POINTI* - Angalia alama zako za sasa\n\n_Au niulize swali lolote la kihistoria ya Muungano kwa Kiswahili!_\n\nMf: "Muungano ulianzishwa lini?", "Nani walisaini muungano?"\n\nAlama zako za sasa: *${user.points} pts* 🏅`;
  }

  // --- COMMAND: LEADERBOARD / POINTI ---
  if (cleanMsg === 'leaderboard' || cleanMsg === 'pointi zangu' || cleanMsg === 'pointi') {
    await clearSession(user);

    const topUsers = await User.findAll({
      where: { role: 'user' },
      order: [['points', 'DESC']],
      limit: 5,
      attributes: ['full_name', 'points', 'phone_number', 'telegram_id']
    });

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    let board = `🏆 *LEADERBOARD YA MUUNGANO WETU AI* 🏆\n\n`;
    topUsers.forEach((u, i) => {
      const name = u.full_name || 'Kijana Uzalendo';
      const id = u.phone_number || `Telegram:${String(u.telegram_id).substring(0, 5)}***`;
      board += `${medals[i] || `${i + 1}.`} ${name} (${id}) - *${u.points} pts*\n`;
    });

    if (topUsers.length === 0) {
      board += `Bado hakuna washiriki. Kuwa wa kwanza kuanza!\n`;
    }
    board += `\nAlama zako za sasa: *${user.points} pts* 🏅\n\nAndika *QUIZ* kucheza mchezo wa maswali au uliza swali lolote la kihistoria!`;
    return board;
  }

  // --- COMMAND: HADITHI ---
  if (cleanMsg === 'hadithi' || cleanMsg === 'hadithi ya leo') {
    await clearSession(user);
    const today = new Date().toISOString().split('T')[0];
    const story = await DailyStory.findOne({ where: { publish_date: today } });

    if (story) {
      return `📚 *HADITHI YA LEO: ${story.title}* 📚\n\n${story.content}\n\n---\n_Kama umeipenda hadithi hii, andika *QUIZ* ili kupima uelewa wako!_`;
    } else {
      const latestStory = await DailyStory.findOne({ order: [['publish_date', 'DESC']] });
      if (latestStory) {
        return `📚 *HADITHI YETU YA HISTORIA: ${latestStory.title}* 📚\n\n${latestStory.content}\n\n---\n_Andika *QUIZ* kupima uelewa wako au uliza swali lolote!_`;
      }
      return '⚠️ Samahani! Hakuna hadithi iliyotayarishwa kwa siku ya leo. Tafadhali andika *QUIZ* ili kucheza au uulize swali lolote la kihistoria!';
    }
  }

  // --- COMMAND: QUIZ (Show module menu or start directly) ---
  const quizMatch = cleanMsg.match(/^(?:quiz|anza quiz|anza)(\s+(\d+))?$/);
  if (quizMatch) {
    await clearSession(user);
    const chosenNumber = quizMatch[2] ? parseInt(quizMatch[2]) : null;

    const allModules = await Module.findAll({ order: [['order_index', 'ASC']] });
    if (!allModules || allModules.length === 0) {
      return '⚠️ Samahani, moduli za masomo bado hazijawekwa kwenye mfumo. Wasiliana na msimamizi!';
    }

    if (chosenNumber !== null) {
      const targetModule = allModules.find(m => m.order_index === chosenNumber);
      if (!targetModule) {
        return `⚠️ Moduli namba ${chosenNumber} haipatikani. Tafadhali chagua namba kati ya 1 na ${allModules.length}.`;
      }
      return await startQuizForModule(user, targetModule);
    }

    if (allModules.length === 1) {
      return await startQuizForModule(user, allModules[0]);
    }

    // Show module selection menu
    await setSession(user, { state: 'choosing_module' });
    let menu = `🎯 *CHAGUA SURA YA QUIZ* 🎯\n\nUnapenda kujifunza kuhusu nini? Andika namba ya sura:\n\n`;
    allModules.forEach(mod => {
      menu += `*${mod.order_index}.* ${mod.title}\n   _${mod.description.substring(0, 60)}..._\n\n`;
    });
    menu += `👉 _Jibu kwa namba pekee (mf. "1", "2", n.k.)_\nAu andika *0* kucheza sura yoyote bila kuchagua.`;
    return menu;
  }

  // --- STATE: CHOOSING MODULE ---
  if (session && session.state === 'choosing_module') {
    const choiceNum = parseInt(cleanMsg);
    const allModules = await Module.findAll({ order: [['order_index', 'ASC']] });

    if (choiceNum === 0) {
      await clearSession(user);
      return await startQuizForModule(user, allModules[0]);
    }

    const chosen = allModules.find(m => m.order_index === choiceNum);
    if (!chosen) {
      let menu = `⚠️ Namba ${choiceNum} si sahihi. Tafadhali chagua:\n\n`;
      allModules.forEach(mod => { menu += `*${mod.order_index}.* ${mod.title}\n`; });
      menu += `\nAu andika *0* kuanza sura ya kwanza.`;
      return menu;
    }

    await clearSession(user);
    return await startQuizForModule(user, chosen);
  }

  // --- STATE: ACTIVE QUIZ ---
  if (session && session.state === 'quiz') {
    const q = session.questions[session.current_index];

    // Map input letter to option index (A → 0, B → 1, C → 2, D → 3)
    let userAnswerIndex = -1;
    const inputChar = cleanMsg.toUpperCase().trim();

    if (inputChar.startsWith('A')) userAnswerIndex = 0;
    else if (inputChar.startsWith('B')) userAnswerIndex = 1;
    else if (inputChar.startsWith('C')) userAnswerIndex = 2;
    else if (inputChar.startsWith('D')) userAnswerIndex = 3;

    if (userAnswerIndex === -1) {
      return `⚠️ Jibu lisilojulikana. Tafadhali andika herufi *A, B, C, au D* kujibu swali hili:\n\n${q.question_text}`;
    }

    let responsePrefix = '';
    if (userAnswerIndex === q.correct_option) {
      session.score += q.points;
      responsePrefix = `✅ *Sahihi kabisa!* Umejipatia alama *+${q.points}*.\n\n`;
    } else {
      const correctText = q.options[q.correct_option];
      responsePrefix = `❌ *Si Sahihi!* Jibu sahihi lilikuwa: *${correctText}*.\n\n`;
    }

    session.current_index += 1;

    if (session.current_index < session.questions.length) {
      // Save updated session to DB and send next question
      await setSession(user, session);

      const nextQ = session.questions[session.current_index];
      let prompt = responsePrefix;
      prompt += `*Swali la ${session.current_index + 1}/${session.questions.length}:*\n${nextQ.question_text}\n\n`;
      nextQ.options.forEach(opt => { prompt += `${opt}\n`; });
      prompt += `\n👉 _Jibu kwa kuandika herufi pekee (A, B, C, au D)._`;
      return prompt;
    } else {
      // Quiz completed! — Save attempt and clear session
      const finalScore = session.score;
      const moduleId = session.module_id;

      await QuizAttempt.create({
        user_id: user.id,
        module_id: moduleId,
        score: finalScore,
        completed: true
      });

      user.points += finalScore;
      await user.save();
      await clearSession(user);

      let certText = '';
      if (finalScore >= 20) {
        certText = `🏆 *PONGEZI ZA KIPEKEE!* Umetuzwa *Hati ya Dijitali ya Maarifa ya Muungano*! 📜\n\n`;
      }

      let summary = responsePrefix;
      summary += `🎉 *MCHEZO UMEKAMILIKA!* 🎉\n\n`;
      summary += `Umesajili alama *${finalScore}* katika sura hii.\n`;
      summary += `Jumla ya alama zako zote za sasa ni *${user.points} points*.\n\n`;
      summary += certText;
      summary += `Andika *QUIZ* kucheza tena, *HADITHI* kusoma habari za kihistoria, au niulize swali lingine lolote! 🇹🇿`;
      return summary;
    }
  }

  // --- STATE: NORMAL CONVERSATION (Call AI) ---
  const recentLogs = await ChatLog.findAll({
    where: { user_id: user.id },
    order: [['createdAt', 'DESC']],
    limit: 3,
    attributes: ['message_text', 'response_text']
  });
  recentLogs.reverse();

  const aiReply = await aiService.getAIResponse(messageText, recentLogs);

  await ChatLog.create({
    user_id: user.id,
    channel,
    message_text: messageText,
    response_text: aiReply
  });

  return aiReply;
}

// ─────────────────────────────────────────────────────────────
//  WEBHOOK HANDLERS
// ─────────────────────────────────────────────────────────────

/**
 * Controller webhook for WhatsApp API
 */
exports.handleWhatsAppWebhook = async (req, res) => {
  // WhatsApp Cloud API Webhook Verification Challenge
  if (req.method === 'GET' && req.query['hub.mode'] === 'subscribe') {
    if (req.query['hub.verify_token'] === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Verification token mismatch');
  }

  // ✅ Respond to Meta IMMEDIATELY — must be within 5s or Meta retries
  res.sendStatus(200);

  // --- Process in background (after 200 already sent to Meta) ---
  try {
    const entry = req.body.entry;
    if (entry && entry[0] && entry[0].changes && entry[0].changes[0] && entry[0].changes[0].value.messages) {
      const message = entry[0].changes[0].value.messages[0];
      const from = message.from;
      const text = message.text ? message.text.body : '';

      if (!text) return;

      // FIX 4: Rate limiting — reject if user is sending too fast
      if (isRateLimited(from)) {
        console.log(`[WhatsApp] ⏳ Rate limited: +${from} — ignoring message`);
        await whatsappService.sendWhatsAppMessage(from, '⏳ Tafadhali subiri kidogo kabla ya kutuma ujumbe mwingine!');
        return;
      }

      console.log(`[WhatsApp IN ] ← From: +${from} | "${text}"`);

      const user = await getOrCreateUser(from, 'whatsapp');

      // FIX 3: Typing Indicator — user knows message was received
      // Only send for AI queries (not quiz answers or commands) to avoid double messages
      const isCommand = ['quiz', 'hadithi', 'leaderboard', 'msaada', 'help', 'pointi', 'amri', 'commands', 'anza'].some(cmd =>
        text.trim().toLowerCase().startsWith(cmd)
      );
      const isQuizAnswer = /^[abcd]$/i.test(text.trim());
      const isModuleChoice = /^\d+$/.test(text.trim());

      if (!isCommand && !isQuizAnswer && !isModuleChoice) {
        // Free-text AI question — send typing indicator first
        await whatsappService.sendWhatsAppMessage(from, '⏳ _Muungano Wetu AI inafikiri... subiri sekunde moja!_');
      }

      const reply = await processMessage(user, text, 'whatsapp');
      await whatsappService.sendWhatsAppMessage(from, reply);
      console.log(`[WhatsApp OUT] ✅ Reply complete for +${from}`);
    }
  } catch (error) {
    console.error('[WhatsApp] ❌ Background processing error:', error);
  }
};

/**
 * Controller webhook for Telegram API
 */
exports.handleTelegramWebhook = async (req, res) => {
  try {
    const message = req.body.message;
    if (message && message.chat && message.text) {
      const chatId = message.chat.id.toString();
      const text = message.text;

      const user = await getOrCreateUser(chatId, 'telegram');

      if (message.chat.first_name || message.chat.last_name) {
        user.full_name = `${message.chat.first_name || ''} ${message.chat.last_name || ''}`.trim();
        await user.save();
      }

      const reply = await processMessage(user, text, 'telegram');
      await telegramService.sendTelegramMessage(chatId, reply);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    res.sendStatus(500);
  }
};

/**
 * Controller webhook for Africa's Talking SMS API
 */
exports.handleSMSWebhook = async (req, res) => {
  try {
    const { from, text } = req.body;
    if (from && text) {
      const user = await getOrCreateUser(from, 'sms');
      const reply = await processMessage(user, text, 'sms');
      await smsService.sendSMS(from, reply);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling SMS webhook:', error);
    res.sendStatus(500);
  }
};

/**
 * Controller for Mock Webchat (testing from Admin Dashboard)
 */
exports.handleMockWebchat = async (req, res) => {
  const { identifier, messageText, channel } = req.body;

  if (!identifier || !messageText || !channel) {
    return res.status(400).json({ message: 'Tafadhali jaza maelezo yote ya jaribio' });
  }

  try {
    const user = await getOrCreateUser(identifier, channel);
    const reply = await processMessage(user, messageText, channel);
    res.json({ reply });
  } catch (error) {
    console.error('Error handling mock webchat:', error);
    res.status(500).json({ message: 'Hitilafu ya chatbot wakati wa kuchakata ujumbe' });
  }
};
