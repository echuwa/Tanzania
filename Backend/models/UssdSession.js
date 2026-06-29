const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UssdSession = sequelize.define('UssdSession', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  session_data: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  }
}, {
  timestamps: true,
  tableName: 'ussd_sessions'
});

module.exports = UssdSession;
