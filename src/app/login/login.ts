import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form states
  isRegister = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  // Login Form Model
  loginData = {
    correo: '',
    contrasena: ''
  };

  // Register Form Model
  registerData = {
    nombre: '',
    correo: '',
    contrasena: '',
    telefono: '',
    rol: 'cliente' as 'admin' | 'agente' | 'cliente',
    // Client specific fields (only basic data at registration)
    dni: '',
    direccion: '',
    // Agent specific fields
    especialidad: ''
  };

  toggleMode(): void {
    this.isRegister.update(val => !val);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onSubmitLogin(): void {
    if (!this.loginData.correo || !this.loginData.contrasena) {
      this.errorMessage.set('Por favor, complete todos los campos.');
      return;
    }

    this.authService.iniciarSesion(this.loginData).subscribe({
      next: (res) => {
        this.authService.guardarSesion(res.usuario);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error de login:', err);
        this.errorMessage.set(err.error?.mensaje || 'Error al iniciar sesión. Verifique sus credenciales.');
      }
    });
  }

  onSubmitRegister(): void {
    const { nombre, correo, contrasena, rol } = this.registerData;
    if (!nombre || !correo || !contrasena || !rol) {
      this.errorMessage.set('Por favor, complete los campos obligatorios (*).');
      return;
    }

    const payload: any = {
      nombre,
      correo,
      contrasena,
      telefono: this.registerData.telefono,
      rol
    };

    if (rol === 'cliente') {
      payload.dni = this.registerData.dni;
      payload.direccion = this.registerData.direccion;
    } else if (rol === 'agente') {
      payload.especialidad = this.registerData.especialidad;
    }

    this.authService.registrarUsuario(payload).subscribe({
      next: () => {
        this.successMessage.set('Registro exitoso. Ahora puede iniciar sesión.');
        this.isRegister.set(false);
        this.loginData.correo = correo;
        this.loginData.contrasena = '';
        this.errorMessage.set('');
      },
      error: (err) => {
        console.error('Error de registro:', err);
        this.errorMessage.set(err.error?.mensaje || 'Error al registrar el usuario.');
      }
    });
  }
}
