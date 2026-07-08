import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Mail, Users, Shield } from 'lucide-react';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

export default function AdminManager({ API_BASE, token, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [admins, setAdmins] = useState([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    if (!email || !fullName) return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, full_name: fullName, role })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.dev_invite_url) {
          // Dev mock invite mode
          Swal.fire({
            icon: 'warning',
            title: 'Invite Sent (Mock Mode)',
            html: `Mwaliko haukutumwa kwa email kwa sababu SMTP haijawekwa.<br/><br/><strong>Kiungo cha kujisajili:</strong><br/><a href="${data.dev_invite_url}" target="_blank" style="color:#6366f1; word-break:break-all;">${data.dev_invite_url}</a>`,
            background: 'rgba(18, 20, 32, 0.95)',
            color: '#fff'
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: language === 'sw' ? 'Mwaliko Umetumwa!' : 'Invitation Sent!',
            text: language === 'sw' ? 'Barua pepe ya mwaliko imetumwa kwa wasifu uliochaguliwa.' : 'An invitation email has been sent successfully.',
            timer: 2000,
            showConfirmButton: false,
            background: 'rgba(18, 20, 32, 0.9)',
            color: '#fff'
          });
        }
        setEmail('');
        setFullName('');
        fetchAdmins();
      } else {
        Swal.fire({ 
          icon: 'error', 
          title: language === 'sw' ? 'Imeshindwa' : 'Failed', 
          text: data.message || (language === 'sw' ? 'Imeshindwa kutuma mwaliko.' : 'Failed to send invite.'), 
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

  const handleDeleteAdmin = async (id) => {
    const result = await Swal.fire({
      title: language === 'sw' ? 'Futa Msimamizi?' : 'Remove Administrator?',
      text: language === 'sw' ? 'Je, una uhakika unataka kufuta msimamizi huyu?' : 'Are you sure you want to remove this administrator?',
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
        const res = await fetch(`${API_BASE}/admin/admins/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          Swal.fire({ 
            icon: 'success', 
            title: language === 'sw' ? 'Imefutwa!' : 'Removed!', 
            text: language === 'sw' ? 'Msimamizi amefutwa.' : 'Administrator removed successfully.', 
            timer: 2000, 
            showConfirmButton: false, 
            background: 'rgba(18, 20, 32, 0.9)', 
            color: '#fff' 
          });
          fetchAdmins();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          {t('admin_title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('admin_subtitle')}
        </p>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1.1fr', gap: '32px', alignItems: 'start' }}>
        {/* Admins list */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.1rem' }}>
              {language === 'sw' ? 'Wasimamizi Waliojiunga' : 'Active Administrators'}
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {language === 'sw' ? 'Jina' : 'Name'}
                  </th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>Role</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {language === 'sw' ? 'Hatua' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((adm) => (
                  <tr key={adm.id} style={{ borderBottom: '1px solid var(--border-glass)' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px', fontWeight: 600 }}>{adm.full_name}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{adm.email}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge badge-${adm.role === 'superadmin' ? 'telegram' : 'whatsapp'}`}>
                        {adm.role === 'superadmin'
                          ? (language === 'sw' ? 'Msimamizi Mkuu' : 'Super Admin')
                          : (language === 'sw' ? 'Msimamizi' : 'Standard Admin')}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {adm.role !== 'superadmin' ? (
                        <button
                          onClick={() => handleDeleteAdmin(adm.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error)', gap: '4px' }}
                          title={language === 'sw' ? 'Futa Admin' : 'Remove Admin'}
                        >
                          <Trash2 size={14} />
                          {language === 'sw' ? 'Futa' : 'Delete'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {language === 'sw' ? 'Msimamizi Mkuu' : 'Super Admin'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invite Admin Form */}
        <div className="glass-card" style={{ position: 'sticky', top: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
            {t('admin_invite')}
          </h3>

          <form onSubmit={handleInviteAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>{t('admin_name')}</label>
              <input
                type="text"
                className="input-field"
                placeholder="John Deo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>{t('admin_email')}</label>
              <input
                type="email"
                className="input-field"
                placeholder="john@muungano.go.tz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Role</label>
              <select
                className="input-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ background: 'rgba(15, 17, 28, 0.9)' }}
              >
                <option value="admin">{language === 'sw' ? 'Standard Admin (Msaidizi)' : 'Standard Admin (Assistant)'}</option>
                <option value="superadmin">{language === 'sw' ? 'Super Admin (Utawala Mkuu)' : 'Super Admin (Owner)'}</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '12px', marginTop: '8px' }} disabled={loading}>
              {language === 'sw' ? 'Tuma Mwaliko (Invite)' : 'Send Invitation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
