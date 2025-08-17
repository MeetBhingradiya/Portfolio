// Timetable Utility Functions
import {
    Subject,
    TimeSlot,
    DayOfWeek,
    DaySubjects,
    TimetableConflict,
    SubjectOption,
    ClassroomOption,
    FacultyOption,
    compareTimeSlots
} from '@/Types/Timetable';

export class TimetableUtility {
    /**
     * Validate if a timetable ID is valid for API calls
     * Prevents spam requests for demo, invalid, or test IDs
     */
    static isValidTimetableId(id: string): boolean {
        if (!id) return false;
        
        // Check for invalid/demo IDs
        if (id === 'demo-1' || 
            id.length < 10 || 
            id.includes('demo') ||
            id.includes('test') ||
            id.includes('sample') ||
            id.includes('invalid')) {
            return false;
        }
        
        // Check if it looks like a valid MongoDB ObjectId (24 hex characters)
        const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
        if (!mongoIdRegex.test(id)) {
            console.warn('TimetableUtility: Invalid MongoDB ObjectId format:', id);
            return false;
        }
        
        return true;
    }

    /**
     * Sort time slots by start time for consistent ordering
     */
    static sortTimeSlots(timeSlots: TimeSlot[]): TimeSlot[] {
        return [...timeSlots].sort(compareTimeSlots);
    }

    /**
     * Group subjects by day for better organization and performance
     */
    static groupSubjectsByDay(subjects: Subject[]): DaySubjects[] {
        const grouped: { [key in DayOfWeek]?: Subject[] } = {};
        
        subjects.forEach(subject => {
            if (!grouped[subject.day]) {
                grouped[subject.day] = [];
            }
            grouped[subject.day]!.push(subject);
        });

        // Sort subjects within each day by time slot
        Object.keys(grouped).forEach(day => {
            grouped[day as DayOfWeek]!.sort((a, b) => compareTimeSlots(a.timeSlot, b.timeSlot));
        });

        return Object.entries(grouped).map(([day, subjects]) => ({
            day: day as DayOfWeek,
            subjects: subjects || []
        }));
    }

    /**
     * Get available time slots for a specific day (not already occupied)
     */
    static getAvailableTimeSlotsForDay(
        day: DayOfWeek, 
        subjects: Subject[], 
        allTimeSlots: TimeSlot[]
    ): TimeSlot[] {
        const occupiedSlots = subjects
            .filter(subject => subject.day === day)
            .map(subject => subject.timeSlot);

        return allTimeSlots.filter(slot => 
            !occupiedSlots.some(occupied => 
                occupied.startTime === slot.startTime && occupied.endTime === slot.endTime
            )
        );
    }

    /**
     * Validate that each time slot has only one subject per day
     */
    static validateSingleSubjectPerSlot(daySubjects: DaySubjects): boolean {
        const timeSlotMap = new Map<string, number>();
        
        daySubjects.subjects.forEach(subject => {
            const slotKey = `${subject.timeSlot.startTime}-${subject.timeSlot.endTime}`;
            timeSlotMap.set(slotKey, (timeSlotMap.get(slotKey) || 0) + 1);
        });

        return Array.from(timeSlotMap.values()).every(count => count <= 1);
    }

    /**
     * Auto-organize timetable for optimal performance and detect conflicts
     */
    static organizeTimetable(subjects: Subject[], timeSlots: TimeSlot[]) {
        const sortedTimeSlots = this.sortTimeSlots(timeSlots);
        const dayGroupedSubjects = this.groupSubjectsByDay(subjects);
        const conflicts: TimetableConflict[] = [];

        // Detect conflicts
        dayGroupedSubjects.forEach(dayGroup => {
            const timeSlotCounts = new Map<string, Subject[]>();
            
            dayGroup.subjects.forEach(subject => {
                const slotKey = `${subject.timeSlot.startTime}-${subject.timeSlot.endTime}`;
                if (!timeSlotCounts.has(slotKey)) {
                    timeSlotCounts.set(slotKey, []);
                }
                timeSlotCounts.get(slotKey)!.push(subject);
            });

            // Check for multiple subjects in same time slot
            timeSlotCounts.forEach((subjectsInSlot, slotKey) => {
                if (subjectsInSlot.length > 1) {
                    const [startTime, endTime] = slotKey.split('-');
                    conflicts.push({
                        day: dayGroup.day,
                        timeSlot: { startTime, endTime },
                        conflictingSubjects: subjectsInSlot,
                        type: 'MULTIPLE_SUBJECTS'
                    });
                }
            });
        });

        return {
            sortedTimeSlots,
            dayGroupedSubjects,
            conflicts
        };
    }

