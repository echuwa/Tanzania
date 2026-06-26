const { User, Module, Question, DailyStory, ChatLog, QuizAttempt } = require('../models');
const aiService = require('../services/aiService');
const whatsappService = require('../services/whatsappService');
const telegramService = require('../services/telegramService');
const smsService = require('../services/smsService');

// In-memory store for active sessions
// Quiz state: { state: 'quiz', module_id, questions: [], current_index, score }
// Module selection state: { state: 'choosing_module' }
const activeSessions = new Map();

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
  const userId = user.id;
  const questions = await Question.findAll({
    where: { module_id: module.id },
    order: [['id', 'ASC']]
  });

  if (questions.length === 0) {
    return `⚠️ Samahani! Moduli "${module.title}" haina maswali kwa sasa. Jaribu moduli nyingine au andika **QUIZ** tena.`;
  }

  // Set new quiz session state
  const session = {
    state: 'quiz',
    module_id: module.id,
    questions,
    current_index: 0,
    score: 0
  };
  activeSessions.set(userId, session);

  const q = questions[0];
  let prompt = `🎯 **MCHEZO WA MASWALI UMEANDALIWA!** 🎯\n\n`;
  prompt += `📖 **Sura: ${module.order_index}. ${module.title}**\n`;
  prompt += `${module.description}\n\n`;
  prompt += `**Swali la 1/${questions.length}:**\n${q.question_text}\n\n`;
  q.options.forEach(opt => {
    prompt += `${opt}\n`;
  });
  prompt += `\n👉 *Jibu kwa kuandika herufi ya jibu sahihi pekee (A, B, C, au D).*`;
  return prompt;
}

/**
 * Main state machine processor
 * Returns the text response that needs to be sent to the user
 */
