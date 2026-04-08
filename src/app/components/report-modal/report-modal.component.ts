import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SpotService } from '../../services/spot';
import { AuthService } from '../../services/auth';
import { Spot } from '../../shared/models/spot.model';

@Component({
  selector: 'app-report-modal',
  templateUrl: './report-modal.component.html',
  styleUrls: ['./report-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ReportModalComponent implements OnInit {

  @Input() spotId: number | null = null;
  @Input() spotName: string = '';
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  spots: Spot[] = [];
  form: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Preview de imagen
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private spotService: SpotService,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      spot_id:     [null, Validators.required],
      wave_height: [null, [Validators.required, Validators.min(0), Validators.max(20)]],
      wind_speed:  [null, [Validators.required, Validators.min(0), Validators.max(200)]],
      crowd_level: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      wave_rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment:     ['', [Validators.maxLength(500)]],
    });
  }

  ngOnInit() {
    // Si viene con spotId preseleccionado lo fijamos
    if (this.spotId) {
      this.form.patchValue({ spot_id: this.spotId });
    }
    this.loadSpots();
  }

  loadSpots() {
    this.spotService.getSpots().subscribe({
      next: (spots) => this.spots = spots,
      error: (err) => console.error('Error cargando spots:', err)
    });
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];

    // Validación de seguridad en cliente
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Solo se permiten imágenes JPG, PNG o WEBP.';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.errorMessage = 'La imagen no puede superar 2MB.';
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    this.errorMessage = null;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.errorMessage = 'Debes iniciar sesión para enviar un reporte.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('spot_id',     this.form.value.spot_id);
    formData.append('wave_height', this.form.value.wave_height);
    formData.append('wind_speed',  this.form.value.wind_speed);
    formData.append('crowd_level', this.form.value.crowd_level);
    formData.append('wave_rating', this.form.value.wave_rating);
    formData.append('comment',     this.form.value.comment ?? '');
    if (this.selectedFile) {
      formData.append('photo', this.selectedFile);
    }

    this.spotService.createReport(formData).subscribe({
      next: () => {
        this.successMessage = '¡Reporte enviado! Gracias por contribuir a la comunidad.';
        this.isSubmitting = false;
        setTimeout(() => {
          this.submitted.emit();
          this.close();
        }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al enviar el reporte.';
        this.isSubmitting = false;
      }
    });
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.invalid && control?.touched);
  }

  close() {
    this.closed.emit();
    document.body.classList.remove('overflow-hidden');
  }
}
