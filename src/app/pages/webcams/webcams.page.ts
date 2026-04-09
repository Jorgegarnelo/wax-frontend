import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SpotService } from '../../services/spot';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { WebcamModalComponent } from '../../components/webcam-modal/webcam-modal.component';

@Component({
  selector: 'app-webcams',
  templateUrl: './webcams.page.html',
  styleUrls: ['./webcams.page.scss'],
  standalone: true,
  
  imports: [
    IonContent, 
    CommonModule, 
    RouterLink, 
    HeaderComponent, 
    FooterComponent, 
    WebcamModalComponent
  ]
})
export class WebcamsPage implements OnInit {

  webcams: any[] = [];
  isLoading = true;
  isScrolled = false;

  selectedWebcamUrl: SafeResourceUrl | null = null;
  selectedWebcamName: string = '';
  selectedSpotName: string = ''; 
  selectedRawUrl: string = '';   

  constructor(
    private spotService: SpotService,
    private sanitizer: DomSanitizer
  ) { }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

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

  //Rellenamos todos los datos que pide el modal
  verWebcam(webcam: any) {
    this.selectedWebcamName = webcam.name;
    this.selectedSpotName = webcam.spot?.name || 'Asturias';
    this.selectedRawUrl = webcam.url; 
    
    // Esto activa el *ngIf del modal en el HTML
    this.selectedWebcamUrl = this.sanitizer.bypassSecurityTrustResourceUrl(webcam.url);

    // Bloqueamos el scroll del fondo
    document.body.classList.add('overflow-hidden');
  }

  cerrarWebcam() {
    this.selectedWebcamUrl = null;
    this.selectedWebcamName = '';
    this.selectedSpotName = '';
    this.selectedRawUrl = '';
    // Devolvemos el scroll a la normalidad
    document.body.classList.remove('overflow-hidden');
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}