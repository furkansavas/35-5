const express = require('express');
const router = express.Router();
const axios = require('axios');
const Appointment = require('../models/appointment');
const Setting = require('../models/setting');

// Helper: build WhatsApp redirect URL
function buildWaUrl(phoneNumber, template, data) {
  const text = template
    .replace(/{{name}}/g, encodeURIComponent(data.name))
    .replace(/{{phone}}/g, encodeURIComponent(data.phone))
    .replace(/{{date}}/g, encodeURIComponent(data.date || ''))
    .replace(/{{message}}/g, encodeURIComponent(data.message || ''));
  return `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${text}`;
}

// POST /api/submit
router.post('/submit', async (req, res) => {
  try {
    const { name, phone, date, message } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }

    const appt = await Appointment.create({
      name,
      phone,
      date: date ? new Date(date) : undefined,
      message,
    });

    // Load settings (or defaults)
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});

    const method = (process.env.WHATSAPP_METHOD || 'redirect').toLowerCase();

    if (method === 'redirect') {
      const url = buildWaUrl(settings.whatsappNumber || process.env.WHATSAPP_NUMBER, settings.messageTemplate, {
        name,
        phone,
        date,
        message,
      });
      return res.status(200).json({ ok: true, redirect: url, id: appt._id });
    }

    if (method === 'ultramsg') {
      const { ULTRA_MSG_INSTANCE, ULTRA_MSG_TOKEN } = process.env;
      const to = `+${settings.whatsappNumber || process.env.WHATSAPP_NUMBER}`;
      const body = decodeURIComponent(settings.messageTemplate
        .replace(/{{name}}/g, name)
        .replace(/{{phone}}/g, phone)
        .replace(/{{date}}/g, date || '')
        .replace(/{{message}}/g, message || ''));
      await axios.post(`https://api.ultramsg.com/${ULTRA_MSG_INSTANCE}/messages/chat`, {
        token: ULTRA_MSG_TOKEN,
        to,
        body,
      });
      return res.status(200).json({ ok: true, id: appt._id });
    }

    if (method === 'twilio') {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const body = decodeURIComponent(settings.messageTemplate
        .replace(/{{name}}/g, name)
        .replace(/{{phone}}/g, phone)
        .replace(/{{date}}/g, date || '')
        .replace(/{{message}}/g, message || ''));
      await twilio.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:+${settings.whatsappNumber || process.env.WHATSAPP_NUMBER}`,
        body,
      });
      return res.status(200).json({ ok: true, id: appt._id });
    }

    // Fallback
    return res.status(200).json({ ok: true, id: appt._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
