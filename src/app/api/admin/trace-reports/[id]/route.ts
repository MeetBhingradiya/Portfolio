import { NextRequest } from "next/server";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import { TraceReport, ITraceReport } from "@Models/TraceReport";
import { dbConnect } from "@Utils/dbConnect";
import { auth } from "@/auth";
import { Types } from "mongoose";

// export const runtime = "edge";

interface RouteContext {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
    try {
        // Check if user is authenticated and has admin role
        const session = await auth();
        
        if (!session?.user?.isAdmin) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Unauthorized access",
                StatusCode: "UNAUTHORIZED",
                StatusNumber: 401
            });
        }

        await dbConnect();

        const { id } = await params;

        if (!id) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Report ID is required",
                StatusCode: "MISSING_ID",
                StatusNumber: 400
            });
        }

        // Find trace report by requestId or _id
        const traceReport = await TraceReport.findOne({
            $or: [
                { requestId: id },
                { _id: Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null }
            ]
        }).lean() as ITraceReport | null;

        if (!traceReport) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Trace report not found",
                StatusCode: "REPORT_NOT_FOUND",
                StatusNumber: 404
            });
        }

        // Calculate risk score
        const riskScore = calculateRiskScore(traceReport);

        // Get related reports from the same IP (last 24 hours)
        const relatedReports = await TraceReport.find({
            ip: traceReport.ip,
            _id: { $ne: traceReport._id },
            timestamp: {
                $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .select({
            requestId: 1,
            timestamp: 1,
            "result.status": 1,
            "result.statusCode": 1,
            "botDetection.isBot": 1,
            browser: 1,
            platform: 1
        })
        .lean();

        return ControllerResponseMap({
            Status: 1,
            Message: "Trace report retrieved successfully",
            StatusCode: "REPORT_SUCCESS",
            StatusNumber: 200,
            Data: {
                report: {
                    ...traceReport,
                    riskScore
                },
                relatedReports,
                summary: {
                    totalRelatedReports: relatedReports.length,
                    riskLevel: getRiskLevel(riskScore),
                    recommendations: getRecommendations(traceReport, riskScore)
                }
            }
        });

    } catch (error) {
        console.error("Trace report detail API error:", error);
        
        return ControllerResponseMap({
            Status: 0,
            Message: "Failed to retrieve trace report",
            StatusCode: "REPORT_ERROR",
            StatusNumber: 500
        });
    }
}

// Helper function to calculate risk score
function calculateRiskScore(report: ITraceReport): number {
    let score = 0;
    
    if (report.botDetection?.isBot) score += 40;
    if (report.fingerprint?.suspicious) score += 20;
    if (report.validation?.threatDetected) score += 30;
    if (report.result?.status === 0) score += 10;
    if (report.threatIntelligence?.riskScore) score += report.threatIntelligence.riskScore * 0.1;
    
    return Math.min(score, 100);
}

// Helper function to get risk level
function getRiskLevel(score: number): string {
    if (score >= 80) return "Critical";
    if (score >= 60) return "High";
    if (score >= 40) return "Medium";
    if (score >= 20) return "Low";
    return "Minimal";
}

// Helper function to get recommendations
function getRecommendations(report: ITraceReport, riskScore: number): string[] {
    const recommendations: string[] = [];
    
    if (report.botDetection?.isBot) {
        recommendations.push("Consider implementing stricter bot detection measures");
        recommendations.push(`Bot category: ${report.botDetection.category || "Unknown"}`);
    }
    
    if (report.fingerprint?.suspicious) {
        recommendations.push("Review request fingerprint patterns");
        recommendations.push("Consider additional request validation");
    }
    
    if (report.validation?.threatDetected) {
        recommendations.push("Immediate security review required");
        recommendations.push("Consider blocking this IP address");
    }
    
    if (report.threatIntelligence?.isVpn || report.threatIntelligence?.isProxy) {
        recommendations.push("Request originated from VPN/Proxy service");
        recommendations.push("Consider additional verification steps");
    }
    
    if (report.threatIntelligence?.isTor) {
        recommendations.push("Request originated from Tor network");
        recommendations.push("High anonymity request - proceed with caution");
    }
    
    if (riskScore >= 80) {
        recommendations.push("Critical risk level - immediate action required");
    } else if (riskScore >= 60) {
        recommendations.push("High risk level - enhanced monitoring recommended");
    }
    
    if (recommendations.length === 0) {
        recommendations.push("Request appears legitimate");
        recommendations.push("No immediate action required");
    }
    
    return recommendations;
}
