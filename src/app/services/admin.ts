import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Usuarios
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`);
  }

  banUser(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/admin/users/${id}/ban`, {});
  }

  giftSubscription(id: number, planId: number, months: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users/${id}/gift-subscription`, {
      plan_id: planId,
      months: months
    });
  }

  // Reportes
  getReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/reports`);
  }

  deleteReport(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/reports/${id}`);
  }
}