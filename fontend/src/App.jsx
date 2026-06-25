import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  HelpCircle, 
  LogOut, 
  Send, 
  PlusCircle, 
  Sparkles,
  Trophy,
  History,
  FileText,
  Smartphone,
  Trash2
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem('adminInfo')) || null);
  
  // Auth state
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // UI Navigation
  const [activeTab, setActiveTab] = useState('overview');
  
  // Stats and data
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [stories, setStories] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Loaders
  const [loading, setLoading] = useState(false);

  // Refs
  const chatEndRef = useRef(null);
  
  // Forms state
  const [newModule, setNewModule] = useState({ title: '', description: '', order_index: '' });
  const [newQuestion, setNewQuestion] = useState({
    module_id: '',
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_option: 0,
    points: 10
  });
  const [newStory, setNewStory] = useState({ title: '', content: '', publish_date: '' });
  const [formMessage, setFormMessage] = useState('');

  // Simulator state
  const [simChannel, setSimChannel] = useState('whatsapp');
  const [simUser, setSimUser] = useState('+255711223344');
  const [simMessage, setSimMessage] = useState('');
  const [simChat, setSimChat] = useState([
    {
      sender: 'bot',
      text: 'Habari ya kijana! Karibu kwenye **MUUNGANO WETU AI** 🇹🇿. Mimi ni msaidizi wako wa akili bandia wa kuelimisha kuhusu Muungano wetu mtukufu. unaweza:\n1. Kuniuliza swali lolote kuhusu historia ya Muungano.\n2. Kuandika **QUIZ** kuanza mchezo wa maswali na kupata pointi.\n3. Kuandika **HADITHI** kupata hadithi ya leo ya kihistoria.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Load dashboard stats
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load quizzes
  const fetchQuizzes = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/quizzes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuizzes(data);
        if (data.length > 0 && !newQuestion.module_id) {
          setNewQuestion(prev => ({ ...prev, module_id: data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load stories
  const fetchStories = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load users
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchQuizzes();
      fetchStories();
      fetchUsers();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Auto-scroll simulator chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simChat]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));
        setToken(data.token);
        setAdmin(data.admin);
      } else {
        setAuthError(data.message || 'Kuingia kumeshindikana. Angalia namba na password.');
      }
    } catch (err) {
      setAuthError('Muunganisho na seva umefeli.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setToken('');
    setAdmin(null);
  };

  // Create Module
  const handleCreateModule = async (e) => {
    e.preventDefault();
    setFormMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/modules`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newModule.title,
          description: newModule.description,
          order_index: parseInt(newModule.order_index)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormMessage('Moduli imeundwa kwa mafanikio! ✅');
        setNewModule({ title: '', description: '', order_index: '' });
        fetchQuizzes();
        fetchStats();
      } else {
        setFormMessage(`Imefeli: ${data.message}`);
      }
    } catch (err) {
      setFormMessage('Error communicating with backend.');
    }
  };

  // Create Question
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setFormMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/questions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module_id: parseInt(newQuestion.module_id),
          question_text: newQuestion.question_text,
          options: [
            `A. ${newQuestion.optionA}`,
            `B. ${newQuestion.optionB}`,
            `C. ${newQuestion.optionC}`,
            `D. ${newQuestion.optionD}`
          ],
          correct_option: parseInt(newQuestion.correct_option),
          points: parseInt(newQuestion.points)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormMessage('Swali limeundwa kwa mafanikio! ✅');
        setNewQuestion(prev => ({
          ...prev,
          question_text: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correct_option: 0
        }));
        fetchQuizzes();
        fetchStats();
      } else {
        setFormMessage(`Imefeli: ${data.message}`);
      }
    } catch (err) {
      setFormMessage('Error communicating with backend.');
    }
  };

  // Create Daily Story
  const handleCreateStory = async (e) => {
    e.preventDefault();
    setFormMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/stories`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStory)
      });
      const data = await res.json();
      if (res.ok) {
        setFormMessage('Hadithi ya leo imesajiliwa! ✅');
        setNewStory({ title: '', content: '', publish_date: '' });
        fetchStories();
      } else {
        setFormMessage(`Imefeli: ${data.message}`);
      }
    } catch (err) {
      setFormMessage('Error communicating with backend.');
    }
  };

  // Delete Module
  const handleDeleteModule = async (id, title) => {
    if (!window.confirm(`Je, una uhakika wa kufuta moduli "${title}" na maswali yake yote?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/modules/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) { setFormMessage('Moduli imefutwa! ✅'); fetchQuizzes(); fetchStats(); }
      else setFormMessage(`Imefeli: ${d.message}`);
    } catch { setFormMessage('Hitilafu ya muunganisho.'); }
  };

  // Delete Question
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Je, una uhakika wa kufuta swali hili?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/questions/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) { setFormMessage('Swali limefutwa! ✅'); fetchQuizzes(); fetchStats(); }
      else setFormMessage(`Imefeli: ${d.message}`);
    } catch { setFormMessage('Hitilafu ya muunganisho.'); }
  };

  // Delete Story
  const handleDeleteStory = async (id, title) => {
    if (!window.confirm(`Je, una uhakika wa kufuta hadithi "${title}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stories/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) { setFormMessage('Hadithi imefutwa! ✅'); fetchStories(); }
      else setFormMessage(`Imefeli: ${d.message}`);
    } catch { setFormMessage('Hitilafu ya muunganisho.'); }
  };

  // Send Mock Chatbot Message
  const handleSendMockChat = async (e) => {
    e.preventDefault();
    if (!simMessage.trim()) return;

    const userText = simMessage;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to UI chat log
    setSimChat(prev => [...prev, { sender: 'user', text: userText, time: timeString }]);
    setSimMessage('');

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
      
      const botReply = res.ok ? data.reply : 'Hitilafu ya chatbot wakati wa kuwasiliana na AI.';
      
      // Add chatbot reply to UI chat log
      setSimChat(prev => [...prev, {
        sender: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setSimChat(prev => [...prev, {
        sender: 'bot',
        text: '⚠️ Imefeli kuungana na seva ya Chatbot.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  // Render Login Component
  if (!token) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              display: 'inline-flex',
              padding: '12px',
              borderRadius: '50%',
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              marginBottom: '16px'
            }}>
              <Sparkles size={32} />
            </div>
            <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>MUUNGANO WETU AI</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Dashibodi ya Utawala na Usimamizi
            </p>
          </div>

          {authError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--error)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="input-label">Namba ya Simu ya Admin</label>
              <input
                type="text"
                placeholder="+255700000000"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label className="input-label">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Kuingia...' : 'Ingia Kwenye Dashibodi'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Muungano Wetu AI &copy; 2026 | Vyuo na Vyuo Vikuu Tanzania Bara
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <Sparkles size={28} className="text-gradient" style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            MUUNGANO <span style={{ color: 'var(--secondary)' }}>AI</span>
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('overview')}
          >
            <Users size={18} /> Muhtasari Stats
          </button>

          <button 
            className={`btn ${activeTab === 'quizzes' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('quizzes')}
          >
            <BookOpen size={18} /> Usimamizi Quizzes
          </button>

          <button 
            className={`btn ${activeTab === 'stories' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('stories')}
          >
            <FileText size={18} /> Hadithi za Kila Siku
          </button>

          <button 
            className={`btn ${activeTab === 'simulator' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('simulator')}
          >
            <Smartphone size={18} /> Chatbot Simulator
          </button>

          <button 
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => { setActiveTab('users'); fetchUsers(); }}
          >
            <Users size={18} /> Watumiaji
          </button>
        </nav>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
          <div style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{admin?.full_name}</div>
            <div style={{ color: 'var(--text-muted)' }}>Msimamizi</div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', color: 'var(--error)', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> Ondoka
          </button>
        </div>
      </aside>

      {/* Main Dashboard Space */}
      <main className="main-content">
        
        {/* TAB 1: OVERVIEW STATISTICS */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Muhtasari wa Mfumo</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Takwimu na ripoti za ushiriki wa vijana katika kuelimika kuhusu Muungano.</p>
            </div>

            {/* KPI Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px'
            }}>
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                  <Users size={28} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Vijana Waliosajiliwa</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.summary.totalStudents || 0}</h2>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)' }}>
                  <MessageSquare size={28} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Ujumbe wa Chat</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.summary.totalMessages || 0}</h2>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                  <BookOpen size={28} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Sura za Elimu</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.summary.totalModules || 0}</h2>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                  <HelpCircle size={28} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Jumla ya Maswali</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.summary.totalQuestions || 0}</h2>
                </div>
              </div>
            </div>

            {/* Split Content: Leaderboard and Channel stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
              
              {/* Leaderboard list */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <Trophy style={{ color: 'var(--warning)' }} size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Vijana Wanaoongoza kwa Maarifa</h3>
                </div>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Nafasi</th>
                        <th>Jina Kamili</th>
                        <th>Njia ya Simu</th>
                        <th>Alama (Points)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.leaderboard.map((user, idx) => (
                        <tr key={user.id}>
                          <td><strong>{idx + 1}</strong></td>
                          <td>{user.full_name || 'Kijana Uzalendo'}</td>
                          <td>{user.phone_number || `Telegram ID: ${user.telegram_id}`}</td>
                          <td style={{ color: 'var(--secondary)', fontWeight: 600 }}>{user.points} pts</td>
                        </tr>
                      ))}
                      {(!stats || stats.leaderboard.length === 0) && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Bado hakuna data.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Message Channel Distribution */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'space-between' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Chaneli za Ujumbe</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Mgawanyo wa njia zinazotumiwa zaidi na vijana.</p>
                </div>
                
                {/* SVG Visual Pie Chart Mock representation */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', position: 'relative' }}>
                  <svg width="160" height="160" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', borderRadius: '50%' }}>
                    {/* Mock circular charts using simple stroke dash arrays for the 3 channels */}
                    {/* Circle 1: WhatsApp (Green) 55% */}
                    <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="var(--success)" strokeWidth="4" strokeDasharray="55 100" strokeDashoffset="0"></circle>
                    {/* Circle 2: Telegram (Cyan) 30% */}
                    <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="var(--secondary)" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-55"></circle>
                    {/* Circle 3: SMS (Amber) 15% */}
                    <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="var(--warning)" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-85"></circle>
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
                      WhatsApp
                    </div>
                    <span className="badge badge-whatsapp">
                      {stats?.channelStats.find(c => c.channel === 'whatsapp')?.count || 0} msg
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
                      Telegram
                    </div>
                    <span className="badge badge-telegram">
                      {stats?.channelStats.find(c => c.channel === 'telegram')?.count || 0} msg
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }}></span>
                      SMS Gateway
                    </div>
                    <span className="badge badge-sms">
                      {stats?.channelStats.find(c => c.channel === 'sms')?.count || 0} msg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Conversations Chat Log */}
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <History style={{ color: 'var(--primary)' }} size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Mazungumzo ya Hivi Karibuni na AI Chatbot</h3>
              </div>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Kijana</th>
                      <th>Njia</th>
                      <th>Ujumbe Ulioingia</th>
                      <th>Jibu la AI Chatbot</th>
                      <th>Muda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats?.recentLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{log.User?.full_name || 'Kijana Uzalendo'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                            {log.User?.phone_number || 'Telegram User'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge badge-${log.channel}`}>
                            {log.channel}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.message_text}
                        </td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.response_text}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {(!stats || stats.recentLogs.length === 0) && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Bado hakuna ujumbe ulioingia.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: QUIZZES MANAGER */}
        {activeTab === 'quizzes' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Usimamizi wa Quizzes & Moduli</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Sanidi na uongeze moduli au maswali ya mchezo wa kupima uelewa wa Muungano.</p>
            </div>

            {formMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--success)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {formMessage}
              </div>
            )}

            {/* Split forms: Add Module and Add Question */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Add Module Form */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <PlusCircle style={{ color: 'var(--primary)' }} size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Unda Moduli / Sura Mpya</h3>
                </div>
                <form onSubmit={handleCreateModule}>
                  <div className="input-group">
                    <label className="input-label">Jina la Moduli</label>
                    <input 
                      type="text" 
                      placeholder="Mf. Faida za Muungano" 
                      className="input-field"
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Maelezo Mafupi (Description)</label>
                    <textarea 
                      placeholder="Eleza kwa kifupi kitakachofundishwa..." 
                      className="input-field" 
                      rows="3"
                      style={{ resize: 'none' }}
                      value={newModule.description}
                      onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="input-group" style={{ marginBottom: '24px' }}>
                    <label className="input-label">Namba ya Mtiririko (Order Index)</label>
                    <input 
                      type="number" 
                      placeholder="Mf. 4" 
                      className="input-field"
                      value={newModule.order_index}
                      onChange={(e) => setNewModule({ ...newModule, order_index: e.target.value })}
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Unda Moduli Mpya
                  </button>
                </form>
              </div>

              {/* Add Question Form */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <PlusCircle style={{ color: 'var(--secondary)' }} size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Ongeza Swali Jipya la Quiz</h3>
                </div>
                <form onSubmit={handleCreateQuestion}>
                  <div className="input-group">
                    <label className="input-label">Chagua Moduli</label>
                    <select 
                      className="input-field"
                      value={newQuestion.module_id}
                      onChange={(e) => setNewQuestion({ ...newQuestion, module_id: e.target.value })}
                      required
                    >
                      {quizzes.map(m => (
                        <option key={m.id} value={m.id}>{m.order_index}. {m.title}</option>
                      ))}
                      {quizzes.length === 0 && <option value="">-- Hakuna Moduli --</option>}
                    </select>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Swali lenyewe</label>
                    <input 
                      type="text" 
                      placeholder="Mf. Muungano wa nchi hizi ulifanyika lini?" 
                      className="input-field"
                      value={newQuestion.question_text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                      required 
                    />
                  </div>

                  {/* Option inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="input-group">
                      <label className="input-label">Chaguo A</label>
                      <input 
                        type="text" 
                        placeholder="Chaguo la kwanza" 
                        className="input-field"
                        value={newQuestion.optionA}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionA: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Chaguo B</label>
                      <input 
                        type="text" 
                        placeholder="Chaguo la pili" 
                        className="input-field"
                        value={newQuestion.optionB}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionB: e.target.value })}
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="input-group">
                      <label className="input-label">Chaguo C</label>
                      <input 
                        type="text" 
                        placeholder="Chaguo la tatu" 
                        className="input-field"
                        value={newQuestion.optionC}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionC: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Chaguo D</label>
                      <input 
                        type="text" 
                        placeholder="Chaguo la nne" 
                        className="input-field"
                        value={newQuestion.optionD}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionD: e.target.value })}
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', marginBottom: '24px' }}>
                    <div className="input-group">
                      <label className="input-label">Jibu Sahihi</label>
                      <select 
                        className="input-field"
                        value={newQuestion.correct_option}
                        onChange={(e) => setNewQuestion({ ...newQuestion, correct_option: e.target.value })}
                        required
                      >
                        <option value="0">Chaguo A</option>
                        <option value="1">Chaguo B</option>
                        <option value="2">Chaguo C</option>
                        <option value="3">Chaguo D</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Alama (Points)</label>
                      <input 
                        type="number" 
                        className="input-field"
                        value={newQuestion.points}
                        onChange={(e) => setNewQuestion({ ...newQuestion, points: e.target.value })}
                        required 
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Hifadhi Swali Jipya
                  </button>
                </form>
              </div>
            </div>

            {/* List of current modules and questions */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Orodha ya Moduli na Maswali Yaliyopo</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {quizzes.map((mod) => (
                  <div key={mod.id} style={{
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.01)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ color: 'var(--secondary)' }}>{mod.order_index}. {mod.title}</h4>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge badge-telegram">{mod.Questions?.length || 0} Maswali</span>
                        <button
                          onClick={() => handleDeleteModule(mod.id, mod.title)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                        >
                          <Trash2 size={13}/> Futa
                        </button>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>{mod.description}</p>
                    
                    {/* Questions inner list */}
                    {mod.Questions && mod.Questions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                        {mod.Questions.map((q, idx) => (
                          <div key={q.id} style={{ fontSize: '0.88rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <strong>Swali {idx + 1}:</strong> {q.question_text} <span style={{ color: 'var(--text-muted)' }}>({q.points} pts)</span>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}
                                title="Futa swali"
                              >
                                <Trash2 size={14}/>
                              </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', marginTop: '6px', color: 'var(--text-secondary)', paddingLeft: '10px' }}>
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ color: oIdx === q.correct_option ? 'var(--success)' : '' }}>
                                  {opt} {oIdx === q.correct_option ? '✅' : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Hakuna maswali yoyote katika moduli hii bado.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DAILY STORIES */}
        {activeTab === 'stories' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Hadithi za Kihistoria za Kila Siku</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Dhibiti hadithi fupi za kila siku (Daily Stories) ambazo vijana watazisoma kupitia chatbot.</p>
            </div>

            {formMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--success)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {formMessage}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '20px', alignItems: 'flex-start' }}>
              
              {/* Form to Create story */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <PlusCircle style={{ color: 'var(--primary)' }} size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Sajili Hadithi Mpya</h3>
                </div>
                <form onSubmit={handleCreateStory}>
                  <div className="input-group">
                    <label className="input-label">Kichwa cha Hadithi</label>
                    <input 
                      type="text" 
                      placeholder="Mf. Nyerere na Karume tarehe 26 Aprili" 
                      className="input-field"
                      value={newStory.title}
                      onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Tarehe ya Kuchapisha</label>
                    <input 
                      type="date" 
                      className="input-field"
                      value={newStory.publish_date}
                      onChange={(e) => setNewStory({ ...newStory, publish_date: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: '24px' }}>
                    <label className="input-label">Maudhui ya Hadithi</label>
                    <textarea 
                      placeholder="Andika hadithi ya kihistoria hapa kwa lugha inayovutia na ya kirafiki..." 
                      className="input-field" 
                      rows="8"
                      value={newStory.content}
                      onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Sajili na Iweke Live
                  </button>
                </form>
              </div>

              {/* List of registered stories */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Hadithi Zilizopo</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {stories.map(story => (
                    <div key={story.id} style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(255, 255, 255, 0.01)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ color: 'var(--primary)', fontWeight: 600 }}>{story.title}</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge badge-telegram">{story.publish_date}</span>
                          <button
                            onClick={() => handleDeleteStory(story.id, story.title)}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <Trash2 size={13}/> Futa
                          </button>
                        </div>
                      </div>
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.88rem', 
                        whiteSpace: 'pre-wrap',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        paddingRight: '6px'
                      }}>
                        {story.content}
                      </p>
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px' }}>
                      Bado hakuna hadithi zilizoandaliwa.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CHATBOT SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Chatbot Live Simulator</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Fanya majaribio ya jinsi AI Chatbot inavyojibu ujumbe wa vijana moja kwa moja kwenye dashibodi kabla ya kuunganisha namba halisi.
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '0.8fr 1.2fr', 
              gap: '30px', 
              alignItems: 'flex-start',
              maxWidth: '900px'
            }}>
              
              {/* Simulator Config */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Mipangilio ya Simuleta</h3>
                
                <div className="input-group">
                  <label className="input-label">Njia / Chaneli ya Mawasiliano</label>
                  <select 
                    className="input-field" 
                    value={simChannel}
                    onChange={(e) => {
                      setSimChannel(e.target.value);
                      // Set dummy identifiers based on channel
                      if (e.target.value === 'telegram') setSimUser('TanzaniaHeroBotDev');
                      else setSimUser('+255711223344');
                    }}
                  >
                    <option value="whatsapp">WhatsApp Business API</option>
                    <option value="telegram">Telegram Bot</option>
                    <option value="sms">SMS Gateway</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Kitambulisho cha Mtumiaji (Phone/Username)</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={simUser}
                    onChange={(e) => setSimUser(e.target.value)}
                  />
                </div>

                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4'
                }}>
                  💡 **Miongozo ya kujaribu:**<br/>
                  * Andika **HI** au **HABARI** kuamsha Chatbot.<br/>
                  * Andika **HADITHI** kusoma hadithi ya leo.<br/>
                  * Andika **QUIZ** kuanza mchezo wa maswali na kujibu (A, B, C, D).<br/>
                  * Andika **LEADERBOARD** kuona pointi za wasajili wengine.<br/>
                  * Uliza swali la kihistoria, mf. **"nani alisaini muungano?"**
                </div>
              </div>

              {/* Smartphone Simulator Mock UI */}
              <div style={{
                background: '#0e1017',
                border: '12px solid #232530',
                borderRadius: '36px',
                height: '560px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Status Bar */}
                <div style={{
                  height: '24px',
                  background: '#191b28',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0 24px',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div>01:25</div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span>5G</span>
                    <span style={{ width: '12px', height: '8px', border: '1px solid var(--text-secondary)', borderRadius: '2px', display: 'inline-block' }}></span>
                  </div>
                </div>

                {/* Chat App Header */}
                <div style={{
                  background: simChannel === 'whatsapp' ? '#075e54' : simChannel === 'telegram' ? '#0088cc' : '#1e2030',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fff',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    🇹🇿
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>MUUNGANO WETU AI</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>online • chatbot engine</div>
                  </div>
                </div>

                {/* Chat Message Thread */}
                <div style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: '#090a0f'
                }}>
                  {simChat.map((msg, index) => (
                    <div 
                      key={index}
                      style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.sender === 'user' 
                          ? (simChannel === 'whatsapp' ? '#056162' : simChannel === 'telegram' ? '#182533' : 'var(--primary)') 
                          : '#1f2130',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.85rem', 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {msg.text}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        textAlign: 'right',
                        marginTop: '4px'
                      }}>
                        {msg.time}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Message Input Panel */}
                <form 
                  onSubmit={handleSendMockChat}
                  style={{
                    padding: '10px',
                    background: '#131520',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}
                >
                  <input 
                    type="text" 
                    placeholder="Andika ujumbe hapa..."
                    className="input-field"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', fontSize: '0.88rem' }}
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ 
                      borderRadius: '50%', 
                      width: '36px', 
                      height: '36px', 
                      padding: 0,
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WATUMIAJI */}
        {activeTab === 'users' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Watumiaji Waliojisajili</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Orodha ya vijana wote waliojisajili katika mfumo kupitia njia mbalimbali za mawasiliano.</p>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Users style={{ color: 'var(--primary)' }} size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Vijana ({users.length})</h3>
              </div>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Jina Kamili</th>
                      <th>Namba ya Simu</th>
                      <th>Telegram ID</th>
                      <th>Alama (Points)</th>
                      <th>Tarehe ya Kujisajili</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id}>
                        <td><strong>{idx + 1}</strong></td>
                        <td>{u.full_name || 'Kijana Uzalendo'}</td>
                        <td>{u.phone_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td>{u.telegram_id || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td><span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{u.points} pts</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Bado hakuna watumiaji waliojisajili.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
