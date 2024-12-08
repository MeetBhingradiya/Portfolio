import { Schema, Document, model } from 'mongoose';
import { v4 } from 'uuid';

const Permissions_Schema: Schema = new Schema({
    PermissionsID: {
        type: String,
        default: v4,
        unique: true
    },
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    ACCESS_CONSTANT: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: true
});

export interface IPermissions extends Document {
    PermissionsID: string
    Name: string
    Description: string
    ACCESS_CONSTANT: string
}

export default model<IPermissions>('Permissions', Permissions_Schema);