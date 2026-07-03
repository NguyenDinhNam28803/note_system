import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Bọc PrismaClient thành một provider của NestJS.
 * Tự kết nối khi module khởi động và ngắt kết nối khi ứng dụng tắt.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('PrismaService');

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('✅ Đã kết nối database');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Đã ngắt kết nối database');
  }
}
