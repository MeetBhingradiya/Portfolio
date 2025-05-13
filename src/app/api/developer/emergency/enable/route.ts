import { NextRequest, NextResponse } from 'next/server';
import { developerSecurityController } from '../../../../../Controllers/DeveloperSecurity';

/**
 * API route for enabling emergency shutdown
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    return developerSecurityController.enableEmergencyShutdown(req);
  } catch (error) {
    console.error('Error in emergency enable route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}