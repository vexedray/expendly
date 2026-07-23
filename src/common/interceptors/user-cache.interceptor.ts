import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Cache } from 'cache-manager';
import { AuthUser } from '../../auth/auth-user.interface';

interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly userCache: Cache,
    reflector: Reflector,
  ) {
    super(userCache, reflector);
  }

  protected override async trackBy(context: ExecutionContext): Promise<string | undefined> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.method !== 'GET' || !request.user?.id) return undefined;

    const version = (await this.userCache.get<number>(`version:${request.user.id}`)) ?? 0;
    return `http:${request.user.id}:${version}:${request.originalUrl}`;
  }
}
