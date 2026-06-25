const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  module_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  question_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  options: {
    type: DataTypes.JSONB, // Array of options like ["Tabora", "Dodoma", "Dar es Salaam"]
    allowNull: false
  },
  correct_option: {
    type: DataTypes.INTEGER, // Index of the correct answer (e.g. 0 for the 1st option)
    allowNull: false
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  }
}, {
  timestamps: true,
  tableName: 'questions'
});

module.exports = Question;
