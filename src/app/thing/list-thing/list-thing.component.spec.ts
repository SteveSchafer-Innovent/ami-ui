import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListThingComponent } from './list-thing.component';

describe('ListThingComponent', () => {
  let component: ListThingComponent;
  let fixture: ComponentFixture<ListThingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListThingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListThingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
