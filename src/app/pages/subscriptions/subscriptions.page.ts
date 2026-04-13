import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { SpotService } from '../../services/spot';
import { AuthService } from '../../services/auth';
import { SubscriptionService } from '../../services/subscription';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, RouterLink, HeaderComponent, FooterComponent]
})
export class SubscriptionsPage implements OnInit {

  plans: any[] = [];
  isLoading = true;
  isScrolled = false;
  currentPlan: string = 'free';

  constructor(
    private spotService: SpotService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.spotService.getPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando planes:', err);
        this.isLoading = false;
      }
    });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getPlanColor(slug: string): string {
    switch (slug) {
      case 'pro':    return '#00B4D8';
      case 'legend': return '#F4A261';
      default:       return 'rgba(255,255,255,0.3)';
    }
  }

  getPlanFeatures(plan: any): string[] {
    const features: string[] = [];
    features.push(`${plan.forecast_days} días de previsión`);
    features.push(`${plan.max_alerts === 999 ? 'Alertas ilimitadas' : plan.max_alerts + ' alertas de oleaje'}`);
    if (plan.has_premium_forecast) features.push('Previsión premium detallada');
    if (plan.badge === 'gold')    features.push('Badge Gold en perfil');
    if (plan.badge === 'diamond') features.push('Badge Diamond en perfil');
    if (plan.slug === 'legend')   features.push('Acceso prioritario a nuevas funciones');
    return features;
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }

  onSubscribe(planId: number) {
    if (!this.isLoggedIn()) return;

    this.subscriptionService.createCheckout(planId).subscribe({
      next: (res) => {
        if (res.checkout_url) {
          // Redirección directa a la pasarela de Stripe
          window.location.href = res.checkout_url;
        }
      },
      error: (err) => {
        console.error('Error al iniciar suscripción:', err);
      }
    });
  }
}

