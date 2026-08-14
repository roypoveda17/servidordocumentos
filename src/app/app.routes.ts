import { Routes } from '@angular/router';
import { ConsultaFacturaComponent } from './consulta-factura/consulta-factura';
import { InventarioComponent } from './inventario/inventario';
import { ReporteComponent } from './reporte/reporte';
import { CuentasComponent } from './cuentas/cuentas';

export const routes: Routes = [
  { path: 'cuentas', component: CuentasComponent },
  { path: 'consulta', component: ConsultaFacturaComponent },
  { path: 'inventario', component: InventarioComponent },
  { path: 'reporte', component: ReporteComponent },
  { path: '', redirectTo: '/cuentas', pathMatch: 'full' },
];
