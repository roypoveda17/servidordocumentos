import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { TerminalComponent } from './terminal';

describe('TerminalComponent', () => {
  let component: TerminalComponent;
  let fixture: ComponentFixture<TerminalComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TerminalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.startsWith('/api/terminal/productos'));
    req.flush({
      fuente: 'demo',
      productos: [
        { id: '1', codigo: 'P001', nombre: 'Producto demo', precio: 1000, categoria: 'General' },
      ],
    });
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render terminal POS UI', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Terminal');
    expect(compiled.querySelector('#buscar-terminal')).toBeTruthy();
    expect(compiled.textContent).toContain('Cobrar');
    expect(compiled.textContent).toContain('Producto demo');
  });
});
