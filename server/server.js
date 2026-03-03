import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import router from './routes.js';

dotenv.config();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

const corsOptions = { origin: allowedOrigins };

const app = express();

app.use(express.json());
app.use(cors(corsOptions));
app.use(router);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
