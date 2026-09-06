import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const q = req.nextUrl.searchParams.get("q") || "";
        if (!q.trim()) {
            return NextResponse.json([]);
        }

        const url = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}`;
        const res = await fetch(url);
        
        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch suggestions" }, { status: 500 });
        }

        const data = await res.json();
        // Google Suggest API returns [query, [suggestions...], ...]
        const suggestions = data[1] || [];

        return NextResponse.json(suggestions);
    } catch (err) {
        console.error("GET /api/google-suggest:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
