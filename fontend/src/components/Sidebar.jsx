import React from 'react';
import {
  BarChart2,
  BookOpen,
  HelpCircle,
  LogOut,
  Megaphone,
  MessageSquare,
  Sparkles,
  Smartphone,
  Trophy,
  Users,
  ShieldCheck,
  Settings
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, admin, onLogout, language, toggleLanguage }) {
  const isSuper = admin?.role === 'superadmin';

  // Navigation Items
  const menuItems = [
    { id: 'overview', name: language === 'sw' ? 'Muhtasari' : 'Overview', icon: <BarChart2 size={20} />, roles: ['admin', 'superadmin'] },
    { id: 'simulator', name: language === 'sw' ? 'Simulator' : 'Simulator', icon: <Smartphone size={20} />, roles: ['admin', 'superadmin'] },
    { id: 'quizzes', name: language === 'sw' ? 'Quiz & Moduli' : 'Quizzes & Modules', icon: <HelpCircle size={20} />, roles: ['superadmin'] },
    { id: 'stories', name: language === 'sw' ? 'Hadithi za Leo' : 'Daily Stories', icon: <BookOpen size={20} />, roles: ['superadmin'] },
    { id: 'users', name: language === 'sw' ? 'Vijana Wazalendo' : 'Patriot Youth', icon: <Trophy size={20} />, roles: ['admin', 'superadmin'] },
    { id: 'analytics', name: language === 'sw' ? 'Uchambuzi / Logs' : 'Analytics & Logs', icon: <MessageSquare size={20} />, roles: ['admin', 'superadmin'] },
    { id: 'broadcast', name: language === 'sw' ? 'Matangazo' : 'Broadcasts', icon: <Megaphone size={20} />, roles: ['admin', 'superadmin'] },
    { id: 'admins', name: language === 'sw' ? 'Wasimamizi' : 'Admin Managers', icon: <Users size={20} />, roles: ['superadmin'] },
    { id: 'settings', name: language === 'sw' ? 'Mfumo Prompt' : 'System Prompt', icon: <Settings size={20} />, roles: ['admin', 'superadmin'] }
  ];

  // Filter items based on current admin's role
  const visibleItems = menuItems.filter(item => {
    if (isSuper) return true;
    return item.roles.includes('admin');
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Sparkles style={{ color: 'var(--primary)' }} />
        <span>Muungano Wetu AI</span>
      </div>

      <div style={{ padding: '0 16px', marginBottom: '16px' }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
            {language === 'sw' ? 'Lugha / Language' : 'Language / Lugha'}
          </label>
          <select
            value={language}
            onChange={(e) => {
              if (e.target.value !== language) {
                toggleLanguage();
              }
            }}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'%23a0aec0\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 8px center',
              backgroundSize: '18px'
            }}
          >
            <option value="sw" style={{ background: '#121420', color: '#fff' }}>🇹🇿 Kiswahili</option>
            <option value="en" style={{ background: '#121420', color: '#fff' }}>🇺🇸 English</option>
          </select>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', margin: '8px 0', paddingRight: '4px' }}>
        <ul className="sidebar-menu">
          {visibleItems.map(item => (
            <li
              key={item.id}
              className={`sidebar-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </nav>

      <div style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-glass)',
        paddingTop: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            padding: '8px',
            borderRadius: '10px',
            transition: 'background 0.2s',
            background: activeTab === 'profile' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            border: activeTab === 'profile' ? '1px solid var(--border-glass)' : '1px solid transparent'
          }}
          className="sidebar-profile-widget"
          title={language === 'sw' ? "Hariri Wasifu / Edit Profile" : "Edit Profile"}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'white'
          }}>
            {admin?.full_name ? admin.full_name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {admin?.full_name || (language === 'sw' ? 'Msimamizi' : 'Admin')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {admin?.role === 'superadmin'
                ? (language === 'sw' ? 'Msimamizi Mkuu' : 'Super Admin')
                : (language === 'sw' ? 'Msimamizi' : 'Standard Admin')}
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '10px', fontSize: '0.875rem', gap: '8px' }}
        >
          <LogOut size={16} />
          <span>{language === 'sw' ? 'Ondoka' : 'Logout'}</span>
        </button>
      </div>
    </aside>
  );
}
