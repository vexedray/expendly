import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthUser } from '../../auth/auth-user.interface';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    const log = (statusCode: number): void => {
      this.logger.info(
        {
          method: request.method,
          path: request.originalUrl,
          statusCode,
          durationMs: Date.now() - startedAt,
          userId: request.user?.id,
        },
        'request handled',
      );
    };

    return next.handle().pipe(
      tap({
        complete: () => log(response.statusCode),
        error: (error: unknown) =>
          log(
            error instanceof HttpException ? error.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR,
          ),
      }),
    );
  }
}
