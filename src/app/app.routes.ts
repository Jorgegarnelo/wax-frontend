import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth-guard';
import { adminGuard } from './shared/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
  },
  {
    path: 'spots',
    loadComponent: () => import('./pages/spots/spots.page').then(m => m.SpotsPage)
  },
  {
    path: 'spots/:id',
    loadComponent: () => import('./pages/spot-detail/spot-detail.page').then(m => m.SpotDetailPage)
  },
  {
    path: 'webcams',
    loadComponent: () => import('./pages/webcams/webcams.page').then(m => m.WebcamsPage)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'subscriptions',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/subscriptions/subscriptions.page').then(m => m.SubscriptionsPage)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found/not-found.page').then(m => m.NotFoundPage)
  },
  {
    path: 'error',
    loadComponent: () => import('./pages/error/error.page').then(m => m.ErrorPage)
  },
  {
    path: 'maintenance',
    loadComponent: () => import('./pages/maintenance/maintenance.page').then(m => m.MaintenancePage)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.page').then( m => m.ResetPasswordPage)
  },
  {
    path: 'privacy',
    loadComponent: () => import('./pages/privacy/privacy.page').then( m => m.PrivacyPage)
  },
  {
    path: 'cookies',
    loadComponent: () => import('./pages/cookies/cookies.page').then( m => m.CookiesPage)
  },

  {
    path: '**',
    redirectTo: 'not-found'
  },
  
  
];