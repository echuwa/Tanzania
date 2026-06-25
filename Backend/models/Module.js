const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  order_index: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  }
}, {
  timestamps: true,
  tableName: 'modules'
});

module.exports = Module;
