import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, IonMenu, IonContent, MenuController } from '@ionic/angular/standalone';
import { AuthService } from './services/auth'; // Ajusta la ruta a tu servicio
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, IonMenu, IonContent, CommonModule, RouterLink],
})
export class AppComponent {
  constructor(
    public authService: AuthService, 
    private menuCtrl: MenuController
  ) {}

  getInitial(): string {
    return this.authService.getCurrentUser()?.name?.charAt(0) ?? '';
  }

  getFirstName(): string {
    return this.authService.getCurrentUser()?.name?.split(' ')?.[0] ?? '';
  }

  closeMenu() {
    this.menuCtrl.close();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.clear();
        sessionStorage.clear();
        this.closeMenu();
        window.location.href = '/login';
      },
      error: () => {
        localStorage.clear();
        window.location.href = '/login';
      }
    });
  }
}