import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FavoriteService {
  private readonly API_URL = environment.apiUrl;
  private readonly httpOptions = { withCredentials: true };

  // Creamos un aviso para cuando el home spot cambie
  private homeSpotChanged = new Subject<void>();
  homeSpotChanged$ = this.homeSpotChanged.asObservable();

  constructor(private http: HttpClient) {}

  getFavorites(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/favorites`, this.httpOptions);
  }

  toggleFavorite(spotId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/favorites/toggle`, { spot_id: spotId }, this.httpOptions);
  }

  setHomeSpot(spotId: number): Observable<any> {
    return this.http.post(`${this.API_URL}/favorites/set-home`, { spot_id: spotId }, this.httpOptions)
      .pipe(
        tap(() => {
          // Emitimos el aviso de que el home spot ha cambiado
          this.homeSpotChanged.next();
        })
      );
  }

  getHomeSpot(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/user/home-spot`, this.httpOptions);
  }
}