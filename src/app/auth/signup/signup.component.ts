import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialSharedModule } from '../../shared/material-shared.module';
import { MaterialFormsModule } from '../../shared/material-forms.module';
import { MaterialFeedbackModule } from '../../shared/material-feedback.module';
import { MaterialDataModule } from '../../shared/material-data.module';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialSharedModule,
    MaterialFormsModule,
    MaterialFeedbackModule,
    MaterialDataModule,
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  signupForm: FormGroup;
  isLoading = false;
  error = '';
  success = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialogRef: MatDialogRef<SignupComponent>,
    private dialog: MatDialog,
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.isLoading = true;
      this.error = '';
      this.success = '';

      const userData = {
        firstName: this.signupForm.value.firstName,
        lastName: this.signupForm.value.lastName,
        email: this.signupForm.value.email,
        password: this.signupForm.value.password,
      };

      this.authService.register(userData).subscribe({
        next: response => {
          console.log('Registration successful:', response);
          this.success = 'Registration successful! Redirecting to login...';
          this.error = '';
          this.dialogRef.close(true);
        },
        error: err => {
          console.error('Registration failed:', err);
          this.error =
            err.error?.message || 'An error occurred during registration';
          this.success = '';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }

  openLogin() {
    this.dialogRef.close();
    this.dialog.open(LoginComponent, {
      width: '400px',
      panelClass: 'auth-dialog',
      backdropClass: 'auth-dialog-backdrop',
      disableClose: false,
    });
  }
}
