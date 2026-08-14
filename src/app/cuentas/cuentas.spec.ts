import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CuentasComponent } from './cuentas';

describe('CuentasComponent', () => {
  let component: CuentasComponent;
  let fixture: ComponentFixture<CuentasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CuentasComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render gestión de cuentas for mobile', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h2')?.textContent).toContain('Gestión de Cuentas');
    expect(compiled.querySelector('.btn.caja')?.textContent).toContain('Caja');
    expect(compiled.textContent).toContain('Cuentas Abiertas');
  });
});
