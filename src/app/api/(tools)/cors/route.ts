import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
    try {
        // Extract endpoint from query parameters
        const endpoint = req.nextUrl.searchParams.get('endpoint');
        
        if (!endpoint) {
            return NextResponse.json(
                { error: 'endpoint parameter is required' },
                { status: 400 }
            );
        }

        // Decode the endpoint URL
        const decodedEndpoint = decodeURIComponent(endpoint);

        // Axios Configuration
        const axiosConfig = {
            url: decodedEndpoint,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            timeout: 10000,
        };

        // Axios Request
        const response = await axios(axiosConfig);

        // Return Response
        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data,
        });

    } catch (error: any) {
        console.error('CORS GET error:', error.message);
        
        // Return Error Response
        return NextResponse.json(
            {
                error: error.message,
                details: error.response?.data || null,
            },
            { status: error.response?.status || 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { body = null } = await req.json();

        if (!body.endpoint) {
            return NextResponse.json(
                { error: "Endpoint is required" },
                { status: 400 }
            );
        }

        const axiosConfig = {
            url: body.endpoint,
            method: body.method || "GET",
            headers: body.headers || {},
            data: body.body
        };

        const response = await axios(axiosConfig);

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message,
                details: error.response?.data || null
            },
            { status: error.response?.status || 500 }
        );
    }
}
