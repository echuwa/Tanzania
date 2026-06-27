const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Module, Question, DailyStory, ChatLog, QuizAttempt, FailedMessage, sequelize } = require('../models');
const whatsappService = require('../services/whatsappService');
const { sendPasswordResetEmail, sendAdminWelcomeEmail } = require('../services/emailService');

// 1. Admin Login
exports.login = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({ where: { email: cleanEmail, role: 'admin' } });
    if (!user) {
      return res.status(400).json({ message: 'Administrator account not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Track last login time for audit purposes
    user.last_login = new Date();
    await user.save();

    res.json({
      token,
      admin: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Server error occurred during login' });
  }
};

// 2. Get Dashboard Stats
exports.getStats = async (req, res) => {
  try {
    const totalStudents = await User.count({ where: { role: 'user' } });
    const totalMessages = await ChatLog.count();
    const totalModules = await Module.count();
    const totalQuestions = await Question.count();

    // Leaderboard (Top 10 users)
    const leaderboard = await User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'full_name', 'phone_number', 'points'],
      order: [['points', 'DESC']],
      limit: 10
    });

    // Messages by channel (WhatsApp vs Telegram vs SMS)
    const channelStats = await ChatLog.findAll({
      attributes: [
        'channel',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['channel']
    });

    // Recent Chat Logs (Last 20)
    const recentLogs = await ChatLog.findAll({
      limit: 20,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['full_name', 'phone_number']
        }
      ]
    });

    // Recent Registrations (Last 7 days)
    const recentRegistrations = await User.findAll({
      where: { role: 'user' },
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['full_name', 'phone_number', 'createdAt', 'points']
    });

    res.json({
      summary: {
        totalStudents,
        totalMessages,
        totalModules,
        totalQuestions
      },
      leaderboard,
      channelStats,
      recentLogs,
      recentRegistrations
    });
  } catch (error) {
    console.error('Error getting admin stats:', error);
    res.status(500).json({ message: 'Server error while retrieving statistics' });
  }
};

// 3. Get All Modules and Questions
exports.getQuizzes = async (req, res) => {
  try {
    const modules = await Module.findAll({
      order: [['order_index', 'ASC']],
      include: [
        {
          model: Question,
          order: [['id', 'ASC']]
        }
      ]
    });
    res.json(modules);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Error occurred while retrieving quizzes' });
  }
};

// 4. Create a New Module
exports.createModule = async (req, res) => {
  const { title, description, order_index } = req.body;

  if (!title || !description || order_index === undefined) {
    return res.status(400).json({ message: 'Please fill in all required details' });
  }

  try {
    const newModule = await Module.create({ title, description, order_index });
    res.status(201).json(newModule);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: 'Failed to create new module' });
  }
};

// 5. Create a New Question
exports.createQuestion = async (req, res) => {
  const { module_id, question_text, options, correct_option, points } = req.body;

  if (!module_id || !question_text || !options || correct_option === undefined) {
    return res.status(400).json({ message: 'Please fill in all question details' });
  }

  try {
    const newQuestion = await Question.create({
      module_id,
      question_text,
      options,
      correct_option,
      points: points || 10
    });
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Failed to create new question' });
  }
};

// 6. Get All Daily Stories
exports.getStories = async (req, res) => {
  try {
    const stories = await DailyStory.findAll({
      order: [['publish_date', 'DESC']]
    });
    res.json(stories);
  } catch (error) {
    console.error('Error fetching stories:', error);
    res.status(500).json({ message: 'Error occurred while retrieving stories' });
  }
};

// 7. Create a New Daily Story
exports.createStory = async (req, res) => {
  const { title, content, publish_date } = req.body;

  if (!title || !content || !publish_date) {
    return res.status(400).json({ message: 'Please fill in all story details' });
  }

  try {
    // Check if story for this date already exists
    const existing = await DailyStory.findOne({ where: { publish_date } });
    if (existing) {
      return res.status(400).json({ message: `A story for date ${publish_date} already exists` });
    }

    const newStory = await DailyStory.create({ title, content, publish_date });
    res.status(201).json(newStory);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ message: 'Failed to create new story' });
  }
};

