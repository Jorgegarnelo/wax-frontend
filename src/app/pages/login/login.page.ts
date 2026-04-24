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
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, ReactiveFormsModule, HeaderComponent, FooterComponent]
})
export class LoginPage implements OnInit, OnDestroy {

  activeTab: 'login' | 'register' | 'forgot' = 'login';
  loginForm: FormGroup;
  registerForm: FormGroup;
  forgotForm: FormGroup;

  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isScrolled = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.loginForm = this.fb.group({
      email:    ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]]
    });

    this.registerForm = this.fb.group({
      name:                  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email:                 ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password:              ['', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]],
      password_confirmation: ['', Validators.required]
    }, { validators: passwordMatchValidator });

    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]]
    });
  }

  ionViewWillEnter() {
    this.isLoading = false;
    this.errorMessage = null;
    this.successMessage = null;
    this.loginForm.reset();
    this.registerForm.reset();
    this.forgotForm.reset();
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

  setTab(tab: 'login' | 'register' | 'forgot') {
    this.activeTab = tab;
    this.errorMessage = null;
    this.successMessage = null;
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

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

  onForgotPassword() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    const email = this.forgotForm.value.email?.trim().toLowerCase();

    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Siempre mostramos el mismo mensaje por seguridad
          // (no revelar si el email existe o no)
          this.successMessage = 'Si existe una cuenta con ese email, recibirás un enlace en unos minutos.';
          this.isLoading = false;
          this.forgotForm.reset();
        },
        error: () => {
          // Mismo mensaje aunque falle — no revelar info
          this.successMessage = 'Si existe una cuenta con ese email, recibirás un enlace en unos minutos.';
          this.isLoading = false;
          this.forgotForm.reset();
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

function passwordMatchValidator(form: FormGroup) {
  const pw  = form.get('password')?.value;
  const pwc = form.get('password_confirmation')?.value;
  return pw === pwc ? null : { passwordMismatch: true };
}