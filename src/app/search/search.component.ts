import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from "@angular/forms";
import { MatTable } from '@angular/material/table';
import { ShortcutInput, ShortcutEventOutput, AllowIn } from "ng-keyboard-shortcuts";  

import { Type } from "../model/type.model";
import { Thing } from "../model/thing.model";
import { FindThingResult, MyType, getThing, getType } from "../model/find-thing-result.model";
import { AttrDefn } from "../model/attrdefn.model";
import { ApiService } from "../service/api.service";

class MyAttrDefn extends AttrDefn {
  typeName: string;
  sorted: boolean;
  ascending: boolean;
}

class ResultType extends MyType {
  things: FindThingResult[] = [];
  displayedColumns: string[] = [];
}

class ResultTypes {
  types: {} = {};
  component: SearchComponent;

  constructor(component: SearchComponent) {
    this.component = component;
  }

  addThing(thing: FindThingResult) {
    let resultType = this.types[thing.typeId];
    if(resultType == null) {
      resultType = new ResultType();
      resultType.id = thing.type.id;
      resultType.name = thing.type.name;
      resultType.attrdefns = thing.type.attrdefns;
      resultType.things = [];
      let hasName = false;

      for(let attrdefn of thing.type.attrdefns) {
        let myAttrDefn = attrdefn as MyAttrDefn;
        myAttrDefn.sorted = false;
        myAttrDefn.ascending = false;
        this.component.attributes.push(myAttrDefn);
        if(myAttrDefn.name == 'name') {
          hasName = true;
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

      this.types[thing.type.id] = resultType;
    }
    resultType.things.push(thing);
  }

  finish() {
    this.component.setResults(this.types);
  }
}

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  resultsForm: FormGroup;
  selectedSortsFormArray: FormArray;
  types: Type[];
  attributes: MyAttrDefn[];
  results: ResultType[];
  availableSortNames: string[] = [];
  selectedSortNames: string[];
  searching: boolean = false;
  loading: boolean = false;
  queuedSearches = [];
  queuedLoads = [];
  searchId: string;
  resultCount: number;
  shortcuts: ShortcutInput[] = [];
  @ViewChild('table') table: MatTable<FindThingResult>;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService
  ) { }

  ngAfterViewInit(): void {
    this.shortcuts.push(
      {
        key: "pagedown",
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        label: "Page down",
        description: "Page down",
        command: (output: ShortcutEventOutput) => { console.log(output); this.advancePage(1); },
        preventDefault: true  
      },
      {
        key: "pageup",
        allowIn: [AllowIn.Textarea, AllowIn.Input, AllowIn.Select],
        label: "Page up",
        description: "Page up",
        command: (output: ShortcutEventOutput) => { console.log(output); this.advancePage(-1); },
        preventDefault: true  
      }
    );
  }

