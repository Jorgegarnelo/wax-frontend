import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { IonContent, ToastController } from '@ionic/angular/standalone';
import { SpotService } from '../../services/spot';
import { FavoriteService } from '../../services/favorite';
import { AuthService } from '../../services/auth';
import { Spot, Forecast, Report } from '../../shared/models/spot.model';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { WebcamModalComponent } from '../../components/webcam-modal/webcam-modal.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportCardComponent } from '../../components/report-card/report-card.component';
import { ReportDetailModalComponent } from '../../components/report-detail-modal/report-detail-modal.component';
import { AlertModalComponent } from '../../components/alert-modal/alert-modal.component';
import { NotificationService, NotificationSetting } from '../../services/notification';

@Component({
  selector: 'app-spot-detail',
  templateUrl: './spot-detail.page.html',
  styleUrls: ['./spot-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, CommonModule, RouterLink, HeaderComponent, FooterComponent,
    WebcamModalComponent, ReportCardComponent, ReportDetailModalComponent, AlertModalComponent
  ]
})
export class SpotDetailPage implements OnInit, OnDestroy {

  spot: Spot | null = null;
  forecast: Forecast[] = [];
  reports: Report[] = [];
  webcams: any[] = [];
  isLoading = true;
  isLoadingForecast = false;
  isScrolled = false;
  isLoggedIn: boolean = false;
  isFavorite: boolean = false;
  isHome: boolean = false;
  private destroy$ = new Subject<void>();

  // Siempre 7 tabs visibles
  days: { label: string; date: string }[] = [];
  selectedDate: string = '';
  allowedForecastDays: number = 2; // FREE

  selectedWebcamUrl: boolean = false;
  selectedRawUrl: string = '';
  selectedWebcamName: string = '';
  selectedSpotName: string = '';

  selectedReport: Report | null = null;
  currentUserId: any = null;
  userIsAdmin: boolean = false;

  isAlertModalOpen = false;

