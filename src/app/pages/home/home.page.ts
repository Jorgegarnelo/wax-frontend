import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SpotService } from '../../services/spot';
import { FavoriteService } from '../../services/favorite';
import { Spot, Forecast, Report } from '../../shared/models/spot.model';
import { RouterLink } from '@angular/router';
import { IonContent, } from '@ionic/angular/standalone';
import { ReportModalComponent } from '../../components/report-modal/report-modal.component';
import { ReportCardComponent } from '../../components/report-card/report-card.component';
import { takeUntil, catchError } from 'rxjs/operators';
import { Subject, forkJoin, of } from 'rxjs';


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

  // variables para el modal de reportes
  isReportModalOpen = false;
  selectedSpotForReport: number | null = null;
  selectedSpotName: string = '';

  constructor(
    private spotService: SpotService,
    private favoriteService: FavoriteService
  ) { }



  ngOnInit() {
    this.loadData();
    // Nos suscribimos al aviso de cambio de home spot para recargar los datos cuando cambie
    this.favoriteService.homeSpotChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadData();
      });
  }

  //Este método se ejecuta automáticamente cuando el usuario sale de la página
  ngOnDestroy() {
    // Emitimos señal para cancelar suscripciones activas
    this.destroy$.next();
    this.destroy$.complete();

    // Limpieza de seguridad: quitamos el bloqueo de scroll del body
    document.body.classList.remove('overflow-hidden');
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    // LANZAMOS TODO EN PARALELO
    // No esperamos a que terminen los spots para pedir el favorito
    forkJoin({
      allSpots: this.spotService.getSpots(),
      homeSpot: this.favoriteService.getHomeSpot().pipe(catchError(() => of(null)))
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (res: any) => {
        this.spots = res.allSpots;
        // Si el servidor nos da el favorito, lo ponemos. Si no, el primero por defecto
        this.featuredSpot = res.homeSpot ? res.homeSpot : res.allSpots[0];

        // En cuanto sabemos cuál es el spot destacado, lanzamos el forecast
        // pero quitamos el isLoading YA para que el resto del Home se vea
        if (this.featuredSpot) {
          this.loadForecast(this.featuredSpot.id);
          this.loadReports();
        }

        this.isLoading = false;
        
        // El carrusel se ajusta sin esperas de 150ms
        requestAnimationFrame(() => {
          if (this.spotCarrusel?.nativeElement) {
            this.spotCarrusel.nativeElement.scrollLeft = 0;
          }
        });
      },
      error: (err) => {
        console.error('Error:', err);
        this.isLoading = false;
      }
    });
  }

  // Tareas comunes al finalizar la carga de spots
  // Nota: Ahora se llama desde el subscribe de loadData directamente
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
    const confirmacion = confirm('¿Quieres reportar este contenido inapropiado?');
    if (confirmacion) {
      console.log('Reporte enviado a moderación:', reportId);
      alert('Gracias. Revisaremos el contenido en breve.');
    }
  }

  // Actualización del envío para limpiar el scroll del body
  onReportSubmitted() {
    this.isReportModalOpen = false;
    document.body.classList.remove('overflow-hidden');
    this.loadReports();
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