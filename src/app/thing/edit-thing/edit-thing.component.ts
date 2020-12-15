import { Component, OnInit, ChangeDetectionStrategy  } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from "@angular/forms";
import { Router, ActivatedRoute, ParamMap } from "@angular/router";

import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import { Type } from "../../model/type.model";
import { AttrDefn } from "../../model/attrdefn.model";
import { ApiService } from "../../service/api.service";
import { ListThingContextService, ListThingContext } from "../../service/list-thing-context.service";
import { FileUploadService } from "../../service/file-upload.service";
import { Breadcrumbs, Breadcrumb } from "../../service/breadcrumbs.service";
import { FindThingResult } from "../../model/find-thing-result.model";

class FileInfo {
  filename: string;
  mimeType: string;
  richText: string;
}

class AttrDefnFormControl extends AttrDefn {
  formControl: FormControl;
}

class LinkAttrDefnFormControl extends AttrDefnFormControl {
  targetTypeId: number;
  formArray: FormArray;
  multiple: boolean;
}

class RichTextAttrDefnFormControl extends AttrDefnFormControl {
  richTextModel: { editorData: string };
}

class FileAttrDefnFormControl extends AttrDefnFormControl {
  image: string | ArrayBuffer;
  filesToUpload: File[];
}

@Component({
  selector: 'app-edit-thing',
  templateUrl: './edit-thing.component.html',
  styleUrls: ['./edit-thing.component.css'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class EditThingComponent implements OnInit {
  form: FormGroup;
  type: Type;
  attrdefns: AttrDefn[];
  public Editor = ClassicEditor;
  editorConfig = {
    height: 500,
    placeholder: "Type the content here"
  };
  context: ListThingContext;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private listThingContextService: ListThingContextService,
    private breadcrumbs: Breadcrumbs,
    private fileUploadSevice: FileUploadService
  ) {
    console.log('Editor', this.Editor);
  }

  ngOnInit(): void {
    console.log('edit-thing ngOnInit');
    if(!window.localStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
    this.getParams();
  }

  getParams(): void {
    this.form = this.formBuilder.group({
    });
    this.route.paramMap.subscribe((params: ParamMap) => {
      let typeId = +params.get('typeId');
      let thingId = +params.get('thingId');
      console.log(`edit-thing typeId = ${typeId}, thingId = ${thingId}`);
      this.context = this.listThingContextService.getContext();
      if(thingId != 0) {
        if(typeId != 0) {
          console.log('typeId parameter is redundant');
        }
        this.initializeForEdit(thingId);
      }
      else {
        if(typeId == 0) {
          console.error('typeId parameter is missing');
          return;
        }
        this.initializeForAdd(typeId);
      }
    });
  }

  getAttrDefnsForAdd(typeId: number): void {
    this.apiService.getAttrDefns(typeId).subscribe( data => {
      console.log('getAttrDefns', typeId, data);
      if(data.status != 200) {
        alert(`Failed to get attribute definitions for add for type id ${typeId}: ${data.message}`);
        return;
      }
      this.attrdefns = data.result;
      for(let attrdefn of this.attrdefns) {
        console.log('attrdefn', attrdefn);
        let value;
        if(attrdefn.handler == 'float') {
          value = 0.0;
        }
        else if(attrdefn.handler == 'integer') {
          value = 0;
        }
        else if(attrdefn.handler == 'datetime') {
          value = new Date();
        }
        else if(attrdefn.handler == 'link') {
          if(this.context && this.context.linkAttrDefn && this.context.linkAttrDefn.id == attrdefn.id) {
            value = [this.context.linkedThing.id];
          }
          else {
            value = [];
          }
        }
        else {
          value = '';
        }
        this.initializeAttribute(attrdefn as AttrDefnFormControl, null, value);
        console.log(attrdefn);
      }
    });
  }

  initializeForAdd(typeId: number): void {
    this.apiService.getType(typeId).subscribe( data => {
      console.log('getType', typeId, data);
      if(data.status != 200) {
        alert(`Failed to get type ${typeId} for add: ${data.message}`);
        return;
      }
      this.type = data.result;
      this.form.addControl('id', new FormControl());
      this.getAttrDefnsForAdd(typeId);
    });
  }

  getAttrDefnsForEdit(typeId: number, thing: FindThingResult): void {
    this.apiService.getAttrDefns(typeId).subscribe( data => {
      console.log('getAttrDefns', typeId, data);
      if(data.status != 200) {
        alert(`Failed to get attribute definitions for type ${typeId} for edit: ${data.message}`);
        return;
      }
      this.attrdefns = data.result;
      for(let attrdefn of this.attrdefns) {
        console.log('attrdefn', attrdefn);
        let attribute = thing.attributes[attrdefn.name];
        console.log('attribute', attribute);
        let value;
        if(attribute) {
          value = attribute.value;
          if(attrdefn.handler == 'datetime') {
            console.log(`datetime value = ${value}, typeof = ${typeof value}`);
            // 2020-11-24T00:11:19.000+0000
            value = new Date(value);
            console.log(`datetime value = ${value}, typeof = ${typeof value}`);
          }
        }
        else {
          console.log('attribute value not found');
          if(attrdefn.handler == 'link') {
            value = [];
          }
          else if(attrdefn.handler == 'float' || attrdefn.handler == 'integer') {
            value = 0;
          }
          else {
            value = '';
          }
        }
        this.initializeAttribute(attrdefn as AttrDefnFormControl, thing, value);
      }
      console.log('form', this.form);
    });
  }

  initializeAttribute(attrdefn: AttrDefnFormControl, thing: FindThingResult, value: any): void {
    if(attrdefn.handler == 'rich-text') {
      (attrdefn as RichTextAttrDefnFormControl).richTextModel = value;
    }
    if(attrdefn.handler == 'link') {
      let form = this.form;
      let formArray = new FormArray([]);
      if((attrdefn as LinkAttrDefnFormControl).multiple) {
        for(let oneValue of value) {
          formArray.push(this.createFormControl(attrdefn, +oneValue));
        }
        formArray.push(this.createFormControl(attrdefn, 0));
      }
      else {
        if(value.length > 0) {
          formArray.push(this.createFormControl(attrdefn, +value[0]));
        }
        else {
          formArray.push(this.createFormControl(attrdefn, 0));
        }
      }
      this.form.addControl(attrdefn.name, formArray);
      (attrdefn as LinkAttrDefnFormControl).formArray = formArray;
    }
    else {
      let formControl = new FormControl(value, Validators.required);
      (attrdefn as AttrDefnFormControl).formControl = formControl;
      this.form.addControl(attrdefn.name, formControl);
    }
    if(attrdefn.handler == 'file') {
      // get the image
      if(thing) {
        let fileAttrDefn = attrdefn as FileAttrDefnFormControl;
        fileAttrDefn.image = null;
        console.log('file value', value);
        if(value.mimeType != null && value.mimeType.startsWith('image/')) {
          this.apiService.downloadFile(thing.id, attrdefn.id).subscribe(file => {
            console.log('getImage downloadFile file', file);
            const reader = new FileReader();
            reader.addEventListener('loadend', () => {
              let dataUrl = reader.result;
              fileAttrDefn.image = dataUrl;
            });
            reader.readAsDataURL(file.body);
          });
        }
      }
    }
  }

  getTypeForEdit(typeId: number, thing: FindThingResult): void {
    this.apiService.getType(typeId).subscribe( data => {
      console.log('getType', typeId, data);
      if(data.status != 200) {
        alert(`Failed to get type ${typeId} for edit: ${data.message}`);
        return;
      }
      this.type = data.result;
      this.getAttrDefnsForEdit(typeId, thing);
    });
  }

  initializeForEdit(thingId: number): void {
    this.form.addControl('id', new FormControl(thingId));
    this.apiService.getThing(thingId).subscribe( data => {
      console.log('getThing', thingId, data);
      if(data.status != 200) {
        alert(`Failed to get thing ${thingId}: ${data.message}`);
        return;
      }
      let thing = new FindThingResult(this.apiService, data.result);
      this.form.addControl('creator', new FormControl(thing.creator.id));
      this.form.addControl('created', new FormControl(thing.created));
      this.getTypeForEdit(thing.type.id, thing);
    });
  }

  createFormControl(attrdefn, thingId): FormControl {
    let formControl = new FormControl(thingId, Validators.required);
    formControl.valueChanges.subscribe(thingId => {
      console.log(`link control valueChanges thingId = ${thingId}`);
      let formArray = this.form.controls[attrdefn.name] as FormArray; // array of thing ids
      let thingIds = {}; // to eliminate duplicates
      let i = 0;
      while(i < formArray.length) {
        let formControl = formArray.controls[i];
        if(formControl.value == 0) {
          formArray.removeAt(i);
        }
        else if(thingIds[formControl.value]) {
          formArray.removeAt(i);
        }
        else {
          thingIds[formControl.value] = true;
          i++;
        }
      }
      // TODO - if clause not tested
      if((attrdefn as LinkAttrDefnFormControl).multiple || formArray.length == 0) {
        formArray.push(this.createFormControl(attrdefn, 0));
      }
      this.form.controls[attrdefn.name] = formArray;
    });
    return formControl;
  };

  getTypeName(): string {
    console.log('getTypeName', this.type);
    if(this.type) {
      return this.type.name;
    }
    return "?";
  }

  getTitle(): string {
    let typeName = this.getTypeName();
    typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
    let prefix = this.form ? this.form.value.id == null ? 'Add' : 'Edit' : '';
    return prefix + ' ' + typeName;
  }

  trackAttrDefn(index, attrdefn) {
    return attrdefn ? attrdefn.id : undefined;
  }

  downloadFile(attrdefn) {
    console.log('downloadFile', attrdefn);
    let formValue = this.form.value;
    let thingId = formValue.id;
    if(thingId == null) {
      alert("Thing not known")
      return;
    }
    let observable = this.apiService.downloadFile(thingId, attrdefn.id);
    observable.subscribe((file) => {
      console.log('downloadFile', file);
      const link = document.createElement('a');
      console.log('link', link);
      if(link.download !== undefined) {
        const url = URL.createObjectURL(file.body);
        console.log(url);
        link.setAttribute('href', url);
        link.setAttribute('download', attrdefn.formControl.value.filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  }

  uploadFile(event, attrdefn) {
    console.log('uploadFile', event);
    attrdefn.filesToUpload = event;
    for(let attrdefn of this.attrdefns) {
      if(attrdefn.handler == 'string' && attrdefn.name == 'name') {
        let formControl = (attrdefn as AttrDefnFormControl).formControl;
        if(formControl.value == '') {
          if(event.length > 0) {
            let name = event[0].name;
            let re = /(.*)\.[^.]+/;
            let reResult = re.exec(name);
            name = reResult[1];
            name = name.replace('_', ' ');
            formControl.setValue(name);
          }
        }
      }
    }
  }

  onSubmit() {
    let formValue = this.form.value;
    console.log('formValue', formValue);
    formValue.typeId = this.type.id;
    this.apiService.saveThing(formValue).subscribe( data => {
      console.log('saveThing data:', data);
      if(data.status != 200) {
        alert(`saveThing failed: ${data.status}, ${data.message}`);
        return;
      }
      let thingId = data.result.id;
      for(let attrdefn of this.attrdefns) {
        console.log('save attrdefn', attrdefn);
        let attribute = {thingId: thingId, attrDefnId: attrdefn.id, value: null};
        if(attrdefn.handler == 'file') {
          let fileAttrDefn = attrdefn as FileAttrDefnFormControl;
          let filesToUpload = fileAttrDefn.filesToUpload;
          attribute.value = null;
          if(filesToUpload == null || filesToUpload.length == 0) {
            console.log('No files provided');
          }
          else if(filesToUpload.length >= 1)  {
            const file = filesToUpload[0];
            if(filesToUpload.length > 1) {
              alert(`Only ${file.name} will be uploaded.`);
            }
            console.log('upload', file.name);
            this.apiService.postFile(file, thingId, attrdefn.id).subscribe( data => {
                console.log("file uploaded:", data);
                if(data.status != 200) {
                  alert(data.message);
                  return;
                }
                attribute.value = data.result;
                this.apiService.insertAttribute(attribute).subscribe( data => {
                    console.log('insertAttribute data:', data);
                    if(data.status != 200) {
                      alert(`insertAttribute failed: ${data.status}, ${data.message}`);
                      return;
                    }
                  },
                  error => {
                    console.log(error);
                  });
              },
              error => {
                console.log(error);
              });
          }
        }
        else {
          if(attrdefn.handler == 'link') {
            let values = formValue[attrdefn.name];
            attribute.value = [];
            for(let value of values) {
              attribute.value.push(+value);
            }
          }
          else if(attrdefn.handler == 'rich-text') {
            let richTextAttrDefn = attrdefn as RichTextAttrDefnFormControl;
            attribute.value = richTextAttrDefn.richTextModel.editorData;
          }
          else if(attrdefn.handler == 'float' || attrdefn.handler == 'integer') {
            attribute.value = +formValue[attrdefn.name];
          }
          else {
            attribute.value = formValue[attrdefn.name];
          }
          if(attribute.value == null) {
            console.log('value is null');
          }
          else {
            this.apiService.insertAttribute(attribute).subscribe(
              data => {
                console.log('insertAttribute data:', data);
                if(data.status != 200) {
                  alert(`insertAttribute failed: ${data.status}, ${data.message}`);
                  return;
                }
              },
              error => {
                console.log(error);
              });
          }
        }
      }
      this.goBack();
    },
    error => {
      console.log(error);
    });
  }

  cancel(): void {
    this.goBack();
  }

  goBack(): void {
    if(this.context) {
      let breadcrumb = this.breadcrumbs.pop();
      this.listThingContextService.setContext(breadcrumb.getContext());
      this.router.navigate(breadcrumb.getNav());
    }
    else {
      this.router.navigate(['list-thing', { 'typeId': this.type.id }]);
    }
  }
}
