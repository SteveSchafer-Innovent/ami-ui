import { Component, OnInit} from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from "@angular/router";
import { FormBuilder, FormGroup, FormArray, FormControl, Validators } from "@angular/forms";
import { Type } from "../../model/type.model";
import { ApiService } from "../../service/api.service";

@Component({
  selector: 'app-edit-type',
  templateUrl: './edit-type.component.html',
  styleUrls: ['./edit-type.component.css']
})
export class EditTypeComponent implements OnInit {
  type: Type;
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
      name: ['']
    });
    this.route.paramMap.subscribe((params: ParamMap) => {
      let id = +params.get('id');
      console.log(`edit-type id = ${id}`);
      if(id) {
        this.apiService.getType(id).subscribe( data => {
          console.log(data);
          this.type = data.result;
          this.form.controls['id'].setValue(this.type.id);
          this.form.controls['name'].setValue(this.type.name);
          console.log(this.form.value);
        });
      }
    });
  }

  getTitle(): string {
    if(!this.type) {
      return '';
    }
    let typeName = this.type.name;
    typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
    let adding = this.form.value.id == null;
    let prefix = adding ? 'Add' : 'Edit';
    return prefix + ' ' + typeName;
  }

  onSubmit() {
    let formValue = this.form.value;
    console.log(formValue);
    this.apiService.saveType(formValue.id, formValue.name).subscribe( data => {
      if(data.status != 200) {
        alert(data.message);
        return;
      }
      this.router.navigate(['list-type']);
    },
    error => {
      console.log(error);
    });
  }

  cancel() {
    this.router.navigate(['list-type']);
  }
}
