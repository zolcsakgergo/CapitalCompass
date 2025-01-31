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
import { CustomValidators } from '../../shared/validators/custom.validators';

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
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  signupForm: FormGroup;
  hidePassword = true;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public dialogRef: MatDialogRef<SignupComponent>,
    private dialog: MatDialog,
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, CustomValidators.emailValidator]],
      password: ['', [Validators.required, CustomValidators.passwordValidator]],
    });
  }

  getErrorMessage(controlName: string): string {
    const control = this.signupForm.get(controlName);
    if (!control?.errors) return '';

    if (controlName === 'email') {
      if (control.errors['invalidFormat']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['invalidDomain']) {
        return `Email domain must be one of: ${control.errors['invalidDomain'].validDomains.join(', ')}`;
      }
    }

    if (controlName === 'password') {
      if (control.errors['minLength']) {
        return `Password must be at least ${control.errors['minLength'].required} characters long`;
      }
      if (control.errors['upperCase']) {
        return `Password must contain at least ${control.errors['upperCase'].required} uppercase letters`;
      }
      if (control.errors['number']) {
        return 'Password must contain at least one number';
      }
      if (control.errors['specialChar']) {
        return 'Password must contain at least one special character';
      }
    }

    return 'This field is required';
  }

  onSubmit() {
    if (this.signupForm.valid) {
      this.authService.signup(this.signupForm.value).subscribe({
        next: () => {
          this.dialogRef.close(true);
          this.router.navigate(['/portfolio']);
        },
        error: error => {
          this.errorMessage =
            error.message || 'An error occurred during signup';
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
