const crypto = require('crypto');
const { User, Module, Question, DailyStory, ChatLog, QuizAttempt } = require('../models');
const aiService = require('../services/aiService');
const whatsappService = require('../services/whatsappService');
const telegramService = require('../services/telegramService');
const smsService = require('../services/smsService');
const ussdService = require('../services/ussdService');
const liveService = require('../services/liveService');

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
  user.session_data = JSON.parse(JSON.stringify(sessionData));
  user.changed('session_data', true);
  await user.save();
}

async function clearSession(user) {
  user.session_data = null;
  user.changed('session_data', true);
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
        full_name: null,
        role: 'user'
      });
    }
  } else {
    // WhatsApp or SMS (identifier is phone number)
    user = await User.findOne({ where: { phone_number: identifier } });
    if (!user) {
      user = await User.create({
        phone_number: identifier,
        full_name: null,
        role: 'user'
      });
    }
  }
  return user;
}

/**
 * Detect whether a message is primarily Kiswahili or English
 * Returns 'sw' for Kiswahili, 'en' for English
 */
function detectLanguage(message) {
  const swahiliWords = ['habari', 'mambo', 'hujambo', 'salamu', 'karibu', 'vipi', 'niaje', 'sasa', 'nzuri',
    'asante', 'tafadhali', 'samahani', 'ndiyo', 'hapana', 'ndio', 'sijui', 'je', 'na', 'ya', 'wa', 'la',
    'ni', 'si', 'au', 'kwa', 'katika', 'jina', 'yangu', 'lako', 'yako', 'wetu', 'zako', 'wako',
    'muungano', 'historia', 'mwalimu', 'nyerere', 'zanzibar', 'tanganyika', 'hadithi', 'swali'];
  const lowerMsg = message.toLowerCase();
  const swHits = swahiliWords.filter(w => lowerMsg.includes(w)).length;
  return swHits >= 1 ? 'sw' : 'en';
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
    return `⚠️ Sorry! Module "${module.title}" has no questions at the moment. Please try another module or type *QUIZ* again.`;
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
  let prompt = `🎯 *QUIZ GAME READY!* 🎯\n\n`;
  prompt += `📖 *Chapter: ${module.order_index}. ${module.title}*\n`;
  prompt += `${module.description}\n\n`;
  prompt += `*Question 1/${questions.length}:*\n${q.question_text}\n\n`;
  q.options.forEach(opt => { prompt += `${opt}\n`; });
  prompt += `\n👉 _Answer by typing only the letter of the correct option (A, B, C, or D)._`;
  return prompt;
}

/**
 * Internal state machine processor
 * Returns the text response that needs to be sent to the user
 */
