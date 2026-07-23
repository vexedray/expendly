import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { AuthUser } from '../../auth/auth-user.interface';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.method === 'GET' || !request.user?.id) return next.handle();
    const userId = request.user.id;

    return next.handle().pipe(
      mergeMap(async (value: unknown) => {
        await this.cache.set(`version:${userId}`, Date.now(), 86_400_000);
        return value;
      }),
    );
  }
}
