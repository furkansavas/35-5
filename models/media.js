const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  type: { type: String, enum: ['image', 'video'], required: true },
  path: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Media', MediaSchema);
