import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

import { Type } from "../../model/type.model";
import { ApiService } from "../../service/api.service";
import { ListThingContextService } from "../../service/list-thing-context.service";
import { Breadcrumbs } from "../../service/breadcrumbs.service";

@Component({
  selector: 'app-list-type',
  templateUrl: './list-type.component.html',
  styleUrls: ['./list-type.component.css']
})
export class ListTypeComponent implements OnInit {
  types: Type[];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private listThingContextService: ListThingContextService,
    private breadcrumbs: Breadcrumbs
  ) { }

  ngOnInit(): void {
    if(!window.localStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
    this.breadcrumbs.clear();
    this.listThingContextService.setContext(null);
    this.apiService.getTypes().subscribe( data => {
      console.log('ListTypeComponent.ngOnInit.loadPage data', data);
      if(data.status === 401) {
        console.log('removing token');
        window.localStorage.removeItem('token');
        this.router.navigate(['list-type']);
      }
      if(data.status != 200) {
        alert(`Failed to load ListTypeComponent: ${data.message}`);
        return;
      }
      this.types = data.result;
    });
  }

  deleteType(type: Type): void {
    this.apiService.deleteType(type.id).subscribe( data => {
      if(data.status != 200) {
        alert(data.message);
        return;
      }
      this.apiService.getTypes().subscribe( data => {
        this.types = data.result;
      });
    })
  };

  editType(type: Type): void {
    this.router.navigate(['edit-type', { 'id': type.id }]);
  };

  addType(): void {
    this.router.navigate(['edit-type']);
  };

  attributes(type: Type): void {
    this.router.navigate(['list-attrdefn', { 'typeId': type.id }]);
  }

  things(type: Type): void {
    this.router.navigate(['list-thing', { 'typeId': type.id }]);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.types, event.previousIndex, event.currentIndex);
  }
}
