import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { ConsultaFacturaComponent } from './consulta-factura';

describe('ConsultaFacturaComponent', () => {
  let component: ConsultaFacturaComponent;
  let fixture: ComponentFixture<ConsultaFacturaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaFacturaComponent],
      providers: [provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaFacturaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mobile consulta form', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Consulta de factura');
    expect(compiled.querySelector('#clave')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain('Consultar');
  });

  it('should wrap a long electronic key inside the result card', async () => {
    const clave = '50624081300310123456700100001010000000001199999999';
    component.factura.set({
      claveelectronica: clave,
      nombrecliente: 'Cliente de prueba con nombre bastante largo S.A.',
      total: '₡1.234.567,89',
      estado: 'aceptado',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const claveEl = compiled.querySelector('dd.wrap');
    expect(claveEl?.textContent).toContain(clave);
    expect(compiled.querySelector('.resultado')).toBeTruthy();
  });
});
