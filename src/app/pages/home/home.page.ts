import { Component, OnInit } from '@angular/core';
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

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }

  loadData() {
    this.spotService.getSpots().subscribe({
      next: (spots) => {
        this.spots = spots;
        this.featuredSpot = spots[0] ?? null;
        if (this.featuredSpot) {
          this.loadForecast(this.featuredSpot.id);
          this.loadReports(this.featuredSpot.id);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando spots', err);
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