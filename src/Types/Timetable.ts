// Timetable Types and Interfaces

export enum SubjectSlotType {
    LECTURE = "Lecture",
    LAB = "Lab",
    TUTORIAL = "Tutorial",
    BREAK = "Break",
    LUNCH = "Lunch",
    SHORT_BREAK = "Short Break"
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
    C = "C",
    G7 = "G7",
    G8 = "G8"
}

export enum ProgramType {
    D2D = "D2D", // Diploma to Degree
    REGULAR = "Regular"
}

// Dropdown Options Interfaces
export interface SubjectOption {
    code: string; // e.g., "SEIT2220"
    name: string; // e.g., "Software Engineering"
}

export interface ClassroomOption {
    buildingCode: string; // e.g., "CX", "BX"
    floorNumber: number; // 1 digit
    roomNumber: string; // 2 digits e.g., "11", "12"
    displayName: string; // e.g., "CX111" (without hyphens)
}

export interface FacultyOption {
    shortName: string; // e.g., "JDoe"
    longName: string; // e.g., "Dr. John Doe"
}

export interface RoomLocation {
    buildingCode: string; // e.g., "CX", "BX" (can be empty for special slot types)
    floorNumber: number; // 1 digit (can be 0 for special slot types)
    roomNumber: string; // 2 digits e.g., "11", "12" (can be empty for special slot types)
}

export interface TimeSlot {
    startTime: string; // e.g., "09:50 AM"
    endTime: string; // e.g., "10:45 AM"
}

export interface Subject {
    code: string; // e.g., "SEIT2220" (for academic subjects) or "Break", "Lunch", "Short Break" (for special slots)
    name: string; // e.g., "Software Engineering" (for academic subjects) or "Break", "Lunch", "Short Break" (for special slots)
    type: SubjectSlotType;
    faculty?: string; // Faculty name (optional for Break, Lunch, Short Break)
    room: RoomLocation; // Room details (can be empty for Break, Lunch, Short Break)
    timeSlot: TimeSlot;
    day: DayOfWeek;
}

// Day-grouped subjects for better organization
export interface DaySubjects {
    day: DayOfWeek;
    subjects: Subject[];
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
    dayGroupedSubjects: DaySubjects[]; // Organized by days for better performance
    visibleDays: DayOfWeek[]; // Days to show in the timetable
    timeSlots: TimeSlot[]; // All time slots for the day (auto-sorted)
    isActive: boolean;
    isLocked: boolean; // Lock status to prevent unauthorized editing/deletion
    lockReason?: string; // Optional reason for locking
    lockedBy?: string; // User who locked the timetable
    lockedAt?: Date; // When the timetable was locked
    unlockCode?: string; // Optional unlock code for additional security
    allowedEditors?: string[]; // List of user IDs who can edit even when locked
    createdAt: Date;
    updatedAt: Date;
    userId: string; // Owner of the timetable
    
    // Dropdown options for form selections
    availableSubjects: SubjectOption[];
    availableClassrooms: ClassroomOption[];
    availableFaculty: FacultyOption[];
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
    availableSubjects: SubjectOption[];
    availableClassrooms: ClassroomOption[];
    availableFaculty: FacultyOption[];
}

export interface UpdateTimetableRequest extends Partial<CreateTimetableRequest> {
    isActive?: boolean;
    dayGroupedSubjects?: DaySubjects[];
}

// Lock Management Types
export interface TimetableLockRequest {
    lockReason?: string;
    unlockCode?: string;
    allowedEditors?: string[];
}

export interface TimetableUnlockRequest {
    unlockCode?: string;
    userId?: string;
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

// Utility Functions and Types
export interface TimetableUtils {
    // Sort time slots by start time
    sortTimeSlots: (timeSlots: TimeSlot[]) => TimeSlot[];
    
    // Group subjects by day
    groupSubjectsByDay: (subjects: Subject[]) => DaySubjects[];
    
    // Get available time slots for a specific day
    getAvailableTimeSlotsForDay: (day: DayOfWeek, subjects: Subject[], allTimeSlots: TimeSlot[]) => TimeSlot[];
    
    // Validate that each time slot has only one subject per day
    validateSingleSubjectPerSlot: (daySubjects: DaySubjects) => boolean;
    
    // Auto-organize timetable for optimal performance
    organizeTimetable: (subjects: Subject[], timeSlots: TimeSlot[]) => {
        sortedTimeSlots: TimeSlot[];
        dayGroupedSubjects: DaySubjects[];
        conflicts: TimetableConflict[];
    };
}

export interface TimetableConflict {
    day: DayOfWeek;
    timeSlot: TimeSlot;
    conflictingSubjects: Subject[];
    type: 'MULTIPLE_SUBJECTS' | 'OVERLAPPING_TIME' | 'INVALID_ROOM';
}

// Helper functions for dropdown formatting
export const formatClassroomDisplay = (classroom: ClassroomOption): string => {
    return `${classroom.buildingCode}${classroom.floorNumber}${classroom.roomNumber}`;
};

export const formatFacultyDisplay = (faculty: FacultyOption): string => {
    return `${faculty.shortName} (${faculty.longName})`;
};

export const formatSubjectDisplay = (subject: SubjectOption): string => {
    return `${subject.code} - ${subject.name}`;
};

// Time slot comparison for sorting
export const compareTimeSlots = (a: TimeSlot, b: TimeSlot): number => {
    const timeA = new Date(`1970-01-01 ${a.startTime}`).getTime();
    const timeB = new Date(`1970-01-01 ${b.startTime}`).getTime();
    return timeA - timeB;
};
