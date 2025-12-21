import { NextRequest, NextResponse } from "next/server";
import { getCurrentState, updateState, syncWithRemoteState } from "../../../../Controllers/State";
import { useEmptyFields } from "../../../../Hooks";
import { log } from "../../../../Utils";

// GET - Fetch current state
export async function GET(req: NextRequest) {
    try {
        const state = await getCurrentState();
        
        if (!state) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Failed to fetch state",
                    StatusCode: 500
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                Status: 1,
                Message: "State fetched successfully",
                StatusCode: 200,
                Data: state
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Error in GET /api/admin/state: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// PUT - Update state settings
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate required fields based on what's being updated
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid request body",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        const updatedState = await updateState(body);

        if (!updatedState) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Failed to update state",
                    StatusCode: 500
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                Status: 1,
                Message: "State updated successfully",
                StatusCode: 200,
                Data: updatedState
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Error in PUT /api/admin/state: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}

// POST - Sync with remote state
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        if (body.action !== 'sync') {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Invalid action. Use 'sync' to sync with remote state",
                    StatusCode: 400
                },
                { status: 400 }
            );
        }

        const syncedState = await syncWithRemoteState();

        if (!syncedState) {
            return NextResponse.json(
                {
                    Status: 0,
                    Message: "Failed to sync with remote state",
                    StatusCode: 500
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                Status: 1,
                Message: "State synced with remote repository successfully",
                StatusCode: 200,
                Data: syncedState
            },
            { status: 200 }
        );
    } catch (error: any) {
        log(`Error in POST /api/admin/state: ${error?.message}`);
        return NextResponse.json(
            {
                Status: 0,
                Message: "Internal server error",
                StatusCode: 500
            },
            { status: 500 }
        );
    }
}
