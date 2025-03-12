/**
 *  @FileID          Components/ToolNavigation.tsx
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
 *  @modified 12/03/25 1:53 PM IST (Kolkata +5:30 UTC)
 */


"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import "@Styles/Tools-Navigation.sass";
import { Tooltip } from '@heroui/react';
import SvgComponent from './SVGComponent';

// MUI Icons
import {
    QrCode2,
    Colorize,
    FormatColorFill,
    TextFields,
    Extension,
    DescriptionOutlined,
    Key,
    LinkOutlined,
    Code,
    CalendarMonth,
    CalculateOutlined,
    Password,
    Home,
    Menu,
    Close,
    DataObject,
    Fingerprint,
    Security,
    Search,
    Palette,
    ChevronLeft
} from '@mui/icons-material';

const Tools: Array<{
    Query: string,
    Title: string,
    Icon: React.ReactNode,
    Description?: string,
    Category: 'data' | 'color' | 'text' | 'utility' | 'security',
}> = [
        {
            Query: "BingQuerys",
            Title: "Bing Queries",
            Icon: <Search sx={{ width: 32, height: 32 }} />,
            Description: "Generate and manage Bing search queries",
            Category: 'utility'
        },
        {
            Query: "UUID",
            Title: "UUID Generator",
            Icon: <Fingerprint sx={{ width: 32, height: 32 }} />,
            Description: "Generate random UUIDs",
            Category: 'utility'
        },
        {
            Query: "QR",
            Title: "QR Code Generator",
            Icon: <QrCode2 sx={{ width: 32, height: 32 }} />,
            Description: "Generate QR codes from text or URLs",
            Category: 'utility'
        },
        {
            Query: "JSONObject",
            Title: "JSON/Object Converter",
            Icon: <DataObject sx={{ width: 32, height: 32 }} />,
            Description: "Convert between JSON and JavaScript objects",
            Category: 'data'
        },
        {
            Query: "ColourPalette",
            Title: "Colour Picker",
            Icon: <Colorize sx={{ width: 32, height: 32 }} />,
            Description: "Pick and manage colors",
            Category: 'color'
        },
        {
            Query: "ColourConvert",
            Title: "Colour Converter",
            Icon: <Palette sx={{ width: 32, height: 32 }} />,
            Description: "Convert between color formats (HEX, RGB, HSL)",
            Category: 'color'
        },
        {
            Query: "Case",
            Title: "Case Changer",
            Icon: <TextFields sx={{ width: 32, height: 32 }} />,
            Description: "Convert text between different cases",
            Category: 'text'
        },
        {
            Query: "CRX",
            Title: "CRX Downloader",
            Icon: <Extension sx={{ width: 32, height: 32 }} />,
            Description: "Download Chrome extensions as CRX files",
            Category: 'utility'
        },
        {
            Query: "Markdown",
            Title: "Markdown Preview",
            Icon: <DescriptionOutlined sx={{ width: 32, height: 32 }} />,
            Description: "Preview and edit Markdown files",
            Category: 'text'
        },
        {
            Query: "JWT",
            Title: "JWT Decoder",
            Icon: <Security sx={{ width: 32, height: 32 }} />,
            Description: "Decode and verify JWT tokens",
            Category: 'security'
        },
        {
            Query: "URL",
            Title: "URL Builder",
            Icon: <LinkOutlined sx={{ width: 32, height: 32 }} />,
            Description: "Build and parse URLs with query parameters",
            Category: 'utility'
        },
        {
            Query: "RegExp",
            Title: "RegExp Builder & Tester",
            Icon: <Code sx={{ width: 32, height: 32 }} />,
            Description: "Build and test regular expressions",
            Category: 'text'
        },
        {
            Query: "Password",
            Title: "Password Generator",
            Icon: <Password sx={{ width: 32, height: 32 }} />,
            Description: "Generate secure passwords",
            Category: 'security'
        },
        {
            Query: "DateAndTime",
            Title: "Date & Time Utils",
            Icon: <CalendarMonth sx={{ width: 32, height: 32 }} />,
            Description: "Date and time utilities",
            Category: 'utility'
        },
        {
            Query: "EncryptAndDecrypt",
            Title: "Encrypt & Decrypt",
            Icon: <Key sx={{ width: 32, height: 32 }} />,
            Description: "Encrypt and decrypt text",
            Category: 'security'
        }
    ];

// Category labels and icons
const Categories: Record<string, { label: string, icon: React.ReactNode }> = {
    data: {
        label: "Data Tools",
        icon: <DataObject sx={{ width: 20, height: 20 }} />
    },
    color: {
        label: "Color Tools",
        icon: <Palette sx={{ width: 20, height: 20 }} />
    },
    text: {
        label: "Text Tools",
        icon: <TextFields sx={{ width: 20, height: 20 }} />
    },
    utility: {
        label: "Utilities",
        icon: <Extension sx={{ width: 20, height: 20 }} />
    },
    security: {
        label: "Security Tools",
        icon: <Security sx={{ width: 20, height: 20 }} />
    }
};

function ToolNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [width, setWidth] = useState(280);
    const navRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);
    const [isMobile, setIsMobile] = useState(false);

    // Extract the current tool from the pathname
    const currentTool = pathname.split("/").pop() || "";

    // Check if we're in the Tools section
    const isToolsSection: boolean = !pathname.split("/").pop()?.includes("Tools") as boolean

    // Filter tools based on search query
    const filteredTools = Tools.filter(tool =>
        tool.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.Description && tool.Description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group tools by category
    const toolsByCategory = filteredTools.reduce((acc, tool) => {
        if (!acc[tool.Category]) {
            acc[tool.Category] = [];
        }
        acc[tool.Category].push(tool);
        return acc;
    }, {} as Record<string, typeof Tools>);

    // Check if we're on mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        
        // Initial check
        checkIfMobile();
        
        // Add event listener for window resize
        window.addEventListener('resize', checkIfMobile);
        
        // Cleanup
        return () => {
            window.removeEventListener('resize', checkIfMobile);
        };
    }, []);

    // Load user preferences from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCollapsed = localStorage.getItem('toolNavCollapsed');
            const savedWidth = localStorage.getItem('toolNavWidth');

            if (savedCollapsed) {
                setIsCollapsed(savedCollapsed === 'true');
            }

            if (savedWidth) {
                setWidth(parseInt(savedWidth));
            }
        }
    }, []);

    // Save preferences to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('toolNavCollapsed', isCollapsed.toString());
            localStorage.setItem('toolNavWidth', width.toString());
        }
    }, [isCollapsed, width]);

    // Handle resize functionality
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (isMobile) return; // Disable resize on mobile
            
            isResizing.current = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;

            // Calculate new width (min 200px, max 500px)
            const newWidth = Math.max(200, Math.min(500, e.clientX));
            setWidth(newWidth);

            // Apply the new width
            if (navRef.current) {
                navRef.current.style.width = `${newWidth}px`;
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        // Add event listener to the resize handle
        const resizeHandle = resizeRef.current;
        if (resizeHandle) {
            resizeHandle.addEventListener('mousedown', handleMouseDown);
        }

        // Cleanup
        return () => {
            if (resizeHandle) {
                resizeHandle.removeEventListener('mousedown', handleMouseDown);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isMobile]);

    // Toggle collapsed state
    const toggleCollapse = () => {
        if (!isMobile) {
            setIsCollapsed(!isCollapsed);
        }
    };

    // If we're not in the Tools section, don't render the navigation
    if (!isToolsSection) return null;

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className="tool-nav-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close navigation" : "Open navigation"}
            >
                {isOpen ? <Close /> : <Menu />}
            </button>

            <div
                ref={navRef}
                className={`tool-navigation ${isOpen ? 'open' : ''} ${isCollapsed && !isMobile ? 'collapsed' : ''}`}
                style={{ width: isCollapsed && !isMobile ? undefined : `${width}px` }}
            >
                {/* Resize Handle */}
                <div ref={resizeRef} className="resize-handle" title="Resize navigation"></div>

                {/* Brand Header */}
                <div className="brand-header">
                    <Link href="/" className="brand-link">
                        <div className="brand-icon">
                            <Home />
                        </div>
                        <h1 className="brand-title">Meet&apos;s Tools</h1>
                    </Link>

                    {/* Collapse Toggle Button - Only on desktop */}
                    {!isMobile && (
                        <div
                            className={`toggle-collapse ${isCollapsed ? 'collapsed' : ''}`}
                            onClick={toggleCollapse}
                            title={isCollapsed ? "Expand navigation" : "Collapse navigation"}
                        >
                            <ChevronLeft />
                        </div>
                    )}
                </div>

                {/* Search Box */}
                <div className="search-container">
                    <Search className="search-icon" />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search tools..."
                        aria-label="Search tools"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Tools List */}
                <div className="tools-list">
                    {filteredTools.length > 0 ? (
                        searchQuery ? (
                            // When searching, show flat list
                            filteredTools.map((tool) => (
                                // <Tooltip 
                                //     key={tool.Query} 
                                //     content={tool.Description || tool.Title} 
                                //     placement="right"
                                // >
                                <div
                                    className={`tool-item ${currentTool === tool.Query ? "active" : ""}`}
                                    key={tool.Query}
                                    onClick={() => {
                                        if (currentTool !== tool.Query) {
                                            router.push(`/Tools/${tool.Query}`);
                                            setIsOpen(false);
                                        }
                                    }}
                                >
                                    <div className="tool-icon">
                                        {tool.Icon}
                                    </div>
                                    <span className="tool-title">{tool.Title}</span>
                                </div>
                                // </Tooltip>
                            ))
                        ) : (
                            // When not searching, group by category
                            Object.entries(toolsByCategory).map(([category, tools]) => (
                                <div key={category} className="category-group">
                                    <div className="category-header">
                                        <div className="category-icon">
                                            {Categories[category].icon}
                                        </div>
                                        <h3 className="category-title">{Categories[category].label}</h3>
                                    </div>
                                    {tools.map((tool) => (
                                        // <Tooltip 
                                        //     key={tool.Query} 
                                        //     content={tool.Description || tool.Title} 
                                        //     placement="right"
                                        // >
                                        <div
                                            key={tool.Query}
                                            className={`tool-item ${currentTool === tool.Query ? "active" : ""}`}
                                            onClick={() => {
                                                if (currentTool !== tool.Query) {
                                                    router.push(`/Tools/${tool.Query}`);
                                                    setIsOpen(false);
                                                }
                                            }}
                                        >
                                            <div className="tool-icon">
                                                {tool.Icon}
                                            </div>
                                            <span className="tool-title">{tool.Title}</span>
                                        </div>
                                        // </Tooltip>
                                    ))}
                                </div>
                            ))
                        )
                    ) : (
                        <div className="no-results">
                            <p>No tools found matching &quot;{searchQuery}&quot;</p>
                        </div>
                    )}
                </div>
                    </div>
        </>
    );
}

export default ToolNavigation;
