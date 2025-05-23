import { NextRequest, NextResponse } from 'next/server';
import { Applications_Model } from '@Models/Applications';

/**
 * Middleware to check if application is in emergency shutdown mode
 * and redirect to maintenance page if needed
 */
export async function handleEmergencyShutdown(
  req: NextRequest,
  applicationId: string
): Promise<NextResponse | null> {
  try {
    // Skip check for API routes that should be accessible during emergency
    const path = req.nextUrl.pathname;
    if (
      path.startsWith('/api/developer/emergency/disable') ||
      path.startsWith('/maintenance')
    ) {
      return null; // Continue normal processing
    }

    // Check application's emergency status
    const application = await Applications_Model.findOne({ ApplicationID: applicationId });
    
    if (!application) {
      return null; // Application not found, continue normal processing
    }
    
    // Check if emergency shutdown is enabled
    if (application.EmergencyControls?.ShutdownEnabled) {
      // Redirect to maintenance page with reason
      const url = new URL('/maintenance', req.url);
      url.searchParams.set('reason', application.EmergencyControls.ShutdownReason || 'Emergency maintenance');
      
      return NextResponse.redirect(url);
    }

    // No emergency, continue with normal request
    return null;
    
  } catch (error) {
    console.error('Error checking emergency status:', error);
    return null; // Continue normal processing on error
  }
}