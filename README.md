# AI-Powered Code Review Assistant

A modern, production-oriented full-stack web application that allows developers to upload codebase archives (ZIP), explore the code folder hierarchy in an editor preview, request detailed code audits (using templates for security, performance, and general code quality), chat in real-time with their codebase using a simple context retrieval RAG system, and scan for design smells and high-level project architecture.

The system natively supports configurable AI provider profiles so developers can connect to hosted services (OpenAI, OpenRouter) or local endpoints (LM Studio, Ollama) on the fly without hardcoding credentials.

---

## Features

- **User Authentication**: Secure registration, login, and token-scoped routes using JSON Web Tokens (JWT) and bcrypt password hashing.
- **AI Settings Configuration**: Create, list, edit, and delete AI Provider profiles. Real-time connection testing button directly verifies credentials and model names before saving.
- **Project Workspaces**: Create, read, and delete code workspaces.
- **ZIP Extract & File Tree Explorer**: In-memory ZIP file upload parsing (`adm-zip`), filtering of binaries, and dynamic conversion of flat file paths into a nested interactive directory explorer tree.
- **Code Viewer & Highlighting**: View source file contents directly in the workspace, complete with line numbers and language-aware syntax highlighting (`PrismJS`).
- **Structured Review Engine**: Trigger Security audits, Performance scans, and Code Quality reviews. Leverages OpenAI's JSON mode or formatted system prompts to return parseable, structured audit results categorizing issues into Critical, High, Medium, and Low severity.
- **RAG Code Chat**: Chat sessions scoped to specific projects, allowing developers to query their source files. Assembles context dynamically, utilizing token budget checks to prevent context window blowout.
- **Bonus Feature - Technical Debt Scanner**: Audit codebase design smells, grouping debt priority items into High, Medium, and Low levels.
- **Bonus Feature - Architecture Analysis**: Generates high-level project boundary summaries, design pattern maps, and modular recommendations.
- **History Logs**: Global audit review logs with query searches, filters, and slide-out details panels.

---

## Project Structure

```
ai-code-review-assistant/
├── backend/                  # NestJS TypeScript API service
│   ├── prisma/               # Prisma schema and migrations
│   ├── src/                  # NestJS Modules, Services, Controllers
│   ├── tsconfig.json
│   └── package.json
├── frontend/                 # Next.js App Router UI
│   ├── src/                  # App components, pages, contexts
│   ├── tsconfig.json
│   └── package.json
└── docker-compose.yml        # PostgreSQL container services
```

---

## Architecture Overview

The system is designed with a decoupled Client-Server architecture:
*   **Frontend (Next.js)**: Runs an interactive 3-pane dashboard workspace containing dynamic file explorer navigation, syntax highlighting text readers, and configurable AI settings controls.
*   **Backend (NestJS)**: Serves endpoints for user authentication, file uploads, in-memory archive extraction, dynamic provider routers, structured prompt engineering, and codebase context retrieval (RAG).
*   **Database (Prisma & PostgreSQL/SQLite)**: Stores schema configurations for projects, repository files content, user credentials, chat message logs, and code review histories.

For a deeper dive, check [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file inside the `backend/` directory:
```env
PORT=3001
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ai_code_reviewer?schema=public"
JWT_SECRET="ai_code_reviewer_secret_key_12345"
JWT_EXPIRES_IN="7d"
```

### Frontend (`frontend/.env.local`)
Create a `.env.local` file inside the `frontend/` directory (Optional; defaults to port 3001):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Database Setup

We provide a Docker Compose configuration to start a PostgreSQL database container:

1. Make sure you have Docker running.
2. In the root of the workspace, spin up the container in the background:
   ```bash
   docker compose up -d
   ```
3. Initialize the database schema and compile the Prisma client:
   ```bash
   cd backend
   npx prisma db push
   npx prisma generate
   ```

*(Local fallback option)*: If you do not have PostgreSQL running, you can easily change the database source to SQLite for local development:
1. Edit `backend/prisma/schema.prisma` and change the `provider` in `datasource db` to `"sqlite"`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```
2. Edit `backend/.env` and adjust the connection URL:
   ```env
   DATABASE_URL="file:./dev.db"
   ```
3. Re-run `npx prisma db push`.

---

## Running the Application

### 1. Launch the Backend
```bash
cd backend
npm run start:dev
```
The NestJS backend will listen on: `http://localhost:3001`

### 2. Launch the Frontend
```bash
cd frontend
npm run dev
```
The Next.js client UI will start on: `http://localhost:3000`

---

## Testing & Verification

We have verified that both applications compile and type-check:
- **Backend Build Validation**: `npm run build` inside `backend/` compiles NestJS files with TypeScript strict options.
- **Frontend Build Validation**: `npm run build` inside `frontend/` builds static routes and verifies all TypeScript imports, components, and contexts.
