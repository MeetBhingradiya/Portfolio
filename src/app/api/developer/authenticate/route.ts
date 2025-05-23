import { NextRequest, NextResponse } from 'next/server';
import { developerSecurityController } from '../../../../Controllers/DeveloperSecurity';

/**
 * API route for developer backdoor authentication
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    return developerSecurityController.authenticateBackdoor(req);
  } catch (error) {
    console.error('Error in developer authenticate route:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}