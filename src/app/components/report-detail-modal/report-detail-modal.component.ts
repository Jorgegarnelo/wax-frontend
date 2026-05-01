import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';


@Component({
  selector: 'app-report-detail-modal',
  templateUrl: './report-detail-modal.component.html',
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ReportDetailModalComponent {
  @Input() report: any;
  @Output() closed = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}