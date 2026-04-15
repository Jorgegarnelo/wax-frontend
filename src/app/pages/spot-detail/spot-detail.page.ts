import { Component, OnInit, OnDestroy } from '@angular/core';
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

@Component({
  selector: 'app-spot-detail',
  templateUrl: './spot-detail.page.html',
  styleUrls: ['./spot-detail.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, RouterLink, HeaderComponent, FooterComponent, WebcamModalComponent]
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

  days: { label: string; date: string }[] = [];
  selectedDate: string = '';

  selectedWebcamUrl: boolean = false;
  selectedRawUrl: string = '';
  selectedWebcamName: string = '';
  selectedSpotName: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private spotService: SpotService,
    private favoriteService: FavoriteService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.generateDays();

    // Escuchar estado de autenticación
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        if (this.spot && this.isLoggedIn) {
          this.checkIfIsFavorite(this.spot.id);
        } else if (!this.isLoggedIn) {
          this.isFavorite = false;
          this.isHome = false;
        }
      });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadSpot(id);
  }

  ngOnDestroy() {
    // Limpieza de suscripciones al salir
    this.destroy$.next();
    this.destroy$.complete();
    // Limpieza de seguridad por si el modal quedó abierto
    document.body.classList.remove('overflow-hidden');
  }

  // --- MÉTODOS DE AUTORIZACIÓN Y FAVORITOS ---

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

  async showSuccessToast(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      position: 'bottom',
      color: 'dark'
    });
    await toast.present();
  }

  // --- MÉTODOS DE CARGA DE DATOS ---

  loadSpot(id: string) {
    this.isLoading = true;
    this.spotService.getSpot(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (spot: Spot) => {
          this.spot = spot;
          if (this.isLoggedIn) this.checkIfIsFavorite(spot.id);
          this.loadForecastByDay(spot.id, this.selectedDate);
          this.loadReports(spot.id);
          this.loadWebcams(spot.id);
          this.isLoading = false;
        },
        error: () => this.isLoading = false
      });
  }

  loadForecastByDay(spotId: number, date: string) {
    this.isLoadingForecast = true;
    this.spotService.getForecastByDay(spotId, date)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.forecast = data.data ?? [];
          this.isLoadingForecast = false;
        },
        error: () => {
          this.forecast = [];
          this.isLoadingForecast = false;
        }
      });
  }

  getWeatherIcon(code: number | null): string {
    if (code === null || code === undefined) return 'default';

    if (code === 0) return 'clear';
    if (code >= 1 && code <= 3) return 'cloudy';
    if ([51, 53, 55, 61, 63, 80].includes(code)) return 'light-rain';
    if ([65, 81, 82, 95, 96, 99].includes(code)) return 'heavy-rain';

    return 'cloudy';
  }

  loadReports(spotId: number) {
    this.spotService.getReports(spotId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports: Report[]) => this.reports = reports.slice(0, 4)
      });
  }

  loadWebcams(spotId: number) {
    this.spotService.getWebcams(spotId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (webcams: any[]) => this.webcams = webcams
      });
  }

  // --- UTILIDADES ---

  generateDays() {
    this.days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      let label = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' :
        date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).replace('.', '');
      return { label, date: date.toISOString().split('T')[0] };
    });
    this.selectedDate = this.days[0].date;
  }

  selectDay(day: { label: string; date: string }) {
    this.selectedDate = day.date;
    if (this.spot) this.loadForecastByDay(this.spot.id, day.date);
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
}