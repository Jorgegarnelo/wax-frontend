import { TestBed } from '@angular/core/testing';

import { Forecast } from './forecast';

describe('Forecast', () => {
  let service: Forecast;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Forecast);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
