import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RelativeRoutingModule } from './relative-routing.module';
import { RelativeListComponent } from './relative-list/relative-list.component';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [RelativeListComponent],
  imports: [
    CommonModule,
    RelativeRoutingModule,
    SharedModule
  ]
})
export class RelativeModule { }
