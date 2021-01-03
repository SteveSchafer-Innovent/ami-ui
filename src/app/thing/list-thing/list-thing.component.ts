import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { formatDate, Location } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatTable } from '@angular/material/table';

import { switchMap, catchError, retry } from 'rxjs/operators';

import { Thing } from "../../model/thing.model";
import { FindThingResult } from "../../model/find-thing-result.model";
import { Type } from "../../model/type.model";
import { AttrDefn } from "../../model/attrdefn.model";
import { ApiService } from "../../service/api.service";
import { ListThingContextService, ListThingContext } from "../../service/list-thing-context.service";
import { Breadcrumbs, Breadcrumb } from "../../service/breadcrumbs.service";
import { pluralize, capitalize } from "../../core/common";

class MyAttrDefn extends AttrDefn {
  sorted: boolean;
  ascending: boolean;
}

class MyThing extends FindThingResult {
  sortOrder: number
}

@Component({
  selector: 'app-list-thing',
  templateUrl: './list-thing.component.html',
  styleUrls: ['./list-thing.component.css']
})
export class ListThingComponent implements OnInit {
  things: FindThingResult[] = []; // init so table has some data
  @ViewChild('table') table: MatTable<FindThingResult>;
  displayedColumns: string[] = [];
  type: Type;
  attrdefns: MyAttrDefn[];
  nameAttrDefn: MyAttrDefn;
  context: ListThingContext;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private apiService: ApiService,
    private listThingContextService: ListThingContextService,
    private breadcrumbs: Breadcrumbs,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    if(!window.localStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
    this.getParams();
  }

