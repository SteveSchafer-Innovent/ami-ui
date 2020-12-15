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
  breadcrumbs: Breadcrumb[] = [];

  public push(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.push(breadcrumb);
  }

  public pop(): Breadcrumb {
    return this.breadcrumbs.pop();
  }

  public clear(breadcrumb?: Breadcrumb): void {
    if(breadcrumb) {
      let i = indexOf(this.breadcrumbs, breadcrumb);
      console.log('clearBreadcrumbs', this.breadcrumbs, breadcrumb, i);
      if(i >= 0) {
        this.breadcrumbs.length = i;
      }
    }
    else {
      this.breadcrumbs = [];
    }
  }
}
