import React, { useState, useEffect } from 'react';
import { User, Save, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

export default function ProfileTab({ API_BASE, token, admin, setAdmin, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [profileName, setProfileName] = useState(admin?.full_name || '');
  const [profileEmail, setProfileEmail] = useState(admin?.email || '');
  const [profilePhone, setProfilePhone] = useState(admin?.phone_number || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setProfileName(admin.full_name || '');
      setProfileEmail(admin.email || '');
      setProfilePhone(admin.phone_number || '');
    }
  }, [admin]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      Swal.fire({
        icon: 'error',
        title: language === 'sw' ? 'Hitilafu' : 'Error',
        text: language === 'sw' ? 'Jina haliwezi kuwa tupu!' : 'Name cannot be empty!',
        background: 'rgba(18, 20, 32, 0.9)',
        color: '#fff'
      });
      return;
    }
    setProfileLoading(true);

    try {
      const payload = {
        full_name: profileName.trim(),
        email: profileEmail.trim(),
        phone_number: profilePhone.trim() || null
      };

      if (newPassword) {
        if (!currentPassword) {
          Swal.fire({
            icon: 'error',
            title: language === 'sw' ? 'Hitilafu' : 'Error',
            text: language === 'sw' ? 'Tafadhali weka nenosiri lako la sasa ili kubadilisha nenosiri.' : 'Please enter your current password to change password.',
            background: 'rgba(18, 20, 32, 0.9)',
            color: '#fff'
          });
          setProfileLoading(false);
          return;
        }
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const res = await fetch(`${API_BASE}/admin/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: language === 'sw' ? 'Wasifu Umesahihishwa!' : 'Profile Updated!',
          text: language === 'sw' ? 'Taarifa zako zimesahihishwa kikamilifu.' : 'Your details have been successfully updated.',
          timer: 2500,
          showConfirmButton: false,
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        setCurrentPassword('');
        setNewPassword('');

        if (data.admin) {
          localStorage.setItem('adminInfo', JSON.stringify(data.admin));
          if (setAdmin) {
            setAdmin(data.admin);
          }
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: language === 'sw' ? 'Hitilafu' : 'Error',
          text: data.message || (language === 'sw' ? 'Imeshindwa kusahihisha wasifu.' : 'Failed to update profile.'),
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
      setProfileLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          {t('profile_title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('profile_subtitle')}
        </p>
      </div>

      <div className="glass-card" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={20} style={{ color: 'var(--primary)' }} />
          {language === 'sw' ? 'Hariri Taarifa za Wasifu' : 'Edit Profile Details'}
        </h3>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{t('profile_name')}</label>
            <input
              type="text"
              className="input-field"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={profileLoading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{t('profile_email')}</label>
            <input
              type="email"
              className="input-field"
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              disabled={profileLoading}
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{t('profile_phone')}</label>
            <input
              type="text"
              className="input-field"
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              disabled={profileLoading}
              placeholder="Mfano: +255..."
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', margin: '8px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 600 }}>
            <Lock size={14} />
            <span>{t('profile_password_section')}</span>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{t('profile_current_password')}</label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={profileLoading}
              placeholder={language === 'sw' ? 'Weka nenosiri la sasa' : 'Enter current password'}
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">{t('profile_new_password')}</label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={profileLoading}
              placeholder={language === 'sw' ? 'Nenosiri jipya (angalau herufi 8)' : 'New password (min 8 chars)'}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', alignSelf: 'flex-start', marginTop: '8px' }}
            disabled={profileLoading}
          >
            <Save size={18} />
            {profileLoading ? (language === 'sw' ? 'Inasasisha...' : 'Updating...') : t('profile_submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
