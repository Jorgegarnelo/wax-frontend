import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.apiUrl;
  private csrfUrl = '/sanctum/csrf-cookie';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Recuperar usuario del storage para UI rápida
    const stored = sessionStorage.getItem('wax_user');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
    // Validamos contra el servidor al arrancar
    this.checkAuthStatus().subscribe();
  }

  // Valida si la sesión sigue viva en el servidor
  checkAuthStatus(): Observable<User | null> {
    return this.getMe().pipe(
      tap(user => {
        sessionStorage.setItem('wax_user', JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
      catchError(() => {
        sessionStorage.removeItem('wax_user');
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  private getCsrfCookie(): Observable<any> {
    return this.http.get(this.csrfUrl);
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)),
      tap(response => {
        sessionStorage.setItem('wax_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.getCsrfCookie().pipe(
      switchMap(() => this.http.post<LoginResponse>(`${this.apiUrl}/auth/register`, data)),
      tap(response => {
        sessionStorage.setItem('wax_user', JSON.stringify(response.user));
        this.currentUserSubject.next(response.user);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        sessionStorage.removeItem('wax_user');
        this.currentUserSubject.next(null);
      })
    );
  }

  getMe(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role?.name === 'admin';
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }
}