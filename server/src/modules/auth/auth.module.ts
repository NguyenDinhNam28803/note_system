import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HashPasswordService } from './hashpassword.service';
import { JwtAuthGuard } from './jwt.guards';
import { JwtUtilsService } from './jwt.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, HashPasswordService, JwtAuthGuard, JwtUtilsService],
  // JwtModule đã là global (đăng ký ở AppModule) nên không cần export ở đây.
  // Export để module khác (notes, tags) dùng guard và service.
  exports: [AuthService, HashPasswordService, JwtAuthGuard],
})
export class AuthModule { }
