import { NextApiRequest, NextApiResponse } from 'next'
import { NextResponse } from 'next/server'
import requestIp from 'request-ip'

export async function GET(
    req: NextApiRequest,
) {
    return NextResponse.json({ ip: requestIp.getClientIp(req) }, { status: 200, statusText: 'OK' })
}