import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  template: `
  <h1>Servidor Documentos</h1>
  <nav>
    <a routerLink="/consulta">Consulta Factura</a>
  </nav>
  <router-outlet></router-outlet>
`
})
export class App {
  protected readonly title = signal('servidordocumentos');
}
