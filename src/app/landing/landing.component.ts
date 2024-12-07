import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  template: `
    <div class="landing-container">
      <nav class="navbar">
        <button mat-raised-button color="primary" (click)="navigateToLogin()">
          Login
        </button>
      </nav>

      <main class="hero-section">
        <div class="content">
          <h1>Track Your Investments<br />With Confidence</h1>
          <p class="subtitle">
            Simple, powerful tools to monitor and optimize your investment
            portfolio
          </p>

          <div class="cta-buttons">
            <button
              mat-raised-button
              color="primary"
              (click)="navigateToSignup()"
            >
              Get Started
            </button>
            <button mat-stroked-button color="primary" (click)="learnMore()">
              Learn More
            </button>
          </div>
        </div>

        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Portfolio Tracking</h3>
            <p>Monitor all your investments in one place</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📈</div>
            <h3>Performance Analytics</h3>
            <p>Detailed insights into your returns</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🔒</div>
            <h3>Secure Platform</h3>
            <p>Your data is always protected</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .landing-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #f6f8fb 0%, #f1f4f8 100%);
      }

      .navbar {
        padding: 1rem 2rem;
        display: flex;
        justify-content: flex-end;
      }

      .hero-section {
        padding: 4rem 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .content {
        text-align: center;
        margin-bottom: 4rem;
      }

      h1 {
        font-size: 3rem;
        color: #2d3748;
        margin-bottom: 1.5rem;
        line-height: 1.2;
      }

      .subtitle {
        font-size: 1.25rem;
        color: #4a5568;
        margin-bottom: 2rem;
      }

      .cta-buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        padding: 2rem 0;
      }

      .feature-card {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease;
      }

      .feature-card:hover {
        transform: translateY(-5px);
      }

      .feature-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
      }

      h3 {
        color: #2d3748;
        margin-bottom: 0.5rem;
      }

      .feature-card p {
        color: #4a5568;
        line-height: 1.5;
      }

      @media (max-width: 768px) {
        h1 {
          font-size: 2rem;
        }

        .hero-section {
          padding: 2rem 1rem;
        }

        .features {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class LandingComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  learnMore() {
    const featuresSection = document.querySelector('.features');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  }
}
