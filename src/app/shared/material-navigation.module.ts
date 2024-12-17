import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MaterialSharedModule } from './material-shared.module';

@NgModule({
  imports: [MaterialSharedModule],
  exports: [
    MaterialSharedModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
  ],
})
export class MaterialNavigationModule {}