  getParams(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      let typeId = +params.get('typeId');
      console.log(`list-thing typeId = ${typeId}`);
      this.context = this.listThingContextService.getContext();
      this.getType(typeId);
    });
  }

  getType(typeId: number): void {
    this.apiService.getType(typeId).subscribe( data => {
      console.log('getType data', data);
      if(data.status != 200) {
        alert(`Failed to get type ${typeId}: ${data.message}`);
        return;
      }
      this.type = data.result;
      this.getAttrDefns(typeId);
    });
  }

  getAttrDefns(typeId: number): void {
    console.log(`enter getAttrDefns for typeId = ${typeId}`);
    this.apiService.getAttrDefns(typeId).subscribe( data => {
      console.log('ListThingComponent.getAttrDefns getAttrDefns data', data);
      if(data.status != 200) {
        alert(`Failed to get attribute definitions fortype ${typeId}: ${data.message}`);
        return;
      }
      this.attrdefns = data.result;
      let hasName = false;
      this.nameAttrDefn = null;
      for(let attrdefn of this.attrdefns) {
        attrdefn.sorted = false;
        attrdefn.ascending = false;
        if(attrdefn.name == 'name') {
          hasName = true;
          this.nameAttrDefn = attrdefn;
          break;
        }
      }
      if(hasName) {
        this.displayedColumns.push('name');
      }
      this.displayedColumns.push('created');
      for(let attrdefn of this.attrdefns || []) {
        if(attrdefn.showInList || attrdefn.editInList) {
          if(!this.context || attrdefn.id != this.context.linkAttrDefn.id) {
            this.displayedColumns.push(attrdefn.name);
          }
        }
      }
      this.displayedColumns.push('buttons');
      console.log('displayedColumns', this.displayedColumns);
      this.load();
    });
    console.log(`exit getAttrDefns for typeId = ${typeId}`);
  }

  private load() {
    let component = this;
    this.apiService.getThings(this.type.id).subscribe( data => {
      console.log('getThings data', data);
      if(data.status != 200) {
        alert("Failed to get things: " + data.message);
        return;
      }
      this.things = [];
      let setPresentation = function(attribute) {
        let values = attribute.value;
        attribute.linkedThings = [];
        for(let i = 0; i < values.length; i++) {
          let thingId = values[i];
          component.apiService.getThing(thingId).subscribe( data => {
            console.log('get linked thing data', data);
            if(data.status != 200) {
              alert("Failed to get linked thing: " + data.message);
              return;
            }
            let linkedThing = data.result;
            attribute.linkedThings[i] = linkedThing;
            if(linkedThing.attributes.name && linkedThing.attributes.name.value) {
              linkedThing.presentation = linkedThing.attributes.name.value;
            }
            else {
              linkedThing.presentation = `${linkedThing.type.name} ${thingId}`;
            }
          });
        }
      };
      let things: MyThing[] = [];
      for(let thing of data.result) {
        thing = new FindThingResult(this.apiService, thing);
        thing.attrs = {};
        for(const [name, attribute] of Object.entries(thing.attributes)) {
          thing.attrs[(attribute as {id: number}).id] = attribute;
        }
        console.log(thing);
        if(this.context) {
          let linkAttrDefnId = this.context.linkAttrDefn.id;
          let linkAttribute = thing.attrs[linkAttrDefnId];
          if(!linkAttribute) {
            continue;
          }
          let linkedThingId = this.context.linkedThing.id;
          if(linkAttribute.value.indexOf(linkedThingId) < 0) {
            continue;
          }
        }
        things.push(thing);
        for(let attrdefn of this.attrdefns) {
          if(attrdefn.handler == 'link' && attrdefn.showInList) {
            let attribute = thing.attributes[attrdefn.name];
            // console.log('attribute', attribute);
            setPresentation(attribute);
          }
        }
      }
      let contextId = this.context ? this.context.linkedThing.id : null;
      this.apiService.getThingOrder(this.type.id, contextId).subscribe( data => {
        console.log('getThingOrder data', data);
        if(data.status != 200) {
          alert(`Failed to get thing order: ${data.message}`);
          return;
        }
        let i = 0;
        let thingMap = {};
        for(let thingId of data.result) {
          thingMap[thingId] = i++;
        }
        for(let thing of things) {
          thing.sortOrder = thingMap[thing.id] || -1;
        }
        things.sort((a: MyThing, b: MyThing) => {
          return a.sortOrder - b.sortOrder;
        });
        console.log('things', things);
        this.things = things;
      });
    });
  }

  getTypeName(): string {
    if(this.type) {
      return this.type.name;
    }
    return "?";
  }

  getTitle(): string {
    let title = this.getTypeName();
    if(title == '?') {
      return '';
    }
    title = capitalize(pluralize(title));
    if(this.context) {
      title = title + ' for ' + this.context.linkAttrDefn.name + ' ' + this.context.linkedThing.presentation;
    }
    return title;
  }

  add(): void {
    this.breadcrumbs.push(new Breadcrumb('list-thing', {typeId: this.type.id}, this.context, this.getTitle()));
    this.listThingContextService.setContext(this.context);
    this.router.navigate(['edit-thing', { 'typeId': this.type.id }]);
  }

  view(thing: Thing): void {
    if(this.context) {
      this.breadcrumbs.push(new Breadcrumb('list-thing', { typeId: this.type.id }, this.context, this.getTitle()));
    }
    else {
      this.breadcrumbs.clear();
    }
    this.listThingContextService.setContext(this.context);
    this.router.navigate(['view-thing', { thingId: thing.id }]);
  }

  edit(thing: Thing): void {
    if(this.context) {
      this.breadcrumbs.push(new Breadcrumb('list-thing', { typeId: this.type.id }, this.context, this.getTitle()));
    }
    else {
      this.breadcrumbs.clear();
    }
    this.listThingContextService.setContext(this.context);
    this.router.navigate(['edit-thing', { 'thingId': thing.id }]);
  }

  delete(thing: Thing): void {
    let typeId = this.type.id;
    this.apiService.deleteAttributesByThingId(thing.id).subscribe( data => {
      console.log("deleteAttributesByThingId data", data);
      if(data.status != 200) {
        alert("Failed to delete attributes for thing: " + data.message);
        return;
      }
      this.apiService.deleteThing(thing.id).subscribe( data => {
        console.log("deleteThing data", data);
        if(data.status != 200) {
          alert("Failed to delete thing: " + data.message);
          return;
        }
        this.load();
      });
    });
  }

  gotoTypes() {
    this.router.navigate(['list-type']);
  }

  change(thing, attrdefn, value) {
    console.log('change', thing, attrdefn, value);
    let attribute = {thingId: thing.id, attrDefnId: attrdefn.id, value: value};
    this.apiService.insertAttribute(attribute).subscribe( data => {
      console.log('insertAttribute data', data);
      if(data.status != 200) {
        alert('Failed to save attribute: ' + data.message);
        return;
      }
    });
  }

  getVisibleAttrDefns(): AttrDefn[] {
    let result: AttrDefn[] = [];
    for(let attrdefn of this.attrdefns || []) {
      if(attrdefn.showInList || attrdefn.editInList) {
        result.push(attrdefn);
      }
    }
    return result;
  }

  gotoAttrDefns() {
    this.router.navigate(['list-attrdefn', { typeId: this.type.id }]);
  }

  getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs.getBreadcrumbs();
  }

  gotoBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.clear(breadcrumb);
    this.listThingContextService.setContext(breadcrumb.getContext());
    this.router.navigate(breadcrumb.getNav());
  }

  sortName(): void {
    this.sort(this.nameAttrDefn);
  }

  sortCreated(): void {

  }

  sort(attrdefn: MyAttrDefn): void {
    if(attrdefn.sorted) {
      attrdefn.sorted = false;
      this.things.sort((a: FindThingResult, b: FindThingResult) => {
        let attrA = a.attributes[attrdefn.name];
        let attrB = b.attributes[attrdefn.name];
        if(attrA.value < attrB.value) {
          return -1;
        }
        if(attrA.value > attrB.value) {
          return 1;
        }
        return 0;
      });
    }
    else {
      attrdefn.sorted = true;
      let ascending = !attrdefn.ascending;
      if(ascending) {
        this.things.sort((a: FindThingResult, b: FindThingResult) => {
          let attrA = a.attributes[attrdefn.name];
          let attrB = b.attributes[attrdefn.name];
          if(attrA.value < attrB.value) {
            return -1;
          }
          if(attrA.value > attrB.value) {
            return 1;
          }
          return 0;
        });
      }
      else {
        this.things.sort((a: FindThingResult, b: FindThingResult) => {
          let attrA = a.attributes[attrdefn.name];
          let attrB = b.attributes[attrdefn.name];
          if(attrA.value < attrB.value) {
            return 1;
          }
          if(attrA.value > attrB.value) {
            return -1;
          }
          return 0;
        });
      }
    }
  }

  dropTable(event: CdkDragDrop<FindThingResult[]>) {
    const prevIndex = this.things.findIndex(thing => thing === event.item.data);
    moveItemInArray(this.things, prevIndex, event.currentIndex);
    console.log('things', this.things);
    this.table.renderRows();
    let thingIds: number[] = [];
    for(let thing of this.things) {
      thingIds.push(thing.id);
    }
    let contextId = this.context == null ? null : this.context.linkedThing.id;
    this.apiService.saveThingOrder(this.type.id, contextId, thingIds).subscribe( data => {
      console.log('saveThingOrder data', data);
    });
  }
}
