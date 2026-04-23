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

@Component({
  selector: 'app-spot-detail',
  templateUrl: './spot-detail.page.html',
  styleUrls: ['./spot-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent, CommonModule, RouterLink, HeaderComponent, FooterComponent,
    WebcamModalComponent, ReportCardComponent, ReportDetailModalComponent
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

  // Siempre 7 tabs visibles — allowedForecastDays controla cuáles son clickables
  days: { label: string; date: string }[] = [];
  selectedDate: string = '';
  allowedForecastDays: number = 2; // FREE/invitado por defecto

  selectedWebcamUrl: boolean = false;
  selectedRawUrl: string = '';
  selectedWebcamName: string = '';
  selectedSpotName: string = '';

  selectedReport: Report | null = null;
  currentUserId: any = null;
  userIsAdmin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotService: SpotService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Siempre generamos los 7 días — el candado lo gestiona isDayLocked()
    this.generateDays(7);

    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.currentUserId = user?.id || null;
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

  // ─── Favoritos ───────────────────────────────────────────────

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

  // ─── Carga de datos ──────────────────────────────────────────

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
          // Actualizamos días permitidos con lo que dice el backend
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
            // Volvemos al primer día sin redirigir a error
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

  // ─── UI ──────────────────────────────────────────────────────

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

  getWeatherIcon(code: number | null): string {
    if (code === null || code === undefined) return 'default';
    if (code === 0) return 'clear';
    if (code >= 1 && code <= 3) return 'cloudy';
    if ([51, 53, 55, 61, 63, 80].includes(code)) return 'light-rain';
    if ([65, 81, 82, 95, 96, 99].includes(code)) return 'heavy-rain';
    return 'cloudy';
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }

  getConditionColor(): string {
    const height = this.spot?.current_forecast?.wave_height ?? 0;
    if (height >= 1.5) return '#06D6A0';
    if (height >= 0.7) return '#FFD60A';
    return '#E63946';
  }

  getConditionLabel(): string {
    const height = this.spot?.current_forecast?.wave_height ?? 0;
    if (height >= 1.5) return 'ÉPICO HOY';
    if (height >= 0.7) return 'BUENO HOY';
    return 'FLOJO HOY';
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

  // ─── Toasts ──────────────────────────────────────────────────

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
}