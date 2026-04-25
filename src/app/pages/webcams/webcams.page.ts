import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SpotService } from '../../services/spot';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { WebcamModalComponent } from '../../components/webcam-modal/webcam-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
export class WebcamsPage implements OnInit, OnDestroy {

  webcams: any[] = [];
  isLoading = true;
  isScrolled = false;

  selectedWebcamUrl: SafeResourceUrl | null = null;
  selectedWebcamName: string = '';
  selectedSpotName: string = '';
  selectedRawUrl: string = '';

  private destroy$ = new Subject<void>();

  constructor(
    private spotService: SpotService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.loadWebcams();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.classList.remove('overflow-hidden');
  }

  loadWebcams() {
    this.isLoading = true;
    this.spotService.getAllWebcams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (webcams: any[]) => {
          this.webcams = webcams;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error cargando webcams:', err);
          this.isLoading = false;
        }
      });
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  trackById(index: number, webcam: any): number {
    return webcam.id;
  }

  verWebcam(webcam: any) {
    this.selectedWebcamName = webcam.name;
    this.selectedSpotName = webcam.spot?.name || 'Asturias';
    this.selectedRawUrl = webcam.url;
    this.selectedWebcamUrl = this.sanitizer.bypassSecurityTrustResourceUrl(webcam.url);
    document.body.classList.add('overflow-hidden');
  }

  cerrarWebcam() {
    this.selectedWebcamUrl = null;
    this.selectedWebcamName = '';
    this.selectedSpotName = '';
    this.selectedRawUrl = '';
    document.body.classList.remove('overflow-hidden');
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}