async function generateReplyText(user, messageText, channel) {
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
      const lowerName = providedName.toLowerCase();
      const forbiddenNameWords = [
        'hello', 'hi', 'hey', 'mambo', 'habari', 'yambo', 'hujambo', 'salamu', 'greetings', 'hellow',
        'quiz', 'story', 'hadithi', 'leaderboard', 'points', 'pointi', 'help', 'msaada', 'cancel', 'ghairi',
        '1', '2', '3', '4', '0', 'start', 'anza', 'acha'
      ];

      const isInvalid = forbiddenNameWords.includes(lowerName) || /^\d+$/.test(providedName);
      const lang = session.lang || 'en';

      if (isInvalid || providedName.length < 2 || providedName.length > 50) {
        return lang === 'sw'
          ? `⚠️ Jina hilo linaonekana kuwa salamu, amri, au nambari.\n\nTafadhali niambie *jina lako la kweli* ili nikusajili! 😊`
          : `⚠️ That name appears to be a greeting, command, or number.\n\nPlease tell me your real name to register! 😊`;
      }

      // Save name and mark as registered
      user.full_name = providedName;
      user.is_registered = true;
      await clearSession(user);
      await user.save();

      if (lang === 'sw') {
        return (
          `🎉 *Karibu sana, ${providedName}!* 🇹🇿\n\n` +
          `Nimefurahi kukujua, ${providedName}! Mimi ni *MUUNGANO WETU AI* — msaidizi wako wa dijiti wa kujifunza historia ya Tanzania.\n\n` +
          `Unaweza:\n` +
          `🎯 Andika *QUIZ* — Cheza chemsha bongo na upate pointi\n` +
          `📚 Andika *STORY* — Soma hadithi ya kihistoria ya leo\n` +
          `🏆 Andika *LEADERBOARD* — Tazama orodha ya washindi\n` +
          `ℹ️ Andika *HELP* — Pata orodha ya amri zote\n\n` +
          `Au niulize swali lolote kuhusu historia ya Muungano wetu! 😊`
        );
      } else {
        return (
          `🎉 *Welcome, ${providedName}!* 🇹🇿\n\n` +
          `Nice to meet you, ${providedName}! I am *MUUNGANO WETU AI* — your digital companion for learning Tanzanian history.\n\n` +
          `You can:\n` +
          `🎯 Type *QUIZ* — Play quiz game to earn points\n` +
          `📚 Type *STORY* — Read today's daily historical story\n` +
          `🏆 Type *LEADERBOARD* — View the leading scores\n` +
          `ℹ️ Type *HELP* — Get commands list\n\n` +
          `Or ask me any question about the Union history! 😊`
        );
      }
    }

    // First-ever message — detect language, greet, and ask for name
    const lang = detectLanguage(messageText);
    await setSession(user, { state: 'awaiting_name', lang });

    if (lang === 'sw') {
      return (
        `🇹🇿 *Karibu MUUNGANO WETU AI!*\n\n` +
        `Mimi ni chatbot wa elimu wa historia ya Muungano wa Tanzania.\n\n` +
        `Kabla hatujaanza, *tafadhali niambie jina lako.* 😊\n\n` +
        `_(Andika jina lako tu, mfano: "Ahmed" au "Amina")_`
      );
    } else {
      return (
        `🇹🇿 *Welcome to MUUNGANO WETU AI!*\n\n` +
        `I am an educational chatbot dedicated to the history of the Union of Tanzania.\n\n` +
        `Before we begin, *please tell me your name.* 😊\n\n` +
        `_(Type your name only, e.g. "Ahmed" or "Amina")_`
      );
    }
  }


  if (cleanMsg === 'acha' || cleanMsg === 'ghairi' || cleanMsg === 'cancel' || cleanMsg === 'sitaki' || cleanMsg === 'exit' || cleanMsg === 'stop') {
    if (session) {
      await clearSession(user);
      return `❌ *You have canceled your active game or selection and cleared the session.* \n\nYou can start a new game anytime by typing *QUIZ*, *STORY*, or by asking me any historical question about our Union! 🇹🇿`;
    }
    return `I am *MUUNGANO WETU AI*. You have no active game running right now. \n\nYou can start playing by typing *QUIZ*, reading by typing *STORY*, or asking me any question! 😊`;
  }

  if (cleanMsg === 'msaada' || cleanMsg === 'help' || cleanMsg === 'amri' || cleanMsg === 'commands') {
    await clearSession(user);
    return `ℹ️ *MUUNGANO WETU AI HELP* 🇹🇿\n\nAvailable commands:\n\n🎯 *QUIZ* - Start the trivia game (choose a chapter)\n📚 *STORY* - Read today's daily history lesson\n🏆 *LEADERBOARD* - View the leading scores\n⭐ *POINTS* - View your current score\n❌ *CANCEL* - Stop/cancel the current game or session\n\n_Or ask me any historical question about the Union in English or Swahili!_\n\nE.g., "When was the Union formed?", "Who signed the Union treaty?"\n\nYour current score: *${user.points} pts* 🏅`;
  }

  // --- COMMAND: LEADERBOARD / POINTI ---
  if (cleanMsg === 'leaderboard' || cleanMsg === 'pointi zangu' || cleanMsg === 'pointi' || cleanMsg === 'points' || cleanMsg === 'score') {
    await clearSession(user);

    const topUsers = await User.findAll({
      where: { role: 'user' },
      order: [['points', 'DESC']],
      limit: 5,
      attributes: ['full_name', 'points', 'phone_number', 'telegram_id']
    });

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    let board = `🏆 *MUUNGANO WETU AI LEADERBOARD* 🏆\n\n`;
    topUsers.forEach((u, i) => {
      const name = u.full_name || 'Patriotic Youth';
      const id = u.phone_number || `Telegram:${String(u.telegram_id).substring(0, 5)}***`;
      board += `${medals[i] || `${i + 1}.`} ${name} (${id}) - *${u.points} pts*\n`;
    });

    if (topUsers.length === 0) {
      board += `No participants yet. Be the first to start!\n`;
    }
    board += `\nYour current score: *${user.points} pts* 🏅\n\nType *QUIZ* to play or ask me any historical question!`;
    return board;
  }

  // --- COMMAND: HADITHI ---
  if (cleanMsg === 'hadithi' || cleanMsg === 'hadithi ya leo' || cleanMsg === 'story' || cleanMsg === 'daily story' || cleanMsg === 'history story') {
    await clearSession(user);
    const today = new Date().toISOString().split('T')[0];
    const story = await DailyStory.findOne({ where: { publish_date: today } });

    if (story) {
      return `📚 *TODAY'S STORY: ${story.title}* 📚\n\n${story.content}\n\n---\n_If you enjoyed this story, type *QUIZ* to test your understanding!_`;
    } else {
      const latestStory = await DailyStory.findOne({ order: [['publish_date', 'DESC']] });
      if (latestStory) {
        return `📚 *OUR HISTORY STORY: ${latestStory.title}* 📚\n\n${latestStory.content}\n\n---\n_Type *QUIZ* to test your understanding or ask me any question!_`;
      }
      return '⚠️ Sorry! No historical story is prepared for today. Please type *QUIZ* to play or ask me any question!';
    }
  }

  // --- COMMAND: QUIZ (Show module menu or start directly) ---
  const quizMatch = cleanMsg.match(/^(?:quiz|anza quiz|anza|start quiz)(\s+(\d+))?$/);
  if (quizMatch) {
    await clearSession(user);
    const chosenNumber = quizMatch[2] ? parseInt(quizMatch[2]) : null;

    const allModules = await Module.findAll({ order: [['order_index', 'ASC']] });
    if (!allModules || allModules.length === 0) {
      return '⚠️ Sorry, learning modules are not yet configured in the system. Please contact the administrator!';
    }

    if (chosenNumber !== null) {
      const targetModule = allModules.find(m => m.order_index === chosenNumber);
      if (!targetModule) {
        return `⚠️ Module number ${chosenNumber} is not available. Please choose a number between 1 and ${allModules.length}.`;
      }
      return await startQuizForModule(user, targetModule);
    }

    if (allModules.length === 1) {
      return await startQuizForModule(user, allModules[0]);
    }

    // Show module selection menu
    await setSession(user, { state: 'choosing_module' });
    let menu = `🎯 *CHOOSE A QUIZ CHAPTER* 🎯\n\nWhat would you like to learn about? Type the chapter number:\n\n`;
    allModules.forEach(mod => {
      menu += `*${mod.order_index}.* ${mod.title}\n   _${mod.description.substring(0, 60)}..._\n\n`;
    });
    menu += `👉 _Answer with the number only (e.g. "1", "2")_\nOr type *0* to start any chapter without choosing.`;
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
      let menu = `⚠️ Invalid number ${choiceNum}. Please choose:\n\n`;
      allModules.forEach(mod => { menu += `*${mod.order_index}.* ${mod.title}\n`; });
      menu += `\nOr type *0* to start the first chapter.`;
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

    if (inputChar.startsWith('A') || inputChar === '1') userAnswerIndex = 0;
    else if (inputChar.startsWith('B') || inputChar === '2') userAnswerIndex = 1;
    else if (inputChar.startsWith('C') || inputChar === '3') userAnswerIndex = 2;
    else if (inputChar.startsWith('D') || inputChar === '4') userAnswerIndex = 3;

    if (userAnswerIndex === -1) {
      return `⚠️ Unknown answer. Please type only *A, B, C, D* (or *1, 2, 3, 4*) to answer this question:\n\n${q.question_text}`;
    }

    let responsePrefix = '';
    if (userAnswerIndex === q.correct_option) {
      session.score += q.points;
      responsePrefix = `✅ *Correct!* You earned *+${q.points}* points.\n\n`;
    } else {
      const correctText = q.options[q.correct_option];
      responsePrefix = `❌ *Incorrect!* The correct answer was: *${correctText}*.\n\n`;
    }

    session.current_index += 1;

    if (session.current_index < session.questions.length) {
      // Save updated session to DB and send next question
      await setSession(user, session);

      const nextQ = session.questions[session.current_index];
      let prompt = responsePrefix;
      prompt += `*Question ${session.current_index + 1}/${session.questions.length}:*\n${nextQ.question_text}\n\n`;
      nextQ.options.forEach(opt => { prompt += `${opt}\n`; });
      prompt += `\n👉 _Answer by typing only the letter (A, B, C, or D)._`;
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
        certText = `🏆 *SPECIAL CONGRATULATIONS!* You have been awarded the *Digital Certificate of Union Knowledge*! 📜\n\n`;
      }

      let summary = responsePrefix;
      summary += `🎉 *GAME COMPLETED!* 🎉\n\n`;
      summary += `You scored *${finalScore}* points in this chapter.\n`;
      summary += `Your total score is now *${user.points} points*.\n\n`;
      summary += certText;
      summary += `Type *QUIZ* to play again, *STORY* to read daily history lessons, or ask me another question! 🇹🇿`;
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
  return aiReply;
}

