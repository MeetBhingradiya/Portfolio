import { Schema, Document, model } from 'mongoose';
import { v4 } from 'uuid';

const VerificationCodes_Schema: Schema = new Schema({
    CodeID: {
        type: String,
        default: v4,
        unique: true
    },
    HashKey: {
        type: String,
        required: true
    },
    Salt: {
        type: String,
        required: true
    },
    UserID: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: true,
    expires: 600,
    _id: false
});

export interface IVerificationCodes extends Document {
    CodeID: string;
    HashKey: string;
    Salt: string;
    UserID: string;
}

export default model<IVerificationCodes>('VerificationCodes', VerificationCodes_Schema);