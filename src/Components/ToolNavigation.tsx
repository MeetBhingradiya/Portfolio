"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Tools, Categories } from "@Data/ToolsData";
import {
    Menu,
    Close,
    Search,
    Home,
    Star,
    ChevronLeft,
    ChevronRight
} from "@mui/icons-material";

// Define the Tool type
interface Tool {
    Query: string;
    Title: string;
    Icon: React.JSX.Element;
    Description?: string;
    Category: "data" | "color" | "text" | "utility" | "security";
}

function ToolNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [width, setWidth] = useState(280);
    
    // Refs for resize functionality
    const navRef = useRef<HTMLDivElement>(null);
    const resizeRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    // Extract the current tool from the pathname
    const currentTool = pathname.split("/").pop() || "";

    // Check if we're in the Tools section
    const isToolsSection: boolean = pathname.includes("/Tools");

    // Load favorites from localStorage
    useEffect(() => {
        const storedFavorites = localStorage.getItem("toolFavorites");
        if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
        }
        
        // Load other preferences
        const savedCollapsed = localStorage.getItem("toolNavCollapsed");
        const savedHidden = localStorage.getItem("toolNavHidden");
        const savedWidth = localStorage.getItem("toolNavWidth");
        
        if (savedCollapsed) setIsCollapsed(savedCollapsed === "true");
        if (savedHidden) setIsHidden(savedHidden === "true");
        if (savedWidth) setWidth(parseInt(savedWidth));
    }, []);

    // Save favorites to localStorage when they change
    useEffect(() => {
        localStorage.setItem("toolFavorites", JSON.stringify(favorites));
    }, [favorites]);
    
    // Save preferences to localStorage
    useEffect(() => {
        localStorage.setItem("toolNavCollapsed", isCollapsed.toString());
        localStorage.setItem("toolNavHidden", isHidden.toString());
        localStorage.setItem("toolNavWidth", width.toString());
    }, [isCollapsed, isHidden, width]);

    // Check if we're on mobile
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkIfMobile();
        window.addEventListener("resize", checkIfMobile);
        return () => window.removeEventListener("resize", checkIfMobile);
    }, []);

    // Handle resize functionality
    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (isMobile || isCollapsed) return;
            
            isResizing.current = true;
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;

            // Calculate new width with limits (min 240px, max 480px)
            const newWidth = Math.max(240, Math.min(480, e.clientX));
            setWidth(newWidth);
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        const resizeHandle = resizeRef.current;
        if (resizeHandle && !isMobile) {
            resizeHandle.addEventListener("mousedown", handleMouseDown);
        }

        return () => {
            if (resizeHandle) {
                resizeHandle.removeEventListener("mousedown", handleMouseDown);
            }
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isMobile, isCollapsed]);

    // Filter tools based on search query
    const filteredTools = Tools.filter(
        (tool: any) =>
            tool.Title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (tool.Description &&
                tool.Description.toLowerCase().includes(
                    searchQuery.toLowerCase()
                ))
    );

    // Group tools by category
    const toolsByCategory = filteredTools.reduce(
        (acc: Record<string, any[]>, tool: any) => {
            if (!acc[tool.Category]) {
                acc[tool.Category] = [];
            }
            acc[tool.Category].push(tool);
            return acc;
        },
        {} as Record<string, any[]>
    );

    // Toggle favorite
    const toggleFavorite = (toolQuery: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (favorites.includes(toolQuery)) {
            setFavorites(favorites.filter((query) => query !== toolQuery));
        } else {
            setFavorites([...favorites, toolQuery]);
        }
    };

    // Navigate to tool
    const navigateToTool = (toolQuery: string) => {
        if (currentTool !== toolQuery) {
            router.push(`/Tools/${toolQuery}`);
            if (isMobile) setIsOpen(false);
        }
    };

    // If we're not in the Tools section, don't render the navigation
    if (!isToolsSection) return null;

    return (
        <>
            {/* Hide/Show Toggle Button (like ChatGPT) */}
            {!isMobile && !isHidden && (
                <button
                    className="fixed top-4 left-4 z-50 p-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg text-white hover:bg-black/30 transition-all duration-200"
                    onClick={() => setIsHidden(true)}
                    title="Hide sidebar"
                >
                    <ChevronLeft />
                </button>
            )}
            
            {/* Show Sidebar Button when hidden */}
            {!isMobile && isHidden && (
                <button
                    className="fixed top-4 left-4 z-50 p-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg text-white hover:bg-black/30 transition-all duration-200"
                    onClick={() => setIsHidden(false)}
                    title="Show sidebar"
                >
                    <ChevronRight />
                </button>
            )}

            {/* Mobile Toggle Button */}
            {isMobile && (
                <button
                    className="fixed top-4 left-4 z-50 p-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg text-white hover:bg-black/30 transition-all duration-200 md:hidden"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? "Close navigation" : "Open navigation"}
                >
                    {isOpen ? <Close /> : <Menu />}
                </button>
            )}

            {/* Navigation Sidebar */}
            <div 
                ref={navRef}
                className={`
                    fixed top-0 left-0 h-screen bg-black/20 backdrop-blur-xl border-r border-white/10 z-40 transition-all duration-300 ease-in-out flex flex-col
                    ${isMobile 
                        ? `w-80 ${isOpen ? 'translate-x-0' : '-translate-x-full'}` 
                        : isHidden 
                            ? '-translate-x-full'
                            : isCollapsed 
                                ? 'w-16 translate-x-0' 
                                : `translate-x-0`
                    }
                `}
                style={{
                    width: !isMobile && !isHidden && !isCollapsed ? `${width}px` : undefined
                }}
            >
                {/* Resize Handle */}
                {!isMobile && !isHidden && !isCollapsed && (
                    <div
                        ref={resizeRef}
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-400/50 transition-colors z-10"
                        title="Resize sidebar"
                    />
                )}

                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <Link
                            href="/"
                            className={`flex items-center gap-3 text-white hover:text-blue-400 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Home className="text-blue-400" />
                            </div>
                            {!isCollapsed && <h1 className="text-xl font-bold">Tools</h1>}
                        </Link>
                        
                        {isMobile ? (
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                            >
                                <Close />
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsCollapsed(!isCollapsed)}
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                            >
                                {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Search - Hide when collapsed */}
                {!isCollapsed && (
                    <div className="flex-shrink-0 p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                                placeholder="Search tools..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Tools List */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                    {isCollapsed ? (
                        // Collapsed view - only icons
                        <div className="space-y-2">
                            {/* Favorites in collapsed mode */}
                            {favorites.length > 0 && !searchQuery && (
                                <div className="mb-4">
                                    <div className="p-2 text-center">
                                        <Star className="text-yellow-400 text-lg mx-auto" />
                                    </div>
                                    {Tools.filter((tool: any) => favorites.includes(tool.Query)).map((tool: any) => (
                                        <div
                                            key={`fav-${tool.Query}`}
                                            onClick={() => navigateToTool(tool.Query)}
                                            className={`
                                                group flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1
                                                ${currentTool === tool.Query 
                                                    ? 'bg-blue-500/20 border border-blue-400/30 text-white' 
                                                    : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                                }
                                            `}
                                            title={tool.Title}
                                        >
                                            {tool.Icon}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* All tools in collapsed mode */}
                            {Object.entries(toolsByCategory).map(([category, tools]: [string, any[]]) => (
                                <div key={category} className="mb-4">
                                    <div className="p-2 text-center border-b border-white/10 mb-2">
                                        <div className="text-lg" title={Categories[category as keyof typeof Categories]?.label}>
                                            {Categories[category as keyof typeof Categories]?.icon}
                                        </div>
                                    </div>
                                    {tools.map((tool: Tool) => (
                                        <div
                                            key={tool.Query}
                                            onClick={() => navigateToTool(tool.Query)}
                                            className={`
                                                group flex items-center justify-center p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1
                                                ${currentTool === tool.Query 
                                                    ? 'bg-blue-500/20 border border-blue-400/30 text-white' 
                                                    : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                                }
                                            `}
                                            title={tool.Title}
                                        >
                                            {tool.Icon}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Expanded view - full content
                        <>
                            {/* Favorites Section */}
                            {favorites.length > 0 && !searchQuery && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-300 mb-2">
                                        <Star className="text-yellow-400 text-lg" />
                                        <span>Favorites</span>
                                    </div>
                                    <div className="space-y-1">
                                        {Tools.filter((tool: any) => favorites.includes(tool.Query)).map((tool: any) => (
                                            <div
                                                key={`fav-${tool.Query}`}
                                                onClick={() => navigateToTool(tool.Query)}
                                                className={`
                                                    group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200
                                                    ${currentTool === tool.Query 
                                                        ? 'bg-blue-500/20 border border-blue-400/30 text-white' 
                                                        : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    p-2 rounded-lg transition-colors
                                                    ${currentTool === tool.Query ? 'bg-blue-500/20' : 'bg-white/5 group-hover:bg-white/10'}
                                                `}>
                                                    {tool.Icon}
                                                </div>
                                                <span className="flex-1 font-medium">{tool.Title}</span>
                                                <button
                                                    onClick={(e) => toggleFavorite(tool.Query, e)}
                                                    className="p-1 text-yellow-400 hover:text-yellow-300 transition-colors"
                                                >
                                                    <Star fontSize="small" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Tools */}
                            {filteredTools.length > 0 ? (
                                searchQuery ? (
                                    // Search Results - Flat List
                                    <div className="space-y-1">
                                        {filteredTools.map((tool: any) => (
                                            <div
                                                key={tool.Query}
                                                onClick={() => navigateToTool(tool.Query)}
                                                className={`
                                                    group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200
                                                    ${currentTool === tool.Query 
                                                        ? 'bg-blue-500/20 border border-blue-400/30 text-white' 
                                                        : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    p-2 rounded-lg transition-colors
                                                    ${currentTool === tool.Query ? 'bg-blue-500/20' : 'bg-white/5 group-hover:bg-white/10'}
                                                `}>
                                                    {tool.Icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">{tool.Title}</div>
                                                    {tool.Description && (
                                                        <div className="text-xs text-gray-400 mt-1">{tool.Description}</div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => toggleFavorite(tool.Query, e)}
                                                    className={`
                                                        p-1 transition-colors
                                                        ${favorites.includes(tool.Query) 
                                                            ? 'text-yellow-400 hover:text-yellow-300' 
                                                            : 'text-gray-500 hover:text-yellow-400'
                                                        }
                                                    `}
                                                >
                                                    <Star fontSize="small" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    // Grouped by Category
                                    <div className="space-y-6">
                                        {Object.entries(toolsByCategory).map(([category, tools]: [string, any[]]) => (
                                            <div key={category}>
                                                <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-300 mb-2">
                                                    <div className="text-lg">
                                                        {Categories[category as keyof typeof Categories]?.icon}
                                                    </div>
                                                    <span>{Categories[category as keyof typeof Categories]?.label}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {tools.map((tool: Tool) => (
                                                        <div
                                                            key={tool.Query}
                                                            onClick={() => navigateToTool(tool.Query)}
                                                            className={`
                                                                group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200
                                                                ${currentTool === tool.Query 
                                                                    ? 'bg-blue-500/20 border border-blue-400/30 text-white' 
                                                                    : 'hover:bg-white/5 text-gray-300 hover:text-white'
                                                                }
                                                            `}
                                                        >
                                                            <div className={`
                                                                p-2 rounded-lg transition-colors
                                                                ${currentTool === tool.Query ? 'bg-blue-500/20' : 'bg-white/5 group-hover:bg-white/10'}
                                                            `}>
                                                                {tool.Icon}
                                                            </div>
                                                            <span className="flex-1 font-medium">{tool.Title}</span>
                                                            <button
                                                                onClick={(e) => toggleFavorite(tool.Query, e)}
                                                                className={`
                                                                    p-1 transition-colors
                                                                    ${favorites.includes(tool.Query) 
                                                                        ? 'text-yellow-400 hover:text-yellow-300' 
                                                                        : 'text-gray-500 hover:text-yellow-400 opacity-0 group-hover:opacity-100'
                                                                    }
                                                                `}
                                                            >
                                                                <Star fontSize="small" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Search className="mx-auto text-4xl mb-2 opacity-50" />
                                    <p>No tools found matching &quot;{searchQuery}&quot;</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Overlay for mobile */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}

export default ToolNavigation;
