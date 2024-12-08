import { Schema, Document, model } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { v4 } from 'uuid';

const BlogSchema: Schema = new Schema({
    UserID: {
        type: String,
        required: true
    },
    BannerImage: {
        type: String,
    },
    BlogID: {
        type: String,
        default: v4,
        unique: true
    },
    Content: {
        type: String
    },
    CreateDate: {
        type: Date
    },
    Description: {
        type: String
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    PublishDate: {
        type: Date
    },
    Tags: [
        {
            type: String
        }
    ],
    Title: {
        type: String,
        unique: true
    },
    UpdateDate: {
        type: Date
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
    Tags?: string[];
    Title?: string;
    UpdateDate?: Date;
    Visiblity?: string;
}

BlogSchema.index({ BlogID: 1 });
BlogSchema.plugin(mongoosePaginate);

export default model<IBlog>('Blog', BlogSchema);
