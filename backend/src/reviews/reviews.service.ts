import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { TriggerReviewDto } from './dto/trigger-review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async triggerReview(projectId: string, triggerDto: TriggerReviewDto, userId: string) {
    const { template, filePaths, providerId } = triggerDto;

    // Fetch the project details to confirm ownership
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found.`);
    }

    if (project.userId !== userId) {
      throw new BadRequestException('You do not have permission to review this project.');
    }

    // Get files to review
    let files;
    if (filePaths && filePaths.length > 0) {
      files = await this.prisma.file.findMany({
        where: {
          projectId,
          path: { in: filePaths },
        },
      });
    } else {
      files = await this.prisma.file.findMany({
        where: { projectId },
      });
    }

    if (!files || files.length === 0) {
      throw new BadRequestException(
        'No source code files found to review. Please upload files to this project first.',
      );
    }

    // Check token limits roughly by checking characters size
    let contextSize = 0;
    const filesContext = files
      .map(f => {
        const fileContent = `\nFile: ${f.path}\n---\n${f.content}\n---\n`;
        contextSize += fileContent.length;
        return fileContent;
      })
      .join('\n');

    // Protect against massive prompt contexts
    if (contextSize > 350000) {
      throw new BadRequestException(
        `Codebase is too large for a single AI request (${contextSize} characters). Please select specific files to review.`,
      );
    }

    // Define prompts based on templates
    const systemPrompt = this.getSystemPromptForTemplate(template);
    const userPrompt = `
You are reviewing the project: "${project.name}" (Description: ${project.description || 'N/A'})
We have provided ${files.length} code files below for review.

Here is the source code files:
${filesContext}

