# QuerifyAI

Understanding an unfamiliar database without documentation is frustrating. When I joined my first job, the company's PSA database had no data model — I had to run trial-and-error SELECT queries just to figure out how the data was structured. Tickets were stored in a table called `faults`. Invoices, devices, and clients were connected through non-obvious joins that took days to piece together.

Querify connects to any PostgreSQL database, introspects the schema automatically, and lets you ask questions in plain English to get accurate SQL back — without needing to know the table names, column names, or how anything relates. Built for developers navigating databases they didn't build.

> **[Live Demo](#)** · **[GitHub](https://github.com/Doaa-Awan/ai-db-explorer)**

---

## Screenshots

*[Add demo GIF here — natural language input → SQL output]*

---

## What It Does

- **Schema introspection** — connects to any PostgreSQL database and dynamically maps all tables, columns, data types, and foreign key relationships with zero manual configuration
- **Natural language to SQL** — ask a question in plain English, get accurate SQL back with an explanation; the query runs inline so you don't have to copy-paste it anywhere
- **Two-pass AI pipeline** — Pass 1 identifies which tables are relevant to your question; Pass 2 generates SQL using only those tables' full schemas. Reduces token cost, improves accuracy, and caches table selections for follow-up queries
- **ERD visualization** — renders an interactive entity-relationship diagram using a BFS layout algorithm, with pan/zoom and draggable table cards
- **Query history** — session history of all queries with one-click copy and SQL export
- **PII safety** — masks sensitive columns (email, phone, names) in sample data before anything is sent to the AI; your data stays in your environment
- **Read-only enforcement** — SELECT-only connections, no writes to your database

---

## The Problem It Solves

Generic AI SQL tools fail on unfamiliar databases because they don't know your schema. Asking "show me all overdue invoices" returns a guess based on common table names — not a query that actually works against your database.

Querify solves that by introspecting your schema first and injecting the relevant table and column context into every prompt. The AI knows your database structure before it generates a single line of SQL.

It's not a BI tool. It doesn't return data results for you. It helps you write the right query for a database you're still learning — then you run it yourself.

---

## Who It's For

- **Developers onboarding at a new company** — understand an inherited schema without reverse-engineering it manually
- **Freelancers and contractors** dropped into a client's database with no documentation
- **Small teams** without a dedicated DBA who need to write queries against systems they didn't build

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, custom CSS (dark theme), react-hook-form, react-markdown |
| Backend | Node.js, Express 5, Zod, express-rate-limit |
| Database | PostgreSQL (pg driver, connection pooling) |
| AI | claude-sonnet via OpenRouter (two-pass routing, structured JSON output) |

---

## Running Locally

### Prerequisites
- Node.js 18+
- A PostgreSQL database to connect to
- OpenRouter API key — get one free at [openrouter.ai](https://openrouter.ai)

### Backend Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
PORT=5000
```

```bash
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

### Connecting a Database

On the connect screen, enter your PostgreSQL connection string:
```
postgresql://username:password@host:port/database
```

The tool establishes a read-only connection. No data is written to your database.

---

## Live Demo

The hosted demo comes pre-connected to a sample PostgreSQL database modelled after a real SaaS product — accounts, subscriptions, invoices, users, support tickets, feature flags. Query it immediately with no setup required.

> Demo is rate-limited to 20 queries per day per IP to manage API costs. Clone the repo and connect your own database for unlimited use.

**[Try the live demo →](#)**

---

## How the Two-Pass Pipeline Works

Most AI SQL tools inject your entire schema into every prompt. That breaks on any real-world database with 50+ tables — token limits, degraded accuracy, high API cost.

Querify splits the process:

**Pass 1** — sends your question + all table names + AI-generated table descriptions → model returns the relevant tables as a JSON array

**Pass 2** — sends your question + full schema for relevant tables only → model returns structured JSON `{ sql, explanation, tables_used }`

Pass 1 results are cached for follow-up queries on the same topic. If Pass 1 fails, it falls back to full schema injection automatically.

---

## Project Structure

```
querify/
├── server/
│   ├── controllers/     # Request handling + Zod validation
│   ├── services/        # Business logic (AI pipeline, schema introspection)
│   ├── repositories/    # State (connection pool, conversation history)
│   ├── middleware/      # Rate limiting
│   ├── db/              # PostgreSQL query helpers
│   ├── prompts/         # AI prompt templates
│   └── server.js        # Entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components (chat, ERD, results table)
│   │   └── App.jsx      # Connection screen
│   └── ...
└── README.md
```

---

## Limitations

- PostgreSQL only in v1 — SQL Server and MySQL support planned
- Works best for analytical and reporting questions; complex multi-step transformations may need manual SQL refinement
- Schema introspection covers tables, columns, data types, and foreign keys — stored procedures and views are not currently indexed
- The AI generates the query — you verify and run it. Not designed for non-technical users
