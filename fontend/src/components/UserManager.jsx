import React, { useState } from 'react';
import { Trash2, ShieldAlert, Award, Search, UserMinus, MessageSquare } from 'lucide-react';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

export default function UserManager({ API_BASE, token, users, fetchUsers, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return language === 'sw' ? 'Haijawahi' : 'Never';
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return language === 'sw' ? 'Sasa hivi' : 'Just now';
    if (diffMins < 60) return language === 'sw' ? `${diffMins} daka zilizopita` : `${diffMins}m ago`;
    if (diffHours < 24) return language === 'sw' ? `${diffHours} masaa yaliyopita` : `${diffHours}h ago`;
    return language === 'sw' ? `${diffDays} siku zilizopita` : `${diffDays}d ago`;
  };

  const isOnline = (dateStr) => {
    if (!dateStr) return false;
    const diffMs = new Date() - new Date(dateStr);
    return diffMs < 15 * 60 * 1000; // active in last 15 minutes
  };

  const handleOpenChatHistory = async (user) => {
    setSelectedUser(user);
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_BASE}/admin/chat-logs/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (id) => {
    const result = await Swal.fire({
      title: language === 'sw' ? 'Futa Mtumiaji?' : 'Delete User?',
      text: language === 'sw' 
        ? 'Je, una uhakika unataka kufuta kabisa wasifu wa kijana huyu?' 
        : 'Are you sure you want to permanently delete this user\'s profile?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--error)',
      confirmButtonText: language === 'sw' ? 'Futa' : 'Delete',
      cancelButtonText: language === 'sw' ? 'Ghairi' : 'Cancel',
      background: 'rgba(18, 20, 32, 0.9)',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/admin/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          Swal.fire({ 
            icon: 'success', 
            title: language === 'sw' ? 'Imefutwa!' : 'Deleted!', 
            text: language === 'sw' ? 'Mtumiaji amefutwa mafanikio.' : 'The user profile has been deleted successfully.', 
            timer: 2000, 
            showConfirmButton: false, 
            background: 'rgba(18, 20, 32, 0.9)', 
            color: '#fff' 
          });
          fetchUsers();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Reset User Points
  const handleResetPoints = async (id) => {
    const result = await Swal.fire({
      title: language === 'sw' ? 'Punguza au Weka Points Sifuri?' : 'Reset Patriot Points?',
      text: language === 'sw' 
        ? 'Je, unataka kurudisha points za mtumiaji huyu kwenye sifuri (0)?' 
        : 'Do you want to reset patriotism points for this user to zero (0)?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: 'var(--primary)',
      confirmButtonText: language === 'sw' ? 'Rudisha Sifuri' : 'Reset to Zero',
      cancelButtonText: language === 'sw' ? 'Ghairi' : 'Cancel',
      background: 'rgba(18, 20, 32, 0.9)',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/admin/users/${id}/reset-points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          Swal.fire({ 
            icon: 'success', 
            title: language === 'sw' ? 'Kazi Imekamilika!' : 'Points Reset!', 
            text: language === 'sw' ? 'Points zimerudishwa sifuri.' : 'Points reset to zero successfully.', 
            timer: 2000, 
            showConfirmButton: false, 
            background: 'rgba(18, 20, 32, 0.9)', 
            color: '#fff' 
          });
          fetchUsers();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    const name = (user.full_name || '').toLowerCase();
    const phone = (user.phone_number || '').toLowerCase();
    const tg = (user.telegram_id || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || phone.includes(query) || tg.includes(query);
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
            {t('user_title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('user_subtitle')}
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder={language === 'sw' ? 'Tafuta jina au namba...' : 'Search name or number...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px', width: '100%', borderRadius: '20px' }}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {language === 'sw' ? 'Mtumiaji' : 'Patriot User'}
                </th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {language === 'sw' ? 'Njia ya Mawasiliano' : 'Communication Channel'}
                </th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {language === 'sw' ? 'Hali ya Usajili' : 'Registration Status'}
                </th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {language === 'sw' ? 'Muda wa Mwisho Active' : 'Last Active'}
                </th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>Points</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {language === 'sw' ? 'Hatua' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const hasWhatsApp = !!user.phone_number;
                const hasTelegram = !!user.telegram_id;

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-glass)' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.1))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'W'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {user.full_name || (language === 'sw' ? 'Mzalendo (Bado Hajasajiliwa)' : 'Patriot (Not Registered)')}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {language === 'sw' ? 'Ilianzishwa:' : 'Joined:'} {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {hasWhatsApp && (
                        <span className="badge badge-whatsapp" style={{ marginRight: '6px' }}>
                          WhatsApp: {user.phone_number}
                        </span>
                      )}
                      {hasTelegram && (
                        <span className="badge badge-telegram">
                          Telegram ID: {user.telegram_id}
                        </span>
                      )}
                      {!hasWhatsApp && !hasTelegram && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {language === 'sw' ? 'Haijulikani' : 'Unknown'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {user.is_registered ? (
                        <span className="badge badge-whatsapp" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                          {language === 'sw' ? 'Sajili' : 'Registered'}
                        </span>
                      ) : (
                        <span className="badge badge-sms" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                          {language === 'sw' ? 'Bado Hajasajiliwa' : 'Not Registered'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isOnline(user.last_active_at) ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#10B981',
                              boxShadow: '0 0 8px #10B981',
                              animation: 'pulse 1.5s infinite'
                            }} />
                            <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: 600 }}>
                              {language === 'sw' ? 'Muda huu' : 'Online'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {getRelativeTime(user.last_active_at)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--primary)' }}>
                        <Award size={16} />
                        <span>{user.points || 0} pts</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenChatHistory(user)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                          title={language === 'sw' ? 'Angalia Mazungumzo' : 'View Conversation'}
                        >
                          <MessageSquare size={14} />
                          {language === 'sw' ? 'Mazungumzo' : 'Chats'}
                        </button>
                        <button
                          onClick={() => handleResetPoints(user.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                          title={language === 'sw' ? 'Weka Points Sifuri' : 'Reset Points to 0'}
                        >
                          {t('user_reset_points')}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error)', gap: '4px' }}
                          title={language === 'sw' ? 'Futa Mtumiaji' : 'Delete User'}
                        >
                          <UserMinus size={14} />
                          {language === 'sw' ? 'Futa' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {language === 'sw' ? 'Hakuna mtumiaji yeyote aliyepatikana kwa ajili ya utafutaji wako.' : 'No patriot matches your search criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Chat History Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{
            width: '100%',
            maxWidth: '600px',
            height: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isOnline(selectedUser.last_active_at) && (
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 8px #10B981',
                      display: 'inline-block'
                    }} />
                  )}
                  {selectedUser.full_name || (language === 'sw' ? 'Mzalendo' : 'Patriot')}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedUser.phone_number ? `WhatsApp: ${selectedUser.phone_number}` : `Telegram ID: ${selectedUser.telegram_id}`}
                </span>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              padding: '24px',
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {loadingHistory ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <div style={{
                    border: '3px solid rgba(255,255,255,0.1)',
                    borderTop: '3px solid var(--primary)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    animation: 'spin 1s linear infinite'
                  }} />
                </div>
              ) : chatHistory.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  {language === 'sw' ? 'Hakuna mazungumzo yoyote bado.' : 'No conversation history found.'}
                </div>
              ) : (
                chatHistory.map((log) => (
                  <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* User message (sent) */}
                    <div style={{
                      alignSelf: 'flex-end',
                      maxWidth: '85%',
                      background: 'linear-gradient(135deg, var(--primary), rgba(99, 102, 241, 0.85))',
                      color: '#fff',
                      padding: '12px 16px',
                      borderRadius: '16px 16px 0 16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      fontSize: '0.95rem',
                      lineHeight: '1.4'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: '4px', opacity: 0.8 }}>
                        {selectedUser.full_name || (language === 'sw' ? 'Mzalendo' : 'Patriot')}
                      </div>
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{log.message_text}</div>
                      <div style={{ textAlign: 'right', fontSize: '0.7rem', opacity: 0.6, marginTop: '4px' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* AI Response (received) */}
                    <div style={{
                      alignSelf: 'flex-start',
                      maxWidth: '85%',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text-primary)',
                      padding: '12px 16px',
                      borderRadius: '16px 16px 16px 0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: '0.95rem',
                      lineHeight: '1.4'
                    }}>
                      <div style={{ fontWeight: 600, fontSize: '0.75rem', marginBottom: '4px', color: 'var(--secondary)' }}>
                        Mwalimu Nyerere AI 🇹🇿
                      </div>
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{log.response_text}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <button
                onClick={() => setSelectedUser(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 20px' }}
              >
                {language === 'sw' ? 'Funga' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
