import React from "react";
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography, Divider } from "@mui/material";
import { 
    Dashboard, 
    Analytics, 
    People, 
    Security, 
    Article, 
    Settings,
    BugReport,
    Timeline
} from "@mui/icons-material";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const drawerWidth = 260;

interface AdminLayoutProps {
    children: React.ReactNode;
}

const adminMenuItems = [
    { text: "Dashboard", href: "/admin", icon: <Dashboard /> },
    { text: "Analytics", href: "/admin/analytics", icon: <Analytics /> },
    { text: "Users", href: "/admin/users", icon: <People /> },
    { text: "Security", href: "/admin/security", icon: <Security /> },
    { text: "Blog", href: "/admin/blog", icon: <Article /> },
    { text: "Settings", href: "/admin/settings", icon: <Settings /> },
    { text: "Trace Analytics", href: "/admin/trace-analytics", icon: <Timeline /> },
    { text: "Trace Reports", href: "/admin/trace-reports", icon: <BugReport /> },
];

export default async function AdminLayout({ children }: AdminLayoutProps) {
    const session = await auth();

    if (!session?.user?.isAdmin) {
        redirect("/auth/signin");
    }

    return (
        <Box sx={{ display: "flex" }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { 
                        width: drawerWidth, 
                        boxSizing: "border-box",
                        backgroundColor: "background.paper",
                        borderRight: 1,
                        borderColor: "divider"
                    },
                }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        Admin Panel
                    </Typography>
                </Toolbar>
                <Divider />
                <List>
                    {adminMenuItems.map((item) => (
                        <ListItem 
                            key={item.text}
                            component={Link}
                            href={item.href}
                            sx={{
                                color: "inherit",
                                textDecoration: "none",
                                "&:hover": {
                                    backgroundColor: "action.hover"
                                }
                            }}
                        >
                            <ListItemIcon>
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Box
                component="main"
                sx={{ 
                    flexGrow: 1, 
                    bgcolor: "background.default",
                    minHeight: "100vh"
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}
