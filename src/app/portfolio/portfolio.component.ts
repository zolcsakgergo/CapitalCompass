import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MaterialSharedModule } from '../shared/material-shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MaterialSharedModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
  ],
  templateUrl: './portfolio.component.html',
  styleUrls: ['./portfolio.component.css'],
})
export class PortfolioComponent {
  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
