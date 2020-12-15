import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAttrDefnComponent } from './list-attrdefn.component';

describe('ListAttrDefnComponent', () => {
  let component: ListAttrDefnComponent;
  let fixture: ComponentFixture<ListAttrDefnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListAttrDefnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListAttrDefnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
