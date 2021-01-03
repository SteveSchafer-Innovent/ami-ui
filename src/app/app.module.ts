import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { OwlDateTimeModule, OwlNativeDateTimeModule } from 'ng-pick-datetime';
import { NgxMdModule } from 'ngx-md';

import { AppRoutingModule } from './core/app-routing.module';
import { CustomMaterialModule } from "./core/material.module";
import { AppComponent } from './app.component';
import { ApiService } from "./service/api.service";
import { FileUploadService } from './service/file-upload.service';
import { ListThingContextService } from './service/list-thing-context.service';
import { Breadcrumbs } from './service/breadcrumbs.service';
import { TokenInterceptor } from "./core/interceptor";
import { LoginComponent } from './login/login.component';
import { ListUserComponent } from './user/list-user/list-user.component';
import { AddUserComponent } from './user/add-user/add-user.component';
import { EditUserComponent } from './user/edit-user/edit-user.component';
import { ChangePasswordComponent } from './user/password/change-password.component';
import { ListTypeComponent } from './type/list-type/list-type.component';
import { EditTypeComponent } from './type/edit-type/edit-type.component';
import { ListAttrDefnComponent } from './attrdefn/list-attrdefn/list-attrdefn.component';
import { EditAttrDefnComponent } from './attrdefn/edit-attrdefn/edit-attrdefn.component';
import { ListThingComponent } from './thing/list-thing/list-thing.component';
import { EditThingComponent } from './thing/edit-thing/edit-thing.component';
import { ViewThingComponent } from './thing/view-thing/view-thing.component';
import { DragDropDirective } from './dragdrop.directive';
import { PluralizePipe } from './pluralize.pipe';
import { CapitalizePipe } from './capitalize.pipe';
import { SearchComponent } from './search/search.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ListUserComponent,
    AddUserComponent,
    EditUserComponent,
    ChangePasswordComponent,
    ListTypeComponent,
    EditTypeComponent,
    ListAttrDefnComponent,
    EditAttrDefnComponent,
    ListThingComponent,
    EditThingComponent,
    ViewThingComponent,
    DragDropDirective,
    PluralizePipe,
    CapitalizePipe,
    SearchComponent
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FormsModule,
    CKEditorModule,
    CustomMaterialModule,
    AppRoutingModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    NgxMdModule.forRoot()
  ],
  providers: [
    ApiService,
    FileUploadService,
    ListThingContextService,
    Breadcrumbs,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
