import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const BlogSchema: Schema = new Schema({
    Author: {
        type: String,
        default: null
    },
    BannerImage: {
        type: String,
        default: null
    },
    BlogID: {
        type: String,
        required: true,
        unique: true
    },
    Content: {
        type: String,
        default: null
    },
    CreateDate: {
        type: Date,
        default: null
    },
    Description: {
        type: String,
        default: null
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    PublishDate: {
        type: Date,
        default: null
    },
    Tags: [
        {
            type: String
        }
    ],
    Title: {
        type: String,
        unique: true,
        default: null
    },
    UpdateDate: {
        type: Date,
        default: null
    },
    Visiblity: {
        type: String,
        default: 'public',
        enum: [
            'public', 
            'private', 
            'unlisted'
        ],
    },
});

export interface IBlog extends Document {
    Author?: string;
    BannerImage?: string;
    BlogID: string;
    Content?: string;
    CreateDate?: Date;
    Description?: string;
    isPublished?: boolean;
    PublishDate?: Date;
    Tags?: string[]; // Can also use JSON-type field in Mongoose
    Title?: string;
    UpdateDate?: Date;
    Visiblity?: string;
}

BlogSchema.index({ BlogID: 1 });
BlogSchema.plugin(mongoosePaginate);

export default mongoose.model<IBlog>('Blog', BlogSchema);
