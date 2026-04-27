import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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
  private alertsSubject = new BehaviorSubject<NotificationSetting[]>([]);
  public alerts$ = this.alertsSubject.asObservable();

  constructor(private http: HttpClient) { }

  refreshAlerts() {
    this.http.get<NotificationSetting[]>(`${this.apiUrl}/notifications/settings`, { withCredentials: true })
      .subscribe({
        next: (alerts) => this.alertsSubject.next(alerts),
        error: () => this.alertsSubject.next([])
      });
  }

  getSettings(): Observable<NotificationSetting[]> {
    return this.http.get<NotificationSetting[]>(`${this.apiUrl}/notifications/settings`, { withCredentials: true });
  }

  createSetting(spotId: number, condition: string): Observable<NotificationSetting> {
    return this.http.post<NotificationSetting>(`${this.apiUrl}/notifications/settings`, {
      spot_id: spotId,
      condition
    }, { withCredentials: true }).pipe(
      tap(() => this.refreshAlerts())
    );
  }

  deleteSetting(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/settings/${id}`, { withCredentials: true }).pipe(
      tap(() => this.refreshAlerts())
    );
  }
}