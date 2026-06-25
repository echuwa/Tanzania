require('dotenv').config();

// Pre-seeded historical facts for the local offline fallback AI engine
const HISTORICAL_FACTS = [
  {
    keywords: ['habari', 'mambo', 'hello', 'mambo vipi', 'hi', 'yambo', 'karibu', 'hujambo'],
    response: 'Habari ya kijana! Karibu kwenye **MUUNGANO WETU AI** 🇹🇿. Mimi ni msaidizi wako wa akili bandia wa kuelimisha kuhusu Muungano wetu mtukufu. unaweza:\n1. Kuniuliza swali lolote kuhusu historia ya Muungano.\n2. Kuandika **QUIZ** ili kuanza mchezo wa maswali na kupata pointi.\n3. Kuandika **HADITHI** ili kupata hadithi ya leo ya kihistoria.\n4. Kuandika **LEADERBOARD** kuona vijana wanaoongoza kwa alama.'
  },
  {
    keywords: ['lini', 'tarehe', 'mwaka', 'kuzaliwa', 'anzishwa'],
    response: 'Muungano wa Tanganyika na Zanzibar ulianzishwa rasmi tarehe **26 Aprili 1964**. Kila mwaka tarehe hii huadhimishwa kama Siku ya Muungano nchini Tanzania.'
  },
  {
    keywords: ['nani', 'waasisi', 'saini', 'nyerere', 'karume'],
    response: 'Waasisi wa Muungano wa Tanzania ni **Mwalimu Julius Kambarage Nyerere** (Rais wa kwanza wa Tanganyika) na **Mzee Abeid Amani Karume** (Rais wa kwanza wa Zanzibar). Walisaini Mkataba wa Muungano tarehe 22 Aprili 1964 na ukapitishwa rasmi tarehe 26 Aprili 1964.'
  },
  {
    keywords: ['udongo', 'changanya', 'mchanganyiko'],
    response: 'Katika sherehe za kihistoria za Muungano, waasisi Mwalimu Nyerere na Mzee Karume walichanganya udongo kutoka Tanganyika na udongo kutoka Zanzibar kwenye chombo kimoja huko Mnazi Mmoja (Zanzibar) na Karimjee (Dar es Salaam) kuashiria kuwa nchi hizi mbili zimekuwa moja na hazitatengana milele.'
  },
  {
    keywords: ['mambo ya muungano', 'mambo gani', 'idadi ya mambo', 'orodha ya mambo'],
    response: 'Hapo awali mwaka 1964, kulikuwa na mambo **11** tu ya Muungano katika Mkataba. Baadaye mambo haya yaliongezeka kulingana na mahitaji ya nchi. Mifano ya mambo ya Muungano ni:\n1. Katiba ya Jamhuri ya Muungano\n2. Mambo ya Nje\n3. Ulinzi na Usalama\n4. Polisi\n5. Uraia\n6. Ushuru wa Forodha na Mapato ya Ndani.'
  },
  {
    keywords: ['faida', 'umuhimu', 'kwa nini', 'manufaa'],
    response: 'Muungano wetu una faida nyingi, ikiwa ni pamoja na:\n1. **Amani na Usalama:** Kujenga nchi imara na yenye utulivu mkubwa katika ukanda wa Afrika Mashariki.\n2. **Udugu na Mshikamano:** Kuunganisha wananchi wa Tanganyika na Zanzibar kijamii na kiutamaduni.\n3. **Ukuaji wa Kiuchumi:** Kuruhusu mwingiliano huru wa biashara, watu, na rasilimali kati ya pande zote mbili.'
  },
  {
    keywords: ['zanzibar', 'tanganyika', 'historia ya zanzibar', 'mapinduzi'],
    response: 'Kabla ya Muungano, kulikuwa na Mapinduzi ya Zanzibar ya tarehe **12 Januari 1964** yaliyomwondoa Sultani na kuleta utawala wa wananchi wenyewe chini ya ASP na Mzee Abeid Karume. Tanganyika ilipata uhuru wake tarehe **9 Desemba 1961** chini ya TANU na Mwalimu Nyerere. Muungano ulitokea miezi michache baada ya Mapinduzi ya Zanzibar.'
  }
];

/**
 * Fallback response using simple local regex / keyword matching
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

  return 'Asante kwa swali lako! Kuhusu historia ya Muungano wetu: Waasisi wetu Mwalimu Nyerere na Mzee Karume waliungana tarehe 26 Aprili 1964 ili kulinda uhuru wetu na kujenga udugu. \n\nUnaweza kuandika **QUIZ** kuanza mchezo wa maswali, au **HADITHI** kusoma ya leo, au uniulize swali lingine maalum kuhusu Muungano kama vile "nani alisaini muungano?"';
}

/**
 * Main AI Query Service
 */
async function getAIResponse(userMessage, contextHistory = []) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // If no API key, use the local pre-seeded Kiswahili engine
    console.log('[AI Service] GEMINI_API_KEY not found. Using Local Fallback Engine.');
    return getLocalFallbackResponse(userMessage);
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    // System Instruction to feed Gemini the personality and target behavior
    const systemInstruction = 
      "Wewe ni chatbot ya AI inayoitwa 'MUUNGANO WETU AI'. Kazi yako ni kuelimisha vijana wa Tanzania kuhusu historia ya Muungano wa Tanganyika na Zanzibar (tarehe 26 Aprili 1964), waasisi wake (Julius Nyerere na Abeid Amani Karume), umuhimu wake, na mambo ya Muungano. Unapaswa kujibu kwa Kiswahili rahisi, cha kuvutia na kifupi sana (kisichozidi maneno 80-100). Kuwa na mtindo wa kirafiki. Kama mtumiaji anataka kuanza quiz, mwambie aandike 'QUIZ'.";

    // Format chat context history
    const contents = [];
    
    // Add history in Gemini format
    contextHistory.forEach(log => {
      contents.push({
        role: 'user',
        parts: [{ text: log.message_text }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: log.response_text }]
      });
    });

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 250
        }
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.warn('[AI Service] Unexpected Gemini Response structure:', JSON.stringify(data));
      return getLocalFallbackResponse(userMessage);
    }
  } catch (error) {
    console.error('[AI Service] Error contacting Gemini API:', error);
    return getLocalFallbackResponse(userMessage);
  }
}

module.exports = {
  getAIResponse
};
