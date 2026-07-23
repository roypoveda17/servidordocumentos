import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { HaciendaService } from './hacienda.service';

describe('HaciendaService', () => {
  let service: HaciendaService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(HaciendaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
