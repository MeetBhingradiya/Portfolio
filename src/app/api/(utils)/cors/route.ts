import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: NextRequest) {
    try {
        const { body = null } = await req.json();

        if (!body.endpoint) {
            return NextResponse.json(
                { error: 'Endpoint is required' },
                { status: 400 }
            );
        }

        const axiosConfig = {
            url: body.endpoint,
            method: body.method || 'GET',
            headers: body.headers || {},
            data: body.body,
        };

        const response = await axios(axiosConfig);

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message,
                details: error.response?.data || null,
            },
            { status: error.response?.status || 500 }
        );
    }
}