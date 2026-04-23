import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent, AlertController, ToastController } from '@ionic/angular/standalone';
import { SpotService } from '../../services/spot';
import { AuthService } from '../../services/auth';
import { SubscriptionService } from '../../services/subscription';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';


@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.page.html',
  styleUrls: ['./subscriptions.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, RouterLink, HeaderComponent, FooterComponent]
})
export class SubscriptionsPage implements OnInit, OnDestroy {

  plans: any[] = [];
  isLoading = true;
  isScrolled = false;
  currentPlan: string = 'free';
  activeSubscription: any = null;

  private destroy$ = new Subject<void>();

  constructor(
    private spotService: SpotService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private alertController: AlertController,
    private toastController: ToastController

  ) { }

  ngOnInit() {
    this.loadData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData() {
    this.isLoading = true;

    // Cargamos planes y estado de suscripción en paralelo
    forkJoin({
      planesDisponibles: this.spotService.getPlans().pipe(catchError(() => of([]))),
      suscripcionActual: this.isLoggedIn()
        ? this.subscriptionService.getCurrentSubscription().pipe(catchError(() => of(null)))
        : of(null)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.plans = res.planesDisponibles;
          this.activeSubscription = res.suscripcionActual;
          console.log('Suscripción activa:', this.activeSubscription);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error cargando datos de suscripción:', err);
          this.isLoading = false;
        }
      });
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getPlanColor(slug: string): string {
    switch (slug) {
      case 'pro': return '#00B4D8';
      case 'legend': return '#F4A261';
      default: return 'rgba(255,255,255,0.3)';
    }
  }

  getPlanFeatures(plan: any): string[] {
    const features: string[] = [];
    features.push(`${plan.forecast_days} días de previsión`);
    if (plan.max_favorites >= 999) {
      features.push('Favoritos ilimitados');
    } else {
      features.push(`Hasta ${plan.max_favorites} spots favoritos`);
    }
    features.push(plan.max_alerts >= 999 ? 'Alertas ilimitadas' : `${plan.max_alerts} alerta${plan.max_alerts > 1 ? 's' : ''} de oleaje`);
    if (plan.max_reports_per_day > 1) {
      features.push(`${plan.max_reports_per_day} reportes diarios`);
    } else {
      features.push('1 reporte diario');
    }
    if (plan.has_premium_forecast) features.push('Previsión premium detallada');
    if (plan.badge === 'gold') features.push('Badge Gold en perfil');
    if (plan.badge === 'diamond') features.push('Badge Diamond en perfil');
    if (plan.slug === 'legend') features.push('Acceso prioritario a nuevas funciones');
    return features;
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }

  onSubscribe(planId: number) {
    if (!this.isLoggedIn()) return;

    this.subscriptionService.createCheckout(planId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
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

  async onCancel() {
  const alert = await this.alertController.create({
    header: 'Cancelar suscripción',
    message: '¿Seguro que quieres cancelar? Perderás el acceso premium al final del período de facturación.',
    buttons: [
      {
        text: 'Mantener plan',
        role: 'cancel'
      },
      {
        text: 'Sí, cancelar',
        role: 'destructive',
        handler: () => {
          this.subscriptionService.cancelSubscription()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: async () => {
                this.activeSubscription = null;
                this.loadData();
                const toast = await this.toastController.create({
                  message: 'Suscripción cancelada. Mantendrás el acceso hasta el final del período.',
                  duration: 5000,
                  position: 'bottom',
                  color: 'danger',
                  buttons: [{ text: 'OK', role: 'cancel' }]
                });
                await toast.present();
              },
              error: async () => {
                const toast = await this.toastController.create({
                  message: 'Error al cancelar. Inténtalo de nuevo.',
                  duration: 3000,
                  position: 'bottom',
                  color: 'danger'
                });
                await toast.present();
              }
            });
        }
      }
    ]
  });
  await alert.present();
}
}