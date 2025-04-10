import { LightningElement, api, track, wire } from 'lwc';
import OFFER_OBJECT from '@salesforce/schema/Offer__c';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { getRecord, getFieldValue} from 'lightning/uiRecordApi';
import NEWUSED_FIELD from '@salesforce/schema/Opportunity.NewUsed__c';

// importing Custom Label
import Submit from '@salesforce/label/c.BuildaCarSubmit';
import Cancel from '@salesforce/label/c.BuildaCarCancel';
import Color from '@salesforce/label/c.Color';
import Model from '@salesforce/label/c.Model';
import ModelYear from '@salesforce/label/c.ModelYear';
import Upholstery from '@salesforce/label/c.Upholstery';
import Variant from '@salesforce/label/c.Variant';
import Wheel from '@salesforce/label/c.Wheel';
import CreateNewOffer from '@salesforce/label/c.CreateNewOffer';
import CreateNewOfferSuccess from '@salesforce/label/c.CreateNewOfferSuccess';

// importing Apex Method
import getAllOfflineVehicles from '@salesforce/apex/Base_LWCCtrl_BuildACarByPolicy.getAllOfflineVehicles';

import * as u from 'c/base_LWC_Utility';

export default class in_LWC_CreateNewOffer extends LightningElement {
    @api
    recordId;

    //loading setting
    @track isLoading = false;
    @track showEditForm = false;
    @track showVariantInfo = true;
    @track showVehicleVINInfo = false;
    
    // vehicle data
    @track offlineVehicles;

    // Picklist and currentPicklist value
    @track data = {
        currentModelYear : '',
        modelYears : [],
        currentModel : '',
        models : [],
        currentSalesVersion : '',
        salesVersions : [],
        currentWheel : {},
        wheels : [],
        currentColor : {},
        colors : [],
        currentUpholstery : {},
        upholsteries : [],
        currentShortToken : {}
    };

    @track offerInfo;

    @wire(getRecord, { recordId: '$recordId', fields: [NEWUSED_FIELD]})
    oppty({ error, data }) {
        if (data) {
            this.oppy = data;
            if(this.oppy.fields.NewUsed__c.value === 'Used') {
                this.showVariantInfo = false;
                this.showVehicleVINInfo = true;
            }else if (error) {
                console.error(error);
            }
        }
    }
    get newUsedDefault() {
        return getFieldValue(this.oppy, NEWUSED_FIELD);
    }

    @wire(getObjectInfo, { objectApiName: OFFER_OBJECT })
    offerInfo;


    label = {
        CreateNewOffer,
        CreateNewOfferSuccess,
        Color,
        Model,
        ModelYear,
        Upholstery,
        Variant,
        Wheel,
        Submit,
        Cancel
    };
    
    _utility = u;

    connectedCallback() {
        this.showEditForm = true;
    }

    hasRendered = false;
    renderedCallback(){
        if(this.recordId && !this.hasRendered) {
            this.hasRendered = true;
            this.getVehicels();
        }
    }

    changeNewUsed(event) {
        if (event.target.value == 'Used') {
            this.showVariantInfo = false;
            this.showVehicleVINInfo = true;
        }else{
            this.showVariantInfo = true;
            this.showVehicleVINInfo = false;
        }
    }

    getVehicels() {
        this.isLoading = true;
        this.getAllOfflineVehicles();

    }

    getAllOfflineVehicles() {
        getAllOfflineVehicles({recordId: this.recordId})
        .then(responseJson => {
            this.offlineVehicles = JSON.parse(responseJson);
            this.getModelYears();
        }).catch(error => {
            this.isLoading = false;
            this._utility.showErrorMessage(this, error);
        });
    }

    handleSubmit(event) {
        this.isLoading = true;
        event.preventDefault();// stop the form from submitting
        const fields = event.detail.fields;
        const rtis = this.offerInfo.data.recordTypeInfos;

        if(fields.VCCMarket__c === 'IN') {
            fields.RecordTypeId = Object.keys(rtis).find(rti => rtis[rti].name === 'INOffer');
        }

            let prodId;
            this.offlineVehicles.forEach(offlineVehicle => {
                if(
                    this.data.currentModelYear == offlineVehicle.ModelYear__c
                    && this.data.currentModel == offlineVehicle.ModelFamily__c
                    && this.data.currentSalesVersion == offlineVehicle.ProductDisplayName__c
                    && this.data.currentWheel.value == offlineVehicle.WheelsCode__c
                    && this.data.currentColor.value == offlineVehicle.ColorCode__c
                    && this.data.currentUpholstery.value == offlineVehicle.UpholsteryCode__c
                ) {
                    prodId = offlineVehicle.Id;
                }
            });

            fields.Product__c = prodId;
            this.template.querySelector('lightning-record-edit-form').submit(fields);
        }

