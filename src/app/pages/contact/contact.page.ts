import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.page.html',
  styleUrls: ['./contact.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, ReactiveFormsModule, RouterLink, HeaderComponent, FooterComponent]
})
export class ContactPage {

  contactForm: FormGroup;
  isLoading = false;
  isScrolled = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.contactForm = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email:   ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      subject: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  onSubmit() {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    // Sanitización básica en el front antes de enviar
    const payload = {
      name:    this.contactForm.value.name?.trim(),
      email:   this.contactForm.value.email?.trim().toLowerCase(),
      subject: this.contactForm.value.subject?.trim(),
      message: this.contactForm.value.message?.trim()
    };

    this.http.post(`${environment.apiUrl}/contact`, payload).subscribe({
      next: () => {
        this.successMessage = 'Mensaje enviado correctamente. Te responderemos en breve.';
        this.isLoading = false;
        this.contactForm.reset();
      },
      error: () => {
        this.errorMessage = 'Error al enviar el mensaje. Inténtalo de nuevo.';
        this.isLoading = false;
      }
    });
  }

  isInvalid(field: string): boolean {
    const control = this.contactForm.get(field);
    return !!(control?.invalid && control?.touched);
  }

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}