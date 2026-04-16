import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular'; // Importamos ToastController
import { addIcons } from 'ionicons';
import { trashOutline, flagOutline, waterOutline } from 'ionicons/icons';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ReportCardComponent {
  // Inyectamos el controlador de avisos de Ionic
  private toastController = inject(ToastController);

  @Input() report: any;
  @Input() currentUserId?: string | number;
  @Input() isAdmin: boolean = false;
  @Output() denunciar = new EventEmitter<number>();
  @Output() borrar = new EventEmitter<number>();

  isProcessing: boolean = false;

  constructor() {
    addIcons({ trashOutline, flagOutline, waterOutline });
  }

  async onDenunciarClick(id: number) {
    if (this.isProcessing) return;

    this.isProcessing = true;
    
    // Emitimos al padre
    this.denunciar.emit(id);

    // Lanzamos la "cajita roja" de Ionic
    const toast = await this.toastController.create({
      message: 'Post reportado para revisión',
      duration: 2500,
      position: 'bottom',
      color: 'danger', // Fondo rojo
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await toast.present();

    // Bloqueo de seguridad para evitar spam de clics
    setTimeout(() => this.isProcessing = false, 3000);
  }

  canDelete(report: any): boolean {
    if (this.isAdmin) return true;
    if (!this.currentUserId || !report) return false;
    // Comprobamos que el ID del creador coincida con el usuario logueado
    return report.user_id === this.currentUserId;
  }

  onBorrarClick(id: number) {
    this.borrar.emit(id);
  }

  getOptimizedImageUrl(url: string): string {
    if (!url || !url.includes('cloudinary')) return url;
    return url.replace('/upload/', '/upload/w_1000,c_limit,q_auto,f_auto/');
  }
}