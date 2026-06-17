# AI Code Review Assistant

A clean, full-stack application for uploading source code archives, browsing file trees, running custom review scans (security, performance, quality), and chatting with your codebase. 

Designed to support hosted APIs (OpenAI, OpenRouter) and local models (LM Studio, Ollama) without hardcoded configurations.

---

## What's inside

- **Authentication**: JWT-based user register/login/logout with client-side guards and secure backend middleware.
- **Dynamic AI Configurations**: Add, test, and switch between multiple LLM endpoints via the settings dashboard.
- **Code Explorer**: In-memory ZIP extractor (`adm-zip`), binary file filtering, and a nested folder tree browser with PrismJS syntax highlighting.
- **Review Templates**: Configured audits targeting Security, Performance, and Clean Code Quality.
- **Interactive Chat**: Project-scoped RAG assistant with token budget truncation to prevent context window blowout.
- **Bonus Analytics**: Included modules for high-level Technical Debt scans and Project Architecture breakdown.
- **Review History**: Filterable list of previous reviews with slide-out details panels.

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: NestJS, Prisma ORM
- **Database**: PostgreSQL (Prisma adapter configured for SQLite fallback)

---

## Architecture Overview

```mermaid
graph TD
    User([User Browser]) <--> |HTTP / JSON| NextJS[Next.js Frontend Client]
    
    subgraph Frontend [Next.js App]
        NextJS --> AuthC[Auth Context]
        NextJS --> Workspace[3-Pane Workspace]
        Workspace --> FileTree[Recursive Tree Explorer]
        Workspace --> CodeView[Syntax Highlighting Viewer]
        Workspace --> ControlDesk[AI Control Panel]
    end
    
    NextJS <--> |REST API & JWT| NestJS[NestJS Backend API]
    
    subgraph Backend [NestJS Server]
        NestJS --> AuthM[Auth Module]
        NestJS --> ProjectsM[Projects CRUD Module]
        NestJS --> FilesM[In-Memory ZIP Parser]
        NestJS --> ReviewsM[Audit Prompts Generator]
        NestJS --> AIM[Dynamic LLM Client]
    end
    
    AuthM & ProjectsM & FilesM & ReviewsM & AIM <--> |Prisma ORM| DB[(PostgreSQL / SQLite)]
    
    AIM <--> |OpenAI-Compatible REST| ExternalLLM[AI Provider API <br/> Groq / LM Studio / Ollama]
```

---

## Setup & Running Locally

### 1. Database Setup

We provide a Docker Compose file for a local Postgres instance:

```bash
# Start the Postgres container
docker compose up -d

# Initialize database schema and generate Prisma client
cd backend
npx prisma db push
npx prisma generate
```

*Note on SQLite fallback:* If you don't want to run Docker/Postgres, change the provider in `backend/prisma/schema.prisma` to `"sqlite"` and `DATABASE_URL` in `backend/.env` to `"file:./dev.db"`, then run `npx prisma db push`.

### 2. Configure Environments

**Backend (`backend/.env`):**
```env
PORT=3001
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ai_code_reviewer?schema=public"
JWT_SECRET="temp_secret_key_for_dev"
JWT_EXPIRES_IN="7d"
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Launch Services

**Run the Backend API:**
```bash
cd backend
npm run start:dev
```
Runs at `http://localhost:3001`.

**Run the Frontend Client:**
```bash
cd frontend
npm run dev
```
Runs at `http://localhost:3000`.

---

## Verifications
Both projects contain clean TypeScript declarations and pass strict production compilations:
- Backend check: `npm run build` from `backend/`
- Frontend check: `npm run build` from `frontend/`
