import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpotsPage } from './spots.page';

describe('SpotsPage', () => {
  let component: SpotsPage;
  let fixture: ComponentFixture<SpotsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
