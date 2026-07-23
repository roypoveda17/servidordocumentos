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

export interface ProductoTerminal {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  categoria?: string;
}

export interface CatalogoTerminal {
  fuente: string;
  productos: ProductoTerminal[];
}

export interface TerminalVentaItem {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface TerminalVentaRequest {
  cliente: string;
  pago: 'efectivo' | 'tarjeta' | 'sinpe';
  subtotal: number;
  iva: number;
  total: number;
  items: TerminalVentaItem[];
}

export interface TerminalVentaResponse {
  ticket: string;
  cliente: string;
  pago: string;
  subtotal: number;
  iva: number;
  total: number;
  fecha: string;
  items: TerminalVentaItem[];
  persistido: boolean;
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

  listarProductosTerminal(q?: string): Observable<CatalogoTerminal> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<CatalogoTerminal>('/api/terminal/productos', { params });
  }

  registrarVentaTerminal(venta: TerminalVentaRequest): Observable<TerminalVentaResponse> {
    return this.http.post<TerminalVentaResponse>('/api/terminal/ventas', venta);
  }
}
