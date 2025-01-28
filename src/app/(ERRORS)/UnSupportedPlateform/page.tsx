/**
 *  @FileID          app\(ERRORS)\UnSupportedPlateform\page.tsx
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
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 */


"use client";
import React from 'react';

function UnSupportedPlateform_Page() {
    const [platform, setPlatform] = React.useState('');

    React.useEffect(() => {

        const userAgent = navigator.userAgent;
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            setPlatform('iOS');
        } else if (userAgent.includes('Android')) {
            setPlatform('Android');
        } else if (userAgent.includes('Windows')) {
            setPlatform('Windows');
        } else if (userAgent.includes('Mac')) {
            setPlatform('Mac');
        }

    }, []);

    return (

        <div className='Page CENTER'>

            <div className='flex flex-col gap-4 justify-center items-center'>
                <h1 className='text-4xl'>UnSupported Oprating System</h1>
                <p className='text-2xl'>{platform}</p>
            </div>

        </div>

    );

}

export default UnSupportedPlateform_Page;