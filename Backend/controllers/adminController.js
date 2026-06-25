const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Module, Question, DailyStory, ChatLog, QuizAttempt, sequelize } = require('../models');

// 1. Admin Login
exports.login = async (req, res) => {
  const { phone_number, password } = req.body;

  if (!phone_number || !password) {
    return res.status(400).json({ message: 'Tafadhali weka namba ya simu na password' });
  }

  try {
    const user = await User.findOne({ where: { phone_number, role: 'admin' } });
    if (!user) {
      return res.status(400).json({ message: 'Akaunti ya Msimamizi haikupatikana' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Password si sahihi' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: user.id,
        full_name: user.full_name,
        phone_number: user.phone_number
      }
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Hitilafu ya seva ilitokea wakati wa kuingia' });
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
    res.status(500).json({ message: 'Hitilafu ya seva wakati wa kupata takwimu' });
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
    res.status(500).json({ message: 'Hitilafu wakati wa kupata quizzes' });
  }
};

// 4. Create a New Module
exports.createModule = async (req, res) => {
  const { title, description, order_index } = req.body;

  if (!title || !description || order_index === undefined) {
    return res.status(400).json({ message: 'Tafadhali jaza maelezo yote yanayohitajika' });
  }

  try {
    const newModule = await Module.create({ title, description, order_index });
    res.status(201).json(newModule);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: 'Imefeli kuunda moduli mpya' });
  }
};

// 5. Create a New Question
exports.createQuestion = async (req, res) => {
  const { module_id, question_text, options, correct_option, points } = req.body;

  if (!module_id || !question_text || !options || correct_option === undefined) {
    return res.status(400).json({ message: 'Tafadhali jaza maelezo yote ya swali' });
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
    res.status(500).json({ message: 'Imefeli kuunda swali jipya' });
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
    res.status(500).json({ message: 'Hitilafu wakati wa kupata hadithi' });
  }
};

// 7. Create a New Daily Story
exports.createStory = async (req, res) => {
  const { title, content, publish_date } = req.body;

  if (!title || !content || !publish_date) {
    return res.status(400).json({ message: 'Tafadhali jaza maelezo yote ya hadithi' });
  }

  try {
    // Check if story for this date already exists
    const existing = await DailyStory.findOne({ where: { publish_date } });
    if (existing) {
      return res.status(400).json({ message: `Hadithi ya tarehe ${publish_date} tayari ipo` });
    }

    const newStory = await DailyStory.create({ title, content, publish_date });
    res.status(201).json(newStory);
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({ message: 'Imefeli kuunda hadithi mpya' });
  }
};

// 8. Update an Existing Daily Story
exports.updateStory = async (req, res) => {
  const { id } = req.params;
  const { title, content, publish_date } = req.body;

  try {
    const story = await DailyStory.findByPk(id);
    if (!story) {
      return res.status(404).json({ message: 'Hadithi haikupatikana' });
    }

    await story.update({ title, content, publish_date });
    res.json(story);
  } catch (error) {
    console.error('Error updating story:', error);
    res.status(500).json({ message: 'Imefeli kuhariri hadithi' });
  }
};

// 9. Delete a Daily Story
exports.deleteStory = async (req, res) => {
  const { id } = req.params;
  try {
    const story = await DailyStory.findByPk(id);
    if (!story) {
      return res.status(404).json({ message: 'Hadithi haikupatikana' });
    }
    await story.destroy();
    res.json({ message: 'Hadithi imefutwa kwa mafanikio' });
  } catch (error) {
    console.error('Error deleting story:', error);
    res.status(500).json({ message: 'Imefeli kufuta hadithi' });
  }
};

// 10. Delete a Module (also deletes its questions via CASCADE)
exports.deleteModule = async (req, res) => {
  const { id } = req.params;
  try {
    const module = await Module.findByPk(id);
    if (!module) {
      return res.status(404).json({ message: 'Moduli haikupatikana' });
    }
    await module.destroy();
    res.json({ message: 'Moduli imefutwa kwa mafanikio (maswali yake yamefutwa pia)' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Imefeli kufuta moduli' });
  }
};

// 11. Delete a Single Question
exports.deleteQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    const question = await Question.findByPk(id);
    if (!question) {
      return res.status(404).json({ message: 'Swali haikupatikana' });
    }
    await question.destroy();
    res.json({ message: 'Swali limefutwa kwa mafanikio' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Imefeli kufuta swali' });
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
    res.status(500).json({ message: 'Imefeli kupata orodha ya watumiaji' });
  }
};
