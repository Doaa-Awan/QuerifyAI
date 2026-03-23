import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import router from './routes.js';
import { clearExplorerSnapshotFile } from './services/postgres.service.js';

//.env config
dotenv.config();

// CORS — load allowed origins from env, fall back to localhost for dev
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true, // required for cookies/sessions to be sent cross-origin
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
