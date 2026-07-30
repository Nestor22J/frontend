import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono?: string;
  rol: 'admin' | 'agente' | 'cliente';
  fecha_registro?: string;
  estado: boolean;
  id_cliente?: number;
  id_agente?: number;
}

export interface LoginResponse {
  mensaje: string;
  usuario: Usuario;
}

export interface RegistroResponse {
  mensaje: string;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private api = 'http://localhost:3000/auth';
  private userKey = 'inkapolis_usuario';

  constructor() {
    this.verificarYCompletarSesion();
  }

  verificarYCompletarSesion(): void {
    const user = this.obtenerUsuario();
    if (!user) return;

    if (user.rol === 'agente' && !user.id_agente) {
      this.http.get<any>(`http://localhost:3000/agentes`).subscribe({
        next: (res) => {
          const list = Array.isArray(res) ? res : (res.agentes || []);
          const matched = list.find((a: any) => a.id_usuario === user.id_usuario);
          if (matched) {
            user.id_agente = matched.id_agente;
            this.guardarSesion(user);
            window.location.reload();
          }
        }
      });
    }

    if (user.rol === 'cliente' && !user.id_cliente) {
      this.http.get<any>(`http://localhost:3000/clientes`).subscribe({
        next: (res) => {
          const list = Array.isArray(res) ? res : (res.clientes || []);
          const matched = list.find((c: any) => c.id_usuario === user.id_usuario);
          if (matched) {
            user.id_cliente = matched.id_cliente;
            this.guardarSesion(user);
            window.location.reload();
          }
        }
      });
    }
  }

  iniciarSesion(credenciales: { correo: string; contrasena: string; }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, credenciales);
  }

  registrarUsuario(datos: { nombre: string; correo: string; contrasena: string; rol: string; dni?: string; direccion?: string; ocupacion?: string; presupuesto_max?: number; especialidad?: string; }): Observable<RegistroResponse> {
    return this.http.post<RegistroResponse>(`${this.api}/registro`, datos);
  }

  guardarSesion(usuario: Usuario): void {
    localStorage.setItem(this.userKey, JSON.stringify(usuario));
  }

  obtenerUsuario(): Usuario | null {
    const userJson = localStorage.getItem(this.userKey);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as Usuario;
    } catch {
      this.cerrarSesion();
      return null;
    }
  }

  estaAutenticado(): boolean {
    return this.obtenerUsuario() !== null;
  }

  obtenerRol(): 'admin' | 'agente' | 'cliente' | null {
    const user = this.obtenerUsuario();
    return user ? user.rol : null;
  }

  esAdmin(): boolean {
    return this.obtenerRol() === 'admin';
  }

  esAgente(): boolean {
    return this.obtenerRol() === 'agente';
  }

  esCliente(): boolean {
    return this.obtenerRol() === 'cliente';
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.userKey);
  }
}
