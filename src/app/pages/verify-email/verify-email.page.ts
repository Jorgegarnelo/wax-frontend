import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.page.html',
  styleUrls: ['./verify-email.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule]
})
export class VerifyEmailPage implements OnInit {

  mensaje = 'Verificando tu email...';
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    const hash = this.route.snapshot.queryParamMap.get('hash');
    const expires = this.route.snapshot.queryParamMap.get('expires');
    const signature = this.route.snapshot.queryParamMap.get('signature');

    this.http.get(`${environment.apiUrl}/auth/verify-email/${id}/${hash}?expires=${expires}&signature=${signature}`)
      .subscribe({
        next: () => {
          this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
            .subscribe({
              next: () => this.router.navigate(['/login'], { queryParams: { verified: 'true' } }),
              error: () => this.router.navigate(['/login'], { queryParams: { verified: 'true' } })
            });
        },
        error: () => {
          this.error = true;
          this.mensaje = 'El enlace de verificación no es válido o ha expirado.';
        }
      });
  }
}