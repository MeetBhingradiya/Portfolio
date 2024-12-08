import { Schema, Document, model } from 'mongoose';
import { v4 } from 'uuid';
import { Organization_Roles } from '@Types/Organization';

const Organizations_Schema: Schema = new Schema({
    OrganizationID: {
        type: String,
        default: v4,
        unique: true
    },
    Members: {
        type: [{
            UserID: {
                type: String,
                required: true
            },
            Role: {
                type: String,
                required: true,
                enum: Object.values(Organization_Roles)
            }
        }],
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    icon: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: true,
    _id: false
});

export interface IOrganization extends Document {
    OrganizationID: string
    Members: Array<{
        UserID: string
        Role: Organization_Roles
    }>

    // ? ORG Details
    Name: string
    Description: string
    icon: string
}

export default model<IOrganization>('Organizations', Organizations_Schema);