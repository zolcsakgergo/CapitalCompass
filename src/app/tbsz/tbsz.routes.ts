import { Routes } from '@angular/router';
import { TbszDashboardComponent } from './tbsz-dashboard/tbsz-dashboard.component';
import { TbszDetailComponent } from './tbsz-detail/tbsz-detail.component';

export const TBSZ_ROUTES: Routes = [
  {
    path: '',
    component: TbszDashboardComponent,
  },
  {
    path: ':id',
    component: TbszDetailComponent,
  },
];
