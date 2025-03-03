/**
 *  @FileID          Components/SVGgen.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, forks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.11
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 11:04 AM IST (Kolkata +5:30 UTC)
 */


"use client";

import React, { useEffect, useState } from 'react';

function SVG({ path }: { path: string }) {
    const [svgData, setSvgData] = useState<string>('');

    useEffect(() => {
        const fetchSvg = async () => {
            try {
                const response = await fetch(path);
                const svgText = await response.text();
                setSvgData(svgText);
            } catch (error) {
                console.error('Error fetching SVG:', error);
            }
        };

        fetchSvg();
    }, [path]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0',
            margin: '0',
        }}>
            {svgData && (
                <div dangerouslySetInnerHTML={{ __html: svgData }} />
            )}
        </div>
    );
};

export default SVG;