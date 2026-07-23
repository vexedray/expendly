import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { lastValueFrom, of } from 'rxjs';
import { CacheInvalidationInterceptor } from './cache-invalidation.interceptor';

describe('CacheInvalidationInterceptor', () => {
  it('changes the user cache version after a successful mutation', async () => {
    const cache = { set: jest.fn().mockResolvedValue(undefined) } as unknown as Cache;
    const interceptor = new CacheInvalidationInterceptor(cache);
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'PATCH', user: { id: 'user-a' } }),
      }),
    } as unknown as ExecutionContext;
    const next = { handle: () => of({ id: 'resource' }) } as CallHandler;

    await lastValueFrom(interceptor.intercept(context, next));

    expect(cache.set).toHaveBeenCalledWith('version:user-a', expect.any(Number), 86_400_000);
  });
});
