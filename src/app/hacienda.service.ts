import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HaciendaService {
  constructor(private http: HttpClient) {}

  consultarFacturaLocal(clave: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`/api/facturas/${encodeURIComponent(clave)}`);
  }

  consultarFacturaHacienda(clave: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(
      `/api/hacienda/facturas/${encodeURIComponent(clave)}`
    );
  }

  crearTokenHacienda(): Observable<{ mensaje: string; token: string }> {
    return this.http.post<{ mensaje: string; token: string }>('/api/hacienda/token', {});
  }

  /** Conservado por compatibilidad con llamadas directas a Hacienda. */
  getToken(usuario: string, password: string, clientId: string, urlToken: string): Observable<any> {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'password',
      username: usuario,
      password,
    });

    return this.http.post<any>(urlToken, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }
}
