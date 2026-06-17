import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to the PostgreSQL database.');
    } catch (error) {
      this.logger.warn(
        'Could not connect to PostgreSQL database. Please make sure Docker or PostgreSQL is running. Database features will be unavailable.',
      );
      this.logger.debug(error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
