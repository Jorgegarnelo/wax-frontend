import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../shared/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  getFullProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/full-profile`);
  }

  updateProfile(data: FormData): Observable<{ message: string; user: User }> {
    return this.http.post<{ message: string; user: User }>(
      `${this.apiUrl}/user`,
      data
    );
  }

  getFavorites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favorites`);
  }

  getAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications/settings`);
  }

  deleteAlert(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/notifications/settings/${id}`);
  }

  getCurrentSubscription(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subscription/current`);
  }

  changePassword(data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/user/password`,
      data
    );
  }

  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/user`);
  }
}