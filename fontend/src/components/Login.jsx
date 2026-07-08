import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Login({ API_BASE, onLoginSuccess, language, toggleLanguage }) {
  const [isForgotView, setIsForgotView] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const isSw = language === 'sw';

  // Handle standard login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setAuthError('');

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: isSw ? 'Karibu Tena!' : 'Welcome Back!',
          text: isSw ? 'Umesajiliwa kwa ufanisi.' : 'Logged in successfully.',
          timer: 2000,
          showConfirmButton: false,
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        onLoginSuccess(data.token, data.admin);
      } else {
        setAuthError(data.message || (isSw ? 'Barua pepe au nenosiri si sahihi.' : 'Incorrect email or password.'));
      }
    } catch (err) {
      console.error(err);
      setAuthError(isSw ? 'Mawasiliano na seva yamefeli. Jaribu tena.' : 'Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password request
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    setAuthError('');
    setForgotSuccess('');

    try {
      const res = await fetch(`${API_BASE}/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.dev_reset_url) {
          // Dev mock mode
          Swal.fire({
            icon: 'warning',
            title: 'Mock Mode Active',
            html: `Email ya kurejesha password haikutumwa kwani mipangilio ya SMTP haijawekwa.<br/><br/><strong>Kiungo cha majaribio:</strong><br/><a href="${data.dev_reset_url}" target="_blank" style="color:#6366f1; word-break:break-all;">${data.dev_reset_url}</a>`,
            background: 'rgba(18, 20, 32, 0.95)',
            color: '#fff'
          });
        } else {
          setForgotSuccess(isSw ? 'Kiungo cha kubadili nenosiri kimetumwa kwenye barua pepe yako.' : 'Password reset link sent to your email.');
        }
      } else {
        setAuthError(data.message || (isSw ? 'Kuna makosa yamejitokeza.' : 'An error occurred.'));
      }
    } catch (err) {
      setAuthError(isSw ? 'Imeshindwa kutuma ombi.' : 'Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-orb-1"></div>
      <div className="login-orb-2"></div>
      <div className="login-grid"></div>

      {/* Floating Language Switcher */}
      <div style={{
        position: 'absolute',
        top: '24px',
        right: '24px',
        zIndex: 10
      }}>
        <button
          onClick={toggleLanguage}
          className="btn btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '0.85rem'
          }}
        >
          {isSw ? (
            <>
              <img src="https://flagcdn.com/w20/tz.png" width="18" alt="Tanzania" style={{ borderRadius: '2px' }} />
              Kiswahili
            </>
          ) : (
            <>
              <img src="https://flagcdn.com/w20/gb.png" width="18" alt="English" style={{ borderRadius: '2px' }} />
              English
            </>
          )}
        </button>
      </div>

      <div className="login-card animate-fade-in">
        <div style={{ textAlign: 'center' }}>
          <div className="login-header-glow">
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }} className="text-gradient">
            Muungano Wetu AI
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            {isForgotView 
              ? (isSw ? 'Rejesha Nenosiri la Utawala' : 'Reset Admin Password') 
              : (isSw ? 'Panel ya Usimamizi wa Chatbot' : 'Chatbot Administration Panel')}
          </p>
        </div>

        {authError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--error)',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '0.875rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {authError}
          </div>
        )}

        {forgotSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: 'var(--success)',
            padding: '12px',
            borderRadius: '10px',
            fontSize: '0.875rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {forgotSuccess}
          </div>
        )}

        {!isForgotView ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="input-group">
              <label className="input-label">
                {isSw ? 'Barua Pepe / Email' : 'Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  placeholder="admin@muungano.go.tz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '44px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '10px' }}>
              <label className="input-label">
                {isSw ? 'Nenosiri / Password' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '44px', paddingRight: '44px', width: '100%' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => { setIsForgotView(true); setAuthError(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontWeight: 500
                }}
              >
                {isSw ? 'Umesahau nenosiri?' : 'Forgot password?'}
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? (isSw ? 'Inaingia...' : 'Logging in...') : (isSw ? 'Ingia Kwenye Mfumo' : 'Login to System')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotSubmit}>
            <div className="input-group">
              <label className="input-label">
                {isSw ? 'Ingiza Barua Pepe Yako' : 'Enter Your Email Address'}
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  placeholder="admin@muungano.go.tz"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ paddingLeft: '44px', width: '100%' }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              {loading ? (isSw ? 'Inatuma...' : 'Sending...') : (isSw ? 'Tuma Ombi la Kurejesha' : 'Send Recovery Request')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => { setIsForgotView(false); setAuthError(''); setForgotSuccess(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                {isSw ? 'Rudi kwenye Kuingia' : 'Back to Login'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
