import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DocumentosService, DocumentoInventario, ReporteResumen } from '../documentos.service';

@Component({
  selector: 'app-reporte',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte.html',
  styleUrl: './reporte.css',
})
export class ReporteComponent {
  readonly desde = signal('');
  readonly hasta = signal('');
  readonly estado = signal('');
  readonly q = signal('');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly resumen = signal<ReporteResumen | null>(null);

  constructor(private documentosService: DocumentosService) {}

  generar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.documentosService
      .generarReporte({
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        estado: this.estado() || undefined,
        q: this.q().trim() || undefined,
      })
      .subscribe({
        next: (data) => {
          this.resumen.set(data);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          // Fallback local: construir resumen desde inventario si el endpoint de reportes no existe aún
          if (err.status === 404) {
            this.cargarFallback();
            return;
          }
          this.error.set(
            (err.error && (err.error.error || err.error.mensaje)) ||
              'No se pudo generar el reporte.'
          );
          this.resumen.set(null);
          this.cargando.set(false);
        },
      });
  }

  private cargarFallback(): void {
    this.documentosService.listarInventario().subscribe({
      next: (rows) => {
        this.resumen.set(this.buildResumen(Array.isArray(rows) ? rows : []));
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          (err.error && (err.error.error || err.error.mensaje)) ||
            'No se pudo generar el reporte.'
        );
        this.resumen.set(null);
        this.cargando.set(false);
      },
    });
  }

  private buildResumen(rows: DocumentoInventario[]): ReporteResumen {
    const q = this.q().trim().toLowerCase();
    const estadoFiltro = this.estado().trim().toLowerCase();
    const desde = this.desde();
    const hasta = this.hasta();

    const filtered = rows.filter((doc) => {
      const estado = String(doc['estado'] ?? '').toLowerCase();
      const fecha = String(doc['fecha'] ?? doc['fechadocumento'] ?? '');
      const blob = [
        doc['claveelectronica'],
        doc['clave'],
        doc['cliente'],
        doc['nombrecliente'],
        doc['estado'],
      ]
        .join(' ')
        .toLowerCase();

      if (q && !blob.includes(q)) return false;
      if (estadoFiltro && !estado.includes(estadoFiltro)) return false;
      if (desde && fecha && fecha < desde) return false;
      if (hasta && fecha && fecha > hasta) return false;
      return true;
    });

    const num = (doc: DocumentoInventario) => {
      const raw = doc['monto'] ?? doc['total'] ?? 0;
      const n = Number(String(raw).replace(/[^0-9.-]/g, ''));
      return Number.isFinite(n) ? n : 0;
    };

    const aceptados = filtered.filter((d) => /acept|ok|autoriz/i.test(String(d['estado'] ?? ''))).length;
    const rechazados = filtered.filter((d) => /rechaz|error|anul/i.test(String(d['estado'] ?? ''))).length;

    return {
      total: filtered.length,
      aceptados,
      rechazados,
      pendientes: Math.max(filtered.length - aceptados - rechazados, 0),
      montoTotal: filtered.reduce((acc, d) => acc + num(d), 0),
      items: filtered.slice(0, 50),
    };
  }

  val(doc: DocumentoInventario, ...keys: string[]): string {
    for (const key of keys) {
      const value = doc[key] ?? doc[key.toLowerCase()];
      if (value != null && value !== '') {
        return String(value);
      }
    }
    return '—';
  }

  formatoMonto(value: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      maximumFractionDigits: 2,
    }).format(value || 0);
  }
}
