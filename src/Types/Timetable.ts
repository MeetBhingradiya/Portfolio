// Timetable Types and Interfaces

export enum SubjectSlotType {
    LECTURE = "Lecture",
    LAB = "Lab",
    TUTORIAL = "Tutorial"
}

export enum DayOfWeek {
    MONDAY = "Monday",
    TUESDAY = "Tuesday",
    WEDNESDAY = "Wednesday",
    THURSDAY = "Thursday",
    FRIDAY = "Friday",
    SATURDAY = "Saturday",
    SUNDAY = "Sunday"
}

export enum Batch {
    A = "A",
    B = "B",
    C = "C"
}

export enum ProgramType {
    D2D = "D2D", // Diploma to Degree
    REGULAR = "Regular"
}

export interface RoomLocation {
    buildingCode: string; // e.g., "CX", "BX"
    floorNumber: number; // 1 digit
    roomNumber: string; // 2 digits e.g., "11", "12"
}

export interface TimeSlot {
    startTime: string; // e.g., "09:50 AM"
    endTime: string; // e.g., "10:45 AM"
}

export interface Subject {
    code: string; // e.g., "SEIT2220"
    name: string; // e.g., "Software Engineering"
    type: SubjectSlotType;
    faculty?: string; // Faculty name
    room: RoomLocation;
    timeSlot: TimeSlot;
    day: DayOfWeek;
}

export interface TimetableMetadata {
    programName: string; // e.g., "School of Engineering"
    semester: string; // e.g., "3 - CE_CSE_D2D3 - A"
    batch: Batch;
    programType: ProgramType;
    publishDate: Date;
    validFrom: Date;
    validTo?: Date;
    academicYear: string; // e.g., "2025-26"
}

export interface Timetable extends Document {
    _id: string;
    title: string; // User-friendly name
    metadata: TimetableMetadata;
    subjects: Subject[];
    visibleDays: DayOfWeek[]; // Days to show in the timetable
    timeSlots: TimeSlot[]; // All time slots for the day
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string; // Owner of the timetable
}

export interface TimetableCell {
    timeSlot: TimeSlot;
    day: DayOfWeek;
    subject?: Subject;
    isEmpty: boolean;
}

export interface TimetableGrid {
    timeSlots: TimeSlot[];
    days: DayOfWeek[];
    cells: TimetableCell[][];
}

// API Response Types
export interface TimetableListResponse {
  timetables: Pick<Timetable, '_id' | 'title' | 'metadata' | 'isActive' | 'createdAt'>[];
  total: number;
  page: number;
  limit: number;
  offline?: boolean; // Added for offline detection
}

export interface TimetableResponse {
    timetable: Timetable;
    grid: TimetableGrid;
}

// Form Types
export interface CreateTimetableRequest {
    title: string;
    metadata: TimetableMetadata;
    subjects: Subject[];
    visibleDays: DayOfWeek[];
    timeSlots: TimeSlot[];
}

export interface UpdateTimetableRequest extends Partial<CreateTimetableRequest> {
    isActive?: boolean;
}

// Filter and Search Types
export interface TimetableFilters {
    programName?: string;
    semester?: string;
    batch?: Batch;
    programType?: ProgramType;
    academicYear?: string;
    isActive?: boolean;
}

export interface TimetableSearchQuery extends TimetableFilters {
    q?: string; // General search query
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'publishDate';
    sortOrder?: 'asc' | 'desc';
}

// PDF Export Types
export interface PDFExportOptions {
    format: 'A4' | 'A3' | 'Letter';
    orientation: 'portrait' | 'landscape';
    includeMetadata: boolean;
    includeEmptySlots: boolean;
}

export interface TimetableExportRequest {
    timetableId: string;
    options: PDFExportOptions;
}
