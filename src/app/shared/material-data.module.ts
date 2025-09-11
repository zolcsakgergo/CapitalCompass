import { NgModule } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

const materialModules = [
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatCardModule,
  MatDividerModule,
];

@NgModule({
  imports: materialModules,
  exports: materialModules,
})
export class MaterialDataModule {}
