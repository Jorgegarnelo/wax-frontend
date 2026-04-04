import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { SpotService } from '../../services/spot';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-webcams',
  templateUrl: './webcams.page.html',
  styleUrls: ['./webcams.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, RouterLink, HeaderComponent, FooterComponent]
})
export class WebcamsPage implements OnInit {

  webcams: any[] = [];
  isLoading = true;
  isScrolled = false;

  constructor(private spotService: SpotService) { }

  ngOnInit() {
    this.loadWebcams();
  }

  loadWebcams() {
    this.isLoading = true;
    this.spotService.getAllWebcams().subscribe({
      next: (webcams) => {
        this.webcams = webcams;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando webcams:', err);
        this.isLoading = false;
      }
    });
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}