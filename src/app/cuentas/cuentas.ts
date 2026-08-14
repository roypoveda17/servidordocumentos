import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CuentaBar, DocumentosService, ProductoBar } from '../documentos.service';

@Component({
  selector: 'app-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cuentas.html',
  styleUrl: './cuentas.css',
})
export class CuentasComponent implements OnInit {
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly ok = signal<string | null>(null);
  readonly cuentas = signal<CuentaBar[]>([]);
  readonly seleccionId = signal<string | null>(null);
  readonly productos = signal<ProductoBar[]>([]);
  readonly mostrarProductos = signal(false);
  readonly mostrarNueva = signal(false);
  readonly nuevaNombre = signal('');
  readonly nuevaPersonas = signal(1);

  readonly seleccionada = computed(
    () => this.cuentas().find((c) => c.id === this.seleccionId()) || null
  );

  constructor(private documentosService: DocumentosService) {}

  ngOnInit(): void {
    this.cargar();
    this.documentosService.listarProductosBar().subscribe({
      next: (res) => this.productos.set(res.productos || []),
      error: () => this.productos.set([]),
    });
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.documentosService.listarCuentas().subscribe({
      next: (rows) => {
        this.cuentas.set(Array.isArray(rows) ? rows : []);
        if (!this.seleccionId() && rows[0]) {
          this.seleccionId.set(rows[0].id);
        }
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          (err.error && (err.error.error || err.error.mensaje)) ||
            'No se pudieron cargar las cuentas abiertas.'
        );
        this.cargando.set(false);
      },
    });
  }

  seleccionar(cuenta: CuentaBar): void {
    this.seleccionId.set(cuenta.id);
    this.ok.set(null);
  }

  abrirNueva(): void {
    const nombre = this.nuevaNombre().trim();
    if (!nombre) {
      this.error.set('Escribí el nombre de la cuenta.');
      return;
    }
    this.error.set(null);
    this.documentosService.abrirCuenta(nombre, this.nuevaPersonas()).subscribe({
      next: (cuenta) => {
        this.cuentas.set([cuenta, ...this.cuentas()]);
        this.seleccionId.set(cuenta.id);
        this.nuevaNombre.set('');
        this.nuevaPersonas.set(1);
        this.mostrarNueva.set(false);
        this.ok.set(`Cuenta ${cuenta.nombre} abierta.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          (err.error && (err.error.error || err.error.mensaje)) || 'No se pudo abrir la cuenta.'
        );
      },
    });
  }

  agregarProducto(producto: ProductoBar): void {
    const cuenta = this.seleccionada();
    if (!cuenta) {
      this.error.set('Seleccioná una cuenta abierta.');
      return;
    }
    this.documentosService.agregarProductoCuenta(cuenta.id, producto.id, 1).subscribe({
      next: (actualizada) => {
        this.cuentas.set(this.cuentas().map((c) => (c.id === actualizada.id ? actualizada : c)));
        this.ok.set(`Agregado ${producto.nombre}.`);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          (err.error && (err.error.error || err.error.mensaje)) || 'No se pudo agregar el producto.'
        );
      },
    });
  }

  caja(): void {
    const cuenta = this.seleccionada();
    if (!cuenta) {
      this.error.set('Seleccioná una cuenta para ir a caja.');
      return;
    }
    this.ok.set(`Caja lista para ${cuenta.nombre}.`);
    this.mostrarProductos.set(false);
  }
}
