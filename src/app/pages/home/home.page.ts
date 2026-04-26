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

  constructor(
    private spotService: SpotService,
    private favoriteService: FavoriteService,
    private reportService: ReportService,
    private authService: AuthService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) { }

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
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
  openReportModal(spotId?: number, spotName?: string) {
    this.selectedSpotForReport = spotId || null;
    this.selectedSpotName = spotName || '';
    this.isReportModalOpen = true;
    document.body.classList.add('overflow-hidden');
  }

  onReportSubmitted(event: any) {
    this.isReportModalOpen = false;
    document.body.classList.remove('overflow-hidden');

    if (event) {
      // Crea objeto con los datos del formulario
      const reporteVisual: any = {
        ...event,
        wave_height: event.wave_height,
        wave_rating: event.wave_rating,
        comment: event.comment,
        photo_url: event.temp_photo || null,
        user: { name: 'Tú' },
        spot: { name: this.selectedSpotName || 'Spot' },
        created_at: new Date().toISOString()
      };


      this.reports = [reporteVisual, ...this.reports];

    }
  }
  closeReportModal() {
    this.isReportModalOpen = false;
    document.body.classList.remove('overflow-hidden');
  }

  denunciar(reportId: number) {
    console.log('Denunciando reporte:', reportId);
  }

  async borrar(reportId: number) {
    const actionSheet = await this.actionSheetController.create({
      header: '¿Eliminar este reporte?',
      subHeader: 'Esta acción no se puede deshacer',
      buttons: [
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => { this.ejecutarBorrado(reportId); }
        },
        { text: 'Cancelar', role: 'cancel', icon: 'close-outline' }
      ]
    });
    await actionSheet.present();
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

  getWeatherIcon(code: number | null): string {
    if (code === null) return 'unknown';
    if (code === 0) return 'clear';
    if (code >= 1 && code <= 3) return 'cloudy';
    if (code >= 51 && code <= 61) return 'light-rain';
    return code >= 63 ? 'heavy-rain' : 'unknown';
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