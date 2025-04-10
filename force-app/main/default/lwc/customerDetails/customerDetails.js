import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';

const FIELDS = [
    'Opportunity.AccountId',
    'Opportunity.Account.Name',
    'Opportunity.Account.Phone',
    'Opportunity.Account.Email',
    'Opportunity.Account.BillingStreet',
    'Opportunity.Account.BillingCity',
    'Opportunity.Account.BillingState',
    'Opportunity.Account.BillingPostalCode',
    'Opportunity.Account.BillingCountry'
];

export default class CustomerDetails extends LightningElement {
    @api recordId; // Opportunity Id passed automatically when placed on record page
    customer;
    error;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredOpportunity({ error, data }) {
        if (data) {
            const acc = data.fields.Account;
            if (acc && acc.value) {
                this.customer = {
                    Name: acc.value.fields.Name.value,
                    Phone: acc.value.fields.Phone?.value,
                    Email: acc.value.fields.Email?.value,
                    BillingStreet: acc.value.fields.BillingStreet?.value,
                    BillingCity: acc.value.fields.BillingCity?.value,
                    BillingState: acc.value.fields.BillingState?.value,
                    BillingPostalCode: acc.value.fields.BillingPostalCode?.value,
                    BillingCountry: acc.value.fields.BillingCountry?.value
                };
                this.error = undefined;
            }
        } else if (error) {
            this.customer = undefined;
            this.error = error;
        }
    }
}