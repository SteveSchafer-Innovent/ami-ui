import { Component, OnInit , Inject} from '@angular/core';
import { Router } from "@angular/router";
import { User } from "../../model/user.model";
import { ApiService } from "../../service/api.service";

@Component({
  selector: 'app-list-user',
  templateUrl: './list-user.component.html',
  styleUrls: ['./list-user.component.css']
})
export class ListUserComponent implements OnInit {
  users: User[];

  constructor(private router: Router, private apiService: ApiService) { }

  ngOnInit() {
    if(!window.localStorage.getItem('token')) {
      this.router.navigate(['login']);
      return;
    }
    this.apiService.getUsers().subscribe( data => {
      this.users = data.result;
    });
  }

  deleteUser(user: User): void {
    this.apiService.deleteUser(user.id).subscribe( data => {
      if(data.status != 200) {
        alert(data.message);
        return;
      }
      this.apiService.getUsers().subscribe( data => {
        this.users = data.result;
      });
    })
  };

  editUser(user: User): void {
    window.localStorage.removeItem("editUserId");
    window.localStorage.setItem("editUserId", user.id.toString());
    this.router.navigate(['edit-user']);
  };

  addUser(): void {
    this.router.navigate(['add-user']);
  };
}
