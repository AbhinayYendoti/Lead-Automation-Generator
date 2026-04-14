'use strict';

/**
 * LeadFlow – Server Entry Point
 * Loads environment variables, connects to MongoDB, then starts the HTTP server.
 * Handles unhandled rejections and uncaught exceptions gracefully.
 */

// Must be first — loads .env before any other module reads process.env
require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const MONGO_URI = process.env.MONGO_URI;

// ─── Validate Critical Env Vars ───────────────────────────────────────────────
if (!MONGO_URI) {
  logger.error('Server', 'MONGO_URI is not defined in environment variables. Exiting.');
  process.exit(1);
}

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // fail fast if Atlas unreachable
  })
  .then(() => {
    logger.success('MongoDB', 'Connected to MongoDB Atlas');

    // ─── Start HTTP Server ────────────────────────────────────────────────
    const server = app.listen(PORT, () => {
      logger.success('Server', `LeadFlow API running at http://localhost:${PORT}`);
      logger.info('Server', `Health check: http://localhost:${PORT}/health`);
      logger.info('Server', `Web form: http://localhost:${PORT}/`);
    });

    // ─── Graceful Shutdown ────────────────────────────────────────────────
    const shutdown = (signal) => {
      logger.warn('Server', `${signal} received — shutting down gracefully`);
      server.close(() => {
        mongoose.connection.close(false, () => {
          logger.info('Server', 'MongoDB connection closed. Exiting.');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch((err) => {
    logger.error('MongoDB', 'Connection failed', err);
    process.exit(1);
  });

// ─── Safety Nets ──────────────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Process', 'Unhandled Promise Rejection', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Process', 'Uncaught Exception — exiting', err);
  process.exit(1);
});
