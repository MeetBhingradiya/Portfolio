import mongoose from "mongoose";
import { v4 } from "uuid";

const PomodoroSchema: mongoose.Schema = new mongoose.Schema(
    {
        pomodoroId: {
            type: String,
            default: v4,
            unique: true,
            index: true
        },
        userId: {
            type: String,
            required: [true, "User ID is required"],
            index: true
        },
        name: {
            type: String,
            required: [true, "Pomodoro name is required"],
            trim: true,
            minlength: [1, "Name must be at least 1 character long"],
            maxlength: [100, "Name cannot exceed 100 characters"]
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"]
        },
        startTime: {
            type: Date,
            required: [true, "Start time is required"],
            validate: {
                validator: function(this: IPomodoro, value: Date) {
                    return value <= new Date();
                },
                message: "Start time cannot be in the future"
            }
        },
        endTime: {
            type: Date,
            required: [true, "End time is required"],
            validate: {
                validator: function(this: IPomodoro, value: Date) {
                    return value > this.startTime;
                },
                message: "End time must be after start time"
            }
        },
        duration: {
            type: Number, // Duration in minutes
            required: true,
            min: [1, "Duration must be at least 1 minute"],
            max: [120, "Duration cannot exceed 120 minutes"]
        },
        status: {
            type: String,
            enum: {
                values: ["active", "paused", "completed", "cancelled"],
                message: "Status must be one of: active, paused, completed, cancelled"
            },
            default: "active"
        },
        isPaused: {
            type: Boolean,
            default: false
        },
        isCompleted: {
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
        },
        pausedAt: {
            type: Date,
            default: null
        },
        resumedAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        },
        tags: [{
            type: String,
            trim: true,
            maxlength: [30, "Tag cannot exceed 30 characters"]
        }],
        category: {
            type: String,
            trim: true,
            maxlength: [50, "Category cannot exceed 50 characters"],
            default: "General"
        },
        priority: {
            type: String,
            enum: {
                values: ["low", "medium", "high", "urgent"],
                message: "Priority must be one of: low, medium, high, urgent"
            },
            default: "medium"
        }
    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt fields
        versionKey: false // Disable __v field
    }
);

// Indexes for better query performance
PomodoroSchema.index({ userId: 1, createdAt: -1 });
PomodoroSchema.index({ status: 1 });
PomodoroSchema.index({ isDeleted: 1, isArchived: 1 });

// Virtual for calculating actual duration
PomodoroSchema.virtual("actualDuration").get(function(this: IPomodoro) {
    if (this.startTime && this.endTime) {
        return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60)); // in minutes
    }
    return 0;
});

// Virtual for checking if pomodoro is overdue
PomodoroSchema.virtual("isOverdue").get(function(this: IPomodoro) {
    if (this.status === "active" && this.endTime) {
        return new Date() > this.endTime;
    }
    return false;
});

// Pre-save middleware to auto-calculate duration
PomodoroSchema.pre("save", function(this: IPomodoro, next) {
    if (this.startTime && this.endTime && !this.duration) {
        this.duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
    }
    
    // Auto-set completed status and timestamp
    if (this.isCompleted && !this.completedAt) {
        this.completedAt = new Date();
        this.status = "completed";
    }
    
    // Auto-set paused timestamp
    if (this.isPaused && !this.pausedAt) {
        this.pausedAt = new Date();
        this.status = "paused";
    }
    
    next();
});

// Instance methods
PomodoroSchema.methods.pause = function(this: IPomodoro) {
    this.isPaused = true;
    this.pausedAt = new Date();
    this.status = "paused";
    return this.save();
};

PomodoroSchema.methods.resume = function(this: IPomodoro) {
    this.isPaused = false;
    this.resumedAt = new Date();
    this.status = "active";
    return this.save();
};

PomodoroSchema.methods.complete = function(this: IPomodoro) {
    this.isCompleted = true;
    this.completedAt = new Date();
    this.status = "completed";
    return this.save();
};

PomodoroSchema.methods.cancel = function(this: IPomodoro) {
    this.status = "cancelled";
    return this.save();
};

PomodoroSchema.methods.archive = function(this: IPomodoro) {
    this.isArchived = true;
    return this.save();
};

PomodoroSchema.methods.softDelete = function(this: IPomodoro) {
    this.isDeleted = true;
    return this.save();
};

// Static methods
PomodoroSchema.statics.findActiveByUser = function(userId: string) {
    return this.find({
        userId,
        status: "active",
        isDeleted: false
    });
};

PomodoroSchema.statics.findCompletedByUser = function(userId: string, limit = 10) {
    return this.find({
        userId,
        status: "completed",
        isDeleted: false
    })
    .sort({ completedAt: -1 })
    .limit(limit);
};

PomodoroSchema.statics.getUserStats = function(userId: string) {
    return this.aggregate([
        {
            $match: {
                userId,
                isDeleted: false
            }
        },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 },
                totalDuration: { $sum: "$duration" }
            }
        }
    ]);
};

export interface IPomodoro extends mongoose.Document {
    pomodoroId: string;
    userId: string;
    name: string;
    description: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    status: "active" | "paused" | "completed" | "cancelled";
    isPaused: boolean;
    isCompleted: boolean;
    isArchived: boolean;
    isDeleted: boolean;
    pausedAt?: Date;
    resumedAt?: Date;
    completedAt?: Date;
    tags: string[];
    category: string;
    priority: "low" | "medium" | "high" | "urgent";
    
    // Virtuals
    actualDuration: number;
    isOverdue: boolean;
    
    // Methods
    pause(): Promise<IPomodoro>;
    resume(): Promise<IPomodoro>;
    complete(): Promise<IPomodoro>;
    cancel(): Promise<IPomodoro>;
    archive(): Promise<IPomodoro>;
    softDelete(): Promise<IPomodoro>;
}

export interface IPomodoroModel extends mongoose.Model<IPomodoro> {
    findActiveByUser(userId: string): mongoose.Query<IPomodoro[], IPomodoro>;
    findCompletedByUser(userId: string, limit?: number): mongoose.Query<IPomodoro[], IPomodoro>;
    getUserStats(userId: string): mongoose.Aggregate<any[]>;
}

export const PomodoroModel: IPomodoroModel =
    (mongoose.models?.Pomodoro as IPomodoroModel) ||
    mongoose.model<IPomodoro, IPomodoroModel>("Pomodoro", PomodoroSchema);