  existingAlert: NotificationSetting | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotService: SpotService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.generateDays(7);

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.currentUserId = user?.id || null;
        if (user && this.spot) {
          this.loadExistingAlert(this.spot.id);
        }
      });

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const id = params.get('id');
        if (id) this.loadSpot(id);
      });

    this.favoriteService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(favs => {
        if (this.spot) {
          const fav = favs.find(f => f.spot_id === this.spot?.id);
          this.isFavorite = !!fav;
          this.isHome = fav ? fav.is_home : false;
          this.cdr.detectChanges();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.classList.remove('overflow-hidden');
  }

  // ─── Favoritos ──

  async showAuthAlert() {
    const toast = await this.toastController.create({
      message: 'Inicia sesión para personalizar tus spots',
      duration: 3000,
      position: 'bottom',
      buttons: [{ text: 'LOGIN', handler: () => this.router.navigate(['/login']) }]
    });
    await toast.present();
  }

  checkIfIsFavorite(spotId: number) {
    if (!this.isLoggedIn) return;
    this.favoriteService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (favs: any[]) => {
          const fav = favs.find(f => f.spot_id === spotId);
          this.isFavorite = !!fav;
          this.isHome = fav ? fav.is_home : false;
        }
      });
  }

  toggleFavorite() {
    if (!this.spot || !this.isLoggedIn) return;

    this.favoriteService.toggleFavorite(this.spot.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isFavorite = !this.isFavorite;
          if (!this.isFavorite) this.isHome = false;
        },
        error: (err) => {
          if (err.status === 403 && err.error?.limit_reached) {
            this.showUpgradeToast('Has alcanzado el límite de favoritos de tu plan.');
          } else {
            this.showErrorToast('No se pudo actualizar el favorito.');
          }
        }
      });
  }

  setAsHome() {
    if (!this.spot || !this.isLoggedIn) return;
    if (!this.isFavorite) {
      this.favoriteService.toggleFavorite(this.spot.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.isFavorite = true;
            this.executeSetAsHome();
          },
          error: (err) => {
            if (err.status === 403 && err.error?.limit_reached) {
              this.showUpgradeToast('Has alcanzado el límite de favoritos de tu plan.');
            }
          }
        });
    } else {
      this.executeSetAsHome();
    }
  }

  private executeSetAsHome() {
    if (!this.spot) return;
    this.favoriteService.setHomeSpot(this.spot.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isHome = true;
          this.showSuccessToast('Spot fijado como principal');
        }
      });
  }

  // ─── Carga de datos 

  loadSpot(id: string) {
    this.isLoading = true;
    this.spotService.getSpot(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (spot: Spot) => {
          this.spot = spot;
          if (spot?.id) {
            this.loadForecastByDay(spot.id, this.selectedDate);
            this.loadWebcams(spot.id);
            this.loadReports(spot.id);
          }
          if (this.isLoggedIn && spot.id) {
            this.checkIfIsFavorite(spot.id);
            this.loadExistingAlert(spot.id);
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  loadForecastByDay(spotId: number, date: string) {
    this.isLoadingForecast = true;
    this.spotService.getForecastByDay(spotId, date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.forecast = data.data ?? [];
          if (data.forecast_days) {
            this.allowedForecastDays = data.forecast_days;
          }
          this.isLoadingForecast = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.isLoadingForecast = false;
          this.forecast = [];
          if (err.status === 403 && err.error?.limit_reached) {
            this.allowedForecastDays = err.error?.forecast_days ?? 2;
            this.selectedDate = this.days[0]?.date ?? '';
            if (this.spot) this.loadForecastByDay(this.spot.id, this.selectedDate);
          }
          this.cdr.detectChanges();
        }
      });
  }

  loadReports(spotId: number) {
    this.spotService.getReports(spotId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reports = data.map((report: any) => ({
            ...report,
            wave_height: report.wave_height || report.height || report.altura
          }));
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error al cargar reportes:', err)
      });
  }

  loadWebcams(spotId: number) {
    this.spotService.getWebcams(spotId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (webcams: any[]) => this.webcams = webcams
      });
  }


  generateDays(maxDays: number = 7) {
    this.days = Array.from({ length: maxDays }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' :
        date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).replace('.', '');
      return { label, date: date.toISOString().split('T')[0] };
    });
    this.selectedDate = this.days[0]?.date ?? '';
  }

  // Determina si un tab está bloqueado según el plan
  isDayLocked(index: number): boolean {
    return index >= this.allowedForecastDays;
  }

  selectDay(day: { label: string; date: string }, index: number) {
    // Si el día está bloqueado mostramos el toast de upgrade y no cargamos
    if (this.isDayLocked(index)) {
      this.showUpgradeToast(
        `Tu plan incluye ${this.allowedForecastDays} día${this.allowedForecastDays > 1 ? 's' : ''} de previsión.`
      );
      return;
    }
    this.selectedDate = day.date;
    if (this.spot) this.loadForecastByDay(this.spot.id, day.date);
  }

  getWeatherIcon(code: number | null | undefined, forecastTime?: string): string {
    if (code === null || code === undefined) return 'unknown';

    const hour = forecastTime ? new Date(forecastTime).getHours() : new Date().getHours();
    const isNight = hour >= 21 || hour < 7;

    if (code === 0 || code === 1) return isNight ? 'moon' : 'sun';
    if (code === 2 || code === 3) return 'cloudy';
    if (code === 45 || code === 48) return isNight ? 'moon-fog' : 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if (code === 61 || code === 63) return 'rain';
    if (code === 65 || code === 66 || code === 67) return 'heavy-rain';
    if (code === 80 || code === 81 || code === 82) return 'showers';
    if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return 'snow';
    if (code === 95 || code === 96 || code === 99) return 'storm';
    return 'unknown';
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }

  getConditionColor(): string {
    const condition = this.spot?.current_forecast?.condition;
    if (condition === 'epic') return '#06D6A0';
    if (condition === 'good') return '#FFD60A';
    return '#E63946';
  }

  getConditionLabel(): string {
    const condition = this.spot?.current_forecast?.condition;
    if (condition === 'epic') return 'ÉPICO HOY';
    if (condition === 'good') return 'BUENO HOY';
    return 'FLOJO HOY';
  }

  getWeatherLabel(code: number | null | undefined, forecastTime?: string): string {
    const labels: Record<string, string> = {
      'sun': 'Despejado',
      'moon': 'Despejado (noche)',
      'cloudy': 'Nublado',
      'fog': 'Niebla',
      'moon-fog': 'Niebla (noche)',
      'drizzle': 'Llovizna',
      'rain': 'Lluvia',
      'heavy-rain': 'Lluvia intensa',
      'showers': 'Chubascos',
      'snow': 'Nieve',
      'storm': 'Tormenta',
      'unknown': 'Condición desconocida'
    };
    return labels[this.getWeatherIcon(code, forecastTime)] ?? 'Condición desconocida';
  }

  getDifficultyDots(): boolean[] {
    return Array(5).fill(false).map((_, i) => i < (this.spot?.difficulty ?? 0));
  }

  verWebcam(webcam: any) {
    if (!webcam) return;
    this.selectedRawUrl = webcam.url;
    this.selectedWebcamName = webcam.name;
    this.selectedSpotName = this.spot?.name || '';
    this.selectedWebcamUrl = true;
    document.body.classList.add('overflow-hidden');
  }

  cerrarWebcam() {
    this.selectedWebcamUrl = false;
    this.selectedRawUrl = '';
    this.selectedWebcamName = '';
    document.body.classList.remove('overflow-hidden');
  }

  abrirDetalle(report: Report) {
    this.selectedReport = report;
    document.body.classList.add('overflow-hidden');
  }

  // ─── Toasts

  async showSuccessToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg, duration: 2000, position: 'bottom', color: 'dark'
    });
    await toast.present();
  }

  async showErrorToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg, duration: 3000, position: 'bottom', color: 'danger'
    });
    await toast.present();
  }

  async showUpgradeToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 4000,
      position: 'bottom',
      color: 'warning',
      buttons: [{ text: 'Ver planes', handler: () => this.router.navigate(['/subscriptions']) }]
    });
    await toast.present();
  }

  openAlertModal() {
    if (!this.isLoggedIn) {
      this.showAuthAlert();
      return;
    }
    this.isAlertModalOpen = true;
  }

  closeAlertModal() {
    this.isAlertModalOpen = false;
    if (this.spot) this.loadExistingAlert(this.spot.id);
  }

  loadExistingAlert(spotId: number) {
    if (!this.isLoggedIn) return;
    this.notificationService.getSettings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (settings) => {
          this.existingAlert = settings.find(s => s.spot_id === spotId) || null;
          this.cdr.detectChanges();
        }
      });
  }
}