    /**
     * Create dropdown options from existing data
     */
    static extractSubjectOptions(subjects: Subject[]): SubjectOption[] {
        const uniqueSubjects = new Map<string, SubjectOption>();
        
        subjects.forEach(subject => {
            if (!uniqueSubjects.has(subject.code)) {
                uniqueSubjects.set(subject.code, {
                    code: subject.code,
                    name: subject.name
                });
            }
        });

        return Array.from(uniqueSubjects.values()).sort((a, b) => a.code.localeCompare(b.code));
    }

    /**
     * Create classroom options from existing data
     */
    static extractClassroomOptions(subjects: Subject[]): ClassroomOption[] {
        const uniqueRooms = new Map<string, ClassroomOption>();
        
        subjects.forEach(subject => {
            // Skip special slot types (Break, Lunch, Short Break) as they don't have meaningful room data
            if (subject.type === 'Break' || subject.type === 'Lunch' || subject.type === 'Short Break') {
                return;
            }
            
            // Skip subjects with empty or invalid room data
            if (!subject.room.buildingCode?.trim() || !subject.room.roomNumber?.trim()) {
                return;
            }
            
            const roomKey = `${subject.room.buildingCode}${subject.room.floorNumber}${subject.room.roomNumber}`;
            if (!uniqueRooms.has(roomKey)) {
                uniqueRooms.set(roomKey, {
                    buildingCode: subject.room.buildingCode,
                    floorNumber: subject.room.floorNumber,
                    roomNumber: subject.room.roomNumber,
                    displayName: roomKey
                });
            }
        });

        return Array.from(uniqueRooms.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
    }

    /**
     * Create faculty options from existing data
     */
    static extractFacultyOptions(subjects: Subject[]): FacultyOption[] {
        const uniqueFaculty = new Map<string, FacultyOption>();
        
        subjects.forEach(subject => {
            // Skip special slot types (Break, Lunch, Short Break) as they don't have faculty
            if (subject.type === 'Break' || subject.type === 'Lunch' || subject.type === 'Short Break') {
                return;
            }
            
            if (subject.faculty?.trim() && !uniqueFaculty.has(subject.faculty)) {
                uniqueFaculty.set(subject.faculty, {
                    shortName: subject.faculty,
                    longName: subject.faculty // Can be enhanced later
                });
            }
        });

        return Array.from(uniqueFaculty.values()).sort((a, b) => a.shortName.localeCompare(b.shortName));
    }

    /**
     * Format display strings for dropdowns
     */
    static formatClassroomDisplay(classroom: ClassroomOption): string {
        return `${classroom.buildingCode}-${classroom.floorNumber}-${classroom.roomNumber}`;
    }

    static formatFacultyDisplay(faculty: FacultyOption): string {
        return `${faculty.shortName} (${faculty.longName})`;
    }

    static formatSubjectDisplay(subject: SubjectOption): string {
        return `${subject.code} - ${subject.name}`;
    }

    /**
     * Convert time string to comparable number for sorting
     */
    static timeToMinutes(timeStr: string): number {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        let totalMinutes = hours * 60 + minutes;
        if (period === 'PM' && hours !== 12) {
            totalMinutes += 12 * 60;
        } else if (period === 'AM' && hours === 12) {
            totalMinutes -= 12 * 60;
        }
        
        return totalMinutes;
    }

    /**
     * Check if two time slots overlap
     */
    static doTimeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
        const start1 = this.timeToMinutes(slot1.startTime);
        const end1 = this.timeToMinutes(slot1.endTime);
        const start2 = this.timeToMinutes(slot2.startTime);
        const end2 = this.timeToMinutes(slot2.endTime);

        return start1 < end2 && start2 < end1;
    }
}

export default TimetableUtility;
