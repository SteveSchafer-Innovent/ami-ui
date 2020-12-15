import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewThingComponent } from './view-thing.component';

describe('ViewThingComponent', () => {
  let component: ViewThingComponent;
  let fixture: ComponentFixture<ViewThingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewThingComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewThingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
