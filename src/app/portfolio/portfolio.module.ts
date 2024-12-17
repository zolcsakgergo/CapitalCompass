import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialSharedModule } from '../shared/material-shared.module';
import { PORTFOLIO_ROUTES } from './portfolio.routes';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(PORTFOLIO_ROUTES),
    FormsModule,
    ReactiveFormsModule,
    MaterialSharedModule,
  ],
  exports: [RouterModule],
})
export class PortfolioModule {}
