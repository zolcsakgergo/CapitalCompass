import { NgModule } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';

// Feedback and progress indication Material modules
const materialModules = [
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatDialogModule,
];

@NgModule({
  imports: materialModules,
  exports: materialModules,
})
export class MaterialFeedbackModule {}
