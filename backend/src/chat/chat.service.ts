import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async createSession(projectId: string, createSessionDto: CreateSessionDto, userId: string) {
    // Verify project exists and user owns it
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundException(`Project with ID "${projectId}" not found or unauthorized.`);
    }

    return this.prisma.chatSession.create({
      data: {
        title: createSessionDto.title,
        projectId,
        userId,
      },
    });
  }

  async findSessions(projectId: string, userId: string) {
    // Verify project ownership
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundException(`Project with ID "${projectId}" not found or unauthorized.`);
    }

    return this.prisma.chatSession.findMany({
      where: { projectId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async getMessages(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException(`Chat session with ID "${sessionId}" not found or unauthorized.`);
    }

    return this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(sessionId: string, sendMessageDto: SendMessageDto, userId: string) {
    const { content, providerId } = sendMessageDto;

    // Fetch session details
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        project: {
          select: { name: true, description: true },
        },
      },
    });

    if (!session || session.userId !== userId) {
      throw new NotFoundException(`Chat session with ID "${sessionId}" not found or unauthorized.`);
    }

    // Save user message first
    const userMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'user',
        content,
      },
    });

    // Update session updatedAt timestamp
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    // Retrieve codebase files to serve as context
    const files = await this.prisma.file.findMany({
      where: { projectId: session.projectId },
    });

    // Build context with token budget tracking (max ~250k chars to fit context window comfortably)
    let context = '';
    let tokensExceeded = false;
    const MAX_CONTEXT_CHARS = 250000;

    for (const file of files) {
      const fileString = `\nFile Path: ${file.path}\nContent:\n${file.content}\n---\n`;
      if (context.length + fileString.length > MAX_CONTEXT_CHARS) {
        tokensExceeded = true;
        break;
      }
      context += fileString;
    }

    if (tokensExceeded) {
      context += '\n[NOTE: Some large files in the codebase were omitted due to context size limits.]\n';
    }

    // Load recent message history for conversation continuity (last 10 messages)
    const history = await this.prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    
    // Reverse to chronological order
    history.reverse();

    const formattedHistory = history
      .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    // Build Chat Prompts
    const systemPrompt = `
You are an expert AI Software Engineer Assistant.
You are helping the user analyze, debug, and understand their project codebase: "${session.project.name}".
You are given the source code of the project files below.

Use the provided source code files as your primary context when answering questions.
Explain the concepts clearly, show file names and lines when relevant, and provide code blocks when requested.
If the information is not present in the files or you cannot answer, explain that but try to give general guidance.
`;

    const userPrompt = `
Here is the codebase files for context:
=========================================
${context || 'No files uploaded yet.'}
=========================================

Conversation History:
${formattedHistory}

New User Question: "${content}"
Assistant:`;

    // Trigger dynamic LLM call
    let responseText = '';
    try {
      responseText = await this.aiService.callLLM(userId, providerId, systemPrompt, userPrompt, false);
    } catch (error: any) {
      responseText = `Failed to get a response from the AI provider. Error details: ${error.message}`;
    }

    // Save assistant message to database
    const assistantMessage = await this.prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'assistant',
        content: responseText,
      },
    });

    return assistantMessage;
  }
}
