import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('inkapolis_token');

  let peticion = req;
  if (token) {
    peticion = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(peticion);
};
