import { Component, OnInit , Inject} from '@angular/core';
import { Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { first } from "rxjs/operators";
import { User } from "../../model/user.model";
import { ApiService } from "../../service/api.service";

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  user: User;
  editForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.editForm = this.formBuilder.group({
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    this.apiService.changePassword(this.editForm.value).subscribe(data => {
      if(data.status != 200) {
        alert(data.message);
        return;
      }
      alert('Password changed successfully.');
      this.router.navigate(['list-type']);
    },
    error => {
      alert(error);
    });
  }
}