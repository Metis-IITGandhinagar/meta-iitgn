# Contributing to Meta IITGN

First off, thank you for considering contributing to **Meta IITGN**! 🎉 Contributions from the community help make this platform better for everyone at IIT Gandhinagar and beyond.

Please take a few moments to read through this guide before submitting code or opening a pull request.

---

## Table of Contents

1. [Project Overview & Architecture](#project-overview--architecture)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
   - [Option A: Native Setup (Recommended)](#option-a-native-setup-recommended)
   - [Option B: Docker Compose Setup](#option-b-docker-compose-setup)
4. [Environment Configuration Reference](#environment-configuration-reference)
5. [Coding Guidelines & Architectural Rules](#coding-guidelines--architectural-rules)
   - [Backend Guidelines](#backend-guidelines)
   - [Frontend Guidelines](#frontend-guidelines)
6. [Git Workflow & Commit Conventions](#git-workflow--commit-conventions)
7. [Submitting a Pull Request](#submitting-a-pull-request)
8. [Getting Help](#getting-help)

---

## Project Overview & Architecture

Meta IITGN is organized as a monorepo containing two independent services:

- **`frontend/`**: Modern web client built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.
- **`backend/`**: High-performance REST API built with **Express 5**, **Prisma ORM**, and **TypeScript**, connected to a **PostgreSQL** database (or Supabase).
- **`docker-compose.yml`**: Containerized orchestration for local testing and production deployment.

Each directory has its own dependencies and configuration. Before modifying code in either project, be sure to review the corresponding `AGENTS.md` file (`frontend/AGENTS.md` and `backend/AGENTS.md`).

---

## Prerequisites

Before setting up the repository locally, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher (v20+ LTS recommended). Check with `node -v`.
- **npm**: v9 or higher (bundled with Node.js). Check with `npm -v`.
- **Git**: For version control. Check with `git --version`.
- **PostgreSQL**: A local PostgreSQL instance (v14+) or a free cloud database like [Supabase](https://supabase.com). *(Only required if running natively without Docker)*.
- **Docker & Docker Compose**: Optional, recommended if you prefer running all services containerized.

---

## Local Development Setup

### Option A: Native Setup (Recommended)

Running services directly on your host machine provides the fastest hot-reloading and simplest debugging experience.

#### 1. Fork & Clone the Repository

```bash
# Fork the repo on GitHub, then clone your fork:
git clone https://github.com/<your-username>/meta-iitgn.git
cd meta-iitgn
```

#### 2. Backend Setup

1. **Navigate to the backend directory and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` in your editor and configure your database connection and secrets:
   - Set `DATABASE_URL` to your PostgreSQL database connection string (e.g., `postgresql://postgres:password@localhost:5432/wiki?schema=public`).
   - Set `JWT_SECRET` to any random string (at least 32 characters).
   - Set `FRONTEND_URL` to `http://localhost:3000`.
   - *(Optional)* Add Cloudinary, Google OAuth, or GitHub token if testing those specific features.

3. **Generate Prisma Client and push schema:**
   ```bash
   # Generate Prisma client bindings
   npx prisma generate

   # Push schema to your database (creates tables)
   npx prisma db push
   ```

4. **Start the backend development server:**
   ```bash
   npm run dev
   ```
   The backend API will start at **`http://localhost:3001`**.

#### 3. Frontend Setup

In a new terminal window:

1. **Navigate to the frontend directory and install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Open `frontend/.env.local` and verify:
   - `NEXT_PUBLIC_API_URL=http://localhost:3001`
   - `BACKEND_INTERNAL_URL=http://localhost:3001`
   - *(Optional)* Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` if testing Google OAuth login.

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   *(Note: `npm run dev` automatically runs theme generation via its `predev` script).*

4. **Open your browser:**
   Navigate to **`http://localhost:3000`** to view the application.

---

### Option B: Docker Compose Setup

If you prefer a one-command containerized setup with PostgreSQL, backend, and frontend all running in Docker:

1. **Copy the root environment template:**
   ```bash
   cp .env.example .env
   ```
   Open `.env` in the root folder and customize `DB_PASSWORD` and `JWT_SECRET`.

2. **Build and start all services:**
   ```bash
   docker compose up -d --build
   ```

3. **Verify running containers:**
   ```bash
   docker compose ps
   ```
   - **Frontend**: http://localhost:3603
   - **Backend**: http://localhost:3636
   - **PostgreSQL**: Internal container port 5432

4. **View logs:**
   ```bash
   # All services
   docker compose logs -f

   # Specific service
   docker compose logs -f backend
   docker compose logs -f frontend
   ```

5. **Stop containers:**
   ```bash
   docker compose down
   ```

---

## Environment Configuration Reference

### Backend (`backend/.env`)

| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `PORT` | Port for the Express server | `3001` | No |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` | No |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:password@localhost:5432/wiki?schema=public` | **Yes** |
| `DATABASE_URL_DDL` | Direct connection for Prisma DDL (Supabase pooler) | `postgresql://...:5432/...` | Only if using Supabase pooler |
| `JWT_SECRET` | Secret key used to sign and verify JWT auth tokens | `your_secret_key_min_32_chars` | **Yes** |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:3000` | **Yes** |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID for server validation | `xxx.apps.googleusercontent.com` | Optional (Auth) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `your_google_secret` | Optional (Auth) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for media uploads | `your_cloud_name` | Optional (Uploads) |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` | Optional (Uploads) |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | `your_api_secret` | Optional (Uploads) |
| `GITHUB_TOKEN` | GitHub Personal Access Token (for caching & repos) | `ghp_...` | Optional |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default / Example | Required |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for direct client-side API requests | `http://localhost:3001` | **Yes** (Local dev) |
| `BACKEND_INTERNAL_URL` | Backend URL for Next.js internal proxy rewrites & SSR | `http://localhost:3001` | **Yes** (Local dev) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID for web sign-in | `xxx.apps.googleusercontent.com` | Optional (Auth) |

---

## Coding Guidelines & Architectural Rules

### Backend Guidelines

When contributing to `backend/`:

1. **Strict JSON Envelopes**:
   Endpoints must return standardized JSON payloads:
   - **Success (200, 201):**
     ```json
     {
       "success": true,
       "data": { ... }
     }
     ```
   - **Error (400, 401, 403, 404, 500):**
     ```json
     {
       "success": false,
       "error": {
         "code": "ERROR_CODE",
         "message": "Human readable error message."
       }
     }
     ```
2. **Stateless Authentication**:
   - Pass tokens via `Authorization: Bearer <token>` or supported auth cookies.
   - Do not use server-side session stores (`express-session`).
3. **Route Versioning**:
   - All API endpoints should be mounted under `/api/v1/` (e.g., `/api/v1/wiki`).
4. **Data Formats**:
   - Return all dates in ISO 8601 string format (e.g., `2026-09-28T12:00:00.000Z`).
   - Use pagination (`?page=1&limit=20`) for list endpoints. Never return unbounded collections.

### Frontend Guidelines

When contributing to `frontend/`:

1. **Component Design**:
   - Use **Server Components** for data fetching and static markup whenever possible.
   - Add `"use client"` only when components need browser events, state, or hooks.
   - Place reusable UI components in `src/components/` and app routes in `src/app/`.
2. **Data Fetching**:
   - Centralize API requests in `src/api/` or `src/lib/api.ts`. Do not scatter raw `fetch` or Axios calls inside presentational components.
   - Handle loading, empty, and error states gracefully.
3. **Styling & Accessibility**:
   - Use semantic HTML elements (`<main>`, `<nav>`, `<article>`, `<button>`).
   - Ensure interactive elements are keyboard-accessible with visible `:focus-visible` styles.
   - Avoid hardcoded fixed pixel widths that cause horizontal overflow on mobile screens.
4. **Security & Type Safety**:
   - Do **NOT** use `dangerouslySetInnerHTML` on untrusted user input.
   - Avoid `any`. Define clean TypeScript interfaces for props, payloads, and state.
   - Always run `npm run lint` before committing frontend changes.

---

## Git Workflow & Commit Conventions

This project uses **[Release Please](https://github.com/googleapis/release-please)** to automate changelogs and version bumps. All commit messages and PR titles must adhere to the **[Conventional Commits](https://www.conventionalcommits.org/)** specification.

### Commit / PR Tag Reference

| Prefix | Meaning | Triggers Release | Changelog Section | Example |
|---|---|---|---|---|
| **`feat`** | A new user-facing feature | Yes (minor) | Features | `feat(frontend): add search shortcut cmd+k` |
| **`fix`** | A bug fix | Yes (patch) | Bug Fixes | `fix(backend): correct token expiration check` |
| **`chore`** | Maintenance, dependencies, tooling | No | Miscellaneous | `chore: update dependencies` |
| **`docs`** | Documentation changes | No | Documentation | `docs: add setup guide in CONTRIBUTING.md` |
| **`style`** | Code style, whitespace, formatting | No | Styles | `style(frontend): format with prettier` |
| **`refactor`**| Code refactoring without logic changes | No | Code Refactoring | `refactor(backend): modularize auth middleware` |
| **`perf`** | Performance improvements | Yes (patch) | Performance Improvements | `perf(frontend): optimize image loading` |
| **`test`** | Adding or correcting tests | No | Tests | `test: add unit tests for user controller` |
| **`other`** | Other miscellaneous changes | No | Other Changes | `other: update issue templates` |

### Scope Conventions

Specify the affected component in parentheses where possible:
- `feat(frontend): ...`
- `fix(backend): ...`
- `docs: ...`
- `chore(deps): ...`

---

## Submitting a Pull Request

Follow these steps to submit your contribution:

### 1. Create a Branch

```bash
# Keep your main branch up to date
git checkout main
git pull origin main

# Create a descriptive feature/fix branch
git checkout -b feat/add-dark-mode-toggle
# or
git checkout -b fix/auth-token-refresh
```

### 2. Make Your Changes

- Write clean, well-documented code following the guidelines above.
- Test your changes locally on both desktop and mobile viewports.
- Run linting and type checks:
  ```bash
  # In frontend:
  cd frontend
  npm run lint

  # In backend:
  cd backend
  npm run build
  ```

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat(frontend): add dark mode toggle to navigation header"
```

### 4. Push to Your Fork

```bash
git push origin feat/add-dark-mode-toggle
```

### 5. Open a Pull Request

1. Go to the [Meta IITGN Repository](https://github.com/Metis-IITGandhinagar/meta-iitgn) on GitHub.
2. Click **"Compare & pull request"**.
3. **PR Title**: Ensure your PR title follows Conventional Commits format (e.g., `feat(frontend): add dark mode toggle`).
4. **PR Description**: Include:
   - **Summary**: Concise description of what changed and why.
   - **Related Issues**: Link issues using keywords (e.g., `Fixes #42`, `Closes #15`).
   - **Screenshots / GIFs**: If making UI changes, attach before & after media.
   - **Testing Checklist**: Bullet points detailing how you tested the change.
5. Submit the PR and wait for review!

---

## Getting Help

If you run into issues or have questions:
- Open a question or issue on [GitHub Issues](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues).
- Check the [Internal Pages Documentation](https://meta-iitgn-vercel.vercel.app/wiki/internal-pages) for deep architectural overviews.
- Connect with the Metis team members and maintainers.

Happy coding! 🚀
