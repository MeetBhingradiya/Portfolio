import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get("url");
        const quality = searchParams.get("quality") || "highest";
        const formatId = searchParams.get("formatId");

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        console.log("Stream request for:", url);

        // Get video info for filename
        const info = await ytdl.getInfo(url);
        const filename = `${info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_")}.mp4`;

        console.log("Creating stream for:", filename);

        // Create the video stream with options
        const videoStream = ytdl(url, {
            quality: formatId ? parseInt(formatId) : quality as any,
            filter: 'audioandvideo'
        });

        // Convert Node.js stream to Web ReadableStream
        const stream = new ReadableStream({
            start(controller) {
                let totalBytes = 0;
                
                videoStream.on("data", (chunk) => {
                    totalBytes += chunk.length;
                    console.log(`Streamed ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
                    controller.enqueue(chunk);
                });

                videoStream.on("end", () => {
                    console.log(`Stream complete: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
                    controller.close();
                });

                videoStream.on("error", (error) => {
                    console.error("Stream error:", error.message);
                    controller.error(error);
                });
            },
            cancel() {
                console.log("Stream cancelled by client");
                videoStream.destroy();
            }
        });

        // Return the stream as a response
        return new NextResponse(stream, {
            headers: {
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Transfer-Encoding": "chunked",
                "Cache-Control": "no-cache"
            }
        });
    } catch (error: any) {
        console.error("Stream error:", error.message);
        console.error("Full error:", error);
        return NextResponse.json(
            { 
                error: error.message || "Failed to stream video",
                details: "YouTube may be blocking the request. Try again or use a different video."
            },
            { status: 500 }
        );
    }
}
