import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaFactura } from './consulta-factura';

describe('ConsultaFactura', () => {
  let component: ConsultaFactura;
  let fixture: ComponentFixture<ConsultaFactura>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaFactura]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultaFactura);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
