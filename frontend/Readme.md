# 🌐 Meta IITGN - Frontend

The modern web application for Meta IITGN, built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, and **Tailwind CSS**.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI & Components**: React 19, Radix UI, DaisyUI, Lucide React
- **Rich Text & Editors**: BlockNote, Milkdown, Tiptap
- **Styling**: Tailwind CSS, PostCSS, Custom Dynamic Themes
- **State & Data Fetching**: Zustand, TanStack React Query, SWR, Axios
- **Authentication**: Google OAuth 2.0 (`@react-oauth/google`)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18 or higher (v20+ LTS recommended)
- npm v9 or higher

### 2. Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env.local` file from the provided `.env.example`:
```bash
cp .env.example .env.local
```

Configure the following variables in `.env.local`:
```env
# URL where your backend API is running (local default: http://localhost:3001)
NEXT_PUBLIC_API_URL=http://localhost:3001

# URL for Next.js internal proxy rewrites (/api/* and /uploads/*)
BACKEND_INTERNAL_URL=http://localhost:3001

# Google OAuth Client ID (optional for local testing without OAuth)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 4. Running the Development Server
```bash
npm run dev
```
> Note: `npm run dev` automatically triggers `npm run generate:themes` via its `predev` lifecycle hook to compile UI themes before starting Turbopack.

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev --turbopack` | Starts Next.js development server with Turbopack |
| `build` | `next build` | Creates an optimized production build |
| `start` | `next start` | Runs the production build |
| `lint` | `eslint` | Checks code formatting and lint errors |
| `generate:themes` | `node scripts/generate-themes.mjs` | Generates CSS color themes |

---

## 📁 Directory Structure

```text
frontend/
├── public/              # Static assets, SVG icons, and avatars
├── scripts/             # Theme generation & helper scripts
├── src/
│   ├── api/             # Centralized API service functions
│   ├── app/             # Next.js App Router (pages, layouts, routes)
│   ├── components/      # Reusable and feature UI components
│   ├── context/         # React Context providers (Auth, Theme, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and Axios instance (`api.ts`)
│   └── store/           # Zustand state management stores
├── .env.example         # Environment variable template
└── tailwind.config.ts   # Tailwind styling configurations
```

---

## 📐 Guidelines

Before making changes, please review:
- [`frontend/AGENTS.md`](./AGENTS.md) for architectural and component rules.
- Root [`CONTRIBUTING.md`](../CONTRIBUTING.md) for commit standards, branch naming, and PR submission.
