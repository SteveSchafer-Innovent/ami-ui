import { Component, OnInit } from '@angular/core';
import { take, map, concatAll, takeLast } from 'rxjs/operators';
import { interval, of } from 'rxjs';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css']
})
export class TestComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    // emit every 1s, take 2
    const e0$ = of(1, 2, 3);
    let a = [];
    const e1$ = e0$.pipe(
      map(val => {
        a.push(val);
        return a;
      }),
      takeLast(1)
    );
    e1$.subscribe(console.log);
  }

}
