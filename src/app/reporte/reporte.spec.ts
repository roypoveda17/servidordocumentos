import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { ReporteComponent } from './reporte';
import { DocumentosService } from '../documentos.service';

describe('ReporteComponent', () => {
  let fixture: ComponentFixture<ReporteComponent>;
  let component: ReporteComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteComponent],
      providers: [
        provideHttpClient(),
        {
          provide: DocumentosService,
          useValue: {
            generarReporte: () =>
              of({
                total: 2,
                aceptados: 1,
                rechazados: 0,
                pendientes: 1,
                montoTotal: 2500,
                items: [
                  {
                    cliente: 'Cliente Demo',
                    claveelectronica: '506123',
                    estado: 'aceptado',
                    monto: 2500,
                  },
                ],
              }),
            listarInventario: () => of([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReporteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and render mobile report filters', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(component).toBeTruthy();
    expect(compiled.querySelector('h2')?.textContent).toContain('Reporte');
    expect(compiled.querySelector('#desde')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')?.textContent).toContain(
      'Generar reporte'
    );
  });

  it('should show summary cards after generating', async () => {
    component.generar();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.stats')).toBeTruthy();
    expect(compiled.querySelector('.doc-card')).toBeTruthy();
  });
});
