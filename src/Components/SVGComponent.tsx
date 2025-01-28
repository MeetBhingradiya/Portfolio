/**
 *  @FileID          Components\SVGComponent.tsx
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


import React from "react";

interface SvgComponentProps { 
    svgString: string;
    _class?: string;
    style?: React.CSSProperties;
    props?: any;
}
const SvgComponent = ({ svgString, _class, style, ...props }: SvgComponentProps) => {
    return (
        <div
            className={_class}
            style={style}
            dangerouslySetInnerHTML={{ __html: svgString as string }}
            {...props}
        />
    );
};

export default SvgComponent;