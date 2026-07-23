import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DocumentosService, DocumentoInventario } from '../documentos.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrl: './inventario.css',
})
export class InventarioComponent implements OnInit {
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly busqueda = signal('');
  readonly documentos = signal<DocumentoInventario[]>([]);

  readonly filtrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    const rows = this.documentos();
    if (!q) {
      return rows;
    }
    return rows.filter((doc) =>
      [this.val(doc, 'claveelectronica', 'clave'), this.val(doc, 'cliente', 'nombrecliente'), this.val(doc, 'estado')]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  constructor(private documentosService: DocumentosService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.documentosService.listarInventario().subscribe({
      next: (rows) => {
        this.documentos.set(Array.isArray(rows) ? rows : []);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(
          (err.error && (err.error.error || err.error.mensaje)) ||
            'No se pudo cargar el inventario de documentos.'
        );
        this.documentos.set([]);
        this.cargando.set(false);
      },
    });
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
}
