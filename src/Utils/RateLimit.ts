import { requestIp } from "@Lib";
import { MemoryStore } from "@Utils/RateLimitStore";
import { NextRequest, NextResponse } from "next/server";

const store = new MemoryStore();

const DefaultOptions = {
    windowMs: 60 * 1000,
    limit: 20,
    message: "Too many requests, please try again later.",
    statusCode: 429,
    headers: true,
    skipFailedRequests: false,
    skipSuccessfulRequests: false,
    keyGenerator: (request: NextRequest) => requestIp(request)!
};

store.init(DefaultOptions);

export async function RateLimiter(
    request: NextRequest,
    options: any = DefaultOptions
): Promise<NextResponse | boolean> {
    const key = options.keyGenerator(request);
    const client = (await store.increment(key)) as any;

    if (client.totalHits > options.limit) {
        return NextResponse.json(
            {
                Status: 0,
                Message:
                    options.message ??
                    "Too many requests, please try again later.",
                StatusCode: options.statusCode ?? 429
            },
            {
                status: options.statusCode ?? 429,
                headers: {
                    "X-RateLimit-Limit": options.limit.toString(),
                    "X-RateLimit-Remaining": Math.max(
                        options.limit - client.totalHits,
                        0
                    ).toString(),
                    "X-RateLimit-Reset": client.resetTime.getTime().toString()
                }
            }
        );
    }

    return false;
}
