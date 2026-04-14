const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const leadRoutes = require('./routes/leadRoutes');
const logger = require('./utils/logger');

const app = express();

// ─── Security: HTTP Headers ───────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-origin' },
  })
);

// ─── Security: CORS ───────────────────────────────────────────────────────────
// Allows only same-origin in production. Adjust ALLOWED_ORIGIN env var as needed.
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: false,
  })
);

// ─── Security: Rate Limiting ──────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // max 100 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please try again after 15 minutes.',
  },
});
app.use('/lead', apiLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));           // Limit JSON payload size
app.use(express.urlencoded({ extended: false }));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan('combined'));

// ─── Static Files (Web Form) ──────────────────────────────────────────────────
app.use(express.static('public'));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/lead', leadRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'LeadFlow API', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('App', 'Unhandled error', err);
  res.status(500).json({ status: 'error', message: 'Internal server error.' });
});

module.exports = app;
