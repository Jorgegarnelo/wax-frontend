import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent]
})
export class LoginPage implements OnInit, OnDestroy {

  activeTab: 'login' | 'register' = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  isScrolled = false;
  showLoginPassword = false;
  showRegisterPassword = false;
  showRegisterPasswordConfirm = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      remember: [false] 
    });

    // CORRECCIÓN: passwordMatchValidator como función pura fuera de la clase
    this.registerForm = this.fb.group({
      name:                  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email:                 ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password:              ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      password_confirmation: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ionViewWillEnter() {
    this.isLoading = false;
    this.errorMessage = null;
    this.loginForm.reset();
    this.registerForm.reset();
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: 'login' | 'register') {
    this.activeTab = tab;
    this.errorMessage = null;
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    // Sanitización básica en el front antes de enviar
    const value = {
      email:    this.loginForm.value.email?.trim().toLowerCase(),
      password: this.loginForm.value.password
    };

    this.authService.login(value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Credenciales incorrectas.';
          this.isLoading = false;
        }
      });
  }

  onRegister() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    // Sanitización básica en el front antes de enviar
    const value = {
      name:                  this.registerForm.value.name?.trim(),
      email:                 this.registerForm.value.email?.trim().toLowerCase(),
      password:              this.registerForm.value.password,
      password_confirmation: this.registerForm.value.password_confirmation
    };

    this.authService.register(value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.router.navigate(['/home']),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Error al registrarse. Inténtalo de nuevo.';
          this.isLoading = false;
        }
      });
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}

// Función pura fuera de la clase para el validador de contraseñas

function passwordMatchValidator(form: FormGroup) {
  const pw  = form.get('password')?.value;
  const pwc = form.get('password_confirmation')?.value;
  return pw === pwc ? null : { passwordMismatch: true };
}