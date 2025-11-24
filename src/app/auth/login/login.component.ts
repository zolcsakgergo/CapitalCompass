import { Component, Optional } from '@angular/core';
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
import { CustomValidators } from '../../shared/validators/custom.validators';

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
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  hidePassword = true;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    @Optional() public dialogRef: MatDialogRef<LoginComponent>,
    @Optional() private dialog: MatDialog,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, CustomValidators.emailValidator]],
      password: ['', [Validators.required, CustomValidators.passwordValidator]],
    });
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    if (!control) return '';

    if (control.hasError('required')) {
      return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }

    if (field === 'email') {
      if (control.hasError('invalidEmail')) {
        return 'Please enter a valid email address';
      }
      if (control.hasError('invalidDomain')) {
        return 'Please use a common email domain (e.g., gmail.com, yahoo.com)';
      }
    }

    if (field === 'password') {
      if (control.hasError('minlength')) {
        return 'Password must be at least 12 characters long';
      }
      if (control.hasError('insufficientUppercase')) {
        return 'Password must contain at least 2 uppercase letters';
      }
      if (control.hasError('missingNumber')) {
        return 'Password must contain at least 1 number';
      }
      if (control.hasError('missingSpecialChar')) {
        return 'Password must contain at least 1 special character';
      }
    }

    return '';
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: () => {
          if (this.dialogRef) {
            this.dialogRef.close();
          }
          this.router.navigate(['/portfolio']);
        },
        error: error => {
          this.errorMessage =
            error.error?.message || 'Login failed. Please try again.';
        },
      });
    }
  }

  openSignup() {
    if (this.dialog) {
      this.dialogRef?.close();
      this.dialog.open(SignupComponent);
    } else {
      this.router.navigate(['/signup']);
    }
  }
}
