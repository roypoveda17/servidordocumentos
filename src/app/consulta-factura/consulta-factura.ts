import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { HaciendaService } from '../hacienda.service';

@Component({
  selector: 'app-consulta-factura',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consulta-factura.html',
  styleUrl: './consulta-factura.css',
})
export class ConsultaFacturaComponent {
  readonly clave = signal('');
  readonly cargando = signal(false);
  readonly tokenOk = signal(false);
  readonly error = signal<string | null>(null);
  readonly factura = signal<Record<string, unknown> | null>(null);

  constructor(private haciendaService: HaciendaService) {}

  consultar(): void {
    const clave = this.clave().trim();
    this.error.set(null);
    this.factura.set(null);

    if (!clave) {
      this.error.set('Ingresá la clave electrónica.');
      return;
    }

    this.cargando.set(true);
    this.haciendaService.consultarFacturaLocal(clave).subscribe({
      next: (data) => {
        this.factura.set(data as Record<string, unknown>);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const msg =
          (err.error && (err.error.mensaje || err.error.error)) ||
          err.message ||
          'No se pudo consultar la factura.';
        this.error.set(String(msg));
        this.cargando.set(false);
      },
    });
  }

  pedirToken(): void {
    this.error.set(null);
    this.cargando.set(true);
    this.haciendaService.crearTokenHacienda().subscribe({
      next: () => {
        this.tokenOk.set(true);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        const msg =
          (err.error && (err.error.error || err.error.mensaje)) ||
          err.message ||
          'No se pudo obtener el token.';
        this.error.set(String(msg));
        this.tokenOk.set(false);
        this.cargando.set(false);
      },
    });
  }

  field(key: string): string {
    const data = this.factura();
    if (!data) {
      return '—';
    }
    const value = data[key] ?? data[key.toLowerCase()];
    return value == null || value === '' ? '—' : String(value);
  }
}
