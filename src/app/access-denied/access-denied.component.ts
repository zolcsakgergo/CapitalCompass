import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="access-denied">
      <h1>Access Denied</h1>
      <div class="message">
        <p>You need to be logged in to access this page.</p>
        <p>Please log in or create an account to continue.</p>
      </div>
      <div class="actions">
        <a routerLink="/login" class="btn btn-primary">Login</a>
        <a routerLink="/signup" class="btn btn-secondary">Sign Up</a>
      </div>
    </div>
  `,
  styles: [
    `
      .access-denied {
        text-align: center;
        padding: 50px 20px;
        max-width: 600px;
        margin: 0 auto;
      }

      h1 {
        color: #dc3545;
        margin-bottom: 20px;
      }

      .message {
        margin-bottom: 30px;
      }

      .actions {
        display: flex;
        gap: 20px;
        justify-content: center;
      }

      .btn {
        padding: 10px 20px;
        border-radius: 5px;
        text-decoration: none;
        font-weight: bold;
      }

      .btn-primary {
        background-color: #007bff;
        color: white;
      }

      .btn-secondary {
        background-color: #6c757d;
        color: white;
      }
    `,
  ],
})
export class AccessDeniedComponent {}
