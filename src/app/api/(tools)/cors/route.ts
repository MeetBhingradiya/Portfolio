import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// export async function GET(req: NextRequest) {
//     try {
//         // ? Extract Query Parameters : url, method, headers, body as base64
//         const Querys = req.nextUrl.searchParams.getAll("");

//         const { url, method, headers, body } = Querys as any;

//         // ? Check if URL is provided
//         if (!url) {
//             return NextResponse.json(
//                 { error: 'URL is required' },
//                 { status: 400 }
//             );
//         }

//         // ? Axios Configuration
//         const axiosConfig = {
//             url,
//             method: method || 'GET',
//             headers: headers || {},
//             data: body ? Buffer.from(body, 'base64').toString() : undefined,
//         };

//         // ? Axios Request
//         const response = await axios(axiosConfig);

//         // ? Return Response
//         return NextResponse.json({
//             status: response.status,
//             statusText: response.statusText,
//             headers: response.headers,
//             data: response.data,
//         });

//     } catch (error: any) {
//         // ? Return Error Response
//         return NextResponse.json(
//             {
//                 error: error.message,
//                 details: error.response?.data || null,
//             },
//             { status: error.response?.status || 500 }
//         );
//     }
// }

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
