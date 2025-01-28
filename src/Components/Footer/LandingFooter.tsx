/**
 *  @FileID          Components\Footer\LandingFooter.tsx
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


import React from 'react'
import "@Styles/LandingFooter.sass"

interface Link {
    label: string
    endpoint?: string
    function?: () => void
}

interface Group {
    title: string
    links: Link[]
}

const Links: Group[] = [
    {
        title: "About",
        links: [
            {
                label: "About Me",
                endpoint: "/about"
            },
            {
                label: "Services",
                endpoint: "/services"
            },
            {
                label: "Skills",
                endpoint: "/skills"
            },
            {
                label: "Contact",
                endpoint: "/contact"
            },
            {
                label: "Blogs",
                endpoint: "/blogs"
            },
        ]
    },
    {
        title: "Projects",
        links: []
    },
    {
        title: "Social",
        links: []
    },
    {
        title: "Personalisation",
        links: []
    },
]

function LandingFooter() {
    return (<>
        <div className="LandingFooter">
            
            {/* Brand Icon with Name */}
            <div className="Brand flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Meet Bhingradiya</h1>
                <p className="text-gray-400">Full Stack Developer</p>
            </div>

            {/* Render Links with Group on Side */}
            <div className="Links flex flex-row justify-between">
                {Links.map((group, index) => (
                    <div key={index} className="Group flex flex-col gap-2">
                        <h3 className="Link text-lg font-bold">{group.title}</h3>
                        {group.links.map((link, index) => (
                            <a key={index} href={link.endpoint} className="text-gray-400 hover:text-gray-500">{link.label}</a>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </>)
}

export default LandingFooter