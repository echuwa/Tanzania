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
  "Respond in clean, clear, and engaging English (strictly keep it between 80-150 words). " +
  "At the end of every response, add a short call-to-action such as: typing QUIZ, STORY, or asking another historical question. " +
  "Do not state false historical facts. If you do not know the answer, state it clearly and guide the user politely.";

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
 * Tier 3: Local offline keyword fallback
 */
function getLocalFallbackResponse(message) {
  const cleanMsg = message.toLowerCase().trim();
  for (const fact of HISTORICAL_FACTS) {
    for (const keyword of fact.keywords) {
      if (cleanMsg.includes(keyword)) {
        return fact.response;
      }
    }
  }
  return (
    'Thank you for your question, my young compatriot! 🇹🇿 Regarding the history of our Union:\n\n' +
    'Our founders Mwalimu Nyerere and Mzee Karume united our countries on *April 26, 1964* ' +
    'to safeguard our freedom and foster permanent brotherhood.\n\n' +
    'You can:\n🎯 Type *QUIZ* to start a trivia game\n📚 Type *STORY* to read today\'s lesson\n' +
    'Or ask me a specific question, such as: "Who signed the Union?"'
  );
}

/**
 * Tier 1: Groq AI (Llama 3.3 70B) - Primary, ultra-fast inference
 */
async function getGroqResponse(userMessage, contextHistory = []) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  // Build OpenAI-compatible messages array
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];

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
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
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
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
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
  return getLocalFallbackResponse(userMessage);
}

module.exports = { getAIResponse };
