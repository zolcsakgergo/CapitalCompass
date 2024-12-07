import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { LoginComponent } from '../auth/login/login.component';
import { SignupComponent } from '../auth/signup/signup.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatToolbarModule,
    MatCardModule,
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
})
export class LandingComponent {
  constructor(
    private router: Router,
    private dialog: MatDialog,
  ) {}

  openLoginDialog() {
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
