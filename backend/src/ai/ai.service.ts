import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderDto, UpdateProviderDto, TestProviderDto } from './dto/provider.dto';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createProviderDto: CreateProviderDto, userId: string) {
    // If setting as default, unset other defaults first
    if (createProviderDto.isDefault) {
      await this.prisma.aIProvider.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.aIProvider.create({
      data: {
        ...createProviderDto,
        apiKey: createProviderDto.apiKey || '',
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.aIProvider.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const provider = await this.prisma.aIProvider.findUnique({
      where: { id },
    });

    if (!provider || provider.userId !== userId) {
      throw new NotFoundException(`AI Provider setting with ID "${id}" not found.`);
    }

    return provider;
  }

  async update(id: string, updateProviderDto: UpdateProviderDto, userId: string) {
    // Ensure provider exists and user owns it
    await this.findOne(id, userId);

    if (updateProviderDto.isDefault) {
      await this.prisma.aIProvider.updateMany({
        where: { userId, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.aIProvider.update({
      where: { id },
      data: updateProviderDto,
    });
  }

  async remove(id: string, userId: string) {
    const provider = await this.findOne(id, userId);

    if (provider.isDefault) {
      throw new BadRequestException('Cannot delete the default AI Provider. Please set another provider as default first.');
    }

    await this.prisma.aIProvider.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'AI Provider deleted successfully.',
    };
  }

  async testConnection(testDto: TestProviderDto) {
    const { baseUrl, apiKey, modelName } = testDto;
    
    // Clean trailing slash
    const cleanUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const url = `${cleanUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiKey && apiKey !== 'not-needed-for-local') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const body = {
      model: modelName,
      messages: [
        { role: 'user', content: 'respond with exactly the word "online" and nothing else.' },
      ],
      max_tokens: 10,
      temperature: 0.1,
    };

    try {
      this.logger.log(`Testing AI connection to: ${url} using model ${modelName}`);
      const response = await axios.post(url, body, { headers, timeout: 10000 });
      
      const content = response.data?.choices?.[0]?.message?.content?.trim() || '';
      
      return {
        success: true,
        message: `Successfully connected to endpoint. Model responded: "${content}"`,
      };
    } catch (error: any) {
      this.logger.error(`AI connection test failed: ${error.message}`);
      let details = error.message;
      if (error.response?.data?.error?.message) {
        details = error.response.data.error.message;
      } else if (error.response?.data) {
        details = JSON.stringify(error.response.data);
      }
      throw new BadRequestException(`Connection failed: ${details}`);
    }
  }

  async callLLM(
    userId: string,
    providerId: string | undefined,
    systemPrompt: string,
    userPrompt: string,
    responseFormatJson = false,
  ): Promise<string> {
    let provider;

    if (providerId) {
      provider = await this.findOne(providerId, userId);
    } else {
      // Find default provider
      provider = await this.prisma.aIProvider.findFirst({
        where: { userId, isDefault: true },
      });

      if (!provider) {
        // Fallback to first provider
        provider = await this.prisma.aIProvider.findFirst({
          where: { userId },
        });
      }
    }

    if (!provider) {
      throw new BadRequestException('No AI Provider configured. Please add an AI Provider in Settings.');
    }

    const cleanUrl = provider.baseUrl.endsWith('/') ? provider.baseUrl.slice(0, -1) : provider.baseUrl;
    const url = `${cleanUrl}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider.apiKey && provider.apiKey !== 'not-needed-for-local' && provider.apiKey !== '') {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const body: Record<string, any> = {
      model: provider.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    };

    if (responseFormatJson) {
      body.response_format = { type: 'json_object' };
    }

    try {
      this.logger.log(`Invoking LLM: ${provider.name} (${provider.modelName}) at ${url}`);
      const response = await axios.post(url, body, { headers, timeout: 60000 });
      
      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response received from LLM.');
      }
      
      return content;
    } catch (error: any) {
      this.logger.error(`AI call failed: ${error.message}`);
      let details = error.message;
      if (error.response?.data?.error?.message) {
        details = error.response.data.error.message;
      } else if (error.response?.data) {
        details = JSON.stringify(error.response.data);
      }
      throw new BadRequestException(`AI provider error: ${details}`);
    }
  }
}
