import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          sessionStorage.removeItem('wax_token');
          sessionStorage.removeItem('wax_user');
          router.navigate(['/login']);
          break;
        case 403:
          router.navigate(['/error']);
          break;
        case 429:
          console.warn('Rate limit alcanzado. Espera un momento.');
          break;
        case 503:
          router.navigate(['/maintenance']);
          break;
        case 0:
          router.navigate(['/error']);
          break;
      }
      return throwError(() => error);
    })
  );
};