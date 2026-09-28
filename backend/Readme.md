# ⚙️ Meta IITGN - Backend API

The REST API engine for Meta IITGN, built with **Express 5**, **Prisma ORM**, and **TypeScript**, powered by **PostgreSQL**.

---

## 🛠️ Tech Stack

- **Framework**: Express.js (v5)
- **Database & ORM**: PostgreSQL, Prisma ORM (v6)
- **Authentication**: JWT (JSON Web Tokens) with Google OAuth 2.0 verification
- **Media Storage**: Cloudinary & local disk storage
- **Development Tooling**: `tsx` (TypeScript execution & watch), ESLint, Knip

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18 or higher (v20+ LTS recommended)
- PostgreSQL database (local instance or cloud database like Supabase)

### 2. Installation
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file from the provided `.env.example`:
```bash
cp .env.example .env
```

Key variables to configure in `backend/.env`:
```env
PORT=3001
NODE_ENV=development

# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/wiki?schema=public"

# If using Supabase Connection Pooler (port 6543), set DATABASE_URL_DDL for migrations:
# DATABASE_URL_DDL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Secret key for JWT signing (at least 32 characters)
JWT_SECRET=your_jwt_secret_key_change_this_to_a_secure_random_string

# Allowed frontend origin for CORS
FRONTEND_URL=http://localhost:3000
```
*(See `.env.example` for optional Cloudinary, Google OAuth, and GitHub API credentials).*

### 4. Database Setup & Prisma
```bash
# Generate Prisma Client
npx prisma generate

# Synchronize database schema (creates/updates tables)
npx prisma db push
```

> **Note for Supabase users:** Supabase's port `6543` connection pooler runs in transaction mode and rejects DDL statements (`CREATE TABLE`, etc.). For `prisma db push` / `migrate`, pass the direct port `5432` connection string:
> ```bash
> DATABASE_URL=$DATABASE_URL_DDL npx prisma db push
> ```

### 5. Running the Server
```bash
# Development mode (with live watch & reload)
npm run dev
```
The API server will start on **`http://localhost:3001`**.

---

## 📜 Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `tsx watch src/server.ts` | Runs the server in development watch mode |
| `build` | `tsc` | Compiles TypeScript to `dist/` |
| `start` | `node dist/server.js` | Runs compiled production server |
| `prisma generate` | `npx prisma generate` | Regenerates Prisma Client types |
| `prisma db push` | `npx prisma db push` | Pushes schema directly to the database |
| `prisma studio` | `npx prisma studio` | Opens visual GUI for browsing database records |

---

## 📁 Directory Structure

```text
backend/
├── prisma/
│   └── schema.prisma      # Database schema, models, and enums
├── src/
│   ├── config/            # Third-party configurations (Google, Cloudinary)
│   ├── controllers/       # Route controllers & request handling logic
│   ├── lib/               # Shared utilities (Prisma client singleton)
│   ├── routes/            # Express route definitions (/api/v1/...)
│   ├── service/           # Domain logic (auth, permissions)
│   ├── utils/             # Helpers (cookies, tokens, file uploads)
│   └── server.ts          # Express application entrypoint
├── .env.example           # Environment template
└── tsconfig.json          # TypeScript compiler options
```

---

## 📐 API Standards

All endpoints adhere to strict API rules defined in [`backend/AGENTS.md`](./AGENTS.md):
- **Pure JSON**: Only JSON responses are returned.
- **Stateless Authentication**: JWT tokens sent via `Authorization: Bearer <token>`.
- **Standardized Envelopes**:
  - Success: `{ "success": true, "data": { ... } }`
  - Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`
- **Versioning**: Prefixed with `/api/v1/`.
- **Timestamps & Pagination**: ISO 8601 strings and query pagination (`?page=1&limit=20`).

For contributing guidelines and PR submission, see root [`CONTRIBUTING.md`](../CONTRIBUTING.md).