    handleSuccess(event){
        const updatedRecord = event.detail.fields.Name.value;
        const successText = this._utility.format(this.label.CreateNewOfferSuccess, [updatedRecord]);

        this.isLoading = false;
        this._utility.showSuccessMessage(this, successText);
        this.refreshViews();
        this.closeQuickAction();
    }

    handleError(event){
        this._utility.logObject('error', event.detail);
        this._utility.logObject('error output', event.detail.output.fieldErrors);
    }

    changeHandler(event) {
        this.isLoading = true;
        const name = event.target.name;
        if (name == 'modelYears') {
            this.data.currentModelYear = event.target.value;
            this.getModels();
        } else if (name == 'models') {
            this.data.currentModel = event.target.value;
            this.getSalesVersions();
        } else if (name == 'salesVersions') {
                this.data.currentSalesVersion = event.target.value;
                this.getVehicleOptions();
        } else if (name == 'wheels') {
                this.data.currentWheel.value = event.target.value;
            this.data.wheels.forEach(wheel => {
                wheel.selected = false;

                if(wheel.value == this.data.currentWheel.value) {
                    wheel.selected = true;
                }
            });
                
                this.getColors(false);
                this.getUpholsteries(false);
                this.isLoading = false;
        } else if (name == 'colors') {

                this.data.currentColor.value = event.target.value;
                
                this.data.colors.forEach(color => {
                color.selected = false;
                    color.disabled = false;

                if(color.value == this.data.currentColor.value) {
                    color.selected = true;
                }
                });

                this.getUpholsteries(true);
                this.isLoading = false;
        } else if (name == 'upholsteries') {
                this.data.currentUpholstery.value = event.target.value;
                this.data.upholsteries.forEach(upholstery => {
                upholstery.selected = false;
                    upholstery.disabled = false;

                if(upholstery.value == this.data.currentUpholstery.value) {
                    upholstery.selected = true;
                }
                });

                this.getColors(true);
                this.isLoading = false;
        }
    }

    getModelYears() {
        let modelYears = [];

        modelYears = this.checkOfflineModelYears(modelYears);
        const currentYear = new Date().getFullYear();

        modelYears.sort().forEach(modelYear => {
            if (modelYear === currentYear && !this.data.currentModelYear) {
                this.data.currentModelYear = modelYear;
            }else {
                this.data.currentModelYear = modelYear;
            }
        });

        this.data.modelYears = [];
        modelYears.sort().forEach(modelYear => {
            this.data.modelYears.push({label: modelYear, value: modelYear, selected: this.data.currentModelYear == modelYear ? true : false});
        });

        this.getModels();
    }

    checkOfflineModelYears(modelYears) {
        if(this.offlineVehicles) {
            this.offlineVehicles.forEach(offlineVehicle => {
                if(modelYears.indexOf(offlineVehicle.ModelYear__c) == -1) {
                    modelYears.push(offlineVehicle.ModelYear__c);
                }
            });
        }
        
        return modelYears;
    }

    getModels() {
        let models = [];
        this.data.models = [];
        this.data.currentModel = '';

        models = this.checkOfflineModels(models);
        models.sort().forEach(model => {
            if (!this.data.currentModel) {
                this.data.currentModel = model;
            }

            this.data.models.push({label: model, value: model, selected: this.data.currentModel == model ? true : false});
        });

        this.getSalesVersions();
    }

    checkOfflineModels(models) {
        if(this.offlineVehicles) {
            this.offlineVehicles.forEach(offlineVehicle => {
                if (this.data.currentModelYear == offlineVehicle.ModelYear__c && models.indexOf(offlineVehicle.ModelFamily__c) == -1) {
                    models.push(offlineVehicle.ModelFamily__c);
                }
            });
        }

        return models;
    }

    getSalesVersions() {
        let salesVersions = [];
        this.data.currentSalesVersion = '';
        this.data.salesVersions = [];

        salesVersions = this.checkOfflineSalesVersion(salesVersions);
        this.data.salesVersions = salesVersions;
        this.getVehicleOptions(); 
    }

