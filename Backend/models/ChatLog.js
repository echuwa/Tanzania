const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ChatLog = sequelize.define('ChatLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  channel: {
    type: DataTypes.ENUM('whatsapp', 'telegram', 'sms'),
    allowNull: false
  },
  message_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  response_text: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'chat_logs'
});

module.exports = ChatLog;
