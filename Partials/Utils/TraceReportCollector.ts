import { NextRequest } from "next/server";
import { TraceReport, ITraceReport } from "../Models/TraceReport";
import { dbConnect } from "./dbConnect";
import { Config } from "../Config";
import { UserAgent } from "./UserAgent";
import { getClientIp } from "../Library/request-ip";
import { v4 as uuidv4 } from "uuid";

export interface TraceReportData {
    // Required fields from the request
    req: NextRequest;
    botDetection: {
        isBot: boolean;
        reason: string;
        category?: string;
        confidence?: number;
    };
    fingerprint?: {
        suspicious: boolean;
        reason: string;
        headerOrderScore?: number;
        missingHeaders?: string[];
        automationHeaders?: string[];
    };
    validation: {
        originValid: boolean;
        refererValid: boolean;
        browserSupported: boolean;
        platformSupported: boolean;
        threatDetected: boolean;
    };
    result: {
        status: number;
        statusCode: string;
        statusNumber: number;
        message: string;
        csrfTokenGenerated: boolean;
    };
    performance: {
        processingTime: number;
        botDetectionTime?: number;
        threatCheckTime?: number;
        validationTime?: number;
    };
    threatIntelligence?: any;
    geolocation?: any;
    session?: {
        sessionId?: string;
        userId?: string;
        isAuthenticated?: boolean;
    };
}

export class TraceReportCollector {
    private startTime: number;
    private botDetectionStartTime?: number;
    private threatCheckStartTime?: number;
    private validationStartTime?: number;

    constructor() {
        this.startTime = Date.now();
    }

    // Mark the start of bot detection
    startBotDetection() {
        this.botDetectionStartTime = Date.now();
    }

    // Mark the end of bot detection and return duration
    endBotDetection(): number {
        if (!this.botDetectionStartTime) return 0;
        return Date.now() - this.botDetectionStartTime;
    }

    // Mark the start of threat check
    startThreatCheck() {
        this.threatCheckStartTime = Date.now();
    }

    // Mark the end of threat check and return duration
    endThreatCheck(): number {
        if (!this.threatCheckStartTime) return 0;
        return Date.now() - this.threatCheckStartTime;
    }

    // Mark the start of validation
    startValidation() {
        this.validationStartTime = Date.now();
    }

    // Mark the end of validation and return duration
    endValidation(): number {
        if (!this.validationStartTime) return 0;
        return Date.now() - this.validationStartTime;
    }

    // Get total processing time
    getTotalProcessingTime(): number {
        return Date.now() - this.startTime;
    }

    // Extract request headers as a plain object
    private extractHeaders(req: NextRequest): Record<string, string> {
        const headers: Record<string, string> = {};
        req.headers.forEach((value, key) => {
            // Handle both string and string[] values
            headers[key] = Array.isArray(value) ? value.join(', ') : value;
        });
        return headers;
    }

    // Count previous requests from the same IP
    private async getPreviousRequestsCount(ip: string): Promise<number> {
        try {
            await dbConnect();
            await dbConnect();
            const count = await TraceReport.countDocuments({
                ip: ip,
                timestamp: { 
                    $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                }
            });
            return count;
        } catch (error) {
            console.error("Error counting previous requests:", error);
            return 0;
        }
    }

    // Main method to save trace report
    async saveTraceReport(data: TraceReportData): Promise<void> {
        try {
            await dbConnect();

            const { req, botDetection, fingerprint, validation, result, threatIntelligence, geolocation, session } = data;
            
            // Parse user agent
            const userAgent = req.headers.get("user-agent") || "";
            const parsedUA = new UserAgent(userAgent).parse();
            
            // Get client IP
            const ip = getClientIp(req) || "Unknown";
            
            // Ensure IP is a string
            const ipAddress = Array.isArray(ip) ? ip[0] : ip;
            
            // Extract headers
            const headers = this.extractHeaders(req);
            
            // Get previous requests count
            const previousRequests = await this.getPreviousRequestsCount(ipAddress);
            
            // Create trace report document
            const traceReportData: Partial<ITraceReport> = {
                // Request Information
                requestId: uuidv4(),
                timestamp: new Date(),
                ip: ipAddress,
                origin: req.headers.get("origin") || "",
                referer: req.headers.get("referer") || undefined,
                
                // User Agent Information
                userAgent: userAgent,
                browser: parsedUA.browser || "Unknown",
                browserVersion: parsedUA.browserVersion,
                platform: parsedUA.platform || "Unknown",
                platformVersion: parsedUA.platformVersion,
                device: parsedUA.device,
                
                // Security Headers
                secChUa: req.headers.get("sec-ch-ua") || undefined,
                secChUaPlatform: req.headers.get("sec-ch-ua-platform") || undefined,
                secChUaMobile: req.headers.get("sec-ch-ua-mobile") || undefined,
                acceptLanguage: req.headers.get("accept-language") || undefined,
                acceptEncoding: req.headers.get("accept-encoding") || undefined,
                connection: req.headers.get("connection") || undefined,
                
                // Request Headers
                headers: headers,
                headerCount: Object.keys(headers).length,
                
                // Bot Detection
                botDetection: {
                    isBot: botDetection.isBot,
                    reason: botDetection.reason || undefined,
                    category: botDetection.category as any,
                    confidence: botDetection.confidence || 0
                },
                
                // Request Fingerprint
                fingerprint: fingerprint ? {
                    suspicious: fingerprint.suspicious,
                    reason: fingerprint.reason,
                    headerOrderScore: fingerprint.headerOrderScore,
                    missingHeaders: fingerprint.missingHeaders || [],
                    automationHeaders: fingerprint.automationHeaders || []
                } : {
                    suspicious: false,
                    reason: undefined,
                    headerOrderScore: undefined,
                    missingHeaders: [],
                    automationHeaders: []
                },
                
                // Validation Results
                validation: validation,
                
                // Threat Intelligence
                threatIntelligence: threatIntelligence ? {
                    isVpn: threatIntelligence.isVpn || false,
                    isProxy: threatIntelligence.isProxy || false,
                    isTor: threatIntelligence.isTor || false,
                    isDatacenter: threatIntelligence.isDatacenter || false,
                    country: threatIntelligence.country,
                    city: threatIntelligence.city,
                    isp: threatIntelligence.isp,
                    riskScore: threatIntelligence.riskScore || 0
                } : undefined,
                
                // Geographic Information
                geolocation: geolocation ? {
                    country: geolocation.country,
                    countryCode: geolocation.countryCode,
                    region: geolocation.region,
                    city: geolocation.city,
                    latitude: geolocation.latitude,
                    longitude: geolocation.longitude,
                    timezone: geolocation.timezone
                } : undefined,
                
                // Result
                result: result,
                
                // Performance Metrics
                performance: {
                    processingTime: this.getTotalProcessingTime(),
                    botDetectionTime: data.performance.botDetectionTime,
                    threatCheckTime: data.performance.threatCheckTime,
                    validationTime: data.performance.validationTime
                },
                
                // Session Information
                session: {
                    sessionId: session?.sessionId,
                    userId: session?.userId,
                    isAuthenticated: session?.isAuthenticated || false,
                    previousRequests: previousRequests
                },
                
                // Debug Information (only in development)
                debug: Config.Environment === "development" ? {
                    environment: Config.Environment,
                    additionalInfo: {
                        url: req.url,
                        method: req.method,
                        nextUrl: req.nextUrl.pathname
                    }
                } : undefined
            };

            // Save to database
            const traceReport = new TraceReport(traceReportData);
            await traceReport.save();

            if (Config.Environment === "development") {
                console.log(`Trace report saved: ${traceReport.requestId}`);
            }

        } catch (error) {
            console.error("Error saving trace report:", error);
            // Don't throw error to avoid breaking the main flow
        }
    }

