import React, { useState, useEffect } from 'react';
import { Megaphone, PlusCircle, RefreshCw, Send, HelpCircle, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

export default function BroadcastTab({ API_BASE, token, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [broadcastJobs, setBroadcastJobs] = useState([]);
  const [message, setMessage] = useState('');
  const [jobType, setJobType] = useState('all_registered');
  const [channel, setChannel] = useState('whatsapp');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchBroadcastJobs = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast-jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastJobs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchBroadcastJobs();
  }, []);

  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: message.trim(), job_type: jobType, channel })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: language === 'sw' ? 'Ujumbe Umetumwa!' : 'Broadcast Initiated!',
          text: language === 'sw' ? 'Kazi ya kutuma ujumbe imeanzishwa kwenye background queue.' : 'The broadcast job was added to the background queue.',
          timer: 2500,
          showConfirmButton: false,
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        setMessage('');
        fetchBroadcastJobs();
      } else {
        Swal.fire({
          icon: 'error',
          title: language === 'sw' ? 'Imeshindwa' : 'Failed',
          text: data.message || (language === 'sw' ? 'Imeshindwa kuanzisha matangazo.' : 'Failed to queue broadcast.'),
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
            {t('broadcast_title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('broadcast_subtitle')}
          </p>
        </div>
        <button
          onClick={fetchBroadcastJobs}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          disabled={fetching}
        >
          <RefreshCw size={16} className={fetching ? 'animate-spin' : ''} />
          {fetching ? (language === 'sw' ? 'Inapakia...' : 'Loading...') : (language === 'sw' ? 'Pakia Upya' : 'Refresh')}
        </button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1fr', gap: '32px', alignItems: 'start' }}>
        {/* Create Broadcast Form */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={20} style={{ color: 'var(--primary)' }} />
            {language === 'sw' ? 'Tuma Tangazo Jipya' : 'Send New Broadcast'}
          </h3>
          <form onSubmit={handleCreateBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">
                {language === 'sw' ? 'Maudhui ya Ujumbe (Message Text)' : 'Message Content (Text)'}
              </label>
              <textarea
                className="input-field textarea-field"
                placeholder={language === 'sw' ? 'Ndugu zangu, leo tunaadhimisha miaka ya muungano wetu...' : 'My fellow citizens, today we celebrate the anniversary of our union...'}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">{language === 'sw' ? 'Aina ya Kazi (Audience)' : 'Target Audience'}</label>
                <select
                  className="input-field"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  style={{ background: 'rgba(15, 17, 28, 0.9)' }}
                >
                  <option value="all_registered">{language === 'sw' ? 'Wote Waliojisajili' : 'All Registered Patriots'}</option>
                  <option value="all_users">{language === 'sw' ? 'Watumiaji Wote (Hata wasiojisajili)' : 'All Interacted Users'}</option>
                </select>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">{language === 'sw' ? 'Njia ya Kutuma (Channel)' : 'Transmission Channel'}</label>
                <select
                  className="input-field"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  style={{ background: 'rgba(15, 17, 28, 0.9)' }}
                >
                  <option value="whatsapp">WhatsApp Business</option>
                  <option value="sms_fallback">{language === 'sw' ? 'SMS (Kama mtumiaji hana WhatsApp)' : 'SMS Fallback'}</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }} disabled={loading}>
              <Send size={18} />
              {loading ? (language === 'sw' ? 'Inatuma...' : 'Sending...') : t('broadcast_send')}
            </button>
          </form>
        </div>

        {/* Transmission Queue Status */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Megaphone size={20} style={{ color: 'var(--secondary)' }} />
            {language === 'sw' ? 'Hali ya Queue ya Uwasilishaji' : 'Delivery Queue Status'}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto' }}>
            {broadcastJobs.map((job) => {
              const total = (job.sent_count || 0) + (job.failed_count || 0);
              const progress = total > 0 ? Math.round((job.sent_count / total) * 100) : 0;
              const isCompleted = job.status === 'completed';
              const isProcessing = job.status === 'processing';

              return (
                <div key={job.id} style={{
                  padding: '14px',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.01)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                    <span className={`badge badge-${job.status}`} style={{ textTransform: 'capitalize' }}>
                      {job.status}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    margin: '6px 0'
                  }}>
                    {job.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    <span>{language === 'sw' ? 'Imefanikiwa:' : 'Sent:'} <strong style={{ color: 'var(--success)' }}>{job.sent_count}</strong></span>
                    <span>{language === 'sw' ? 'Zilizofeli:' : 'Failed:'} <strong style={{ color: 'var(--error)' }}>{job.failed_count}</strong></span>
                  </div>
                </div>
              );
            })}

            {broadcastJobs.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '60px 0' }}>
                {language === 'sw' ? 'Hakuna kazi yoyote ya wingi iliyorekodiwa bado.' : 'No broadcast jobs have been initiated yet.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
