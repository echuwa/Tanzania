import React, { useState } from 'react';
import { PlusCircle, Trash2, Calendar, BookOpen, Edit3 } from 'lucide-react';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

export default function StoryManager({ API_BASE, token, stories, fetchStories, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [newStory, setNewStory] = useState({ title: '', content: '', publish_date: '' });
  const [editingStoryId, setEditingStoryId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Add or Update Story
  const handleStorySubmit = async (e) => {
    e.preventDefault();
    if (!newStory.title || !newStory.content || !newStory.publish_date) return;
    setLoading(true);

    const isEdit = !!editingStoryId;
    const url = isEdit
      ? `${API_BASE}/admin/stories/${editingStoryId}`
      : `${API_BASE}/admin/stories`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStory)
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: isEdit 
            ? (language === 'sw' ? 'Hadithi Imesahihishwa!' : 'Story Updated!') 
            : (language === 'sw' ? 'Hadithi Mpya Imeongezwa!' : 'New Story Added!'),
          timer: 2000,
          showConfirmButton: false,
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        setNewStory({ title: '', content: '', publish_date: '' });
        setEditingStoryId(null);
        fetchStories();
      } else {
        Swal.fire({ icon: 'error', title: language === 'sw' ? 'Imeshindwa' : 'Failed', text: data.message, background: 'rgba(18, 20, 32, 0.9)', color: '#fff' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Story
  const handleDeleteStory = async (id) => {
    const result = await Swal.fire({
      title: language === 'sw' ? 'Futa Hadithi?' : 'Delete Story?',
      text: language === 'sw' ? 'Je, una uhakika unataka kufuta hadithi hii?' : 'Are you sure you want to delete this story?',
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
        const res = await fetch(`${API_BASE}/admin/stories/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: language === 'sw' ? 'Imefutwa!' : 'Deleted!', text: language === 'sw' ? 'Hadithi imefutwa.' : 'Story deleted successfully.', timer: 2000, showConfirmButton: false, background: 'rgba(18, 20, 32, 0.9)', color: '#fff' });
          fetchStories();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Edit Story Trigger
  const handleEditClick = (story) => {
    setEditingStoryId(story.id);
    setNewStory({
      title: story.title,
      content: story.content,
      publish_date: story.publish_date
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          {t('stories')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('story_subtitle')}
        </p>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', alignItems: 'start' }}>
        {/* Story List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {stories.map(story => (
            <div key={story.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{story.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <Calendar size={14} />
                    <span>{language === 'sw' ? 'Inachapishwa:' : 'Publish Date:'} {story.publish_date}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEditClick(story)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', gap: '6px', fontSize: '0.85rem' }}
                  >
                    <Edit3 size={14} />
                    {language === 'sw' ? 'Rekebisha' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteStory(story.id)}
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', gap: '6px', fontSize: '0.85rem', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error)' }}
                  >
                    <Trash2 size={14} />
                    {language === 'sw' ? 'Futa' : 'Delete'}
                  </button>
                </div>
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '0.95rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                background: 'rgba(0,0,0,0.1)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid var(--border-glass)'
              }}>
                {story.content}
              </p>
            </div>
          ))}

          {stories.length === 0 && (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <BookOpen size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>{language === 'sw' ? 'Hakuna hadithi iliyosajiliwa bado.' : 'No stories registered yet.'}</h3>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <div className="glass-card" style={{ position: 'sticky', top: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
            {editingStoryId 
              ? (language === 'sw' ? 'Hariri Hadithi' : 'Edit Story') 
              : (language === 'sw' ? 'Sajili Hadithi Mpya' : 'Add New Story')}
          </h3>
          <form onSubmit={handleStorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>
                {language === 'sw' ? 'Kichwa cha Hadithi (Title)' : 'Story Title'}
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Kuungana kwa Tanganyika na Zanzibar"
                value={newStory.title}
                onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                required
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>
                {language === 'sw' ? 'Tarehe ya Kuchapishwa (Publish Date)' : 'Publish Date'}
              </label>
              <input
                type="date"
                className="input-field"
                value={newStory.publish_date}
                onChange={(e) => setNewStory({ ...newStory, publish_date: e.target.value })}
                required
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>
                {language === 'sw' ? 'Maudhui ya Hadithi (Content)' : 'Story Content'}
              </label>
              <textarea
                className="input-field textarea-field"
                placeholder="Andika mafunzo ya kihistoria kwa kina hapa..."
                value={newStory.content}
                onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                required
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                {editingStoryId ? (language === 'sw' ? 'Hifadhi Sahihisho' : 'Save Changes') : (language === 'sw' ? 'Ongeza Hadithi' : 'Add Story')}
              </button>
              {editingStoryId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingStoryId(null);
                    setNewStory({ title: '', content: '', publish_date: '' });
                  }}
                >
                  {language === 'sw' ? 'Ghairi' : 'Cancel'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
