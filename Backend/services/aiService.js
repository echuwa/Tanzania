require('dotenv').config();
// NOTE: IPv4 DNS patch is applied globally in server.js — all fetch() calls here use IPv4 automatically.

// ============================================================
//  MUUNGANO WETU AI - AI Service
//  Tier 1: Groq (Llama 3.3 70B) - Ultra fast, ~0.5s response
//  Tier 2: Gemini 1.5 Flash      - Fallback if Groq fails
//  Tier 3: Local Keyword Engine  - Offline fallback
// ============================================================

const SYSTEM_PROMPT =
  "You are an AI chatbot named 'MUUNGANO WETU AI' 🇹🇿, and you respond using the unique Persona (voice, wisdom, and polite tone) of the Father of the Nation, Mwalimu Julius Kambarage Nyerere. " +
  "Your primary goal is to educate the youth about the history of the Union of Tanganyika and Zanzibar (officially formed on April 26, 1964), its prominent founders (Mwalimu Julius Nyerere and Mzee Abeid Amani Karume), its importance and benefits, the Articles of Union, and its current progress. " +
  "Speak using the wisdom, respect, and humble politeness of Mwalimu Nyerere (e.g., addressing the user with terms of endearment like 'My friend', 'My young compatriot', 'My child', 'Our nation', or using patriotic wisdom and African proverbs). " +
  "If the user disagrees, says 'NO...', or presents a different historical argument (AI Debate), do not reject them harshly; welcome them with respect, respond using solid historical facts, and encourage critical thinking with utmost gentlemanly politeness. " +
  "Detect the language of the user's message. If they message you in Kiswahili, you MUST respond in fluent, grammatically correct Kiswahili using the unique Persona of Mwalimu Nyerere. If they message you in English, respond in fluent English. Do not mix languages unless quoting standard Swahili proverbs. Always restrict your response to 80-150 words. " +
  "At the end of every response, add a short call-to-action such as: typing QUIZ, STORY, or asking another historical question. " +
  "Do not state false historical facts. If you do not know the answer, state it clearly and guide the user politely. " +
  "Be extremely factual and historical. Do not make up facts, dates, or names under any circumstances. If the user asks a question unrelated to Tanzania history or the Union, steer them back politely to the Union topic. Stick strictly to verified historical records of the United Republic of Tanzania.";

let cachedSystemPrompt = null;

async function getDynamicSystemPrompt() {
  if (cachedSystemPrompt) {
    return cachedSystemPrompt;
  }
  try {
    const { SystemSetting } = require('../models');
    const setting = await SystemSetting.findOne({ where: { key: 'SYSTEM_PROMPT' } });
    if (setting && setting.value) {
      cachedSystemPrompt = setting.value;
      return cachedSystemPrompt;
    }
  } catch (err) {
    console.error('[AI Service] Failed to retrieve system prompt from database:', err.message);
  }
  return SYSTEM_PROMPT;
}

function clearPromptCache() {
  console.log('[AI Service] System prompt cache cleared.');
  cachedSystemPrompt = null;
}

function getCurrentTimeContext() {
  const now = new Date();
  const options = { timeZone: 'Africa/Dar_es_Salaam', hour: 'numeric', minute: '2-digit', hour12: false };
  const timeString = new Intl.DateTimeFormat('en-GB', options).format(now);
  const hour = parseInt(timeString.split(':')[0], 10);

  let periodSwahili = 'asubuhi';
  let periodEnglish = 'morning';

  if (hour >= 12 && hour < 16) {
    periodSwahili = 'mchana';
    periodEnglish = 'afternoon';
  } else if (hour >= 16 && hour < 19) {
    periodSwahili = 'jioni';
    periodEnglish = 'evening';
  } else if (hour >= 19 || hour < 5) {
    periodSwahili = 'usiku';
    periodEnglish = 'night';
  }

  return `\n\n[TIME CONTEXT: Current time in Tanzania (East Africa Time - EAT) is ${timeString}. Time of day is ${periodSwahili} (${periodEnglish}). If you greet the user or mention the time of day, ALWAYS match this exact period: use "${periodSwahili}" for Swahili or "${periodEnglish}" for English. Do NOT say "habari za asubuhi" if it is mchana/jioni/usiku, and do NOT say "good morning" if it is afternoon/evening/night!]`;
}

