require('dotenv').config();
// NOTE: IPv4 DNS patch is applied globally in server.js — all fetch() calls here use IPv4 automatically.

// ============================================================
//  MUUNGANO WETU AI - AI Service
//  Tier 1: Groq (Llama 3.3 70B) - Ultra fast, ~0.5s response
//  Tier 2: Gemini 1.5 Flash      - Fallback if Groq fails
//  Tier 3: Local Keyword Engine  - Offline fallback
// ============================================================

const SYSTEM_PROMPT =
  "Wewe ni chatbot ya AI inayoitwa 'MUUNGANO WETU AI' 🇹🇿, na unajibu kwa kutumia Persona (Sauti, Hekima, na Tone ya kipekee) ya Baba wa Taifa, Mwalimu Julius Kambarage Nyerere. " +
  "Kazi yako kuu ni kuelimisha vijana wa Tanzania kuhusu historia ya Muungano wa Tanganyika na Zanzibar (ulioundwa rasmi tarehe 26 Aprili 1964), waasisi wake mashuhuri (Mwalimu Julius Nyerere na Mzee Abeid Amani Karume), umuhimu na faida zake, mambo ya Muungano, na mwelekeo wake wa sasa. " +
  "Zungumza kwa kutumia maneno ya hekima, adabu, na staha ya Mwalimu Nyerere (mfano: kutumia maneno kama 'Ndugu yangu', 'Kijana wangu', 'Nchi yetu', au methali na hekima za kizalendo). " +
  "Ikiwa mtumiaji atapinga, kusema 'HAPANA...', au kuleta hoja tofauti ya kihistoria (Debati ya AI), usikatae kwa ukali; mpokee kwa heshima, mjibu kwa hoja zenye mashiko ya kihistoria, na mhimize kufikiri kwa kina (critical thinking) kwa heshima kubwa ya kiungwana. " +
  "Jibu kwa Kiswahili safi na cha kuvutia (maneno 80-150 tu). " +
  "Mwisho wa kila jibu, ongeza wito mfupi wa kutenda kama: kuandika QUIZ, HADITHI, au kuuliza swali lingine la kihistoria. " +
  "Usiseme mambo ya uongo. Kama hujui, sema wazi na mwelekeze mtumiaji vizuri.";

// ─────────────────────────────────────────────
//  Pre-seeded facts for Tier 3 (offline engine)
// ─────────────────────────────────────────────
const HISTORICAL_FACTS = [
  {
    keywords: ['habari', 'mambo', 'hello', 'hi', 'yambo', 'karibu', 'hujambo', 'salamu'],
    response:
      'Habari ya kijana! 🇹🇿 Karibu kwenye *MUUNGANO WETU AI*!\n\nMimi ni msaidizi wako wa akili bandia wa kuelimisha kuhusu Muungano wetu mtukufu. Unaweza:\n\n🎯 Andika *QUIZ* - Mchezo wa maswali na pointi\n📚 Andika *HADITHI* - Hadithi ya leo ya kihistoria\n🏆 Andika *LEADERBOARD* - Vijana wanaoongoza\n\nAu niulize swali lolote la historia ya Tanzania!'
  },
  {
    keywords: ['lini', 'tarehe', 'mwaka', 'anzishwa', 'ulianzishwa'],
    response:
      'Muungano wa Tanganyika na Zanzibar ulianzishwa rasmi tarehe *26 Aprili 1964*. Hii ni siku ya kihistoria ambayo huadhimishwa kila mwaka nchini Tanzania kama Siku ya Muungano. Andika *QUIZ* kupima maarifa yako! 🎯'
  },
  {
    keywords: ['nani', 'waasisi', 'saini', 'nyerere', 'karume'],
    response:
      'Waasisi wa Muungano wa Tanzania ni:\n\n👑 *Mwalimu Julius Kambarage Nyerere* - Rais wa kwanza wa Tanganyika\n👑 *Mzee Abeid Amani Karume* - Rais wa kwanza wa Zanzibar\n\nWalisaini Mkataba wa Muungano tarehe 22 Aprili 1964, ulioidhinishwa rasmi tarehe 26 Aprili 1964. Andika *QUIZ* kujua zaidi! 🇹🇿'
  },
  {
    keywords: ['udongo', 'changanya', 'mchanganyiko', 'sherehe'],
    response:
      'Katika sherehe za kihistoria, waasisi Mwalimu Nyerere na Mzee Karume walichanganya udongo kutoka Tanganyika na Zanzibar kwenye chombo kimoja - kuashiria umoja wa milele. Tendo hili la mfano linabaki kuwa ishara ya nguvu ya Muungano wetu. Andika *HADITHI* kusoma zaidi! 📚'
  },
  {
    keywords: ['mambo ya muungano', 'mambo gani', 'idadi ya mambo', 'orodha'],
    response:
      'Awali (1964) Mkataba ulikuwa na mambo *11* ya Muungano. Baadaye yaliongezeka. Mifano:\n\n1. Katiba ya Jamhuri ya Muungano\n2. Mambo ya Nje\n3. Ulinzi na Usalama\n4. Polisi\n5. Uraia\n6. Ushuru wa Forodha\n\nAndika *QUIZ* kupima maarifa yako! 🎯'
  },
  {
    keywords: ['faida', 'umuhimu', 'kwa nini', 'manufaa', 'lengo'],
    response:
      'Muungano wetu una faida kubwa:\n\n🕊️ *Amani na Usalama* - Utulivu katika Afrika Mashariki\n🤝 *Udugu na Mshikamano* - Umoja wa wananchi wote\n📈 *Ukuaji wa Kiuchumi* - Biashara huru na rasilimali\n🌍 *Nguvu Kimataifa* - Sauti moja kubwa duniani\n\nAndika *QUIZ* kujifunza zaidi! 🇹🇿'
  },
  {
    keywords: ['zanzibar', 'tanganyika', 'mapinduzi', 'historia'],
    response:
      'Historia ya msingi:\n\n🗓️ *9 Desemba 1961* - Tanganyika inapata uhuru (TANU / Nyerere)\n🗓️ *12 Januari 1964* - Mapinduzi ya Zanzibar (ASP / Karume)\n🗓️ *26 Aprili 1964* - Muungano wa Tanzania unatangazwa\n\nMiezi michache tu ilipita kati ya mapinduzi na Muungano! Andika *HADITHI* kusoma zaidi! 📚'
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
    'Asante kwa swali lako! 🇹🇿 Kuhusu historia ya Muungano wetu:\n\n' +
    'Waasisi wetu Mwalimu Nyerere na Mzee Karume waliungana tarehe *26 Aprili 1964* ' +
    'ili kulinda uhuru wetu na kujenga udugu wa kudumu.\n\n' +
    'Unaweza:\n🎯 Andika *QUIZ* kuanza mchezo wa maswali\n📚 Andika *HADITHI* kusoma ya leo\n' +
    'Au niulize swali maalum kama: "Nani alisaini muungano?"'
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
