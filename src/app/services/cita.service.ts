import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Cita {
  id_cita?: number;
  id_propiedad: number;
  id_cliente: number;
  id_agente: number;
  fecha_hora: string;
  modalidad: 'presencial' | 'virtual';
  estado?: 'pendiente' | 'confirmada' | 'cancelada' | 'realizada';
  notas?: string;
  fecha_registro?: string;
  titulo_propiedad?: string;
  nombre_cliente?: string;
  nombre_agente?: string;
  telefono_cliente?: string;
  correo_cliente?: string;
  dni_cliente?: string;
  direccion_propiedad?: string;
  distrito_propiedad?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CitaService {
  private http = inject(HttpClient);
  private api = 'http://localhost:3000/citas';

  listarCitas(): Observable<Cita[]> {
    return this.http.get<any>(this.api).pipe(
      map(res => res.citas || [])
    );
  }

  obtenerCita(id: number): Observable<Cita> {
    return this.http.get<Cita>(`${this.api}/${id}`);
  }

  crearCita(cita: Cita): Observable<any> {
    return this.http.post(this.api, cita);
  }

  actualizarCita(id: number, cita: Partial<Cita>): Observable<any> {
    return this.http.put(`${this.api}/${id}`, cita);
  }

  eliminarCita(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
