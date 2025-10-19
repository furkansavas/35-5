const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  date: { type: Date },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'contacted'], default: 'pending' },
}, { timestamps: { createdAt: true, updatedAt: true } });

module.exports = mongoose.model('Appointment', AppointmentSchema);
