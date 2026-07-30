import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Contrato {
  id_contrato?: number;
  id_propiedad: number;
  id_cliente: number;
  id_agente: number;
  tipo_contrato: 'compra-venta' | 'arrendamiento';
  precio_acordado: number;
  fecha_inicio: string;
  fecha_fin?: string;
  estado?: 'activo' | 'finalizado' | 'anulado';
  url_documento?: string;
  fecha_registro?: string;
  titulo_propiedad?: string;
  nombre_cliente?: string;
  nombre_agente?: string;
  metodo_pago?: 'contado' | 'financiado';
  cuota_inicial?: number;
  num_cuotas?: number;
  monto_cuota?: number;
}

export interface Documento {
  id_documento?: number;
  id_contrato?: number;
  id_propiedad?: number;
  tipo_documento: string;
  nombre_archivo: string;
  url_archivo: string;
  fecha_subida?: string;
}

export interface ContratoListResponse {
  total: number;
  contratos: Contrato[];
}

export interface DocumentoListResponse {
  total: number;
  documentos: Documento[];
}

@Injectable({
  providedIn: 'root'
})
export class ContratoService {
  private http = inject(HttpClient);
  private apiContratos = 'http://localhost:3000/contratos';
  private apiDocumentos = 'http://localhost:3000/documentos';

  listarContratos(): Observable<Contrato[]> {
    return this.http.get<any>(this.apiContratos).pipe(
      map(res => res.contratos || [])
    );
  }

  obtenerContrato(id: number): Observable<{ contrato: Contrato }> {
    return this.http.get<{ contrato: Contrato }>(`${this.apiContratos}/${id}`);
  }

  crearContrato(contrato: Contrato): Observable<any> {
    return this.http.post(this.apiContratos, contrato);
  }

  actualizarContrato(id: number, contrato: Partial<Contrato>): Observable<any> {
    return this.http.put(`${this.apiContratos}/${id}`, contrato);
  }

  eliminarContrato(id: number): Observable<any> {
    return this.http.delete(`${this.apiContratos}/${id}`);
  }

  listarDocumentos(): Observable<Documento[]> {
    return this.http.get<any>(this.apiDocumentos).pipe(
      map(res => res.documentos || [])
    );
  }

  crearDocumento(doc: Documento): Observable<any> {
    return this.http.post(this.apiDocumentos, doc);
  }

  eliminarDocumento(id: number): Observable<any> {
    return this.http.delete(`${this.apiDocumentos}/${id}`);
  }
}
