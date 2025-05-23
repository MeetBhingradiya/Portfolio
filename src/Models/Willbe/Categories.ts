import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Categorie_Schema: mongoose.Schema = new mongoose.Schema({
    CategorieID: {
        type: String,
        default: v4,
        unique: true,
        required: true
    },
    Title: {
        type: String,
        required: true
    },
    Description: {
        type: String
    },
    AuthorID: {
        type: String
    }
}, {
    timestamps: true,
    versionKey: "v1"
});

export interface ICategorie extends mongoose.Document {
    CategorieID: string;
    Title: string;
    Description: string;
    AuthorID: string;
}

export const Categories_Model: mongoose.Model<ICategorie> = mongoose.models?.Categories || mongoose.model<ICategorie>("Categories", Categorie_Schema);