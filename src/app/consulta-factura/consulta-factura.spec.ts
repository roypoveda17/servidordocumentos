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
});
