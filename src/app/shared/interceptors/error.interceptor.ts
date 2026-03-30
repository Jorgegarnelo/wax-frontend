import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejo de Sesión (401)
      if (error.status === 401) {
        // Limpiamos los datos del usuario del almacenamiento local y del estado global
        sessionStorage.removeItem('wax_user');

        // Definimos qué rutas no deberían forzar un login si el servidor falla
        const publicRoutes = ['/home', '/spots', '/login', '/webcams'];
        const isPublicPage = publicRoutes.some(route => router.url.startsWith(route));
        
        // Identificamos si la petición que falló es el check automático inicial
        const isCheckAuth = req.url.includes('/auth/me');

        // SOLO redirigimos al login si el usuario está en una página privada y la petición que falló no es el checkAuth inicial (para evitar bucles infinitos)
        if (!isPublicPage && !isCheckAuth) {
          router.navigate(['/login']);
        }
      }

      // Otros errores de infraestructura
      if (error.status === 403) {
        router.navigate(['/error']); // Prohibido
      }
      
      if (error.status === 429) {
        console.warn('Rate limit alcanzado. El servidor está protegiéndose de demasiadas peticiones.');
      }

      if (error.status === 503) {
        router.navigate(['/maintenance']); // Servidor caído o en mantenimiento
      }

      if (error.status === 0) {
        // Error de red (CORS mal configurado o servidor apagado)
        console.error('No hay respuesta del servidor. Revisa tu conexión o el backend.');
        router.navigate(['/error']);
      }

      return throwError(() => error);
    })
  );
};