// 8. Update an Existing Daily Story
exports.updateStory = async (req, res) => {
  const { id } = req.params;
  const { title, content, publish_date } = req.body;

  try {
    const story = await DailyStory.findByPk(id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    await story.update({ title, content, publish_date });
    res.json(story);
  } catch (error) {
    console.error('Error updating story:', error);
    res.status(500).json({ message: 'Failed to update story' });
  }
};

// 9. Delete a Daily Story
exports.deleteStory = async (req, res) => {
  const { id } = req.params;
  try {
    const story = await DailyStory.findByPk(id);
    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }
    await story.destroy();
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ message: 'Failed to delete story' });
  }
};

// 10. Delete a Module (also deletes its questions via CASCADE)
exports.deleteModule = async (req, res) => {
  const { id } = req.params;
  try {
    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    await module.destroy();
    res.json({ message: 'Module deleted successfully (associated questions deleted too)' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Failed to delete module' });
  }
};

// 11. Delete a Single Question
exports.deleteQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    await question.destroy();
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
};

// 12. Get all registered users (students)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'user' },
      order: [['points', 'DESC']],
      attributes: ['id', 'full_name', 'phone_number', 'telegram_id', 'points', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to retrieve users list' });
  }
};

// 13. Analytics — New users per day (last 14 days), quiz rates, peak hours, channels
exports.getAnalytics = async (req, res) => {
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // New users per day (last 14 days)
    const newUsersRaw = await User.findAll({
      where: { role: 'user', createdAt: { [Op.gte]: fourteenDaysAgo } },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Messages per day (last 14 days)
    const messagesPerDayRaw = await ChatLog.findAll({
      where: { createdAt: { [Op.gte]: fourteenDaysAgo } },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Peak hours of activity (0-23)
    const peakHoursRaw = await ChatLog.findAll({
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "createdAt"')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('EXTRACT', sequelize.literal('HOUR FROM "createdAt"'))],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 24,
      raw: true
    });

    // Quiz completion rate per module
    const moduleStats = await Module.findAll({
      attributes: ['id', 'title', 'order_index'],
      include: [{
        model: QuizAttempt,
        attributes: []
      }],
      attributes: [
        'id', 'title', 'order_index',
        [sequelize.fn('COUNT', sequelize.col('QuizAttempts.id')), 'attempt_count']
      ],
      group: ['Module.id'],
      order: [['order_index', 'ASC']],
      raw: true
    });

    // Channel breakdown
    const channelBreakdown = await ChatLog.findAll({
      attributes: [
        'channel',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['channel'],
      raw: true
    });

    // Total registered vs unregistered
    const totalRegistered = await User.count({ where: { role: 'user', is_registered: true } });
    const totalUnregistered = await User.count({ where: { role: 'user', is_registered: false } });
    const totalQuizAttempts = await QuizAttempt.count();
    const avgScore = await QuizAttempt.findOne({
      attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avg_score']],
      raw: true
    });

    res.json({
      newUsersPerDay: newUsersRaw,
      messagesPerDay: messagesPerDayRaw,
      peakHours: peakHoursRaw,
      moduleStats,
      channelBreakdown,
      summary: {
        totalRegistered,
        totalUnregistered,
        totalQuizAttempts,
        avgScore: parseFloat(avgScore?.avg_score || 0).toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ message: 'Error occurred while retrieving analytics statistics' });
  }
};

// 14. Broadcast — Admin sends a WhatsApp message to ALL registered users
exports.broadcastMessage = async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim().length < 5) {
    return res.status(400).json({ message: 'Please write a message with at least 5 characters' });
  }

  try {
    const users = await User.findAll({
      where: { role: 'user', is_registered: true },
      attributes: ['full_name', 'phone_number']
    });

    const whatsappUsers = users.filter(u => u.phone_number);

    if (whatsappUsers.length === 0) {
      return res.status(404).json({ message: 'No WhatsApp users found' });
    }

    // Respond to admin immediately with count
    res.json({
      message: `Message is being sent to ${whatsappUsers.length} users. This will take a few minutes.`,
      total: whatsappUsers.length
    });

    // Send in background with delay to respect Meta rate limits
    let sent = 0;
    for (const user of whatsappUsers) {
      const personalizedMsg = `📢 *Broadcast from MUUNGANO WETU AI*\n\n${message}\n\n_— The Muungano Wetu AI Team 🇹🇿_`;
      const result = await whatsappService.sendWhatsAppMessage(user.phone_number, personalizedMsg, 'broadcast');
      if (result.success) sent++;
      await new Promise(r => setTimeout(r, 600)); // 600ms delay between sends
    }

    console.log(`[Broadcast] ✅ Complete — ${sent}/${whatsappUsers.length} delivered`);
  } catch (error) {
    console.error('Error broadcasting message:', error);
    // res already sent, just log
  }
};

// 15. Get Failed Messages
exports.getFailedMessages = async (req, res) => {
  try {
    const failed = await FailedMessage.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(failed);
  } catch (error) {
    console.error('Error fetching failed messages:', error);
    res.status(500).json({ message: 'Error occurred while retrieving failed messages' });
  }
};

// 16. Delete an individual Chat Log
exports.deleteChatLog = async (req, res) => {
  const { id } = req.params;
  try {
    const chatLog = await ChatLog.findByPk(id);
    if (!chatLog) {
      return res.status(404).json({ message: 'Message not found' });
    }
    await chatLog.destroy();
    res.json({ message: 'Message deleted successfully! ✅' });
  } catch (error) {
    console.error('Error deleting chat log:', error);
    res.status(500).json({ message: 'Error occurred while deleting message' });
  }
};

// 17. Get All Admin Users
exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'full_name', 'email', 'phone_number', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ message: 'Error occurred while retrieving administrators list' });
  }
};

