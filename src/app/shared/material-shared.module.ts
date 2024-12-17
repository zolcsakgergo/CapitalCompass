import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';

const materialModules = [
  MatButtonModule,
  MatIconModule,
  MatDialogModule,
  MatSnackBarModule,
  MatToolbarModule,
  MatCardModule,
];

@NgModule({
  imports: materialModules,
  exports: materialModules,
})
export class MaterialSharedModule {}
