import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createCheckout(planId: number) {
   
    return this.http.post<{ checkout_url: string }>(`${this.apiUrl}/subscription/checkout`, { plan_id: planId });
  }

  getCurrentSubscription() {
    return this.http.get<any>(`${this.apiUrl}/subscription/current`);
  }
}