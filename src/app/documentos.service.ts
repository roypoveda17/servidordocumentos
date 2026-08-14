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

export interface EmpresaBar {
  id: string;
  nombre: string;
  identificacion: string;
}

export interface SesionBar {
  empresas: EmpresaBar[];
  compra: string;
  venta: string;
}

export interface LineaCuenta {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
}

export interface CuentaBar {
  id: string;
  nombre: string;
  atiende: string;
  estado: 'Abierta' | 'Cerrada';
  personas: number;
  items: LineaCuenta[];
}

export interface ProductoBar {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
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

  sesionBar(): Observable<SesionBar> {
    return this.http.get<SesionBar>('/api/bar/sesion');
  }

  listarCuentas(): Observable<CuentaBar[]> {
    return this.http.get<CuentaBar[]>('/api/bar/cuentas');
  }

  abrirCuenta(nombre: string, personas: number): Observable<CuentaBar> {
    return this.http.post<CuentaBar>('/api/bar/cuentas', { nombre, personas });
  }

  listarProductosBar(): Observable<{ productos: ProductoBar[] }> {
    return this.http.get<{ productos: ProductoBar[] }>('/api/bar/productos');
  }

  agregarProductoCuenta(
    cuentaId: string,
    productoId: string,
    cantidad: number
  ): Observable<CuentaBar> {
    return this.http.post<CuentaBar>(`/api/bar/cuentas/${encodeURIComponent(cuentaId)}/productos`, {
      productoId,
      cantidad,
    });
  }
}
