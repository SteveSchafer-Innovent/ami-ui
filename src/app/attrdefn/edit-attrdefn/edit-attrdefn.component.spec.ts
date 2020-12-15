import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAttrDefnComponent } from './edit-attrdefn.component';

describe('EditAttrDefnComponent', () => {
  let component: EditAttrDefnComponent;
  let fixture: ComponentFixture<EditAttrDefnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditAttrDefnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAttrDefnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
