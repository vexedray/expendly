import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { UserCacheInterceptor } from './user-cache.interceptor';

class TestUserCacheInterceptor extends UserCacheInterceptor {
  cacheKey(context: ExecutionContext): Promise<string | undefined> {
    return this.trackBy(context);
  }
}

const contextFor = (userId?: string, method = 'GET', url = '/categories'): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ method, originalUrl: url, user: userId ? { id: userId } : undefined }),
    }),
  }) as unknown as ExecutionContext;

describe('UserCacheInterceptor', () => {
  const cache = { get: jest.fn().mockResolvedValue(0) } as unknown as Cache;
  const interceptor = new TestUserCacheInterceptor(cache, new Reflector());

  it('separates cache entries by authenticated user and URL', async () => {
    await expect(interceptor.cacheKey(contextFor('user-a'))).resolves.toBe(
      'http:user-a:0:/categories',
    );
    await expect(interceptor.cacheKey(contextFor('user-b'))).resolves.toBe(
      'http:user-b:0:/categories',
    );
    await expect(
      interceptor.cacheKey(contextFor('user-a', 'GET', '/categories?page=2')),
    ).resolves.toBe('http:user-a:0:/categories?page=2');
  });

  it('does not cache public or mutating requests', async () => {
    await expect(interceptor.cacheKey(contextFor())).resolves.toBeUndefined();
    await expect(interceptor.cacheKey(contextFor('user-a', 'POST'))).resolves.toBeUndefined();
  });
});
