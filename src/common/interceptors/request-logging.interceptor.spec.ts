import { CallHandler, ExecutionContext } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { lastValueFrom, of } from 'rxjs';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

describe('RequestLoggingInterceptor', () => {
  it('logs method, path, status and authenticated user after handling', async () => {
    const logger = { info: jest.fn() } as unknown as PinoLogger;
    const interceptor = new RequestLoggingInterceptor(logger);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'GET', originalUrl: '/categories', user: { id: 'user-a' } }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as unknown as ExecutionContext;
    const next = { handle: () => of({ data: [] }) } as CallHandler;

    await lastValueFrom(interceptor.intercept(context, next));

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/categories',
        statusCode: 200,
        userId: 'user-a',
      }),
      'request handled',
    );
  });
});
