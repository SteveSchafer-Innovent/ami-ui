import { NgModule } from "@angular/core";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon'
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatTableModule, MatIconModule, DragDropModule],
  exports: [CommonModule, MatToolbarModule, MatButtonModule, MatTableModule, MatIconModule, DragDropModule],
})
export class CustomMaterialModule { }