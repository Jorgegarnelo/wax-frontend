import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Spot, Forecast, Report } from '../shared/models/spot.model';

@Injectable({
  providedIn: 'root'
})
export class SpotService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getForecastOverview(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/forecasts/overview`);
  }

  getSpots(): Observable<Spot[]> {
    return this.http.get<Spot[]>(`${this.apiUrl}/spots`);
  }

  getSpot(identifier: string | number): Observable<Spot> {
    return this.http.get<Spot>(`${this.apiUrl}/spots/${identifier}`);
  }

  getForecast(spotId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/spots/${spotId}/forecast`);
  }

  getReports(spotId: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/spots/${spotId}/reports`);
  }

  getWebcams(spotId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/spots/${spotId}/webcams`);
  }

  getLatestReports(): Observable<Report[]> {
  return this.http.get<Report[]>(`${this.apiUrl}/reports/latest`);
}
}