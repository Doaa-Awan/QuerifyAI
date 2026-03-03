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
  legacyHeaders: false,
  message: 'Daily query limit reached. Please try again tomorrow.',
  handler: rateLimitHandler,
});

// 5 snapshot requests per IP per hour (heavier: full schema scan + AI)
export const snapshotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Snapshot limit reached. Please try again after 1 hour.',
  handler: rateLimitHandler,
});
