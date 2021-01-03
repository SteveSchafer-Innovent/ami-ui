import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from "@angular/forms";
import { MatTable } from '@angular/material/table';

import { Type } from "../model/type.model";
import { Thing } from "../model/thing.model";
import { FindThingResult } from "../model/find-thing-result.model";
import { AttrDefn } from "../model/attrdefn.model";
import { ApiService } from "../service/api.service";

class MyAttrDefn extends AttrDefn {
  typeName: string;
}

class MyType extends Type {
  attrdefns: AttrDefn[];
}

class ResultType extends MyType {
  things: FindThingResult[] = [];
  displayedColumns: string[] = [];
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  form: FormGroup;
  types: Type[];
  attributes: MyAttrDefn[];
  results: ResultType[];
  @ViewChild('table') table: MatTable<FindThingResult>;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    if(!window.localStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
    this.form = this.formBuilder.group({
      typeId: [''],
      attrDefnId: [''],
      searchInWords: [true],
      searchInValues: [false],
      searchLinks: [false],
      query: ['']
    });
    this.apiService.getTypes().subscribe( data => {
      console.log('SearchComponent.ngOnInit getTypes data', data);
      if(data.status != 200) {
        alert(`Failed to fetch types: ${data.message}`);
        return;
      }
      this.types = data.result;
      this.loadAttributes(this.form.value.typeId);
    });
  }

  loadAttributes(typeId: number): void {
    this.apiService.getAttrDefns(typeId).subscribe( data => {
      console.log('SearchComponent.ngOnInit loadAttributes data', data);
      if(data.status != 200) {
        alert(`Failed to fetch attribute defninitions: ${data.message}`);
        return;
      }
      this.attributes = data.result;
      for(let attribute of this.attributes) {
        for(let type of this.types) {
          if(type.id == attribute.typeId) {
            attribute.typeName = type.name;
          }
        }
      }
      this.attributes.sort((a1, a2) => {
        if(a1.typeName < a2.typeName) {
          return -1;
        }
        if(a1.typeName > a2.typeName) {
          return 1;
        }
        if(a1.name < a2.name) {
          return -1;
        }
        if(a1.name > a2.name) {
          return 1;
        }
        return 0;
      });
      this.search();
    });
  }

  changeType(): void {
    this.loadAttributes(this.form.value.typeId);
  }

  changeAttribute(): void {
    this.search();
  }

  search(): void {
    let formValue = this.form.value;
    console.log('formValue', formValue);
    this.apiService.search(formValue).subscribe( data => {
      console.log('search data', data);
      if(data.status != 200) {
        alert(data.message);
        return;
      }
      let resultTypes = {};
      for(let thing of data.result) {
        let resultType = resultTypes[thing.type.id];
        if(resultType == null) {
          resultType = new ResultType();
          resultType.id = thing.type.id;
          resultType.name = thing.type.name;
          resultType.attrdefns = thing.type.attrdefns;
          resultType.things = [];
          let hasName = false;

          for(let attrdefn of thing.type.attrdefns) {
            attrdefn.sorted = false;
            attrdefn.ascending = false;
            if(attrdefn.name == 'name') {
              hasName = true;
              resultType.nameAttrDefn = attrdefn;
              break;
            }
          }
          if(hasName) {
            resultType.displayedColumns.push('name');
          }
          resultType.displayedColumns.push('created');
          for(let attrdefn of resultType.attrdefns || []) {
            if(attrdefn.showInList || attrdefn.editInList) {
              resultType.displayedColumns.push(attrdefn.name);
            }
          }
          resultType.displayedColumns.push('buttons');
          console.log('displayedColumns', resultType.displayedColumns);

          resultTypes[thing.type.id] = resultType;
        }
        resultType.things.push(thing);
      }
      console.log('resultTypes', resultTypes, this.form.value.typeId);
      this.results = [];
      if(this.form.value.typeId == '') {
        for(let typeId in resultTypes) {
          let resultType = resultTypes[typeId];
          this.results.push(resultType);
        }
      }
      else {
        let resultType = resultTypes[this.form.value.typeId];
        if(resultType) {
          this.results.push(resultType);
        }
      }
      this.results.sort((t1, t2) => {
        if(t1.name < t2.name) {
          return -1;
        }
        if(t1.name > t2.name) {
          return 1;
        }
        return 0;
      });
      console.log('results', this.results);
    });
  }

  hasResults(): boolean {
    return this.results != null && this.results.length > 0;
  }

  getAttrDefnName(attrdefn: MyAttrDefn): string {
    return attrdefn.typeName + ": " + attrdefn.name;
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

  getVisibleAttrDefns(type: MyType): AttrDefn[] {
    let result: AttrDefn[] = [];
    for(let attrdefn of type.attrdefns || []) {
      if(attrdefn.name == 'name') {
        continue;
      }
      if(attrdefn.showInList || attrdefn.editInList) {
        result.push(attrdefn);
      }
    }
    return result;
  }

  view(thing: Thing): void {
    this.router.navigate(['view-thing', { thingId: thing.id }]);
  }
}
