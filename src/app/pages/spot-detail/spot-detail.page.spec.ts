import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpotDetailPage } from './spot-detail.page';

describe('SpotDetailPage', () => {
  let component: SpotDetailPage;
  let fixture: ComponentFixture<SpotDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
