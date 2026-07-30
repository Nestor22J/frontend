import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Propiedad {
  id_propiedad?: number;
  id_agente: number;
  titulo: string;
  tipo_propiedad: 'casa' | 'departamento' | 'terreno' | 'local';
  modalidad: 'venta' | 'alquiler';
  precio: number;
  area_m2?: number;
  habitaciones?: number;
  banos?: number;
  descripcion?: string;
  direccion: string;
  distrito: string;
  ciudad?: string;
  estado?: 'disponible' | 'reservado' | 'vendido';
  fecha_publicacion?: string;
  nombre_agente?: string;
  correo_agente?: string;
  telefono_agente?: string;
  url_principal?: string;
  id_cliente_reservado?: number | null;
  nombre_cliente_reservado?: string;
  correo_cliente_reservado?: string;
  telefono_cliente_reservado?: string;
  dni_cliente_reservado?: string;
}

export interface ImagenPropiedad {
  id_imagen?: number;
  id_propiedad: number;
  url_imagen: string;
  es_principal: boolean;
  fecha_subida?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PropiedadService {
  private http = inject(HttpClient);
  private api = 'http://localhost:3000';

  listarPropiedades(): Observable<Propiedad[]> {
    return this.http.get<any>(`${this.api}/propiedades`).pipe(
      map(res => res.propiedades || [])
    );
  }

  obtenerPropiedad(id: number): Observable<Propiedad> {
    return this.http.get<Propiedad>(`${this.api}/propiedades/${id}`);
  }

  crearPropiedad(propiedad: Propiedad): Observable<any> {
    return this.http.post(`${this.api}/propiedades`, propiedad);
  }

  actualizarPropiedad(id: number, propiedad: Partial<Propiedad>): Observable<any> {
    return this.http.put(`${this.api}/propiedades/${id}`, propiedad);
  }

  eliminarPropiedad(id: number): Observable<any> {
    return this.http.delete(`${this.api}/propiedades/${id}`);
  }

  listarImagenes(idPropiedad: number): Observable<ImagenPropiedad[]> {
    return this.http.get<ImagenPropiedad[]>(`${this.api}/propiedades/${idPropiedad}/imagenes`);
  }

  subirImagen(idPropiedad: number, datos: { url_imagen: string; es_principal: boolean }): Observable<any> {
    return this.http.post(`${this.api}/propiedades/${idPropiedad}/imagenes`, datos);
  }

  hacerPrincipal(idImagen: number): Observable<any> {
    return this.http.patch(`${this.api}/imagenes/${idImagen}/principal`, {});
  }

  eliminarImagen(idImagen: number): Observable<any> {
    return this.http.delete(`${this.api}/imagenes/${idImagen}`);
  }
}
