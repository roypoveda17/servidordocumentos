import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DocumentoInventario = Record<string, unknown>;

export interface ReporteFiltros {
  desde?: string;
  hasta?: string;
  estado?: string;
  q?: string;
}

export interface ReporteResumen {
  total: number;
  aceptados: number;
  rechazados: number;
  pendientes: number;
  montoTotal: number;
  items: DocumentoInventario[];
}

@Injectable({
  providedIn: 'root',
})
export class DocumentosService {
  constructor(private http: HttpClient) {}

  listarInventario(): Observable<DocumentoInventario[]> {
    return this.http.get<DocumentoInventario[]>('/api/archivoshacienda');
  }

  generarReporte(filtros: ReporteFiltros): Observable<ReporteResumen> {
    let params = new HttpParams();
    if (filtros.desde) params = params.set('desde', filtros.desde);
    if (filtros.hasta) params = params.set('hasta', filtros.hasta);
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.q) params = params.set('q', filtros.q);
    return this.http.get<ReporteResumen>('/api/reportes/documentos', { params });
  }
}
