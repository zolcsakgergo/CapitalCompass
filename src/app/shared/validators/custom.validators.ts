import { AbstractControl, ValidationErrors } from '@angular/forms';

export class CustomValidators {
  static passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value;

    if (!value) {
      return null;
    }

    const hasMinLength = value.length >= 12;
    const hasUpperCase = (value.match(/[A-Z]/g) || []).length >= 2;
    const hasNumber = /\d/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const errors: ValidationErrors = {};

    if (!hasMinLength) {
      errors['minLength'] = { required: 12, actual: value.length };
    }
    if (!hasUpperCase) {
      errors['upperCase'] = {
        required: 2,
        actual: (value.match(/[A-Z]/g) || []).length,
      };
    }
    if (!hasNumber) {
      errors['number'] = true;
    }
    if (!hasSpecialChar) {
      errors['specialChar'] = true;
    }

    return Object.keys(errors).length ? errors : null;
  }

  static emailValidator(control: AbstractControl): ValidationErrors | null {
    const value: string = control.value;

    if (!value) {
      return null;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValidFormat = emailRegex.test(value);

    const validDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
    ];
    const domain = value.split('@')[1]?.toLowerCase();
    const isValidDomain = validDomains.includes(domain);

    const errors: ValidationErrors = {};

    if (!isValidFormat) {
      errors['invalidFormat'] = true;
    }
    if (!isValidDomain) {
      errors['invalidDomain'] = { validDomains };
    }

    return Object.keys(errors).length ? errors : null;
  }
}
