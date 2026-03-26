import { Component, OnInit, ViewChild, ElementRef } from '@angular/core'; // 1. Añadido ViewChild y ElementRef
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { SpotService } from '../../services/spot';
import { Spot, Forecast, Report } from '../../shared/models/spot.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, HeaderComponent, RouterLink]
})
export class HomePage implements OnInit {

  // 2. Referencia al elemento UL del HTML (el que tiene #spotCarrusel)
  @ViewChild('spotCarrusel', { static: false }) spotCarrusel!: ElementRef;

  isScrolled = false;
  spots: Spot[] = [];
  forecast: Forecast[] = [];
  reports: Report[] = [];
  featuredSpot: Spot | null = null;
  isLoading = true;

  constructor(private spotService: SpotService) {}

  ngOnInit() {
    this.loadData();
  }

  // 3. Función para las flechas
  moverCarrusel(direccion: number) {
    // 300px es el ancho de la card + el gap. 
    // Direccion será 1 (derecha) o -1 (izquierda)
    this.spotCarrusel.nativeElement.scrollBy({
      left: 300 * direccion,
      behavior: 'smooth'
    });
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }

 loadData() {
  this.isLoading = true;

  // Ahora getSpots() SÍ trae el current_forecast porque lo configuramos en Laravel
  this.spotService.getSpots().subscribe({
    next: (spots) => {
      this.spots = spots;
      this.featuredSpot = spots[0] ?? null;

      if (this.featuredSpot) {
        this.loadForecast(this.featuredSpot.id);
        this.loadReports(this.featuredSpot.id);
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

  loadReports(spotId: number) {
    this.spotService.getReports(spotId).subscribe({
      next: (reports) => {
        this.reports = reports.slice(0, 4);
      },
      error: (err) => console.error('Error cargando reports', err)
    });
  }
}