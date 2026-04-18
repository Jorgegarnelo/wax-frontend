import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, flagOutline, waterOutline } from 'ionicons/icons';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ReportCardComponent {
  
  private toastController = inject(ToastController);

  @Input() report: any;
  @Input() currentUserId: string | number | null = null;
  @Input() isAdmin: boolean = false;
  @Input() showSpotName: boolean = true;
  @Input() showDelete: boolean = true;
  @Output() denunciar = new EventEmitter<number>();
  @Output() borrar = new EventEmitter<number>();
  @Output() verDetalle = new EventEmitter<any>();

  isProcessing: boolean = false;

  constructor() {
    addIcons({ trashOutline, flagOutline, waterOutline });
  }

  async onDenunciarClick(id: number) {
    if (this.isProcessing) return;

    this.isProcessing = true;

    
    this.denunciar.emit(id);

     
    const toast = await this.toastController.create({
      message: 'Post reportado para revisión',
      duration: 2500,
      position: 'bottom',
      color: 'danger',
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

  canDelete(): boolean {
    // Si la página donde está la tarjeta prohíbe borrar devolvemos false
    if (!this.showDelete) return false;

    if (!this.report || (!this.currentUserId && !this.isAdmin)) {
      return false;
    }

    if (this.isAdmin) return true;

    return this.report.user_id != null && this.report.user_id == this.currentUserId;
}

  onBorrarClick(id: number) {
    this.borrar.emit(id);
  }

  getOptimizedImageUrl(url: string): string {
    if (!url || !url.includes('cloudinary')) return url;
    return url.replace('/upload/', '/upload/w_1000,c_limit,q_auto,f_auto/');
  }

  onCardClick() {
    this.verDetalle.emit(this.report);
  }
}