import { NextResponse } from 'next/server'
import requestIp, { Request } from 'request-ip'

export async function GET(
    req: Request,
) {
    return NextResponse.json({ ip: requestIp.getClientIp(req) }, { status: 200, statusText: 'OK' })
}