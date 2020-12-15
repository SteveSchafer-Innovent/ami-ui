import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AttrDefn } from "../model/attrdefn.model";
import { FindThingResult } from "../model/find-thing-result.model";

export class ListThingContext {
  linkAttrDefn: AttrDefn;
  linkedThing: FindThingResult;
}

@Injectable()
export class ListThingContextService {
  private context: ListThingContext = null;

  constructor() {}

  setContext(context: ListThingContext): void {
    this.context = context;
  }

  getContext(): ListThingContext {
    let context = this.context;
    this.context = null;
    return context;
  }
}