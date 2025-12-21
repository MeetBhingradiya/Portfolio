import { Schema, model, models, Document, Model } from 'mongoose';

// Define the interface for static methods
interface ITraceReportModel extends Model<ITraceReport> {
    getAnalytics(startDate: Date, endDate: Date): Promise<any[]>;
}

// Define the interface for the TraceReport document
export interface ITraceReport extends Document {
    // Request Information
    timestamp: Date;
    requestId: string;
    ip: string;
    origin: string;
    referer?: string;

    // User Agent Information
    userAgent: string;
    browser: string;
    browserVersion?: string;
    platform: string;
    platformVersion?: string;
    device?: string;

    // Security Headers
    secChUa?: string;
    secChUaPlatform?: string;
    secChUaMobile?: string;
    acceptLanguage?: string;
    acceptEncoding?: string;
    connection?: string;

    // Request Headers (for analysis)
    headers: Record<string, string>;
    headerCount: number;

    // Bot Detection
    botDetection: {
        isBot: boolean;
        reason?: string;
        category?: string; // selenium, playwright, puppeteer, automation
        confidence: number; // 0-100
    };

    // Request Fingerprint
    fingerprint: {
        suspicious: boolean;
        reason?: string;
        headerOrderScore?: number;
        missingHeaders: string[];
        automationHeaders: string[];
    };

    // Validation Results
    validation: {
        originValid: boolean;
        refererValid: boolean;
        browserSupported: boolean;
        platformSupported: boolean;
        threatDetected: boolean;
    };

    // Threat Intelligence (if available)
    threatIntelligence?: {
        isVpn: boolean;
        isProxy: boolean;
        isTor: boolean;
        isDatacenter: boolean;
        country?: string;
        city?: string;
        isp?: string;
        riskScore: number; // 0-100
    };

    // Geographic Information
    geolocation?: {
        country: string;
        countryCode: string;
        region: string;
        city: string;
        latitude?: number;
        longitude?: number;
        timezone?: string;
    };

    // Result
    result: {
        status: number; // 0 = failed, 1 = success
        statusCode: string;
        statusNumber: number;
        message: string;
        csrfTokenGenerated: boolean;
    };

    // Performance Metrics
    performance: {
        processingTime: number; // in milliseconds
        botDetectionTime?: number;
        threatCheckTime?: number;
        validationTime?: number;
    };

    // Session Information
    session?: {
        sessionId?: string;
        userId?: string;
        isAuthenticated: boolean;
        previousRequests: number; // count of previous requests from this IP
    };

    // Additional Debug Information (development only)
    debug?: {
        environment: string;
        additionalInfo?: Record<string, any>;
    };
}

// Create the schema
const TraceReportSchema: Schema<ITraceReport> = new Schema({
    // Request Information
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    requestId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    ip: {
        type: String,
        required: true,
        index: true
    },
    origin: {
        type: String,
        required: true
    },
    referer: String,

    // User Agent Information
    userAgent: {
        type: String,
        required: true
    },
    browser: {
        type: String,
        required: true,
        index: true
    },
    browserVersion: String,
    platform: {
        type: String,
        required: true,
        index: true
    },
    platformVersion: String,
    device: String,

    // Security Headers
    secChUa: String,
    secChUaPlatform: String,
    secChUaMobile: String,
    acceptLanguage: String,
    acceptEncoding: String,
    connection: String,

    // Request Headers
    headers: {
        type: Map,
        of: String,
        default: {}
    },
    headerCount: {
        type: Number,
        default: 0
    },

    // Bot Detection
    botDetection: {
        isBot: {
            type: Boolean,
            required: true,
            index: true
        },
        reason: String,
        category: {
            type: String,
            enum: ['selenium', 'playwright', 'puppeteer', 'automation', 'crawler', 'other'],
            index: true
        },
        confidence: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        }
    },

    // Request Fingerprint
    fingerprint: {
        suspicious: {
            type: Boolean,
            default: false,
            index: true
        },
        reason: String,
        headerOrderScore: Number,
        missingHeaders: [String],
        automationHeaders: [String]
    },

    // Validation Results
    validation: {
        originValid: {
            type: Boolean,
            required: true,
            index: true
        },
        refererValid: {
            type: Boolean,
            required: true
        },
        browserSupported: {
            type: Boolean,
            required: true,
            index: true
        },
        platformSupported: {
            type: Boolean,
            required: true,
            index: true
        },
        threatDetected: {
            type: Boolean,
            required: true,
            index: true
        }
    },

    // Threat Intelligence
    threatIntelligence: {
        isVpn: { type: Boolean, default: false },
        isProxy: { type: Boolean, default: false },
        isTor: { type: Boolean, default: false },
        isDatacenter: { type: Boolean, default: false },
        country: String,
        city: String,
        isp: String,
        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
            index: true
        }
    },

    // Geographic Information
    geolocation: {
        country: String,
        countryCode: {
            type: String,
            index: true
        },
        region: String,
        city: String,
        latitude: Number,
        longitude: Number,
        timezone: String
    },

    // Result
    result: {
        status: {
            type: Number,
            required: true,
            index: true
        },
        statusCode: {
            type: String,
            required: true,
            index: true
        },
        statusNumber: {
            type: Number,
            required: true,
            index: true
        },
        message: {
            type: String,
            required: true
        },
        csrfTokenGenerated: {
            type: Boolean,
            default: false
        }
    },

    // Performance Metrics
    performance: {
        processingTime: {
            type: Number,
            required: true
        },
        botDetectionTime: Number,
        threatCheckTime: Number,
        validationTime: Number
    },

    // Session Information
    session: {
        sessionId: String,
        userId: {
            type: String,
            index: true
        },
        isAuthenticated: {
            type: Boolean,
            default: false,
            index: true
        },
        previousRequests: {
            type: Number,
            default: 0
        }
    },

    // Debug Information
    debug: {
        environment: String,
        additionalInfo: Schema.Types.Mixed
    }
}, {
    timestamps: true,
    collection: 'trace_reports'
});

