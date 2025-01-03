"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";
import React, { useState, useEffect } from "react";

function Page() {
    // const [csrfToken, setCsrfToken] = useState("");

    useEffect(() => {
        async function getData() {
            const response = await fetch('https://api.ipdata.co?api-key=eca677b284b3bac29eb72f5e496aa9047f26543605efe99ff2ce35c9', {
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://ipdata.co',
                    'Referer': 'https://ipdata.co',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log(data);
            } else {
                console.error('Failed to fetch CSRF token');
            }
        }
        
        
        getData();
    }, []);

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
