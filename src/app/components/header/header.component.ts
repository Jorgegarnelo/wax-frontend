import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { IonHeader, IonToolbar, IonButtons, MenuController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IonHeader, IonToolbar, IonButtons]
})
export class HeaderComponent {
  @Input() isScrolled = false;

  constructor(
    public authService: AuthService, 
    private router: Router,
    private menuCtrl: MenuController
  ) {}

  openMenu() {
    this.menuCtrl.open();
  }

  getFirstName(): string {
    return this.authService.getCurrentUser()?.name?.split(' ')?.[0] ?? '';
  }

  getInitial(): string {
    return this.authService.getCurrentUser()?.name?.charAt(0) ?? '';
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      },
      error: () => {
        localStorage.clear();
        window.location.href = '/login';
      }
    });
  }
}