import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Smartphone, ArrowRight } from 'lucide-react';
import { translations } from '../utils/translations';

export default function ChatSimulator({ API_BASE, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [simChannel, setSimChannel] = useState('whatsapp');
  const [simUser, setSimUser] = useState('+255748230014');
  const [simMessage, setSimMessage] = useState('');
  const [simChat, setSimChat] = useState([
    {
      sender: 'bot',
      text: 'Greetings! Welcome to **MUUNGANO WETU AI** 🇹🇿. I am your AI assistant dedicated to educating you about our glorious Union.\n\nYou can:\n1. Ask me any question about the history of the Union.\n2. Type **QUIZ** to start the trivia game and earn points.\n3. Type **STORY** to receive today\'s historical lesson.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simChat]);

  const handleSimSend = async (e) => {
    e.preventDefault();
    if (!simMessage.trim() || loading) return;

    const userText = simMessage.trim();
    setSimMessage('');
    setLoading(true);

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message
    setSimChat(prev => [...prev, { sender: 'user', text: userText, time: currentTime }]);

    try {
      const res = await fetch(`${API_BASE}/chatbot/mock-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: simUser,
          messageText: userText,
          channel: simChannel
        })
      });
      const data = await res.json();
      const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (res.ok) {
        setSimChat(prev => [...prev, { sender: 'bot', text: data.reply, time: botTime }]);
      } else {
        setSimChat(prev => [...prev, { sender: 'bot', text: `❌ ${language === 'sw' ? 'Hitilafu' : 'Error'}: ${data.message || (language === 'sw' ? 'Imeshindwa kupata jibu' : 'Failed to retrieve response')}`, time: botTime }]);
      }
    } catch (err) {
      console.error(err);
      setSimChat(prev => [...prev, { sender: 'bot', text: language === 'sw' ? '❌ Imeshindwa kuwasiliana na seva.' : '❌ Failed to reach the server.', time: currentTime }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          {t('sim_title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('sim_subtitle')}
        </p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '32px', alignItems: 'start' }}>
        {/* Simulator settings */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Smartphone size={20} style={{ color: 'var(--primary)' }} />
            {language === 'sw' ? 'Mipangilio ya Simulator' : 'Simulator Settings'}
          </h3>

          <div className="input-group">
            <label className="input-label">
              {language === 'sw' ? 'Njia ya Mawasiliano (Channel)' : 'Communication Channel'}
            </label>
            <select
              className="input-field"
              value={simChannel}
              onChange={(e) => setSimChannel(e.target.value)}
              style={{ background: 'rgba(15, 17, 28, 0.9)' }}
            >
              <option value="whatsapp">WhatsApp Business</option>
              <option value="telegram">Telegram Bot</option>
              <option value="sms">SMS Channel</option>
              <option value="ussd">USSD Dial Mode</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">{t('sim_phone_label')}</label>
            <input
              type="text"
              className="input-field"
              value={simUser}
              onChange={(e) => setSimUser(e.target.value)}
              placeholder="+255748230014"
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {language === 'sw' 
                ? 'Namba hii itatumika kutengeneza profile ya mtumiaji kwenye DB ya majaribio.' 
                : 'This phone number will be used to simulate a user session in the database.'}
            </span>
          </div>

          <div style={{
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            padding: '16px',
            borderRadius: '10px',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            color: 'var(--text-secondary)'
          }}>
            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
              {language === 'sw' ? '💡 Vidokezo vya Kujaribu:' : '💡 Simulator Tips:'}
            </strong>
            {language === 'sw' ? (
              <>
                1. Andika <strong>QUIZ</strong> kuanza chemsha bongo.<br/>
                2. Andika <strong>STORY</strong> kusoma hadithi ya leo.<br/>
                3. Uliza swali lolote la kihistoria, mfano: <i>"Nani aliunda chama cha ASP?"</i> au <i>"Unasemaje kuhusu muungano wetu?"</i>
              </>
            ) : (
              <>
                1. Type <strong>QUIZ</strong> to trigger a trivia challenge question.<br/>
                2. Type <strong>STORY</strong> to trigger today\'s historical lesson.<br/>
                3. Ask any historical question, e.g., <i>"Who was the first president of Zanzibar?"</i>
              </>
            )}
          </div>
        </div>

        {/* Smartphone Casing Simulator */}
        <div>
          <div className="smartphone-container">
            <div className="smartphone-notch"></div>
            <div className="smartphone-screen">
              {/* Simulator Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                paddingBottom: '10px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '10px'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--success)'
                }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Muungano Wetu AI</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mwalimu Nyerere Persona</div>
                </div>
                <span className="badge badge-whatsapp" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                  {simChannel}
                </span>
              </div>

              {/* Chat Messages */}
              <div className="chat-messages">
                <div className="chat-bubble channel-info">
                  {language === 'sw' 
                    ? `Mwanzo wa majaribio ya mazungumzo kupitia njia ya ${simChannel.toUpperCase()}.` 
                    : `Start of simulated chat session via ${simChannel.toUpperCase()} channel.`}
                </div>

                {simChat.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`chat-bubble ${msg.sender}`}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {msg.text}
                    <div style={{
                      fontSize: '0.65rem',
                      color: 'rgba(255, 255, 255, 0.4)',
                      textAlign: 'right',
                      marginTop: '4px'
                    }}>
                      {msg.time}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="chat-bubble bot" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ animation: 'bounce 1.4s infinite ease-in-out' }}>•</span>
                    <span style={{ animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.2s' }}>•</span>
                    <span style={{ animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.4s' }}>•</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSimSend} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={t('sim_input_placeholder')}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  style={{ borderRadius: '20px', padding: '10px 16px', fontSize: '0.875rem', flex: 1 }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  disabled={loading}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
