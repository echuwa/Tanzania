import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

// Components
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import OverviewTab from './components/OverviewTab';
import ChatSimulator from './components/ChatSimulator';
import QuizManager from './components/QuizManager';
import StoryManager from './components/StoryManager';
import UserManager from './components/UserManager';
import AnalyticsTab from './components/AnalyticsTab';
import BroadcastTab from './components/BroadcastTab';
import AdminManager from './components/AdminManager';
import SettingsTab from './components/SettingsTab';
import ProfileTab from './components/ProfileTab';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem('adminInfo')) || null);
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.substring(1);
    const validTabs = ['overview', 'quizzes', 'stories', 'simulator', 'users', 'analytics', 'broadcast', 'admins', 'settings', 'profile'];
    return validTabs.includes(hash) ? hash : 'overview';
  });

  const [language, setLanguage] = useState(localStorage.getItem('adminLanguage') || 'sw');

  const toggleLanguage = () => {
    const newLang = language === 'sw' ? 'en' : 'sw';
    setLanguage(newLang);
    localStorage.setItem('adminLanguage', newLang);
  };

  // Token URL Parameters (Reset password & Invites)
  const [resetToken, setResetToken] = useState('');
  const [inviteToken, setInviteToken] = useState('');

  // Password reset/invite inputs
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Main data states shared by dashboard
  const [quizzes, setQuizzes] = useState([]);
  const [stories, setStories] = useState([]);
  const [users, setUsers] = useState([]);
  const [systemAnalytics, setSystemAnalytics] = useState(null);

  // Parse path/query params for tokens on mount
  useEffect(() => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    const resetMatch = pathname.match(/\/reset-password\/([a-zA-Z0-9_-]+)/);
    const resetQuery = urlParams.get('token') || urlParams.get('resetToken');
    if (resetMatch && resetMatch[1]) {
      setResetToken(resetMatch[1]);
    } else if (resetQuery) {
      setResetToken(resetQuery);
    }

    const inviteMatch = pathname.match(/\/verify-invite\/([a-zA-Z0-9_-]+)/);
    const inviteQuery = urlParams.get('verifyToken') || urlParams.get('inviteToken');
    if (inviteMatch && inviteMatch[1]) {
      setInviteToken(inviteMatch[1]);
    } else if (inviteQuery) {
      setInviteToken(inviteQuery);
    }
  }, []);

  // Sync tab with URL hash and listen for browser back/forward navigation
  useEffect(() => {
    if (token && admin) {
      window.location.hash = activeTab;
    }
  }, [activeTab, token, admin]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      const validTabs = ['overview', 'quizzes', 'stories', 'simulator', 'users', 'analytics', 'broadcast', 'admins', 'settings', 'profile'];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleUnauthorized = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setToken('');
    setAdmin(null);
    window.location.hash = '';
    Swal.fire({
      icon: 'error',
      title: language === 'sw' ? 'Kipindi Kimeisha' : 'Session Expired',
      text: language === 'sw'
        ? 'Muda wa kipindi chako umeisha au akaunti yako haina ufikiaji. Tafadhali ingia tena.'
        : 'Your session has expired or you do not have permission. Please log in again.',
      background: 'rgba(18, 20, 32, 0.9)',
      color: '#fff',
      timer: 3000,
      showConfirmButton: false
    });
  };

  // Fetch initial dashboard data
  const fetchDashboardData = async () => {
    if (!token || !admin) return;
    try {
      // 1. Fetch system analytics (counts, leaderboard, breakdown)
      const resStats = await fetch(`${API_BASE}/admin/system-analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resStats.status === 401) {
        handleUnauthorized();
        return;
      }
      if (resStats.ok) {
        const statsData = await resStats.json();
        setSystemAnalytics(statsData);
      }

      // 2. Fetch users (accessible by both admins now)
      const resUsers = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resUsers.status === 401) {
        handleUnauthorized();
        return;
      }
      if (resUsers.ok) {
        const usersData = await resUsers.json();
        setUsers(usersData);
      }

      // Role-specific calls to prevent 403 Forbidden for sub-admin
      if (admin.role === 'superadmin') {
        // 3. Fetch Quizzes / Modules
        const resQuizzes = await fetch(`${API_BASE}/admin/quizzes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resQuizzes.status === 401) {
          handleUnauthorized();
          return;
        }
        if (resQuizzes.ok) {
          const quizData = await resQuizzes.json();
          setQuizzes(quizData);
        }

        // 4. Fetch stories
        const resStories = await fetch(`${API_BASE}/admin/stories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resStories.status === 401) {
          handleUnauthorized();
          return;
        }
        if (resStories.ok) {
          const storiesData = await resStories.json();
          setStories(storiesData);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Auth Callbacks
  const handleLoginSuccess = (newToken, newAdmin) => {
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminInfo', JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
    setActiveTab('overview');
  };

  const handleLogout = () => {
    Swal.fire({
      title: language === 'sw' ? 'Je, unataka kuondoka?' : 'Do you want to log out?',
      text: language === 'sw'
        ? 'Itabidi uingie tena ili kufikia paneli ya usimamizi.'
        : 'You will have to log in again to access the admin panel.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'rgba(255,255,255,0.05)',
      confirmButtonText: language === 'sw' ? 'Ndio, Ondoka!' : 'Yes, Log out!',
      cancelButtonText: language === 'sw' ? 'Baki Hapa' : 'Cancel',
      background: 'rgba(18, 20, 32, 0.95)',
      color: '#fff'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        setToken('');
        setAdmin(null);
        window.location.hash = '';
      }
    });
  };

  // Reset Password Submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg(language === 'sw' ? 'Nenosiri halilingani!' : 'Passwords do not match!');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg(language === 'sw' ? 'Nenosiri lazima liwe na urefu usiopungua herufi 8.' : 'Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/admin/reset-password/${resetToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: language === 'sw' ? 'Imefanikiwa!' : 'Success!',
          text: language === 'sw'
            ? 'Nenosiri lako jipya limehifadhiwa. Sasa unaweza kuingia.'
            : 'Your new password has been saved. You can now log in.',
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        setResetToken('');
        window.history.pushState({}, '', '/');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || (language === 'sw' ? 'Kiungo kimeisha muda au kimetumika tayari.' : 'This link has expired or has already been used.'));
      }
    } catch (err) {
      setErrorMsg(language === 'sw' ? 'Mawasiliano na seva yamefeli.' : 'Server communication failed.');
    } finally {
      setLoading(false);
    }
  };

  // Accept Invite Submit
  const handleVerifyInvite = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg(language === 'sw' ? 'Nenosiri halilingani!' : 'Passwords do not match!');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/admin/verify-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, password: newPassword })
      });
      if (res.ok) {
        await Swal.fire({
          icon: 'success',
          title: language === 'sw' ? 'Hongera!' : 'Congratulations!',
          text: language === 'sw'
            ? 'Akaunti yako imeamilishwa. Sasa unaweza kuingia.'
            : 'Your account has been successfully activated. You can now log in.',
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        setInviteToken('');
        window.history.pushState({}, '', '/');
      } else {
        const data = await res.json();
        setErrorMsg(data.message || (language === 'sw' ? 'Mwaliko huu si halali.' : 'This invitation is invalid.'));
      }
    } catch (err) {
      setErrorMsg(language === 'sw' ? 'Mawasiliano na seva yamefeli.' : 'Server communication failed.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Route: Reset Password URL
  if (resetToken) {
    return (
      <div className="login-wrapper">
        <div className="login-orb-1"></div>
        <div className="login-card">
          <div style={{ textAlign: 'center' }}>
            <div className="login-header-glow"><Lock size={30} /></div>
            <h2>{language === 'sw' ? 'Weka Nenosiri Jipya' : 'Set New Password'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              {language === 'sw' ? 'Weka password mpya kwa ajili ya msimamizi.' : 'Set a new password for the administrator.'}
            </p>
          </div>

          {errorMsg && <div style={{ color: 'var(--error)', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</div>}

          <form onSubmit={handleResetPassword}>
            <div className="input-group">
              <label className="input-label">{language === 'sw' ? 'Nenosiri Jipya' : 'New Password'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass1 ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                  required
                />
                <button type="button" onClick={() => setShowPass1(!showPass1)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                  {showPass1 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{language === 'sw' ? 'Thibitisha Nenosiri' : 'Confirm Password'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass2 ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                  required
                />
                <button type="button" onClick={() => setShowPass2(!showPass2)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                  {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? (language === 'sw' ? 'Inahifadhi...' : 'Saving...') : (language === 'sw' ? 'Hifadhi na Uingie' : 'Save and Login')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Route: Verify Invite URL
  if (inviteToken) {
    return (
      <div className="login-wrapper">
        <div className="login-orb-1"></div>
        <div className="login-card">
          <div style={{ textAlign: 'center' }}>
            <div className="login-header-glow"><ShieldCheck size={30} /></div>
            <h2>{language === 'sw' ? 'Amilisha Akaunti Yako' : 'Activate Your Account'}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '20px' }}>
              {language === 'sw' ? 'Umealikwa kuwa msimamizi. Weka nenosiri lako kukamilisha usajili.' : 'You have been invited as an administrator. Enter your password to complete registration.'}
            </p>
          </div>

          {errorMsg && <div style={{ color: 'var(--error)', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', textAlign: 'center' }}>{errorMsg}</div>}

          <form onSubmit={handleVerifyInvite}>
            <div className="input-group">
              <label className="input-label">{language === 'sw' ? 'Nenosiri Lako' : 'Your Password'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass1 ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                  required
                />
                <button type="button" onClick={() => setShowPass1(!showPass1)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                  {showPass1 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{language === 'sw' ? 'Thibitisha Nenosiri' : 'Confirm Password'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass2 ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{ width: '100%', paddingRight: '40px' }}
                  required
                />
                <button type="button" onClick={() => setShowPass2(!showPass2)} style={{ position: 'absolute', right: '12px', top: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                  {showPass2 ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? (language === 'sw' ? 'Inaamilisha...' : 'Activating...') : (language === 'sw' ? 'Amilisha Akaunti' : 'Activate Account')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Route: Login screen (not authenticated)
  if (!token || !admin) {
    return (
      <Login
        API_BASE={API_BASE}
        onLoginSuccess={handleLoginSuccess}
        language={language}
        toggleLanguage={toggleLanguage}
      />
    );
  }

  // 4. Route: Authenticated Dashboard Screen
  return (
    <div className="dashboard-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        admin={admin}
        onLogout={handleLogout}
        language={language}
        toggleLanguage={toggleLanguage}
      />

      <main className="main-content">
        {activeTab === 'overview' && (
          <OverviewTab
            stats={null}
            systemAnalytics={systemAnalytics}
            setActiveTab={setActiveTab}
            admin={admin}
            language={language}
          />
        )}

        {activeTab === 'simulator' && (
          <ChatSimulator
            API_BASE={API_BASE}
            language={language}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizManager
            API_BASE={API_BASE}
            token={token}
            quizzes={quizzes}
            fetchQuizzes={fetchDashboardData}
            language={language}
          />
        )}

        {activeTab === 'stories' && (
          <StoryManager
            API_BASE={API_BASE}
            token={token}
            stories={stories}
            fetchStories={fetchDashboardData}
            language={language}
          />
        )}

        {activeTab === 'users' && (
          <UserManager
            API_BASE={API_BASE}
            token={token}
            users={users}
            fetchUsers={fetchDashboardData}
            language={language}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab
            API_BASE={API_BASE}
            token={token}
            systemAnalytics={systemAnalytics}
            language={language}
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastTab
            API_BASE={API_BASE}
            token={token}
            language={language}
          />
        )}

        {activeTab === 'admins' && (
          <AdminManager
            API_BASE={API_BASE}
            token={token}
            language={language}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            API_BASE={API_BASE}
            token={token}
            admin={admin}
            language={language}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            API_BASE={API_BASE}
            token={token}
            admin={admin}
            setAdmin={setAdmin}
            language={language}
          />
        )}
      </main>
    </div>
  );
}
