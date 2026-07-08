import React, { useState } from 'react';
import { PlusCircle, Trash2, HelpCircle, FileText, ChevronRight } from 'lucide-react';
import Swal from 'sweetalert2';
import { translations } from '../utils/translations';

export default function QuizManager({ API_BASE, token, quizzes, fetchQuizzes, language }) {
  const t = (key) => translations[language]?.[key] || translations['sw'][key] || key;

  const [newModule, setNewModule] = useState({ title: '', description: '', order_index: '' });
  const [newQuestion, setNewQuestion] = useState({
    module_id: '',
    question_text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correct_option: 0,
    points: 10
  });

  const [loading, setLoading] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(quizzes[0]?.id || '');

  // Add Module
  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModule.title || !newModule.description || newModule.order_index === '') return;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/admin/modules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newModule.title,
          description: newModule.description,
          order_index: parseInt(newModule.order_index)
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: language === 'sw' ? 'Moduli Imeongezwa!' : 'Module Added!',
          text: language === 'sw' ? 'Moduli mpya imesajiliwa kikamilifu.' : 'The new module has been successfully registered.',
          timer: 2000,
          showConfirmButton: false,
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        setNewModule({ title: '', description: '', order_index: '' });
        fetchQuizzes();
      } else {
        Swal.fire({ icon: 'error', title: language === 'sw' ? 'Imeshindwa' : 'Failed', text: data.message, background: 'rgba(18, 20, 32, 0.9)', color: '#fff' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add Question
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const mid = newQuestion.module_id || quizzes[0]?.id;
    if (!mid || !newQuestion.question_text || !newQuestion.optionA || !newQuestion.optionB) {
      Swal.fire({ 
        icon: 'warning', 
        title: language === 'sw' ? 'Fomu haijakamilika' : 'Incomplete Form', 
        text: language === 'sw' ? 'Tafadhali jaza swali na machaguo angalau mawili.' : 'Please fill in the question text and at least two options.', 
        background: 'rgba(18, 20, 32, 0.9)', 
        color: '#fff' 
      });
      return;
    }
    setLoading(true);

    const optionsArray = [
      newQuestion.optionA.trim(),
      newQuestion.optionB.trim(),
      newQuestion.optionC.trim(),
      newQuestion.optionD.trim()
    ].filter(o => o !== '');

    try {
      const res = await fetch(`${API_BASE}/admin/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module_id: mid,
          question_text: newQuestion.question_text,
          options: optionsArray,
          correct_option: parseInt(newQuestion.correct_option),
          points: parseInt(newQuestion.points)
        })
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: language === 'sw' ? 'Swali Limeongezwa!' : 'Question Added!',
          timer: 2000,
          showConfirmButton: false,
          background: 'rgba(18, 20, 32, 0.9)',
          color: '#fff'
        });
        setNewQuestion({
          module_id: mid,
          question_text: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correct_option: 0,
          points: 10
        });
        fetchQuizzes();
      } else {
        Swal.fire({ icon: 'error', title: language === 'sw' ? 'Imeshindwa' : 'Failed', text: data.message, background: 'rgba(18, 20, 32, 0.9)', color: '#fff' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete Module
  const handleDeleteModule = async (id) => {
    const result = await Swal.fire({
      title: language === 'sw' ? 'Una uhakika?' : 'Are you sure?',
      text: language === 'sw' ? 'Utafuta moduli hii na maswali yake yote!' : 'You will delete this module and all its related questions!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--error)',
      cancelButtonColor: 'rgba(255,255,255,0.05)',
      confirmButtonText: language === 'sw' ? 'Ndio, Futa!' : 'Yes, Delete!',
      cancelButtonText: language === 'sw' ? 'Ghairi' : 'Cancel',
      background: 'rgba(18, 20, 32, 0.9)',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE}/admin/modules/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: language === 'sw' ? 'Imefutwa!' : 'Deleted!', text: language === 'sw' ? 'Moduli imefutwa.' : 'Module deleted.', timer: 2000, showConfirmButton: false, background: 'rgba(18, 20, 32, 0.9)', color: '#fff' });
          fetchQuizzes();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (id) => {
    const result = await Swal.fire({
      title: language === 'sw' ? 'Futa Swali?' : 'Delete Question?',
      text: language === 'sw' ? 'Je, una uhakika unataka kufuta swali hili?' : 'Are you sure you want to delete this question?',
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
        const res = await fetch(`${API_BASE}/admin/questions/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: language === 'sw' ? 'Imefutwa!' : 'Deleted!', text: language === 'sw' ? 'Swali limefutwa.' : 'Question deleted.', timer: 2000, showConfirmButton: false, background: 'rgba(18, 20, 32, 0.9)', color: '#fff' });
          fetchQuizzes();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const activeModule = quizzes.find(q => q.id === (selectedModuleId || quizzes[0]?.id));

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', marginBottom: '8px' }}>
          {t('quizzes')}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {t('quiz_subtitle')}
        </p>
      </div>

      <div className="grid-3" style={{ gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* Sidebar Modules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>
              {language === 'sw' ? 'Orodha ya Moduli' : 'Modules List'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {quizzes.map(mod => (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModuleId(mod.id)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: (selectedModuleId || quizzes[0]?.id) === mod.id
                      ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.1))'
                      : 'rgba(255,255,255,0.01)',
                    border: (selectedModuleId || quizzes[0]?.id) === mod.id
                      ? '1px solid var(--primary)'
                      : '1px solid var(--border-glass)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {mod.order_index}. {mod.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {(mod.Questions || []).length} {language === 'sw' ? 'maswali' : 'questions'}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
              {quizzes.length === 0 && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                  {language === 'sw' ? 'Hakuna moduli yoyote bado.' : 'No modules registered yet.'}
                </div>
              )}
            </div>
          </div>

          {/* Add Module Form */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
              {language === 'sw' ? 'Moduli Mpya' : 'New Module'}
            </h3>
            <form onSubmit={handleAddModule} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>
                  {language === 'sw' ? 'Kichwa cha Habari (Title)' : 'Module Title'}
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Kuzaliwa kwa TANU"
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  required
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>
                  {language === 'sw' ? 'Maelezo (Description)' : 'Module Description'}
                </label>
                <textarea
                  className="input-field"
                  placeholder="Historia fupi ya chama cha TANU..."
                  value={newModule.description}
                  onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                  required
                />
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>
                  {language === 'sw' ? 'Namba ya Mfuatano (Order Index)' : 'Order Index'}
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="1"
                  value={newModule.order_index}
                  onChange={(e) => setNewModule({ ...newModule, order_index: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }} disabled={loading}>
                {language === 'sw' ? 'Ongeza Moduli' : 'Add Module'}
              </button>
            </form>
          </div>
        </div>

        {/* Module Content & Add Question Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeModule ? (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px' }}>
                <div>
                  <span className="badge badge-whatsapp" style={{ marginBottom: '8px' }}>
                    {language === 'sw' ? `Moduli ${activeModule.order_index}` : `Module ${activeModule.order_index}`}
                  </span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeModule.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>{activeModule.description}</p>
                </div>
                <button
                  onClick={() => handleDeleteModule(activeModule.id)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error)' }}
                >
                  <Trash2 size={16} />
                  {language === 'sw' ? 'Futa Moduli' : 'Delete Module'}
                </button>
              </div>

              {/* Questions List */}
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={18} style={{ color: 'var(--secondary)' }} />
                {language === 'sw' ? 'Maswali Yaliyomo' : 'Contained Questions'} ({(activeModule.Questions || []).length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                {(activeModule.Questions || []).map((q, qidx) => (
                  <div key={q.id} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    position: 'relative'
                  }}>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
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
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', paddingRight: '24px', marginBottom: '12px' }}>
                      {qidx + 1}. {q.question_text}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {(q.options || []).map((opt, oidx) => (
                        <div
                          key={oidx}
                          style={{
                            padding: '8px 12px',
                            background: oidx === q.correct_option ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.01)',
                            border: oidx === q.correct_option ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-glass)',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: oidx === q.correct_option ? 'var(--success)' : 'var(--text-secondary)'
                          }}
                        >
                          {String.fromCharCode(65 + oidx)}. {opt}
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                      Points: <strong style={{ color: 'var(--primary)' }}>{q.points} pts</strong>
                    </div>
                  </div>
                ))}
                {(activeModule.Questions || []).length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
                    {language === 'sw' 
                      ? 'Hakuna maswali yoyote katika moduli hii bado. Jaza fomu hapa chini kuongeza.' 
                      : 'No questions in this module yet. Fill the form below to add questions.'}
                  </div>
                )}
              </div>

              {/* Add Question Form */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
                  {language === 'sw' ? 'Ongeza Swali Jipya' : 'Add New Question'}
                </h3>
                <form onSubmit={handleAddQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label className="input-label" style={{ fontSize: '0.75rem' }}>
                      {language === 'sw' ? 'Swali lenyewe (Question Text)' : 'Question Text Content'}
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder={language === 'sw' ? 'Nani alikuwa rais wa kwanza wa Tanganyika?' : 'Who was the first President of Tanganyika?'}
                      value={newQuestion.question_text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>
                        {language === 'sw' ? 'Chaguo A' : 'Option A'}
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Mwalimu Julius Nyerere"
                        value={newQuestion.optionA}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionA: e.target.value })}
                        required
                      />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>
                        {language === 'sw' ? 'Chaguo B' : 'Option B'}
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Abeid Karume"
                        value={newQuestion.optionB}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionB: e.target.value })}
                        required
                      />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>
                        {language === 'sw' ? 'Chaguo C (Optional)' : 'Option C (Optional)'}
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Rashidi Kawawa"
                        value={newQuestion.optionC}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionC: e.target.value })}
                      />
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>
                        {language === 'sw' ? 'Chaguo D (Optional)' : 'Option D (Optional)'}
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Edward Sokoine"
                        value={newQuestion.optionD}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionD: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>
                        {language === 'sw' ? 'Jibu Sahihi' : 'Correct Option'}
                      </label>
                      <select
                        className="input-field"
                        value={newQuestion.correct_option}
                        onChange={(e) => setNewQuestion({ ...newQuestion, correct_option: parseInt(e.target.value) })}
                        style={{ background: 'rgba(15, 17, 28, 0.9)' }}
                      >
                        <option value={0}>{language === 'sw' ? 'Chaguo A' : 'Option A'}</option>
                        <option value={1}>{language === 'sw' ? 'Chaguo B' : 'Option B'}</option>
                        <option value={2}>{language === 'sw' ? 'Chaguo C' : 'Option C'}</option>
                        <option value={3}>{language === 'sw' ? 'Chaguo D' : 'Option D'}</option>
                      </select>
                    </div>
                    <div className="input-group" style={{ margin: 0 }}>
                      <label className="input-label" style={{ fontSize: '0.75rem' }}>Points</label>
                      <input
                        type="number"
                        className="input-field"
                        value={newQuestion.points}
                        onChange={(e) => setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                    {language === 'sw' ? 'Sajili Swali' : 'Register Question'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '80px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>
                {language === 'sw' 
                  ? 'Tengeneza au chagua moduli upande wa kushoto kuanza!' 
                  : 'Create or select a study module on the left to begin!'}
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
