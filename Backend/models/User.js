const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  phone_number: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  telegram_id: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  full_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'user'),
    defaultValue: 'user'
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  current_module_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Only needed for dashboard admin accounts
  },
  is_registered: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // true after user completes registration (gives their name)
  },
  session_data: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null // Stores active quiz/module-selection state
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;
