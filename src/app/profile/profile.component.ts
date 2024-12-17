import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialSharedModule } from '../shared/material-shared.module';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../auth/auth.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {
  RouterModule,
  RouterLink,
  RouterLinkActive,
  Router,
} from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MaterialSharedModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatCardModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatSidenav;
  userProfile: any;
  isHandset$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private breakpointObserver: BreakpointObserver,
    private router: Router,
  ) {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
      map(result => result.matches),
      shareReplay(),
    );
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.authService.getUserProfile().subscribe({
      next: profile => {
        this.userProfile = profile;
      },
      error: error => {
        console.error('Error loading profile:', error);
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
