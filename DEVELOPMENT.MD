# Development Guide

This document explains how to run the Meta IITGN Wiki project using Docker.

---

# Prerequisites

Install the following:

- Git
- Docker
- Docker Compose

Verify installation:

```bash
git --version
docker --version
docker compose version
```

---

# Clone Repository

```bash
git clone https://github.com/Metis-IITGandhinagar/meta-iitgn.git
cd meta-iitgn
```

---

# Environment Variables

Create a `.env` file in the project root.

Example:

```env
# Database
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=wiki

# Backend
JWT_SECRET=your_secret

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXT_PUBLIC_GOOGLE_CLIENT_ID=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GITHUB_TOKEN=


---

# Running the Project

Build everything:

```bash
docker compose build
```

Start all services:

```bash
docker compose up -d
```

---

# Services

After running Docker Compose:

| Service | Container | Port |
|----------|-----------|------|
| Frontend | meta-iitgn-frontend | http://localhost:3603 |
| Backend | meta-iitgn-backend | http://localhost:3636 |
| PostgreSQL | meta-iitgn-db | Internal (5432) |

---

# Stopping

```bash
docker compose down
```

---

# Logs

All services:

```bash
docker compose logs -f
```

Backend:

```bash
docker compose logs -f backend
```

Frontend:

```bash
docker compose logs -f frontend
```

Database:

```bash
docker compose logs -f db
```

---

# Access PostgreSQL

Open a PostgreSQL shell:

```bash
docker compose exec db psql -U postgres -d wiki
```

---

# Rebuilding

If Dockerfiles or dependencies change:

```bash
docker compose up -d --build
```

Force rebuild without cache:

```bash
docker compose build --no-cache
docker compose up -d
```

---

# Updating the Project

Pull the latest changes:

```bash
git pull origin main
```

Rebuild and restart:

```bash
docker compose up -d --build
```

---

# Deployment

The production server uses GitHub Actions.

On every push to `main`:

1. GitHub Actions connects to the VPS.
2. Pulls the latest code.
3. Rebuilds Docker images.
4. Restarts all containers.

Required GitHub Secrets:

```
SSH_HOST
SSH_USER
SSH_KEY
```

---

# Persistent Data

Docker volumes are used to persist data.

| Volume | Purpose |
|----------|---------|
| postgres_data | PostgreSQL database |
| backend_uploads | Uploaded files |

These volumes remain intact even if containers are recreated.

---

# Internal Networking

Containers communicate over the `app-network` bridge network.

Internal hostnames:

```
backend
db
frontend
```

For example, the backend connects to PostgreSQL using:

```
postgresql://postgres:<password>@db:5432/wiki?schema=public
```

The frontend communicates with the backend internally using:

```
http://backend:3001
```

---