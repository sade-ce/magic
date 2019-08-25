
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EndpointsComponent } from './components/endpoints/endpoints.component';
import { HomeComponent } from './components/home/home.component';
import { EvaluatorComponent } from './components/evaluator/evaluator.component';
import { FilesComponent } from './components/files/files.component';
import { CrudifyComponent } from './components/crudify/crudify.component';

const routes: Routes = [
  { path: 'files', component: FilesComponent },
  { path: 'crudify', component: CrudifyComponent },
  { path: 'endpoints', component: EndpointsComponent },
  { path: 'evaluator', component: EvaluatorComponent },
  { path: '', component: HomeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }