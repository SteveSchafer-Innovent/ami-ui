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
    if(context) {
      window.localStorage.setItem('thing-context', JSON.stringify(context));
    }
    else {
      window.localStorage.removeItem('thing-context');
    }
  }

  getContext(): ListThingContext {
    let context = this.context;
    if(context == null) {
      let contextString = window.localStorage.getItem('thing-context');
      context = contextString == null ? null : JSON.parse(contextString);
    }
    this.context = null;
    return context;
  }
}