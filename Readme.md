# MetaIITGN

## 📁 Project Structure
This repository contains both the frontend UI and the backend API.
* `backend/`: Python (FastAPI) code and tools.
* `frontend/`: Node.js UI and tools.

## 🚀 Local Development Setup

### 1. Backend Setup
Open a terminal and run the following commands:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
pip install -r requirements.txt

```


### 2. Frontend setup

Open a *second* terminal and run:

```bash
cd frontend
npm install

```

## 🤝 How to Contribute

1. Clone the repo.
2. Create a new branch for your feature or update 
3. Make your changes and commit them.
4. Push your branch and open a Pull Request (PR) on GitHub.
5. Wait for review and merge.

### Branch Naming Conventions

To keep our repository organized, please use a **prefix** followed by a **short description**, separated by a forward slash (`/`).

**1. Core Prefixes**

* **`feature/`**: For adding new features or capabilities (e.g., `feature/user-login-page`).
* **`fix/` or `bugfix/`**: For fixing a bug in the code (e.g., `fix/cors-error-on-frontend`).
* **`hotfix/`**: For critical, urgent fixes meant for production (e.g., `hotfix/db-connection-crash`).
* **`chore/`**: For routine maintenance, dependency updates, or config changes (e.g., `chore/update-fastapi`).
* **`docs/`**: For writing or updating documentation (e.g., `docs/readme-setup`).

**2. Formatting Rules**

* **Lowercase only:** Prevents case-sensitivity issues.
* **Kebab-case:** Use hyphens (`-`) to separate words. Do not use spaces, underscores, or camelCase.
* **Be concise:** `feature/google-oauth-login` is better than `feature/login` (too vague) or `feature/add-google-oauth-login-button-to-header` (too long).

**3. Issue Ticket Numbers (Optional)**
If you are working on a specific tracked issue, include the ticket number in the branch name.

* *Format:* `prefix/TICKET-NUMBER-description`
* *Example:* `feature/ISSUE-42-google-oauth-login`


