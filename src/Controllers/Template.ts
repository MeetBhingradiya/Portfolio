import { Controller_Response } from "@Types";
import { NextRequest } from "next/server";

async function Template(req: NextRequest): Promise<Controller_Response> {
    return {
        Status: 0,
        Message: "Template Controller",
        StatusCode: 404
    };
}

export { Template as ControllerTemplate };

// ? This file is ony Template of Controllers
