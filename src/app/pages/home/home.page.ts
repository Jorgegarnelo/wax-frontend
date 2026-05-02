import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SpotService } from '../../services/spot';
import { FavoriteService } from '../../services/favorite';
import { ReportService } from '../../services/report';
import { AuthService } from '../../services/auth';
import { Spot, Forecast, Report } from '../../shared/models/spot.model';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ReportModalComponent } from '../../components/report-modal/report-modal.component';
import { ReportCardComponent } from '../../components/report-card/report-card.component';
import { ReportDetailModalComponent } from '../../components/report-detail-modal/report-detail-modal.component';
import { takeUntil, catchError } from 'rxjs/operators';
import { Subject, forkJoin, of } from 'rxjs';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';


@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    HeaderComponent,
    FooterComponent,
    RouterLink,
    ReportModalComponent,
    ReportCardComponent,
    ReportDetailModalComponent
  ]
})
export class HomePage implements OnInit, OnDestroy {

  @ViewChild('spotCarrusel', { static: false }) spotCarrusel!: ElementRef;

  isScrolled = false;
  spots: Spot[] = [];
  forecast: Forecast[] = [];
  reports: Report[] = [];
  featuredSpot: Spot | null = null;
  isLoading = true;
  private destroy$ = new Subject<void>();
  currentUserId: number | null = null;
  userIsAdmin: boolean = false;

  // Modales
  isReportModalOpen = false;
  selectedReport: Report | null = null;
  selectedSpotForReport: number | null = null;
  selectedSpotName: string = '';

  today = new Date();
  isLoggedIn = false;

  constructor(
    private spotService: SpotService,
    private favoriteService: FavoriteService,
    private reportService: ReportService,
    private authService: AuthService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.isLoggedIn = !!user;
        this.currentUserId = user ? user.id : null;
        this.userIsAdmin = this.authService.isAdmin();

        this.loadReports();
      });

    this.loadData();

    this.favoriteService.homeSpotChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.classList.remove('overflow-hidden');
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    forkJoin({
      allSpots: this.spotService.getSpots(),
      homeSpot: this.favoriteService.getHomeSpot().pipe(catchError(() => of(null)))
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.spots = res.allSpots;
          this.featuredSpot = res.homeSpot ? res.homeSpot : res.allSpots[0];
          this.finishLoading();
        },
        error: (err) => {
          console.error('Error:', err);
          this.isLoading = false;
        }
      });
  }

  private finishLoading() {
    if (this.featuredSpot) {
      this.loadForecast(this.featuredSpot.id);
      this.loadReports();
    }
    setTimeout(() => {
      if (this.spotCarrusel?.nativeElement) {
        this.spotCarrusel.nativeElement.scrollLeft = 0;
      }
    }, 150);
    this.isLoading = false;
  }

  // Lógica de Detalle
  abrirDetalle(report: Report) {
    this.selectedReport = report;
  }

  // Lógica de Creación
  async openReportModal(spotId?: number, spotName?: string) {
    if (!this.isLoggedIn) {
      const toast = await this.toastController.create({
        message: 'Inicia sesión para añadir un reporte',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
        buttons: [{ text: 'LOGIN', handler: () => this.router.navigate(['/login']) }]
      });
      await toast.present();
      return;
    }
    this.selectedSpotForReport = spotId || null;
    this.selectedSpotName = spotName || '';
    this.isReportModalOpen = true;
    document.body.classList.add('overflow-hidden');
  }

  onReportSubmitted(event: any) {
    this.isReportModalOpen = false;
    document.body.classList.remove('overflow-hidden');
    this.loadReports();
  }

  closeReportModal() {
    this.isReportModalOpen = false;
    document.body.classList.remove('overflow-hidden');
  }

  denunciar(reportId: number) {
    console.log('Denunciando reporte:', reportId);
  }

  async borrar(reportId: number) {
    const alert = await this.alertController.create({
      header: 'Eliminar reporte',
      message: '¿Estás seguro de que quieres eliminar este reporte?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => { this.ejecutarBorrado(reportId); }
        }
      ]
    });
    await alert.present();
  }

  private ejecutarBorrado(reportId: number) {
    this.reportService.deleteReport(reportId).subscribe({
      next: () => { this.loadReports(); },
      error: (err) => { console.error('Error al borrar:', err); }
    });
  }

  moverCarrusel(direccion: number) {
    this.spotCarrusel.nativeElement.scrollBy({
      left: 300 * direccion,
      behavior: 'smooth'
    });
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }

  loadForecast(spotId: number) {
    this.spotService.getForecast(spotId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.forecast = data.data ?? []; },
        error: (err) => console.error('Error forecast', err)
      });
  }

  loadReports() {
    this.spotService.getLatestReports()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => { this.reports = reports; },
        error: (err) => console.error('Error reports', err)
      });
  }

  getConditionColor(spot: Spot): string {
    const condition = spot.current_forecast?.condition;
    if (condition === 'epic') return '#06D6A0';
    if (condition === 'good') return '#FFD60A';
    return '#E63946';
  }

  getWeatherIcon(code: number | null | undefined): string {
    if (code === null || code === undefined) return 'unknown';
    if (code === 0 || code === 1) return 'sun';
    if (code === 2 || code === 3) return 'cloudy';
    if (code === 45 || code === 48) return 'fog';
    if (code >= 51 && code <= 57) return 'drizzle';
    if (code === 61 || code === 63) return 'rain';
    if (code === 65 || code === 66 || code === 67) return 'heavy-rain';
    if (code === 80 || code === 81 || code === 82) return 'showers';
    if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return 'snow';
    if (code === 95 || code === 96 || code === 99) return 'storm';
    return 'unknown';
  }

  getWeatherLabel(code: number | null | undefined): string {
    const labels: Record<string, string> = {
      'sun': 'Despejado',
      'cloudy': 'Nublado',
      'fog': 'Niebla',
      'drizzle': 'Llovizna',
      'rain': 'Lluvia',
      'heavy-rain': 'Lluvia intensa',
      'showers': 'Chubascos',
      'snow': 'Nieve',
      'storm': 'Tormenta',
      'unknown': 'Condición desconocida'
    };
    return labels[this.getWeatherIcon(code)] ?? 'Condición desconocida';
  }

  getConditionColorFeatured(): string {
    const condition = this.featuredSpot?.current_forecast?.condition;
    if (condition === 'epic') return '#06D6A0';
    if (condition === 'good') return '#FFD60A';
    return '#E63946';
  }

  getConditionLabelFeatured(): string {
    const condition = this.featuredSpot?.current_forecast?.condition;
    if (condition === 'epic') return 'ÉPICO HOY';
    if (condition === 'good') return 'BUENO HOY';
    return 'FLOJO HOY';
  }
}