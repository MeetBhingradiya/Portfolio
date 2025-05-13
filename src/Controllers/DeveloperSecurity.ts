import { NextRequest, NextResponse } from 'next/server';
import { Applications_Model, IApplications } from '../Models/Applications';
import { generateSecureToken, hashString } from '@Utils/SecurityUtils';
import { getClientIP } from '@Utils/NetworkUtils';

/**
 * Controller for managing developer backdoor access and security features
 */
class DeveloperSecurityController {
  /**
   * Authenticate developer access using secret key
   */
  public async authenticateBackdoor(req: NextRequest): Promise<NextResponse> {
    try {
      const { applicationId, secretKey, action } = await req.json();
      const clientIP = getClientIP(req);
      
      // Find the application
      const application = await Applications_Model.findOne({ ApplicationID: applicationId });
      if (!application) {
        return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
      }
      
      // Check if developer access is enabled
      if (!application.DeveloperAccess?.Enabled) {
        this.logAccessAttempt(application, clientIP, action, false);
        return NextResponse.json({ success: false, message: 'Developer access is disabled' }, { status: 403 });
      }
      
      // Check IP whitelist if configured
    //   if (application.DeveloperAccess.IPWhitelist?.length > 0 && 
    //       !application.DeveloperAccess?.IPWhitelist.includes(clientIP)) {
    //     this.logAccessAttempt(application, clientIP, action, false);
    //     return NextResponse.json({ success: false, message: 'IP not whitelisted' }, { status: 403 });
    //   }
      
      // Check rate limits
      if (!this.checkRateLimit(application, clientIP)) {
        return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
      }
      
      // Validate secret key
      if (application.DeveloperAccess.SecretKey !== secretKey) {
        this.logAccessAttempt(application, clientIP, action, false);
        return NextResponse.json({ success: false, message: 'Invalid secret key' }, { status: 401 });
      }
      
      // Check if access has expired
      if (application.DeveloperAccess.ExpiryDate && 
          new Date(application.DeveloperAccess.ExpiryDate) < new Date()) {
        this.logAccessAttempt(application, clientIP, action, false);
        return NextResponse.json({ success: false, message: 'Developer access expired' }, { status: 401 });
      }
      
      // Update last login time
      application.DeveloperAccess.LastLogin = new Date();
      await application.save();
      
      // Log successful access
      this.logAccessAttempt(application, clientIP, action, true);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Authentication successful',
        permissions: application.DeveloperAccess.Permissions || {},
        token: this.generateSessionToken(application)
      });
      
    } catch (error) {
      console.error('Error in authenticateBackdoor:', error);
      return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
  }
  
  /**
   * Generate emergency access token for recovery purposes
   */
  public async generateEmergencyToken(applicationId: string): Promise<string | null> {
    try {
      const application = await Applications_Model.findOne({ ApplicationID: applicationId });
      if (!application || !application.DeveloperAccess?.Enabled) {
        return null;
      }
      
      const emergencyToken = generateSecureToken(32);
      application.DeveloperAccess.EmergencyToken = hashString(emergencyToken);
      await application.save();
      
      return emergencyToken;
    } catch (error) {
      console.error('Error generating emergency token:', error);
      return null;
    }
  }
  
  /**
   * Check if rate limit is exceeded for the given IP
   */
  private checkRateLimit(application: IApplications, ip: string): boolean {
    if (!application.DeveloperAccess?.RateLimit) {
      return true; // No rate limit configured
    }
    
    const { MaxAttempts, TimeWindowMinutes } = application.DeveloperAccess.RateLimit;
    const recentLogs = (application.DeveloperAccess.AccessLogs || [])
      .filter(log => 
        log.IP === ip && 
        log.Success === false &&
        log.Timestamp > new Date(Date.now() - TimeWindowMinutes * 60 * 1000)
      );
    
    return recentLogs.length < MaxAttempts;
  }
  
  /**
   * Log access attempt to the application
   */
  private async logAccessAttempt(
    application: IApplications, 
    ip: string, 
    action: string, 
    success: boolean
  ): Promise<void> {
    try {
      if (!application.DeveloperAccess) {
        application.DeveloperAccess = { Enabled: false };
      }
      
      if (!application.DeveloperAccess.AccessLogs) {
        application.DeveloperAccess.AccessLogs = [];
      }
      
      application.DeveloperAccess.AccessLogs.push({
        Timestamp: new Date(),
        IP: ip,
        Action: action,
        Success: success
      });
      
      // Keep log size manageable - keep only last 100 entries
      if (application.DeveloperAccess.AccessLogs.length > 100) {
        application.DeveloperAccess.AccessLogs = application.DeveloperAccess.AccessLogs.slice(-100);
      }
      
      await application.save();
    } catch (error) {
      console.error('Error logging access attempt:', error);
    }
  }
  
  /**
   * Generate a temporary session token for authenticated developer
   */
  private generateSessionToken(application: IApplications): string {
    // Create a payload with application ID and timestamp
    const payload = {
      applicationId: application.ApplicationID,
      timestamp: Date.now(),
      permissions: application.DeveloperAccess?.Permissions || {}
    };
    
    // In a real app, you'd sign this with JWT
    // For simplicity, we're just encoding it here
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
  
  /**
   * Activate emergency shutdown for an application
   */
  public async enableEmergencyShutdown(
    req: NextRequest
  ): Promise<NextResponse> {
    try {
      const { applicationId, reason, secretKey } = await req.json();
      const clientIP = getClientIP(req);
      
      // Find the application
      const application = await Applications_Model.findOne({ ApplicationID: applicationId });
      if (!application) {
        return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
      }
      
      // Authenticate the request
      if (application.DeveloperAccess?.SecretKey !== secretKey) {
        this.logAccessAttempt(application, clientIP, 'emergency-shutdown', false);
        return NextResponse.json({ success: false, message: 'Authentication failed' }, { status: 401 });
      }
      
      // Enable emergency shutdown
      if (!application.EmergencyControls) {
        application.EmergencyControls = {
          ShutdownEnabled: true,
          ShutdownReason: reason || 'Emergency shutdown activated by developer',
          ShutdownDate: new Date()
        };
      } else {
        application.EmergencyControls.ShutdownEnabled = true;
        application.EmergencyControls.ShutdownReason = reason || 'Emergency shutdown activated by developer';
        application.EmergencyControls.ShutdownDate = new Date();
      }
      
      // Generate restart key
      const restartKey = generateSecureToken(16);
      application.EmergencyControls.RestartKey = hashString(restartKey);
      
      await application.save();
      this.logAccessAttempt(application, clientIP, 'emergency-shutdown', true);
      
      return NextResponse.json({
        success: true,
        message: 'Emergency shutdown enabled',
        restartKey: restartKey // Send plaintext key only once
      });
      
    } catch (error) {
      console.error('Error enabling emergency shutdown:', error);
      return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
  }
  
  /**
   * Disable emergency shutdown mode and restore normal operation
   */
  public async disableEmergencyShutdown(
    req: NextRequest
  ): Promise<NextResponse> {
    try {
      const { applicationId, restartKey } = await req.json();
      const clientIP = getClientIP(req);
      
      // Find the application
      const application = await Applications_Model.findOne({ ApplicationID: applicationId });
      if (!application || !application.EmergencyControls) {
        return NextResponse.json({ success: false, message: 'Application not found or no emergency controls' }, { status: 404 });
      }
      
      // Verify if emergency mode is active
      if (!application.EmergencyControls.ShutdownEnabled) {
        return NextResponse.json({ success: false, message: 'Emergency shutdown not active' }, { status: 400 });
      }
      
      // Validate restart key
      if (application.EmergencyControls.RestartKey !== hashString(restartKey)) {
        this.logAccessAttempt(application, clientIP, 'disable-emergency-shutdown', false);
        return NextResponse.json({ success: false, message: 'Invalid restart key' }, { status: 401 });
      }
      
      // Disable emergency shutdown
      application.EmergencyControls.ShutdownEnabled = false;
      application.EmergencyControls.RestartKey = undefined; // Reset the restart key
      
      await application.save();
      this.logAccessAttempt(application, clientIP, 'disable-emergency-shutdown', true);
      
      return NextResponse.json({
        success: true,
        message: 'Emergency shutdown disabled, normal operation restored'
      });
      
    } catch (error) {
      console.error('Error disabling emergency shutdown:', error);
      return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
  }
}

export const developerSecurityController = new DeveloperSecurityController();