import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExcelComponent } from './views/excel/excel.component';

const routes: Routes = [
  { path: ':id', component: ExcelComponent },
  { path: '', component: ExcelComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
