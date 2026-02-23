import { NextRequest, NextResponse } from "next/server";
import { getStateInfo } from "../../../Utils/StateInitializer";
import { log } from "../../../Utils";

// GET - Get state information (public endpoint for health checks)
export async function GET(req: NextRequest) {
    try {
        const stateInfo = await getStateInfo();
        
        if (!stateInfo) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "State information not available",
                    StatusCode: 503
                },
                { status: 503 }
            );
        }

        // Return public state information (without sensitive data)
        const publicStateInfo = {
            features: {
                signupEnabled: stateInfo.features.signupEnabled,
                signinEnabled: stateInfo.features.signinEnabled
            },
            lastUpdated: stateInfo.lastUpdated,
            passwordRequirements: {
                minLength: stateInfo.security.passwordRequirements.minLength,
                maxLength: stateInfo.security.passwordRequirements.maxLength,
                requireUppercase: stateInfo.security.passwordRequirements.requireUppercase,
                requireLowercase: stateInfo.security.passwordRequirements.requireLowercase,
                requireNumbers: stateInfo.security.passwordRequirements.requireNumbers,
                requireSpecialCharacters: stateInfo.security.passwordRequirements.requireSpecialCharacters
            },
            whitelistedDomainsCount: stateInfo.security.whitelistedDomains.length,
            blockedThreatsCount: stateInfo.security.blockedThreats.length
        };

        return NextResponse.json(
            {
                Status: 1,
                Message: "State information retrieved successfully",
                StatusCode: 200,
                Data: publicStateInfo
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Error in GET /api/state-info: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