// Create compound indexes for common queries
TraceReportSchema.index({ timestamp: -1, ip: 1 });
TraceReportSchema.index({ timestamp: -1, 'result.status': 1 });
TraceReportSchema.index({ timestamp: -1, 'botDetection.isBot': 1 });
TraceReportSchema.index({ ip: 1, timestamp: -1 });
TraceReportSchema.index({ 'geolocation.countryCode': 1, timestamp: -1 });
TraceReportSchema.index({ browser: 1, platform: 1, timestamp: -1 });

// Add methods to the schema
TraceReportSchema.methods.isSuccessful = function (): boolean {
    return this.result.status === 1;
};

TraceReportSchema.methods.isSuspicious = function (): boolean {
    return this.botDetection.isBot ||
        this.fingerprint.suspicious ||
        this.validation.threatDetected;
};

TraceReportSchema.methods.getRiskScore = function (): number {
    let score = 0;

    if (this.botDetection.isBot) score += 40;
    if (this.fingerprint.suspicious) score += 20;
    if (this.validation.threatDetected) score += 30;
    if (this.threatIntelligence?.riskScore) score += this.threatIntelligence.riskScore * 0.1;

    return Math.min(score, 100);
};

// Static methods for analytics
TraceReportSchema.statics.getAnalytics = async function (
    startDate: Date,
    endDate: Date
) {
    return await this.aggregate([
        {
            $match: {
                timestamp: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                successfulRequests: {
                    $sum: { $cond: [{ $eq: ['$result.status', 1] }, 1, 0] }
                },
                botRequests: {
                    $sum: { $cond: ['$botDetection.isBot', 1, 0] }
                },
                suspiciousRequests: {
                    $sum: { $cond: ['$fingerprint.suspicious', 1, 0] }
                },
                threatRequests: {
                    $sum: { $cond: ['$validation.threatDetected', 1, 0] }
                },
                avgProcessingTime: { $avg: '$performance.processingTime' },
                uniqueIps: { $addToSet: '$ip' },
                topBrowsers: { $addToSet: '$browser' },
                topPlatforms: { $addToSet: '$platform' }
            }
        },
        {
            $project: {
                totalRequests: 1,
                successfulRequests: 1,
                successRate: {
                    $multiply: [
                        { $divide: ['$successfulRequests', '$totalRequests'] },
                        100
                    ]
                },
                botRequests: 1,
                botRate: {
                    $multiply: [
                        { $divide: ['$botRequests', '$totalRequests'] },
                        100
                    ]
                },
                suspiciousRequests: 1,
                threatRequests: 1,
                avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
                uniqueIpsCount: { $size: '$uniqueIps' }
            }
        }
    ]);
};

export const TraceReport = models.TraceReport || model<ITraceReport, ITraceReportModel>('TraceReport', TraceReportSchema);

export default TraceReport;
