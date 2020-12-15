import { Component, OnInit} from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from "@angular/forms";
import { Type } from "../../model/type.model";
import { ApiService } from "../../service/api.service";

class AttrDefn {
  id: number;
  name: string;
  handler: string;
  typeId: number;
  targetTypeId: number;
  multiple: boolean;
  showInList: boolean;
  editInList: boolean;
  order: number;
}

@Component({
  selector: 'app-edit-attrdefn',
  templateUrl: './edit-attrdefn.component.html',
  styleUrls: ['./edit-attrdefn.component.css']
})
export class EditAttrDefnComponent implements OnInit {
  attrdefn: AttrDefn;
  type: Type;
  types: Type[];
  handlers: string[];
  form: FormGroup;

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
      id: [],
      name: [''],
      handler: [''],
      typeId: [''],
      targetTypeId: [],
      multiple: [],
      showInList: [],
      editInList: [],
      order: []
    });
    this.apiService.getHandlers().subscribe( data => {
      if(data.status != 200) {
        alert(`Failed to fetch handlers: ${data.message}`);
        return;
      }
      this.handlers = data.result;
      console.log('handlers', this.handlers);
      this.apiService.getTypes().subscribe( data => {
        if(data.status != 200) {
          alert(`Failed to fetch types: ${data.message}`);
          return;
        }
        this.types = data.result;
        this.types.push({id: 0, name: "any", sourceLinkCount: 0, targetLinkCount: 0, thingCount: 0, attrCount: 0});
        console.log('types', this.types);
        this.route.paramMap.subscribe((params: ParamMap) => {
          let id = +params.get('id');
          let typeId = +params.get('typeId');
          console.log(`edit-attrdefn id = ${id}`);
          if(id) {
            this.apiService.getAttrDefn(id).subscribe( data => {
              console.log('getAttrDefn', id, data);
              if(data.status != 200) {
                alert(data.message);
                return;
              }
              this.attrdefn = data.result;
              this.apiService.getType(this.attrdefn.typeId).subscribe( data => {
                if(data.status != 200) {
                  alert(`Failed to fetch type ${typeId}: ${data.message}`);
                }
                else {
                  this.type = data.result;
                }
              });
              this.form.controls['id'].setValue(this.attrdefn.id);
              this.form.controls['name'].setValue(this.attrdefn.name);
              this.form.controls['handler'].setValue(this.attrdefn.handler);
              this.form.controls['typeId'].setValue(this.attrdefn.typeId);
              this.form.controls['targetTypeId'].setValue(this.attrdefn.targetTypeId || 0);
              this.form.controls['multiple'].setValue(this.attrdefn.multiple || false);
              this.form.controls['showInList'].setValue(this.attrdefn.showInList || false);
              this.form.controls['editInList'].setValue(this.attrdefn.editInList || false);
              this.form.controls['order'].setValue(this.attrdefn.order);
              console.log('form.value', this.form.value);
            });
          }
          else {
            this.apiService.getType(typeId).subscribe( data => {
              if(data.status != 200) {
                alert(`Failed to fetch type ${typeId}: ${data.message}`);
              }
              else {
                this.type = data.result;
              }
            });
            this.attrdefn = {
              id: 0,
              name: '',
              handler: '',
              typeId: typeId,
              targetTypeId: null,
              multiple: false,
              showInList: false,
              editInList: false,
              order: 0
            };
            this.form.controls['id'].setValue(this.attrdefn.id);
            this.form.controls['name'].setValue(this.attrdefn.name);
            this.form.controls['handler'].setValue(this.attrdefn.handler);
            this.form.controls['typeId'].setValue(this.attrdefn.typeId);
            this.form.controls['targetTypeId'].setValue(this.attrdefn.targetTypeId || 0);
            this.form.controls['multiple'].setValue(this.attrdefn.multiple || false);
            this.form.controls['showInList'].setValue(this.attrdefn.showInList || false);
            this.form.controls['editInList'].setValue(this.attrdefn.editInList || false);
            this.form.controls['order'].setValue(this.attrdefn.order || 0);
          }
        });
      });
    });
  }

  getTitle(): string {
    let typeName = '';
    if(this.type) {
      typeName = this.type.name;
      typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
    }
    else {
      typeName = '';
    }
    if(!this.attrdefn) {
      return '';
    }
    let prefix = this.attrdefn.id == 0 ? 'Add' : 'Edit';
    return `${prefix} ${typeName} Attribute`;
  }

  onSubmit() {
    let formValue = this.form.value;
    formValue.targetTypeId = +formValue.targetTypeId;
    formValue.order = +formValue.order;
    console.log(formValue);
    this.apiService.saveAttrDefn(formValue).subscribe( data => {
      if(data.status != 200) {
        alert(data.message);
        return;
      }
      this.router.navigate(['list-attrdefn', {typeId: this.attrdefn.typeId}]);
    },
    error => {
      console.log(error);
    });
  }

  cancel() {
    this.router.navigate(['list-attrdefn', {typeId: this.attrdefn.typeId}]);
  }
}
