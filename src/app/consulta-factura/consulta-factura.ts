import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HaciendaService } from '../hacienda.service';

@Component({
  selector: 'app-consulta-factura',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consulta-factura.html'
})
export class ConsultaFacturaComponent {
  constructor(private haciendaService: HaciendaService) {}

  pedirToken() {
    this.haciendaService.getToken(
      'usuarioAPI',
      'claveAPI',
      'clientId',
      'https://api.hacienda.go.cr/fe/login'
    ).subscribe(token => {
      console.log('Token recibido:', token.access_token);
    });
  }
}
