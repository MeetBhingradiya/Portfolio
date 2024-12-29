"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

function Page() {
    // const [csrfToken, setCsrfToken] = useState("");

    // useEffect(() => {
        // async function fetchCsrfToken() {
        //     const response = await fetch('/api/csrf', { method: 'POST' });
        //     if (response.ok) {
        //         const data = await response.json();
        //         setCsrfToken(data.csrfToken);
        //     } else {
        //         console.error('Failed to fetch CSRF token');
        //     }
        // }
        // fetchCsrfToken();
    // }, []);

    // async function sendRequest() {
    //     const response = await fetch('/api/bookmarks/sync', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'x-csrf': csrfToken,
    //         },
    //         body: JSON.stringify({ someData: 'value' }),
    //     });

    //     const data = await response.json();
    //     console.log(data);
    // }

    return (
        <div className="Page CENTER">
            <div className="flex flex-col gap-4 items-center">
                <h1 className="text-5xl">
                    Testing Page
                </h1>
                <div >
                    This is Test Page this will be used to test on Development Mode Only
                </div>
                <Link href="/">
                    <Button variant="faded">
                        Go Back
                    </Button>
                </Link>
            </div>
            {/* <button onClick={sendRequest}>Send Secure Request</button> */}
        </div>
    );
}

export default Page;