// 18. Register / Create a New Admin User
exports.createAdmin = async (req, res) => {
  const { full_name, email, phone_number, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: 'Please fill in Full Name, Email, and Password' });
  }

  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'This Email address is already registered' });
    }

    // Check if phone number already exists (if provided)
    if (phone_number) {
      const existingPhone = await User.findOne({ where: { phone_number } });
      if (existingPhone) {
        return res.status(400).json({ message: 'This phone number is already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
      full_name,
      email,
      phone_number: phone_number || null,
      role: 'admin',
      password: hashedPassword,
      is_registered: true
    });

    // Send welcome email in background (don't block the response)
    sendAdminWelcomeEmail(email, full_name, password).catch(err =>
      console.error('[Admin Create] Welcome email failed:', err.message)
    );

    res.status(201).json({
      message: 'New administrator registered successfully! ✅ A welcome email has been sent.',
      admin: {
        id: newAdmin.id,
        full_name: newAdmin.full_name,
        email: newAdmin.email,
        phone_number: newAdmin.phone_number
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Error occurred while registering new administrator' });
  }
};

// 19. Forgot Password — Send reset link to admin email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide your email address' });
  }

  try {
    const admin = await User.findOne({ where: { email, role: 'admin' } });

    // SECURITY: Always respond with same message whether email exists or not
    // This prevents email enumeration attacks
    if (!admin) {
      return res.json({
        message: 'If that email is registered, a password reset link has been sent. Check your inbox.'
      });
    }

    // Generate a secure random token
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Store a hashed version in DB (never store raw token)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    admin.password_reset_token = hashedToken;
    admin.password_reset_expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await admin.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    const emailResult = await sendPasswordResetEmail(admin.email, resetUrl, admin.full_name);

    if (emailResult.mock) {
      // Development mode — return token in response for easy testing
      return res.json({
        message: '⚠️ MOCK MODE: Email not sent (GMAIL_USER/GMAIL_APP_PASSWORD not configured). Use the token below for testing.',
        dev_reset_url: resetUrl
      });
    }

    res.json({
      message: 'Password reset link sent! Please check your email inbox. The link expires in 15 minutes.'
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Error occurred while processing password reset request' });
  }
};

// 20. Reset Password — Validate token and set new password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Reset token and new password are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Hash the incoming token to match what's stored in DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const admin = await User.findOne({
      where: {
        role: 'admin',
        password_reset_token: hashedToken,
        password_reset_expires: { [Op.gt]: new Date() } // token must not be expired
      }
    });

    if (!admin) {
      return res.status(400).json({
        message: 'Password reset link is invalid or has expired. Please request a new one.'
      });
    }

    // Set new hashed password and clear the reset token
    admin.password = await bcrypt.hash(password, 10);
    admin.password_reset_token = null;
    admin.password_reset_expires = null;
    await admin.save();

    console.log(`[Admin] ✅ Password reset successful for: ${admin.email}`);
    res.json({ message: 'Password reset successful! ✅ You can now log in with your new password.' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Error occurred while resetting password' });
  }
};

// 21. Update Admin Profile (Name, Email, Phone, Password)
exports.updateProfile = async (req, res) => {
  const adminId = req.user.id; // comes from verified JWT
  const { full_name, email, phone_number, current_password, new_password } = req.body;

  try {
    const admin = await User.findOne({ where: { id: adminId, role: 'admin' } });
    if (!admin) {
      return res.status(404).json({ message: 'Administrator account not found' });
    }

    // Update basic info if provided
    if (full_name && full_name.trim().length >= 2) {
      admin.full_name = full_name.trim();
    }

    if (email && email !== admin.email) {
      const emailExists = await User.findOne({ where: { email, id: { [Op.ne]: adminId } } });
      if (emailExists) {
        return res.status(400).json({ message: 'This email is already in use by another account' });
      }
      admin.email = email.toLowerCase().trim();
    }

    if (phone_number !== undefined) {
      admin.phone_number = phone_number || null;
    }

    // Change password (requires current password verification)
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: 'Please provide your current password to set a new one' });
      }
      const isMatch = await bcrypt.compare(current_password, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      if (new_password.length < 8) {
        return res.status(400).json({ message: 'New password must be at least 8 characters long' });
      }
      admin.password = await bcrypt.hash(new_password, 10);
    }

    await admin.save();

    res.json({
      message: 'Profile updated successfully! ✅',
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        phone_number: admin.phone_number
      }
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    res.status(500).json({ message: 'Error occurred while updating profile' });
  }
};

