import mongoose from 'mongoose';
import { v4 } from 'uuid';

const BlogsContents_Schema: mongoose.Schema = new mongoose.Schema({
    ContentID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    },
    Data: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface IBlogsContents extends mongoose.Document {
    ContentID: string;
    Data: string;
}

export const BlogsContents_Model: mongoose.Model<IBlogsContents> = mongoose.models?.BlogsContents || mongoose.model<IBlogsContents>("BlogsContents", BlogsContents_Schema);