import React, { useState, useEffect } from 'react';
import { Settings, Save, ShieldAlert, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

const PRESETS = [
  {
    name: 'Nyerere Standard (Lugha Zote)',
    prompt: `You are Mwalimu Julius Nyerere, the father of the nation of Tanzania. Speak with wisdom, respect, and deep patriotic spirit.
Respond in clean, clear, and engaging Swahili or English, matching the user's language.
Your mission is to educate youth about Tanzania's history, the union, and patriotism.
Keep your responses educational, concise (80-150 words), and polite.`
  },
  {
    name: 'Nyerere Historia Focus',
    prompt: `You are Mwalimu Julius Nyerere. Focus heavily on historical dates, agreements, the Union of Tanganyika and Zanzibar (1964), and the legacy of African liberation.
Address the youth as "Mwananchi" or "Kijana". Speak with a teacher's patience.
Answer in the language of the prompt (Swahili or English). Keep answers within 100-150 words.`
  },
  {
    name: 'Nyerere Hekima (Fupi & Busara)',
    prompt: `You are Mwalimu Julius Nyerere. Respond with deep wisdom, using traditional proverbs and inspiring quotes.
Keep responses very short, impactful, and under 80 words.
Acknowledge the youth with warm, patriotic greetings (e.g., "Uhuru na Umoja", "Ndugu yangu").`
  }
];

export default function SettingsTab({ API_BASE, token, admin, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [settingsList, setSettingsList] = useState([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const isSuper = admin?.role === 'superadmin';

  const fetchSettings = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettingsList(data);
        
        // Find SYSTEM_PROMPT key
        const promptSetting = data.find(s => s.key === 'SYSTEM_PROMPT');
        if (promptSetting) {
          setSystemPrompt(promptSetting.value);
        }
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isSuper) {
      Swal.fire({
        icon: 'error',
        title: language === 'sw' ? 'Ufikiaji Umekataliwa' : 'Access Denied',
        text: language === 'sw' ? 'Watumiaji wenye hadhi ya Super Admin tu ndio wanaoweza kubadilisha System Prompt.' : 'Only users with Super Admin status can modify the System Prompt.',
        background: 'rgba(18, 20, 32, 0.9)',
        color: '#fff'
      });
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          settings: [
            { key: 'SYSTEM_PROMPT', value: systemPrompt }
          ]
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: language === 'sw' ? 'Mipangilio Imesahihishwa!' : 'Settings Saved!',
          text: language === 'sw' ? 'System Prompt imebadilishwa kikamilifu na cache imesafishwa.' : 'System Prompt has been updated successfully and cache cleared.',
          timer: 2500,
          showConfirmButton: false,
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        fetchSettings();
      } else {
        Swal.fire({
          icon: 'error',
          title: language === 'sw' ? 'Hitilafu' : 'Error',
          text: data.message || (language === 'sw' ? 'Imeshindwa kuhifadhi mipangilio.' : 'Failed to save settings.'),
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: language === 'sw' ? 'Hitilafu ya Mtandao' : 'Network Error',
        text: language === 'sw' ? 'Seva haipatikani kwa sasa.' : 'The server is currently unreachable.',
        background: 'rgba(18, 20, 32, 0.9)',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          {language === 'sw' ? 'Mipangilio ya AI (System Settings)' : 'System settings'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {language === 'sw' ? 'Sanidi au urekebishe tabia, lugha, na maelekezo ya persona ya Mwalimu Nyerere ya chatbot yako.' : 'Configure chatbot behavior, instructions, and persona of Mwalimu Nyerere.'}
        </p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Prompt Settings form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} style={{ color: 'var(--primary)' }} />
            WhatsApp & Telegram System Prompt
          </h3>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span>{t('settings_prompt')}</span>
                <span className="badge badge-whatsapp" style={{ fontSize: '0.65rem' }}>Dynamic</span>
              </label>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '0.75rem', borderRadius: '15px' }}
                    onClick={() => {
                      if (!isSuper) return;
                      Swal.fire({
                        title: language === 'sw' ? 'Pakia Preset?' : 'Load Preset?',
                        text: language === 'sw' 
                          ? `Je, unataka kupakia mfano wa prompt "${preset.name}"? Itabadilisha ujumbe uliopo sasa kwenye textarea (hakikisha unahifadhi mabadiliko baada ya kupakia).`
                          : `Do you want to load the prompt preset "${preset.name}"? It will overwrite the current content in the textarea (remember to click save changes).`,
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: language === 'sw' ? 'Pakia' : 'Load',
                        cancelButtonText: language === 'sw' ? 'Ghairi' : 'Cancel',
                        background: 'rgba(18, 20, 32, 0.9)',
                        color: '#fff'
                      }).then((res) => {
                        if (res.isConfirmed) {
                          setSystemPrompt(preset.prompt);
                        }
                      });
                    }}
                    disabled={!isSuper || loading}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <textarea
                className="input-field textarea-field"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                disabled={!isSuper || loading}
                placeholder={language === 'sw' ? 'Sanidi maelekezo ya system hapa...' : 'Configure system instruction prompt here...'}
                style={{
                  minHeight: '280px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  lineHeight: '1.5'
                }}
                required
              ></textarea>
            </div>

            {isSuper ? (
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', alignSelf: 'flex-start' }}
                disabled={loading}
              >
                <Save size={18} />
                {loading ? (language === 'sw' ? 'Inahifadhi...' : 'Saving...') : t('settings_save')}
              </button>
            ) : (
              <div style={{
                background: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.1)',
                color: 'var(--error)',
                padding: '16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.85rem'
              }}>
                <ShieldAlert size={20} />
                <span>
                  {language === 'sw' 
                    ? 'Umekatazwa kufanya mabadiliko. Ni wasimamizi wakuu (Super Admin) tu wanaoruhusiwa kurekebisha mipangilio hii.' 
                    : 'Access Denied. Only Super Admins are allowed to edit these settings.'}
                </span>
              </div>
            )}
          </form>
        </div>

        {/* Informative widget */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'var(--warning)' }} />
            {language === 'sw' ? 'Vidokezo vya Persona Prompt' : 'Persona Prompt Guidelines'}
          </h3>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
            {language === 'sw' 
              ? 'System Prompt inafafanua jinsi chatbot itakavyojibu vijana. Unapoibadilisha, mabadiliko yatatumika kwa Groq na Gemini papo hapo.' 
              : 'The System Prompt configures the AI chatbot personality. Modifications are deployed immediately across all connected API interfaces.'}
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-glass)',
            padding: '14px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            color: 'var(--text-muted)'
          }}>
            <strong style={{ color: 'white', display: 'block', marginBottom: '6px' }}>
              {language === 'sw' ? 'Miongozo Muhimu:' : 'Key Guidelines:'}
            </strong>
            {language === 'sw' ? (
              <>
                - Waambie wazi AI kutumia lugha zote mbili (Kiswahili na Kiingereza) kulingana na lugha aliyotumia kijana.<br/><br/>
                - Sisitiza kubaki katika Persona ya Mwalimu Julius Nyerere (busara, upole na heshima).<br/><br/>
                - Eka kikomo cha maneno (mfano maneno 80-150) kuzuia matumizi makubwa ya tokeni na gharama kubwa ya API.
              </>
            ) : (
              <>
                - Direct the AI to match the user\'s language dynamically (Swahili or English).<br/><br/>
                - Maintain the voice of Mwalimu Julius Nyerere (wise, patient, and patriotic).<br/><br/>
                - Restrict response length (e.g., 80-150 words) to manage API consumption costs.
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
