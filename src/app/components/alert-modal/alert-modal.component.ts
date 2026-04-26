import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-alert-modal',
  templateUrl: './alert-modal.component.html',
  styleUrls: ['./alert-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class AlertModalComponent {

  @Input() spotId!: number;
  @Input() spotName!: string;
  @Output() closed = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  selectedCondition: 'poor' | 'good' | 'epic' | null = null;
  isLoading = false;

  constructor(
    private notificationService: NotificationService,
    private toastController: ToastController,
    private router: Router
  ) {}

  selectCondition(condition: 'poor' | 'good' | 'epic') {
    this.selectedCondition = condition;
  }

  close() {
    this.closed.emit();
  }

  async save() {
    if (!this.selectedCondition) return;

    this.isLoading = true;

    this.notificationService.createSetting(this.spotId, this.selectedCondition).subscribe({
      next: async () => {
        this.isLoading = false;
        this.created.emit();
        this.closed.emit();
        const toast = await this.toastController.create({
          message: 'Alerta creada correctamente.',
          duration: 2500,
          position: 'bottom',
          color: 'dark'
        });
        await toast.present();
      },
      error: async (err) => {
        this.isLoading = false;
        if (err.status === 403 && err.error?.limit_reached) {
          const toast = await this.toastController.create({
            message: 'Has alcanzado el límite de alertas de tu plan.',
            duration: 4000,
            position: 'bottom',
            color: 'warning',
            buttons: [{ text: 'Ver planes', handler: () => this.router.navigate(['/subscriptions']) }]
          });
          await toast.present();
        } else {
          const toast = await this.toastController.create({
            message: 'Error al crear la alerta.',
            duration: 3000,
            position: 'bottom',
            color: 'danger'
          });
          await toast.present();
        }
      }
    });
  }
}