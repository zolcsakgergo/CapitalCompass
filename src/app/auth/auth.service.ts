import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthResponse {
  access_token: string;
  user: {
    id?: string;
    email: string;
  };
}

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

interface AuthError {
  message: string;
  status?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/auth';
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private userIdSubject = new BehaviorSubject<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (token && userId) {
      this.tokenSubject.next(token);
      this.userIdSubject.next(userId);
      // NOTE: Do not call getUserProfile() here to avoid triggering
      // HTTP + interceptors + router during construction, which can
      // create DI cycles. Instead, components can call getUserProfile()
      // after app bootstrap if needed.
    }
  }

  signup(userData: SignupData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          this.setAuth(response);
          this.router.navigate(['/portfolio']);
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setAuth(response);
          this.router.navigate(['/portfolio']);
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  logout() {
    this.clearAuth();
  }

  private setAuth(response: AuthResponse) {
    if (!response.access_token || !response.user) {
      throw new Error('Invalid authentication response');
    }
    this.tokenSubject.next(response.access_token);
    this.userIdSubject.next(response.user.id || response.user.email);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('userId', response.user.id || response.user.email);
  }

  private clearAuth(redirect: boolean = true) {
    this.tokenSubject.next(null);
    this.userIdSubject.next(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    if (redirect) {
      this.router.navigate(['/login']);
    }
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getUserId(): string | null {
    return this.userIdSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.API_URL}/profile`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.clearAuth();
        }
        return throwError(() => error);
      }),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 401) {
        this.clearAuth();
        errorMessage = 'Authentication failed. Please log in again.';
      } else {
        errorMessage = error.error?.message || 'Server error';
      }
    }
    return throwError(() => ({ message: errorMessage, status: error.status }));
  }
}
