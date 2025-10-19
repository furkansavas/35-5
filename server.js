require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const bcrypt = require('bcrypt');

const AdminUser = require('./models/adminUser');

const app = express();
const PORT = process.env.PORT || 3000;

// Mongo connection
(async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI not set. Please configure your .env');
    } else {
      await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || undefined });
      console.log('MongoDB connected');
    }
  } catch (e) {
    console.error('MongoDB error:', e.message);
  }
})();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Relaxed Helmet to allow external CDNs used by the static site (Tailwind CDN, Google Fonts, Font Awesome, GSAP)
app.use(helmet({
  contentSecurityPolicy: false, // allow inline Tailwind CDN script and external styles
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Override CSP to allow required external resources (Tailwind CDN, Google Fonts, Font Awesome, GSAP, YouTube, Mixkit, Placehold, data/blob URIs)
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self' https: data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https:",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: data: blob:",
    "font-src 'self' https: data:",
    "connect-src 'self' https:",
    "frame-src https:"
  ].join('; '));
  next();
});

// Sessions (use Mongo if available, else MemoryStore - not for production)
const sessionOptions = {
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 4 },
};
if (process.env.MONGODB_URI) {
  sessionOptions.store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI });
}
app.use(session(sessionOptions));

// Static files: serve existing site as-is
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/sources', express.static(path.join(__dirname, 'sources')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Explicit fallbacks in case proxy/rewrite interferes with static middleware
app.get('/css/style.css', (req, res) => {
  res.type('text/css');
  res.sendFile(path.join(__dirname, 'css', 'style.css'));
});
app.get('/js/script.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'js', 'script.js'));
});

// Seed admin on first run
(async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) return;
  const existing = await AdminUser.findOne({ username });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await AdminUser.create({ username, passwordHash });
    console.log(`Admin kullanıcı oluşturuldu: ${username}`);
  }
})();

// Routes
const formRoutes = require('./routes/form');
const adminRoutes = require('./routes/admin');
const Content = require('./models/content');
const Theme = require('./models/theme');

app.use('/api', formRoutes);
app.use('/admin', adminRoutes);

// Home: serve your existing static index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submission from static page with JS
// If the client expects redirect, client-side will do it based on JSON

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

// Public content/theme for frontend
app.get('/api/public/content', async (req, res) => {
  try {
    const list = await Content.find();
    const map = {};
    for (const c of list) map[c.key] = c.body;
    res.json({ ok: true, content: map });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

app.get('/api/public/theme', async (req, res) => {
  try {
    let t = await Theme.findOne();
    if (!t) t = await Theme.create({});
    res.json({ ok: true, theme: { primary: t.primary, secondary: t.secondary, background: t.background, text: t.text, mode: t.mode } });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
});

// Basit hata yakalayıcı (Türkçe)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Sunucu hatası. Lütfen daha sonra tekrar deneyiniz.');
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
