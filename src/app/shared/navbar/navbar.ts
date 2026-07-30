import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);

  usuario = computed(() => this.authService.obtenerUsuario());

  logout(): void {
    this.authService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
