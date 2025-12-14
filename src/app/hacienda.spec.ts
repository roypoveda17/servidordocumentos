import { TestBed } from '@angular/core/testing';

import { Hacienda } from './hacienda';

describe('Hacienda', () => {
  let service: Hacienda;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Hacienda);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
