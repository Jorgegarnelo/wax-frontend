import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'app-cookies',
  templateUrl: './cookies.page.html',
  styleUrls: ['./cookies.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, RouterLink, HeaderComponent, FooterComponent]
})
export class CookiesPage {
  isScrolled = false;
  onScroll(event: any) { this.isScrolled = event.detail.scrollTop > 50; }
}