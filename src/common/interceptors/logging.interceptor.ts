import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          this.logger.log(
            `${method} ${url} ${response.statusCode} - ${Date.now() - now}ms`,
          );
        },
        error: (error: Error) => {
          this.logger.error(
            `${method} ${url} ${error instanceof Error && 'status' in error ? (error as Record<string, number>).status : 500} - ${Date.now() - now}ms`,
            error.stack,
          );
        },
      }),
    );
  }
}
