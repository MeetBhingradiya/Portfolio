"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Home as HomeIcon, 
    ContactMail, 
    Work, 
    Person, 
    Menu,
    Close,
    DarkMode,
    LightMode,
    Brightness6
} from '@mui/icons-material';
import { useTheme } from '@Hooks/useTheme';
import "@Styles/Header.sass";

interface NavLink {
    href: string;
    label: string;
    icon: React.ReactNode;
    isExternal?: boolean;
}

function Header() {
    const pathname = usePathname();
    const { theme, toggleTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);    // Navigation links
    const navLinks: NavLink[] = [
        { href: '/Home', label: 'Home', icon: <HomeIcon /> },
        { href: '/contact', label: 'Contact', icon: <ContactMail /> },
        { href: '/Tools', label: 'Tools', icon: <Work /> },
        { href: '/about', label: 'About', icon: <Person /> },
    ];

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const getThemeIcon = () => {
        switch (theme) {
            case 'light':
                return <LightMode />;
            case 'dark':
                return <DarkMode />;
            default:
                return <Brightness6 />;
        }
    };

    return (
        <motion.header
            className={`Header ${isScrolled ? 'scrolled' : ''}`}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="Warp">
                {/* Brand */}
                <motion.div 
                    className="Brand"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Link href="/Home" className="brand-link">
                        <div className="Icon">
                            <img src="/favicon.ico" alt="Meet Bhingradiya" />
                        </div>
                        <span className="brand-text">Meet</span>
                    </Link>
                </motion.div>

                {/* Desktop Navigation */}
                <nav className="QuickLinks desktop-nav">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href || 
                                       (link.href === '/Home' && pathname === '/') ||
                                       (pathname.startsWith(link.href) && link.href !== '/Home');
                        
                        return (
                            <motion.div
                                key={link.href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                whileHover={{ y: -2 }}
                                whileTap={{ y: 0 }}
                            >
                                <Link href={link.href} className="nav-link">
                                    <span className="nav-icon">{link.icon}</span>
                                    <span className="nav-label">{link.label}</span>
                                    {isActive && (
                                        <motion.div
                                            className="active-indicator"
                                            layoutId="activeIndicator"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            </motion.div>
                        );
                    })}
                    
                    {/* Theme Toggle */}
                    <motion.button
                        className="theme-toggle"
                        onClick={toggleTheme}
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        title={`Switch to ${theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'} mode`}
                    >
                        {getThemeIcon()}
                    </motion.button>
                </nav>

                {/* Mobile Menu Button */}
                <motion.button
                    className="mobile-menu-toggle"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    whileTap={{ scale: 0.9 }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isMobileMenuOpen ? 'close' : 'menu'}
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {isMobileMenuOpen ? <Close /> : <Menu />}
                        </motion.div>
                    </AnimatePresence>
                </motion.button>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className="mobile-nav"
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            <nav className="mobile-nav-content">
                                {navLinks.map((link, index) => {
                                    const isActive = pathname === link.href || 
                                                   (link.href === '/Home' && pathname === '/') ||
                                                   (pathname.startsWith(link.href) && link.href !== '/Home');
                                    
                                    return (
                                        <motion.div
                                            key={link.href}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                                        >
                                            <Link href={link.href} className="mobile-nav-link">
                                                <span className="mobile-nav-icon">{link.icon}</span>
                                                <span className="mobile-nav-label">{link.label}</span>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                                
                                {/* Mobile Theme Toggle */}
                                <motion.button
                                    className="mobile-theme-toggle"
                                    onClick={toggleTheme}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: navLinks.length * 0.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="mobile-nav-icon">{getThemeIcon()}</span>
                                    <span className="mobile-nav-label">
                                        {theme === 'dark' ? 'Light Mode' : theme === 'light' ? 'Auto Mode' : 'Dark Mode'}
                                    </span>
                                </motion.button>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Mobile menu backdrop */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        className="mobile-menu-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>
        </motion.header>
    );
}

export default Header