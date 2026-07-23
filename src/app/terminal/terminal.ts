import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  DocumentosService,
  ProductoTerminal,
  TerminalVentaRequest,
} from '../documentos.service';

interface LineaCarrito {
  producto: ProductoTerminal;
  cantidad: number;
}

@Component({
  selector: 'app-terminal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.css',
})
export class TerminalComponent implements OnInit {
  readonly cargandoProductos = signal(false);
  readonly cobrando = signal(false);
  readonly error = signal<string | null>(null);
  readonly ok = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly cliente = signal('Cliente contado');
  readonly pago = signal<'efectivo' | 'tarjeta' | 'sinpe'>('efectivo');
  readonly productos = signal<ProductoTerminal[]>([]);
  readonly carrito = signal<LineaCarrito[]>([]);
  readonly fuenteCatalogo = signal<string>('');

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const rows = this.productos();
    if (!q) return rows;
    return rows.filter((p) =>
      [p.codigo, p.nombre, p.categoria || ''].join(' ').toLowerCase().includes(q)
    );
  });

  readonly subtotal = computed(() =>
    this.carrito().reduce((acc, l) => acc + l.producto.precio * l.cantidad, 0)
  );
  readonly iva = computed(() => Math.round(this.subtotal() * 0.13 * 100) / 100);
  readonly total = computed(() => Math.round((this.subtotal() + this.iva()) * 100) / 100);
  readonly itemsCount = computed(() => this.carrito().reduce((acc, l) => acc + l.cantidad, 0));

  constructor(private documentosService: DocumentosService) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  crc(value: number): string {
    const n = Number.isFinite(value) ? value : 0;
    return `₡${n.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  cargarProductos(): void {
    this.cargandoProductos.set(true);
    this.error.set(null);
    this.documentosService.listarProductosTerminal(this.busqueda().trim() || undefined).subscribe({
      next: (res) => {
        this.productos.set(res.productos || []);
        this.fuenteCatalogo.set(res.fuente || '');
        this.cargandoProductos.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          (err.error && (err.error.error || err.error.mensaje)) ||
            'No se pudo cargar el catálogo del terminal.'
        );
        this.productos.set([]);
        this.cargandoProductos.set(false);
      },
    });
  }

  agregar(producto: ProductoTerminal): void {
    this.ok.set(null);
    this.error.set(null);
    const actual = [...this.carrito()];
    const idx = actual.findIndex((l) => l.producto.id === producto.id);
    if (idx >= 0) {
      actual[idx] = { ...actual[idx], cantidad: actual[idx].cantidad + 1 };
    } else {
      actual.push({ producto, cantidad: 1 });
    }
    this.carrito.set(actual);
  }

  setCantidad(productoId: string, cantidad: number): void {
    const n = Math.max(0, Math.floor(Number(cantidad) || 0));
    if (n === 0) {
      this.carrito.set(this.carrito().filter((l) => l.producto.id !== productoId));
      return;
    }
    this.carrito.set(
      this.carrito().map((l) => (l.producto.id === productoId ? { ...l, cantidad: n } : l))
    );
  }

  quitar(productoId: string): void {
    this.setCantidad(productoId, 0);
  }

  limpiar(): void {
    this.carrito.set([]);
    this.ok.set(null);
    this.error.set(null);
  }

  cobrar(): void {
    const items = this.carrito();
    if (items.length === 0) {
      this.error.set('Agregá al menos un producto al carrito.');
      return;
    }

    const payload: TerminalVentaRequest = {
      cliente: this.cliente().trim() || 'Cliente contado',
      pago: this.pago(),
      subtotal: this.subtotal(),
      iva: this.iva(),
      total: this.total(),
      items: items.map((l) => ({
        id: l.producto.id,
        codigo: l.producto.codigo,
        nombre: l.producto.nombre,
        precio: l.producto.precio,
        cantidad: l.cantidad,
      })),
    };

    this.cobrando.set(true);
    this.error.set(null);
    this.ok.set(null);
    this.documentosService.registrarVentaTerminal(payload).subscribe({
      next: (res) => {
        this.ok.set(`Venta ${res.ticket} registrada · ${this.crc(res.total)} · ${res.pago}`);
        this.carrito.set([]);
        this.cobrando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          (err.error && (err.error.error || err.error.mensaje)) ||
            'No se pudo registrar la venta en el terminal.'
        );
        this.cobrando.set(false);
      },
    });
  }
}