    // Static method to create a new collector
    static create(): TraceReportCollector {
        return new TraceReportCollector();
    }
}

// Utility functions for analytics
export class TraceAnalytics {
    
    // Get basic analytics for a date range
    static async getBasicAnalytics(startDate: Date, endDate: Date) {
        try {
            await dbConnect();
            return await (TraceReport as any).getAnalytics(startDate, endDate);
        } catch (error) {
            console.error("Error getting analytics:", error);
            return null;
        }
    }

    // Get geographic distribution
    static async getGeographicDistribution(startDate: Date, endDate: Date) {
        try {
            await dbConnect();
            return await TraceReport.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate },
                        'geolocation.countryCode': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$geolocation.countryCode',
                        country: { $first: '$geolocation.country' },
                        count: { $sum: 1 },
                        successRate: {
                            $avg: { $cond: [{ $eq: ['$result.status', 1] }, 1, 0] }
                        }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 50 }
            ]);
        } catch (error) {
            console.error("Error getting geographic distribution:", error);
            return [];
        }
    }

    // Get browser and platform statistics
    static async getBrowserPlatformStats(startDate: Date, endDate: Date) {
        try {
            await dbConnect();
            return await TraceReport.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: { browser: '$browser', platform: '$platform' },
                        count: { $sum: 1 },
                        successRate: {
                            $avg: { $cond: [{ $eq: ['$result.status', 1] }, 1, 0] }
                        },
                        botRate: {
                            $avg: { $cond: ['$botDetection.isBot', 1, 0] }
                        }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ]);
        } catch (error) {
            console.error("Error getting browser/platform stats:", error);
            return [];
        }
    }

    // Get threat analysis
    static async getThreatAnalysis(startDate: Date, endDate: Date) {
        try {
            await dbConnect();
            return await TraceReport.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRequests: { $sum: 1 },
                        botDetected: {
                            $sum: { $cond: ['$botDetection.isBot', 1, 0] }
                        },
                        suspiciousFingerprints: {
                            $sum: { $cond: ['$fingerprint.suspicious', 1, 0] }
                        },
                        threatsDetected: {
                            $sum: { $cond: ['$validation.threatDetected', 1, 0] }
                        },
                        vpnRequests: {
                            $sum: { $cond: ['$threatIntelligence.isVpn', 1, 0] }
                        },
                        proxyRequests: {
                            $sum: { $cond: ['$threatIntelligence.isProxy', 1, 0] }
                        },
                        torRequests: {
                            $sum: { $cond: ['$threatIntelligence.isTor', 1, 0] }
                        },
                        avgRiskScore: { $avg: '$threatIntelligence.riskScore' }
                    }
                }
            ]);
        } catch (error) {
            console.error("Error getting threat analysis:", error);
            return null;
        }
    }

    // Get hourly request distribution
    static async getHourlyDistribution(startDate: Date, endDate: Date) {
        try {
            await dbConnect();
            return await TraceReport.aggregate([
                {
                    $match: {
                        timestamp: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: { $hour: '$timestamp' },
                        count: { $sum: 1 },
                        successCount: {
                            $sum: { $cond: [{ $eq: ['$result.status', 1] }, 1, 0] }
                        },
                        botCount: {
                            $sum: { $cond: ['$botDetection.isBot', 1, 0] }
                        }
                    }
                },
                { $sort: { _id: 1 } }
            ]);
        } catch (error) {
            console.error("Error getting hourly distribution:", error);
            return [];
        }
    }
}

export default TraceReportCollector;
