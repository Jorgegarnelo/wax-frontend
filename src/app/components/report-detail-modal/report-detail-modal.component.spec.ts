import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReportDetailModalComponent } from './report-detail-modal.component';

describe('ReportDetailModalComponent', () => {
  let component: ReportDetailModalComponent;
  let fixture: ComponentFixture<ReportDetailModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ReportDetailModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportDetailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
