import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonContent,
  MenuController
} from '@ionic/angular/standalone';
import { AuthService } from './services/auth';
import { UserService } from './services/user';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonContent
  ],
})
export class AppComponent implements OnInit {
  currentSubscription: any = null;

  constructor(
    public authService: AuthService,
    private userService: UserService,
    private menuCtrl: MenuController,
    private router: Router
  ) { }

  ngOnInit() {

    this.authService.currentUser$.subscribe(user => {
      if (user) {

        this.loadSubscription();
      } else {

        this.currentSubscription = null;
      }
    });
  }

  loadSubscription() {
    this.userService.getFullProfile().subscribe({
      next: (res) => {
        this.currentSubscription = res.active_subscription;
      },
      error: (err) => {
        console.error('Error al cargar suscripción:', err);
        this.currentSubscription = null;
      }
    });
  }

  getUserPlan(): string {

    if (this.currentSubscription?.plan?.name) {
      const name = this.currentSubscription.plan.name.toUpperCase();
      return name === 'SURFISTA' ? 'FREE' : name;
    }


    const user = this.authService.getCurrentUser();
    if (user?.role?.name === 'admin') return 'ADMIN';

    return 'FREE';
  }

  getInitial(): string {
    const user = this.authService.getCurrentUser();
    return user?.name?.charAt(0)?.toUpperCase() ?? 'W';
  }

  closeMenu() {
    this.menuCtrl.close();
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.currentSubscription = null;
        this.closeMenu();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}