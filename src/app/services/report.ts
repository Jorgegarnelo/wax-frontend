import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  flagReport(reportId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports/${reportId}/flag`, {});
  }

  // EL BORRADO REAL
  deleteReport(reportId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/reports/${reportId}`);
  }
}