async function processMessage(user, messageText, channel) {
  const cleanMsg = messageText.trim().toLowerCase();
  const userId = user.id;

  // Retrieve or initialize session
  let session = activeSessions.get(userId);

  // --- COMMAND: MSAADA / HELP ---
  if (cleanMsg === 'msaada' || cleanMsg === 'help' || cleanMsg === 'amri' || cleanMsg === 'commands') {
    activeSessions.delete(userId);
    return `ℹ️ **MSAADA WA MUUNGANO WETU AI** 🇹🇿\n\nAmri zinazoweza kutumika:\n\n🎯 **QUIZ** - Anza mchezo wa maswali (chagua moduli)\n📚 **HADITHI** - Soma hadithi ya kihistoria ya leo\n🏆 **LEADERBOARD** - Angalia vijana wanaoongoza kwa alama\n⭐ **POINTI** - Angalia alama zako za sasa\n\n*Au niulize swali lolote la kihistoria ya Muungano kwa Kiswahili!*\n\nMf: "Muungano ulianzishwa lini?", "Nani walisaini muungano?"\n\nAlama zako za sasa: **${user.points} pts** 🏅`;
  }

  // --- COMMAND: LEADERBOARD ---
  if (cleanMsg === 'leaderboard' || cleanMsg === 'pointi zangu' || cleanMsg === 'pointi') {
    // Clear quiz state if active
    activeSessions.delete(userId);
    
    const topUsers = await User.findAll({
      where: { role: 'user' },
      order: [['points', 'DESC']],
      limit: 5,
      attributes: ['full_name', 'points', 'phone_number', 'telegram_id']
    });

    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    let board = `🏆 **LEADERBOARD YA MUUNGANO WETU AI** 🏆\n\n`;
    topUsers.forEach((u, i) => {
      const name = u.full_name || 'Kijana Uzalendo';
      const id = u.phone_number || `Telegram:${String(u.telegram_id).substring(0, 5)}***`;
      board += `${medals[i] || `${i+1}.`} ${name} (${id}) - **${u.points} pts**\n`;
    });
    
    if (topUsers.length === 0) {
      board += `Bado hakuna washiriki. Kuwa wa kwanza kuanza!\n`;
    }
    board += `\nAlama zako za sasa: **${user.points} pts** 🏅\n\nAndika **QUIZ** kucheza mchezo wa maswali au uliza swali lolote la kihistoria!`;
    return board;
  }

  // --- COMMAND: HADITHI ---
  if (cleanMsg === 'hadithi' || cleanMsg === 'hadithi ya leo') {
    activeSessions.delete(userId);
    const today = new Date().toISOString().split('T')[0];
    const story = await DailyStory.findOne({ where: { publish_date: today } });
    
    if (story) {
      return `📚 **HADITHI YA LEO: ${story.title}** 📚\n\n${story.content}\n\n---\n*Kama umeipenda hadithi hii, unaweza kuandika **QUIZ** ili kupima uelewa wako, au kuniuliza maswali zaidi ya hadithi hii!*`;
    } else {
      // Fallback to latest story
      const latestStory = await DailyStory.findOne({ order: [['publish_date', 'DESC']] });
      if (latestStory) {
        return `📚 **HADITHI YETU YA HISTORIA: ${latestStory.title}** 📚\n\n${latestStory.content}\n\n---\n*Andika **QUIZ** kupima uelewa wako au uliza swali lolote!*`;
      }
      return '⚠️ Samahani! Hakuna hadithi iliyotayarishwa kwa siku ya leo. Tafadhali andika **QUIZ** ili kucheza au uulize swali lolote la kihistoria!';
    }
  }

  // --- COMMAND: QUIZ (Show module menu or start directly) ---
  // Pattern: 'quiz', 'anza', 'quiz 1', 'anza quiz 2' etc.
  const quizMatch = cleanMsg.match(/^(?:quiz|anza quiz|anza)(\s+(\d+))?$/);
  if (quizMatch) {
    activeSessions.delete(userId);
    const chosenNumber = quizMatch[2] ? parseInt(quizMatch[2]) : null;

    // Fetch all available modules
    const allModules = await Module.findAll({ order: [['order_index', 'ASC']] });
    if (!allModules || allModules.length === 0) {
      return '⚠️ Samahani, moduli za masomo bado hazijawekwa kwenye mfumo. Wasiliana na msimamizi!';
    }

    // If user specified a module number directly (e.g. 'quiz 2')
    if (chosenNumber !== null) {
      const targetModule = allModules.find(m => m.order_index === chosenNumber);
      if (!targetModule) {
        return `⚠️ Moduli namba ${chosenNumber} haipatikani. Tafadhali chagua namba kati ya 1 na ${allModules.length}.`;
      }
      return await startQuizForModule(user, targetModule);
    }

    // If only one module, start it directly
    if (allModules.length === 1) {
      return await startQuizForModule(user, allModules[0]);
    }

    // Show module selection menu
    activeSessions.set(userId, { state: 'choosing_module' });
    let menu = `🎯 **CHAGUA SURA YA QUIZ** 🎯\n\nUnapenda kujifunza kuhusu nini? Andika namba ya sura:\n\n`;
    allModules.forEach(mod => {
      menu += `*${mod.order_index}.* ${mod.title}\n   _${mod.description.substring(0, 60)}..._\n\n`;
    });
    menu += `👉 *Jibu kwa namba pekee (mf. "1", "2", n.k.)*\nAu andika **0** kucheza sura yoyote bila kuchagua.`;
    return menu;
  }

  // --- STATE: CHOOSING MODULE ---
  if (session && session.state === 'choosing_module') {
    const choiceNum = parseInt(cleanMsg);
    const allModules = await Module.findAll({ order: [['order_index', 'ASC']] });

    if (choiceNum === 0) {
      // Start the first module
      activeSessions.delete(userId);
      return await startQuizForModule(user, allModules[0]);
    }

    const chosen = allModules.find(m => m.order_index === choiceNum);
    if (!chosen) {
      let menu = `⚠️ Namba ${choiceNum} si sahihi. Tafadhali chagua:\n\n`;
      allModules.forEach(mod => { menu += `*${mod.order_index}.* ${mod.title}\n`; });
      menu += `\nAu andika **0** kuanza sura ya kwanza.`;
      return menu;
    }

    activeSessions.delete(userId);
    return await startQuizForModule(user, chosen);
  }

  // --- STATE: ACTIVE QUIZ ---
  if (session && session.state === 'quiz') {
    const q = session.questions[session.current_index];
    
    // Map input letter to option index (A -> 0, B -> 1, C -> 2, D -> 3)
    let userAnswerIndex = -1;
    const inputChar = cleanMsg.toUpperCase().trim();

    if (inputChar.startsWith('A')) userAnswerIndex = 0;
    else if (inputChar.startsWith('B')) userAnswerIndex = 1;
    else if (inputChar.startsWith('C')) userAnswerIndex = 2;
    else if (inputChar.startsWith('D')) userAnswerIndex = 3;

    if (userAnswerIndex === -1) {
      // User entered invalid format, prompt them again
      return `⚠️ Jibu lisilojulikana. Tafadhali andika herufi **A, B, C, au D** kujibu swali hili:\n\n${q.question_text}`;
    }

    let responsePrefix = '';
    if (userAnswerIndex === q.correct_option) {
      session.score += q.points;
      responsePrefix = `✅ **Sahihi kabisa!** Umejipatia alama **+${q.points}**.\n\n`;
    } else {
      const correctText = q.options[q.correct_option];
      responsePrefix = `❌ **Si Sahihi!** Jibu sahihi lilikuwa: **${correctText}**.\n\n`;
    }

    // Move to next question
    session.current_index += 1;

    if (session.current_index < session.questions.length) {
      // Send next question
      const nextQ = session.questions[session.current_index];
      activeSessions.set(userId, session); // update session in memory

      let prompt = responsePrefix;
      prompt += `**Swali la ${session.current_index + 1}/${session.questions.length}:**\n${nextQ.question_text}\n\n`;
      nextQ.options.forEach(opt => {
        prompt += `${opt}\n`;
      });
      prompt += `\n👉 *Jibu kwa kuandika herufi pekee (A, B, C, au D).*`;
      return prompt;
    } else {
      // Quiz completed!
      const finalScore = session.score;
      const moduleId = session.module_id;
      
      // Save attempt to database
      await QuizAttempt.create({
        user_id: userId,
        module_id: moduleId,
        score: finalScore,
        completed: true
      });

      // Update user points in database
      user.points += finalScore;
      await user.save();

      // Clear the session state
      activeSessions.delete(userId);

      // Generate a digital certificate concept statement if they got a high score
      let certText = '';
      if (finalScore >= 20) {
        certText = `🏆 **PONGEZI ZA KIPEKEE!** Umetuzwa **Hati ya Dijitali ya Maarifa ya Muungano**! 📜 unaweza kuiona kwenye dashboard yako.\n\n`;
      }

      let summary = responsePrefix;
      summary += `🎉 **MCHEZO UMEKAMILIKA!** 🎉\n\n`;
      summary += `Umesajili alama **${finalScore}** katika sura hii.\n`;
      summary += `Jumla ya alama zako zote za sasa ni **${user.points} points**.\n\n`;
      summary += certText;
      summary += `Unaweza kuandika **QUIZ** kucheza tena, **HADITHI** kusoma habari za kihistoria, au uniulize swali lingine lolote kuhusu Muungano.`;
      return summary;
    }
  }

  // --- STATE: NORMAL CONVERSATION (Call AI) ---
  // Retrieve recent logs for conversational context (last 3 exchanges)
  const recentLogs = await ChatLog.findAll({
    where: { user_id: userId },
    order: [['createdAt', 'DESC']],
    limit: 3,
    attributes: ['message_text', 'response_text']
  });
  
  // Reversing to make it chronological
  recentLogs.reverse();

  // Call Gemini/AI engine
  const aiReply = await aiService.getAIResponse(messageText, recentLogs);

  // Save log in database asynchronously
  await ChatLog.create({
    user_id: userId,
    channel,
    message_text: messageText,
    response_text: aiReply
  });

  return aiReply;
}

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

  // ✅ CRITICAL FIX: Respond to Meta IMMEDIATELY (within 5s timeout window)
  // Meta will retry if it doesn't get 200 fast. Process everything in the background.
  res.sendStatus(200);

  // --- Process in background (after response is already sent) ---
  try {
    console.log('Incoming WhatsApp Webhook Payload:', JSON.stringify(req.body, null, 2));
    const entry = req.body.entry;
    if (entry && entry[0] && entry[0].changes && entry[0].changes[0] && entry[0].changes[0].value.messages) {
      const message = entry[0].changes[0].value.messages[0];
      const from = message.from; // Phone number
      const text = message.text ? message.text.body : '';

      if (text) {
        const user = await getOrCreateUser(from, 'whatsapp');
        const reply = await processMessage(user, text, 'whatsapp');
        await whatsappService.sendWhatsAppMessage(from, reply);
        console.log(`[WhatsApp] ✅ Reply sent to ${from}`);
      }
    }
  } catch (error) {
    console.error('Error handling WhatsApp webhook (background):', error);
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
      
      // Update full name if available in Telegram message
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
