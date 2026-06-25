const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const DailyStory = sequelize.define('DailyStory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  publish_date: {
    type: DataTypes.DATEONLY, // Format YYYY-MM-DD
    allowNull: false,
    unique: true
  }
}, {
  timestamps: true,
  tableName: 'daily_stories'
});

module.exports = DailyStory;
