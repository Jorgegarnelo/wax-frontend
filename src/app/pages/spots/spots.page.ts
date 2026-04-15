import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { SpotService } from '../../services/spot';
import { Spot } from '../../shared/models/spot.model';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-spots',
  templateUrl: './spots.page.html',
  styleUrls: ['./spots.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent]
})
export class SpotsPage implements OnInit, OnDestroy {

  spots: Spot[] = [];
  filteredSpots: Spot[] = [];
  isLoading = true;
  isScrolled = false;

  // Filtros
  searchQuery = '';
  activeCondition: 'todos' | 'epico' | 'bueno' | 'flojo' = 'todos';
  activeSeabed: '' | 'Arena' | 'Roca' = '';
  activeDifficulty: '' | '1' | '2' | '3' | '4' | '5' = '';

  // El interruptor maestro para esta página
  private destroy$ = new Subject<void>();

  constructor(private spotService: SpotService) {}

  ngOnInit() {
    this.loadSpots();
  }

  // Limpieza al salir de la lista de spots
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSpots() {
    this.isLoading = true;
    this.spotService.getSpots()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (spots: Spot[]) => {
          this.spots = spots;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error cargando spots:', err);
          this.isLoading = false;
        }
      });
  }

  applyFilters() {
    this.filteredSpots = this.spots.filter(spot => {
      // Filtro de búsqueda
      const matchSearch = !this.searchQuery ||
        spot.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (spot.region?.toLowerCase().includes(this.searchQuery.toLowerCase()) ?? false);

      // Filtro de condición
      const height = spot.current_forecast?.wave_height ?? 0;
      const matchCondition =
        this.activeCondition === 'todos' ||
        (this.activeCondition === 'epico' && height >= 1.5) ||
        (this.activeCondition === 'bueno' && height >= 0.7 && height < 1.5) ||
        (this.activeCondition === 'flojo' && height < 0.7);

      // Filtro de fondo
      const matchSeabed = !this.activeSeabed ||
        (spot.seabed?.toLowerCase().includes(this.activeSeabed.toLowerCase()) ?? false);

      // Filtro de dificultad
      const matchDifficulty = !this.activeDifficulty ||
        spot.difficulty === parseInt(this.activeDifficulty);

      return matchSearch && matchCondition && matchSeabed && matchDifficulty;
    });
  }

  setCondition(condition: 'todos' | 'epico' | 'bueno' | 'flojo') {
    this.activeCondition = condition;
    this.applyFilters();
  }

  setSeabed(seabed: '' | 'Arena' | 'Roca') {
    this.activeSeabed = this.activeSeabed === seabed ? '' : seabed;
    this.applyFilters();
  }

  setDifficulty(difficulty: '' | '1' | '2' | '3' | '4' | '5') {
    this.activeDifficulty = this.activeDifficulty === difficulty ? '' : difficulty;
    this.applyFilters();
  }

  getConditionColor(spot: Spot): string {
    const height = spot.current_forecast?.wave_height ?? 0;
    if (height >= 1.5) return '#06D6A0';
    if (height >= 0.7) return '#FFD60A';
    return '#E63946';
  }

  getConditionLabel(spot: Spot): string {
    const height = spot.current_forecast?.wave_height ?? 0;
    if (height >= 1.5) return 'ÉPICO';
    if (height >= 0.7) return 'BUENO';
    return 'FLOJO';
  }

  getDifficultyDots(difficulty: number): boolean[] {
    return Array(5).fill(false).map((_, i) => i < difficulty);
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}