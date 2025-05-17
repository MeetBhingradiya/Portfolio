"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import React from "react";
import { Config } from "@Config/index";

function Page() {

    React.useEffect(() => {
        if (Config.Environment === "development") {
            // ? Do Something Here that Only work on Development Mode
        }
    }, []);

    return (
        <div className="Page CENTER">
            <div className="flex flex-col gap-4 items-center">
                <h1 className="text-5xl">
                    Testing Page
                </h1>
                <div className="text-gray-400">
                    This is Test Page this will be used to test Only on Development Mode
                </div>
                <Link href="/">
                    <Button variant="faded">
                        Go Back
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export default Page;
