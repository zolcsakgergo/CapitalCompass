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
      console.log('Found stored token, validating...');
      this.validateToken(token).subscribe({
        next: () => {
          console.log('Token validated successfully');
          this.tokenSubject.next(token);
          this.userIdSubject.next(userId);
        },
        error: error => {
          console.error('Token validation failed:', error);
          this.clearAuth();
        },
      });
    }
  }

  signup(userData: SignupData): Observable<AuthResponse> {
    console.log('Attempting signup...');
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          console.log('Signup successful');
          this.setAuth(response);
          this.router.navigate(['/portfolio']);
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    console.log('Attempting login...');
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap(response => {
          console.log('Login successful');
          this.setAuth(response);
          this.router.navigate(['/portfolio']);
        }),
        catchError(this.handleError.bind(this)),
      );
  }

  logout() {
    console.log('Logging out...');
    this.clearAuth();
  }

  private setAuth(response: AuthResponse) {
    console.log('Setting auth state...');
    if (!response.access_token || !response.user) {
      console.error('Invalid auth response:', response);
      throw new Error('Invalid authentication response');
    }
    this.tokenSubject.next(response.access_token);
    this.userIdSubject.next(response.user.id || response.user.email);
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('userId', response.user.id || response.user.email);
    console.log('Auth state set successfully');
  }

  private clearAuth() {
    console.log('Clearing auth state...');
    this.tokenSubject.next(null);
    this.userIdSubject.next(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  private validateToken(token: string): Observable<any> {
    console.log('Validating token...');
    return this.http.get(`${this.API_URL}/validate-token`).pipe(
      tap(() => console.log('Token validation request successful')),
      catchError((error: HttpErrorResponse) => {
        console.error('Token validation failed:', error);
        if (error.status === 401) {
          this.clearAuth();
        }
        return throwError(() => error);
      }),
    );
  }

  getToken(): string | null {
    const token = this.tokenSubject.value;
    console.log('Getting token:', token ? 'Token exists' : 'No token');
    return token;
  }

  getUserId(): string | null {
    return this.userIdSubject.value;
  }

  isAuthenticated(): boolean {
    const isAuth = !!this.tokenSubject.value;
    console.log('Checking authentication:', isAuth);
    return isAuth;
  }

  getUserProfile(): Observable<any> {
    console.log('Fetching user profile...');
    return this.http.get(`${this.API_URL}/profile`).pipe(
      tap(profile => console.log('Profile fetched successfully:', profile)),
      catchError((error: HttpErrorResponse) => {
        console.error('Error fetching profile:', error);
        if (error.status === 401) {
          this.clearAuth();
        }
        return throwError(() => error);
      }),
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('API Error:', error);
    let errorMessage = 'An unknown error occurred!';

    if (error.error instanceof ErrorEvent) {
      console.error('Client Error:', error.error.message);
      errorMessage = error.error.message;
    } else {
      console.error('Server Error:', error.status, error.error);
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
