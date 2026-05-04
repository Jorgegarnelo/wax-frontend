import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { FavoriteService } from '../../services/favorite';
import { IonContent, IonIcon, ToastController, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, images, trashOutline, imagesOutline, peopleOutline, starOutline } from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { NotificationService } from '../../services/notification';

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
    private toastController: ToastController,
    private alertController: AlertController,
    private notificationService: NotificationService,
  ) {
    addIcons({ cameraOutline, images, trashOutline, imagesOutline, peopleOutline, starOutline });

    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      bio: ['', [Validators.maxLength(255)]]
    });

    this.passwordForm = this.fb.group({
      current_password: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ionViewWillEnter() {
    this.loadFullUserData();
    this.notificationService.refreshAlerts();
    this.favoriteService.refreshFavorites();
  }

  ngOnInit() {
    this.loadFullUserData();

    this.notificationService.alerts$
      .pipe(takeUntil(this.destroy$))
      .subscribe(alerts => {
        this.alerts = [...alerts];
        this.cdr.detectChanges();
      });

    this.notificationService.refreshAlerts();

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



  async confirmDeleteAccount() {
    const alert = await this.alertController.create({
      header: 'ELIMINAR CUENTA',
      message: this.currentSubscription
        ? '¡CUIDADO! Tienes una suscripción activa. Si eliminas tu cuenta, perderás el acceso premium y se cancelarán los cobros de inmediato.'
        : '¿Estás seguro? Todos tus spots y alertas se borrarán permanentemente.',
      cssClass: 'wax-custom-alert',
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

        sessionStorage.removeItem('wax_user');
        this.authService['currentUserSubject'].next(null);

        this.router.navigate(['/login']);
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


  async eliminarAlerta(id: number) {
    const alert = await this.alertController.create({
      header: 'Eliminar alerta',
      message: '¿Estás seguro de que quieres eliminar esta alerta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.notificationService.deleteSetting(id).toPromise();
              const toast = await this.toastController.create({
                message: 'Alerta eliminada correctamente.',
                duration: 2500,
                position: 'bottom',
                color: 'dark'
              });
              await toast.present();
            } catch (error) {
              console.error('Error al borrar alerta:', error);
              this.notificationService.refreshAlerts();
            }
          }
        }
      ]
    });
    await alert.present();
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


  getInitial(): string {
    return this.user?.name?.charAt(0)?.toUpperCase() ?? 'W';
  }

  getUserPlan(): string {
    if (this.currentSubscription?.plan?.name) {
      return this.currentSubscription.plan.name.toUpperCase();
    }
    if (this.user?.role_name === 'admin') return 'ADMIN';
    return 'FREE';
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

function passwordMatchValidator(form: FormGroup) {
  const pass = form.get('password')?.value;
  const confirm = form.get('password_confirmation')?.value;
  return pass === confirm ? null : { passwordMismatch: true };
}