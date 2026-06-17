import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateProviderDto, UpdateProviderDto, TestProviderDto } from './dto/provider.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('providers')
  async create(@Body() createProviderDto: CreateProviderDto, @Req() req: any) {
    return this.aiService.create(createProviderDto, req.user.id);
  }

  @Get('providers')
  async findAll(@Req() req: any) {
    return this.aiService.findAll(req.user.id);
  }

  @Get('providers/:id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.aiService.findOne(id, req.user.id);
  }

  @Put('providers/:id')
  async update(@Param('id') id: string, @Body() updateProviderDto: UpdateProviderDto, @Req() req: any) {
    return this.aiService.update(id, updateProviderDto, req.user.id);
  }

  @Delete('providers/:id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.aiService.remove(id, req.user.id);
  }

  @Post('providers/test')
  @HttpCode(HttpStatus.OK)
  async testConnection(@Body() testDto: TestProviderDto) {
    return this.aiService.testConnection(testDto);
  }
}
