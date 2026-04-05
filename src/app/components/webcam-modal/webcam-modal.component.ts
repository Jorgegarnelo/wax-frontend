import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-webcam-modal',
  templateUrl: './webcam-modal.component.html',
  styleUrls: ['./webcam-modal.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class WebcamModalComponent {

  @Input() webcamName: string = '';
  @Input() spotName: string = '';
  @Input() set webcamUrl(url: string) {
    this.safeUrl = url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  }
  @Output() closed = new EventEmitter<void>();

  safeUrl: SafeResourceUrl | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  close() {
    this.closed.emit();
  }
}