// ─────────────────────────────────────────────
//  Pre-seeded facts for Tier 3 (offline engine)
// ─────────────────────────────────────────────
const HISTORICAL_FACTS = [
  {
    keywords: ['habari', 'mambo', 'hello', 'hi', 'yambo', 'karibu', 'hujambo', 'salamu', 'greetings', 'hey'],
    response:
      'Greetings, my young friend! 🇹🇿 Welcome to *MUUNGANO WETU AI*!\n\nI am your artificial intelligence assistant dedicated to educating you about our glorious Union. You can:\n\n🎯 Type *QUIZ* - Start the trivia game to earn points\n📚 Type *STORY* - Read today\'s historical daily story\n🏆 Type *LEADERBOARD* - See the leading patriotic youths\n\nOr ask me any historical question about Tanzania and the Union!'
  },
  {
    keywords: ['lini', 'tarehe', 'mwaka', 'anzishwa', 'ulianzishwa', 'when', 'date', 'year', 'established', 'formed'],
    response:
      'The Union of Tanganyika and Zanzibar was officially established on *April 26, 1964*. This is a historic day celebrated annually in Tanzania as Union Day. Type *QUIZ* to test your knowledge! 🎯'
  },
  {
    keywords: ['nani', 'waasisi', 'saini', 'nyerere', 'karume', 'who', 'founders', 'signed'],
    response:
      'The prominent founders of the Union of Tanzania are:\n\n👑 *Mwalimu Julius Kambarage Nyerere* - The first President of Tanganyika\n👑 *Mzee Abeid Amani Karume* - The first President of Zanzibar\n\nThey signed the Articles of Union on April 22, 1964, which was formally ratified on April 26, 1964. Type *QUIZ* to learn more! 🇹🇿'
  },
  {
    keywords: ['udongo', 'changanya', 'mchanganyiko', 'sherehe', 'soil', 'mix', 'mixing', 'ceremony'],
    response:
      'During the historic ceremony, founders Mwalimu Nyerere and Mzee Karume mixed soil from Tanganyika and Zanzibar in a single vessel—symbolizing eternal unity. This symbolic act remains a powerful emblem of the strength of our Union. Type *STORY* to read more! 📚'
  },
  {
    keywords: ['mambo ya muungano', 'mambo gani', 'idadi ya mambo', 'orodha', 'union matters', 'articles', 'list'],
    response:
      'Initially (1964), the Union Agreement had *11* Union Matters. They were later expanded. Examples include:\n\n1. The Constitution of the United Republic\n2. Foreign Affairs\n3. Defense and Security\n4. Police Force\n5. Citizenship\n6. Customs and Excise Tariffs\n\nType *QUIZ* to test your understanding! 🎯'
  },
  {
    keywords: ['faida', 'umuhimu', 'kwa nini', 'manufaa', 'lengo', 'benefits', 'importance', 'why', 'advantages'],
    response:
      'Our Union brings great benefits:\n\n🕊️ *Peace and Security* - Stability across East Africa\n🤝 *Brotherhood and Solidarity* - Unity of all citizens\n📈 *Economic Growth* - Free trade and resources sharing\n🌍 *Global Voice* - A strong, unified representation worldwide\n\nType *QUIZ* to learn more, my friend! 🇹🇿'
  },
  {
    keywords: ['zanzibar', 'tanganyika', 'mapinduzi', 'historia', 'revolution', 'independence', 'history'],
    response:
      'Key historical milestones:\n\n🗓️ *December 9, 1961* - Tanganyika gains independence (TANU / Nyerere)\n🗓️ *January 12, 1964* - Zanzibar Revolution (ASP / Karume)\n🗓️ *April 26, 1964* - The United Republic of Tanzania is declared\n\nOnly a few months passed between the revolution and the Union! Type *STORY* to read more! 📚'
  }
];

/**
 * Tier 3: Local offline database-driven fallback search
 */
