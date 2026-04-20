import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { FavoriteService } from '../../services/favorite';
// Añadimos ToastController y AlertController
import { IonContent, IonIcon, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, images, trashOutline } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent, 
    IonIcon, 
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink, 
    HeaderComponent,
    FooterComponent
  ]
})
export class ProfilePage implements OnInit, OnDestroy {

  user: any = null;
  isLoading = true;
  isScrolled = false;

  profileForm: FormGroup;
  passwordForm: FormGroup;

  isUpdatingProfile = false;
  isUpdatingPassword = false;
  profileSuccess: string | null = null;
  profileError: string | null = null;
  passwordSuccess: string | null = null;
  passwordError: string | null = null;

  avatarPreview: string | null = null;
  selectedFile: File | null = null;

  activeTab: 'profile' | 'password' | 'danger' = 'profile';
  
  private destroy$ = new Subject<void>();
  favorites: any[] = [];
  alerts: any[] = [];
  currentSubscription: any = null;
  maxAlerts: number = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private favoriteService: FavoriteService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    // Inyectamos los controladores
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    addIcons({ cameraOutline, images, trashOutline });
    
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      bio: ['', [Validators.maxLength(255)]]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadFullUserData();

    this.favoriteService.favorites$
      .pipe(takeUntil(this.destroy$))
      .subscribe((favs: any[]) => {
        this.favorites = [...favs];
        this.cdr.detectChanges();
      });

    this.favoriteService.refreshFavorites();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadFullUserData() {
    this.isLoading = true;
    this.userService.getFullProfile().subscribe({
      next: (res) => {
        this.user = res.user;
        this.currentSubscription = res.active_subscription;
        this.maxAlerts = res.active_subscription?.plan?.max_alerts || 0;
        
        this.profileForm.patchValue({
          name: this.user.name,
          bio: this.user.bio ?? ''
        });

        this.refreshLists();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      }
    });
  }

  refreshLists() {
    this.userService.getAlerts().subscribe({
      next: (alerts) => {
        this.alerts = [...alerts];
        this.cdr.detectChanges();
      }
    });
  }

  // --- NUEVA LÓGICA DE ELIMINACIÓN CON TOAST/ALERT ---

  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'ELIMINAR CUENTA',
      message: this.currentSubscription 
        ? '¡CUIDADO! Tienes una suscripción activa. Si eliminas tu cuenta, perderás el acceso premium y se cancelarán los cobros de inmediato.' 
        : '¿Estás seguro? Todos tus spots y alertas se borrarán permanentemente.',
      cssClass: 'wax-custom-alert', // Asegúrate de añadir este estilo en global.scss
      buttons: [
        {
          text: 'CANCELAR',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'SÍ, ELIMINAR TODO',
          role: 'destructive',
          handler: () => {
            this.executeDeleteAccount();
          }
        }
      ]
    });

    await alert.present();
  }

  private executeDeleteAccount() {
    this.isLoading = true;
    this.userService.deleteAccount().subscribe({
      next: async () => {
        const toast = await this.toastController.create({
          message: 'Tu cuenta ha sido eliminada. ¡Buenas olas!',
          duration: 3000,
          position: 'bottom',
          cssClass: 'wax-toast'
        });
        await toast.present();
        
        this.authService.logout().subscribe(() => {
          this.router.navigate(['/login']);
        });
      },
      error: async (err) => {
        this.isLoading = false;
        const errorToast = await this.toastController.create({
          message: 'Error al eliminar la cuenta. Inténtalo de nuevo.',
          duration: 3000,
          color: 'danger'
        });
        await errorToast.present();
      }
    });
  }

  // --- FIN LÓGICA ELIMINACIÓN ---

  async eliminarAlerta(id: number) {
    this.alerts = [...this.alerts.filter(a => String(a.id) !== String(id))];
    this.cdr.detectChanges();

    try {
      await this.userService.deleteAlert(id).toPromise();
    } catch (error) {
      console.error('Error al borrar alerta:', error);
      this.refreshLists();
    }
  }

  async toggleFavorite(spotId: number) {
    this.favorites = this.favorites.filter(f => f.spot_id !== spotId);
    this.cdr.detectChanges();

    this.favoriteService.toggleFavorite(spotId).subscribe({
      error: () => this.favoriteService.refreshFavorites()
    });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.avatarPreview = e.target?.result as string;
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onUpdateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.isUpdatingProfile = true;
    this.profileSuccess = null;
    this.profileError = null;

    const formData = new FormData();
    formData.append('name', this.profileForm.value.name);
    formData.append('bio', this.profileForm.value.bio ?? '');
    if (this.selectedFile) formData.append('avatar', this.selectedFile);

    this.userService.updateProfile(formData).subscribe({
      next: (res) => {
        this.user = { ...this.user, ...res.user };
        this.profileSuccess = 'Perfil actualizado correctamente';
        this.isUpdatingProfile = false;
        this.selectedFile = null;
        this.authService.checkAuthStatus().subscribe();
      },
      error: (err) => {
        this.profileError = err.error?.message || 'Error al actualizar';
        this.isUpdatingProfile = false;
      }
    });
  }

  onChangePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.isUpdatingPassword = true;
    this.userService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordSuccess = 'Contraseña actualizada';
        this.passwordForm.reset();
        this.isUpdatingPassword = false;
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Error al cambiar';
        this.isUpdatingPassword = false;
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('password_confirmation')?.value ? null : { passwordMismatch: true };
  }

  getInitial(): string { 
    return this.user?.name?.charAt(0)?.toUpperCase() ?? 'W'; 
  }

  getUserPlan(): string {
    if (this.currentSubscription?.plan?.name) {
      return this.currentSubscription.plan.name.toUpperCase();
    }
    return this.user?.role_name === 'admin' ? 'ADMIN' : 'SURFISTA';
  }

  setTab(tab: 'profile' | 'password' | 'danger') {
    this.activeTab = tab;
    this.profileSuccess = null;
    this.profileError = null;
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onScroll(event: any) { 
    this.isScrolled = event.detail.scrollTop > 50; 
  }
}