import { TestBed } from '@angular/core/testing';

import { Spot } from './spot';

describe('Spot', () => {
  let service: Spot;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Spot);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
