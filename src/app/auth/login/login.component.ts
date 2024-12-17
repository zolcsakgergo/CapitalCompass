import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { SignupComponent } from '../signup/signup.component';
import { MaterialSharedModule } from '../../shared/material-shared.module';
import { MaterialFormsModule } from '../../shared/material-forms.module';
import { MaterialFeedbackModule } from '../../shared/material-feedback.module';
import { MaterialDataModule } from '../../shared/material-data.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialSharedModule,
    MaterialFormsModule,
    MaterialFeedbackModule,
    MaterialDataModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private dialogRef: MatDialogRef<LoginComponent>,
    private dialog: MatDialog,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.error = '';
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: response => {
          console.log('Login successful', response);
          this.dialogRef.close(true);
          this.router.navigate(['/portfolio']);
        },
        error: error => {
          console.error('Login failed', error);
          this.error =
            error.error?.message ||
            'Login failed. Please check your credentials.';
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    }
  }

  openSignup() {
    this.dialogRef.close();
    this.dialog.open(SignupComponent, {
      width: '400px',
      panelClass: 'auth-dialog',
      backdropClass: 'auth-dialog-backdrop',
      disableClose: false,
    });
  }
}
