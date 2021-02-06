import { of, from } from 'rxjs';
import { Observable } from 'rxjs/index';
import { switchMap, mergeMap, takeLast } from 'rxjs/operators';

import { Type } from './type.model';
import { User } from './user.model';
import { Thing } from './thing.model';
import { Attribute } from './attribute.model';
import { AttrDefn } from './attrdefn.model';
import { ApiService } from '../service/api.service';
import { ApiResponse } from '../model/api.response';

export class MyType extends Type {
  attrdefns: AttrDefn[];
}

let myTypeCache = {};
// console.log('instantiating myTypeCache');

export function getType(apiService: ApiService, typeId: number): Observable<MyType> {
  let myType: MyType = myTypeCache[typeId];
  if(myType) {
    return of(myType);
  }
  else {
    return apiService.getType(typeId).pipe(switchMap( data => {
      if(data.status != 200) {
        alert(`Failed to get type ${typeId}: ${data.message}`);
        return;
      }
      myType = data.result;
      return apiService.getAttrDefns(typeId);
    })).pipe(switchMap( data => {
      // console.log(`getAttrDefns ${typeId}, data`, data);
      if(data.status != 200) {
        alert(`Failed to get attr defns for type ${typeId}: ${data.message}`);
        return;
      }
      myType.attrdefns = data.result;
      myTypeCache[typeId] = myType;
      return of(myType);
    }));
  }
}

let myThingCache = {};

export function getThing(apiService: ApiService, thing: Thing): Observable<FindThingResult> {
  if(myThingCache[thing.id]) {
    return of(myThingCache[thing.id]);
  }
  let resultThing = new FindThingResult(apiService, thing);
  myThingCache[thing.id] = resultThing;
  return resultThing.init();
}

export class FindThingResult {
  id: number;
  typeId: number;
  type: MyType;
  created: Date;
  creatorId: number;
  creator: User;
  name: string;
  attributes: any[] = [];
  image: any;
  parent: FindThingResult;
  presentation: string;

  constructor(private apiService: ApiService, thing: Thing) {
    // console.log('constructing thing', thing);
    this.id = thing.id;
    this.typeId = thing.typeId;
    this.created = thing.created;
    this.creatorId = thing.creator;
  }

  public init(): Observable<FindThingResult> {
    // console.log(`init FindThingResult, thingId = ${this.id}, typeId = ${this.typeId}`);
    return this.apiService.getUserById(this.creatorId).pipe(mergeMap( data => {
      if(data.status != 200) {
        alert(`Failed getUserById ${this.creatorId}: ${data.message}`);
        return;
      }
      this.creator = data.result;
      return getType(this.apiService, this.typeId);
    })).pipe(mergeMap( myType => {
      this.type = myType;
      return from(myType.attrdefns);
    })).pipe(mergeMap( attrdefn => {
      // console.log('FindThingResult.init: attrdefn', attrdefn);
      return this.apiService.getThingAttribute(this.id, attrdefn.id);
    })).pipe(switchMap( data => {
      // console.log(`FindThingResult.init: getThingAttribute ${this.id}, data`, data);
      if(data.status != 200) {
        alert(`Failed getThingAttribute ${this.id}: ${data.message}`);
        return;
      }
      this.attributes[data.result.name] = data.result;
      return of(this);
    }), takeLast(1)).pipe(switchMap( thing => {
      return this.apiService.getThingName(thing.id);
    })).pipe(switchMap(data => {
      // console.log(`FindThingResult.init: getThingName ${this.id}, data`, data);
      if(data.status != 200) {
        alert(`Failed to get name for thing ${this.id}: ${data.message}`);
        return;
      }
      this.name = data.result;
      return this.apiService.getThingPresentation(this.id);
    })).pipe(switchMap(data => {
      // console.log(`FindThingResult.init: getThingPresentation ${this.id}, data`, data);
      if(data.status != 200) {
        alert(`Failed to get presentation for thing ${this.id}: ${data.message}`);
        return;
      }
      // console.log(`thing ${this.id} presentation = ${data.result}`);
      this.presentation = data.result;
      return this.apiService.getThingParent(this.id).pipe(switchMap(data => {
        // console.log(`getThingParent ${this.id}, data`, data);
        if(data.status != 200) {
          alert(`Failed to get parent of thing ${this.id}: ${data.message}`);
          return;
        }
        let thing = this;
        if(data.result != null) {
          return getThing(this.apiService, data.result).pipe(mergeMap( parentThing => {
            return of(thing);
          }));
        }
        return of(thing);
      }));
    }));
  }

  private setThingImage(targetThing, thing) {
    if(thing.attributes.image && thing.attributes.image.value) {
      let observable = this.apiService.downloadFile(thing.id, thing.attributes.image.id);
      observable.subscribe((file) => {
        // console.log('file', file);
        // method 1 - more compact URL
        // need to revokeObjectURL after image is loaded
        // const url = URL.createObjectURL(file.body); // does not work on file
        // let image = this.sanitizer.bypassSecurityTrustUrl(url);
        // thing.image = image;
        // method 2 - data URL
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          let dataUrl = reader.result;
          targetThing.image = dataUrl;
          // let s = String.fromCharCode.apply(null, arrayBuffer);
          // let base64String = btoa(s);
          // thing.image = 'data:image/jpeg;base64,' + base64String;
        });
        reader.readAsDataURL(file.body);
      });
    }
    else if(thing.parent) {
      this.setThingImage(targetThing, thing.parent);
    }
    else {
      thing.image = '';
    }
  }
}