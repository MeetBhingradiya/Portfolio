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
import Link from 'next/link';
import "@Styles/Tools-Navigation.sass";
import { Tools, Categories } from '@Data/ToolsData.js';
import { Menu, Close, ChevronLeft, Search, Home, Star } from '@mui/icons-material';
import ToolContextMenu from './ToolContextMenu';
import Image from 'next/image';
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
} from '@mui/icons-material';

// Define the Tool type
interface Tool {
    Query: string;
    Title: string;
    Icon: React.ReactNode;
    Description?: string;
    Category: 'data' | 'color' | 'text' | 'utility' | 'security';
}

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
    
    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        toolName: string;
        toolQuery: string;
    }>({
        visible: false,
        x: 0,
        y: 0,
        toolName: '',
        toolQuery: ''
    });
    
    // Favorites and bookmarks state
    const [favorites, setFavorites] = useState<string[]>([]);
    const [bookmarks, setBookmarks] = useState<string[]>([]);

    // Extract the current tool from the pathname
    const currentTool = pathname.split("/").pop() || "";

    // Check if we're in the Tools section
    const isToolsSection: boolean = !pathname.split("/").pop()?.includes("Tools") as boolean

    // Load favorites and bookmarks from localStorage
    useEffect(() => {
        const storedFavorites = localStorage.getItem('toolFavorites');
        const storedBookmarks = localStorage.getItem('toolBookmarks');
        
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }
        
        if (storedBookmarks) {
            setBookmarks(JSON.parse(storedBookmarks));
        }
    }, []);
    
    // Save favorites and bookmarks to localStorage when they change
    useEffect(() => {
        localStorage.setItem('toolFavorites', JSON.stringify(favorites));
    }, [favorites]);
    
    useEffect(() => {
        localStorage.setItem('toolBookmarks', JSON.stringify(bookmarks));
    }, [bookmarks]);

    // Filter tools based on search query
    const filteredTools = Tools.filter((tool: any) =>
        tool.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tool.Description && tool.Description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Group tools by category
    const toolsByCategory = filteredTools.reduce((acc: Record<string, any[]>, tool: any) => {
        if (!acc[tool.Category]) {
            acc[tool.Category] = [];
        }
        acc[tool.Category].push(tool);
        return acc;
    }, {} as Record<string, any[]>);
    
    // Handle right-click on tool item
    const handleContextMenu = (e: React.MouseEvent, toolName: string, toolQuery: string) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            toolName,
            toolQuery
        });
    };
    
    // Close context menu
    const closeContextMenu = () => {
        setContextMenu({
            ...contextMenu,
            visible: false
        });
    };
    
    // Open tool in new tab
    const openInNewTab = () => {
        window.open(`/Tools/${contextMenu.toolQuery}`, '_blank');
        closeContextMenu();
    };
    
    // Add/remove from favorites
    const toggleFavorite = () => {
        if (favorites.includes(contextMenu.toolQuery)) {
            setFavorites(favorites.filter(query => query !== contextMenu.toolQuery));
        } else {
            setFavorites([...favorites, contextMenu.toolQuery]);
        }
        closeContextMenu();
    };
    
    // Add/remove from bookmarks
    const toggleBookmark = () => {
        if (bookmarks.includes(contextMenu.toolQuery)) {
            setBookmarks(bookmarks.filter(query => query !== contextMenu.toolQuery));
        } else {
            setBookmarks([...bookmarks, contextMenu.toolQuery]);
        }
        closeContextMenu();
    };

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

                {/* Favorites Section (if any) */}
                {favorites.length > 0 && !searchQuery && (
                    <div className="category-group">
                        <div className="category-header">
                            <div className="category-icon">
                                <Star />
                            </div>
                            <h3 className="category-title">Favorites</h3>
                        </div>
                        {Tools.filter((tool: Tool) => favorites.includes(tool.Query)).map((tool: Tool) => (
                            <div
                                key={`fav-${tool.Query}`}
                                className={`tool-item ${currentTool === tool.Query ? "active" : ""}`}
                                onClick={() => {
                                    if (currentTool !== tool.Query) {
                                        router.push(`/Tools/${tool.Query}`);
                                        setIsOpen(false);
                                    }
                                }}
                                onContextMenu={(e) => handleContextMenu(e, tool.Title, tool.Query)}
                            >
                                <div className="tool-icon">
                                    {tool.Icon}
                                </div>
                                <span className="tool-title">{tool.Title}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tools List */}
                <div className="tools-list">
                    {filteredTools.length > 0 ? (
                        searchQuery ? (
                            // When searching, show flat list
                            filteredTools.map((tool: Tool) => (
                                <div
                                    className={`tool-item ${currentTool === tool.Query ? "active" : ""}`}
                                    key={tool.Query}
                                    onClick={() => {
                                        if (currentTool !== tool.Query) {
                                            router.push(`/Tools/${tool.Query}`);
                                            setIsOpen(false);
                                        }
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, tool.Title, tool.Query)}
                                >
                                    <div className="tool-icon">
                                        {tool.Icon}
                                    </div>
                                    <span className="tool-title">{tool.Title}</span>
                                </div>
                            ))
                        ) :
                            // When not searching, group by category
                            Object.entries(toolsByCategory).map(([category, tools]: [string, any[]]) => (
                                <div key={category} className="category-group">
                                    <div className="category-header">
                                        <div className="category-icon">
                                            {Categories[category].icon}
                                        </div>
                                        <h3 className="category-title">{Categories[category].label}</h3>
                                    </div>
                                    {tools.map((tool: Tool) => (
                                        <div
                                            key={tool.Query}
                                            className={`tool-item ${currentTool === tool.Query ? "active" : ""}`}
                                            onClick={() => {
                                                if (currentTool !== tool.Query) {
                                                    router.push(`/Tools/${tool.Query}`);
                                                    setIsOpen(false);
                                                }
                                            }}
                                            onContextMenu={(e) => handleContextMenu(e, tool.Title, tool.Query)}
                                        >
                                            <div className="tool-icon">
                                                {tool.Icon}
                                            </div>
                                            <span className="tool-title">{tool.Title}</span>
                                        </div>
                                    ))}
                                </div>
                            ))
                    ) : (
                        <div className="no-results">
                            <p>No tools found matching &quot;{searchQuery}&quot;</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Context Menu */}
            {contextMenu.visible && (
                <ToolContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    toolName={contextMenu.toolName}
                    toolQuery={contextMenu.toolQuery}
                    onClose={closeContextMenu}
                    onOpenInNewTab={openInNewTab}
                    onAddToFavorites={toggleFavorite}
                    onAddToBookmarks={toggleBookmark}
                    isFavorite={favorites.includes(contextMenu.toolQuery)}
                    isBookmarked={bookmarks.includes(contextMenu.toolQuery)}
                />
            )}
        </>
    );
}

export default ToolNavigation;