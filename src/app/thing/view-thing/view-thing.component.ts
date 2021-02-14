import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { formatDate, Location } from '@angular/common';

import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { Type } from "../../model/type.model";
import { Thing } from "../../model/thing.model";
import { AttrDefn } from "../../model/attrdefn.model";
import { ApiService } from "../../service/api.service";
import { FindThingResult } from "../../model/find-thing-result.model";
import { ListThingContextService, ListThingContext } from "../../service/list-thing-context.service";
import { Breadcrumbs, Breadcrumb } from "../../service/breadcrumbs.service";
import { pluralize, capitalize } from "../../core/common";

class FindTypeResult {
  id: number;
  name: string;
  attrdefns: AttrDefn[];
  visibleAttrdefns: AttrDefn[];
}

class AttrDefnFormControl extends AttrDefn {
  targetTypeId: number;
  targetType: FindTypeResult;
  image: string | ArrayBuffer;
  value: any;
  expanded: boolean;
}

class LinkAttrDefn extends AttrDefn {
  typeName: string;
  targetedThings: FindThingResult[];
  untargetedThings: FindThingResult[];
  visibleUntargetedThings: FindThingResult[];
  filterString: string;
  showAvailableTags: boolean;
}

@Component({
  selector: 'app-view-thing',
  templateUrl: './view-thing.component.html',
  styleUrls: ['./view-thing.component.css']
})
export class ViewThingComponent implements OnInit {
  type: Type;
  thing: FindThingResult;
  attrdefns: AttrDefnFormControl[];
  tagAttrDefns: LinkAttrDefn[];
  linktomeAttrDefns: LinkAttrDefn[];
  context: ListThingContext;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private listThingContextService: ListThingContextService,
    private breadcrumbs: Breadcrumbs,
    private location: Location,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if(!window.localStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
    this.route.paramMap.subscribe((params: ParamMap) => {
      let thingId = +params.get('thingId');
      if(!thingId) {
        alert('No thing id provided');
        return;
      }
      // console.log(`view-thing thingId = ${thingId}`);
      this.context = this.listThingContextService.getContext();
      this.thing = null;
      if(thingId != 0) {
        this.apiService.getThing(thingId).subscribe( data => {
          // console.log('getThing', thingId, data);
          if(data.status != 200) {
            alert(`Failed to get thing ${thingId}: ${data.message}`);
            return;
          }
          this.thing = new FindThingResult(this.apiService, data.result);
          this.thing.init().subscribe( thing => {
            this.apiService.getLinkAttrDefns(this.thing.type.id).subscribe( data => {
              // console.log('getLinkAttrDefns', data);
              if(data.status != 200) {
                alert(`Failed to get link attribute defnitions for type ${this.thing.type.id}: ${data.message}`);
                return;
              }
              this.tagAttrDefns = [];
              this.linktomeAttrDefns = [];
              for(let linktomeAttrDefn of data.result) {
                let linkTypeId = linktomeAttrDefn.typeId;
                this.apiService.getType(linkTypeId).subscribe( data => {
                  // console.log('link getType', linkTypeId, data);
                  if(data.status != 200) {
                    alert(`Failed to get type ${linkTypeId}: ${data.message}`);
                    return;
                  }
                  let type = data.result;
                  this.apiService.getAttrDefns(type.id).subscribe( data => {
                    // console.log('linkType attrDefns data', data);
                    if(data.status != 200) {
                      alert(`Failed to get attrdefns for link type ${type.id}: ${data.message}`);
                      return;
                    }
                    let linkTypeAttrDefns = data.result;
                    let include = false;
                    // if the type has 2 attributes and one of them is 'name'
                    // the other one must be the link
                    if(linkTypeAttrDefns.length == 2 && linktomeAttrDefn.typeName == 'tag') {
                      for(let linkTypeAttrDefn of linkTypeAttrDefns) {
                        if(linkTypeAttrDefn.name == 'name' && linkTypeAttrDefn.handler == 'string') {
                          include = true;
                        }
                      }
                    }
                    // only include link types that have a single name attribute other than the link attribute
                    if(include) {
                      this.tagAttrDefns.push(linktomeAttrDefn);
                    }
                    else {
                      this.linktomeAttrDefns.push(linktomeAttrDefn);
                    }
                  });
                  linktomeAttrDefn.filterThings = function(filterString: string) {
                    // console.log('filterThings', filterString, this.untargetedThings);
                    this.filterString = filterString;
                    this.visibleUntargetedThings = [];
                    for(let thing of this.untargetedThings) {
                      if(this.filterString == '' || thing.name.indexOf(this.filterString) >= 0) {
                        this.visibleUntargetedThings.push(thing);
                      }
                    }
                    this.showAvailableTags = filterString != '';
                    // console.log('filterThings', this.filterString, this.visibleUntargetedThings);
                  };
                  linktomeAttrDefn.clearFilter = function() {
                    // let input = document.body.querySelector('#link-' + linktomeAttrDefn.name);
                    // input.setAttribute('value', '');
                    this.filterString = '';
                  };
                  linktomeAttrDefn.addLink = function(thing) {
                    let index = this.untargetedThings.indexOf(thing);
                    if(index >= 0) {
                      this.untargetedThings.splice(index, 1);
                    }
                    this.targetedThings.push(thing);
                    this.filterThings(this.filterString);
                  };
                  linktomeAttrDefn.removeLink = function(thing) {
                    let index = this.targetedThings.indexOf(thing);
                    if(index >= 0) {
                      this.targetedThings.splice(index, 1);
                    }
                    this.untargetedThings.push(thing);
                    this.filterThings(this.filterString);
                  };
                  linktomeAttrDefn.type = type;
                  linktomeAttrDefn.typeName = type.name;
                  linktomeAttrDefn.showAvailableTags = false;
                  let buttonName = linktomeAttrDefn.typeName;
                  if(buttonName == this.type.name) {
                    buttonName = 'child ' + buttonName;
                  }
                  buttonName = capitalize(pluralize(buttonName));
                  linktomeAttrDefn.buttonName = buttonName;
                  linktomeAttrDefn.targetedThings = [];
                  let targetedThingIds = {};
                  this.apiService.getThingSourceLinks(this.thing.id).subscribe( data => {
                    // console.log(`getThingSourceLinks ${this.thing.id}`, data);
                    if(data.status != 200) {
                      alert(`Failed to get source links for thing ${this.thing.id}: ${data.message}`);
                      return;
                    }
                    let linkThingIds = data.result;
                    if(linkThingIds != null) {
                      let numberOfThingsToLoad = linkThingIds.length;
                      if(numberOfThingsToLoad > 10) {
                        numberOfThingsToLoad = 10;
                        // console.log(`number of linked things to load reduced from ${linkThingIds.length} to ${numberOfThingsToLoad}`);
                      }
                      for(let j = 0; j < numberOfThingsToLoad; j++) {
                        let linkThingId = linkThingIds[j];
                        this.apiService.getThing(linkThingId).subscribe( data => {
                          // console.log('link getThing', linkThingId, data);
                          if(data.status != 200) {
                            alert(`Failed to get link thing ${linkThingId}: ${data.message}`);
                            return;
                          }
                          let linkThing = new FindThingResult(this.apiService, data.result);
                          linkThing.init().subscribe( linkThing => {
                            linktomeAttrDefn.targetedThings[j] = linkThing;
                            targetedThingIds[linkThing.id] = true;
                          });
                        });
                      }
                    }
                    // console.log('targetedThingIds', targetedThingIds);
                    linktomeAttrDefn.untargetedThings = [];
                    linktomeAttrDefn.filterString = '';
                    this.apiService.getThings(linktomeAttrDefn.typeId).subscribe( data => {
                      // console.log('untargeted getThings data', data);
                      if(data.status != 200) {
                        alert("Failed to get untargeted things: " + data.message);
                        return;
                      }
                      linktomeAttrDefn.untargetedThings = [];
                      for(let thing of data.result) {
                        thing = new FindThingResult(this.apiService, thing);
                        thing.init().subscribe( thing => {
                          if(!targetedThingIds[thing.id]) {
                            linktomeAttrDefn.untargetedThings.push(thing);
                          }
                        });
                      }
                      linktomeAttrDefn.filterThings('');
                    });
                  });
                });
              }
            });
            let typeId = this.thing.type.id;
            this.apiService.getType(typeId).subscribe( data => {
              // console.log('getType', typeId, data);
              if(data.status != 200) {
                alert(`Failed to get type ${typeId}: ${data.message}`);
                return;
              }
              this.type = data.result;
            });
            this.apiService.getAttrDefns(typeId).subscribe( data => {
              // console.log('getAttrDefns', typeId, data);
              if(data.status != 200) {
                alert(`Failed to get attribute definitions for type ${typeId}: ${data.message}`);
                return;
              }
              this.attrdefns = data.result;
              let richText = null;
              for(let attrdefn of this.attrdefns) {
                console.log('attrdefn', attrdefn);
                attrdefn.image = null;
                let attribute = this.thing.attributes[attrdefn.name];
                if(attribute) {
                  if(attrdefn.handler == 'link') {
                    attrdefn.targetType = {
                      id: 0,
                      name: '?',
                      attrdefns: [],
                      visibleAttrdefns: []
                    };
                    let targetTypeId = attrdefn.targetTypeId;
                    if(targetTypeId != null) {
                      // targetTypeId could be null if target type = any
                      this.apiService.getType(targetTypeId).subscribe( data => {
                        // console.log('get type for link target', targetTypeId, data);
                        if(data.status != 200) {
                          alert(`Failed to get type ${targetTypeId}: ${data.message}`);
                          return;
                        }
                        let targetType = data.result;
                        this.apiService.getAttrDefns(targetTypeId).subscribe( data => {
                          // console.log(`getAttrDefns for ${targetTypeId}`, data);
                          if(data.status != 200) {
                            alert(`Failed to get attrdefns for type ${targetTypeId}: ${data.message}`);
                            return;
                          }
                          targetType.attrdefns = data.result;
                          attrdefn.targetType = targetType;
                          attrdefn.targetType.visibleAttrdefns = [];
                          for(let targetTypeAttrdefn of attrdefn.targetType.attrdefns) {
                            if(targetTypeAttrdefn.showInList || targetTypeAttrdefn.editInList) {
                              attrdefn.targetType.visibleAttrdefns.push(targetTypeAttrdefn);
                            }
                          }
                        });
                      });
                    }
                    this.fetchLinkedThings(attrdefn, attribute);
                  }
                  else if(attrdefn.handler == "rich-text") {
                    attrdefn.value = attribute.value;
                    richText = attrdefn.value;
                  }
                  else if(attrdefn.handler == 'file') {
                    attrdefn.value = attribute.value;
                    if(attrdefn.value.mimeType && attrdefn.value.mimeType.startsWith('image/')) {
                      this.apiService.downloadFile(this.thing.id, attrdefn.id).subscribe(file => {
                        // console.log('getImage downloadFile file', file);
                        const reader = new FileReader();
                        reader.addEventListener('loadend', () => {
                          let dataUrl = reader.result;
                          attrdefn.image = dataUrl;
                        });
                        reader.readAsDataURL(file.body);
                      });
                    }
                  }
                  else {
                    attrdefn.value = attribute.value;
                  }
                }
                else {
                  // console.log('attribute value not found');
                  if(attrdefn.handler == 'link') {
                    attrdefn.value = [];
                  }
                  else if(attrdefn.handler == 'float' || attrdefn.handler == 'integer') {
                    attrdefn.value = 0;
                  }
                  else {
                    attrdefn.value = '';
                  }
                }
              }
            });
          });
        });
      }
    });
  }

