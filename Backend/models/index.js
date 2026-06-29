const sequelize = require('../config/db');
const User = require('./User');
const Module = require('./Module');
const Question = require('./Question');
const QuizAttempt = require('./QuizAttempt');
const ChatLog = require('./ChatLog');
const DailyStory = require('./DailyStory');
const FailedMessage = require('./FailedMessage');
const UssdSession = require('./UssdSession');
const BroadcastJob = require('./BroadcastJob');

// Define relationships

// User <-> QuizAttempt (One-to-Many)
User.hasMany(QuizAttempt, { foreignKey: 'user_id', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(User, { foreignKey: 'user_id' });

// User <-> ChatLog (One-to-Many)
User.hasMany(ChatLog, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ChatLog.belongsTo(User, { foreignKey: 'user_id' });

// Module <-> Question (One-to-Many)
Module.hasMany(Question, { foreignKey: 'module_id', onDelete: 'CASCADE' });
Question.belongsTo(Module, { foreignKey: 'module_id' });

// Module <-> QuizAttempt (One-to-Many)
Module.hasMany(QuizAttempt, { foreignKey: 'module_id', onDelete: 'CASCADE' });
QuizAttempt.belongsTo(Module, { foreignKey: 'module_id' });

module.exports = {
  sequelize,
  User,
  Module,
  Question,
  QuizAttempt,
  ChatLog,
  DailyStory,
  FailedMessage,
  UssdSession,
  BroadcastJob
};
