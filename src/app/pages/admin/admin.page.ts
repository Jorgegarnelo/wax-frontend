import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonIcon, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { banOutline, giftOutline, trashOutline, personOutline, documentTextOutline, checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';

import { AdminService } from '../../services/admin';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    CommonModule,
    FormsModule,
    HeaderComponent,
    FooterComponent
  ]
})
export class AdminPage implements OnInit {

  isScrolled = false;
  activeTab: 'users' | 'reports' = 'users';
  isLoading = true;

  users: any[] = [];
  reports: any[] = [];

  plans: any[] = [
    { id: 2, name: 'PRO' },
    { id: 3, name: 'LEGEND' }
  ];

  giftModal: { visible: boolean, userId: number | null, userName: string } = {
    visible: false,
    userId: null,
    userName: ''
  };
  giftPlanId: number = 2;
  giftMonths: number = 1;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ banOutline, giftOutline, trashOutline, personOutline, documentTextOutline, checkmarkCircleOutline, closeCircleOutline });
  }

  ngOnInit() {
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/home']);
      return;
    }
    this.loadUsers();
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }

  setTab(tab: 'users' | 'reports') {
    this.activeTab = tab;
    if (tab === 'users' && this.users.length === 0) this.loadUsers();
    if (tab === 'reports' && this.reports.length === 0) this.loadReports();
  }

  loadUsers() {
    this.isLoading = true;
    this.adminService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadReports() {
    this.isLoading = true;
    this.adminService.getReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  async confirmBan(user: any) {
    const alert = await this.alertController.create({
      header: user.is_active ? 'Banear usuario' : 'Desbanear usuario',
      message: user.is_active
        ? `¿Seguro que quieres banear a ${user.name}?`
        : `¿Seguro que quieres desbanear a ${user.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: user.is_active ? 'Banear' : 'Desbanear',
          role: 'destructive',
          handler: () => this.banUser(user)
        }
      ]
    });
    await alert.present();
  }

  banUser(user: any) {
    this.adminService.banUser(user.id).subscribe({
      next: (res) => {
        user.is_active = res.is_active;
        this.cdr.detectChanges();
        this.showToast(res.message, 'dark');
      },
      error: () => this.showToast('Error al banear el usuario.', 'danger')
    });
  }

  openGiftModal(user: any) {
    this.giftModal = { visible: true, userId: user.id, userName: user.name };
    this.giftPlanId = 2;
    this.giftMonths = 1;
  }

  closeGiftModal() {
    this.giftModal = { visible: false, userId: null, userName: '' };
  }

  sendGift() {
    if (!this.giftModal.userId) return;
    this.adminService.giftSubscription(this.giftModal.userId, this.giftPlanId, this.giftMonths).subscribe({
      next: (res) => {
        this.showToast(res.message, 'dark');
        this.closeGiftModal();
        this.loadUsers();
      },
      error: () => this.showToast('Error al regalar la suscripción.', 'danger')
    });
  }

  async confirmDeleteReport(report: any) {
    const alert = await this.alertController.create({
      header: 'Eliminar reporte',
      message: '¿Seguro que quieres eliminar este reporte?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.deleteReport(report)
        }
      ]
    });
    await alert.present();
  }

  deleteReport(report: any) {
    this.adminService.deleteReport(report.id).subscribe({
      next: () => {
        this.reports = this.reports.filter(r => r.id !== report.id);
        this.showToast('Reporte eliminado correctamente.', 'dark');
      },
      error: () => this.showToast('Error al eliminar el reporte.', 'danger')
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });
    await toast.present();
  }

  getPlanColor(plan: string): string {
    if (plan === 'LEGEND') return 'text-orange-400';
    if (plan === 'PRO') return 'text-blue-400';
    return 'text-white/40';
  }
}