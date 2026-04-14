import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report-card',
  templateUrl: './report-card.component.html',
  standalone: true,
  imports: [CommonModule]
})
export class ReportCardComponent {
  @Input() report: any;
  @Output() denunciar = new EventEmitter<number>();

  onDenunciarClick(id: number) {
    this.denunciar.emit(id);
  }
}