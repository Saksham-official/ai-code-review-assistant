# AI Usage & Engineering Report

An overview of how AI tools were integrated during the development of this repository, our prompt engineering strategies, and where code was custom-written or overridden to maintain quality.

---

## 1. Tools Log

- **Antigravity IDE Agent / Copilot**: Used as an active pair programmer to scaffold boilerplate file setups, generate type interfaces, and verify TypeScript compilation loops.
- **NestJS CLI**: Bootstrapped the core modules, controllers, and services layouts.
- **Next.js CLI**: Bootstrapped the initial frontend skeleton with Tailwind configuration.

---

## 2. Prompts Implemented

To enforce strict, parseable outputs from the LLMs, we embedded specific instructions into the backend services:

### System Instructions for Code Review Scans (`backend/src/reviews/reviews.service.ts`)
```text
You are a highly experienced Principal Software Engineer and Security Auditor.
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

---

## 3. Code Division (AI vs. Manual)

### Boilerplate Scaffolded by AI
- **API Routes**: Standard REST routes for project creation, loading, and deletion in NestJS.
- **Prisma Schemas**: Basic entity structures mapping relation keys (Users, Projects, Files, Reviews).
- **UI Shells**: Initial layout views for register, login, settings, and the project dashboards.

### Custom-Written & Refined Logic (Manually Overridden)
To achieve production quality, several AI implementations were custom-rewritten or adjusted:
- **In-Memory ZIP Sanitation**: Wrote custom buffer parsing to scan ZIP directories, normalize paths, and filter out binary packages (by scanning extensions and checking for raw null bytes `0x00` in the text stream).
- **Nested File Tree Generator**: Coded the recursive path parser to convert flat database file structures (e.g. `a/b/c.js`) into sorted nested folder structures (directories first, then files alphabetically).
- **Adaptive LLM Client**: Adjusted standard Axios header configs to bypass key validation checks, allowing local endpoints (Ollama/LM Studio) to connect without auth key failures.
- **Robust JSON Extraction**: Programmed fallback parser patterns to clean and strip surrounding markdown code blocks (e.g., ````json ... ````) if local models appended conversational text to the JSON object.
- **Next.js Hydration Mismatch Fix**: Added `suppressHydrationWarning` to the root HTML layout, ensuring external browser translation scripts or IDE tools wouldn't crash the React hydration cycle.

---

## 4. Key Architectural Decisions

1. **In-Memory File Extraction**: We decided to extract files directly into memory buffers and save them as database strings rather than writing them to the backend server's local disk. This keeps backend nodes entirely stateless and allows the app to scale horizontally in Docker/Kubernetes container systems.
2. **Context Window Safeguards**: Enforced character budget limits (approx. 250k-350k chars) to proactively block massive repositories from overloading context windows, providing friendly client warnings instead of letting the gateway return a 400 Bad Request error.
3. **Resilient DB Failures**: Added try-catch gates around connection checks. If the Postgres container is offline during local startup, the backend server stays online instead of crashing, allowing developers to configure SQLite fallbacks or test settings.
