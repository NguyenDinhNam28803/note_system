import { Logger, NestInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isDev = process.env.NODE_ENV !== 'production';

  // Cho phép frontend gọi API
  app.enableCors();

  // Tự động validate & lọc dữ liệu DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Chuẩn hoá response trả về; chỉ log HTTP khi đang phát triển
  const reflector = app.get(Reflector);
  const interceptors: NestInterceptor[] = [new TransformInterceptor(reflector)];
  if (isDev) {
    interceptors.unshift(new LoggingInterceptor());
  }
  app.useGlobalInterceptors(...interceptors);

  // Chuẩn hoá mọi lỗi trả về
  app.useGlobalFilters(new AllExceptionsFilter());

  // Tài liệu API tự động (Swagger UI tại /api)
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Note System API')
    .setDescription('API cho hệ thống note lưu trữ')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập Access Token của bạn để truy cập các API bảo mật',
        in: 'header',
      },
      'JWT-auth', // Tên key này sẽ dùng trong @ApiBearerAuth('JWT-auth') ở Controller
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  // app.listen() chỉ chạy sau khi Prisma đã $connect (trong onModuleInit),
  // nên tại đây kết nối database chắc chắn đã sẵn sàng.
  app.get(PrismaService);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
  logger.log('📦 Database đã kết nối (Prisma → PostgreSQL/Supabase)');
  console.log(`Server đang chạy tại: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api`);
}
void bootstrap();
