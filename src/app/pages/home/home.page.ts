import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { SpotService } from '../../services/spot';
import { Spot, Forecast, Report } from '../../shared/models/spot.model';
import { RouterLink } from '@angular/router';
import { IonContent,} from '@ionic/angular/standalone';


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
    RouterLink
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

  constructor(private spotService: SpotService) {
    
  }



  ngOnInit() {
    this.loadData();
  }

  openReportModal() {
    console.log('Mañana creamos este modal para enviar reportes');
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