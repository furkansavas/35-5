const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema({
  primary: { type: String, default: '#1A472A' },
  secondary: { type: String, default: '#A6262F' },
  background: { type: String, default: '#121212' },
  text: { type: String, default: '#E0E0E0' },
  mode: { type: String, enum: ['light','dark'], default: 'dark' },
}, { timestamps: true });

module.exports = mongoose.model('Theme', ThemeSchema);
