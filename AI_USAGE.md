# AI Usage Report - AI-Powered Code Review Assistant

This document outlines the usage of AI systems, prompts, code generation distributions, and key engineering decisions made during the development of this repository.

---

## 1. AI Tools Used

- **Antigravity IDE Agent**: Served as the primary autonomous pair programmer. Scaffolded files, configured TypeScript classes, updated directory structures, and verified compilation loops.
- **NestJS CLI**: Used via `npx` to bootstrap modular folder structure templates in `backend/` using TypeScript strict options.
- **Next.js CLI (create-next-app)**: Used via `npx` to bootstrap frontend templates with Tailwind CSS and App Router.

---

## 2. Prompts Used for System Design & Code Review

To establish structured and reliable review scan outputs, the following system prompts were engineered and embedded in `backend/src/reviews/reviews.service.ts`:

### System Prompts for Reviews (Security/Performance/Quality)
```text
You are a highly experienced Principle Software Engineer and Security Auditor.
Your task is to analyze the provided code files and perform a professional, structured review.

You MUST respond ONLY with a valid, parseable JSON object matching this schema:
{
  "summary": "High-level overview of code quality, total issues, and general rating.",
  "issues": [
    {
      "filePath": "relative/path/to/file.ts",
      "lineNumber": 14,
      "title": "Title of the finding",
      "description": "Clear explanation of what the issue is, why it is a problem, and the risks.",
      "recommendation": "Code snippet or explicit steps showing how to fix the issue.",
      "severity": "Critical" | "High" | "Medium" | "Low"
    }
  ]
}

Ensure the JSON is strictly structured. Keep the descriptions and recommendations brief and actionable.
```

### Prompt for RAG Code Chat Context Assembly
```text
You are an expert AI Software Engineer Assistant.
You are helping the user analyze, debug, and understand their project codebase: "{projectName}".
You are given the source code of the project files below.

Use the provided source code files as your primary context when answering questions.
Explain the concepts clearly, show file names and lines when relevant, and provide code blocks when requested.
If the information is not present in the files or you cannot answer, explain that but try to give general guidance.
```

---

## 3. Code Generation Distribution

### AI Generated Code
- **NestJS Controllers & Services**: Fully generated basic module files for Auth, Projects, Files, AI, Reviews, and Chat. 
- **Next.js Router Pages**: Scaffolded base templates for Login, Register, Dashboard, Settings, Reviews, and Workspace.
- **Prisma Schema Mappings**: Drafted relations, index keys, and cascades.

### Manually Adjusted & Refined Code
- **Dynamic Axios Connection Tester**: Overrode standard Axios configurations to support connection checks against endpoints without API keys (Ollama, local LM Studio) without throwing header exceptions.
- **ZIP Sanitizer & Text Decoder**: Wrote custom buffer parsing to detect and filter out binary code packages using file extensions and null-byte header checking.
- **Tailwind v4 theme variables**: Re-ordered CSS imports in `globals.css` to prevent Next.js from throwing build-time styling precedence errors.
- **Prisma client downgrade**: Downgraded database dependencies to v6, bypassing version 7's complex database driver adapter requirements, making the project easily testable on local Postgres.
- **JSON parse fault-tolerances**: Designed regex stripping helpers in the review service to extract clean JSON payloads if the AI wrapped outputs inside markdown brackets.
- **Nested Folder Tree Parser**: Wrote recursive sorting arrays to convert flat file lists from databases into deep nested folder structures with sorted directories.

---

## 4. Key Engineering Decisions & Compromises

1. **In-Memory File Database Storage vs Local Disk Storage**: Storing uploaded repository code inside database fields instead of writing to a backend disk path was a crucial design compromise. Disk storage is fragile in cloud-native or containerized environments due to ephemerality. Storing files as database columns ensures persistence, horizontal scalability, and instant indexing for RAG checks.
2. **Context Window Safeguards**: Added maximum size filters (~250,000 characters) on code review inputs. This handles token limitation constraints gracefully by stopping folder assembly before the LLM fails with a 400 Bad Request error.
3. **Graceful Connection Failures**: Wrapped database connection initializers in global try-catch blocks. If a PostgreSQL container is not running, the backend logs a warning but boots up, allowing users to test connection settings on the dashboard without crashing the server.
