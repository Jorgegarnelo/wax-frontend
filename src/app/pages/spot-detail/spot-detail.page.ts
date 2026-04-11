import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { SpotService } from '../../services/spot';
import { FavoriteService } from '../../services/favorite';
import { Spot, Forecast, Report } from '../../shared/models/spot.model';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { WebcamModalComponent } from '../../components/webcam-modal/webcam-modal.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-spot-detail',
  templateUrl: './spot-detail.page.html',
  styleUrls: ['./spot-detail.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, RouterLink, HeaderComponent, FooterComponent, WebcamModalComponent]
})
export class SpotDetailPage implements OnInit {

  spot: Spot | null = null;
  forecast: Forecast[] = [];
  reports: Report[] = [];
  webcams: any[] = [];
  isLoading = true;
  isLoadingForecast = false;
  isScrolled = false;
  isFavorite: boolean = false;
  isHome: boolean = false;

  days: { label: string; date: string }[] = [];
  selectedDate: string = '';

  // Variables para el control del modal
  selectedWebcamUrl: boolean = false;
  selectedRawUrl: string = '';
  selectedWebcamName: string = '';
  selectedSpotName: string = '';

  constructor(
    private route: ActivatedRoute,
    private spotService: SpotService,
    private favoriteService: FavoriteService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.generateDays();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.loadSpot(id);
  }

  // Verifica si el spot actual es favorito del usuario
  checkIfIsFavorite(spotId: number) {
    this.favoriteService.getFavorites().subscribe({
      next: (favs: any[]) => {
        const fav = favs.find(f => f.spot_id === spotId);
        this.isFavorite = !!fav;
        this.isHome = fav ? fav.is_home : false;
      },
      error: () => {
        this.isFavorite = false;
        this.isHome = false;
      }
    });
  }

  // Acción para agregar o quitar el spot de favoritos
  toggleFavorite() {
    if (!this.spot) return;
    this.favoriteService.toggleFavorite(this.spot.id).subscribe({
      next: () => {
        this.isFavorite = !this.isFavorite;
      },
      error: (err) => console.error('Error toggle favorite', err)
    });
  }

  // Acción para fijar el spot como principal en el Home
  setAsHome() {
    if (!this.spot) return;
    this.favoriteService.setHomeSpot(this.spot.id).subscribe({
      next: () => {
        this.isHome = true;
        console.log('Confirmado como Home');
      },
      error: (err) => console.error('Error al fijar home', err)
    });
  }
  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  // Lógica para abrir el modal
  verWebcam(webcam: any) {
    if (!webcam) return;
    this.selectedRawUrl = webcam.url;
    this.selectedWebcamName = webcam.name;
    this.selectedSpotName = this.spot?.name || '';
    this.selectedWebcamUrl = true;
  }

  // Lógica para cerrar el modal
  cerrarWebcam() {
    this.selectedWebcamUrl = false;
    this.selectedRawUrl = '';
    this.selectedWebcamName = '';
  }

  // Genera los próximos 7 días para la selección del forecast
  generateDays() {
    this.days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      let label = '';
      if (i === 0) label = 'Hoy';
      else if (i === 1) label = 'Mañana';
      else label = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).replace('.', '');
      return { label, date: date.toISOString().split('T')[0] };
    });
    this.selectedDate = this.days[0].date;
  }

  // Función para cargar los datos del spot
  loadSpot(id: string) {
    this.isLoading = true;
    this.spotService.getSpot(id).subscribe({
      next: (spot) => {
        this.spot = spot;
        this.checkIfIsFavorite(spot.id);
        this.loadForecastByDay(spot.id, this.selectedDate);
        this.loadReports(spot.id);
        this.loadWebcams(spot.id);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando spot:', err);
        this.isLoading = false;
      }
    });
  }

  // Función para seleccionar un día y cargar el forecast de ese día
  selectDay(day: { label: string; date: string }) {
    this.selectedDate = day.date;
    if (this.spot) this.loadForecastByDay(this.spot.id, day.date);
  }

  // Función para cargar el forecast filtrado por día
  loadForecastByDay(spotId: number, date: string) {
    this.isLoadingForecast = true;
    this.spotService.getForecastByDay(spotId, date).subscribe({
      next: (data) => { this.forecast = data.data ?? []; this.isLoadingForecast = false; },
      error: (err) => { console.error('Error cargando forecast', err); this.forecast = []; this.isLoadingForecast = false; }
    });
  }
  // Función para cargar los reports filtrados por spot
  loadReports(spotId: number) {
    this.spotService.getReports(spotId).subscribe({
      next: (reports) => this.reports = reports.slice(0, 4),
      error: (err) => console.error('Error cargando reports', err)
    });
  }

  // Función para cargar las webcams del spot
  loadWebcams(spotId: number) {
    this.spotService.getWebcams(spotId).subscribe({
      next: (webcams) => this.webcams = webcams,
      error: (err) => console.error('Error cargando webcams', err)
    });
  }

  //obtener el color de fondo del forecast según la altura de la ola
  getConditionColor(): string {
    const height = this.spot?.current_forecast?.wave_height ?? 0;
    if (height >= 1.5) return '#06D6A0';
    if (height >= 0.7) return '#FFD60A';
    return '#E63946';
  }

  //obtener la etiqueta de condición del forecast según la altura de la ola
  getConditionLabel(): string {
    const height = this.spot?.current_forecast?.wave_height ?? 0;
    if (height >= 1.5) return 'ÉPICO HOY';
    if (height >= 0.7) return 'BUENO HOY';
    return 'FLOJO HOY';
  }

  // Obtener un array de booleanos para mostrar los puntos de dificultad
  getDifficultyDots(): boolean[] {
    return Array(5).fill(false).map((_, i) => i < (this.spot?.difficulty ?? 0));
  }

  
  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}