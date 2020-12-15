import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { environment } from '../../environments/environment';
import { LoginComponent } from '../login/login.component';
import { ListUserComponent } from "../user/list-user/list-user.component";
import { AddUserComponent } from "../user/add-user/add-user.component";
import { EditUserComponent } from "../user/edit-user/edit-user.component";
import { ListTypeComponent } from "../type/list-type/list-type.component";
import { EditTypeComponent } from "../type/edit-type/edit-type.component";
import { ListAttrDefnComponent } from "../attrdefn/list-attrdefn/list-attrdefn.component";
import { EditAttrDefnComponent } from "../attrdefn/edit-attrdefn/edit-attrdefn.component";
import { ListThingComponent } from "../thing/list-thing/list-thing.component";
import { EditThingComponent } from "../thing/edit-thing/edit-thing.component";
import { ViewThingComponent } from "../thing/view-thing/view-thing.component";

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'list-user', component: ListUserComponent },
  { path: 'add-user', component: AddUserComponent },
  { path: 'edit-user', component: EditUserComponent },
  { path: 'list-type', component: ListTypeComponent },
  { path: 'edit-type', component: EditTypeComponent },
  { path: 'list-attrdefn', component: ListAttrDefnComponent },
  { path: 'edit-attrdefn', component: EditAttrDefnComponent },
  { path: 'list-thing', component: ListThingComponent },
  { path: 'edit-thing', component: EditThingComponent },
  { path: 'view-thing', component: ViewThingComponent },
  { path: '', component: environment.username == null ? LoginComponent : ListTypeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  declarations: []
})
export class AppRoutingModule { }
