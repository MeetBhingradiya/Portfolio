import { NextRequest, NextResponse } from 'next/server';
import TimetableModel from '@/Models/Timetable';
import { TimetableSearchQuery, TimetableListResponse } from '@/Types/Timetable';
import { connectToDatabase } from '@/Lib/MongoDB';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query: TimetableSearchQuery = {
      q: searchParams.get('q') || undefined,
      programName: searchParams.get('programName') || undefined,
      semester: searchParams.get('semester') || undefined,
      batch: searchParams.get('batch') as any || undefined,
      programType: searchParams.get('programType') as any || undefined,
      academicYear: searchParams.get('academicYear') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      sortBy: searchParams.get('sortBy') as any || 'createdAt',
      sortOrder: searchParams.get('sortOrder') as any || 'desc'
    };

    await connectToDatabase();

    // Build MongoDB query (anonymous - no user filtering)
    const mongoQuery: any = {};

    if (query.programName) {
      mongoQuery['metadata.programName'] = { $regex: query.programName, $options: 'i' };
    }
    if (query.semester) {
      mongoQuery['metadata.semester'] = { $regex: query.semester, $options: 'i' };
    }
    if (query.batch) {
      mongoQuery['metadata.batch'] = query.batch;
    }
    if (query.programType) {
      mongoQuery['metadata.programType'] = query.programType;
    }
    if (query.academicYear) {
      mongoQuery['metadata.academicYear'] = query.academicYear;
    }
    if (query.isActive !== undefined) {
      mongoQuery.isActive = query.isActive;
    }
    if (query.q) {
      mongoQuery.$or = [
        { title: { $regex: query.q, $options: 'i' } },
        { 'metadata.programName': { $regex: query.q, $options: 'i' } },
        { 'metadata.semester': { $regex: query.q, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (query.page! - 1) * query.limit!;
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortField = `${query.sortBy === 'publishDate' ? 'metadata.publishDate' : query.sortBy}`;

    // Execute queries
    const [timetables, total] = await Promise.all([
      TimetableModel
        .find(mongoQuery)
        .select('title metadata isActive createdAt')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(query.limit!)
        .lean(),
      TimetableModel.countDocuments(mongoQuery)
    ]);

    const response: TimetableListResponse = {
      timetables: timetables as any,
      total,
      page: query.page!,
      limit: query.limit!
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching timetables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timetables' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await connectToDatabase();

    const timetable = new TimetableModel({
      ...body,
      userId: 'anonymous' // Set anonymous user for all timetables
    });

    await timetable.save();
    
    return NextResponse.json({ 
      message: 'Timetable created successfully',
      timetable: timetable.toJSON()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating timetable:', error);
    return NextResponse.json(
      { error: 'Failed to create timetable' },
      { status: 500 }
    );
  }
}
