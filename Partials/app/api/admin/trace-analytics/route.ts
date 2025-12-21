import { NextRequest } from "next/server";
import { ControllerResponseMap } from "../../../../Utils/ControllerResponseMap";
import { TraceAnalytics } from "../../../../Utils/TraceReportCollector";
import { getSession } from "../../../../Lib/auth";

// export const runtime = "edge";

export async function GET(req: NextRequest) {
    try {
        // Check if user is authenticated and has admin role
        const session = await getSession(req.headers);
        const user = session?.user as any;
        
        if (!user?.isAdmin) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Unauthorized access",
                StatusCode: "UNAUTHORIZED",
                StatusNumber: 401
            });
        }

        // Parse query parameters
        const url = new URL(req.url);
        const startDateParam = url.searchParams.get("startDate");
        const endDateParam = url.searchParams.get("endDate");
        const type = url.searchParams.get("type") || "basic";

        // Default to last 24 hours if no dates provided
        const endDate = endDateParam ? new Date(endDateParam) : new Date();
        const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);

        // Validate dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Invalid date format",
                StatusCode: "INVALID_DATE",
                StatusNumber: 400
            });
        }

        if (startDate > endDate) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Start date cannot be after end date",
                StatusCode: "INVALID_DATE_RANGE",
                StatusNumber: 400
            });
        }

        let data;

        switch (type) {
            case "basic":
                data = await TraceAnalytics.getBasicAnalytics(startDate, endDate);
                break;
            
            case "geographic":
                data = await TraceAnalytics.getGeographicDistribution(startDate, endDate);
                break;
            
            case "browser-platform":
                data = await TraceAnalytics.getBrowserPlatformStats(startDate, endDate);
                break;
            
            case "threats":
                data = await TraceAnalytics.getThreatAnalysis(startDate, endDate);
                break;
            
            case "hourly":
                data = await TraceAnalytics.getHourlyDistribution(startDate, endDate);
                break;
            
            case "comprehensive":
                // Get all analytics data
                const [basic, geographic, browserPlatform, threats, hourly] = await Promise.all([
                    TraceAnalytics.getBasicAnalytics(startDate, endDate),
                    TraceAnalytics.getGeographicDistribution(startDate, endDate),
                    TraceAnalytics.getBrowserPlatformStats(startDate, endDate),
                    TraceAnalytics.getThreatAnalysis(startDate, endDate),
                    TraceAnalytics.getHourlyDistribution(startDate, endDate)
                ]);
                
                data = {
                    basic: basic?.[0] || null,
                    geographic,
                    browserPlatform,
                    threats: threats?.[0] || null,
                    hourly
                };
                break;
            
            default:
                return ControllerResponseMap({
                    Status: 0,
                    Message: "Invalid analytics type",
                    StatusCode: "INVALID_TYPE",
                    StatusNumber: 400
                });
        }

        return ControllerResponseMap({
            Status: 1,
            Message: "Analytics data retrieved successfully",
            StatusCode: "ANALYTICS_SUCCESS",
            StatusNumber: 200,
            Data: {
                type,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                data
            }
        });

    } catch (error) {
        console.error("Analytics API error:", error);
        
        return ControllerResponseMap({
            Status: 0,
            Message: "Failed to retrieve analytics data",
            StatusCode: "ANALYTICS_ERROR",
            StatusNumber: 500
        });
    }
}
