import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthResponse {
  token: string;
  userId: string;
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
    // Load token from localStorage on service initialization
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      this.validateToken(token).subscribe({
        next: () => {
          this.tokenSubject.next(token);
          this.userIdSubject.next(userId);
        },
        error: () => {
          this.clearAuth();
        },
      });
    }
  }

  signup(userData: SignupData): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          this.setAuth(response);
        }),
        catchError(this.handleError),
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          this.setAuth(response);
        }),
        catchError(this.handleError),
      );
  }

  logout() {
    this.clearAuth();
  }

  private setAuth(response: AuthResponse) {
    this.tokenSubject.next(response.token);
    this.userIdSubject.next(response.userId);
    localStorage.setItem('token', response.token);
    localStorage.setItem('userId', response.userId);
  }

  private clearAuth() {
    this.tokenSubject.next(null);
    this.userIdSubject.next(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  private validateToken(token: string): Observable<any> {
    return this.http.get(`${this.API_URL}/validate-token`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.clearAuth();
        }
        return throwError(() => error);
      }),
    );
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
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
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
