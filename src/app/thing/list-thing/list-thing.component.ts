import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { formatDate, Location } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatTable } from '@angular/material/table';
import { of, from, forkJoin, zip } from 'rxjs';
import { Observable } from 'rxjs/index';
import { switchMap, mergeMap, takeLast, concat, concatMap } from 'rxjs/operators';

import { Thing } from "../../model/thing.model";
import { FindThingResult, MyType, getThing, getType } from "../../model/find-thing-result.model";
import { Type } from "../../model/type.model";
import { AttrDefn } from "../../model/attrdefn.model";
import { ApiService } from "../../service/api.service";
import { ApiResponse } from '../../model/api.response';
import { ListThingContextService, ListThingContext } from "../../service/list-thing-context.service";
import { Breadcrumbs, Breadcrumb } from "../../service/breadcrumbs.service";
import { pluralize, capitalize } from "../../core/common";

class MyAttrDefn extends AttrDefn {
  sorted: boolean;
  ascending: boolean;
}

class MyThing extends FindThingResult {
  attrs: {};
  sortOrder: number;
}

class SortableThing extends Thing {
  sortOrder: number;
}

@Component({
  selector: 'app-list-thing',
  templateUrl: './list-thing.component.html',
  styleUrls: ['./list-thing.component.css']
})
export class ListThingComponent implements OnInit {
  things: MyThing[] = []; // init so table has some data
  @ViewChild('table') table: MatTable<FindThingResult>;
  displayedColumns: string[] = [];
  type: MyType;
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
    let typeId: number = 0;
    this.route.paramMap.pipe(switchMap((params: ParamMap) => {
      typeId = +params.get('typeId');
      // console.log(`list-thing typeId = ${typeId}`);
      this.context = this.listThingContextService.getContext();
      // console.log('context', this.context);
      return getType(this.apiService, typeId);
    })).subscribe( myType => {
      this.type = myType;
      this.attrdefns = [];
      this.nameAttrDefn = null;
      for(let attrdefn of myType.attrdefns) {
        let myAttrDefn = attrdefn as MyAttrDefn;
        myAttrDefn.sorted = false;
        myAttrDefn.ascending = false;
        this.attrdefns.push(myAttrDefn);
        if(myAttrDefn.name == 'name') {
          this.nameAttrDefn = myAttrDefn;
        }
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
      // console.log('displayedColumns', this.displayedColumns);
      this.loadThings().subscribe( things => {
        this.things = things as MyThing[];
        // console.log('final things', things);
      });
    });
  }

