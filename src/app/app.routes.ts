import { Routes } from '@angular/router';
import { ConsultaFacturaComponent } from './consulta-factura/consulta-factura';
import { InventarioComponent } from './inventario/inventario';
import { ReporteComponent } from './reporte/reporte';
import { TerminalComponent } from './terminal/terminal';

export const routes: Routes = [
  { path: 'consulta', component: ConsultaFacturaComponent },
  { path: 'inventario', component: InventarioComponent },
  { path: 'reporte', component: ReporteComponent },
  { path: 'terminal', component: TerminalComponent },
  { path: '', redirectTo: '/consulta', pathMatch: 'full' },
];
