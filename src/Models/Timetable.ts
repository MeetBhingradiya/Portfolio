import mongoose, { Schema, model, models, Document } from 'mongoose';
import {
    SubjectSlotType,
    DayOfWeek,
    Batch,
    ProgramType,
    RoomLocation,
    TimeSlot,
    Subject,
    TimetableMetadata,
    Timetable as ITimetable,
    SubjectOption,
    ClassroomOption,
    FacultyOption,
    DaySubjects
} from '@/Types/Timetable';

// Room Location Schema
const RoomLocationSchema = new Schema<RoomLocation>({
    buildingCode: {
        type: String,
        required: false, // Allow empty for special slot types
        uppercase: true,
        trim: true,
        maxlength: 3
    },
    floorNumber: {
        type: Number,
        required: false, // Allow empty for special slot types
        min: 0,
        max: 9,
        default: 0
    },
    roomNumber: {
        type: String,
        required: false, // Allow empty for special slot types
        trim: true,
        maxlength: 4
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
        trim: true // Removed uppercase since special slot types might not be uppercase
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
        trim: true,
        default: '' // Default to empty string for special slot types
    },
    room: {
        type: RoomLocationSchema,
        required: true,
        default: () => ({ buildingCode: '', floorNumber: 0, roomNumber: '' }) // Default empty room for special slot types
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

// Subject Option Schema for dropdown selections
const SubjectOptionSchema = new Schema<SubjectOption>({
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
    }
}, { _id: false });

// Classroom Option Schema for dropdown selections
const ClassroomOptionSchema = new Schema<ClassroomOption>({
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
        maxlength: 4
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false });

// Faculty Option Schema for dropdown selections
const FacultyOptionSchema = new Schema<FacultyOption>({
    shortName: {
        type: String,
        required: true,
        trim: true
    },
    longName: {
        type: String,
        required: true,
        trim: true
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

// Day Subjects Schema for organized grouping
const DaySubjectsSchema = new Schema<DaySubjects>({
    day: {
        type: String,
        enum: Object.values(DayOfWeek),
        required: true
    },
    subjects: [{
        type: SubjectSchema,
        required: true
    }]
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
    dayGroupedSubjects: [{
        type: DaySubjectsSchema,
        default: []
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
    isLocked: {
        type: Boolean,
        default: false
    },
    lockReason: {
        type: String,
        trim: true
    },
    lockedBy: {
        type: String,
        trim: true
    },
    lockedAt: {
        type: Date
    },
    unlockCode: {
        type: String,
        trim: true
    },
    allowedEditors: [{
        type: String,
        trim: true
    }],
    userId: {
        type: String,
        required: true,
        trim: true
    },
    availableSubjects: [{
        type: SubjectOptionSchema,
        default: []
    }],
    availableClassrooms: [{
        type: ClassroomOptionSchema,
        default: []
    }],
    availableFaculty: [{
        type: FacultyOptionSchema,
        default: []
    }]
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
TimetableSchema.index({ userId: 1, isLocked: 1 });
TimetableSchema.index({ isLocked: 1, lockedBy: 1 });
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

// Lock management methods
TimetableSchema.methods.canEdit = function (userId?: string) {
    // If not locked, anyone can edit (or apply your own logic)
    if (!this.isLocked) return true;
    
    // If user is not provided, cannot edit
    if (!userId) return false;
    
    // Owner can always edit
    if (this.userId === userId) return true;
    
    // Check if user is in allowed editors list
    if (this.allowedEditors && this.allowedEditors.includes(userId)) return true;
    
    return false;
};

TimetableSchema.methods.canDelete = function (userId?: string) {
    // If locked, cannot delete unless user has permission
    if (this.isLocked) {
        if (!userId) return false;
        // Only owner can delete locked timetables
        return this.userId === userId;
    }
    
    return true;
};

TimetableSchema.methods.lock = function (userId: string, reason?: string, unlockCode?: string, allowedEditors?: string[]) {
    this.isLocked = true;
    this.lockReason = reason;
    this.lockedBy = userId;
    this.lockedAt = new Date();
    this.unlockCode = unlockCode;
    this.allowedEditors = allowedEditors || [];
    return this.save();
};

TimetableSchema.methods.unlock = function (userId?: string, unlockCode?: string) {
    // Check if user has permission to unlock
    if (!this.canUnlock(userId, unlockCode)) {
        throw new Error('Unauthorized to unlock this timetable');
    }
    
    this.isLocked = false;
    this.lockReason = undefined;
    this.lockedBy = undefined;
    this.lockedAt = undefined;
    this.unlockCode = undefined;
    this.allowedEditors = [];
    return this.save();
};

TimetableSchema.methods.canUnlock = function (userId?: string, unlockCode?: string) {
    if (!this.isLocked) return true;
    
    // If no user provided, cannot unlock
    if (!userId) return false;
    
    // Owner can always unlock
    if (this.userId === userId) return true;
    
    // Check unlock code if provided
    if (this.unlockCode && unlockCode && this.unlockCode === unlockCode) return true;
    
    return false;
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

    // Sort subjects by time slot within each day
    this.subjects.sort((a, b) => {
        // First sort by day
        const dayOrder = Object.values(DayOfWeek);
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        
        // Then sort by time slot
        const timeA = new Date(`1970-01-01 ${a.timeSlot.startTime}`);
        const timeB = new Date(`1970-01-01 ${b.timeSlot.startTime}`);
        return timeA.getTime() - timeB.getTime();
    });

    // Auto-generate day grouped subjects
    const grouped: { [key in DayOfWeek]?: Subject[] } = {};
    this.subjects.forEach(subject => {
        if (!grouped[subject.day]) {
            grouped[subject.day] = [];
        }
        grouped[subject.day]!.push(subject);
    });

    this.dayGroupedSubjects = Object.entries(grouped).map(([day, subjects]) => ({
        day: day as DayOfWeek,
        subjects: subjects || []
    }));

    // Auto-generate dropdown options if not provided
    if (!this.availableSubjects || this.availableSubjects.length === 0) {
        const uniqueSubjects = new Map<string, any>();
        this.subjects.forEach(subject => {
            if (!uniqueSubjects.has(subject.code)) {
                uniqueSubjects.set(subject.code, {
                    code: subject.code,
                    name: subject.name
                });
            }
        });
        this.availableSubjects = Array.from(uniqueSubjects.values());
    }

    if (!this.availableClassrooms || this.availableClassrooms.length === 0) {
        const uniqueRooms = new Map<string, any>();
        this.subjects.forEach(subject => {
            const roomKey = `${subject.room.buildingCode}-${subject.room.floorNumber}-${subject.room.roomNumber}`;
            if (!uniqueRooms.has(roomKey)) {
                uniqueRooms.set(roomKey, {
                    buildingCode: subject.room.buildingCode,
                    floorNumber: subject.room.floorNumber,
                    roomNumber: subject.room.roomNumber,
                    displayName: roomKey
                });
            }
        });
        this.availableClassrooms = Array.from(uniqueRooms.values());
    }

    if (!this.availableFaculty || this.availableFaculty.length === 0) {
        const uniqueFaculty = new Map<string, any>();
        this.subjects.forEach(subject => {
            if (subject.faculty && !uniqueFaculty.has(subject.faculty)) {
                uniqueFaculty.set(subject.faculty, {
                    shortName: subject.faculty,
                    longName: subject.faculty
                });
            }
        });
        this.availableFaculty = Array.from(uniqueFaculty.values());
    }

    // Remove duplicates from visible days
    this.visibleDays = [...new Set(this.visibleDays)];

    next();
});

// Create the model
export const TimetableModel = 
    (mongoose.models?.Timetable as mongoose.Model<ITimetable>) ||
    mongoose.model<ITimetable>('Timetable', TimetableSchema);

export default TimetableModel;
