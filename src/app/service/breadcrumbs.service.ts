import { Injectable } from '@angular/core';
import { indexOf } from '../core/common';
import { ListThingContext, ListThingContextService } from '../service/list-thing-context.service';

export class Breadcrumb {
  constructor(
    private name: string,
    private params: any,
    private context: ListThingContext,
    private buttonName: string
  ) {}
  getContext(): ListThingContext {
    return this.context;
  }
  getNav(): [string, any] {
    return [this.name, this.params];
  }
  getButtonName(): string {
    return this.buttonName;
  }
}

@Injectable()
export class Breadcrumbs {
  private breadcrumbs: Breadcrumb[] = [];

  public push(breadcrumb: Breadcrumb): void {
    let breadcrumbs = this.getBreadcrumbs();
    breadcrumbs.push(breadcrumb);
    this.saveBreadcrumbs(breadcrumbs);
  }

  public pop(): Breadcrumb {
    let breadcrumbs = this.getBreadcrumbs();
    let breadcrumb: Breadcrumb = breadcrumbs.pop();
    this.saveBreadcrumbs(breadcrumbs);
    return breadcrumb;
  }

  public clear(breadcrumb?: Breadcrumb): void {
    let breadcrumbs = this.getBreadcrumbs();
    if(breadcrumb) {
      let i = indexOf(breadcrumbs, breadcrumb);
      console.log('clearBreadcrumbs', breadcrumbs, breadcrumb, i);
      if(i >= 0) {
        breadcrumbs.length = i;
      }
    }
    else {
      breadcrumbs = [];
    }
    this.saveBreadcrumbs(breadcrumbs);
  }

  public getBreadcrumbs(): Breadcrumb[] {
    let breadcrumbsString = window.localStorage.getItem('breadcrumbs');
    // console.log('breadcrumbsString', breadcrumbsString);
    if(breadcrumbsString) {
      this.breadcrumbs = [];
      let array = JSON.parse(breadcrumbsString);
      for(let obj of array) {
        let breadcrumb = new Breadcrumb(obj.name, obj.params, obj.context, obj.buttonName);
        this.breadcrumbs.push(breadcrumb);
      }
    } 
    else {
      this.breadcrumbs = null;
    }
    return this.breadcrumbs;
  }

  private saveBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this.breadcrumbs = breadcrumbs;
    window.localStorage.setItem('breadcrumbs', JSON.stringify(breadcrumbs));
  }
}
