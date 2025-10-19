const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');
const AdminUser = require('../models/adminUser');
const Appointment = require('../models/appointment');
const Setting = require('../models/setting');
const Content = require('../models/content');
const Media = require('../models/media');
const Theme = require('../models/theme');

const router = express.Router();

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect('/admin/login');
}

// Multer ayarları (uploads/ klasörü)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, safe);
  }
});
const upload = multer({ storage });

// Giriş
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await AdminUser.findOne({ username });
  if (!user) return res.render('login', { error: 'Geçersiz bilgiler' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.render('login', { error: 'Geçersiz bilgiler' });
  req.session.userId = user._id;
  res.redirect('/admin');
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
});

// Panel
router.get('/', requireAuth, async (req, res) => {
  const count = await Appointment.countDocuments();
  const pending = await Appointment.countDocuments({ status: 'pending' });
  const contacted = await Appointment.countDocuments({ status: 'contacted' });
  const items = await Appointment.find().sort({ createdAt: -1 }).limit(20);
  res.render('dashboard', { count, pending, contacted, items });
});

// Randevular: liste + arama/filtre
router.get('/randevular', requireAuth, async (req, res) => {
  const { q, tarih } = req.query;
  const filter = {};
  if (q) filter.name = { $regex: q, $options: 'i' };
  if (tarih) {
    const d = new Date(tarih);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    filter.date = { $gte: d, $lt: next };
  }
  const items = await Appointment.find(filter).sort({ createdAt: -1 });
  res.render('appointments', { items, q: q || '', tarih: tarih || '' });
});

router.post('/randevular/yeni', requireAuth, async (req, res) => {
  const { name, phone, date, time, message } = req.body;
  const dt = date ? new Date(`${date} ${time || '00:00'}`) : undefined;
  await Appointment.create({ name, phone, date: dt, message });
  res.redirect('/admin/randevular');
});

router.post('/randevular/:id/guncelle', requireAuth, async (req, res) => {
  const { name, phone, date, time, message, status } = req.body;
  const dt = date ? new Date(`${date} ${time || '00:00'}`) : undefined;
  await Appointment.findByIdAndUpdate(req.params.id, { name, phone, date: dt, message, status });
  res.redirect('/admin/randevular');
});

router.post('/randevular/:id/sil', requireAuth, async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);
  res.redirect('/admin/randevular');
});

router.post('/randevular/:id/onay', requireAuth, async (req, res) => {
  await Appointment.findByIdAndUpdate(req.params.id, { status: 'contacted' });
  res.redirect('/admin/randevular');
});

// İçerik Yönetimi
router.get('/icerik', requireAuth, async (req, res) => {
  const keys = ['hero_title','hero_subtitle','hakkimizda_metin'];
  const map = {};
  for (const key of keys) {
    map[key] = await Content.findOne({ key }) || { key, title: '', body: '' };
  }
  res.render('content', { content: map, kaydedildi: false });
});

router.post('/icerik', requireAuth, async (req, res) => {
  const entries = Object.entries(req.body);
  for (const [key, value] of entries) {
    await Content.findOneAndUpdate({ key }, { body: value }, { upsert: true });
  }
  const map = {};
  for (const key of Object.keys(req.body)) {
    map[key] = await Content.findOne({ key });
  }
  res.render('content', { content: map, kaydedildi: true });
});

// Görseller/Videolar
router.get('/gorseller', requireAuth, async (req, res) => {
  const list = await Media.find().sort({ createdAt: -1 });
  res.render('media', { list, mesaj: null });
});

router.post('/gorseller/yukle', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.redirect('/admin/gorseller');
  const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
  await Media.create({ title: req.body.title || req.file.originalname, type, path: `/uploads/${req.file.filename}` });
  res.redirect('/admin/gorseller');
});

router.post('/gorseller/:id/sil', requireAuth, async (req, res) => {
  const item = await Media.findById(req.params.id);
  if (item) {
    try { fs.unlinkSync(path.join(__dirname, '..', item.path)); } catch (_) {}
    await item.deleteOne();
  }
  res.redirect('/admin/gorseller');
});

// Tema / Renk Ayarları
router.get('/tema', requireAuth, async (req, res) => {
  let theme = await Theme.findOne();
  if (!theme) theme = await Theme.create({});
  res.render('theme', { theme, kaydedildi: false });
});

router.post('/tema', requireAuth, async (req, res) => {
  const { primary, secondary, background, text, mode } = req.body;
  let theme = await Theme.findOne();
  if (!theme) theme = await Theme.create({ primary, secondary, background, text, mode });
  else {
    theme.primary = primary; theme.secondary = secondary; theme.background = background; theme.text = text; theme.mode = mode;
    await theme.save();
  }
  res.render('theme', { theme, kaydedildi: true });
});

// Eski ayarlar sayfası (WhatsApp)
router.get('/settings', requireAuth, async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({});
  res.render('settings', { settings, saved: false });
});

router.post('/settings', requireAuth, async (req, res) => {
  const { whatsappNumber, messageTemplate } = req.body;
  let settings = await Setting.findOne();
  if (!settings) settings = await Setting.create({ whatsappNumber, messageTemplate });
  else {
    settings.whatsappNumber = whatsappNumber;
    settings.messageTemplate = messageTemplate;
    await settings.save();
  }
  res.render('settings', { settings, saved: true });
});

module.exports = router;
