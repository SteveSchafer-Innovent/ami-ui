import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { formatDate } from '@angular/common';

import { Observable } from "rxjs/index";

import { environment } from '../../environments/environment';
import { ApiResponse } from "../model/api.response";

@Injectable()
export class FileUploadService {
  baseUrl: string = `http://${environment.host}:${environment.port}`;
  constructor(private http: HttpClient) { }

  postFile(fileToUpload: File, thingId: number, attrId: number): any {
      console.log("postFile");
      console.log(fileToUpload);
      const formData: FormData = new FormData();
      formData.set('file', fileToUpload, fileToUpload.name);
      formData.set('thingId', "" + thingId);
      formData.set('attrId', "" + attrId);
      return this.http.post<any>(`${this.baseUrl}/upload`, formData, {
        reportProgress: true,
        observe: 'events'
      });
  }
}