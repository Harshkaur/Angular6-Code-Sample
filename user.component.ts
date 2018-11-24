import { Component, ViewEncapsulation, ViewChild, TemplateRef, OnInit, AfterViewInit, AfterContentChecked } from '@angular/core';
import { Validators, FormGroup, FormArray, FormBuilder, FormControl, AbstractControl, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';
import { Http, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/map';
import { NgbModal, NgbDateStruct, NgbTimeStruct } from '@ng-bootstrap/ng-bootstrap';
import { IMultiSelectOption, IMultiSelectSettings, IMultiSelectTexts } from 'angular-2-dropdown-multiselect';
import { UserService } from "../user/user.service";
import { UserViewModel, StateViewModel, PermissionViewModel, CityViewModel } from './user.model';
import {
    DataDocument, MetaTypeSource, MetaType, DataDocumentSource, ObjectDataNode,
    IPropertyDataNode, TextPropertyDataNode, PropertyDataNodeKeyedBag, ObjectGenericDataNode
} from "../index";
import { XmlMap } from "../bridge";
import { AppService } from "../app.service";
import { AppCommon } from "../app.common";
import * as d from "../data";
import { AppConstant } from '../app.constant';
import { switchMap, debounceTime, tap, finalize } from 'rxjs/operators';
declare var $: any;
@Component({
    selector: 'app-user-detail',
    templateUrl: './user.component.html',
    encapsulation: ViewEncapsulation.None,
    providers: [UserService, AppService],
    styleUrls: ['./user.component.css']
})

export class UserComponent implements OnInit, AfterViewInit, AfterContentChecked {

    public appCommon: AppCommon;
    public userForm: FormGroup; // our form model
    static Doc: DataDocument;
    public userId: string = "";
    public doc: DataDocument;
    public cityList: CityViewModel[] = [];
    public permissionList: IMultiSelectOption[] = [];
    constructor(private _AppService: AppService,
        private _UserService: UserService,
        private router: Router,
        private location: Location,
        private _fb: FormBuilder,
        private route: ActivatedRoute) {
        this.appCommon = new AppCommon(router);
        this.addhtmltoform(new UserViewModel());
        this.permissionList = this.appCommon.GetPermissionList();
    }

    ngAfterViewInit() {

    }
    ngAfterContentChecked() {

    }
    ngOnInit() {

        //this.cityList = this.appCommon.GetCityList();
        this.route.params.subscribe(params => {
            this.userId = params[AppConstant.ParameterId] as string; //log the value of id
            if (this.userId == null || this.userId == undefined)
                this.userId = "";
        });
        if (this.userId == "") {
            var type = MetaTypeSource.Instance.GetMetaType(AppConstant.XMLPathUser);
            this.doc = new DataDocument({ type: type });
            this.doc.RootObject = new ObjectDataNode({ type: type });

        }
        else {
            var docXml = "";
            this._UserService.getUser(this.userId).subscribe(res => {
                docXml = res;
                this.doc = DataDocument.FromXmlNode(XmlMap.parse(docXml));
                this.doc.Uri = AppConstant.FolderUser + this.userId + AppConstant.XmlExtension;
                var editModel: UserViewModel = new UserViewModel();
                var propertyNodes: PropertyDataNodeKeyedBag = this.doc.RootObject.PropertyNodes;
                editModel.FirstName = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.FirstName);
                editModel.Email = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.Email);
                editModel.LastName = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.LastName);
                editModel.Title = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.Title);
                editModel.Institution = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.Institution);
                editModel.CellPhone = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.CellPhone);
                editModel.OfficePhone = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.OfficePhone);
                editModel.Street = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.Street);
                //editModel.City = this.appCommon.GetLookupSingleNodeValue(propertyNodes, AppConstant.City);
                //editModel.State = this.appCommon.GetLookupSingleNodeValue(propertyNodes, AppConstant.State);
                editModel.Zip = this.appCommon.GetTextPropertyNodeValue(propertyNodes, AppConstant.Zip);
                editModel.Permission = this.appCommon.GetLookupMultipleNodeValue(propertyNodes, AppConstant.Permission).map(x => x.Uri);

                var cityURL: string = this.appCommon.GetLookupSingleNodeValue(propertyNodes, AppConstant.City);
                var stateURL: string = this.appCommon.GetLookupSingleNodeValue(propertyNodes, AppConstant.State);
                this._UserService.read(cityURL).subscribe((cityResponse: string) => {
                    var cityDoc = DataDocument.FromXmlNode(XmlMap.parse(cityResponse));
                    editModel.City = new CityViewModel();
                    editModel.City.Name = this.appCommon.GetDisplayText(cityDoc);
                    editModel.City.Uri = cityURL;


                    this._UserService.read(stateURL).subscribe((stateResponse: string) => {
                        var stateDoc = DataDocument.FromXmlNode(XmlMap.parse(stateResponse));
                        editModel.State = new StateViewModel();
                        editModel.State.Name = this.appCommon.GetDisplayText(stateDoc);
                        editModel.State.Uri = stateURL;
                        editModel.State.Abbrev = this.appCommon.GetValueText(stateDoc);
                        this.addhtmltoform(editModel);
                        this.getCityMatchText(editModel.City.Name);
                        this.getStateMatchText(editModel.State.Abbrev);

                    });



                });


            });

        }


    }

    public addhtmltoform(model: UserViewModel) {
        this.userForm = this._fb.group({
            FirstName: [model.FirstName, [Validators.required, Validators.maxLength(500)]],
            LastName: new FormControl(model.LastName, [Validators.required, Validators.maxLength(500)]),
            Email: new FormControl(model.Email, [Validators.required, Validators.email, Validators.maxLength(500)]),
            Title: [model.Title, [Validators.required, Validators.maxLength(500)]],
            Institution: [model.Institution, [Validators.required, Validators.maxLength(500)]],
            CellPhone: [model.CellPhone, [Validators.required, Validators.maxLength(15)]],
            OfficePhone: [model.OfficePhone, [Validators.required, Validators.maxLength(15)]],
            Street: [model.Street, [Validators.required, Validators.maxLength(500)]],
            City: [model.City, [Validators.required]],
            State: [model.State, [Validators.required]],
            Zip: [model.Zip, [Validators.required, Validators.maxLength(10)]],
            Permission: [model.Permission],
        });
    }

    public SaveUser(user: UserViewModel) {
        if (user.City.Uri === "" || user.City.Uri === null || user.City.Uri === undefined) {
            alert("Please select city.");
            return;
        }
        if (user.State.Uri === "" || user.State.Uri === null || user.State.Uri === undefined) {
            alert("Please select state.");
            return;
        }
        var propertyNodes: PropertyDataNodeKeyedBag = this.doc.RootObject.PropertyNodes;
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.FirstName, user.FirstName);
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.LastName, user.LastName);
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.Email, user.Email.toLowerCase());
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.Title, user.Title);
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.Institution, user.Institution);
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.CellPhone, user.CellPhone);
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.OfficePhone, user.OfficePhone);
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.Street, user.Street);
        this.appCommon.SetLookupSingleNodeValue(propertyNodes, AppConstant.City, this.appCommon.GetSelectedDataDocumentFromLookUpSingle(this.result, user.City.Uri));
        this.appCommon.SetLookupSingleNodeValue(propertyNodes, AppConstant.State, this.appCommon.GetSelectedDataDocumentFromLookUpSingle(this.stateResult, user.State.Uri));
        this.appCommon.SetTextPropertyNodeValue(propertyNodes, AppConstant.Zip, user.Zip);
        this.appCommon.ClearLookupMultipleNodeValue(propertyNodes, AppConstant.Permission);
        for (var per of user.Permission) {
            this.appCommon.SetLookupMultipleNodeValue(propertyNodes, AppConstant.Permission, this.appCommon.GetSelectedDataDocumentFromLookUpSingle(this.appCommon.GetPermissionDocumentList(), per));
        }
        this.doc.Uri = AppConstant.FolderUser + this.doc.RootObject.SId + AppConstant.XmlExtension;
        this._AppService.saveXML(this.doc).subscribe(() => {
            this.router.navigate([AppConstant.UserListURL]);
        });

    }
    public redirectToListPage() {
        this.router.navigate([AppConstant.UserListURL]);
    }

    public result: DataDocument[] = [];
    public getCityMatchText(data: string) {
        if (data == null || data == undefined || data == "")
            data = $('#cityTextBox').val();
        this.cityList = [];
        if (data != null && data != undefined && data.length > 2) {
            this.isLoading = true;
            this._UserService.readByText("/Core/types/City.xml", "Name", data).subscribe((responsestr: string) => {
                this.result = [];
                var xroot = XmlMap.parse(responsestr);
                XmlMap.eachChild(xroot, (child, i) => {
                    var uri = XmlMap.getChildTextByName(child, "Uri");
                    var docNode = XmlMap.getChildByName(child, "Doc").children[0];
                    var doc = DataDocument.FromXmlNode(docNode);
                    doc.Uri = uri;
                    this.result.push(doc)
                });
                for (let cityDocument of this.result) {
                    var city = new CityViewModel();
                    city.Name = this.appCommon.GetDisplayText(cityDocument);
                    city.Uri = cityDocument.Uri;
                    this.cityList.push(city);
                }
                this.isLoading = false;
            });
        }
    }
    public isLoading = false;

    displayFn(city: CityViewModel) {
        if (city) { return city.Name; }
    }
    public cityClosed() {
        var cityValue = this.userForm.controls["City"].value;
        if (cityValue.Name == undefined) {
            this.userForm.controls["City"].setValue("");
            $('#cityTextBox').val("");
            this.cityList = [];
            this.result = [];
        }
    }

    public cityOpened() {
    }

    //======= StateViewModel 
    public stateList: StateViewModel[] = [];
    public stateResult: DataDocument[] = [];
    public isStateLoading: boolean = false;
    public getStateMatchText(data: string) {
        if (data == null || data == undefined || data == "")
            data = $('#stateTextBox').val();
        this.stateList = [];
        if (data != null && data != undefined && data.length > 0) {
            this.isStateLoading = true;
            this._UserService.readByText("/Core/types/State.xml", "Abbrev,Name", data.split(' -')[0]).subscribe((responsestr: string) => {
                this.stateResult = [];
                var xroot = XmlMap.parse(responsestr);
                XmlMap.eachChild(xroot, (child, i) => {
                    var uri = XmlMap.getChildTextByName(child, "Uri");
                    var docNode = XmlMap.getChildByName(child, "Doc").children[0];
                    var doc = DataDocument.FromXmlNode(docNode);
                    doc.Uri = uri;
                    this.stateResult.push(doc);
                });
                for (let stateDocument of this.stateResult) {
                    var state = new StateViewModel();
                    state.Name = this.appCommon.GetDisplayText(stateDocument);
                    state.Abbrev = this.appCommon.GetValueText(stateDocument);
                    state.Uri = stateDocument.Uri;
                    this.stateList.push(state);
                }
                this.isStateLoading = false;

            });
        }
    }
    displayFnState(state: StateViewModel) {
        if (state && state.Abbrev != undefined) { return state.Abbrev + ' - ' + state.Name; }
    }
    public stateClosed() {
        var stateValue = this.userForm.controls["State"].value;
        if (stateValue.Name == undefined) {
            this.userForm.controls["State"].setValue("");
            $('#stateTextBox').val("");
            this.stateList = [];
            this.stateResult = [];
        }
    }

    public stateOpened() {
    }
}

