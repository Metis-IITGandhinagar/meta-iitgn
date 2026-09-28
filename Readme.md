<div align="center">

# 🏛️ Meta IITGN

**The unified community knowledge base, campus wiki, and resource platform for IIT Gandhinagar.**

[![CI/CD](https://github.com/Metis-IITGandhinagar/meta-iitgn/actions/workflows/develop.yaml/badge.svg)](https://github.com/Metis-IITGandhinagar/meta-iitgn/actions)
[![Release](https://github.com/Metis-IITGandhinagar/meta-iitgn/actions/workflows/release.yml/badge.svg)](https://github.com/Metis-IITGandhinagar/meta-iitgn/actions)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Express.js](https://img.shields.io/badge/Express-5-000000?logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)

[**Live Demo**](https://meta-iitgn-vercel.vercel.app) • [**Documentation**](https://meta-iitgn-vercel.vercel.app/wiki/internal-pages) • [**Contribution Guide**](CONTRIBUTING.md) • [**Docker Guide**](DEVELOPMENT.MD)

</div>

---

## 🌟 Overview

**Meta IITGN** is a modular, full-stack open-source platform designed to centralize student resources, academic archives, campus guides, interview experiences, and collaborative knowledge sharing at IIT Gandhinagar.

### Core Features

- 📚 **Collaborative Wiki & Knowledge Base:** Version-controlled articles, revision histories, draft reviews, and markdown/rich-text editing.
- 🎓 **Past Academic Papers & Course Repository:** Organized archive of exam papers (quizzes, midsems, endsems) searchable by course code and department.
- 💼 **Interview Experiences & Campus Blogs:** Student placement and internship insights with tags, search, and bookmarks.
- 📅 **Campus Events & News:** Keep track of happenings, recurring clubs, and campus announcements.
- 👤 **Student Profiles & Readmes:** Custom markdown user readmes, bookmarks, and activity tracking.
- 🔐 **Secure Authentication & RBAC:** Google OAuth 2.0 integration with role-based access control (Admins, Moderators, Students).

---

## 🏗️ Repository Architecture

Meta IITGN is structured as an independent monorepo with distinct frontend and backend services:

```text
meta-iitgn/
├── frontend/             # Next.js 15 App Router web client
│   ├── src/app/          # Route segments, pages, and layouts
│   ├── src/components/   # Reusable UI components & layouts
│   ├── src/api/          # Centralized API clients & endpoints
│   ├── src/lib/          # Shared frontend utilities & hooks
│   ├── public/           # Static assets, icons, and themes
│   └── .env.example      # Frontend environment template
│
├── backend/              # Express 5 REST API & data layer
│   ├── prisma/           # Database schema & migrations
│   ├── src/controllers/  # Request handlers & business logic
│   ├── src/routes/       # API v1 routes & endpoints
│   ├── src/service/      # Authentication & core services
│   ├── src/utils/        # Helpers (uploads, cookies, formatting)
│   └── .env.example      # Backend environment template
│
├── .github/              # GitHub Actions (CI/CD, Release Please)
├── docker-compose.yml    # Full-stack Docker orchestration
├── .env.example          # Root environment template for Docker
├── CONTRIBUTING.md       # Contributing & PR guidelines
└── DEVELOPMENT.MD        # Docker & production deployment guide
```

---

## 🚀 Quick Start (Local Setup)

You can run Meta IITGN either **natively** (recommended for rapid development) or using **Docker Compose**.

### Option 1: Native Setup

#### 1. Clone the repository
```bash
git clone https://github.com/Metis-IITGandhinagar/meta-iitgn.git
cd meta-iitgn
```

#### 2. Start the Backend API
```bash
cd backend
npm install
cp .env.example .env

# Configure DATABASE_URL and JWT_SECRET in .env, then:
npx prisma generate
npx prisma db push
npm run dev
```
> The API server will be live at `http://localhost:3001`.

#### 3. Start the Frontend Web App
In a new terminal:
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
> The web client will be live at `http://localhost:3000`.

---

### Option 2: Docker Compose Setup

Run the full stack (Next.js client, Express API, and PostgreSQL database) with a single command:

```bash
# 1. Copy root environment template
cp .env.example .env

# 2. Build and launch containers
docker compose up -d --build
```

| Service | Local URL | Container Name |
|---|---|---|
| **Frontend** | [http://localhost:3603](http://localhost:3603) | `meta-iitgn-frontend` |
| **Backend API** | [http://localhost:3636](http://localhost:3636) | `meta-iitgn-backend` |
| **PostgreSQL** | `localhost:5432` (internal) | `meta-iitgn-db` |

*For in-depth Docker commands, volume management, and VPS deployment details, see [DEVELOPMENT.MD](DEVELOPMENT.MD).*

---

## ⚙️ Environment Variables

Each workspace includes a documented `.env.example` file:

- **Root (`.env.example`)**: Configures Docker services, container ports, and shared database credentials.
- **Backend (`backend/.env.example`)**: Configures database connection string, JWT secrets, CORS allowed origins, Cloudinary, Google OAuth, and GitHub API tokens.
- **Frontend (`frontend/.env.example`)**: Configures the API base URL (`NEXT_PUBLIC_API_URL`), internal proxy rewrites (`BACKEND_INTERNAL_URL`), and public Google Client ID.

For complete variable explanations and configuration instructions, check [CONTRIBUTING.md#environment-configuration-reference](CONTRIBUTING.md#environment-configuration-reference).

---

## 🛠️ Development Scripts

### Frontend (`cd frontend`)

| Command | Description |
|---|---|
| `npm run dev` | Starts Next.js development server with Turbopack (triggers `generate:themes` first) |
| `npm run build` | Compiles production build of Next.js application |
| `npm run start` | Runs the compiled production build |
| `npm run lint` | Runs ESLint checks across frontend code |
| `npm run generate:themes` | Generates CSS theme token palettes |

### Backend (`cd backend`)

| Command | Description |
|---|---|
| `npm run dev` | Starts Express server in watch mode using `tsx` |
| `npm run build` | Compiles TypeScript source to `dist/` |
| `npm run start` | Runs compiled server from `dist/server.js` |
| `npx prisma generate` | Generates updated Prisma Client |
| `npx prisma db push` | Pushes local Prisma schema changes to target database |

---

## 🏷️ PR Title Tags & Automated Releases

We use **[Google Release Please](https://github.com/googleapis/release-please)** to maintain automated changelogs and semantic versioning. 

All PR titles and commit messages should follow the **Conventional Commits** format:
```text
<type>(<optional-scope>): <short description>
```
*Examples:* `feat(frontend): add dark mode toggle`, `fix(backend): validate token expiration`

| PR Tag | Changelog Heading | Release Bump | Example |
|---|---|---|---|
| **`feat`** | Features | **Minor** (`0.x.0`) | `feat(frontend): add search autocomplete` |
| **`fix`** | Bug Fixes | **Patch** (`0.0.x`) | `fix(backend): correct pagination offset` |
| **`chore`** | Miscellaneous | *No bump* | `chore: upgrade devDependencies` |
| **`docs`** | Documentation | *No bump* | `docs: update setup steps in README` |
| **`style`** | Styles & Formatting | *No bump* | `style(frontend): format with prettier` |
| **`refactor`** | Code Refactoring | *No bump* | `refactor(backend): modularize auth middleware` |
| **`perf`** | Performance Improvements | **Patch** (`0.0.x`) | `perf(frontend): optimize image loading` |
| **`test`** | Tests | *No bump* | `test: add unit tests for paper upload` |
| **`other`** | Other Changes | *No bump* | `other: update repo settings` |

---

## 🤝 Contributing

We welcome contributions of all kinds — bug fixes, UI improvements, new features, and documentation enhancements!

1. Read our complete [**Contributing Guide (CONTRIBUTING.md)**](CONTRIBUTING.md).
2. Check existing [Issues](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues) or open a new one to discuss proposed changes.
3. Follow the code guidelines in [`backend/AGENTS.md`](backend/AGENTS.md) and [`frontend/AGENTS.md`](frontend/AGENTS.md).
4. Create a descriptive branch, test your changes, and submit a pull request!

---

## 📖 Additional Documentation

- **[Internal Documentation Wiki](https://meta-iitgn-vercel.vercel.app/wiki/internal-pages)**: Architecture and subsystem overviews.
- **[Development & Deployment Guide](DEVELOPMENT.MD)**: Docker workflows, production VPS deployment, and volume persistence.
- **[Backend Guidelines](backend/AGENTS.md)**: Architectural and API envelope standards.
- **[Frontend Guidelines](frontend/AGENTS.md)**: Next.js App Router, accessibility, and client architecture.

---

## ❤️ Contributors

A heartfelt thank you to everyone who has contributed to Meta IITGN:

<div align="center">
  <a href="https://github.com/Metis-IITGandhinagar/meta-iitgn/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=Metis-IITGandhinagar/meta-iitgn" alt="Contributors" />
  </a>
  <p><em>Made with <a href="https://contrib.rocks">contrib.rocks</a>.</em></p>
</div>

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
