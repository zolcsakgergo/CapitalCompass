import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Don't add token for auth endpoints
  if (
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/register')
  ) {
    return next(req);
  }

  if (token) {
    // Ensure token is properly formatted
    const formattedToken = token.startsWith('Bearer ')
      ? token
      : `Bearer ${token}`;
    req = req.clone({
      setHeaders: {
        Authorization: formattedToken,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Clear auth state and redirect to login
        authService.logout();
      }
      return throwError(() => error);
    }),
  );
};
