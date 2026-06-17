import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateSessionDto, SendMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('projects/:projectId/chat/sessions')
  async createSession(
    @Param('projectId') projectId: string,
    @Body() createSessionDto: CreateSessionDto,
    @Req() req: any,
  ) {
    return this.chatService.createSession(projectId, createSessionDto, req.user.id);
  }

  @Get('projects/:projectId/chat/sessions')
  async findSessions(@Param('projectId') projectId: string, @Req() req: any) {
    return this.chatService.findSessions(projectId, req.user.id);
  }

  @Get('chat/sessions/:sessionId/messages')
  async getMessages(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.chatService.getMessages(sessionId, req.user.id);
  }

  @Post('chat/sessions/:sessionId/message')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
    @Req() req: any,
  ) {
    return this.chatService.sendMessage(sessionId, sendMessageDto, req.user.id);
  }
}
