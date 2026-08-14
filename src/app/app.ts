import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DocumentosService, EmpresaBar } from './documentos.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('SCI');
  readonly menuOpen = signal(false);
  readonly empresaId = signal('hottsun');
  readonly empresas = signal<EmpresaBar[]>([
    { id: 'hottsun', nombre: 'HOTTSUN S.A.', identificacion: '3101467571' },
  ]);
  readonly compra = signal('446.85');
  readonly venta = signal('452.18');

  readonly empresaLabel = computed(() => {
    const emp = this.empresas().find((e) => e.id === this.empresaId()) || this.empresas()[0];
    return emp ? `${emp.nombre} (${emp.identificacion})` : '';
  });

  constructor(
    private documentosService: DocumentosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.documentosService.sesionBar().subscribe({
      next: (sesion) => {
        if (sesion.empresas?.length) {
          this.empresas.set(sesion.empresas);
          this.empresaId.set(sesion.empresas[0].id);
        }
        if (sesion.compra) this.compra.set(sesion.compra);
        if (sesion.venta) this.venta.set(sesion.venta);
      },
      error: () => undefined,
    });
  }

  salir(): void {
    this.menuOpen.set(false);
    void this.router.navigateByUrl('/cuentas');
  }
}
