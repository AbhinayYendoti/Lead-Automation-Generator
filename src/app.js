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
// ALLOWED_ORIGINS accepts a comma-separated list of allowed origins so that
// local dev, Render, and Vercel can all coexist without changing code.
// Set this env var on Render dashboard:
//   http://localhost:3000,https://lead-automation-generator.onrender.com,https://lead-automation-generator.vercel.app
const allowedOrigins = (process.env.ALLOWED_ORIGINS || [
  'http://localhost:3000',
  'https://lead-automation-generator.onrender.com',
  'https://lead-automation-generator.vercel.app',
].join(','))
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (incomingOrigin, callback) => {
    // Allow server-to-server / curl / Postman (no Origin header)
    if (!incomingOrigin) return callback(null, true);
    if (allowedOrigins.includes(incomingOrigin)) return callback(null, true);
    callback(new Error(`CORS: origin '${incomingOrigin}' is not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
};

// Handle preflight OPTIONS requests for ALL routes (required by browsers)
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));


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
