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
import { IonContent, } from '@ionic/angular/standalone';
import { ReportModalComponent } from '../../components/report-modal/report-modal.component';
import { ReportCardComponent } from '../../components/report-card/report-card.component';
import { takeUntil, catchError } from 'rxjs/operators';
import { Subject, forkJoin, of } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { ActionSheetController } from '@ionic/angular';



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
    ReportCardComponent
  ]
})
export class HomePage implements OnInit, OnDestroy {

  // Referencia al elemento UL del HTML
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

  // variables para el modal de reportes
  isReportModalOpen = false;
  selectedSpotForReport: number | null = null;
  selectedSpotName: string = '';

  constructor(
    private spotService: SpotService,
    private favoriteService: FavoriteService,
    private reportService: ReportService,
    private authService: AuthService,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController
  ) { }



  ngOnInit() {
  // Escuchamos cambios de sesión
  this.authService.currentUser$
    .pipe(takeUntil(this.destroy$))
    .subscribe(user => {
      this.currentUserId = user ? user.id : null;
      this.userIsAdmin = this.authService.isAdmin();
      
      this.loadReports(); 
      
      console.log('Sesión actualizada:', { id: this.currentUserId, admin: this.userIsAdmin });
    });

  this.loadData();
  
  this.favoriteService.homeSpotChanged$
    .pipe(takeUntil(this.destroy$))
    .subscribe(() => {
      this.loadData();
    });
}

// Ya no necesitas llamar a cargarDatosUsuario() por separado porque la suscripción lo hace todo

  cargarDatosUsuario() {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user ? user.id : null;
    this.userIsAdmin = this.authService.isAdmin();
  }

  //Este método se ejecuta automáticamente cuando el usuario sale de la página
  ngOnDestroy() {
    // Emitimos señal para cancelar suscripciones activas
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

  // Tareas comunes al finalizar la carga de spots
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

  openReportModal(spotId?: number, spotName?: string) {
    this.selectedSpotForReport = spotId || null;
    this.selectedSpotName = spotName || '';
    this.isReportModalOpen = true;

    //Bloquear scroll del body si es necesario
    document.body.classList.add('overflow-hidden');
  }

  // funcion provisional
  denunciar(reportId: number) {

    console.log('Recibida señal de reporte para el ID:', reportId);

    //llama al servicio para guardar la denuncia en la base de datos
    /* this.spotService.reportContent(reportId).subscribe({
      next: () => console.log('Servidor actualizado'),
      error: (err) => console.error('Error al reportar', err)
    });
    */
  }

  // Actualización del envío para limpiar el scroll del body
  onReportSubmitted() {
    this.isReportModalOpen = false;
    document.body.classList.remove('overflow-hidden');
    this.loadReports();
  }


  async borrar(reportId: number) {
    const actionSheet = await this.actionSheetController.create({
      header: '¿Eliminar este reporte?',
      subHeader: 'Esta acción no se puede deshacer',
      cssClass: 'custom-action-sheet',
      buttons: [
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash-outline',
          handler: () => {
            this.ejecutarBorrado(reportId);
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel',
          icon: 'close-outline'
        }
      ]
    });
    await actionSheet.present();
  }


  private ejecutarBorrado(reportId: number) {
    this.reportService.deleteReport(reportId).subscribe({
      next: () => {
        this.loadReports();
        console.log('Borrado definitivo en el servidor');
      },
      error: (err) => {
        console.error('Error al borrar en el servidor:', err);
      }
    });
  }

  // Por si se cierra el modal sin enviar (botón cancelar/cerrar)
  closeReportModal() {
    this.isReportModalOpen = false;
    document.body.classList.remove('overflow-hidden');
  }

  //Función para las flechas
  moverCarrusel(direccion: number) {
    this.spotCarrusel.nativeElement.scrollBy({
      left: 300 * direccion,
      behavior: 'smooth'
    });
  }

  // Función para detectar el scroll y cambiar el estilo del header
  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }


  // Función para cargar el forecast del spot destacado
  loadForecast(spotId: number) {
    this.spotService.getForecast(spotId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.forecast = data.data ?? [];
        },
        error: (err) => console.error('Error cargando forecast', err)
      });
  }

  // Función para cargar los últimos reports (sin filtrar por spot)
  loadReports() {
    this.spotService.getLatestReports()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          this.reports = reports;
        },
        error: (err) => console.error('Error cargando reports', err)
      });
  }

  //obtener el color de fondo del forecast según la altura de la ola
  getConditionColor(spot: Spot): string {
    const height = spot.current_forecast?.wave_height ?? 0;
    if (height >= 1.5) return '#06D6A0'; // (Buena mar)
    if (height >= 0.7) return '#FFD60A'; // (Fuerza media)
    return '#E63946';
  }

  // Mapeo de códigos WMO de Open-Meteo  SVGs
  getWeatherIcon(code: number | null): string {
    if (code === null) return 'unknown';

    // 0: Despejado -> Sol naranja
    if (code === 0) return 'clear';

    // 1, 2, 3: Nubes y claros / Nublado -> Nube gris
    if (code >= 1 && code <= 3) return 'cloudy';

    // 51 a 61: Llovizna y lluvia ligera -> Sol con lluvia 
    if (code >= 51 && code <= 61) return 'light-rain';

    // 63 en adelante: Lluvia moderada, fuerte o tormentas -> Nube con rayo
    if (code >= 63) return 'heavy-rain';

    return 'unknown';
  }

  // Para simular el login
  isLoggedIn: boolean = false;

}