  private loadThings(): Observable<MyThing[]> {
    let thingCount: number = 0;
    let things: MyThing[] = [];
    // console.log(`getThings for type ${this.type.id}`);
    let contextId = this.context ? this.context.linkedThing.id : null;
    return this.apiService.getThings(this.type.id).pipe(switchMap( data => {
      // console.log('getThings data', data);
      if(data.status != 200) {
        alert("Failed to get sortableThings: " + data.message);
        return;
      }
      thingCount = data.result.length;
      return from(data.result);
    })).pipe(mergeMap(thing => {
      // console.log('thing', thing);
      return getThing(this.apiService, thing as Thing);
    })).pipe(mergeMap(thing => {
      things.push(thing as MyThing);
      return from(thing.type.attrdefns).pipe(concatMap(attrdefn => {
        let thingIds: {thingId: number, index: number}[] = [];
        let attribute = null;
        if(attrdefn.handler == 'link' && attrdefn.showInList) {
          attribute = thing.attributes[attrdefn.name];
          if(attribute == null) {
            console.log(`thing attribute ${attrdefn.name} not found`);
          }
          else {
            let values = attribute.value;
            attribute.linkedThings = [];
            for(let i = 0; i < values.length; i++) {
              let thingId = values[i];
              thingIds.push({thingId: thingId, index: i});
            }
          }
        }
        if(attribute == null) {
          return of(things);
        }
        return from(thingIds).pipe(concatMap(thingIdObj => {
          return this.apiService.getThing(thingIdObj.thingId).pipe(switchMap(data => {
            // console.log('get linked thing data', data);
            if(data.status != 200) {
              alert("Failed to get linked thing: " + data.message);
              return;
            }
            return getThing(this.apiService, data.result as Thing);
          })).pipe(mergeMap(linkedThing => {
            attribute.linkedThings[thingIdObj.index] = linkedThing;
            let attributes = linkedThing.attributes;
            let name = attributes['name'];
            if(name && name.value) {
              linkedThing.presentation = name.value;
            }
            else if(linkedThing.type) {
              // console.log('linkedThing has no name', linkedThing);
              linkedThing.presentation = `${linkedThing.type.name} ${thingIdObj.thingId}`;
            }
            else {
              // console.log('linkedThing has no type', linkedThing);
              linkedThing.presentation = `? ${thingIdObj.thingId}`;
            }
            // console.log(`thing ${thing.id} linkedThing ${linkedThing.id} presentation = ${linkedThing.presentation}`);
            return of(things);
          }));
        }));
      }));
    }), takeLast(1)).pipe(switchMap(things => {
      return this.apiService.getThingOrder(this.type.id, contextId);
    })).pipe(switchMap(data => {
      // console.log('getThingOrder data', data);
      if(data.status != 200) {
        alert(`Failed to get thing order: ${data.message}`);
        return from(things);
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
      return from(things);
    })).pipe(mergeMap( thing => {
      thing.attrs = {};
      for(const [name, attribute] of Object.entries(thing.attributes)) {
        thing.attrs[(attribute as {id: number}).id] = attribute;
      }
      return of(things);
    }), takeLast(1)).pipe(mergeMap(things => {
      let newThings: MyThing[] = [];
      for(let thing of things) {
        if(this.context) {
          let linkAttrDefnId = this.context.linkAttrDefn.id;
          let linkAttribute = thing.attrs[linkAttrDefnId];
          if(!linkAttribute) {
            newThings.push(thing);
          }
          else if(linkAttribute.value.indexOf(this.context.linkedThing.id) >= 0) {
            newThings.push(thing);
          }
          else {
            // console.log('context linked thing id not found', this.context.linkedThing.id);
          }
        }
        else {
          newThings.push(thing);
        }
      }
      // console.log('newThings', newThings);
      return of(newThings);
    }));
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
      title = title + ' for ' + this.context.linkAttrDefn.name + ' ' + this.context.linkedThing.name;
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

  links(thing: Thing): void {
    if(this.context) {
      this.breadcrumbs.push(new Breadcrumb('list-thing', { typeId: this.type.id }, this.context, this.getTitle()));
    }
    else {
      this.breadcrumbs.clear();
    }
    this.listThingContextService.setContext(this.context);
    this.router.navigate(['manage-links', { 'thingId': thing.id }]);
  }

  delete(thing: Thing): void {
    let typeId = this.type.id;
    this.apiService.deleteAttributesByThingId(thing.id).subscribe( data => {
      // console.log("deleteAttributesByThingId data", data);
      if(data.status != 200) {
        alert("Failed to delete attributes for thing: " + data.message);
        return;
      }
      this.apiService.deleteThing(thing.id).subscribe( data => {
        // console.log("deleteThing data", data);
        if(data.status != 200) {
          alert("Failed to delete thing: " + data.message);
          return;
        }
        this.loadThings().subscribe( things => { this.things = things as MyThing[]; });
      });
    });
  }

  gotoTypes() {
    this.router.navigate(['list-type']);
  }

  change(thing, attrdefn, value) {
    // console.log('change', thing, attrdefn, value);
    let attribute = {thingId: thing.id, attrDefnId: attrdefn.id, value: value};
    this.apiService.insertAttribute(attribute).subscribe( data => {
      // console.log('insertAttribute data', data);
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
    // console.log('things', this.things);
    this.table.renderRows();
    let thingIds: number[] = [];
    for(let thing of this.things) {
      thingIds.push(thing.id);
    }
    let contextId = this.context == null ? null : this.context.linkedThing.id;
    this.apiService.saveThingOrder(this.type.id, contextId, thingIds).subscribe( data => {
      // console.log('saveThingOrder data', data);
    });
  }

  getAttrValue(thing, attrdefn) {
    let attributes = thing.attributes;
    if(!attributes) {
      // console.log('no attributes', thing);
      return '';
    }
    let attribute = attributes[attrdefn.name];
    if(!attribute) {
      // console.log('no attribute for', attrdefn, attributes);
      return '';
    }
    return attribute.value;
  }

  getAttrDivId(thing, attrdefn) {
    return 'attr-' + thing.id + '-' + attrdefn.id;
  }
}
