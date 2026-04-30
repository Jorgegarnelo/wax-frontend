import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { trashOutline, flagOutline, waterOutline } from 'ionicons/icons';
import { ReportService } from '../../services/report';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ReportCardComponent {

  private toastController = inject(ToastController);
  private reportService = inject(ReportService);

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

    this.reportService.flagReport(id).subscribe({
      next: async () => {
        const toast = await this.toastController.create({
          message: 'Reporte denunciado. Lo revisaremos en breve.',
          duration: 2500,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
        this.denunciar.emit(id);
        this.isProcessing = false;
      },
      error: async (err) => {
        const mensaje = err.error?.message || 'Error al denunciar el reporte.';
        const toast = await this.toastController.create({
          message: mensaje,
          duration: 2500,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
        this.isProcessing = false;
      }
    });
  }

  canDelete(): boolean {
    if (!this.showDelete) return false;
    if (!this.report || (!this.currentUserId && !this.isAdmin)) return false;
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