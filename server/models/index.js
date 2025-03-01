/**
 * Models Index
 * 
 * Exports all database models for easy access throughout the application.
 */

const User = require('./User');
const GameScore = require('./GameScore');

module.exports = {
  User,
  GameScore
}; 