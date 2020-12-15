import { Type } from "./type.model";
import { User } from "./user.model";
import { Attribute } from "./attribute.model";
import { ApiService } from "../service/api.service";

export class FindThingResult {
  id: number;
  type: Type;
  created: Date;
  creator: User;
  attributes: any;
  links: any;
  name: string;
  image: any;
  parent: FindThingResult;
  presentation: string;

  constructor(private apiService: ApiService, thing) {
    this.id = thing.id;
    this.type = thing.type;
    this.created = thing.created;
    this.creator = thing.creator;
    this.attributes = thing.attributes;
    this.links = thing.links;
    this.name = thing.name;
    this.image = thing.image;
    this.parent = thing.parent;
    this.presentation = this.getThingName(thing);
    let model = this;
    this.setParent(this, {}, function() {
      model.name = model.getThingName(thing);
      model.setThingImage(thing, thing);
    });
  }

  private setParent(thing: FindThingResult, recursion: {}, callback) {
    if(recursion[thing.id]) {
      console.error(`parent recursion detected for thing ${thing.id}`);
      callback();
      return;
    }
    recursion[thing.id] = true;
    if(thing.attributes.parent && thing.attributes.parent.value) {
      let parents = thing.attributes.parent.value;
      console.log('parents', parents);
      if(parents.length > 0) {
        let parentId = parents[0];
        this.apiService.getThing(parentId).subscribe( data => {
          console.log('getThing data', data);
          if(data.status != 200) {
            console.log(`Failed to get parent thing ${parentId}`);
            return;
          }
          thing.parent = data.result;
          this.setParent(thing.parent, recursion, callback);
        });
      }
      else {
        callback();
      }
    }
    else {
      callback();
    }
  }

  private getThingName(thing): string {
    let name: string;
    if(thing.attributes.name && thing.attributes.name.value) {
      name = thing.attributes.name.value;
    }
    else {
      name = `${this.type.name} ${this.id}`;
    }
    if(thing.parent) {
      return name + ' ' + this.getThingName(thing.parent);
    }
    return name;
  }

  private setThingImage(targetThing, thing) {
    if(thing.attributes.image && thing.attributes.image.value) {
      let observable = this.apiService.downloadFile(thing.id, thing.attributes.image.id);
      observable.subscribe((file) => {
        console.log('file', file);
        // method 1 - more compact URL
        // need to revokeObjectURL after image is loaded
        // const url = URL.createObjectURL(file.body); // does not work on file
        // console.log('url', url);
        // let image = this.sanitizer.bypassSecurityTrustUrl(url);
        // console.log(image);
        // thing.image = image;
        // method 2 - data URL
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          let dataUrl = reader.result;
          targetThing.image = dataUrl;
          // let s = String.fromCharCode.apply(null, arrayBuffer);
          // console.log('string', s);
          // let base64String = btoa(s);
          // console.log('base64String', base64String);
          // thing.image = 'data:image/jpeg;base64,' + base64String;
          // console.log(thing.image);
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