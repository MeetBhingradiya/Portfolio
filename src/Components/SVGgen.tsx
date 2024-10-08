"use client";

import React, { useEffect, useState } from 'react';

function SVGgen({ path }: { path: string }) {
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

export default SVGgen;