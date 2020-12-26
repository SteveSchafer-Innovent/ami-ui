import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { formatDate } from '@angular/common';

import { Observable } from "rxjs/index";
import { catchError, retry } from 'rxjs/operators';
import { throwError, concat, of } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiResponse } from "../model/api.response";
import { User } from "../model/user.model";
import { Thing } from "../model/thing.model";
import { AttrDefn } from "../model/attrdefn.model";
import { Attribute } from "../model/attribute.model";

@Injectable()
export class ApiService {
  baseUrl: string = `http://${environment.host}:${environment.port}`;

  constructor(private http: HttpClient) {
    console.log('constructing ApiService', http);
  }

  login(loginPayload) : Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/token/generate-token`, loginPayload);
  }

  private handleError(val: ApiResponse): void {
    console.log('caught error, val:');
    console.log(val);
    if(val.status === 401) {
      console.log('removing token');
      window.localStorage.removeItem('token');
    }
  }

  getUsers() : Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/users/`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getUserById(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/user/${id}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  createUser(user: User): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/user/`, user).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  updateUser(user: User): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/user`, user).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  changePassword(form: {password: string}): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/user/password`, form).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getContext(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/user/context`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  setContext(context: string): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.baseUrl}/user/context`, {context: context}).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  deleteUser(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/user/${id}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getThing(thingId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/thing/${thingId}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getThings(typeId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/things/${typeId}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  saveThing(thing: Thing): Observable<ApiResponse> {
    console.log('saveThing', thing);
    let url = `${this.baseUrl}/thing/`;
    let observable: Observable<ApiResponse> = null;
    if(thing.id == null) {
      observable = this.http.post<ApiResponse>(url, thing);
    }
    else {
      observable = this.http.put<ApiResponse>(url, thing);
    }
    return observable.pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  saveThingOrder(typeId: number, contextThingId: number, thingIds: number[]) {
    console.log('saveThingOrder', typeId, contextThingId, thingIds);
    let requestObj = {typeId: typeId, contextThingId: contextThingId, thingIds: thingIds};
    return this.http.put<ApiResponse>(`${this.baseUrl}/thing/order`, requestObj).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  deleteAttributesByThingId(thingId: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/attributes-by-thing/${thingId}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  deleteThing(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/thing/${id}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getTypes() : Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/types/`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getType(id: number) : Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/type/${id}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  saveType(id: number, name: string): Observable<ApiResponse> {
    let url = `${this.baseUrl}/type`;
    let observable: Observable<ApiResponse> = null;
    if(id) {
      let type = { id: id, name: name };
      observable = this.http.put<ApiResponse>(url, type);
    }
    else {
      let type = { name: name };
      observable = this.http.post<ApiResponse>(url, type);
    }
    return observable.pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  deleteType(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/type/${id}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getAttrDefns(typeId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/attrdefns/${typeId}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getAttrDefn(id: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/attrdefn/${id}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  findAttrDefnByName(typeId: number, name: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/attrdefnByName?typeId=${typeId}&name=${name}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getLinkAttrDefns(targetTypeId: number): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/link-attrdefns/${targetTypeId}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  saveAttrDefn(attrdefn: AttrDefn): Observable<ApiResponse> {
    let url = `${this.baseUrl}/attrdefn`;
    let observable: Observable<ApiResponse> = null;
    if(attrdefn.id) {
      observable = this.http.put<ApiResponse>(url, attrdefn);
    }
    else {
      observable = this.http.post<ApiResponse>(url, attrdefn);
    }
    return observable.pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  deleteAttrDefn(id: number): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/attrdefn/${id}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getHandlers(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/handlers`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  insertAttribute(attribute: Attribute) {
    return this.http.post<ApiResponse>(`${this.baseUrl}/attribute`, attribute).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  updateAttribute(attribute: Attribute) {
    return this.http.put<ApiResponse>(`${this.baseUrl}/attribute`, attribute).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  getAttribute(thingId: number, attrDefnId: number) {
    console.log(`getAttribute ${thingId}, ${attrDefnId}`);
    return this.http.get<ApiResponse>(`${this.baseUrl}/attribute/${thingId}/${attrDefnId}`).pipe(
      catchError(val => {
        this.handleError(val);
        return of(val);
      })
    );
  }

  downloadFile(thingId: number, attrdefnId: number) {
    let url = `${this.baseUrl}/download/${thingId}/${attrdefnId}`;
    return this.http.get(url, {responseType: 'blob', observe: 'response'});
  }

  postFile(fileToUpload: File, thingId: number, attrId: number): Observable<ApiResponse> {
      console.log("postFile", fileToUpload, thingId, attrId);
      const formData: FormData = new FormData();
      formData.set('file', fileToUpload, fileToUpload.name);
      formData.set('thingId', "" + thingId);
      formData.set('attrId', "" + attrId);
      return this.http.post<ApiResponse>(`${this.baseUrl}/upload`, formData).pipe(
      catchError(val => {
        console.log('val:', val);
        return of(val);
      })
    );
  }
}