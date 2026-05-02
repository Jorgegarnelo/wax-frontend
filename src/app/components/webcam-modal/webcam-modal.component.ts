import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-webcam-modal',
  templateUrl: './webcam-modal.component.html',
  styleUrls: ['./webcam-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class WebcamModalComponent {

  @Input() webcamName: string = '';
  @Input() spotName: string = '';
  @Input() set webcamUrl(url: string) {
    this.safeUrl = url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  }
  @Output() closed = new EventEmitter<void>();

  safeUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) { }

  close() {
    this.closed.emit();
  }

  getWebcamSource(spotName: string): string {
    const sources: Record<string, string> = {
      'San Lorenzo': 'Tablas Surf Shop',
      'Andrín': 'Viveros Los Piratas del Sablón',
      'Playa España': 'Terrazas Ipanema',
      'Playa de Vega': 'Ribadesella.es',
      'Xivares': 'Bar Restaurante Playa de Xivares',
      'Xagó': 'Vivienda Vacacional Juaco Quevedo',
      'Salinas': 'Real Balneario de Salinas',
      'Rodiles': 'Villaviciosa.es',
      'La Ñora': 'Bar Casa Pachu'
    };
    return sources[spotName] ?? 'Webcam local';
  }
}
