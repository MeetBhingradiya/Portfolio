import mongoose from 'mongoose';
import { v4 } from 'uuid';

const Pomodoros_Schema: mongoose.Schema = new mongoose.Schema({
    PomodoroID: {
        type: String,
        default: v4,
        unique: true
    },
    UserID: {
        type: String,
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

    Start: {
        type: Date,
        required: true
    },
    End: {
        type: Date,
        required: true
    },

    isPaused: {
        type: Boolean,
        default: false
    },
    isEnded: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    versionKey: "v2"
});

interface IPomodoro extends mongoose.Document {
    PomodoroID: string
    UserID: string
    
    Name: string
    Description: string
    
    Start: Date
    End: Date

    isPaused: boolean
    isEnded: boolean
    isArchived: boolean
    isDeleted: boolean
}

export const Pomodoros_Model: mongoose.Model<IPomodoro> = mongoose.models?.Pomodoros || mongoose.model<IPomodoro>("Pomodoros", Pomodoros_Schema);