  fetchLinkedThings(attrdefn, attribute): void {
    let thingIds = attribute.value;
    attrdefn.value = [];
    let values = [];
    for(let i = 0; i < thingIds.length; i++) {
      values[i] = {attributes: {name: '?'}};
    }
    let component = this;
    let fetchLinkedThing = function(i): void {
      if(i >= thingIds.length) {
        attrdefn.value = values;
        return;
      }
      let linkedThingId = thingIds[i];
      component.apiService.getThing(linkedThingId).subscribe( data => {
        // console.log('get linked thing data', data);
        if(data.status != 200) {
          values[i] = {
            id: linkedThingId,
            attributes: {name: `Failed to get thing ${linkedThingId}: ${data.message}`}
          };
        }
        else {
          let linkedThing = new FindThingResult(component.apiService, data.result);
          linkedThing.init().subscribe( linkedThing => {
            values[i] = linkedThing;
          });
        }
        fetchLinkedThing(i + 1);
      });
    }
    fetchLinkedThing(0);
  }

  addLink(linktomeAttrDefn, untargetedThing, clearFilter: boolean = false): void {
    // console.log('addLink', linktomeAttrDefn, untargetedThing);
    this.apiService.getThingAttribute(untargetedThing.id, linktomeAttrDefn.id).subscribe( data => {
      // console.log(`getAttribute data`, data);
      if(data.status != 200) {
        alert(`Failed to get attribute: ${data.message}`);
        return;
      }
      let attrDefn = data.result;
      if(attrDefn.handler != 'link') {
        // console.log('attribute is not a link');
        return;
      }
      let index = attrDefn.value.indexOf(this.thing.id);
      if(index < 0) {
        attrDefn.value.push(this.thing.id);
        let attribute = {thingId: untargetedThing.id, attrDefnId: linktomeAttrDefn.id, value: attrDefn.value};
        this.apiService.insertAttribute(attribute).subscribe( data => {
          // console.log('insertAttribute data', data);
          if(data.status != 200) {
            alert('Failed to save attribute: ' + data.message);
            return;
          }
          if(clearFilter) {
            linktomeAttrDefn.clearFilter();
          }
          linktomeAttrDefn.addLink(untargetedThing);
        });
      }
    });
  }