/**
 * Main entry point: updates user activity, handles message processing, logs everything, and broadcasts to dashboard.
 */
async function processMessage(user, messageText, channel) {
  try {
    // 1. Update user active status
    user.last_active_at = new Date();
    await user.save();
  } catch (err) {
    console.error('Error updating user activity status:', err);
  }

  // 2. Generate response text
  const replyText = await generateReplyText(user, messageText, channel);

  try {
    // 3. Log the interaction
    const chatLog = await ChatLog.create({
      user_id: user.id,
      channel,
      message_text: messageText,
      response_text: replyText
    });

    // 4. Live Broadcast via SSE
    const enrichedLog = await ChatLog.findByPk(chatLog.id, {
      include: [
        {
          model: User,
          attributes: ['full_name', 'phone_number']
        }
      ]
    });
    if (enrichedLog) {
      liveService.broadcastChatLog(enrichedLog);
    }
  } catch (err) {
    console.error('Error recording chat log or broadcasting live status:', err);
  }

  return replyText;
}

// ─────────────────────────────────────────────────────────────
//  WEBHOOK HANDLERS
// ─────────────────────────────────────────────────────────────

/**
 * Middleware to verify WhatsApp X-Hub-Signature-256 header.
 * Uses WHATSAPP_APP_SECRET to construct HMAC of the raw request body.
 */
