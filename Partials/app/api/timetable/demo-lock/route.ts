import { NextRequest, NextResponse } from 'next/server';
import TimetableModel from '../../../../Models/Timetable';
import { connectToDatabase } from '../../../../Lib/MongoDB';

// Demo route to lock/unlock timetables for testing
// This route should be removed or secured in production
export async function POST(request: NextRequest) {
    try {
        const { action, timetableId, lockCode } = await request.json();
        await connectToDatabase();

        if (action === 'lock-all') {
            // Lock all timetables for demonstration
            const result = await TimetableModel.updateMany(
                { isLocked: { $ne: true } },
                {
                    $set: {
                        isLocked: true,
                        lockReason: 'System maintenance - All timetables locked for security',
                        lockedBy: 'system_admin',
                        lockedAt: new Date(),
                        unlockCode: lockCode || 'admin123'
                    }
                }
            );

            return NextResponse.json({
                message: `Locked ${result.modifiedCount} timetables`,
                unlockCode: lockCode || 'admin123'
            });
        }

        if (action === 'unlock-all') {
            // Unlock all timetables
            const result = await TimetableModel.updateMany(
                { isLocked: true },
                {
                    $unset: {
                        isLocked: 1,
                        lockReason: 1,
                        lockedBy: 1,
                        lockedAt: 1,
                        unlockCode: 1,
                        allowedEditors: 1
                    }
                }
            );

            return NextResponse.json({
                message: `Unlocked ${result.modifiedCount} timetables`
            });
        }

        if (action === 'lock-single' && timetableId) {
            const timetable = await TimetableModel.findById(timetableId);
            if (!timetable) {
                return NextResponse.json({ error: 'Timetable not found' }, { status: 404 });
            }

            await timetable.lock(
                'system_admin',
                'Locked for demonstration purposes',
                lockCode || 'demo123'
            );

            return NextResponse.json({
                message: 'Timetable locked successfully',
                unlockCode: lockCode || 'demo123'
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Demo lock error:', error);
        return NextResponse.json(
            { error: 'Failed to perform lock operation' },
            { status: 500 }
        );
    }
}
