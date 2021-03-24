import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExcelComponent } from './views/excel/excel.component';
import { ExecutionComponent } from './views/execution/execution.component';
import { FormComponent } from './views/form/form.component';

const routes: Routes = [
  { path: 'execution/:id', component: ExecutionComponent },
  { path: 'form/:id/:session', component: FormComponent },
  { path: ':id', component: ExcelComponent },
  { path: '', component: ExcelComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
