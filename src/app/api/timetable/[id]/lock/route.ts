import { NextRequest, NextResponse } from 'next/server';
import TimetableModel from '@/Models/Timetable';
import { connectToDatabase } from '@/Lib/MongoDB';
import { TimetableLockRequest, TimetableUnlockRequest } from '@/Types/Timetable';

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// Lock a timetable
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const body: TimetableLockRequest = await request.json();
        await connectToDatabase();

        const { id } = await params;

        const timetable = await TimetableModel.findById(id);

        if (!timetable) {
            return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
        }

        if (timetable.isLocked) {
            return NextResponse.json({ error: 'Timetable is already locked' }, { status: 400 });
        }

        // For public system, we'll use a simple user identification
        // In a real auth system, you'd get this from the session/token
        const userId = 'system_admin'; // You can modify this to get from auth context

        await timetable.lock(
            userId,
            body.lockReason,
            body.unlockCode,
            body.allowedEditors
        );

        return NextResponse.json({
            message: 'Timetable locked successfully',
            timetable: {
                _id: timetable._id,
                title: timetable.title,
                isLocked: timetable.isLocked,
                lockReason: timetable.lockReason,
                lockedBy: timetable.lockedBy,
                lockedAt: timetable.lockedAt
            }
        });
    } catch (error) {
        console.error('Error locking timetable:', error);
        return NextResponse.json(
            { error: 'Failed to lock timetable' },
            { status: 500 }
        );
    }
}

// Unlock a timetable
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const body: TimetableUnlockRequest = await request.json();
        await connectToDatabase();

        const { id } = await params;

        const timetable = await TimetableModel.findById(id);

        if (!timetable) {
            return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
        }

        if (!timetable.isLocked) {
            return NextResponse.json({ error: 'Timetable is not locked' }, { status: 400 });
        }

        // For public system, we'll use provided userId or default
        const userId = body.userId || 'system_admin';

        try {
            await timetable.unlock(userId, body.unlockCode);
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }

        return NextResponse.json({
            message: 'Timetable unlocked successfully',
            timetable: {
                _id: timetable._id,
                title: timetable.title,
                isLocked: timetable.isLocked
            }
        });
    } catch (error) {
        console.error('Error unlocking timetable:', error);
        return NextResponse.json(
            { error: 'Failed to unlock timetable' },
            { status: 500 }
        );
    }
}

// Get lock status
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        await connectToDatabase();

        const { id } = await params;

        const timetable = await TimetableModel.findById(id).select('_id title isLocked lockReason lockedBy lockedAt allowedEditors');

        if (!timetable) {
            return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
        }

        return NextResponse.json({
            lockStatus: {
                isLocked: timetable.isLocked,
                lockReason: timetable.lockReason,
                lockedBy: timetable.lockedBy,
                lockedAt: timetable.lockedAt,
                hasUnlockCode: !!timetable.unlockCode,
                allowedEditors: timetable.allowedEditors || []
            }
        });
    } catch (error) {
        console.error('Error getting lock status:', error);
        return NextResponse.json(
            { error: 'Failed to get lock status' },
            { status: 500 }
        );
    }
}
