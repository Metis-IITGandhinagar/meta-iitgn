# 📋 Recommended Issues for Contributors

This document contains **11 curated, actionable issues** designed for open-source contributors of all skill levels to solve.

Maintainers and contributors can click the **[🚀 Open Issue on GitHub]** button next to any item to immediately open a pre-filled issue on the repository!

---

## 📑 Issue Index

| # | Title | Difficulty | Component | Labels |
|---|---|---|---|---|
| 1 | [Add dedicated `/health` endpoint for server & database status check](#1-featbackend-add-dedicated-health-endpoint-for-server--database-status-check) | 🟢 Good First Issue | Backend | `good first issue`, `backend`, `enhancement` |
| 2 | [Fix ESLint warnings and replace raw `img` with Next.js `Image` in WikiInfoBox](#2-fixfrontend-fix-eslint-warnings-and-replace-raw-img-with-nextjs-image-in-wikiinfobox) | 🟢 Good First Issue | Frontend | `good first issue`, `frontend`, `bug` |
| 3 | [Add "Copy Code" button with toast notification to markdown code blocks](#3-featfrontend-add-copy-code-button-with-toast-notification-to-markdown-code-blocks) | 🟢 Good First Issue | Frontend | `good first issue`, `frontend`, `enhancement` |
| 4 | [Add global keyboard shortcut (Ctrl+K / Cmd+K) to focus search bar](#4-featfrontend-add-global-keyboard-shortcut-ctrlk--cmdk-to-focus-search-bar) | 🟢 Good First Issue | Frontend | `good first issue`, `frontend`, `enhancement` |
| 5 | [Add floating "Back to Top" button on long wiki articles and blogs](#5-featfrontend-add-floating-back-to-top-button-on-long-wiki-articles-and-blogs) | 🟢 Good First Issue | Frontend | `good first issue`, `frontend`, `enhancement` |
| 6 | [Validate allowed file extensions and file size limits on exam paper uploads](#6-fixbackend-validate-allowed-file-extensions-and-file-size-limits-on-exam-paper-uploads) | 🟢 Good First Issue | Backend | `good first issue`, `backend`, `bug` |
| 7 | [Implement endpoint-level rate limiting on sensitive routes (auth, uploads)](#7-featbackend-implement-endpoint-level-rate-limiting-on-sensitive-routes-auth-uploads) | 🟡 Mid-Level | Backend | `backend`, `enhancement`, `help wanted` |
| 8 | [Add multi-criteria filters (Department, Year, Semester) to Past Papers repository](#8-featfrontend-add-multi-criteria-filters-department-year-semester-to-past-papers-repository) | 🟡 Mid-Level | Frontend | `frontend`, `enhancement`, `help wanted` |
| 9 | [Offline reading list & bookmark caching using IndexedDB (Dexie)](#9-featfrontend-offline-reading-list--bookmark-caching-using-indexeddb-dexie) | 🟡 Mid-Level | Frontend | `frontend`, `enhancement`, `help wanted` |
| 10 | [Upgrade article search to PostgreSQL Full-Text Search with Trigram fuzzy matching](#10-featbackend-upgrade-article-search-to-postgresql-full-text-search-with-trigram-fuzzy-matching) | 🔴 Hard | Backend | `backend`, `enhancement`, `help wanted` |
| 11 | [Real-time collaborative draft presence & concurrent edit conflict warning](#11-featfullstack-real-time-collaborative-draft-presence--concurrent-edit-conflict-warning) | 🔴 Hard | Fullstack | `frontend`, `backend`, `enhancement`, `help wanted` |

---

## 🟢 Good First Issues (Beginner Friendly)

### 1. `feat(backend): Add dedicated /health endpoint for server & database status check`

> **Difficulty**: 🟢 Good First Issue | **Component**: Backend | **Labels**: `good first issue`, `backend`, `enhancement`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(backend):%20Add%20dedicated%20/health%20endpoint%20for%20server%20%26%20database%20status%20check&labels=good%20first%20issue,backend,enhancement&body=%23%23%20Problem%0ACurrently%2C%20the%20backend%20Express%20server%20lacks%20a%20dedicated%20healthcheck%20endpoint.%20Docker%20compose%20and%20VPS%20uptime%20monitors%20cannot%20verify%20if%20the%20database%20connection%20pool%20and%20server%20are%20healthy.%0A%0A%23%23%20Proposed%20Solution%0AAdd%20%60GET%20/health%60%20and%20%60GET%20/api/v1/health%60%20endpoints%20that%20ping%20Prisma%20(%60SELECT%201%60)%20and%20return%20server%20uptime%20and%20status.%0A%0A%23%23%20Relevant%20Files%0A-%20%60backend/src/routes/health.ts%60%0A-%20%60backend/src/server.ts%60)

#### 📝 Context
Currently, the Express backend server does not have a dedicated `/health` or `/api/v1/health` endpoint. Container orchestrators (Docker Compose), reverse proxies, and VPS uptime bots have no lightweight way to verify whether the server is up and its PostgreSQL database connection pool is responsive.

#### 📁 Relevant Files
- `backend/src/routes/health.ts` (new route)
- `backend/src/server.ts` or `backend/src/index.ts`

#### 🛠️ Implementation Steps
1. Create a health route at `backend/src/routes/health.ts`.
2. Execute a fast database check using Prisma:
   ```ts
   await prisma.$queryRaw`SELECT 1`;
   ```
3. Return the standard JSON envelope:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "uptime": 124.5,
       "timestamp": "2026-09-28T14:00:00.000Z",
       "database": "connected"
     }
   }
   ```
4. If database connection fails, catch the error and return HTTP 503 Service Unavailable with:
   ```json
   {
     "success": false,
     "error": {
       "code": "SERVICE_UNAVAILABLE",
       "message": "Database ping failed"
     }
   }
   ```

#### ✅ Acceptance Criteria
- [ ] `GET /health` and `GET /api/v1/health` return HTTP 200 with server uptime and status.
- [ ] Returns HTTP 503 if the database is unreachable.
- [ ] `npm run build` in `backend/` passes without TypeScript errors.

---

### 2. `fix(frontend): Fix ESLint warnings and replace raw img with Next.js Image in WikiInfoBox`

> **Difficulty**: 🟢 Good First Issue | **Component**: Frontend | **Labels**: `good first issue`, `frontend`, `bug`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=fix(frontend):%20Fix%20ESLint%20warnings%20and%20replace%20raw%20img%20with%20Next.js%20Image%20in%20WikiInfoBox&labels=good%20first%20issue,frontend,bug&body=%23%23%20Problem%0ARunning%20%60npm%20run%20lint%60%20in%20frontend%20outputs%203%20warnings%20regarding%20unused%20variables%20and%20unoptimized%20%3Cimg%3E%20tags.%0A%0A%23%23%20Proposed%20Fix%0A1.%20Replace%20raw%20%3Cimg%3E%20in%20%60WikiInfoBox.tsx%60%20with%20Next.js%20%60Image%60.%0A2.%20Remove%20unused%20%60Users%60%20import%20in%20%60HomeTab.tsx%60.%0A3.%20Clean%20up%20unused%20eslint%20directive%20in%20%60daisyThemes.ts%60.%0A%0A%23%23%20Relevant%20Files%0A-%20%60frontend/src/components/wiki/WikiInfoBox.tsx%60%0A-%20%60frontend/src/components/home/HomeTab.tsx%60%0A-%20%60frontend/src/lib/daisyThemes.ts%60)

#### 📝 Context
Running `npm run lint` in `frontend/` produces three warnings:
1. `frontend/src/components/wiki/WikiInfoBox.tsx:291:17`: Using raw `<img>` instead of Next.js `<Image />` causes slower Largest Contentful Paint (LCP) and layout shift.
2. `frontend/src/components/home/HomeTab.tsx:23:3`: Unused import `'Users'` from `'lucide-react'`.
3. `frontend/src/lib/daisyThemes.ts:4:1`: Unused eslint-disable directive.

#### 📁 Relevant Files
- `frontend/src/components/wiki/WikiInfoBox.tsx`
- `frontend/src/components/home/HomeTab.tsx`
- `frontend/src/lib/daisyThemes.ts`

#### 🛠️ Implementation Steps
1. In `WikiInfoBox.tsx`, import `Image` from `"next/image"` and replace the raw `<img>` element. Ensure responsive dimensions (`width`, `height`, `alt`, and `className="object-cover"` or `style={{ objectFit: 'cover' }}`).
2. In `HomeTab.tsx`, remove `Users` from the `lucide-react` import statement.
3. In `daisyThemes.ts`, remove the redundant eslint-disable comment.

#### ✅ Acceptance Criteria
- [ ] Running `npm run lint` inside `frontend/` outputs `0 problems` (0 errors, 0 warnings).
- [ ] Info box images render with correct aspect ratio.

---

### 3. `feat(frontend): Add "Copy Code" button with toast notification to markdown code blocks`

> **Difficulty**: 🟢 Good First Issue | **Component**: Frontend | **Labels**: `good first issue`, `frontend`, `enhancement`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(frontend):%20Add%20%22Copy%20Code%22%20button%20with%20toast%20notification%20to%20markdown%20code%20blocks&labels=good%20first%20issue,frontend,enhancement&body=%23%23%20Problem%0AReaders%20viewing%20technical%20documentation%20or%20articles%20have%20to%20manually%20highlight%20code%20blocks%20to%20copy%20them.%0A%0A%23%23%20Proposed%20Solution%0AAdd%20a%20copy%20button%20to%20the%20top-right%20corner%20of%20all%20code%20blocks%20that%20copies%20content%20to%20clipboard%20and%20shows%20a%20Check%20icon%20%2B%20toast.%0A%0A%23%23%20Relevant%20Files%0A-%20%60frontend/src/components/wiki/%60)

#### 📝 Context
When reading tutorials, academic code snippets, or configuration examples in wiki pages and blogs, users currently must manually select and copy text. Adding an interactive one-click "Copy Code" button improves developer ergonomics.

#### 📁 Relevant Files
- `frontend/src/components/wiki/` (Markdown/Tiptap reader components)
- `frontend/src/app/wiki/[slug]/`

#### 🛠️ Implementation Steps
1. Enhance the markdown/code block rendering component to render a container with `relative group`.
2. Add a copy button in the top-right corner with `lucide-react`'s `Copy` icon.
3. On click, call `navigator.clipboard.writeText(codeText)`.
4. Swap the icon to `Check` for 2 seconds and trigger `toast.success("Copied to clipboard!")`.

#### ✅ Acceptance Criteria
- [ ] Code blocks render a clean copy button on hover/desktop and tap on mobile.
- [ ] Clicking copies code without HTML artifacts or line numbers.
- [ ] Displays visual confirmation (Check icon + toast).

---

### 4. `feat(frontend): Add global keyboard shortcut (Ctrl+K / Cmd+K) to focus search bar`

> **Difficulty**: 🟢 Good First Issue | **Component**: Frontend | **Labels**: `good first issue`, `frontend`, `enhancement`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(frontend):%20Add%20global%20keyboard%20shortcut%20(Ctrl%2BK%20/%20Cmd%2BK)%20to%20focus%20search%20bar&labels=good%20first%20issue,frontend,enhancement&body=%23%23%20Problem%0AUsers%20cannot%20quickly%20search%20articles%20from%20anywhere%20via%20keyboard.%0A%0A%23%23%20Proposed%20Solution%0AAdd%20a%20global%20keyboard%20shortcut%20(Cmd%2BK%20on%20macOS%2C%20Ctrl%2BK%20on%20Windows/Linux)%20to%20focus%20the%20top%20navbar%20search%20input.%0A%0A%23%23%20Relevant%20Files%0A-%20%60frontend/src/components/navs/Navbar.tsx%60%0A-%20%60frontend/src/components/helpers/SearchDesign.tsx%60)

#### 📝 Context
Most modern documentation platforms support pressing `Cmd+K` or `Ctrl+K` from any page to jump straight into search. In Meta IITGN, users have to manually point and click the search box.

#### 📁 Relevant Files
- `frontend/src/components/navs/Navbar.tsx`
- `frontend/src/components/helpers/SearchDesign.tsx`

#### 🛠️ Implementation Steps
1. Add a `useEffect` hook listening to `keydown` events on `window`.
2. Check if `(e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k"`.
3. If pressed, execute `e.preventDefault()`, scroll or open search, and call `.focus()` on the search `<input>`.
4. Display a keyboard badge (`⌘K` on Mac / `Ctrl K` on others) inside the search placeholder.

#### ✅ Acceptance Criteria
- [ ] Pressing `Cmd+K` / `Ctrl+K` focuses the search input from any page.
- [ ] Does not trigger if user is actively typing in another `<input>` or `<textarea>`.
- [ ] Pressing `Escape` blurs the search input.

---

### 5. `feat(frontend): Add floating "Back to Top" button on long wiki articles and blogs`

> **Difficulty**: 🟢 Good First Issue | **Component**: Frontend | **Labels**: `good first issue`, `frontend`, `enhancement`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(frontend):%20Add%20floating%20%22Back%20to%20Top%22%20button%20on%20long%20wiki%20articles%20and%20blogs&labels=good%20first%20issue,frontend,enhancement&body=%23%23%20Problem%0ALong%20wiki%20pages%20and%20interview%20posts%20require%20lots%20of%20scrolling%2C%20making%20it%20tedious%20to%20return%20to%20top%20navigation.%0A%0A%23%23%20Proposed%20Solution%0ACreate%20a%20smooth-scrolling%20%22Back%20to%20Top%22%20floating%20action%20button%20that%20appears%20after%20scrolling%20down%20400px.%0A%0A%23%23%20Relevant%20Files%0A-%20%60frontend/src/components/common/BackToTop.tsx%60)

#### 📝 Context
Some articles and placement logs contain several pages of detailed reading. Once readers reach the bottom or middle, scrolling back up manually is inconvenient.

#### 📁 Relevant Files
- `frontend/src/components/common/BackToTop.tsx` (new component)
- `frontend/src/app/wiki/[slug]/page.tsx`
- `frontend/src/app/blogs/[slug]/page.tsx`

#### 🛠️ Implementation Steps
1. Create a `BackToTop` component with `framer-motion` or Tailwind transitions.
2. Track `window.scrollY > 400`.
3. Render a floating button with `ChevronUp` positioned at `fixed bottom-6 right-6 z-40`.
4. On click, call `window.scrollTo({ top: 0, behavior: "smooth" })`.

#### ✅ Acceptance Criteria
- [ ] Hidden when at the top of the page.
- [ ] Smoothly fades in after scrolling past 400px.
- [ ] Scrolls smoothly to top on click.

---

### 6. `fix(backend): Validate allowed file extensions and file size limits on exam paper uploads`

> **Difficulty**: 🟢 Good First Issue | **Component**: Backend | **Labels**: `good first issue`, `backend`, `bug`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=fix(backend):%20Validate%20allowed%20file%20extensions%20and%20file%20size%20limits%20on%20exam%20paper%20uploads&labels=good%20first%20issue,backend,bug&body=%23%23%20Problem%0AThe%20paper%20upload%20endpoint%20does%20not%20strictly%20validate%20file%20MIME%20types%20or%20enforce%20a%20maximum%20file%20size%20limit%20in%20Multer.%0A%0A%23%23%20Proposed%20Fix%0AConfigure%20multer%20with%20fileFilter%20for%20application/pdf%20and%20a%2015MB%20size%20limit%20with%20clean%20JSON%20error%20envelopes.%0A%0A%23%23%20Relevant%20Files%0A-%20%60backend/src/routes/paper.ts%60%0A-%20%60backend/src/controllers/paper.controller.ts%60)

#### 📝 Context
In `backend/src/controllers/paper.controller.ts`, uploaded files are accepted without strict Multer MIME filtering or maximum file size limits. Users could inadvertently upload non-PDF files or excessively large files that strain storage.

#### 📁 Relevant Files
- `backend/src/routes/paper.ts`
- `backend/src/controllers/paper.controller.ts`

#### 🛠️ Implementation Steps
1. Add a `fileFilter` to the Multer upload middleware:
   ```ts
   fileFilter: (req, file, cb) => {
     if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
       cb(null, true);
     } else {
       cb(new Error("ONLY_PDF_ALLOWED"));
     }
   }
   ```
2. Set `limits: { fileSize: 15 * 1024 * 1024 }` (15 MB maximum).
3. Catch Multer errors and return standardized JSON response:
   ```json
   {
     "success": false,
     "error": { "code": "INVALID_FILE", "message": "Only PDF files under 15MB are allowed" }
   }
   ```

#### ✅ Acceptance Criteria
- [ ] Non-PDF file uploads are rejected with HTTP 400.
- [ ] Files larger than 15MB are rejected before storage.
- [ ] Valid PDF files continue uploading properly.

---

## 🟡 Mid-Level Issues

### 7. `feat(backend): Implement endpoint-level rate limiting on sensitive routes (auth, uploads)`

> **Difficulty**: 🟡 Mid-Level | **Component**: Backend | **Labels**: `backend`, `enhancement`, `help wanted`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(backend):%20Implement%20endpoint-level%20rate%20limiting%20on%20sensitive%20routes%20(auth,%20uploads)&labels=backend,enhancement,help%20wanted&body=%23%23%20Problem%0AAuthentication%20and%20file%20upload%20endpoints%20currently%20lack%20specific%20rate%20limits%2C%20leaving%20them%20vulnerable%20to%20abuse.%0A%0A%23%23%20Proposed%20Solution%0AConfigure%20%60express-rate-limit%60%20middlewares%20for%20auth%20and%20file%20uploads%20returning%20standard%20JSON%20429%20errors.%0A%0A%23%23%20Relevant%20Files%0A-%20%60backend/src/server.ts%60%0A-%20%60backend/src/routes/user.ts%60%0A-%20%60backend/src/routes/paper.ts%60)

#### 📝 Context
`express-rate-limit` is in `backend/package.json`, but sensitive routes (Google login exchange, paper uploads, media uploads) don't have tailored rate limits. A malicious user could trigger repeated API calls to exhaust Cloudinary quotas or flood database rows.

#### 📁 Relevant Files
- `backend/src/middlewares/rateLimiter.ts` (new)
- `backend/src/routes/user.ts`
- `backend/src/routes/paper.ts`
- `backend/src/routes/media.ts`

#### 🛠️ Implementation Steps
1. Create `authLimiter`: Max 15 requests per 15 minutes per IP.
2. Create `uploadLimiter`: Max 20 uploads per hour per authenticated user/IP.
3. Standardize the 429 response body to adhere to `backend/AGENTS.md`:
   ```json
   {
     "success": false,
     "error": {
       "code": "RATE_LIMIT_EXCEEDED",
       "message": "Too many requests. Please try again in a few minutes."
     }
   }
   ```
4. Attach limiters to respective router handlers.

#### ✅ Acceptance Criteria
- [ ] Crossing request thresholds returns HTTP 429 with `Retry-After` header.
- [ ] Normal usage operates without false positives.

---

### 8. `feat(frontend): Add multi-criteria filters (Department, Year, Semester) to Past Papers repository`

> **Difficulty**: 🟡 Mid-Level | **Component**: Frontend | **Labels**: `frontend`, `enhancement`, `help wanted`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(frontend):%20Add%20multi-criteria%20filters%20(Department,%20Year,%20Semester)%20to%20Past%20Papers%20repository&labels=frontend,enhancement,help%20wanted&body=%23%23%20Problem%0AStudents%20browsing%20past%20exam%20papers%20need%20to%20filter%20by%20Department%2C%20Year%2C%20and%20Semester%20simultaneously.%0A%0A%23%23%20Proposed%20Solution%0AAdd%20filter%20chips/selectors%20to%20the%20papers%20view%20and%20sync%20filters%20with%20URL%20query%20parameters.%0A%0A%23%23%20Relevant%20Files%0A-%20%60frontend/src/app/papers/%60)

#### 📝 Context
The backend API (`/api/v1/paper`) already supports query parameters like `department`, `year`, `examType`, and `search`. However, the frontend currently only exposes limited filtering controls. Students need an intuitive way to narrow down papers.

#### 📁 Relevant Files
- `frontend/src/app/papers/`
- `frontend/src/components/papers/`

#### 🛠️ Implementation Steps
1. Build interactive dropdown or pill selectors for:
   - Department: `CSE`, `EE`, `ME`, `CE`, `MSE`, `Physics`, `Chemistry`, `Mathematics`, `HSS`
   - Year: `2024`, `2023`, `2022`, `2021`, etc.
   - Exam Type: `Quiz-1`, `Midsem`, `Quiz-2`, `Endsem`
2. Sync active selections with Next.js `useSearchParams()` and `useRouter()` so filtered views have unique URLs (e.g. `/papers?department=CSE&year=2024`).
3. Add a "Clear All Filters" button and active filter count badge.

#### ✅ Acceptance Criteria
- [ ] Users can filter papers by multiple criteria simultaneously.
- [ ] Filter state is reflected in the URL and survives page refreshes.
- [ ] Displays empty state when no papers match active filters.

---

### 9. `feat(frontend): Offline reading list & bookmark caching using IndexedDB (Dexie)`

> **Difficulty**: 🟡 Mid-Level | **Component**: Frontend | **Labels**: `frontend`, `enhancement`, `help wanted`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(frontend):%20Offline%20reading%20list%20%26%20bookmark%20caching%20using%20IndexedDB%20(Dexie)&labels=frontend,enhancement,help%20wanted&body=%23%23%20Problem%0AStudents%20reading%20wiki%20articles%20lose%20access%20when%20campus%20network%20connection%20drops.%0A%0A%23%23%20Proposed%20Solution%0AStore%20bookmarked%20articles%20in%20local%20IndexedDB%20using%20Dexie%20and%20provide%20offline%20fallback%20reading.%0A%0A%23%23%20Relevant%20Files%0A-%20%60frontend/src/lib/db.ts%60%0A-%20%60frontend/src/hooks/useBookmarks.ts%60)

#### 📝 Context
Campus Wi-Fi can be intermittent in hostels and commute buses. Since `dexie` is already installed in `frontend/package.json`, we can store bookmarked and recently read wiki articles locally so students can read them offline.

#### 📁 Relevant Files
- `frontend/src/lib/db.ts`
- `frontend/src/hooks/useBookmarks.ts`
- `frontend/src/app/wiki/[slug]/page.tsx`

#### 🛠️ Implementation Steps
1. Configure an `articles` table in `frontend/src/lib/db.ts` storing `slug`, `title`, `content`, `updatedAt`, `cachedAt`.
2. When a user bookmarks an article, cache its content in IndexedDB.
3. In `useQuery` or the article fetching layer, if `navigator.onLine === false` or API fetch throws a network error, retrieve the article from Dexie.
4. Display a banner: *"⚡ You are viewing an offline cached version of this article."*

#### ✅ Acceptance Criteria
- [ ] Bookmarked articles are cached in IndexedDB.
- [ ] Disconnecting internet still allows reading cached articles.
- [ ] Clear UI badge indicates offline status.

---

## 🔴 Hard Issues

### 10. `feat(backend): Upgrade article search to PostgreSQL Full-Text Search with Trigram fuzzy matching`

> **Difficulty**: 🔴 Hard | **Component**: Backend | **Labels**: `backend`, `enhancement`, `help wanted`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(backend):%20Upgrade%20article%20search%20to%20PostgreSQL%20Full-Text%20Search%20with%20Trigram%20fuzzy%20matching&labels=backend,enhancement,help%20wanted&body=%23%23%20Problem%0ASearch%20currently%20relies%20on%20simple%20substring%20matching%20which%20cannot%20rank%20results%20or%20handle%20typos.%0A%0A%23%23%20Proposed%20Solution%0AImplement%20PostgreSQL%20pg_trgm%20and%20to_tsvector/to_tsquery%20full-text%20search%20with%20relevance%20ranking.%0A%0A%23%23%20Relevant%20Files%0A-%20%60backend/prisma/schema.prisma%60%0A-%20%60backend/src/controllers/pages.ts%60)

#### 📝 Context
Currently, search relies on Prisma's `contains: query, mode: "insensitive"`. This performs slow table scans on large datasets and fails completely when users make small typos (e.g. searching *"electornics"* instead of *"electronics"*).

#### 📁 Relevant Files
- `backend/prisma/schema.prisma`
- `backend/src/controllers/pages.ts` (search handler)

#### 🛠️ Implementation Steps
1. Create a database migration enabling `CREATE EXTENSION IF NOT EXISTS pg_trgm;`.
2. Add a GIN index on `live_pages` for `to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))`.
3. Write a raw SQL query with `prisma.$queryRaw` that combines full-text search with trigram similarity:
   ```sql
   SELECT page_id, title, slug, description,
          ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $1)) AS fts_score,
          similarity(title, $1) AS trigram_score
   FROM live_pages
   WHERE (
     to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $1)
     OR similarity(title, $1) > 0.25
   ) AND deleted_at IS NULL
   ORDER BY (fts_score * 2 + trigram_score) DESC
   LIMIT $2 OFFSET $3;
   ```
4. Return paginated search results formatted in standard envelopes.

#### ✅ Acceptance Criteria
- [ ] Search accurately matches queries with minor typos.
- [ ] Title matches are scored higher than content matches.
- [ ] GIN index ensures sub-50ms search response times.

---

### 11. `feat(fullstack): Real-time collaborative draft presence & concurrent edit conflict warning`

> **Difficulty**: 🔴 Hard | **Component**: Fullstack | **Labels**: `frontend`, `backend`, `enhancement`, `help wanted`  
> [**🚀 Open Issue on GitHub**](https://github.com/Metis-IITGandhinagar/meta-iitgn/issues/new?title=feat(fullstack):%20Real-time%20collaborative%20draft%20presence%20%26%20concurrent%20edit%20conflict%20warning&labels=frontend,backend,enhancement,help%20wanted&body=%23%23%20Problem%0ATwo%20users%20editing%20the%20same%20article%20simultaneously%20encounter%20409%20conflict%20errors%20without%20prior%20warning.%0A%0A%23%23%20Proposed%20Solution%0AAdd%20draft%20status%20check%20endpoint%20and%20real-time%20presence%20warning%20in%20the%20editor%20before%20editing.%0A%0A%23%23%20Relevant%20Files%0A-%20%60backend/src/controllers/drafts.ts%60%0A-%20%60frontend/src/app/wiki/[slug]/edit/page.tsx%60)

#### 📝 Context
Meta IITGN uses Optimistic Locking on `pending_pages` (see [Page Merge Strategy](https://github.com/Metis-IITGandhinagar/meta-iitgn/wiki/Updated-Page-Merge-Strategy)). If user A has already submitted a draft for review, and user B opens the editor without knowing, user B's submission will either clash or get rejected with a `409 Conflict`.

#### 📁 Relevant Files
- `backend/src/controllers/drafts.ts`
- `backend/src/routes/drafts.ts`
- `frontend/src/app/wiki/[slug]/edit/page.tsx`
- `frontend/src/components/editor/`

#### 🛠️ Implementation Steps
1. **Backend**:
   - Create `GET /api/v1/drafts/check-lock/:slug`: Returns `{ hasPendingDraft: boolean, editorName: string, submittedAt: string, version: number }`.
2. **Frontend**:
   - When mounting the edit page, query `check-lock`.
   - If an unreviewed pending draft exists, display an alert dialog:
     > *"⚠️ User **[Name]** submitted an edit for this page [Time] ago that is awaiting moderator review. Creating an edit now will branch off their draft."*
   - Give options: `[View Pending Draft]`, `[Proceed Anyway]`, or `[Cancel]`.
3. Provide visual badge in the editor header showing the current base version and locked status.

#### ✅ Acceptance Criteria
- [ ] Editors are proactively warned before editing an article with pending reviews.
- [ ] Drastically minimizes accidental 409 conflict errors.
- [ ] Users can inspect the competing draft before proceeding.
