import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('SCI');
    expect(compiled.querySelector('.brand-text p')?.textContent).toContain('build 7');
    expect(compiled.querySelector('.brand-icon')).toBeTruthy();
    expect(compiled.querySelector('a[routerlink="/consulta"]')?.textContent).toContain('Consulta');
    expect(compiled.querySelector('a[routerlink="/inventario"]')?.textContent).toContain(
      'Inventario'
    );
    expect(compiled.querySelector('a[routerlink="/reporte"]')?.textContent).toContain('Reporte');
  });
});
