import { NextRequest } from "next/server";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import { TraceReport } from "@Models/TraceReport";
import { dbConnect } from "@Utils/dbConnect";
import { auth } from "@/auth";

// export const runtime = "edge";

export async function GET(req: NextRequest) {
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

        // Parse query parameters
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100); // Max 100 per page
        const sortBy = url.searchParams.get("sortBy") || "timestamp";
        const sortOrder = url.searchParams.get("sortOrder") === "asc" ? 1 : -1;
        const status = url.searchParams.get("status"); // "success", "failed", "all"
        const isBot = url.searchParams.get("isBot"); // "true", "false", "all"
        const ip = url.searchParams.get("ip");
        const browser = url.searchParams.get("browser");
        const platform = url.searchParams.get("platform");
        const startDate = url.searchParams.get("startDate");
        const endDate = url.searchParams.get("endDate");

        // Build filter query
        const filter: any = {};

        // Date range filter
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        // Status filter
        if (status === "success") {
            filter["result.status"] = 1;
        } else if (status === "failed") {
            filter["result.status"] = 0;
        }

        // Bot filter
        if (isBot === "true") {
            filter["botDetection.isBot"] = true;
        } else if (isBot === "false") {
            filter["botDetection.isBot"] = false;
        }

        // IP filter
        if (ip) {
            filter.ip = { $regex: ip, $options: "i" };
        }

        // Browser filter
        if (browser) {
            filter.browser = { $regex: browser, $options: "i" };
        }

        // Platform filter
        if (platform) {
            filter.platform = { $regex: platform, $options: "i" };
        }

        // Calculate skip for pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalCount = await TraceReport.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limit);

        // Get trace reports with pagination and sorting
        const traceReports = await TraceReport.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .select({
                requestId: 1,
                timestamp: 1,
                ip: 1,
                origin: 1,
                browser: 1,
                platform: 1,
                "botDetection.isBot": 1,
                "botDetection.reason": 1,
                "botDetection.category": 1,
                "botDetection.confidence": 1,
                "fingerprint.suspicious": 1,
                "validation.threatDetected": 1,
                "result.status": 1,
                "result.statusCode": 1,
                "result.statusNumber": 1,
                "result.message": 1,
                "performance.processingTime": 1,
                "geolocation.country": 1,
                "geolocation.countryCode": 1,
                "session.isAuthenticated": 1,
                "session.userId": 1
            })
            .lean();

        // Add risk score to each report
        const enrichedReports = traceReports.map(report => ({
            ...report,
            riskScore: calculateRiskScore(report)
        }));

        return ControllerResponseMap({
            Status: 1,
            Message: "Trace reports retrieved successfully",
            StatusCode: "REPORTS_SUCCESS",
            StatusNumber: 200,
            Data: {
                reports: enrichedReports,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                filters: {
                    status,
                    isBot,
                    ip,
                    browser,
                    platform,
                    startDate,
                    endDate,
                    sortBy,
                    sortOrder: sortOrder === 1 ? "asc" : "desc"
                }
            }
        });

    } catch (error) {
        console.error("Trace reports API error:", error);
        
        return ControllerResponseMap({
            Status: 0,
            Message: "Failed to retrieve trace reports",
            StatusCode: "REPORTS_ERROR",
            StatusNumber: 500
        });
    }
}

// Helper function to calculate risk score
function calculateRiskScore(report: any): number {
    let score = 0;
    
    if (report.botDetection?.isBot) score += 40;
    if (report.fingerprint?.suspicious) score += 20;
    if (report.validation?.threatDetected) score += 30;
    if (report.result?.status === 0) score += 10;
    
    return Math.min(score, 100);
}