  removeLink(linktomeAttrDefn, targetedThing): void {
    // console.log('removeLink', linktomeAttrDefn, targetedThing);
    this.apiService.getThingAttribute(targetedThing.id, linktomeAttrDefn.id).subscribe( data => {
      // console.log(`getAttribute data`, data);
      if(data.status != 200) {
        alert(`Failed to get attribute: ${data.message}`);
        return;
      }
      let attrDefn = data.result;
      if(attrDefn.handler != 'link') {
        // console.log('attribute is not a link');
        return;
      }
      let index = attrDefn.value.indexOf(this.thing.id);
      if(index >= 0) {
        attrDefn.value.splice(index, 1);
        let attribute = {thingId: targetedThing.id, attrDefnId: linktomeAttrDefn.id, value: attrDefn.value};
        this.apiService.insertAttribute(attribute).subscribe( data => {
          // console.log('insertAttribute data', data);
          if(data.status != 200) {
            alert('Failed to save attribute: ' + data.message);
            return;
          }
          linktomeAttrDefn.removeLink(targetedThing);
        });
      }
    });
  }

  getTypeName(): string {
    if(this.type) {
      return this.type.name;
    }
    return "?";
  }

  getTitle(): string {
    if(this.thing) {
      let name = this.thing.attributes['name'];
      if(name) {
        return name.value;
      }
    }
    let typeName = this.getTypeName();
    typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
    return typeName;
  }