// 22. Delete Admin Account
exports.deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const requestingAdminId = req.user.id;

  if (id === requestingAdminId) {
    return res.status(400).json({ message: 'You cannot delete your own admin account' });
  }

  try {
    const admin = await User.findOne({ where: { id, role: 'admin' } });
    if (!admin) {
      return res.status(404).json({ message: 'Administrator not found' });
    }

    await admin.destroy();
    res.json({ message: `Administrator "${admin.full_name}" has been removed successfully. ✅` });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ message: 'Error occurred while deleting administrator' });
  }
};

// 23. Google Login — Authenticate admin using Google ID Token
exports.googleLogin = async (req, res) => {
  const { id_token } = req.body;

  if (!id_token) {
    return res.status(400).json({ message: 'Google ID token is required' });
  }

  try {
    console.log('[Google Auth] Verifying Google ID token...');
    
    // Verify the token using Google OAuth 2.0 Token Info API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
    
    if (!response.ok) {
      return res.status(401).json({ message: 'Invalid or expired Google ID Token' });
    }

    const payload = await response.json();
    const { email, email_verified, name } = payload;

    if (!email_verified) {
      return res.status(401).json({ message: 'Your Google email is not verified' });
    }

    // Lookup user in database
    const user = await User.findOne({ where: { email: email.toLowerCase(), role: 'admin' } });

    if (!user) {
      return res.status(403).json({
        message: `Access denied. Google account ${email} is not registered as an administrator in the system.`
      });
    }

    // Generate JWT token for dashboard session
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Track last login time
    user.last_login = new Date();
    await user.save();

    console.log(`[Google Auth] ✅ Google Login successful for: ${email}`);

    res.json({
      token,
      admin: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('[Google Auth] Error during Google verification:', error);
    res.status(500).json({ message: 'Server error occurred during Google authentication' });
  }
};

