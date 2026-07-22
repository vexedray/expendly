import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : undefined;
    const details =
      typeof body === 'object' && body !== null
        ? (body as { error?: string; message?: string | string[] })
        : undefined;
    const message = typeof body === 'string' ? body : (details?.message ?? 'Internal server error');
    const error = details?.error ?? (status === 500 ? 'Internal Server Error' : HttpStatus[status]);
    if (status >= 500) {
      const databaseCode =
        typeof exception === 'object' && exception !== null && 'driverError' in exception
          ? (exception.driverError as { code?: unknown }).code
          : undefined;
      const exceptionType = exception instanceof Error ? exception.name : typeof exception;
      this.logger.error(
        { path: request.url, method: request.method, exceptionType, databaseCode },
        'request failed',
      );
    }
    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
