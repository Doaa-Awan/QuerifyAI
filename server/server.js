import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import router from './routes.js';

//.env config
dotenv.config();

// CORS — load allowed origins from env, fall back to localhost for dev
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // required for cookies/sessions to be sent cross-origin
  exposedHeaders: [
    'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset',
    'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset',
  ],
};

const app = express();

app.set('trust proxy', 1); // required for req.secure to be accurate behind Railway/Vercel proxy

app.use(helmet()); // security headers: X-Content-Type-Options, X-Frame-Options, CSP, etc.
app.use(express.json());
app.use(cors(corsOptions));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // prevent JS access to the cookie
      secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // none required for cross-origin cookies in production
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  })
);

app.use(router);

const PORT = process.env.PORT || process.env.VITE_PORT || 5000;

// Startup guard — warn loudly if SESSION_SECRET is weak in production
const WEAK_SECRETS = new Set([
  'dev-secret-change-in-production',
  'change-me-to-a-long-random-string',
]);

if (process.env.NODE_ENV === 'production') {
  const secret = process.env.SESSION_SECRET || '';
  if (!secret || WEAK_SECRETS.has(secret) || secret.length < 32) {
    console.error(
      '\n[SECURITY WARNING] SESSION_SECRET is weak or missing in production.\n' +
      'Session cookies can be forged. Set a strong random secret:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n' +
      'Then set SESSION_SECRET=<that value> in your production environment.\n'
    );
  }
}

// (async () => {
//   try {
//     await clearExplorerSnapshotFile();
//     console.log('[startup] DB explorer context cleared');
//   } catch (err) {
//     console.warn('[startup] failed to clear snapshot files:', err.message);
//   }
// })();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
