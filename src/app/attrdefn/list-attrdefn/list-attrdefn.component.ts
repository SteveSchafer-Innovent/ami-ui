import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { formatDate, Location } from '@angular/common';

import { AttrDefn } from "../../model/attrdefn.model";
import { Type } from "../../model/type.model";
import { ApiService } from "../../service/api.service";
import { ListThingContextService } from "../../service/list-thing-context.service";

@Component({
  selector: 'app-list-attrdefn',
  templateUrl: './list-attrdefn.component.html',
  styleUrls: ['./list-attrdefn.component.css']
})
export class ListAttrDefnComponent implements OnInit {
  type: Type;
  attrdefns: AttrDefn[];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private apiService: ApiService,
    private listThingContextService: ListThingContextService
   ) { }

  ngOnInit(): void {
    if(!window.localStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
    this.route.paramMap.subscribe((params: ParamMap) => {
      let typeId = +params.get('typeId');
      this.apiService.getType(typeId).subscribe( data => {
        if(data.status != 200) {
          alert(data.message);
          return;
        }
        this.type = data.result;
        this.apiService.getAttrDefns(typeId).subscribe( data => {
          console.log('getAttrDefns', data);
          if(data.status != 200) {
            alert(data.message);
            return;
          }
          this.attrdefns = data.result;
        });
      });
    });
  }

  getTitle(): string {
    let title: string[] = [];
    if(this.type) {
      let typeName = this.type.name;
      typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
      title.push(typeName);
      title.push(' ');
    }
    title.push('Attributes');
    return title.join('');
  }

  add(): void {
    this.router.navigate(['edit-attrdefn', { 'typeId': this.type.id }]);
  }

  edit(attrdefn: AttrDefn): void {
    this.router.navigate(['edit-attrdefn', { 'id': attrdefn.id }]);
  }

  delete(attrdefn: AttrDefn) {
    this.apiService.deleteAttrDefn(attrdefn.id).subscribe( data => {
      if(data.status != 200) {
        alert(data.message);
      }
      this.apiService.getAttrDefns(this.type.id).subscribe( data => {
        this.attrdefns = data.result;
      });
    })
  }

  gotoTypes() {
    this.router.navigate(['list-type']);
  }

  gotoThings(): void {
    this.listThingContextService.setContext(null);
    this.router.navigate(['search', { 'typeId': this.type.id, 'query': '*' }]);
  }
}