exports.verifyWhatsAppSignature = (req, res, next) => {
  // If GET verification challenge, skip signature check
  if (req.method === 'GET') {
    return next();
  }

  const signatureHeader = req.headers['x-hub-signature-256'];
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.warn('[Security] WHATSAPP_APP_SECRET environment variable is missing. Webhook signature check was skipped.');
    return next();
  }

  if (!signatureHeader) {
    console.error('[Security] Missing X-Hub-Signature-256 header. Request rejected.');
    return res.status(401).send('X-Hub-Signature-256 header missing');
  }

  try {
    const parts = signatureHeader.split('=');
    const signature = parts[1];
    
    // Generate HMAC hash from rawBody parsed in server.js
    const hmac = crypto.createHmac('sha256', appSecret);
    const expectedSignature = hmac.update(req.rawBody || '').digest('hex');

    if (signature !== expectedSignature) {
      console.error('[Security] Invalid X-Hub-Signature-256! Signature mismatch.');
      return res.status(401).send('Signature mismatch');
    }

    next();
  } catch (err) {
    console.error('[Security] Error during WhatsApp webhook signature verification:', err);
    return res.status(500).send('Signature check error');
  }
};

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
        await whatsappService.sendWhatsAppMessage(from, '⏳ Please wait a moment before sending another message!');
        return;
      }

      console.log(`[WhatsApp IN ] ← From: +${from} | "${text}"`);

      const user = await getOrCreateUser(from, 'whatsapp');

      // FIX 3: Typing Indicator — user knows message was received
      // Only send for AI queries (not quiz answers or commands) to avoid double messages
      const isCommand = ['quiz', 'hadithi', 'story', 'leaderboard', 'msaada', 'help', 'pointi', 'points', 'amri', 'commands', 'anza', 'stop', 'cancel', 'exit'].some(cmd =>
        text.trim().toLowerCase().startsWith(cmd)
      );
      const isQuizAnswer = /^[abcd]$/i.test(text.trim());
      const isModuleChoice = /^\d+$/.test(text.trim());

      if (!isCommand && !isQuizAnswer && !isModuleChoice) {
        // Free-text AI question — send typing indicator first
        await whatsappService.sendWhatsAppMessage(from, '⏳ _Muungano Wetu AI is thinking... please wait a moment!_');
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

      // Anti-Spam Rate Limiter
      if (isRateLimited(chatId)) {
        console.log(`[Telegram] ⏳ Rate limited: ChatID ${chatId} — ignoring message`);
        await telegramService.sendTelegramMessage(chatId, '⏳ Please wait a moment before sending another message!');
        return res.sendStatus(200);
      }

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
      // Anti-Spam Rate Limiter
      if (isRateLimited(from)) {
        console.log(`[SMS] ⏳ Rate limited: +${from} — ignoring message`);
        await smsService.sendSMS(from, '⏳ Please wait a moment before sending another message!');
        return res.sendStatus(200);
      }

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
    return res.status(400).json({ message: 'Please fill in all details for the mock test' });
  }

  try {
    const user = await getOrCreateUser(identifier, channel);
    const reply = await processMessage(user, messageText, channel);
    res.json({ reply });
  } catch (error) {
    console.error('Error handling mock webchat:', error);
    res.status(500).json({ message: 'Chatbot error occurred while processing message' });
  }
};

/**
 * Controller webhook for Africa's Talking USSD API
 */
exports.handleUSSDWebhook = async (req, res) => {
  const { sessionId, phoneNumber, serviceCode, text } = req.body;

  if (!sessionId || !phoneNumber) {
    return res.status(400).send('Error: Missing USSD parameters');
  }

  try {
    console.log(`[USSD IN] Session: ${sessionId} | Phone: ${phoneNumber} | Input: "${text}"`);
    const response = await ussdService.handleUSSD(sessionId, phoneNumber, text || '');
    
    // USSD requires plain text Content-Type
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(response);
  } catch (error) {
    console.error('[USSD Webhook] Error:', error);
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('END System error occurred. Please try again.');
  }
};

