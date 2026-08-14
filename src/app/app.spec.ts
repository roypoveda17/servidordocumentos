import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render a mobile-safe facturación header', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.factura-header')).toBeTruthy();
    expect(compiled.querySelector('.factura-brand')?.textContent).toContain('SCI');
    expect(compiled.querySelector('.factura-company select')).toBeTruthy();
    expect(compiled.querySelector('.factura-rates')?.textContent).toContain('Compra');
    expect(compiled.querySelector('.factura-rates')?.textContent).toContain('Venta');
    expect(compiled.querySelector('.factura-links')?.textContent).toContain('Soporte WhatsApp');
    expect(compiled.querySelector('.factura-menu-btn')).toBeTruthy();
  });

  it('should keep module links inside the hamburger drawer', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance as App;
    app.menuOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[routerlink="/cuentas"]')?.textContent).toContain('Cuentas');
    expect(compiled.querySelector('a[routerlink="/consulta"]')?.textContent).toContain('Consulta');
    expect(compiled.querySelector('a[routerlink="/inventario"]')?.textContent).toContain(
      'Inventario'
    );
    expect(compiled.querySelector('a[routerlink="/reporte"]')?.textContent).toContain('Reporte');
  });
});
