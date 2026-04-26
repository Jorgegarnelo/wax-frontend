import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificationSetting {
  id: number;
  spot_id: number;
  condition: 'poor' | 'good' | 'epic';
  is_active: boolean;
  last_notified_at: string | null;
  spot?: { id: number; name: string };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<NotificationSetting[]> {
    return this.http.get<NotificationSetting[]>(`${this.apiUrl}/notifications/settings`, { withCredentials: true });
  }

  createSetting(spotId: number, condition: string): Observable<NotificationSetting> {
    return this.http.post<NotificationSetting>(`${this.apiUrl}/notifications/settings`, {
      spot_id: spotId,
      condition
    }, { withCredentials: true });
  }

  deleteSetting(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/settings/${id}`, { withCredentials: true });
  }
}