  trackAttrDefn(index, attrdefn) {
    return attrdefn ? attrdefn.id : undefined;
  }

  downloadFile(attrdefn) {
    // console.log('downloadFile', attrdefn);
    let thingId = this.thing.id;
    if(thingId == null) {
      alert("Thing not known")
      return;
    }
    let observable = this.apiService.downloadFile(thingId, attrdefn.id);
    observable.subscribe((file) => {
      // console.log('downloadFile', file);
      const link = document.createElement('a');
      // console.log('link', link);
      if(link.download !== undefined) {
        const url = URL.createObjectURL(file.body);
        // console.log(url);
        link.setAttribute('href', url);
        link.setAttribute('download', attrdefn.value.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }

  gotoThings(): void {
    this.breadcrumbs.clear();
    this.router.navigate(['search', { 'typeId': this.type.id, 'query': '*' }]);
  }

  gotoEditor(): void {
    this.breadcrumbs.push(new Breadcrumb('edit-thing', {typeId: this.type.id}, this.context, this.getTitle()));
    this.listThingContextService.setContext(this.context);
    this.router.navigate(['edit-thing', { 'thingId': this.thing.id }]);
  }

  unlink(thing: Thing, attrdefn): void {
    let index = -1;
    for(let i = 0; i < attrdefn.value.length; i++) {
      let linkedThing = attrdefn.value[i];
      if(linkedThing.id == thing.id) {
        index = i;
      }
    }
    if(index >= 0) {
      attrdefn.value.splice(index, 1);
    }
    this.thing.attributes[attrdefn.name].value = attrdefn.value;
    // console.log('unlink', this.thing);
    let attribute = {thingId: this.thing.id, attrDefnId: attrdefn.id, value: []};
    for(let linkedThing of attrdefn.value) {
      attribute.value.push(linkedThing.id);
    }
    this.apiService.insertAttribute(attribute).subscribe(
      data => {
        // console.log('insertAttribute data:', data);
        if(data.status != 200) {
          alert(`insertAttribute failed: ${data.status}, ${data.message}`);
          return;
        }
      },
      error => {
        // console.log(error);
      });
  }

  view(thing: Thing): void {
    this.breadcrumbs.push(new Breadcrumb('view-thing', {thingId: this.thing.id}, null, this.getTitle()));
    this.listThingContextService.setContext(null);
    this.router.navigate(['view-thing', { 'thingId': thing.id }]);
  }

  delete(): void {
    this.apiService.deleteThing(this.thing.id).subscribe( data => {
      // console.log("deleteThing data", data);
      if(data.status != 200) {
        alert("Failed to delete thing: " + data.message);
        return;
      }
      this.gotoThings();
    });
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

  newLink(linktomeAttrDefn) {
    // console.log('newLink', linktomeAttrDefn);
    this.apiService.saveThing({id: null, typeId: linktomeAttrDefn.typeId, creator: 0, created: new Date()}).subscribe( data => {
      // console.log('newLink savething data', data);
      if(data.status != 200) {
        alert(`Failed to save thing: ${data.message}`);
        return;
      }
      let thingId = data.result.id;
      this.apiService.findAttrDefnByName(linktomeAttrDefn.typeId, 'name').subscribe( data => {
        // console.log('newLink find name attr defn data for type', linktomeAttrDefn.typeId, data);
        if(data.status != 200) {
          alert(`Failed to get attribute definition by name ${linktomeAttrDefn.typeId}, name: ${data.message}`);
          return;
        }
        let nameAttrDefn = data.result;
        let attribute = {thingId: thingId, attrDefnId: nameAttrDefn.id, value: linktomeAttrDefn.filterString};
        this.apiService.insertAttribute(attribute).subscribe( data => {
          // console.log('newLink insert name attr data', data);
          if(data.status != 200) {
            alert(`Failed to insert name attribute: ${data.message}`);
            return;
          }
          this.apiService.getThing(thingId).subscribe( data => {
            // console.log('newLink get untargeted thing data', data);
            if(data.status != 200) {
              alert(`Failed to get untargeted thing ${thingId}: ${data.message}`);
              return;
            }
            let linkThing = new FindThingResult(this.apiService, data.result);
            linkThing.init().subscribe( linkThing => {
              this.addLink(linktomeAttrDefn, linkThing, true);
            });
          });
        });
      });
    });
  }

  getBreadcrumbs(): Breadcrumb[] {
    return this.breadcrumbs.getBreadcrumbs();
  }

  gotoBreadcrumb(breadcrumb: Breadcrumb): void {
    this.breadcrumbs.clear(breadcrumb);
    this.listThingContextService.setContext(breadcrumb.getContext());
    this.router.navigate(breadcrumb.getNav());
  }

  gotoLinkType(linktomeAttrDefn: LinkAttrDefn): void {
    // console.log('gotoLinkType, thing', this.thing);
    this.breadcrumbs.push(new Breadcrumb('view-thing', {thingId: this.thing.id}, this.context, this.getTitle()));
    let context: ListThingContext = {linkAttrDefn: linktomeAttrDefn, linkedThing: this.thing};
    this.listThingContextService.setContext(context);
    this.router.navigate(['search', { 'typeId': linktomeAttrDefn.typeId, 'query': '*' }]);
  }

  expandFile(attrdefn: AttrDefnFormControl): void {
    attrdefn.expanded = !attrdefn.expanded;
  }

  addLinkTarget(attrdefn: AttrDefnFormControl): void {
    console.log('addLinkTarget attrdefn', attrdefn);
    this.router.navigate(['search', { 'typeId': attrdefn.targetTypeId, 'query': '*', 'select': `${this.thing.id}:${attrdefn.id}` }]);
  }
}
