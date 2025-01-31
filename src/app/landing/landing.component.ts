import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MaterialSharedModule } from '../shared/material-shared.module';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoginComponent } from '../auth/login/login.component';
import { SignupComponent } from '../auth/signup/signup.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MaterialSharedModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  isLoggedIn = false;

  constructor(
    private router: Router,
    private dialog: MatDialog,
    private authService: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isAuthenticated();
  }

  openLoginDialog() {
    if (this.isLoggedIn) {
      this.router.navigate(['/portfolio']);
      return;
    }

    const dialogRef = this.dialog.open(LoginComponent, {
      width: '400px',
      panelClass: 'auth-dialog',
      backdropClass: 'auth-dialog-backdrop',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.router.navigate(['/portfolio']);
      }
    });
  }

  openSignupDialog() {
    if (this.isLoggedIn) {
      this.snackBar.open(
        'You are already logged in. Please log out to create a new account.',
        'Close',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
        },
      );
      return;
    }

    const dialogRef = this.dialog.open(SignupComponent, {
      width: '400px',
      panelClass: 'auth-dialog',
      backdropClass: 'auth-dialog-backdrop',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.openLoginDialog();
      }
    });
  }

  learnMore() {
    const featuresSection = document.querySelector('.features');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  }
}
