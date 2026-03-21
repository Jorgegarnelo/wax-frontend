import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, HeaderComponent]
})
export class HomePage implements OnInit {

  isScrolled = false;

  constructor() {}

  ngOnInit() {}

  onScroll(event: any) {
    this.isScrolled = event.detail.scrollTop > 50;
  }
}