  ngOnInit(): void {
    if(!window.localStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
    this.form = this.formBuilder.group({
      typeId: [''],
      attrDefnId: [''],
      query: ['']
    });
    this.resultsForm = this.formBuilder.group({
    });
    this.selectedSortsFormArray = new FormArray([]);
    this.selectedSortsFormArray.push(this.createFormControl(''));
    this.resultsForm.addControl('selectedSortNames', this.selectedSortsFormArray);
    this.resultsForm.addControl('pageSize', new FormControl(20));
    this.resultsForm.addControl('page', new FormControl(1));
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

  createFormControl(sortName: string): FormControl {
    let formControl = new FormControl(sortName, Validators.required);
    formControl.valueChanges.subscribe(sortName => {
      let formArray = this.resultsForm.controls["selectedSortNames"] as FormArray; // array of thing ids
      this.selectedSortNames = [];
      let i = 0;
      while(i < formArray.length) {
        let formControl = formArray.controls[i];
        if(formControl.value == '') {
          formArray.removeAt(i);
        }
        else {
          this.selectedSortNames.push(formControl.value);
          i++;
        }
      }
      formArray.push(this.createFormControl(''));
      this.selectedSortsFormArray = formArray;
      this.resultsForm.controls['selectedSortNames'] = formArray;
    });
    return formControl;
  }

  loadAttributes(typeId: number): void {
    this.apiService.getAttrDefns(typeId).subscribe( data => {
      console.log('SearchComponent.loadAttributes data', data);
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
      this.search(null);
    });
  }

  changeType(): void {
    this.loadAttributes(this.form.value.typeId);
  }

  changeAttribute(): void {
    this.search(null);
  }

  load(load): void {
    if(load == null) {
      load = this.resultsForm.value;
    }
    if(this.loading || this.searching) {
      this.queuedLoads.push(load);
      console.log('push', load);
      return;
    }
    this.loading = true;
    let pageSize = +load.pageSize;
    let page = +load.page - 1;
    this.selectedSortNames = load.selectedSortNames;
    console.log('selectedSortNames', this.selectedSortNames);
    this.results = [];
    let resultTypes = new ResultTypes(this);
    this.apiService.getSearchResults(this.searchId, this.selectedSortNames, pageSize, page).subscribe( data => {
      console.log('load data', data);
      if(data.status != 200) {
        alert(data.message);
        return;
      }
      let searchResults = data.result;
      let thingIndex = 0;
      let component = this;
      let loadThing = function(): void {
        if(component.queuedSearches.length > 0) {
          let search = component.queuedSearches.shift();
          console.log('pop search', search);
          component.loading = false;
          component.searching = false;
          component.search(search);
          return; // abort the current search
        }
        if(component.queuedLoads.length > 0) {
          let load = component.queuedLoads.shift();
          console.log('pop load', load);
          component.loading = false;
          component.searching = false;
          component.load(load);
          return;
        }
        if(thingIndex >= searchResults.length) {
          // we have reached the end of the list
          resultTypes.finish();
          return;
        }
        let thingId = searchResults[thingIndex++];
        component.apiService.getThing(thingId).subscribe( data => {
          console.log('getThing', thingId, data);
          if(data.status != 200) {
            alert(`Failed to get thing ${thingId}: ${data.message}`);
            return;
          }
          getThing(component.apiService, data.result).subscribe( thing => {
            resultTypes.addThing(thing);
            loadThing();
          });
        });
      };
      loadThing();
    });
  }

  setResults(resultTypesObj: {}) {
    this.results = [];
    if(this.form.value.typeId == '') 
    {
      // all types selected
      for(let typeId in resultTypesObj) {
        let resultType = resultTypesObj[typeId];
        this.results.push(resultType);
      }
    }
    else {
      // one type selected
      let resultType = resultTypesObj[this.form.value.typeId];
      if(resultType) {
        this.results.push(resultType);
      }
    }
    // sort the types by name
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
    this.loading = false;
    this.searching = false;
  }

  search(search: any): void {
    if(search == null) {
      search = this.form.value;
    }
    if(this.searching || this.loading) {
      this.queuedSearches.push(search);
      console.log('push', search);
      return;
    }
    this.searching = true;
    console.log('search', search, this);
    this.apiService.search(search).subscribe( data => {
      console.log('search data', data);
      if(data.status != 200) {
        alert(data.message);
        return;
      }
      let searchResult = data.result;
      this.searchId = searchResult.id;
      this.resultCount = searchResult.resultCount;
      this.availableSortNames = searchResult.sortNames;
      this.searching = false;
      this.load(null);
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

  getMaxPage() {
    return Math.ceil(this.resultCount / +this.resultsForm.value.pageSize);
  }

  advancePage(count: number): void {
    console.log('advancePage', count);
    let page = +this.resultsForm.value.page - 1;
    page += count;
    let maxPage = this.getMaxPage();
    if(page < 0) {
      return;
    }
    if(page >= maxPage) {
      return;
    }
    this.resultsForm.controls.page.setValue(page + 1);
    this.load(null);
  }

  canAdvancePage(count: number): boolean {
    let load = this.resultsForm.value;
    let page = +load.page - 1;
    page += count;
    let maxPage = this.getMaxPage();
    return page >= 0 && page < maxPage;    
  }

  getFirstThingNumber(): number {
    let pageSize = +this.resultsForm.value.pageSize;
    let page = +this.resultsForm.value.page;
    let pageNum = pageSize * (page - 1) + 1;
    if(pageNum > this.resultCount) {
      pageNum = this.resultCount;
    }
    return pageNum;
  }

  getLastThingNumber(): number {
    let pageSize = +this.resultsForm.value.pageSize;
    let page = +this.resultsForm.value.page;
    let pageNum = pageSize * page;
    if(pageNum > this.resultCount) {
      pageNum = this.resultCount;
    }
    return pageNum;
  }
}
