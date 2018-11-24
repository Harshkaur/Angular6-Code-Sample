import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import 'rxjs/Rx';
import 'rxjs/add/operator/map';
import { environment } from '../../environments/environment';
let apiURL = environment.apiEndpoint;
import { AppConstant } from '../app.constant';
import {
    DataDocument, MetaTypeSource, MetaType, DataDocumentSource, ObjectDataNode,
    IPropertyDataNode, TextPropertyDataNode, PropertyDataNodeKeyedBag, ObjectGenericDataNode
} from "../index";
import { UserViewModel, UserFilterModel } from './user.model';
import { AuthenticatedHttpService } from '../../app/authentication/customauthentication.http.service';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { ReflectiveInjector } from '@angular/core';
import { map } from 'rxjs/operators';
@Injectable()
export class UserService {

    constructor(public http: AuthenticatedHttpService) {
    }

    getUser(userId: string): Observable<any> {
        return this.http.get(apiURL + '/user/Read?uri=/user/' + userId + '.xml').map(response => response.text());
    }
    deleteUser(userId: string): Observable<any> {
        return this.http.get(apiURL + '/user/DeleteUser?uri=/user/' + userId + '.xml').map(response => response.text());
    }
    getRegistrationV1(registrationId: string): Observable<any> {
        return this.http.get(apiURL + '/login/GetRegistration?registrationId=' + registrationId).map(response => response.text());
    }
    changeUserStatus(userId: string): Observable<any> {
        return this.http.get(apiURL + '/user/ChangeUserStatus?UserUri=/user/' + userId + '.xml').map(response => response.text());
    }
    deleteRegistration(regId: string): Observable<any> {
        return this.http.get(apiURL + '/user/Delete?uri=/user/invite/' + regId + '.xml').map(response => response.text());
    }
    reInviteUser(uri: string): Observable<any> {
        return this.http.get(apiURL + '/user/ReInviteUser?uri=' + uri).map(response => response.text());
    }
    logoutUser(): Observable<any> {
        return this.http.get(apiURL + '/login/logout').map(response => response.json());
    }
    public saveUser(doc: DataDocument, registrationId: string, authDoc: DataDocument) {
        let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
        let options = new RequestOptions({ headers: headers });
        var xml = doc.ToXml();
        xml = xml.replace(/<><\/>/g, "");
        var authxml = authDoc.ToXml();
        authxml = authxml.replace(/<><\/>/g, "");
        var data = new URLSearchParams();
        data.set('xml', encodeURI(xml));
        data.set('uri', doc.Uri);
        data.set('name', registrationId);
        data.set('childXml', encodeURI(authxml));
        data.set('childUri', authDoc.Uri);
        data.set('childName', '');
        return this.http.post(apiURL + '/login/SaveUser', data.toString(), options).map(response => response.json());
    }
    sendForgotPasswordEmailV1(email: string): Observable<any> {
        return this.http.get(apiURL + '/login/SendForgotPasswordEmailV1?email=' + email).map(response => response.json());
    }
    getResetPasswordV1(resetPasswordId: string): Observable<any> {
        return this.http.get(apiURL + '/login/GetResetPassword?uri=/user/resetpassword/' + resetPasswordId + '.xml').map(response => response.text());
    }
    public saveResetPassword(hashPassword: string, registrationId: string, dataURI: string) {
        let headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
        let options = new RequestOptions({ headers: headers });
        var data = new URLSearchParams();
        data.set('xml', hashPassword);
        data.set('uri', dataURI);
        data.set('name', registrationId);
        //data.set('loggedInUserURI', sessionStorage["UserId"]);
        return this.http.post(apiURL + '/login/SaveResetPassword', data.toString(), options).map(response => response.text());
    }
    public getUserList(model: UserFilterModel) {
        let headers = new Headers({ 'Content-Type': "application/json" });
        let options = new RequestOptions({ headers: headers });
        return this.http.post(apiURL + '/user/GetUserList', model, options).map(response => response.json());
    }
    public getUserInviteList(model: UserFilterModel) {
        let headers = new Headers({ 'Content-Type': "application/json" });
        let options = new RequestOptions({ headers: headers });
        return this.http.post(apiURL + '/user/GetUserInviteList', model, options).map(response => response.json());
    }
    public readByText(typeURI: string, propertyName: string, searchText: string) {
        return this.http.get(apiURL + "/login/MatchText?typeURI=" + typeURI + "&propertyName=" + propertyName + "&searchText=" + searchText + "&z=" + (new Date())).map(response => response.json());
    }
    read(uri: string): Observable<any> {
        return this.http.get(apiURL + '/user/Read?uri=' + uri).map(response => response.text());
    }
    
}