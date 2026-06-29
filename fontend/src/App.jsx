import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { 
  Users, 
  MessageSquare, 
  BookOpen, 
  HelpCircle, 
  LogOut, 
  Send, 
  PlusCircle, 
  Sparkles,
  Trophy,
  History,
  FileText,
  Smartphone,
  Trash2,
  BarChart2,
  Megaphone,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [admin, setAdmin] = useState(JSON.parse(localStorage.getItem('adminInfo')) || null);
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showForgotMsg, setShowForgotMsg] = useState(false);
  const [isForgotView, setIsForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Invite token verification state
  const [inviteToken, setInviteToken] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showInvitePassword, setShowInvitePassword] = useState(false);
  const [showInviteConfirmPassword, setShowInviteConfirmPassword] = useState(false);

  // Admin Management state
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ full_name: '', email: '', phone_number: '' });
  const [adminStatus, setAdminStatus] = useState('');
  const [devInviteUrl, setDevInviteUrl] = useState('');
  
  // UI Navigation
  const [activeTab, setActiveTab] = useState('overview');
  
  // Stats and data
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [stories, setStories] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [systemAnalytics, setSystemAnalytics] = useState(null);
  const [broadcastJobs, setBroadcastJobs] = useState([]);

  // Broadcast state
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [failedMessages, setFailedMessages] = useState([]);
  
  // Loaders
  const [loading, setLoading] = useState(false);

  // Refs
  const chatEndRef = useRef(null);
  
  // Forms state
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
  const [newStory, setNewStory] = useState({ title: '', content: '', publish_date: '' });
  const [formMessage, setFormMessage] = useState('');

  // Simulator state
  const [simChannel, setSimChannel] = useState('whatsapp');
  const [simUser, setSimUser] = useState('+255711223344');
  const [simMessage, setSimMessage] = useState('');
  const [simChat, setSimChat] = useState([
    {
      sender: 'bot',
      text: 'Greetings! Welcome to **MUUNGANO WETU AI** 🇹🇿. I am your AI assistant dedicated to educating you about our glorious Union. You can:\n1. Ask me any question about the history of the Union.\n2. Type **QUIZ** to start the trivia game and earn points.\n3. Type **STORY** to receive today\'s historical lesson.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Load dashboard stats
  const fetchStats = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      } else {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load quizzes
  const fetchQuizzes = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/quizzes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setQuizzes(data);
        if (data.length > 0 && !newQuestion.module_id) {
          setNewQuestion(prev => ({ ...prev, module_id: data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load stories
  const fetchStories = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load users
  const fetchUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (err) { console.error(err); }
  };

  // Load analytics (old chart-based)
  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAnalytics(data);
    } catch (err) { console.error(err); }
  };

  // Load real system analytics
  const fetchSystemAnalytics = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/system-analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSystemAnalytics(data);
    } catch (err) { console.error(err); }
  };

  // Load broadcast jobs
  const fetchBroadcastJobs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast-jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setBroadcastJobs(data);
    } catch (err) { console.error(err); }
  };

  // Load failed messages
  const fetchFailedMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/failed-messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setFailedMessages(data);
    } catch (err) { console.error(err); }
  };

  // Delete a user
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) { console.error(err); }
  };

  // Delete a failed message
  const handleDeleteFailedMessage = async (id) => {
    if (!window.confirm('Delete this failed message record?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/failed-messages/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setFailedMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) { console.error(err); }
  };

  // Delete a broadcast job
  const handleDeleteBroadcastJob = async (id) => {
    if (!window.confirm('Delete this broadcast job record?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast-jobs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBroadcastJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) { console.error(err); }
  };

  // Broadcast handler
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setBroadcastLoading(true);
    setBroadcastStatus('');
    try {
      const res = await fetch(`${API_BASE}/admin/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: broadcastMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setBroadcastStatus(`✅ ${data.message}`);
        setBroadcastMsg('');
        fetchFailedMessages();
      } else {
        setBroadcastStatus(`❌ ${data.message}`);
      }
    } catch { setBroadcastStatus('❌ Hitilafu ya muunganisho na seva.'); }
    finally { setBroadcastLoading(false); }
  };

  // Parse reset and invite tokens from URL on mount
  useEffect(() => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    // Reset password match
    const match = pathname.match(/\/reset-password\/([a-zA-Z0-9_-]+)/);
    const tokenFromQuery = urlParams.get('token') || urlParams.get('resetToken');
    if (match && match[1]) {
      setResetToken(match[1]);
    } else if (tokenFromQuery) {
      setResetToken(tokenFromQuery);
    }

    // Verify invite match
    const inviteMatch = pathname.match(/\/verify-invite\/([a-zA-Z0-9_-]+)/);
    const inviteTokenFromQuery = urlParams.get('verifyToken') || urlParams.get('inviteToken');
    if (inviteMatch && inviteMatch[1]) {
      setInviteToken(inviteMatch[1]);
    } else if (inviteTokenFromQuery) {
      setInviteToken(inviteTokenFromQuery);
    }
  }, []);

  // Handle Invitation Password Setup and verification
  const handleVerifyInviteSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setInviteSuccess('');

    if (invitePassword !== inviteConfirmPassword) {
      setAuthError('Passwords do not match');
      return;
    }

    setInviteLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/verify-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: inviteToken, password: invitePassword })
      });
      const data = await res.json();
      if (res.ok) {
        setInviteSuccess(data.message || 'Account activated successfully! ✅');
        setInvitePassword('');
        setInviteConfirmPassword('');
        window.history.pushState({}, '', '/');
        // Clear any existing session to ensure we show the login page
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminInfo');
        setToken('');
        setAdmin(null);
        setTimeout(() => {
          setInviteToken('');
          setInviteSuccess('');
        }, 3000);
      } else {
        setAuthError(data.message || 'Verification failed.');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Google Credential Response callback
  const handleGoogleCredentialResponse = async (response) => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: response.credential })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));
        setToken(data.token);
        setAdmin(data.admin);
      } else {
        setAuthError(data.message || 'Google authentication failed.');
      }
    } catch (err) {
      setAuthError('Connection to Google login server failed.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Google Login Button
  useEffect(() => {
    if (token || resetToken || isForgotView) return;

    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: 'your-google-client-id.apps.googleusercontent.com', // Change this to your Google client ID
          callback: handleGoogleCredentialResponse
        });
        const btn = document.getElementById('google-signin-btn');
        if (btn) {
          window.google.accounts.id.renderButton(btn, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            shape: 'rectangular',
            width: '320'
          });
        }
      }
    };

    initGoogle();
    const interval = setInterval(() => {
      if (window.google) {
        initGoogle();
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [token, resetToken, isForgotView]);

  useEffect(() => {
    if (token) {
      fetchStats();
      if (admin?.role === 'superadmin') {
        fetchQuizzes();
        fetchStories();
        fetchAdmins();
      } else {
        fetchQuizzes();
        fetchStories();
        fetchUsers();
      }
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [token, admin]);

  // Fetch admins automatically when token or admin changes
  useEffect(() => {
    if (token && admin?.role === 'superadmin') {
      fetchAdmins();
    }
  }, [token, admin]);

  // Auto-scroll simulator chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simChat]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Show premium loading alert immediately
    Swal.fire({
      title: 'Authenticating...',
      html: '<span style="color:#a0aec0;font-size:0.9rem;">Verifying your credentials. Please wait.</span>',
      icon: undefined,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      background: '#1a1a2e',
      color: '#e2e8f0',
      didOpen: () => {
        Swal.showLoading();
      },
      customClass: {
        loader: 'swal-custom-loader'
      }
    });

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));

        await Swal.fire({
          title: `Welcome back, ${data.admin.full_name?.split(' ')[0]}! 👋`,
          html: '<span style="color:#a0aec0;font-size:0.9rem;">You have successfully signed in to the dashboard.</span>',
          icon: 'success',
          timer: 1800,
          timerProgressBar: true,
          showConfirmButton: false,
          background: '#1a1a2e',
          color: '#e2e8f0',
          iconColor: '#10b981',
          customClass: { timerProgressBar: 'swal-progress-green' }
        });

        setToken(data.token);
        setAdmin(data.admin);
      } else {
        Swal.fire({
          title: 'Access Denied',
          text: data.message || 'Invalid email or password. Please try again.',
          icon: 'error',
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#6366f1',
          background: '#1a1a2e',
          color: '#e2e8f0',
          iconColor: '#ef4444'
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Connection Failed',
        text: 'Unable to reach the server. Please check your connection.',
        icon: 'warning',
        confirmButtonText: 'Retry',
        confirmButtonColor: '#6366f1',
        background: '#1a1a2e',
        color: '#e2e8f0',
        iconColor: '#f59e0b'
      });
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setForgotSuccess('');
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/admin/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotSuccess('A password reset link has been sent to your email address. Please check your Inbox or Spam folder.');
        setForgotEmail('');
      } else {
        setAuthError(data.message || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setAuthError('Unable to connect to the server. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match!');
      return;
    }
    if (newPassword.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/reset-password/${resetToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        await Swal.fire({
          title: 'Success! 🎉',
          text: 'Your password has been updated. You can now sign in.',
          icon: 'success',
          background: '#1a1a2e',
          color: '#e2e8f0',
          confirmButtonColor: '#10b981'
        });
        window.history.pushState({}, '', '/');
        setResetToken('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setAuthError(data.message || 'This reset link has expired or has already been used.');
      }
    } catch (err) {
      setAuthError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Sign Out?',
      text: 'You will need to log in again to access the Dashboard.',
      icon: 'warning',
      iconColor: '#f59e0b',
      showCancelButton: true,
      confirmButtonText: '🚪 Yes, Sign Me Out',
      cancelButtonText: 'Stay Here',
      background: '#1a1a2e',
      color: '#e2e8f0',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      customClass: {
        popup: 'swal-custom-popup',
        title: 'swal-custom-title',
      },
      backdrop: 'rgba(0,0,0,0.7)',
    });
    if (!result.isConfirmed) return;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    setToken('');
    setAdmin(null);
  };

  // Delete single Chat Log
  const handleDeleteChatLog = async (id) => {
    const result = await Swal.fire({
      title: 'Delete This Message?',
      text: 'This message will be permanently deleted and cannot be recovered.',
      icon: 'question',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonText: '🗑️ Yes, Delete',
      cancelButtonText: 'Cancel',
      background: '#1a1a2e',
      color: '#e2e8f0',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      backdrop: 'rgba(0,0,0,0.7)',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API_BASE}/admin/chat-logs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await Swal.fire({ title: 'Deleted!', text: 'Message deleted successfully.', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1a1a2e', color: '#e2e8f0' });
        fetchStats();
      }
    } catch (err) { console.error(err); }
  };

  // Fetch admins list
  const fetchAdmins = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/admin/admins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setAdmins(data);
    } catch (err) { console.error(err); }
  };

  // Create Admin
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setAdminStatus('');
    setDevInviteUrl('');
    try {
      const res = await fetch(`${API_BASE}/admin/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newAdmin)
      });
      const data = await res.json();
      if (res.ok) {
        setAdminStatus(`✅ ${data.message}`);
        if (data.dev_invite_url) {
          setDevInviteUrl(data.dev_invite_url);
        }
        setNewAdmin({ full_name: '', email: '', phone_number: '' });
        fetchAdmins();
      } else {
        setAdminStatus(`❌ ${data.message}`);
      }
    } catch { setAdminStatus('❌ Server connection error. Please try again.'); }
  };

  // Delete Admin
  const handleDeleteAdmin = async (id, name) => {
    if (admin && admin.id === id) {
      Swal.fire({
        title: 'Banned',
        text: 'Huwezi kujifuta mwenyewe!',
        icon: 'error',
        background: '#1a1a2e',
        color: '#e2e8f0',
        confirmButtonColor: '#ef4444'
      });
      return;
    }

    const result = await Swal.fire({
      title: 'Kufuta Admin?',
      html: `Je, una uhakika unataka kumfuta msimamizi <strong>"${name}"</strong>? Action hii haiwezi kurudishwa!`,
      icon: 'warning',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonText: '🗑️ Ndio, Mfute',
      cancelButtonText: 'Hapana, Ghairi',
      background: '#1a1a2e',
      color: '#e2e8f0',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      backdrop: 'rgba(0,0,0,0.7)',
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/admin/admins/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: 'Imefutwa!',
          text: 'Msimamizi amefutwa kwa mafanikio.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
          background: '#1a1a2e',
          color: '#e2e8f0'
        });
        fetchAdmins();
      } else {
        Swal.fire({
          title: 'Makosa',
          text: data.message || 'Imeshindikana kumfuta admin.',
          icon: 'error',
          background: '#1a1a2e',
          color: '#e2e8f0'
        });
      }
    } catch {
      Swal.fire({
        title: 'Error',
        text: 'Imeshindikana kuunganisha na seva.',
        icon: 'error',
        background: '#1a1a2e',
        color: '#e2e8f0'
      });
    }
  };

  // Create Module
  const handleCreateModule = async (e) => {
    e.preventDefault();
    setFormMessage('');
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
        setFormMessage('Module created successfully! ✅');
        setNewModule({ title: '', description: '', order_index: '' });
        fetchQuizzes();
        fetchStats();
      } else {
        setFormMessage(`Failed: ${data.message}`);
      }
    } catch (err) {
      setFormMessage('Error communicating with backend.');
    }
  };

  // Create Question
  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    setFormMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/questions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          module_id: parseInt(newQuestion.module_id),
          question_text: newQuestion.question_text,
          options: [
            `A. ${newQuestion.optionA}`,
            `B. ${newQuestion.optionB}`,
            `C. ${newQuestion.optionC}`,
            `D. ${newQuestion.optionD}`
          ],
          correct_option: parseInt(newQuestion.correct_option),
          points: parseInt(newQuestion.points)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormMessage('Question created successfully! ✅');
        setNewQuestion(prev => ({
          ...prev,
          question_text: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correct_option: 0
        }));
        fetchQuizzes();
        fetchStats();
      } else {
        setFormMessage(`Failed: ${data.message}`);
      }
    } catch (err) {
      setFormMessage('Error communicating with backend.');
    }
  };

  // Create Daily Story
  const handleCreateStory = async (e) => {
    e.preventDefault();
    setFormMessage('');
    try {
      const res = await fetch(`${API_BASE}/admin/stories`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newStory)
      });
      const data = await res.json();
      if (res.ok) {
        setFormMessage('Daily story published successfully! ✅');
        setNewStory({ title: '', content: '', publish_date: '' });
        fetchStories();
      } else {
        setFormMessage(`Failed: ${data.message}`);
      }
    } catch (err) {
      setFormMessage('Error communicating with backend.');
    }
  };

  // Delete Module
  const handleDeleteModule = async (id, title) => {
    const result = await Swal.fire({
      title: 'Delete This Module?',
      html: `Module <strong>"${title}"</strong> and <strong>all its questions</strong> will be permanently deleted!`,
      icon: 'warning',
      iconColor: '#ef4444',
      showCancelButton: true,
      confirmButtonText: '🗑️ Yes, Delete Permanently',
      cancelButtonText: 'No, Go Back',
      background: '#1a1a2e',
      color: '#e2e8f0',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      backdrop: 'rgba(0,0,0,0.7)',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API_BASE}/admin/modules/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) {
        Swal.fire({ title: 'Deleted!', text: 'Module deleted successfully.', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1a1a2e', color: '#e2e8f0' });
        fetchQuizzes(); fetchStats();
      } else setFormMessage(`Failed: ${d.message}`);
    } catch { setFormMessage('Connection error. Please try again.'); }
  };

  // Delete Question
  const handleDeleteQuestion = async (id) => {
    const result = await Swal.fire({
      title: 'Delete This Question?',
      text: 'This question will be permanently deleted. This action cannot be undone.',
      icon: 'warning',
      iconColor: '#f59e0b',
      showCancelButton: true,
      confirmButtonText: '🗑️ Delete Question',
      cancelButtonText: 'Cancel',
      background: '#1a1a2e',
      color: '#e2e8f0',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      backdrop: 'rgba(0,0,0,0.7)',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API_BASE}/admin/questions/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) {
        Swal.fire({ title: 'Deleted!', text: 'Question deleted successfully.', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1a1a2e', color: '#e2e8f0' });
        fetchQuizzes(); fetchStats();
      } else setFormMessage(`Failed: ${d.message}`);
    } catch { setFormMessage('Connection error. Please try again.'); }
  };

  // Delete Story
  const handleDeleteStory = async (id, title) => {
    const result = await Swal.fire({
      title: 'Delete This Story?',
      html: `Story <strong>"${title}"</strong> will be permanently deleted!`,
      icon: 'warning',
      iconColor: '#f59e0b',
      showCancelButton: true,
      confirmButtonText: '🗑️ Yes, Delete',
      cancelButtonText: 'No, Go Back',
      background: '#1a1a2e',
      color: '#e2e8f0',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6366f1',
      backdrop: 'rgba(0,0,0,0.7)',
    });
    if (!result.isConfirmed) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stories/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      const d = await res.json();
      if (res.ok) {
        Swal.fire({ title: 'Deleted!', text: 'Story deleted successfully.', icon: 'success', timer: 1500, showConfirmButton: false, background: '#1a1a2e', color: '#e2e8f0' });
        fetchStories();
      } else setFormMessage(`Failed: ${d.message}`);
    } catch { setFormMessage('Connection error. Please try again.'); }
  };

  // Send Mock Chatbot Message
  const handleSendMockChat = async (e) => {
    e.preventDefault();
    if (!simMessage.trim()) return;

    const userText = simMessage;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to UI chat log
    setSimChat(prev => [...prev, { sender: 'user', text: userText, time: timeString }]);
    setSimMessage('');

    try {
      const res = await fetch(`${API_BASE}/chatbot/mock-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: simUser,
          messageText: userText,
          channel: simChannel
        })
      });
      const data = await res.json();
      
      const botReply = res.ok ? data.reply : 'Chatbot error occurred while communicating with AI.';
      
      // Add chatbot reply to UI chat log
      setSimChat(prev => [...prev, {
        sender: 'bot',
        text: botReply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setSimChat(prev => [...prev, {
        sender: 'bot',
        text: '⚠️ Failed to connect to the Chatbot server.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  // Render Login / Password Recovery Component
  if (!token || inviteToken || resetToken) {
    return (
      <div className="login-wrapper">
        {/* Futuristic background components */}
        <div className="login-orb-1"></div>
        <div className="login-orb-2"></div>
        <div className="login-grid"></div>

        <div className="login-card animate-fade-in">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="login-header-glow">
              <Sparkles size={28} />
            </div>
            <h2 className="text-gradient" style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              MUUNGANO WETU AI
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', fontWeight: 500 }}>
              {inviteToken
                ? 'Accept Invitation & Set Password 🚀'
                : resetToken 
                  ? 'Set New Password 🔐' 
                  : isForgotView 
                    ? 'Password Recovery 📧' 
                    : 'Administration & Control Dashboard 🇹🇿'}
            </p>
          </div>

          {authError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#fca5a5',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              marginBottom: '24px',
              textAlign: 'center',
              fontWeight: 500
            }}>
              ⚠️ {authError}
            </div>
          )}

          {forgotSuccess && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#a7f3d0',
              padding: '12px 16px',
              borderRadius: '12px',
              fontSize: '0.88rem',
              marginBottom: '24px',
              textAlign: 'center',
              fontWeight: 500
            }}>
              ✅ {forgotSuccess}
            </div>
          )}

          {/* ── VIEW 0: INVITE VERIFICATION FORM ─────────────────── */}
          {inviteToken ? (
            <form onSubmit={handleVerifyInviteSubmit}>
              <div style={{
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '12px', padding: '14px 16px', marginBottom: '24px',
                fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6'
              }}>
                🎉 <strong style={{ color: 'var(--success)' }}>Invitation Accepted!</strong> You've been invited as a Sub-Administrator.
                Set your password below to activate your account.
              </div>

              {inviteSuccess && (
                <div style={{
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                  color: '#a7f3d0', padding: '12px 16px', borderRadius: '12px',
                  fontSize: '0.88rem', marginBottom: '24px', textAlign: 'center', fontWeight: 500
                }}>
                  ✅ {inviteSuccess}
                </div>
              )}

              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Set Your Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showInvitePassword ? 'text' : 'password'}
                    placeholder="Choose a strong password..."
                    className="input-field"
                    style={{ paddingRight: '44px', width: '100%' }}
                    value={invitePassword}
                    onChange={(e) => setInvitePassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvitePassword(!showInvitePassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showInvitePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showInviteConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input-field"
                    style={{ paddingRight: '44px', width: '100%' }}
                    value={inviteConfirmPassword}
                    onChange={(e) => setInviteConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowInviteConfirmPassword(!showInviteConfirmPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showInviteConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: '10px' }}
                disabled={inviteLoading}
              >
                {inviteLoading ? <span>Activating Account...</span> : <span>🚀 Activate My Account</span>}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => { setInviteToken(''); window.history.pushState({}, '', '/'); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
                >
                  Cancel — Back to Sign In
                </button>
              </div>
            </form>

          /* ── VIEW 1: RESET PASSWORD FORM ──────────────────────── */
          ) : resetToken ? (
            <form onSubmit={handleResetPasswordSubmit}>
              <div className="input-group">
                <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: '10px' }} 
                disabled={loading}
              >
                {loading ? <span>Saving...</span> : <span>💾 Save New Password</span>}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState({}, '', '/');
                    setResetToken('');
                    setAuthError('');
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
                >
                  Cancel — Back to Sign In
                </button>
              </div>
            </form>

          /* ── VIEW 2: FORGOT PASSWORD FORM ─────────────────────── */
          ) : isForgotView ? (
            <form onSubmit={handleForgotPasswordSubmit}>
              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Admin Email Address</label>
                <input
                  type="email"
                  placeholder="admin@muungano.go.tz"
                  className="input-field"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: '10px' }} 
                disabled={forgotLoading}
              >
                {forgotLoading ? <span>Sending email...</span> : <span>✉️ Send Reset Link</span>}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotView(false);
                    setForgotSuccess('');
                    setAuthError('');
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>

          /* ── VIEW 3: STANDARD LOGIN FORM ──────────────────────── */
          ) : (
            <>
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Email Address</label>
                  <input
                    type="email"
                    placeholder="admin@muungano.go.tz"
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group" style={{ marginBottom: '10px' }}>
                  <label className="input-label" style={{ fontSize: '0.8rem', marginBottom: '4px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="input-field"
                      style={{ paddingRight: '44px', width: '100%' }}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                  <button
                    type="button"
                    onClick={() => setIsForgotView(true)}
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer', 
                      color: 'var(--secondary)', fontSize: '0.82rem', fontWeight: 600,
                      transition: 'color 0.2s'
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: '10px' }} 
                  disabled={loading}
                >
                  <>
                    <span>🔐</span>
                    <span>Sign In to Dashboard</span>
                  </>
                </button>
              </form>

              {/* OR Separator */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                margin: '24px 0', 
                color: 'var(--text-muted)', 
                fontSize: '0.8rem' 
              }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
                <span style={{ padding: '0 12px' }}>OR CONTINUE WITH GOOGLE</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>
              </div>

              {/* Google Sign-in Button Container */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div id="google-signin-btn"></div>
              </div>
            </>
          )}

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
            Muungano Wetu AI &copy; 2026 | Vyuo na Vyuo Vikuu Tanzania Bara
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <Sparkles size={28} className="text-gradient" style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            MUUNGANO <span style={{ color: 'var(--secondary)' }}>AI</span>
          </h2>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {/* Overview — all roles */}
          <button 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('overview')}
          >
            <Users size={18} /> Overview & Stats
          </button>

          {/* Quiz & Stories — Super Admin only */}
          {admin?.role === 'superadmin' && (
            <>
              <button 
                className={`btn ${activeTab === 'quizzes' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                onClick={() => setActiveTab('quizzes')}
              >
                <BookOpen size={18} /> Quiz Management
              </button>

              <button 
                className={`btn ${activeTab === 'stories' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
                onClick={() => setActiveTab('stories')}
              >
                <FileText size={18} /> Daily Stories
              </button>
            </>
          )}

          {/* Chatbot Simulator — all roles */}
          <button 
            className={`btn ${activeTab === 'simulator' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => setActiveTab('simulator')}
          >
            <Smartphone size={18} /> Chatbot Simulator
          </button>

          {/* Users — Sub-Admin only */}
          {admin?.role === 'admin' && (
            <button 
              className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={() => { setActiveTab('users'); fetchUsers(); }}
            >
              <Users size={18} /> Users
            </button>
          )}

          {/* Analytics — all roles */}
          <button
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
            onClick={() => { setActiveTab('analytics'); fetchSystemAnalytics(); }}
          >
            <BarChart2 size={18} /> Analytics
          </button>

          {/* Broadcast & Failed Msgs — Sub-Admin only */}
          {admin?.role === 'admin' && (
            <button
              className={`btn ${activeTab === 'broadcast' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={() => { setActiveTab('broadcast'); fetchFailedMessages(); fetchBroadcastJobs(); }}
            >
              <Megaphone size={18} /> Send Broadcast
            </button>
          )}

          {/* Admin Management — Super Admin only */}
          {admin?.role === 'superadmin' && (
            <button
              className={`btn ${activeTab === 'admins' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ justifyContent: 'flex-start', padding: '12px 16px' }}
              onClick={() => { setActiveTab('admins'); fetchAdmins(); }}
            >
              <ShieldCheck size={18} /> Admin Management
            </button>
          )}
        </nav>

        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
          <div style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{admin?.full_name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              {admin?.role === 'superadmin' ? (
                <span style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))',
                  border: '1px solid rgba(139,92,246,0.4)',
                  color: '#c4b5fd',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>⭐ Super Admin</span>
              ) : (
                <span style={{
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  color: '#6ee7b7',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>🛡 Sub-Admin</span>
              )}
            </div>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', color: 'var(--error)', justifyContent: 'center' }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Dashboard Space */}
      <main className="main-content">
        
        {/* TAB 1: OVERVIEW STATISTICS */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>System Overview</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Statistics and engagement reports for the Union history educational platform.</p>
            </div>

            {/* KPI Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px'
            }}>
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
                  <Users size={28} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Registered Students</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.summary.totalStudents || 0}</h2>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)' }}>
                  <MessageSquare size={28} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Chat Messages</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.summary.totalMessages || 0}</h2>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                  <BookOpen size={28} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Learning Chapters</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.summary.totalModules || 0}</h2>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)' }}>
                  <HelpCircle size={28} />
                </div>
                <div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Total Questions</div>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats?.summary.totalQuestions || 0}</h2>
                </div>
              </div>
            </div>

            {/* Split Content: Leaderboard and Channel stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }}>
              
              {/* Left Column: Leaderboard (Sub-Admin) or Sub-Administrators List (Super Admin) */}
              {admin?.role === 'superadmin' ? (
                <div className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <ShieldCheck style={{ color: 'var(--primary)' }} size={20} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Active Sub-Administrators</h3>
                  </div>
                  <div className="table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Full Name</th>
                          <th>Email Address</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {admins.map((item) => (
                          <tr key={item.id}>
                            <td><strong>{item.full_name}</strong></td>
                            <td style={{ color: 'var(--text-secondary)' }}>{item.email}</td>
                            <td>
                              {item.is_verified ? (
                                <span className="badge badge-whatsapp" style={{ fontSize: '0.75rem' }}>Active & Verified</span>
                              ) : (
                                <span className="badge badge-sms" style={{ fontSize: '0.75rem' }}>Pending Invite</span>
                              )}
                            </td>
                          </tr>
                        ))}
                        {admins.length === 0 && (
                          <tr>
                            <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No sub-administrators registered yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="glass-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <Trophy style={{ color: 'var(--warning)' }} size={20} />
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Top Patriotic Youth by Knowledge</h3>
                  </div>
                  <div className="table-container">
                    <table className="premium-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Full Name</th>
                          <th>Channel</th>
                          <th>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.leaderboard.map((user, idx) => (
                          <tr key={user.id}>
                            <td><strong>{idx + 1}</strong></td>
                            <td>{user.full_name || 'Patriotic Youth'}</td>
                            <td>{user.phone_number || `Telegram ID: ${user.telegram_id}`}</td>
                            <td style={{ color: 'var(--secondary)', fontWeight: 600 }}>{user.points} pts</td>
                          </tr>
                        ))}
                        {(!stats || stats.leaderboard.length === 0) && (
                          <tr>
                            <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No data available yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Message Channel Distribution */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyItems: 'space-between' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>Message Channels</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Distribution of channels most used by participants.</p>
                </div>
                
                {/* SVG Visual Pie Chart Mock representation */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0', position: 'relative' }}>
                  <svg width="160" height="160" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', borderRadius: '50%' }}>
                    {/* Mock circular charts using simple stroke dash arrays for the 3 channels */}
                    {/* Circle 1: WhatsApp (Green) 55% */}
                    <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="var(--success)" strokeWidth="4" strokeDasharray="55 100" strokeDashoffset="0"></circle>
                    {/* Circle 2: Telegram (Cyan) 30% */}
                    <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="var(--secondary)" strokeWidth="4" strokeDasharray="30 100" strokeDashoffset="-55"></circle>
                    {/* Circle 3: SMS (Amber) 15% */}
                    <circle cx="20" cy="20" r="15.915" fill="transparent" stroke="var(--warning)" strokeWidth="4" strokeDasharray="15 100" strokeDashoffset="-85"></circle>
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></span>
                      WhatsApp
                    </div>
                    <span className="badge badge-whatsapp">
                      {stats?.channelStats.find(c => c.channel === 'whatsapp')?.count || 0} msg
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
                      Telegram
                    </div>
                    <span className="badge badge-telegram">
                      {stats?.channelStats.find(c => c.channel === 'telegram')?.count || 0} msg
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--warning)' }}></span>
                      SMS Gateway
                    </div>
                    <span className="badge badge-sms">
                      {stats?.channelStats.find(c => c.channel === 'sms')?.count || 0} msg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Chat logs (Sub-Admin) or Privacy Compliance Panel (Super Admin) */}
            {admin?.role === 'superadmin' ? (
              <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                  border: '1px solid rgba(139,92,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
                }}>
                  <ShieldCheck size={32} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>Data Security & Compliance Shield</h3>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '580px', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                  To ensure complete compliance with data protection policies and student privacy regulations, raw student profile details and conversational transcripts are restricted from Super Administrators. 
                  Support Administrators have been assigned access to individual chat histories for query resolution.
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                  padding: '8px 16px', borderRadius: '20px', color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 600
                }}>
                  🔒 Zero-Trust Privacy Architecture Active
                </div>
              </div>
            ) : (
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <History style={{ color: 'var(--primary)' }} size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent AI Chatbot Conversations</h3>
                </div>
                <div className="table-container">
                  <table className="premium-table">
                    <thead>
                      <tr>
                        <th>Kijana</th>
                        <th>Njia</th>
                        <th>Ujumbe Ulioingia</th>
                        <th>Jibu la AI Chatbot</th>
                        <th>Muda</th>
                        <th>Futa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.recentLogs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{log.User?.full_name || 'Patriotic Youth'}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                              {log.User?.phone_number || 'Telegram User'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${log.channel}`}>
                              {log.channel}
                            </span>
                          </td>
                          <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message_text}>
                            {log.message_text}
                          </td>
                          <td style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.response_text}>
                            {log.response_text}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td>
                            <button
                              onClick={() => handleDeleteChatLog(log.id)}
                              title="Delete this message"
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                color: 'var(--error)',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!stats || stats.recentLogs.length === 0) && (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No messages received yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QUIZZES MANAGER */}
        {activeTab === 'quizzes' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Quiz & Module Management</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Configure and add quiz modules or questions to test users' understanding of the Union.</p>
            </div>

            {formMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--success)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {formMessage}
              </div>
            )}

            {/* Split forms: Add Module and Add Question */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Add Module Form */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <PlusCircle style={{ color: 'var(--primary)' }} size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Create New Module / Chapter</h3>
                </div>
                <form onSubmit={handleCreateModule}>
                  <div className="input-group">
                    <label className="input-label">Module Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Benefits of the Union" 
                      className="input-field"
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">Short Description</label>
                    <textarea 
                      placeholder="Briefly describe what will be taught..." 
                      className="input-field" 
                      rows="3"
                      style={{ resize: 'none' }}
                      value={newModule.description}
                      onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="input-group" style={{ marginBottom: '24px' }}>
                    <label className="input-label">Display Order (Order Index)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 4" 
                      className="input-field"
                      value={newModule.order_index}
                      onChange={(e) => setNewModule({ ...newModule, order_index: e.target.value })}
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Create New Module
                  </button>
                </form>
              </div>

              {/* Add Question Form */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <PlusCircle style={{ color: 'var(--secondary)' }} size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add New Quiz Question</h3>
                </div>
                <form onSubmit={handleCreateQuestion}>
                  <div className="input-group">
                    <label className="input-label">Select Module</label>
                    <select 
                      className="input-field"
                      value={newQuestion.module_id}
                      onChange={(e) => setNewQuestion({ ...newQuestion, module_id: e.target.value })}
                      required
                    >
                      {quizzes.map(m => (
                        <option key={m.id} value={m.id}>{m.order_index}. {m.title}</option>
                      ))}
                      {quizzes.length === 0 && <option value="">-- No Modules --</option>}
                    </select>
                  </div>
 
                  <div className="input-group">
                    <label className="input-label">Question Text</label>
                    <input 
                      type="text" 
                      placeholder="e.g. When did the Union ceremony take place?" 
                      className="input-field"
                      value={newQuestion.question_text}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                      required 
                    />
                  </div>
 
                  {/* Option inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="input-group">
                      <label className="input-label">Option A</label>
                      <input 
                        type="text" 
                        placeholder="First option" 
                        className="input-field"
                        value={newQuestion.optionA}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionA: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Option B</label>
                      <input 
                        type="text" 
                        placeholder="Second option" 
                        className="input-field"
                        value={newQuestion.optionB}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionB: e.target.value })}
                        required 
                      />
                    </div>
                  </div>
 
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="input-group">
                      <label className="input-label">Option C</label>
                      <input 
                        type="text" 
                        placeholder="Third option" 
                        className="input-field"
                        value={newQuestion.optionC}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionC: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Option D</label>
                      <input 
                        type="text" 
                        placeholder="Fourth option" 
                        className="input-field"
                        value={newQuestion.optionD}
                        onChange={(e) => setNewQuestion({ ...newQuestion, optionD: e.target.value })}
                        required 
                      />
                    </div>
                  </div>
 
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px', marginBottom: '24px' }}>
                    <div className="input-group">
                      <label className="input-label">Correct Answer</label>
                      <select 
                        className="input-field"
                        value={newQuestion.correct_option}
                        onChange={(e) => setNewQuestion({ ...newQuestion, correct_option: e.target.value })}
                        required
                      >
                        <option value="0">Option A</option>
                        <option value="1">Option B</option>
                        <option value="2">Option C</option>
                        <option value="3">Option D</option>
                      </select>
                    </div>
 
                    <div className="input-group">
                      <label className="input-label">Points</label>
                      <input 
                        type="number" 
                        className="input-field"
                        value={newQuestion.points}
                        onChange={(e) => setNewQuestion({ ...newQuestion, points: e.target.value })}
                        required 
                      />
                    </div>
                  </div>
 
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Save New Question
                  </button>
                </form>
              </div>
            </div>
 
            {/* List of current modules and questions */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Current Modules and Questions List</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {quizzes.map((mod) => (
                  <div key={mod.id} style={{
                    border: '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.01)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ color: 'var(--secondary)' }}>{mod.order_index}. {mod.title}</h4>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge badge-telegram">{mod.Questions?.length || 0} Questions</span>
                        <button
                          onClick={() => handleDeleteModule(mod.id, mod.title)}
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                        >
                          <Trash2 size={13}/> Delete
                        </button>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>{mod.description}</p>
                    
                    {/* Questions inner list */}
                    {mod.Questions && mod.Questions.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '12px' }}>
                        {mod.Questions.map((q, idx) => (
                          <div key={q.id} style={{ fontSize: '0.88rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <strong>Question {idx + 1}:</strong> {q.question_text} <span style={{ color: 'var(--text-muted)' }}>({q.points} pts)</span>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', flexShrink: 0, marginLeft: '8px' }}
                                title="Delete question"
                              >
                                <Trash2 size={14}/>
                              </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '6px', marginTop: '6px', color: 'var(--text-secondary)', paddingLeft: '10px' }}>
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ color: oIdx === q.correct_option ? 'var(--success)' : '' }}>
                                  {opt} {oIdx === q.correct_option ? '✅' : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No questions in this module yet.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
 
        {/* TAB 3: DAILY STORIES */}
        {activeTab === 'stories' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Daily Historical Stories</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Manage short daily stories (Daily Stories) that participants will read through the chatbot.</p>
            </div>
 
            {formMessage && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--success)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                textAlign: 'center'
              }}>
                {formMessage}
              </div>
            )}
 
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '20px', alignItems: 'flex-start' }}>
              
              {/* Form to Create story */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <PlusCircle style={{ color: 'var(--primary)' }} size={20} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Register New Story</h3>
                </div>
                <form onSubmit={handleCreateStory}>
                  <div className="input-group">
                    <label className="input-label">Story Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Nyerere and Karume on April 26th" 
                      className="input-field"
                      value={newStory.title}
                      onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                      required 
                    />
                  </div>
 
                  <div className="input-group">
                    <label className="input-label">Publish Date</label>
                    <input 
                      type="date" 
                      className="input-field"
                      value={newStory.publish_date}
                      onChange={(e) => setNewStory({ ...newStory, publish_date: e.target.value })}
                      required 
                    />
                  </div>
 
                  <div className="input-group" style={{ marginBottom: '24px' }}>
                    <label className="input-label">Story Content</label>
                    <textarea 
                      placeholder="Write the historical story here in an engaging and friendly tone..." 
                      className="input-field" 
                      rows="8"
                      value={newStory.content}
                      onChange={(e) => setNewStory({ ...newStory, content: e.target.value })}
                      required
                    ></textarea>
                  </div>
 
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Register and Publish Live
                  </button>
                </form>
              </div>

              {/* List of registered stories */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Existing Stories</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {stories.map(story => (
                    <div key={story.id} style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(255, 255, 255, 0.01)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ color: 'var(--primary)', fontWeight: 600 }}>{story.title}</h4>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className="badge badge-telegram">{story.publish_date}</span>
                          <button
                            onClick={() => handleDeleteStory(story.id, story.title)}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
                          >
                            <Trash2 size={13}/> Delete
                          </button>
                        </div>
                      </div>
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.88rem', 
                        whiteSpace: 'pre-wrap',
                        maxHeight: '120px',
                        overflowY: 'auto',
                        paddingRight: '6px'
                      }}>
                        {story.content}
                      </p>
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px' }}>
                      No stories prepared yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CHATBOT SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Chatbot Live Simulator</h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                Test how the AI Chatbot responds to youth messages directly on the dashboard before connecting real numbers.
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '0.8fr 1.2fr', 
              gap: '30px', 
              alignItems: 'flex-start',
              maxWidth: '900px'
            }}>
              
              {/* Simulator Config */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Simulator Configuration</h3>
                
                <div className="input-group">
                  <label className="input-label">Communication Channel</label>
                  <select 
                    className="input-field" 
                    value={simChannel}
                    onChange={(e) => {
                      setSimChannel(e.target.value);
                      // Set dummy identifiers based on channel
                      if (e.target.value === 'telegram') setSimUser('TanzaniaHeroBotDev');
                      else setSimUser('+255711223344');
                    }}
                  >
                    <option value="whatsapp">WhatsApp Business API</option>
                    <option value="telegram">Telegram Bot</option>
                    <option value="sms">SMS Gateway</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">User Identifier (Phone/Username)</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={simUser}
                    onChange={(e) => setSimUser(e.target.value)}
                  />
                </div>

                <div style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4'
                }}>
                  💡 **Testing Guide:**<br/>
                  * Type **HI** or **HELLO** to wake the Chatbot.<br/>
                  * Type **STORY** to read today's story.<br/>
                  * Type **QUIZ** to start the trivia game and answer (A, B, C, D).<br/>
                  * Type **LEADERBOARD** to view other participants' points.<br/>
                  * Ask a historical question, e.g., **"who signed the union?"**
                </div>
              </div>

              {/* Smartphone Simulator Mock UI */}
              <div style={{
                background: '#0e1017',
                border: '12px solid #232530',
                borderRadius: '36px',
                height: '560px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Status Bar */}
                <div style={{
                  height: '24px',
                  background: '#191b28',
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0 24px',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div>01:25</div>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span>5G</span>
                    <span style={{ width: '12px', height: '8px', border: '1px solid var(--text-secondary)', borderRadius: '2px', display: 'inline-block' }}></span>
                  </div>
                </div>

                {/* Chat App Header */}
                <div style={{
                  background: simChannel === 'whatsapp' ? '#075e54' : simChannel === 'telegram' ? '#0088cc' : '#1e2030',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#fff',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    🇹🇿
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>MUUNGANO WETU AI</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>online • chatbot engine</div>
                  </div>
                </div>

                {/* Chat Message Thread */}
                <div style={{
                  flex: 1,
                  padding: '16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: '#090a0f'
                }}>
                  {simChat.map((msg, index) => (
                    <div 
                      key={index}
                      style={{
                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        background: msg.sender === 'user' 
                          ? (simChannel === 'whatsapp' ? '#056162' : simChannel === 'telegram' ? '#182533' : 'var(--primary)') 
                          : '#1f2130',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        maxWidth: '85%',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ 
                        fontSize: '0.85rem', 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {msg.text}
                      </div>
                      <div style={{
                        fontSize: '0.65rem',
                        color: 'rgba(255, 255, 255, 0.5)',
                        textAlign: 'right',
                        marginTop: '4px'
                      }}>
                        {msg.time}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Message Input Panel */}
                <form 
                  onSubmit={handleSendMockChat}
                  style={{
                    padding: '10px',
                    background: '#131520',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}
                >
                  <input 
                    type="text" 
                    placeholder="Type message here..."
                    className="input-field"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', fontSize: '0.88rem' }}
                    value={simMessage}
                    onChange={(e) => setSimMessage(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ 
                      borderRadius: '50%', 
                      width: '36px', 
                      height: '36px', 
                      padding: 0,
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WATUMIAJI */}
        {activeTab === 'users' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Registered Users</h1>
              <p style={{ color: 'var(--text-secondary)' }}>List of all registered users on the system across various communication channels.</p>
            </div>

            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Users style={{ color: 'var(--primary)' }} size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Users ({users.length})</h3>
              </div>
              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Full Name</th>
                      <th>Phone Number</th>
                      <th>Telegram ID</th>
                      <th>Points</th>
                      <th>Registration Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, idx) => (
                      <tr key={u.id}>
                        <td><strong>{idx + 1}</strong></td>
                        <td>{u.full_name || 'Patriotic Youth'}</td>
                        <td>{u.phone_number || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td>{u.telegram_id || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td><span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{u.points} pts</span></td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.full_name || u.phone_number)}
                            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--error)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No registered users found yet.</td></tr>
                    )}
                  </tbody>

                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ANALYTICS — Real System Overview */}
        {activeTab === 'analytics' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>System Overview</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Live statistics pulled directly from the database.</p>
              </div>
              <button className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: '0.85rem' }} onClick={fetchSystemAnalytics}>
                🔄 Refresh
              </button>
            </div>

            {/* KPI Cards Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
              {[
                { label: 'Total Users', value: systemAnalytics?.summary?.totalUsers ?? '—', icon: '👥', color: 'var(--primary)' },
                { label: 'Registered', value: systemAnalytics?.summary?.registeredUsers ?? '—', icon: '✅', color: 'var(--success)' },
                { label: 'WhatsApp Users', value: systemAnalytics?.summary?.whatsappUsers ?? '—', icon: '📱', color: '#25d366' },
                { label: 'Telegram Users', value: systemAnalytics?.summary?.telegramUsers ?? '—', icon: '✈️', color: '#229ed9' },
                { label: 'Total Messages', value: systemAnalytics?.summary?.totalMessages ?? '—', icon: '💬', color: 'var(--secondary)' },
                { label: 'Messages (7 days)', value: systemAnalytics?.summary?.messagesThisWeek ?? '—', icon: '📈', color: 'var(--warning)' },
                { label: 'Broadcasts Sent', value: systemAnalytics?.summary?.completedBroadcasts ?? '—', icon: '📢', color: 'var(--primary)' },
                { label: 'Failed (7 days)', value: systemAnalytics?.summary?.failedThisWeek ?? '—', icon: '❌', color: 'var(--error)' },
                { label: 'Quiz Attempts', value: systemAnalytics?.summary?.totalQuizAttempts ?? '—', icon: '🎯', color: 'var(--secondary)' },
              ].map(card => (
                <div key={card.label} className="glass-card" style={{ textAlign: 'center', padding: '20px 14px' }}>
                  <div style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{card.icon}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: card.color }}>{card.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Channel Breakdown + Top Users */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Channel Breakdown */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>📡 Messages by Channel</h3>
                {systemAnalytics?.channelBreakdown?.length > 0 ? systemAnalytics.channelBreakdown.map((ch, i) => {
                  const total = systemAnalytics.channelBreakdown.reduce((s, x) => s + parseInt(x.count), 0);
                  const pct = Math.round((parseInt(ch.count) / total) * 100);
                  return (
                    <div key={i} style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span className={`badge badge-${ch.channel}`}>{ch.channel}</span>
                        <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{ch.count} ({pct}%)</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '4px', height: '6px' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--secondary)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                }) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No messages yet.</p>}
              </div>

              {/* Top 5 Users */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>🏆 Top 5 Users</h3>
                {systemAnalytics?.topUsers?.length > 0 ? systemAnalytics.topUsers.map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{u.full_name || (u.phone_number ? `+${u.phone_number}` : `TG:${u.telegram_id?.substring(0,6)}`)}</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '0.88rem' }}>{u.points} pts</span>
                  </div>
                )) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No users yet.</p>}
              </div>
            </div>

            {/* Recent Broadcasts */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>📢 Recent Broadcast Jobs</h3>
              <div className="table-container">
                <table className="premium-table">
                  <thead><tr><th>Message Preview</th><th>Type</th><th>Status</th><th>Sent</th><th>Failed</th><th>Date</th></tr></thead>
                  <tbody>
                    {systemAnalytics?.recentBroadcasts?.map(job => (
                      <tr key={job.id}>
                        <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.message}</td>
                        <td><span className={`badge ${job.job_type === 'broadcast' ? 'badge-whatsapp' : 'badge-telegram'}`}>{job.job_type}</span></td>
                        <td><span style={{ color: job.status === 'completed' ? 'var(--success)' : job.status === 'failed' ? 'var(--error)' : 'var(--warning)', fontWeight: 600 }}>{job.status}</span></td>
                        <td style={{ color: 'var(--success)', fontWeight: 700 }}>{job.sent_count}</td>
                        <td style={{ color: 'var(--error)', fontWeight: 700 }}>{job.failed_count}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(job.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {!systemAnalytics?.recentBroadcasts?.length && <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No broadcasts sent yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Failed Messages */}
            <div className="glass-card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>❌ Recent Failed Deliveries</h3>
              <div className="table-container">
                <table className="premium-table">
                  <thead><tr><th>Phone</th><th>Channel</th><th>Error Code</th><th>Reason</th><th>Date</th></tr></thead>
                  <tbody>
                    {systemAnalytics?.recentFailed?.map(f => (
                      <tr key={f.id}>
                        <td><strong>{f.phone_number}</strong></td>
                        <td><span className={`badge badge-${f.channel}`}>{f.channel}</span></td>
                        <td style={{ color: 'var(--error)', fontWeight: 700 }}>{f.error_code}</td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.error_message}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {!systemAnalytics?.recentFailed?.length && <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No failed deliveries. 🎉</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {!systemAnalytics && (
              <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                ⏳ Loading system data...
              </div>
            )}
          </div>
        )}


        {/* TAB 7: BROADCAST */}
        {activeTab === 'broadcast' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Send Broadcast</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Send a message to all registered WhatsApp users at once.</p>
            </div>

            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <Megaphone style={{ color: 'var(--warning)' }} size={22} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Write Broadcast Message</h3>
              </div>

              <div style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '20px',
                fontSize: '0.85rem',
                color: 'var(--warning)'
              }}>
                ⚠️ <strong>Warning:</strong> This message will be sent to all registered WhatsApp users. Please verify the content before sending.
              </div>

              <form onSubmit={handleBroadcast}>
                <div className="input-group">
                  <label className="input-label">Broadcast Message</label>
                  <textarea
                    className="input-field"
                    rows={6}
                    placeholder="Type your message here...&#10;Example: Today is Union Day! Play the QUIZ to double your points! 🇹🇿"
                    style={{ resize: 'vertical' }}
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    required
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {broadcastMsg.length} / 1000 characters
                  </div>
                </div>

                <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                           {broadcastMsg || '...'}<br />
                  <em>— The Muungano Wetu AI Team 🇹🇿</em>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={broadcastLoading || broadcastMsg.trim().length < 5}
                >
                  {broadcastLoading ? 'Sending...' : '📢 Send to All Users'}
                </button>
              </form>

              {broadcastStatus && (
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  background: broadcastStatus.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                  color: broadcastStatus.startsWith('✅') ? 'var(--success)' : 'var(--error)',
                  border: `1px solid ${broadcastStatus.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                }}>
                  {broadcastStatus}
                </div>
              )}
            </div>

            {/* List of Failed Messages */}
            <div className="glass-card animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Megaphone style={{ color: 'var(--error)' }} size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Failed Messages Report</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                List of phone numbers that failed to receive messages (e.g., non-WhatsApp numbers or token/network issues).
              </p>

              <div className="table-container">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Phone Number</th>
                      <th>Type</th>
                      <th>Error Reason</th>
                      <th>Content</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {failedMessages.map((msg) => (
                      <tr key={msg.id}>
                        <td><strong>+{msg.phone_number}</strong></td>
                        <td>
                          <span className={`badge ${msg.message_type === 'broadcast' ? 'badge-telegram' : 'badge-sms'}`}>
                            {msg.message_type}
                          </span>
                        </td>
                        <td style={{ color: 'var(--error)', fontSize: '0.85rem' }}>
                          <strong>Code {msg.error_code}:</strong> {msg.error_message}
                        </td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={msg.message_text}>
                          {msg.message_text}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(msg.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {failedMessages.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Excellent! No failed messages so far. 🎉</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 8: MA-ADMIN MANAGEMENT */}
        {activeTab === 'admins' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '2.2rem', fontWeight: 800 }}>Admin Management</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Add or view other administrators who can log into this Dashboard system.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
              {/* Invite New Sub-Admin Form */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <UserPlus style={{ color: 'var(--primary)' }} size={22} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Invite New Sub-Administrator</h3>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: '12px', padding: '14px 16px', marginBottom: '20px',
                  fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.7'
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>🔐</span>
                    <div>
                      <strong style={{ color: '#c4b5fd' }}>Secure Invite Flow:</strong> An invitation email with a verification link will be sent to the new Sub-Admin.
                      They must <strong>verify their email and set their own password</strong> before they can log in.
                      They will not have access until they complete this step.
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateAdmin}>
                  <div className="input-group">
                    <label className="input-label">Full Name *</label>
                    <input type="text" placeholder="e.g. Amina Rashid" className="input-field"
                      value={newAdmin.full_name} onChange={e => setNewAdmin({ ...newAdmin, full_name: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Email Address *</label>
                    <input type="email" placeholder="subadmin@muungano.go.tz" className="input-field"
                      value={newAdmin.email} onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} required />
                  </div>
                  <div className="input-group" style={{ marginBottom: '24px' }}>
                    <label className="input-label">Phone Number (Optional)</label>
                    <input type="text" placeholder="+255700000000" className="input-field"
                      value={newAdmin.phone_number} onChange={e => setNewAdmin({ ...newAdmin, phone_number: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '13px' }}>
                    <UserPlus size={16} /> Send Invitation Email
                  </button>
                </form>

                {adminStatus && (
                  <div style={{
                    marginTop: '16px', padding: '12px', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem',
                    background: adminStatus.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: adminStatus.startsWith('✅') ? 'var(--success)' : 'var(--error)',
                    border: `1px solid ${adminStatus.startsWith('✅') ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                  }}>
                    {adminStatus}
                  </div>
                )}

                {devInviteUrl && (
                  <div style={{
                    marginTop: '16px', padding: '16px', borderRadius: '12px',
                    background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                    fontSize: '0.85rem', color: '#f59e0b', lineHeight: '1.6'
                  }}>
                    <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '8px' }}>⚠️ Localhost Mode:</strong>
                    Msimamizi huyu hajaweza kutumiwa barua pepe kwa sababu hauko kwenye production (SMTP missing). Unaweza kutumia kiungo hiki kukamilisha usajili na kuweka password yake:
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={devInviteUrl} 
                        style={{
                          flex: 1,
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(245,158,11,0.3)',
                          color: '#fff',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}
                        onClick={(e) => e.target.select()}
                      />
                      <a 
                        href={devInviteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                          background: '#f59e0b',
                          color: '#000',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        Fungua
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Admins List */}
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                  <ShieldCheck style={{ color: 'var(--success)' }} size={22} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Existing Administrators ({admins.length})</h3>
                </div>

                {admins.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No other administrators registered yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {admins.map(a => (
                      <div key={a.id} style={{
                        display: 'flex', alignItems: 'center', gap: '14px', padding: '12px',
                        background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                        border: '1px solid var(--border-glass)'
                      }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: 'var(--primary-glow)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)'
                        }}>
                          {a.full_name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{a.full_name}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{a.email}</div>
                          {a.phone_number && <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{a.phone_number}</div>}
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600,
                          background: 'rgba(16,185,129,0.12)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.3)',
                          marginRight: '8px'
                        }}>Admin</span>
                        {admin && admin.id !== a.id && (
                          <button
                            onClick={() => handleDeleteAdmin(a.id, a.full_name)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: 'var(--error)', padding: '6px', borderRadius: '6px',
                              transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'}
                            onMouseOut={e => e.currentTarget.style.background = 'none'}
                            title="Delete Admin"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
