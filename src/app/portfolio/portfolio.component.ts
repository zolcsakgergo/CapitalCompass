import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
} from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatListModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  template: `
    <div class="portfolio-wrapper">
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav [mode]="'over'" [opened]="false" class="sidenav">
          <mat-toolbar>Menu</mat-toolbar>
          <mat-nav-list>
            <a
              mat-list-item
              routerLink="/portfolio"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              (click)="sidenav.close()"
            >
              <mat-icon matListItemIcon>dashboard</mat-icon>
              <span matListItemTitle>Dashboard</span>
            </a>
            <a
              mat-list-item
              routerLink="/portfolio/positions"
              routerLinkActive="active"
              (click)="sidenav.close()"
            >
              <mat-icon matListItemIcon>trending_up</mat-icon>
              <span matListItemTitle>Positions</span>
            </a>
            <a
              mat-list-item
              routerLink="/portfolio/transactions"
              routerLinkActive="active"
              (click)="sidenav.close()"
            >
              <mat-icon matListItemIcon>receipt_long</mat-icon>
              <span matListItemTitle>Transactions</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>

        <mat-sidenav-content>
          <mat-toolbar>
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
            <span>Portfolio Dashboard</span>
          </mat-toolbar>

          <div class="content">
            <router-outlet></router-outlet>
            <button
              mat-fab
              color="primary"
              class="logout-button"
              (click)="logout()"
              matTooltip="Logout"
            >
              <mat-icon>logout</mat-icon>
            </button>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styleUrls: ['./portfolio.component.css'],
})
export class PortfolioComponent {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
