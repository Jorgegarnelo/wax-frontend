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

  // Obtener perfil del usuario autenticado
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`);
  }

  // Actualizar nombre, bio y avatar
  updateProfile(data: FormData): Observable<{ message: string; user: User }> {
    return this.http.post<{ message: string; user: User }>(
      `${this.apiUrl}/user`,
      data
    );
  }

  // Cambiar contraseña
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

  // Eliminar cuenta
  deleteAccount(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/user`);
  }
}
