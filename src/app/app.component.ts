import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      main {
        height: 100vh;
        width: 100vw;
      }
    `,
  ],
})
export class AppComponent {
  title = 'investment-tracker';
}
