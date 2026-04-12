import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { UserService } from '../../services/user';
import { User } from '../../shared/models/auth.model';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent]
})
export class ProfilePage implements OnInit {

  user: User | null = null;
  isLoading = true;
  isScrolled = false;

  // Formularios
  profileForm: FormGroup;
  passwordForm: FormGroup;

  // Estado
  isUpdatingProfile = false;
  isUpdatingPassword = false;
  profileSuccess: string | null = null;
  profileError: string | null = null;
  passwordSuccess: string | null = null;
  passwordError: string | null = null;

  // Avatar
  avatarPreview: string | null = null;
  selectedFile: File | null = null;

  // Tabs
  activeTab: 'profile' | 'password' | 'danger' = 'profile';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
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
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading = true;
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          name: user.name,
          bio: user.bio ?? ''
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      }
    });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
      };
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
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
    }

    this.userService.updateProfile(formData).subscribe({
      next: (res) => {
        this.user = res.user;
        this.profileSuccess = 'Perfil actualizado correctamente';
        this.isUpdatingProfile = false;
        this.selectedFile = null;
        // Actualizamos el AuthService para que el header refleje el cambio
        this.authService.checkAuthStatus().subscribe();
      },
      error: (err) => {
        this.profileError = err.error?.message || 'Error al actualizar el perfil';
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
    this.passwordSuccess = null;
    this.passwordError = null;

    this.userService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordSuccess = 'Contraseña actualizada correctamente';
        this.passwordForm.reset();
        this.isUpdatingPassword = false;
      },
      error: (err) => {
        this.passwordError = err.error?.message || 'Error al cambiar la contraseña';
        this.isUpdatingPassword = false;
      }
    });
  }

  onDeleteAccount() {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

    this.userService.deleteAccount().subscribe({
      next: () => {
        this.authService.logout().subscribe({
          next: () => this.router.navigate(['/login']),
          error: () => this.router.navigate(['/login'])
        });
      },
      error: (err) => {
        this.profileError = err.error?.message || 'Error al eliminar la cuenta';
      }
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const pw = form.get('password')?.value;
    const pwc = form.get('password_confirmation')?.value;
    return pw === pwc ? null : { passwordMismatch: true };
  }

  getInitial(): string {
    return this.user?.name?.charAt(0)?.toUpperCase() ?? '';
  }

 getUserPlan(): string {
  const roleName = this.user?.role?.name?.toLowerCase();

  if (roleName === 'admin') {
    return 'WAX Admin';
  }

  if (this.user?.role_id === 1) {
    return 'WAX Admin';
  }

  return 'WAX Surfista';
}

  setTab(tab: 'profile' | 'password' | 'danger') {
    this.activeTab = tab;
    this.profileSuccess = null;
    this.profileError = null;
    this.passwordSuccess = null;
    this.passwordError = null;
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}
