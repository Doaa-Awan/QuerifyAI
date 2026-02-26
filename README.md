# AI Database Explorer

Understanding an unfamiliar database without documentation is frustrating. When I joined my first job, the company's PSA database had no data model — I had to run trial-and-error SELECT queries just to figure out how the data was structured. Tickets were stored in a table called `faults`. Invoices, devices, and clients were connected through non-obvious joins that took days to piece together.

This tool connects to any PostgreSQL database, introspects the schema automatically, and lets you ask questions in plain English to get accurate SQL back — without needing to know the table names, column names, or how anything relates.

> **[Live Demo](#)** · **[GitHub](https://github.com/Doaa-Awan/ai-db-explorer)**

---

## Screenshots

*[Add demo GIF here — natural language input → SQL output]*

---

## What It Does

- **Schema introspection** — connects to any PostgreSQL database and dynamically maps all tables, columns, data types, and foreign key relationships with zero manual configuration
- **Natural language queries** — ask questions in plain English and get accurate SQL back, with live schema context injected into the prompt so the AI understands your specific database structure
- **ERD visualization** — renders an interactive entity-relationship diagram from live schema data, giving you an instant visual model of any connected database
- **Query safety** — read-only connections only, SELECT queries enforced

---

## The Problem It Solves

Generic AI SQL tools fail on unfamiliar databases because they don't know your schema. Asking "show me all overdue invoices" returns a guess based on common table names — not a query that actually works against your database.

This tool solves that by introspecting your schema first and injecting the full table and column context into every prompt. The AI knows your database structure before it generates a single line of SQL.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| AI | OpenAI API (via OpenRouter) |

---

## Running Locally

### Prerequisites
- Node.js 18+
- A PostgreSQL database to connect to
- OpenRouter API key — get one free at [openrouter.ai](https://openrouter.ai)

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

### Connecting a Database

On the connect screen, enter your PostgreSQL connection string:
```
postgresql://username:password@host:port/database
```

> **Note:** The tool establishes a read-only connection. No data is written to your database.

---

## Live Demo

The hosted demo comes pre-connected to a sample PostgreSQL database you can query immediately — no setup required.

> Demo is rate-limited to 20 queries per day per user to manage API costs. Clone the repo and connect your own database for unlimited use.

**[Try the live demo →](#)**

---

## Project Structure

```
ai-db-explorer/
├── server/
│   ├── routes/          # API endpoints
│   ├── controllers/     # Request handling
│   ├── services/        # Schema introspection, query generation
│   └── server.js        # Entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page views
│   │   └── App.tsx      # Root component
│   └── ...
└── README.md
```

---

## Limitations

- Currently supports PostgreSQL only
- Natural language queries work best for analytical and reporting questions — complex multi-step data transformations may require manual SQL refinement
- Schema introspection covers tables, columns, types, and foreign keys — stored procedures and views are not currently indexed