Run the "${template}" review now. Remember, you MUST respond with a valid, parseable JSON object matching the requested schema. No other text.
`;

    // Make the LLM Call
    let rawResult = '';
    try {
      rawResult = await this.aiService.callLLM(userId, providerId, systemPrompt, userPrompt, true);
    } catch (error: any) {
      throw new BadRequestException(`LLM API request failed: ${error.message}`);
    }

    // Parse LLM JSON Output
    const parsedData = this.parseJsonFromLLM(rawResult);

    // Save the review record to the database
    const targetFilePaths = files.map(f => f.path);
    const review = await this.prisma.review.create({
      data: {
        projectId,
        template,
        summary: parsedData.summary,
        issues: parsedData.issues,
        targetFiles: targetFilePaths,
      },
    });

    return review;
  }

  async findAll(projectId: string, search: string | undefined, userId: string) {
    // Confirm project ownership
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundException(`Project with ID "${projectId}" not found or unauthorized.`);
    }

    const whereClause: any = { projectId };

    if (search) {
      whereClause.OR = [
        { summary: { contains: search, mode: 'insensitive' } },
        { template: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.review.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        project: {
          select: { userId: true, name: true },
        },
      },
    });

    if (!review) {
      throw new NotFoundException(`Review with ID "${id}" not found.`);
    }

    if (review.project.userId !== userId) {
      throw new BadRequestException('You do not have permission to view this review.');
    }

    return review;
  }

  async getGlobalHistory(search: string | undefined, userId: string) {
    const whereClause: any = {
      project: {
        userId,
      },
    };

    if (search) {
      whereClause.OR = [
        { summary: { contains: search, mode: 'insensitive' } },
        { template: { contains: search, mode: 'insensitive' } },
        {
          project: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    return this.prisma.review.findMany({
      where: whereClause,
      include: {
        project: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private parseJsonFromLLM(rawText: string) {
    let cleanText = rawText.trim();
    
    // Strip markdown JSON codeblock formatting if present
    if (cleanText.startsWith('```')) {
      // Find the first line break to remove ```json or ```
      const firstLineBreak = cleanText.indexOf('\n');
      if (firstLineBreak !== -1) {
        cleanText = cleanText.substring(firstLineBreak + 1);
      }
      // Remove trailing ```
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3).trim();
      }
    }

    try {
      const parsed = JSON.parse(cleanText);
      
      // Basic validation
      if (!parsed.summary) {
        parsed.summary = 'Code review completed successfully. No summary provided.';
      }
      if (!Array.isArray(parsed.issues)) {
        parsed.issues = [];
      }

      // Ensure every issue is structured correctly
      parsed.issues = parsed.issues.map((issue: any) => ({
        filePath: issue.filePath || 'General',
        lineNumber: typeof issue.lineNumber === 'number' ? issue.lineNumber : 0,
        title: issue.title || 'Review Finding',
        description: issue.description || 'No description provided.',
        recommendation: issue.recommendation || 'No recommendation provided.',
        severity: ['Critical', 'High', 'Medium', 'Low'].includes(issue.severity) 
          ? issue.severity 
          : 'Low',
      }));

      return parsed;
    } catch (err) {
      this.logger.error(`Failed to parse JSON response from LLM. Raw text: \n${rawText}`);
      
      // Return a structured error output so backend/frontend doesn't crash
      return {
        summary: 'Failed to parse review details from the AI model response. The AI did not return valid JSON.',
        issues: [
          {
            filePath: 'System',
            lineNumber: 0,
            title: 'AI Formatting Error',
            description: 'The configured AI Provider returned a response that could not be parsed as structured JSON. Please ensure the model supports structured outputs or prompt adherence.',
            recommendation: 'Try using a larger model, or run the review again.',
            severity: 'High',
          },
        ],
      };
    }
  }

  private getSystemPromptForTemplate(template: string): string {
    const baseDirectives = `
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
`;

    switch (template) {
      case 'security':
        return `
${baseDirectives}
You are conducting a SECURITY REVIEW.
Focus heavily on:
1. Hardcoded API keys, secrets, passwords, or credentials.
2. Input validation vulnerabilities (SQL injection, XSS, Command Injection, Path Traversal).
3. Broken authentication or session management flaws.
4. Cryptographic weaknesses (weak hashing, hardcoded salts).
5. Excessive exposures (CORS misconfigurations, security header omissions).
6. Dependency security issues.

Severity Definitions:
- Critical: Remote code execution, database compromise, cleartext hardcoded credentials.
- High: SQL injection path, missing authentication gates on sensitive paths.
- Medium: Weak password policy, sub-optimal crypto algorithms, lack of validation but no immediate exploit.
- Low: Unnecessary verbose error logs disclosing server headers, minor configuration suggestions.
`;

      case 'performance':
        return `
${baseDirectives}
You are conducting a PERFORMANCE REVIEW.
Focus heavily on:
1. Slow algorithms and time-complexity issues (e.g. O(N^2) operations inside loops).
2. Database performance smells (e.g. executing queries inside loops - N+1 query problem, missing indexes).
3. Memory leaks, unclosed streams/file handles/connections.
4. Redundant calculations, caching opportunities, heavy component render triggers.
5. Blocking operations on key execution paths.
6. Inefficient API network calls.

Severity Definitions:
- Critical: Infinite loops, server memory leaks that will crash the process, database deadlocks.
- High: Inefficient database calls in high-frequency endpoints, massive blocking synchronous code.
- Medium: Missing indexes suggestion, duplicate API calls, caching recommendations.
- Low: Minor micro-optimizations (using const, lighter library suggestions).
`;

      case 'quality':
        return `
${baseDirectives}
You are conducting a CODE QUALITY AND CLEAN CODE REVIEW.
Focus heavily on:
1. Naming conventions (vague variable names, misleading function names).
2. Code structure (large classes, long functions, deep indentation nesting).
3. Readability and maintainability (lack of code separation, tight coupling).
4. DRY (Don't Repeat Yourself) violations and duplicate code.
5. Error handling (silently swallowed exceptions, lack of catch logging).
6. Missing types, bad type annotations, or "any" abuses in TypeScript.

Severity Definitions:
- Critical: Code structures that are highly likely to cause runtime errors or crash under simple edge cases.
- High: Badly structured components making fixes highly error-prone, completely missing error bounds.
- Medium: DRY violations, duplicate logic, magic strings/numbers, long functions exceeding 100 lines.
- Low: Minor naming suggestions, lint suggestions, redundant comments.
`;

      case 'tech_debt':
        return `
${baseDirectives}
You are conducting a TECHNICAL DEBT SCAN.
Analyze the codebase for design smells, architectural compromises, and general technical debt.
Focus heavily on:
1. Code smells (God objects, Feature Envy, Long parameter lists).
2. Lack of unit testing indicators or hard-to-test code designs.
3. Legacy library versions or deprecated API usage.
4. Workarounds, hacky comments (e.g. // TODO, // FIXME, // HACK).
5. Incomplete error handling or stub classes.

Categorize every issue severity:
- High: Major debt that requires immediate refactoring (affects safety or core extensibility).
- Medium: Standard code smells, logic duplication, hacky workarounds in core business routes.
- Low: Minor style mismatches, pending TODO comments of low priority.
`;

      case 'architecture':
        return `
${baseDirectives}
You are conducting a PROJECT ARCHITECTURE ANALYSIS.
Analyze the codebase structure, directory hierarchy, component boundaries, and overall design patterns.
Focus heavily on:
1. Component isolation and circular dependencies.
2. Design patterns compliance (e.g., MVC, Layered, Clean Architecture, Serverless).
3. Boundary violations (e.g., direct database calls in frontend code, logic leakage).
4. Extensibility of the codebase.

Map architectural findings to the structured list. Since these are general, use "Architecture" or folder names (like "src/controllers/") as the 'filePath' and specify 'lineNumber': 0.
Severity Definitions:
- High: Broken dependency flows, circular package loops, structural violations of layers.
- Medium: Sub-optimal component split, mixing business rules with framework code.
- Low: Minor folder naming suggestions, packaging recommendations.
`;

      default:
        return baseDirectives;
    }
  }
}
