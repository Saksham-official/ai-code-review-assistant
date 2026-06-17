Full Stack Engineering Internship
Assessment
Project Title
AI-Powered Code Review Assistant
Duration
3 Days
Objective
Build a production-oriented AI Code Review Assistant that enables developers to upload
source code, repositories, or project files and receive structured AI-generated code
reviews.
The system should support both cloud-hosted and local AI models through OpenAIcompatible APIs.
The goal is not to build a perfect code reviewer. The goal is to demonstrate your ability
to design, implement, and ship a practical full-stack application involving modern
frontend development, backend architecture, databases, file processing, and AI
integration.
Technology Requirements
Frontend
Required:
● Next.js
● TypeScript
● Tailwind CSS
Backend
Choose one:
● NestJS (Preferred)
● FastAPI
Database
Choose one:
● PostgreSQL (Preferred)
● MongoDB
AI Provider Support
The application must support configurable AI providers.
Required:
● OpenAI API
● LM Studio
● Any OpenAI-Compatible Endpoint
Bonus:
● Ollama
● OpenRouter
The provider configuration must not be hardcoded.
Users should be able to configure:
● Base URL
● API Key
● Model Name
Examples:
OpenAI
https://api.openai.com/v1
LM Studio
http://localhost:1234/v1
Ollama
http://localhost:11434/v1
Core Features
1. Authentication
Required:
● Registration
● Login
● Logout
Protected routes should be implemented.
2. Project Management
Users can create projects.
Example:
● Portfolio Website
● CRM Backend
● Internal Dashboard
Project Fields:
● Name
● Description
● Creation Date
Users can:
● Create project
● View projects
● Delete project
3. Code Upload
Required:
Support at least one:
Option A
ZIP Upload
Option B
Drag and Drop Files
Option C
GitHub Repository URL
Uploaded files should be stored and associated with a project.
4. Code Explorer
Display uploaded files in a tree structure.
Features:
● Folder hierarchy
● File preview
● Syntax highlighting
5. AI Review Engine
Users can review:
● Single file
● Multiple files
● Entire project
The review output should contain:
Summary
High-level overview of findings.
Issues
Detected problems.
Recommendations
Suggested improvements.
Severity
● Critical
● High
● Medium
● Low
6. Review Templates
Implement at least three review modes.
Examples:
Security Review
Focus on:
● Hardcoded credentials
● Authentication issues
● Input validation
● Injection risks
Performance Review
Focus on:
● Slow operations
● Inefficient rendering
● Unnecessary database queries
Code Quality Review
Focus on:
● Naming
● Structure
● Readability
● Maintainability
7. Review History
Store previous reviews.
Users should be able to:
● View reviews
● Search reviews
● Open review details
8. AI Chat With Code
Users can ask questions about uploaded code.
Example:
"Explain how authentication works."
"Which file handles database connections?"
The assistant should use uploaded code as context.
Simple context retrieval is acceptable.
Bonus Features
Choose any two.
Diff Review
Compare two files and review changes.
Documentation Generator
Generate:
● README
● Setup Guide
● API Documentation
Test Generator
Generate:
● Unit Tests
● Integration Tests
Technical Debt Scanner
Categorize issues:
● High Priority
● Medium Priority
● Low Priority
Architecture Analysis
Generate a project architecture summary.
Database Design
Suggested Tables
Users
Projects
Files
Reviews
AI Providers
Chat Sessions
Messages
You may modify the schema if justified.
Submission Requirements
Repository Structure
frontend/
backend/
README.md
ARCHITECTURE.md
AI_USAGE.md
Required Documentation
README.md
Include:
● Setup Instructions
● Features
● Environment Variables
● Database Setup
● Architecture Overview
ARCHITECTURE.md
Explain:
● Frontend Architecture
● Backend Architecture
● Database Design
● AI Integration Flow
AI_USAGE.md
Mandatory
Document:
● AI Tools Used
● Prompts Used
● Generated Code
● Manually Written Code
● Engineering Decisions
Evaluation Criteria
Functionality - 25%
Code Quality - 20%
Architecture - 15%
AI Integration - 15%
Database Design - 10%
Documentation - 5%
UI/UX - 5%
Git Practices - 5%
What We Are Looking For
We are not evaluating who writes the most code.
We are evaluating:
● Engineering judgment
● Architecture decisions
● Code organization
● Problem-solving ability
● Ability to use AI effectively
● Ability to build maintainable software
A smaller, well-structured solution is preferred over a large but poorly organized one.
AI Usage Policy
AI tools are allowed and encouraged.
Examples:
● ChatGPT
● Claude
● Gemini
● GitHub Copilot
● Cursor
● Windsurf
● LM Studio
However:
● Blindly generated code is discouraged.
● You should understand every line you submit.
● Be prepared to explain implementation decisions during interviews.
The AI usage report is mandatory.
Failure to disclose AI usage may negatively impact evaluation.
Important Notes
1. Security matters. Never commit secrets or API keys.
2. Code quality matters more than feature count.
3. Deployment is optional but encouraged.
4. Mobile responsiveness is appreciated.
5. Production-ready thinking is valued.
6. Candidates may use any AI model they prefer.
7. Additional features are welcome if clearly documented.
8. We value maintainability over complexity.
Good luck.