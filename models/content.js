const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true },
  title: { type: String, default: '' },
  body: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Content', ContentSchema);
