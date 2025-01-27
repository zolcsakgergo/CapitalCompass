import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { LoginComponent } from '../login/login.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, MatCardModule, LoginComponent],
  template: `
    <div class="login-page">
      <mat-card>
        <app-login></app-login>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .login-page {
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      }
      mat-card {
        padding: 2rem;
        min-width: 300px;
        max-width: 400px;
        width: 90%;
      }
    `,
  ],
})
export class LoginPageComponent {}