async function getLocalFallbackResponse(message) {
  const cleanMsg = message.toLowerCase().trim();

  // 1. Static keywords matching
  for (const fact of HISTORICAL_FACTS) {
    for (const keyword of fact.keywords) {
      if (cleanMsg.includes(keyword)) {
        return fact.response;
      }
    }
  }

  // 2. Database search fallback
  try {
    const { DailyStory, Question } = require('../models');
    const { Op } = require('sequelize');

    // Look for matching daily stories
    const matchingStory = await DailyStory.findOne({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${cleanMsg}%` } },
          { content: { [Op.iLike]: `%${cleanMsg}%` } }
        ]
      },
      order: [['publish_date', 'DESC']]
    });

    if (matchingStory) {
      return (
        `📚 *[Muungano Wetu Offline - Story Found]*\n\n` +
        `*${matchingStory.title}*\n` +
        `${matchingStory.content.substring(0, 350)}${matchingStory.content.length > 350 ? '...' : ''}\n\n` +
        `_Note: We are operating in offline fallback mode. Type QUIZ or STORY to play._`
      );
    }

    // Look for matching quiz questions
    const matchingQuestion = await Question.findOne({
      where: {
        question_text: { [Op.iLike]: `%${cleanMsg}%` }
      },
      order: [['id', 'DESC']]
    });

    if (matchingQuestion) {
      const optionsText = matchingQuestion.options && Array.isArray(matchingQuestion.options)
        ? matchingQuestion.options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')
        : '';
      return (
        `🎯 *[Muungano Wetu Offline - Quiz Question Found]*\n\n` +
        `${matchingQuestion.question_text}\n\n` +
        `${optionsText}\n\n` +
        `_Note: We are operating in offline fallback mode. Type QUIZ or STORY to play._`
      );
    }
  } catch (dbErr) {
    console.error('[AI Service] Offline DB search failed:', dbErr.message);
  }

  // 3. Absolute fallback response
  return (
    'Ndugu mwananchi, habari! 🇹🇿 Kuhusu historia ya Muungano wetu:\n\n' +
    'Waasisi wetu Mwalimu Nyerere na Mzee Karume waliunganisha nchi zetu tarehe *26 Aprili 1964* ' +
    'ili kudumisha amani na udugu wetu wa kudumu.\n\n' +
    'Kwa sasa mifumo ya AI ipo offline, unaweza kuendelea kwa:\n' +
    '🎯 Kuandika *QUIZ* ili kuanza chemsha bongo\n' +
    '📚 Kuandika *STORY* ili kusoma hadithi ya leo ya kihistoria\n' +
    'Au uliza swali lingine la kihistoria!'
  );
}

/**
 * Tier 1: Groq AI (Llama 3.3 70B) - Primary, ultra-fast inference
 */
async function getGroqResponse(userMessage, contextHistory = []) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const systemPrompt = (await getDynamicSystemPrompt()) + getCurrentTimeContext();

  // Build OpenAI-compatible messages array
  const messages = [{ role: 'system', content: systemPrompt }];

  contextHistory.forEach(log => {
    messages.push({ role: 'user', content: log.message_text });
    messages.push({ role: 'assistant', content: log.response_text });
  });
  messages.push({ role: 'user', content: userMessage });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    signal: controller.signal,
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages,
      temperature: 0.2,
      max_tokens: 400,
      stream: false
    })
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq API error ${response.status}: ${err?.error?.message || 'Unknown'}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq');
  return text;
}

/**
 * Tier 2: Gemini 1.5 Flash - Secondary fallback
 */
async function getGeminiResponse(userMessage, contextHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const systemPrompt = (await getDynamicSystemPrompt()) + getCurrentTimeContext();

  const contents = [];
  contextHistory.forEach(log => {
    contents.push({ role: 'user', parts: [{ text: log.message_text }] });
    contents.push({ role: 'model', parts: [{ text: log.response_text }] });
  });
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      contents,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.2, maxOutputTokens: 400 }
    })
  });
  clearTimeout(timeoutId);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty or unexpected Gemini response');
  return text;
}

/**
 * Main exported function — 3-tier AI engine
 * Tier 1: Groq → Tier 2: Gemini → Tier 3: Local
 */
async function getAIResponse(userMessage, contextHistory = []) {
  // ── Tier 1: Groq ──────────────────────────────────────────
  if (process.env.GROQ_API_KEY) {
    try {
      console.log('[AI Service] Trying Groq (Llama 3.3 70B)...');
      const reply = await getGroqResponse(userMessage, contextHistory);
      console.log('[AI Service] ✅ Groq responded successfully.');
      return reply;
    } catch (err) {
      console.warn(`[AI Service] ⚠️ Groq failed: ${err.message}. Trying Gemini...`);
    }
  } else {
    console.log('[AI Service] GROQ_API_KEY not found. Skipping Groq.');
  }

  // ── Tier 2: Gemini ────────────────────────────────────────
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('[AI Service] Trying Gemini 1.5 Flash...');
      const reply = await getGeminiResponse(userMessage, contextHistory);
      console.log('[AI Service] ✅ Gemini responded successfully.');
      return reply;
    } catch (err) {
      console.warn(`[AI Service] ⚠️ Gemini failed: ${err.message}. Using local fallback...`);
    }
  } else {
    console.log('[AI Service] GEMINI_API_KEY not found. Skipping Gemini.');
  }

  // ── Tier 3: Local offline engine ─────────────────────────
  console.log('[AI Service] 🔄 Using Local Offline Fallback Engine.');
  return await getLocalFallbackResponse(userMessage);
}

module.exports = { getAIResponse, clearPromptCache };
