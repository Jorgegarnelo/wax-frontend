import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, flagOutline, waterOutline } from 'ionicons/icons';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ReportCardComponent {
  @Input() report: any;
  @Output() denunciar = new EventEmitter<number>();
  @Output() borrar = new EventEmitter<number>();

  constructor() {
    // Registramos los iconos para que estén disponibles en el HTML
    addIcons({ trashOutline, flagOutline, waterOutline });
  }

  onDenunciarClick(id: number) {
    this.denunciar.emit(id);
  }

  onBorrarClick(id: number) {
    this.borrar.emit(id);
  }


  getOptimizedImageUrl(url: string): string {
    if (!url || !url.includes('cloudinary')) return url;

    // Insertamos parámetros de optimización: 
    // w_1000: Calidad de sobra para Web Desktop y pantallas Retina de móvil
    // c_limit: Si la imagen original es más pequeña que 1000px, no la estira (evita pixelado)
    return url.replace('/upload/', '/upload/w_1000,c_limit,q_auto,f_auto/');
  }

  openImageModal(imageUrl: string) {

    console.log('Abriendo modal para la imagen:', imageUrl);
  }
}