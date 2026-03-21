import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WebcamsPage } from './webcams.page';

describe('WebcamsPage', () => {
  let component: WebcamsPage;
  let fixture: ComponentFixture<WebcamsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(WebcamsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
