/**
 *  @FileID          Components\Footer\LandingFooter.tsx
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
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
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
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 28/01/25 11:59 AM IST (Kolkata +5:30 UTC)
 *  @modified 22/02/25 7:25 PM IST (Kolkata +5:30 UTC)
 */


"use client";

import React from 'react'
import "@Styles/LandingFooter.sass"
import { SocialLinks } from '@Config/SocialLinks'
import { useTheme } from "@Hooks/useTheme";
import { Tooltip } from '@heroui/react';


interface Link {
    label: string
    endpoint?: string
    tooltip?: string
    function?: () => void
    isEnable?: boolean
}

interface Group {
    title: string
    links: Link[]
    isEnable?: boolean
}

function LandingFooter() {
    const { theme, toggleTheme } = useTheme();

    const Links: Group[] = [
        {
            title: "About",
            links: [
                {
                    label: "About Me",
                    endpoint: "/about"
                },
                {
                    label: "Experience",
                    endpoint: "/Experience"
                },
                {
                    label: "Education",
                    endpoint: "/Education",
                    isEnable: false
                },
                {
                    label: "Skills",
                    endpoint: "/Skills"
                },
                {
                    label: "Resume",
                    endpoint: "/Resume",
                    tooltip: "Generate PDF Resume (Short Version of CV)"
                },
                {
                    label: "CV",
                    endpoint: "/CurriculumVitae",
                    tooltip: "Generate PDF CV"
                },
            ]
        },
        {
            title: "Explore",
            isEnable: true,
            links: [
                {
                    label: "Blogs",
                    endpoint: "/blogs"
                },
                {
                    label: "Showcase",
                    endpoint: "/Showcase"
                },
                {
                    label: "Timeline",
                    endpoint: "/Showcase"
                },
            ]
        },
        {
            title: "Projects",
            isEnable: true,
            links: [
                {
                    tooltip: "My Bookmark Manager",
                    label: "Browser Tab",
                    endpoint: "/Tools",
                    isEnable: true
                },
                {
                    tooltip: "Advanced QR Code Generator",
                    label: "QR Generator",
                    endpoint: "/Tools/QR",
                    isEnable: true
                },
                {
                    tooltip: "Python, Multi-Threaded, FFmpeg, Customizable",
                    label: "TS to MP4",
                    endpoint: "https://github.com/MeetBhingradiya/TStoMP4",
                    isEnable: true
                },
                {
                    tooltip: "Python, Multi-Threaded, Batch Convert, Customizable",
                    label: "Embroidery DST to PNG",
                    endpoint: "https://github.com/MeetBhingradiya/Embroidery-DST-to-PNG",
                    isEnable: true
                },
                {
                    label: "UUID Generator",
                    endpoint: "/Tools/UUID",
                    isEnable: false
                },
            ]
        },
        {
            title: "Products & Services",
            isEnable: false,
            links: [
                {
                    label: "Status",
                    endpoint: "/status"
                },
                {
                    label: "SM Network VIP",
                    endpoint: "/Social/Discord",
                    isEnable: false
                },
                {
                    label: "XBox Game Pass",
                    endpoint: "/Social/Discord",
                    isEnable: false
                },
            ]
        },
        {
            title: "Personalisation",
            isEnable: false,
            links: [
                {
                    label: "Switch Theme",
                    function: () => {
                        toggleTheme()
                    }
                },
                {
                    label: "Language",
                    function: () => { }
                }
            ]
        },
        {
            title: "Social",
            links: [
                ...SocialLinks.map((item, index) => {
                    if (item.isEnable) {
                        return {
                            label: item.Label,
                            endpoint: item?.URL || "/",
                        }
                    } else {
                        return null
                    }
                }).filter((item) => item !== null) as Link[],
                {
                    label: "Contact Me",
                    endpoint: "/contact"
                },
            ]
        },
        {
            title: "Support & Policies",
            isEnable: true,
            links: [
                {
                    label: "Open Source",
                    endpoint: ""
                },
                {
                    label: "Privacy Policy",
                    endpoint: "/privacy"
                },
                {
                    label: "Terms of Service",
                    endpoint: "/terms"
                },
                {
                    label: "Cookie",
                    endpoint: "/cookie"
                },
                {
                    label: "Feedback",
                    endpoint: "/feedback"
                },
                {
                    label: "Sitemap",
                    endpoint: "/api/sitemap"
                },
                {
                    label: "Changelog",
                    endpoint: "/changelog"
                }
            ]
        },
    ]

    return (<>
        <div className="LandingFooter">

            {/* Brand Icon with Name */}
            <div className="Brand flex flex-col gap-2">
                <div className='Icon'>
                    <img src="/favicon.ico" />
                </div>
                <div className='text'>
                    <h1 className="text-2xl">Meet Bhingradiya</h1>
                </div>
                {/* <p className="text-gray-400"></p> */}
            </div>

            {/* Render Links with Group on Side */}
            <div className="Links flex flex-row justify-between">
                {Links.map((group, index) => {
                    if (group.isEnable === false) return null
                    return (
                        <div key={index} className="Group flex flex-col gap-2">
                            <h3 className="Title text-lg font-bold">{group.title}</h3>
                            {group.links.map((link, index) => {
                                if (link.isEnable === false) return null
                                if (link.function) {
                                    return (
                                        <a key={index} onClick={link.function} className="Link text-gray-400 hover:text-gray-500 cursor-pointer select-none">{link.label}</a>
                                    )
                                }

                                if (link.tooltip) {
                                    return (
                                        <Tooltip key={index} content={link.tooltip} placement="top">

                                            {
                                                link.function ? (
                                                    <a key={index} onClick={link.function} className="Link text-gray-400 hover:text-gray-500 cursor-pointer select-none">{link.label}</a>
                                                ) : (
                                                    <a key={index} href={link.endpoint} className="Link text-gray-400 hover:text-gray-500">{link.label}</a>
                                                )
                                            }
                                        </Tooltip>
                                    )
                                }

                                return (
                                    <a key={index} href={link.endpoint} className="Link text-gray-400 hover:text-gray-500">{link.label}</a>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    </>)
}

export default LandingFooter