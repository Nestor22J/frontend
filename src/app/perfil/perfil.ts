import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ClienteService } from '../services/cliente.service';
import { Navbar } from '../shared/navbar/navbar';
import { Footer } from '../shared/footer/footer';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Navbar, Footer],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class PerfilComponent implements OnInit {
  authService = inject(AuthService);
  private clienteService = inject(ClienteService);

  usuario = this.authService.obtenerUsuario();

  cargando = signal(true);
  guardando = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  perfilForm = {
    dni: '',
    direccion: '',
    ocupacion: '',
    presupuesto_max: null as number | null
  };

  ngOnInit(): void {
    if (!this.usuario || !this.usuario.id_usuario) {
      this.cargando.set(false);
      return;
    }
    this.clienteService.obtenerPerfil(this.usuario.id_usuario).subscribe({
      next: (res) => {
        const c = res.cliente;
        this.perfilForm.dni = c.dni || '';
        this.perfilForm.direccion = c.direccion || '';
        this.perfilForm.ocupacion = c.ocupacion || '';
        this.perfilForm.presupuesto_max = c.presupuesto_max ?? null;
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  guardarPerfil(): void {
    if (!this.usuario) return;
    this.guardando.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    const payload: any = {
      dni: this.perfilForm.dni || null,
      direccion: this.perfilForm.direccion || null,
      ocupacion: this.perfilForm.ocupacion || null,
      presupuesto_max: this.perfilForm.presupuesto_max ? Number(this.perfilForm.presupuesto_max) : null
    };

    this.clienteService.actualizarPerfil(this.usuario.id_usuario, payload).subscribe({
      next: () => {
        this.successMsg.set('¡Perfil actualizado correctamente!');
        this.guardando.set(false);
        setTimeout(() => this.successMsg.set(''), 4000);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.mensaje || 'Error al guardar el perfil.');
        this.guardando.set(false);
      }
    });
  }
}
