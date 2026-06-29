const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const BroadcastJob = sequelize.define('BroadcastJob', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  job_type: {
    type: DataTypes.ENUM('broadcast', 'reminder'),
    defaultValue: 'broadcast',
    allowNull: false
  },
  recipients: {
    type: DataTypes.JSON,
    allowNull: false
  },
  sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  last_processed_index: {
    type: DataTypes.INTEGER,
    defaultValue: -1,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'broadcast_jobs'
});

module.exports = BroadcastJob;
