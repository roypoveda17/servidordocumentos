import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HaciendaService {
  constructor(private http: HttpClient) {}

  getToken(usuario: string, password: string, clientId: string, urlToken: string): Observable<any> {
    const body = new HttpParams()
      .set('client_id', clientId)
      .set('grant_type', 'password')
      .set('username', usuario)
      .set('password', password);

    return this.http.post<any>(urlToken, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }
}
