const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FailedMessage = sequelize.define('FailedMessage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  message_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  error_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  channel: {
    type: DataTypes.STRING,
    defaultValue: 'whatsapp'
  },
  message_type: {
    type: DataTypes.STRING,
    defaultValue: 'reply' // 'reply', 'broadcast', 'reminder'
  }
}, {
  timestamps: true,
  tableName: 'failed_messages'
});

module.exports = FailedMessage;
