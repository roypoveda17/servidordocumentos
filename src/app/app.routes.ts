import { Routes } from '@angular/router';
import { ConsultaFacturaComponent } from '../app/consulta-factura/consulta-factura';

export const routes: Routes = [
  { path: 'consulta', component: ConsultaFacturaComponent },
  { path: '', redirectTo: '/consulta', pathMatch: 'full' }
];
