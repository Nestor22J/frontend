import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PerfilCliente {
  id_cliente: number;
  id_usuario: number;
  dni?: string;
  direccion?: string;
  ocupacion?: string;
  presupuesto_max?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private http = inject(HttpClient);
  private api = 'http://localhost:3000/clientes';

  obtenerPerfil(id_usuario: number): Observable<{ cliente: PerfilCliente }> {
    return this.http.get<{ cliente: PerfilCliente }>(`${this.api}/perfil/${id_usuario}`);
  }

  actualizarPerfil(id_usuario: number, datos: Partial<PerfilCliente>): Observable<{ mensaje: string; cliente: PerfilCliente }> {
    return this.http.put<{ mensaje: string; cliente: PerfilCliente }>(`${this.api}/perfil/${id_usuario}`, datos);
  }
}
