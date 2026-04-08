import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SpotService } from '../../services/spot';
import { Spot, Forecast, Report } from '../../shared/models/spot.model';
import { RouterLink } from '@angular/router';
import { IonContent,} from '@ionic/angular/standalone';
import { ReportModalComponent } from '../../components/report-modal/report-modal.component';


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
    ReportModalComponent
  ]
})
export class HomePage implements OnInit {

  // Referencia al elemento UL del HTML
  @ViewChild('spotCarrusel', { static: false }) spotCarrusel!: ElementRef;

  isScrolled = false;
  spots: Spot[] = [];
  forecast: Forecast[] = [];
  reports: Report[] = [];
  featuredSpot: Spot | null = null;
  isLoading = true;

  // variables para el modal de reportes
  isReportModalOpen = false;
  selectedSpotForReport: number | null = null;
  selectedSpotName: string = '';

  constructor(private spotService: SpotService) {
    
  }



  ngOnInit() {
    this.loadData();
  }

  openReportModal(spotId?: number, spotName?: string) {
    this.selectedSpotForReport = spotId || null;
    this.selectedSpotName = spotName || '';
    this.isReportModalOpen = true;
    
    //Bloquear scroll del body si es necesario
    document.body.classList.add('overflow-hidden');
  }

  // FUNCIÓN PARA CUANDO SE ENVÍA EL REPORTE
  // Manejo de denuncias (clic en la bandera)
  denunciar(reportId: number) {
    // Como usas cookies HTTPOnly, mañana validaremos que solo 
    // usuarios autenticados puedan disparar esto en el backend
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

  // Por si cierras el modal sin enviar (botón cancelar/cerrar)
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

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }


  //cargar datos
  loadData() {
    this.isLoading = true;

    this.spotService.getSpots().subscribe({
      next: (spots) => {
        this.spots = spots;
        this.featuredSpot = spots[0] ?? null;

        if (this.featuredSpot) {
          this.loadForecast(this.featuredSpot.id);
          this.loadReports();
        }

        // El pequeño delay para que el carrusel se posicione bien
        setTimeout(() => {
          if (this.spotCarrusel && this.spotCarrusel.nativeElement) {
            this.spotCarrusel.nativeElement.scrollLeft = 0;
          }
        }, 150);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando spots:', err);
        this.isLoading = false;
      }
    });
  }
  loadForecast(spotId: number) {
    this.spotService.getForecast(spotId).subscribe({
      next: (data) => {
        this.forecast = data.data ?? [];
      },
      error: (err) => console.error('Error cargando forecast', err)
    });
  }

  loadReports() {
    this.spotService.getLatestReports().subscribe({
      next: (reports) => {
        this.reports = reports;
      },
      error: (err) => console.error('Error cargando reports', err)
    });
  }

  getConditionColor(spot: Spot): string {
    const height = spot.current_forecast?.wave_height ?? 0;
    if (height >= 1.5) return '#06D6A0'; // Verde (Buena mar)
    if (height >= 0.7) return '#FFD60A'; // Amarillo (Fuerza media)
    return '#E63946';
  }

  // Para simular el login (mañana lo haremos real con Auth)
  isLoggedIn: boolean = false;

  
}