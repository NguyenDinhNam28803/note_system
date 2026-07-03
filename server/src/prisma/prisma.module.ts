import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Module toàn cục: mọi module khác inject được PrismaService
 * mà không cần import lại PrismaModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
