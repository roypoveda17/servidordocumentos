import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';

import { InventarioComponent } from './inventario';
import { DocumentosService } from '../documentos.service';

describe('InventarioComponent', () => {
  let fixture: ComponentFixture<InventarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventarioComponent],
      providers: [
        provideHttpClient(),
        {
          provide: DocumentosService,
          useValue: {
            listarInventario: () =>
              of([
                {
                  cliente: 'Cliente Demo',
                  claveelectronica: '506123',
                  estado: 'aceptado',
                  monto: 1500,
                },
              ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InventarioComponent);
    await fixture.whenStable();
  });

  it('should create and render mobile inventory cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance).toBeTruthy();
    expect(compiled.querySelector('h2')?.textContent).toContain('Inventario');
    expect(compiled.querySelector('.doc-card')).toBeTruthy();
    expect(compiled.querySelector('#buscar-inventario')).toBeTruthy();
  });
});
