import { NextRequest, NextResponse } from "next/server";
import { Config } from "@Config";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(req: NextRequest) {
    try {
        // Get the RSA public key from environment or file
        let publicKey = Config.Env.RSA_PUBLIC_KEY;
        
        // If not in environment, try to read from file
        if (!publicKey) {
            try {
                const keyPath = join(process.cwd(), 'keys', 'public.pem');
                publicKey = readFileSync(keyPath, 'utf8');
            } catch (fileError) {
                console.error('Failed to read public key file:', fileError);
                return NextResponse.json({
                    Status: 0,
                    Message: "RSA public key not configured",
                    StatusCode: 500
                }, { status: 500 });
            }
        }

        if (!publicKey) {
            return NextResponse.json({
                Status: 0,
                Message: "RSA public key not available",
                StatusCode: 500
            }, { status: 500 });
        }

        return NextResponse.json({
            Status: 1,
            Message: "Public key retrieved successfully",
            StatusCode: 200,
            Data: {
                publicKey: publicKey
            }
        });

    } catch (error: any) {
        console.error('Public key retrieval error:', error);
        return NextResponse.json({
            Status: 0,
            Message: "Failed to retrieve public key",
            StatusCode: 500
        }, { status: 500 });
    }
}
