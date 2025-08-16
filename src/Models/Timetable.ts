import { Schema, model, models, Document } from 'mongoose';
import {
    SubjectSlotType,
    DayOfWeek,
    Batch,
    ProgramType,
    RoomLocation,
    TimeSlot,
    Subject,
    TimetableMetadata,
    Timetable as ITimetable
} from '@/Types/Timetable';

// Room Location Schema
const RoomLocationSchema = new Schema<RoomLocation>({
    buildingCode: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        maxlength: 3
    },
    floorNumber: {
        type: Number,
        required: true,
        min: 0,
        max: 9
    },
    roomNumber: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3
    }
}, { _id: false });

// Time Slot Schema
const TimeSlotSchema = new Schema<TimeSlot>({
    startTime: {
        type: String,
        required: true,
        trim: true
    },
    endTime: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

// Subject Schema
const SubjectSchema = new Schema<Subject>({
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: Object.values(SubjectSlotType),
        required: true
    },
    faculty: {
        type: String,
        trim: true
    },
    room: {
        type: RoomLocationSchema,
        required: true
    },
    timeSlot: {
        type: TimeSlotSchema,
        required: true
    },
    day: {
        type: String,
        enum: Object.values(DayOfWeek),
        required: true
    }
}, { _id: false });

// Timetable Metadata Schema
const TimetableMetadataSchema = new Schema<TimetableMetadata>({
    programName: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: String,
        required: true,
        trim: true
    },
    batch: {
        type: String,
        enum: Object.values(Batch),
        required: true
    },
    programType: {
        type: String,
        enum: Object.values(ProgramType),
        required: true
    },
    publishDate: {
        type: Date,
        required: true
    },
    validFrom: {
        type: Date,
        required: true
    },
    validTo: {
        type: Date
    },
    academicYear: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

// Main Timetable Schema
const TimetableSchema = new Schema<ITimetable>({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    metadata: {
        type: TimetableMetadataSchema,
        required: true
    },
    subjects: [{
        type: SubjectSchema,
        required: true
    }],
    visibleDays: [{
        type: String,
        enum: Object.values(DayOfWeek),
        required: true
    }],
    timeSlots: [{
        type: TimeSlotSchema,
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    userId: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc: any, ret: any) {
            ret.id = ret._id.toString();
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    toObject: { virtuals: true }
});

// Indexes for better performance
TimetableSchema.index({ userId: 1, isActive: 1 });
TimetableSchema.index({ 'metadata.academicYear': 1, 'metadata.semester': 1 });
TimetableSchema.index({ 'metadata.programName': 1, 'metadata.batch': 1 });
TimetableSchema.index({ createdAt: -1 });
TimetableSchema.index({ 'metadata.validFrom': 1, 'metadata.validTo': 1 });

// Virtual for formatted room location
RoomLocationSchema.virtual('fullLocation').get(function () {
    return `${this.buildingCode}${this.floorNumber}${this.roomNumber}`;
});

// Virtual for current validity
TimetableSchema.virtual('isCurrentlyValid').get(function () {
    const now = new Date();
    const validFrom = this.metadata.validFrom;
    const validTo = this.metadata.validTo;

    if (validTo) {
        return now >= validFrom && now <= validTo;
    }
    return now >= validFrom;
});

// Instance methods
TimetableSchema.methods.getSubjectsByDay = function (day: DayOfWeek) {
    return this.subjects.filter((subject: Subject) => subject.day === day);
};

TimetableSchema.methods.getSubjectByTimeAndDay = function (timeSlot: TimeSlot, day: DayOfWeek) {
    return this.subjects.find((subject: Subject) =>
        subject.day === day &&
        subject.timeSlot.startTime === timeSlot.startTime &&
        subject.timeSlot.endTime === timeSlot.endTime
    );
};

TimetableSchema.methods.generateGrid = function () {
    const grid = [];

    for (const timeSlot of this.timeSlots) {
        const row = [];
        for (const day of this.visibleDays) {
            const subject = this.getSubjectByTimeAndDay(timeSlot, day);
            row.push({
                timeSlot,
                day,
                subject,
                isEmpty: !subject
            });
        }
        grid.push(row);
    }

    return {
        timeSlots: this.timeSlots,
        days: this.visibleDays,
        cells: grid
    };
};

// Static methods
TimetableSchema.statics.findByUser = function (userId: string, filters = {}) {
    return this.find({ userId, ...filters }).sort({ createdAt: -1 });
};

TimetableSchema.statics.findActiveByUser = function (userId: string) {
    return this.find({ userId, isActive: true }).sort({ createdAt: -1 });
};

TimetableSchema.statics.findCurrentValid = function (userId: string) {
    const now = new Date();
    return this.findOne({
        userId,
        isActive: true,
        'metadata.validFrom': { $lte: now },
        $or: [
            { 'metadata.validTo': { $gte: now } },
            { 'metadata.validTo': null }
        ]
    });
};

// Pre-save middleware
TimetableSchema.pre('save', function (next) {
    // Sort time slots by start time
    this.timeSlots.sort((a, b) => {
        const timeA = new Date(`1970-01-01 ${a.startTime}`);
        const timeB = new Date(`1970-01-01 ${b.startTime}`);
        return timeA.getTime() - timeB.getTime();
    });

    // Remove duplicates from visible days
    this.visibleDays = [...new Set(this.visibleDays)];

    next();
});

// Create the model
export const TimetableModel = models.Timetable || model<ITimetable>('Timetable', TimetableSchema);

export default TimetableModel;
