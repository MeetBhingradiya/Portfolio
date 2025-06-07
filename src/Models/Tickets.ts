import mongoose from 'mongoose';
import { v4 } from 'uuid';

const TicketResponse_Schema = new mongoose.Schema({
    id: {
        type: String,
        default: () => v4(),
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const Ticket_Schema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        required: true
    },
    // User Association - can be null for anonymous tickets
    userID: {
        type: String,
        default: null,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true
    },
    projectType: {
        type: String,
        required: true,
        enum: ['general', 'web-development', 'mobile-app', 'collaboration', 'consulting', 'other']
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    clientIP: {
        type: String
    },
    // Allow anonymous users to view their tickets
    isAnonymous: {
        type: Boolean,
        default: true
    },
    responses: [TicketResponse_Schema]
}, {
    timestamps: true,
    versionKey: "v1"
});

// Indexes for better performance
// Note: id field already has unique index from schema definition
Ticket_Schema.index({ email: 1 });
Ticket_Schema.index({ status: 1 });
Ticket_Schema.index({ priority: 1 });
Ticket_Schema.index({ createdAt: -1 });

export interface ITicket extends mongoose.Document {
    id: string;
    userID?: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    projectType: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high';
    clientIP?: string;
    isAnonymous: boolean;
    responses: Array<{
        id: string;
        message: string;
        isAdmin: boolean;
        createdAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

export interface ITicketResponse {
    id: string;
    message: string;
    isAdmin: boolean;
    createdAt: Date;
}

const Tickets_Model = mongoose.models?.Tickets || mongoose.model<ITicket>('Tickets', Ticket_Schema);

export { Tickets_Model };
export default Tickets_Model;
