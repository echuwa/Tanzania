import React from 'react';
import { Users, MessageSquare, HelpCircle, Trophy, BarChart2, Shield } from 'lucide-react';
import { translations } from '../utils/translations';

export default function OverviewTab({ stats, systemAnalytics, setActiveTab, admin, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const summary = systemAnalytics?.summary || stats?.summary || {
    totalUsers: 0,
    registeredUsers: 0,
    totalMessages: 0,
    totalQuizAttempts: 0
  };

  const channelStats = systemAnalytics?.channelBreakdown || stats?.channelStats || [];
  const leaderboard = systemAnalytics?.topUsers || stats?.leaderboard || [];

  // Card widgets configuration with targetTab destinations
  const widgets = [
    {
      title: language === 'sw' ? 'Jumla ya Watumiaji' : 'Total Patriots',
      value: summary.totalUsers || summary.totalStudents || 0,
      icon: <Users size={24} style={{ color: 'var(--primary)' }} />,
      desc: language === 'sw' ? 'Vijana wote walioingia kwenye mfumo' : 'All patriots registered in the system',
      targetTab: 'users'
    },
    {
      title: language === 'sw' ? 'Watumiaji WhatsApp' : 'WhatsApp Patriots',
      value: summary.whatsappUsers || 0,
      icon: <MessageSquare size={24} style={{ color: 'var(--success)' }} />,
      desc: language === 'sw' ? 'Waliojiunga kupitia WhatsApp Business' : 'Joined via WhatsApp Business platform',
      targetTab: 'users'
    },
    {
      title: language === 'sw' ? 'Ujumbe Uliochakatwa' : 'Processed Messages',
      value: summary.totalMessages || 0,
      icon: <BarChart2 size={24} style={{ color: 'var(--secondary)' }} />,
      desc: language === 'sw' ? 'Ujumbe uliopokelewa na kujibiwa' : 'Total incoming and outgoing messages',
      targetTab: 'analytics'
    },
    {
      title: language === 'sw' ? 'Jaribio la Quiz' : 'Quiz Attempts',
      value: summary.totalQuizAttempts || 0,
      icon: <HelpCircle size={24} style={{ color: 'var(--warning)' }} />,
      desc: language === 'sw' ? 'Jumla ya michezo ya trivia iliyochezwa' : 'Total trivia quiz challenges taken',
      targetTab: admin?.role === 'superadmin' ? 'quizzes' : null
    }
  ];

  // Custom SVG Bar Chart calculation for channels
  const maxChannelVal = channelStats.length > 0
    ? Math.max(...channelStats.map(c => parseInt(c.count || 0)))
    : 100;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          {t('overview_title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('overview_subtitle')}
        </p>
      </div>

      {/* Widgets Grid */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', marginBottom: '32px' }}>
        {widgets.map((widget, i) => {
          const isClickable = widget.targetTab && setActiveTab;
          return (
            <div
              key={i}
              className={`glass-card stat-card ${isClickable ? 'clickable-card' : ''}`}
              onClick={() => isClickable && setActiveTab(widget.targetTab)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {widget.title}
                </span>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {widget.icon}
                </div>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>
                {widget.value.toLocaleString()}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {widget.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Analytics Charts & Leaderboard Grid */}
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        {/* SVG Channels Chart */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart2 size={18} style={{ color: 'var(--primary)' }} />
            {t('channels_breakdown')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
            {channelStats.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                {language === 'sw' ? 'Hakuna data ya chaneli bado' : 'No channel stats available'}
              </div>
            ) : (
              channelStats.map((chan, idx) => {
                const percentage = maxChannelVal > 0 ? (parseInt(chan.count) / maxChannelVal) * 100 : 0;
                const channelColors = {
                  whatsapp: 'linear-gradient(90deg, #10b981, #34d399)',
                  telegram: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                  sms: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                  ussd: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
                  webchat: 'linear-gradient(90deg, #6366f1, #818cf8)'
                };
                const color = channelColors[chan.channel.toLowerCase()] || 'linear-gradient(90deg, #64748b, #94a3b8)';

                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{chan.channel}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {parseInt(chan.count).toLocaleString()} {language === 'sw' ? 'ujumbe' : 'messages'}
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        background: color,
                        width: `${percentage}%`,
                        borderRadius: '4px',
                        transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Top 5 Patriotic Youth */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Trophy size={18} style={{ color: 'var(--warning)' }} />
            {t('leaderboard_title')}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {leaderboard.slice(0, 5).map((user, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                background: idx === 0 ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                border: idx === 0 ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid var(--border-glass)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: idx === 0 ? '#f59e0b' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#b45309' : 'rgba(255,255,255,0.05)',
                    color: idx < 3 ? 'black' : 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.full_name || 'Mzalendo'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {user.phone_number || (user.telegram_id ? `Telegram: ${user.telegram_id}` : 'Namba haipo')}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1rem' }}>
                    {user.points || 0}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px' }}>pts</span>
                </div>
              </div>
            ))}
            {leaderboard.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                {t('leaderboard_empty')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
