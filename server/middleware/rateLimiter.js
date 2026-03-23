import { rateLimit } from 'express-rate-limit';

function rateLimitHandler(req, res, _next, options) {
  res.status(options.statusCode).json({
    error: options.message,
    retryAfter: Math.ceil(options.windowMs / 1000),
  });
}

// 20 chat requests per IP per 24 hours
export const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: true,
  message: 'Daily query limit reached. Please try again tomorrow.',
  handler: rateLimitHandler,
});

// 5 snapshot requests per IP per hour (heavier: full schema scan + AI)
export const snapshotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: true,
  message: 'Snapshot limit reached. Please try again after 1 hour.',
  handler: rateLimitHandler,
});

// 10 connect attempts per IP per 15 minutes (brute-force / credential stuffing guard)
export const connectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: true,
  message: 'Too many connection attempts. Please wait 15 minutes.',
  handler: rateLimitHandler,
});
