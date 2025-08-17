import { NextRequest, NextResponse } from 'next/server';
import TimetableModel from '@/Models/Timetable';
import { TimetableResponse } from '@/Types/Timetable';
import { connectToDatabase } from '@/Lib/MongoDB';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        await connectToDatabase();

        const { id } = await params;

        const timetable = await TimetableModel.findOne({
            _id: id
        });

        if (!timetable) {
            return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
        }

        let grid;
        try {
            grid = timetable.generateGrid();
        } catch (gridError) {
            // Create a fallback empty grid
            grid = {
                timeSlots: timetable.timeSlots || [],
                days: timetable.visibleDays || [],
                cells: []
            };
        }

        // Don't use toJSON() transform to preserve methods
        const timetableData = {
            _id: timetable._id.toString(),
            title: timetable.title,
            metadata: timetable.metadata,
            subjects: timetable.subjects,
            visibleDays: timetable.visibleDays,
            timeSlots: timetable.timeSlots,
            isActive: timetable.isActive,
            availableSubjects: timetable.availableSubjects,
            availableClassrooms: timetable.availableClassrooms,
            availableFaculty: timetable.availableFaculty,
            createdAt: timetable.createdAt,
            updatedAt: timetable.updatedAt
        };

        const response: TimetableResponse = {
            timetable: timetableData as any,
            grid
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        return NextResponse.json(
            { error: 'Failed to fetch timetable' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const body = await request.json();
        await connectToDatabase();

        const { id } = await params;

        const timetable = await TimetableModel.findOneAndUpdate(
            {
                _id: id
            },
            body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!timetable) {
            return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Timetable updated successfully',
            timetable: timetable.toJSON()
        });
    } catch (error) {
        console.error('Error updating timetable:', error);
        return NextResponse.json(
            { error: 'Failed to update timetable' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        await connectToDatabase();

        const { id } = await params;

        const timetable = await TimetableModel.findOneAndDelete({
            _id: id
        });

        if (!timetable) {
            return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Timetable deleted successfully' });
    } catch (error) {
        console.error('Error deleting timetable:', error);
        return NextResponse.json(
            { error: 'Failed to delete timetable' },
            { status: 500 }
        );
    }
}
