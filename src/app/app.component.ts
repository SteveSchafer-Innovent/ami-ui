import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'ami-ui';

  constructor(private router: Router) { }

  ngOnInit(): void {
  }

  navbarVisible(): boolean {
    return window.localStorage.getItem('token') != null;
  }

  logout(): void {
    window.localStorage.removeItem('token');
    this.router.navigate(['login']);
  }
}
