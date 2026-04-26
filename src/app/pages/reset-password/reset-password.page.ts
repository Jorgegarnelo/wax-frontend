import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent]
})
export class ResetPasswordPage implements OnInit {

  resetForm: FormGroup;
  isLoading = false;
  isScrolled = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  token: string = '';
  email: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {
    this.resetForm = this.fb.group({
      password:              ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  ngOnInit() {
    // Leemos el token y email de los query params del enlace del email
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] ?? '';
      this.email = params['email'] ?? '';

      if (!this.token || !this.email) {
        this.errorMessage = 'El enlace no es válido. Solicita uno nuevo.';
      }
    });
  }

  onReset() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    this.http.post(`${environment.apiUrl}/auth/reset-password`, {
      token:                 this.token,
      email:                 this.email,
      password:              this.resetForm.value.password,
      password_confirmation: this.resetForm.value.password_confirmation
    }).subscribe({
      next: () => {
        this.successMessage = 'Contraseña restablecida correctamente. Redirigiendo...';
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'El enlace no es válido o ha expirado.';
        this.isLoading = false;
      }
    });
  }

  isInvalid(field: string): boolean {
    const control = this.resetForm.get(field);
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