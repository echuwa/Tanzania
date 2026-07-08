import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, MessageSquare, RefreshCw, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

export default function AnalyticsTab({ API_BASE, token, systemAnalytics, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [logs, setLogs] = useState([]);
  const [failedMsgs, setFailedMsgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [channelFilter, setChannelFilter] = useState('');

  // Fetch full log history
  const fetchLogsAndErrors = async () => {
    setLoading(true);
    try {
      // Fetch Chat Logs list
      const resLogs = await fetch(`${API_BASE}/admin/chat-logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resLogs.ok) {
        const dataLogs = await resLogs.json();
        setLogs(dataLogs);
      }

      // Fetch Failed Messages list
      const resFailed = await fetch(`${API_BASE}/admin/failed-messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resFailed.ok) {
        const dataFailed = await resFailed.json();
        setFailedMsgs(dataFailed);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndErrors();

    // Establish Server-Sent Events (SSE) stream for real-time chat updates
    const tokenQuery = encodeURIComponent(token);
    const eventSource = new EventSource(`${API_BASE}/admin/live-chats?token=${tokenQuery}`);

    eventSource.onmessage = (event) => {
      try {
        const newLog = JSON.parse(event.data);
        console.log('[SSE] Live chat log received:', newLog);
        
        // Add a temporary "isLive: true" flag to show a flashy badge on new messages
        newLog.isLive = true;

        setLogs((prevLogs) => {
          // Prevent duplicates if already fetched via HTTP
          if (prevLogs.some(log => log.id === newLog.id)) return prevLogs;
          return [newLog, ...prevLogs];
        });
      } catch (err) {
        console.error('[SSE] Error processing live message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] EventSource connection error:', err);
    };

    return () => {
      eventSource.close();
      console.log('[SSE] EventSource stream closed.');
    };
  }, [API_BASE, token]);

  // Delete Chat Log
  const handleDeleteLog = async (id) => {
    const result = await Swal.fire({
      title: language === 'sw' ? 'Futa Log ya Mazungumzo?' : 'Delete Conversation Log?',
      text: language === 'sw' ? 'Kitendo hiki hakiwezi kurejeshwa!' : 'This action cannot be undone!',
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
        const res = await fetch(`${API_BASE}/admin/chat-logs/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          Swal.fire({ 
            icon: 'success', 
            title: language === 'sw' ? 'Imefutwa!' : 'Deleted!', 
            text: language === 'sw' ? 'Chat log imefutwa.' : 'The conversation log has been deleted.', 
            timer: 2000, 
            showConfirmButton: false, 
            background: 'rgba(18, 20, 32, 0.9)', 
            color: '#fff' 
          });
          fetchLogsAndErrors();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filter logs by channel
  const filteredLogs = logs.filter(log => {
    if (!channelFilter) return true;
    return log.channel.toLowerCase() === channelFilter.toLowerCase();
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
            {t('analytics_title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('analytics_subtitle')}
          </p>
        </div>
        <button
          onClick={fetchLogsAndErrors}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {loading ? (language === 'sw' ? 'Inapakia...' : 'Loading...') : (language === 'sw' ? 'Pakia Upya' : 'Refresh')}
        </button>
      </div>

      {/* Tabs / Filters */}
      <div className="glass-tab-container" style={{ maxWidth: '400px', marginBottom: '24px' }}>
        <button className={`glass-tab ${channelFilter === '' ? 'active' : ''}`} onClick={() => setChannelFilter('')}>
          {language === 'sw' ? 'Zote' : 'All'}
        </button>
        <button className={`glass-tab ${channelFilter === 'whatsapp' ? 'active' : ''}`} onClick={() => setChannelFilter('whatsapp')}>WhatsApp</button>
        <button className={`glass-tab ${channelFilter === 'telegram' ? 'active' : ''}`} onClick={() => setChannelFilter('telegram')}>Telegram</button>
        <button className={`glass-tab ${channelFilter === 'sms' ? 'active' : ''}`} onClick={() => setChannelFilter('sms')}>SMS</button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1.1fr', gap: '24px' }}>
        {/* Chat Logs List */}
        <div className="glass-card" style={{ padding: '24px 0' }}>
          <div style={{ padding: '0 24px 20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} style={{ color: 'var(--primary)' }} />
              {t('analytics_chat_logs')} ({filteredLogs.length})
            </h3>
          </div>

          <div style={{ maxHeight: '550px', overflowY: 'auto', padding: '16px 24px' }}>
            {filteredLogs.map(log => (
              <div key={log.id} style={{
                padding: '16px',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                marginBottom: '16px',
                background: 'rgba(255,255,255,0.01)',
                position: 'relative'
              }}>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  <Trash2 size={16} />
                </button>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span className={`badge badge-${log.channel.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>
                    {log.channel}
                  </span>
                  {log.isLive && (
                    <span className="badge" style={{
                      fontSize: '0.7rem',
                      background: 'linear-gradient(135deg, #EF4444, #F87171)',
                      color: '#fff',
                      fontWeight: 'bold',
                      animation: 'blink 1.2s infinite',
                      letterSpacing: '0.5px'
                    }}>
                      LIVE
                    </span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
                  <div>
                    <strong style={{ color: 'var(--primary)' }}>
                      {log.User ? `${log.User.full_name || 'Mzalendo'} (${log.User.phone_number || 'Namba Haipo'})` : (language === 'sw' ? 'Kijana' : 'User')}:
                    </strong> {log.message_text}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--secondary)' }}>Mwalimu AI:</strong> {log.response_text}
                  </div>
                </div>
              </div>
            ))}

            {filteredLogs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
                {language === 'sw' ? 'Hakuna kumbukumbu za mazungumzo zilizopatikana.' : 'No chat conversations found.'}
              </div>
            )}
          </div>
        </div>

        {/* Failed Webhook / SMS Deliveries */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} style={{ color: 'var(--error)' }} />
            {t('analytics_failed_msgs')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '550px', overflowY: 'auto' }}>
            {failedMsgs.map(msg => (
              <div key={msg.id} style={{
                padding: '14px',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--error)' }}>
                    Code: {msg.error_code || '131030'}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {new Date(msg.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <strong>{language === 'sw' ? 'Namba:' : 'Phone:'}</strong> {msg.phone_number || 'Unknown'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {msg.error_message || 'User is not registered in Sandbox (Error 131030). Check developer dashboard to add test recipients.'}
                </div>
              </div>
            ))}

            {failedMsgs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
                {language === 'sw' ? 'Hakuna makosa yoyote ya utoaji ujumbe yaliyosajiliwa.' : 'No transmission errors recorded.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
