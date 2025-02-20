import { NextResponse, NextRequest } from 'next/server'
import requestIp from 'request-ip'

export async function GET(
    req: NextRequest,
) {
    return NextResponse.json({ ip: requestIp.getClientIp(req as any) }, { status: 200, statusText: 'OK' })
}