    checkOfflineSalesVersion(salesVersions) {
        if(this.offlineVehicles) {
            let offlineSalesVersions = [];
            this.offlineVehicles.forEach(offlineVehicle => {
                if (
                    offlineSalesVersions.indexOf(offlineVehicle.ProductDisplayName__c) == -1
                    && this.data.currentModelYear == offlineVehicle.ModelYear__c
                    && this.data.currentModel == offlineVehicle.ModelFamily__c
                ) {
                    if (!this.data.currentSalesVersion) {
                        this.data.currentSalesVersion = offlineVehicle.ProductDisplayName__c;
                    }


                    salesVersions.push({
                        label: offlineVehicle.ProductDisplayName__c, 
                        value: offlineVehicle.ProductDisplayName__c, 
                        selected: offlineVehicle.ProductDisplayName__c == this.data.currentSalesVersion ? true : false,
                        disabled: false
                    });

                    offlineSalesVersions.push(offlineVehicle.ProductDisplayName__c);
                }
            });
        }

        return salesVersions;
    }

    getVehicleOptions () {
        let defaultCar = false;
        if(this.offlineVehicles) {
            this.offlineVehicles.forEach(offlineVehicle => {
                if(
                    this.data.currentModelYear == offlineVehicle.ModelYear__c
                    && this.data.currentModel == offlineVehicle.ModelFamily__c
                    && this.data.currentSalesVersion == offlineVehicle.ProductDisplayName__c
                    && offlineVehicle.Default__c
                ) {
                    defaultCar = true;

                    this.data.currentWheel.name = offlineVehicle.Wheels__c;
                    this.data.currentWheel.value = offlineVehicle.WheelsCode__c;
                    this.data.currentColor.name = offlineVehicle.ColorDisplayName__c;
                    this.data.currentColor.value = offlineVehicle.ColorCode__c;
                    this.data.currentUpholstery.name = offlineVehicle.UpholsteryDisplayName__c;
                    this.data.currentUpholstery.value = offlineVehicle.UpholsteryCode__c;
                }
            });
        }

        this.getWheels(defaultCar);
        this.getColors(false, defaultCar);
        this.getUpholsteries(false, defaultCar);
        this.isLoading = false;
    }

    getWheels (loadDefaultCar) {
        this.data.wheels = [];
        let wheels = [];

        if(loadDefaultCar != true) {
            this.data.currentWheel = {};
        }
        
        this.offlineVehicles.forEach(offlineVehicle => {
            if (
                wheels.indexOf(offlineVehicle.WheelsCode__c) == -1
                && this.data.currentModelYear == offlineVehicle.ModelYear__c
                && this.data.currentModel == offlineVehicle.ModelFamily__c
                && this.data.currentSalesVersion == offlineVehicle.ProductDisplayName__c
            ) {
                if(this.data.currentWheel == null || Object.keys(this.data.currentWheel).length == 0) {
                    this.data.currentWheel.name = offlineVehicle.Wheels__c;
                    this.data.currentWheel.value = offlineVehicle.WheelsCode__c;
                }

                this.data.wheels.push({
                    label: offlineVehicle.Wheels__c, 
                    name: offlineVehicle.WheelsCode__c,
                    value: offlineVehicle.WheelsCode__c, 
                    selected: offlineVehicle.WheelsCode__c == this.data.currentWheel.value ? true : false,
                    disabled: false
                });

                wheels.push(offlineVehicle.WheelsCode__c);
            }
        });
    }

    getColors (isChangeUpholstery, loadDefaultCar) {
        if(isChangeUpholstery == false) {
            this.data.colors = [];

            if(loadDefaultCar != true) {
            this.data.currentColor = {};
        }
    }

        if(this.data.colors == null || this.data.colors.length == 0) {
            let colors = [];

            this.offlineVehicles.forEach(offlineVehicle => {
                if (
                    colors.indexOf(offlineVehicle.ColorCode__c) == -1
                    && this.data.currentModelYear == offlineVehicle.ModelYear__c
                    && this.data.currentModel == offlineVehicle.ModelFamily__c
                    && this.data.currentSalesVersion == offlineVehicle.ProductDisplayName__c
                    && this.data.currentWheel.value == offlineVehicle.WheelsCode__c
                ) {
                    if(this.data.currentColor == null || Object.keys(this.data.currentColor).length == 0) {
                        this.data.currentColor.name = offlineVehicle.ColorDisplayName__c;
                        this.data.currentColor.value = offlineVehicle.ColorCode__c;
                    }

                    this.data.colors.push({
                        label: offlineVehicle.ColorDisplayName__c, 
                        name: offlineVehicle.ColorCode__c,
                        value: offlineVehicle.ColorCode__c, 
                        selected: offlineVehicle.ColorCode__c == this.data.currentColor.value ? true : false,
                        disabled: isChangeUpholstery
                    });

                    colors.push(offlineVehicle.ColorCode__c);
                }
            });
        } else {
            this.data.colors.forEach(color => {
                color.disabled = true;
            });
        }

        if(isChangeUpholstery == true) {
            this.offlineVehicles.forEach(offlineVehicle => {
                this.data.colors.forEach(color => {
                    if (
                        this.data.currentModelYear == offlineVehicle.ModelYear__c
                        && this.data.currentModel == offlineVehicle.ModelFamily__c
                        && this.data.currentSalesVersion == offlineVehicle.ProductDisplayName__c
                        && this.data.currentWheel.value == offlineVehicle.WheelsCode__c
                        && this.data.currentUpholstery.value == offlineVehicle.UpholsteryCode__c
                        && color.value == offlineVehicle.ColorCode__c
                    ) {
                        color.disabled = false;
                    }
                });
            });
            
            this.data.colors.forEach(color => {
                if(color.selected && color.disabled) {
                    color.selected = false;
                    this.data.currentColor = {};
                }
            });

            if(this.data.currentColor == null || Object.keys(this.data.currentColor).length == 0) {
                this.data.colors.forEach(color => {
                    if((this.data.currentColor == null || Object.keys(this.data.currentColor).length == 0) && !color.disabled) {
                        color.selected = true;
                        this.data.currentColor.name = color.label;
                        this.data.currentColor.value = color.value;
                    }
                });
            }
        }
    }

