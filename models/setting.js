const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  whatsappNumber: { type: String, default: process.env.WHATSAPP_NUMBER || '' },
  messageTemplate: { type: String, default: 'Yeni Randevu:%0AAd:%20{{name}}%0ATelefon:%20{{phone}}%0ATarih:%20{{date}}%0AMesaj:%20{{message}}' },
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
