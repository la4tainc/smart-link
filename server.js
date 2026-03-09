const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const CONFIG_PATH = path.join(ROOT_DIR, 'config.json');
const EVENTS_PATH = path.join(ROOT_DIR, 'events.json');

app.use(cors());
app.use(express.json());
app.use(morgan('tiny'));

// Serve static landing page assets
app.use(express.static(PUBLIC_DIR));

// Load config
function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load config.json', err);
    return {};
  }
}

// Simple JSON-based event store
function readEvents() {
  try {
    if (!fs.existsSync(EVENTS_PATH)) return [];
    const raw = fs.readFileSync(EVENTS_PATH, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read events.json', err);
    return [];
  }
}

function writeEvents(events) {
  try {
    fs.writeFileSync(EVENTS_PATH, JSON.stringify(events, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write events.json', err);
  }
}

// API: get public config for frontend
app.get('/api/config', (req, res) => {
  const cfg = loadConfig();
  // Only send what the frontend needs
  const publicConfig = {
    pageTitle: cfg.pageTitle || 'New Release',
    artistName: cfg.artistName || '',
    headline: cfg.headline || '',
    spotifyUrl: cfg.spotifyUrl || '',
    primaryColor: cfg.primaryColor || '#0f172a',
    accentColor: cfg.accentColor || '#22c55e',
    backgroundColor: cfg.backgroundColor || '#020617',
    facebookPixelId: cfg.facebookPixelId || '',
    logoText: cfg.logoText || ''
  };
  res.json(publicConfig);
});

// API: track events (page views, clicks)
app.post('/api/events', (req, res) => {
  const { type, metadata } = req.body || {};
  if (!type) {
    return res.status(400).json({ error: 'Missing event type' });
  }

  const events = readEvents();
  const event = {
    id: events.length + 1,
    type,
    metadata: metadata || {},
    userAgent: req.headers['user-agent'] || '',
    referrer: req.headers['referer'] || req.headers['referrer'] || '',
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
    timestamp: new Date().toISOString()
  };

  events.push(event);
  writeEvents(events);

  res.json({ success: true });
});

// API: simple summary analytics
app.get('/api/summary', (req, res) => {
  const events = readEvents();
  const summary = {
    totalEvents: events.length,
    pageViews: events.filter(e => e.type === 'page_view').length,
    linkClicks: events.filter(e => e.type === 'spotify_click').length
  };
  res.json({ summary, events });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Smart link landing page running on http://localhost:${PORT}`);
});