    getUpholsteries (isChangeColor, loadDefaultCar) {
        if(isChangeColor == false) {
            this.data.upholsteries = [];

            if(loadDefaultCar != true) {
            this.data.currentUpholstery = {};
            }
        }

        if(this.data.upholsteries == null || this.data.upholsteries.length == 0) {
            let upholsteries = [];

            this.offlineVehicles.forEach(offlineVehicle => {
                if (
                    upholsteries.indexOf(offlineVehicle.UpholsteryCode__c) == -1
                    && this.data.currentModelYear == offlineVehicle.ModelYear__c
                    && this.data.currentModel == offlineVehicle.ModelFamily__c
                    && this.data.currentSalesVersion == offlineVehicle.ProductDisplayName__c
                    && this.data.currentWheel.value == offlineVehicle.WheelsCode__c
                ) {
                    if(this.data.currentUpholstery == null || Object.keys(this.data.currentUpholstery).length == 0) {
                        this.data.currentUpholstery.name = offlineVehicle.UpholsteryDisplayName__c;
                        this.data.currentUpholstery.value = offlineVehicle.UpholsteryCode__c;
                    }

                    this.data.upholsteries.push({
                        label: offlineVehicle.UpholsteryDisplayName__c, 
                        name: offlineVehicle.UpholsteryCode__c,
                        value: offlineVehicle.UpholsteryCode__c, 
                        selected: offlineVehicle.UpholsteryCode__c == this.data.currentUpholstery.value ? true : false,
                        disabled: true
                    });

                    upholsteries.push(offlineVehicle.UpholsteryCode__c);
                }
            });
        } else {
            this.data.upholsteries.forEach(upholstery => {
                upholstery.disabled = true;
            });
        }

        this.offlineVehicles.forEach(offlineVehicle => {
            this.data.upholsteries.forEach(upholstery => {
                if (
                    this.data.currentModelYear == offlineVehicle.ModelYear__c
                    && this.data.currentModel == offlineVehicle.ModelFamily__c
                    && this.data.currentSalesVersion == offlineVehicle.ProductDisplayName__c
                    && this.data.currentWheel.value == offlineVehicle.WheelsCode__c
                    && this.data.currentColor.value == offlineVehicle.ColorCode__c
                    && upholstery.value == offlineVehicle.UpholsteryCode__c
                ) {
                    upholstery.disabled = false;
                }
            });
        });

        if(isChangeColor) {
            this.data.upholsteries.forEach(upholstery => {
                if(upholstery.selected && upholstery.disabled) {
                    upholstery.selected = false;
                    this.data.currentUpholstery = {};
                }
            });

            if(this.data.currentUpholstery == null || Object.keys(this.data.currentUpholstery).length == 0) {
                this.data.upholsteries.forEach(upholstery => {
                    if((this.data.currentUpholstery == null || Object.keys(this.data.currentUpholstery).length == 0) && !upholstery.disabled) {
                        upholstery.selected = true;
                        this.data.currentUpholstery.name = upholstery.label;
                    this.data.currentUpholstery.value = upholstery.value;
                    }
                });
            }
        }
    }

    refreshViews() {
        this.dispatchEvent(new CustomEvent('refreshView'));
    }

    closeQuickAction() {
        this.dispatchEvent(new CustomEvent('closeQuickAction'));
    }
}