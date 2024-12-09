import {
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { API_ROUTES } from '../constants/api.routes';

const cache = new Map<
  string,
  { response: HttpResponse<any>; timestamp: number }
>();
const CACHE_DURATION = {
  DEFAULT: 5 * 60 * 1000,
  DASHBOARD: 1 * 60 * 1000,
};
const CACHEABLE_URLS = [
  API_ROUTES.STOCKS,
  API_ROUTES.CRYPTO,
  API_ROUTES.TRANSACTIONS,
  API_ROUTES.DASHBOARD.PERFORMANCE,
  API_ROUTES.DASHBOARD.SUMMARY,
  API_ROUTES.DASHBOARD.PORTFOLIO,
];

export function cacheInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {
  if (req.method !== 'GET') {
    return next(req);
  }

  if (!CACHEABLE_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const cachedResponse = cache.get(req.url);
  const now = Date.now();
  const duration = req.url.includes('/dashboard')
    ? CACHE_DURATION.DASHBOARD
    : CACHE_DURATION.DEFAULT;

  if (cachedResponse && now - cachedResponse.timestamp < duration) {
    console.log(`[Cache] Hit for ${req.url}`);
    return of(cachedResponse.response.clone());
  }

  console.log(`[Cache] Miss for ${req.url}`);
  if (cachedResponse) {
    console.log(`[Cache] Expired entry removed for ${req.url}`);
    cache.delete(req.url);
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        console.log(`[Cache] Storing response for ${req.url}`);
        cache.set(req.url, {
          response: event.clone(),
          timestamp: now,
        });
      }
    }),
  );
}

export function clearCache(): void {
  console.log('[Cache] Clearing all cache entries');
  cache.clear();
}
