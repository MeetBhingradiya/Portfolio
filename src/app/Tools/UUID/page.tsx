/**
 *  @FileID          app\Tools\UUID\page.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


"use client";

import { Button, Tooltip } from '@heroui/react';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CopyAll } from '@mui/icons-material';

function UUIDGenerator() {
    const [uuid, setUUID] = React.useState<string>('');

    function generateUUID() {
        setUUID(uuidv4());
    }

    React.useEffect(() => {
        generateUUID();
    }, []);

    return (
        <div className='Page CENTER flex flex-col gap-6 p-4'>
            <div className='text-4xl font-bold'>UUID v4 Generator</div>

            <div className='text-xl dark:text-slate-300 bg-gray-800 text-white rounded-md p-5 shadow-lg select-all flex flex-row gap-2 items-center justify-between'>
                {uuid}
                <Button
                    variant='light'
                    onPress={() => navigator.clipboard.writeText(uuid)}
                    isIconOnly={true}
                >
                    <Tooltip content={`Copy "${uuid}"`}>
                        <CopyAll className='dark:text-slate-300 text-white' />
                    </Tooltip>
                </Button>
            </div>

            <div className='mt-5 flex flex-row gap-3'>
                <Button
                    variant='shadow'
                    onPress={generateUUID}
                    style={{
                        background: "var(--accent-color)",
                        color: "var(--font-color-dark)"
                    }}
                >
                    Generate
                </Button>

            </div>
        </div>
    );
}

export default UUIDGenerator;
