import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RelativeListComponent } from './relative-list/relative-list.component';


const routes: Routes = [
  {
    path: '', component: RelativeListComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RelativeRoutingModule { }
