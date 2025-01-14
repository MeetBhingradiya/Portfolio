/**
 *  @FileID          Components\SVGgen.tsx
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
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