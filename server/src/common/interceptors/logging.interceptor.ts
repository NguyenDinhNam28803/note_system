import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Log mỗi request vào/ra kèm status code và thời gian xử lý.
 * Chỉ bật khi NODE_ENV !== 'production' để tránh nhiễu log ở môi trường thật.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl } = req;
    const now = Date.now();

    this.logger.log(`→ ${method} ${originalUrl}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          const ms = Date.now() - now;
          this.logger.log(`← ${method} ${originalUrl} ${res.statusCode} +${ms}ms`);
        },
        error: (err: Error) => {
          const ms = Date.now() - now;
          this.logger.error(`✗ ${method} ${originalUrl} +${ms}ms - ${err.message}`);
        },
      }),
    );
  }
}
