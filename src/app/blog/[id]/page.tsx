"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Box,
    Typography,
    Container,
    Chip,
    Avatar,
    IconButton,
    Tooltip,
    Divider,
    Card,
    CardContent,
    GridLegacy as Grid,
    Button,
    CircularProgress,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from "@mui/material";
import {
    CalendarToday,
    Person,
    Visibility,
    TrendingUp,
    Share,
    Bookmark,
    BookmarkBorder,
    ThumbUp,
    ThumbUpOutlined,
    Twitter,
    LinkedIn,
    Facebook,
    Link as LinkIcon,
    AccessTime,
    ArrowBack,
    Article,
    Tag,
    Schedule
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Axios } from "@Utils/Axios";
import { useRouter, useParams } from "next/navigation";
import Header from "@Components/Header";
import LandingFooter from "@Components/Footer/LandingFooter";
import dynamic from 'next/dynamic';

// Dynamically import markdown preview to avoid SSR issues
const MarkdownPreview = dynamic(
    () => import('@uiw/react-markdown-preview').then((mod) => mod.default),
    { ssr: false }
);

// Same theme as blog listing
const blogTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#0969da',
            light: '#54aeff',
            dark: '#0550ae',
        },
        secondary: {
            main: '#8250df',
            light: '#a475f9',
            dark: '#6f42c1',
        },
        background: {
            default: '#ffffff',
            paper: '#f6f8fa',
        },
        text: {
            primary: '#24292f',
            secondary: '#656d76',
        },
    },
    typography: {
        fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
        h1: {
            fontWeight: 800,
            fontSize: '2.5rem',
            lineHeight: 1.2,
        },
        h2: {
            fontWeight: 700,
            fontSize: '2rem',
            lineHeight: 1.3,
        },
        body1: {
            fontSize: '1.125rem',
            lineHeight: 1.7,
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '12px',
                    border: '1px solid #d1d9e0',
                },
            },
        },
    },
});

interface Blog {
    BlogID: string;
    Title: string;
    Description: string;
    Tags: string[];
    BannerImage?: string;
    Views: number;
    Likes: number;
    LikedBy: string[];
    content: string;
    author?: {
        userID: string;
        username: string;
        name: string;
        icon?: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface BlogState {
    blog: Blog | null;
    loading: boolean;
    error: string;
    isLiked: boolean;
    isBookmarked: boolean;
    relatedBlogs: Blog[];
    tableOfContents: Array<{
        id: string;
        text: string;
        level: number;
    }>;
}

export default function BlogPostPage() {
    const router = useRouter();
    const params = useParams();
    const blogId = params.id as string;
    
    const [blogState, setBlogState] = useState<BlogState>({
        blog: null,
        loading: true,
        error: '',
        isLiked: false,
        isBookmarked: false,
        relatedBlogs: [],
        tableOfContents: []
    });

    useEffect(() => {
        if (blogId) {
            loadBlog();
        }
    }, [blogId]);

    useEffect(() => {
        if (blogState.blog) {
            generateTableOfContents();
            loadRelatedBlogs();
        }
    }, [blogState.blog]);

    const loadBlog = async () => {
        setBlogState(prev => ({ ...prev, loading: true, error: '' }));
        
        try {
            const response = await Axios.get(`/api/blog/${blogId}`);

            if (response.data.Status === 1) {
                const blog = response.data.Data.blog;
                setBlogState(prev => ({
                    ...prev,
                    blog,
                    loading: false,
                    // Check if user has liked/bookmarked (would need user context)
                    isLiked: false, // TODO: Check user's liked blogs
                    isBookmarked: false // TODO: Check user's bookmarked blogs
                }));
            } else {
                setBlogState(prev => ({
                    ...prev,
                    error: 'Blog not found',
                    loading: false
                }));
            }
        } catch (error: any) {
            setBlogState(prev => ({
                ...prev,
                error: 'Failed to load blog',
                loading: false
            }));
        }
    };

    const loadRelatedBlogs = async () => {
        if (!blogState.blog?.Tags?.length) return;

        try {
            // Find blogs with similar tags
            const response = await Axios.get(`/api/blog?tags=${blogState.blog.Tags[0]}&limit=3`);
            
            if (response.data.Status === 1) {
                const related = response.data.Data.blogs
                    .filter((blog: Blog) => blog.BlogID !== blogId)
                    .slice(0, 3);
                    
                setBlogState(prev => ({
                    ...prev,
                    relatedBlogs: related
                }));
            }
        } catch (error) {
            console.warn('Failed to load related blogs');
        }
    };

    const generateTableOfContents = () => {
        if (!blogState.blog?.content) return;

        const headings: Array<{ id: string; text: string; level: number }> = [];
        const lines = blogState.blog.content.split('\n');
        
        lines.forEach((line, index) => {
            const match = line.match(/^(#{1,6})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const text = match[2];
                const id = `heading-${index}`;
                headings.push({ id, text, level });
            }
        });

        setBlogState(prev => ({
            ...prev,
            tableOfContents: headings
        }));
    };

    const handleLike = async () => {
        // TODO: Implement like functionality with user authentication
        setBlogState(prev => ({
            ...prev,
            isLiked: !prev.isLiked,
            blog: prev.blog ? {
                ...prev.blog,
                Likes: prev.isLiked ? prev.blog.Likes - 1 : prev.blog.Likes + 1
            } : null
        }));
    };

    const handleBookmark = async () => {
        // TODO: Implement bookmark functionality with user authentication
        setBlogState(prev => ({
            ...prev,
            isBookmarked: !prev.isBookmarked
        }));
    };

    const handleShare = (platform: string) => {
        const url = window.location.href;
        const title = blogState.blog?.Title || '';
        
        let shareUrl = '';
        
        switch (platform) {
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(url);
                return;
        }
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatViews = (views: number) => {
        if (views >= 1000) {
            return `${(views / 1000).toFixed(1)}k`;
        }
        return views.toString();
    };

    const calculateReadTime = (content: string) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / wordsPerMinute);
        return readTime;
    };

    if (blogState.loading) {
        return (
            <ThemeProvider theme={blogTheme}>
                <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                    <Header />
                    <Container maxWidth="lg" sx={{ py: 8 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                            <CircularProgress size={48} />
                        </Box>
                    </Container>
                </Box>
            </ThemeProvider>
        );
    }

    if (blogState.error || !blogState.blog) {
        return (
            <ThemeProvider theme={blogTheme}>
                <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                    <Header />
                    <Container maxWidth="lg" sx={{ py: 8 }}>
                        <Alert severity="error" sx={{ mb: 4 }}>
                            {blogState.error}
                        </Alert>
                        <Button 
                            startIcon={<ArrowBack />} 
                            onClick={() => router.push('/blog')}
                        >
                            Back to Blog
                        </Button>
                    </Container>
                </Box>
            </ThemeProvider>
        );
    }

    const { blog } = blogState;

    return (
        <ThemeProvider theme={blogTheme}>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                <Header />

                {/* Banner Image */}
                {blog.BannerImage && (
                    <Box sx={{ 
                        height: 400, 
                        backgroundImage: `url(${blog.BannerImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                    }}>
                        <Box sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))'
                        }} />
                    </Box>
                )}

                <Container maxWidth="lg" sx={{ py: 4 }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Back Button */}
                        <Button 
                            startIcon={<ArrowBack />} 
                            onClick={() => router.push('/blog')}
                            sx={{ mb: 3 }}
                        >
                            Back to Blog
                        </Button>

                        <Grid container spacing={4}>
                            {/* Main Content */}
                            <Grid item xs={12} lg={8}>
                                <Paper sx={{ p: 4, borderRadius: 3 }}>
                                    {/* Article Header */}
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="h1" gutterBottom>
                                            {blog.Title}
                                        </Typography>
                                        
                                        {blog.Description && (
                                            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                                                {blog.Description}
                                            </Typography>
                                        )}

                                        {/* Tags */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                            {blog.Tags?.map((tag) => (
                                                <Chip
                                                    key={tag}
                                                    label={tag}
                                                    variant="outlined"
                                                    size="small"
                                                    onClick={() => router.push(`/blog?tag=${tag}`)}
                                                    sx={{ cursor: 'pointer' }}
                                                />
                                            ))}
                                        </Box>

                                        {/* Author & Meta Info */}
                                        <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 2,
                                            p: 2,
                                            bgcolor: 'background.paper',
                                            borderRadius: 2
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 48, height: 48 }}>
                                                    {blog.author?.name?.charAt(0) || 'M'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {blog.author?.name || 'Meet Bhingradiya'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        @{blog.author?.username || 'MeetBhingradiya'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CalendarToday sx={{ fontSize: 16 }} />
                                                    <Typography variant="caption">
                                                        {formatDate(blog.createdAt)}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTime sx={{ fontSize: 16 }} />
                                                    <Typography variant="caption">
                                                        {calculateReadTime(blog.content)} min read
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Visibility sx={{ fontSize: 16 }} />
                                                    <Typography variant="caption">
                                                        {formatViews(blog.Views)} views
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ mb: 4 }} />

                                    {/* Article Content */}
                                    <Box sx={{ 
                                        '& h1, & h2, & h3, & h4, & h5, & h6': {
                                            mt: 3,
                                            mb: 2,
                                            fontWeight: 'bold'
                                        },
                                        '& p': {
                                            mb: 2,
                                            lineHeight: 1.7
                                        },
                                        '& pre': {
                                            borderRadius: 2,
                                            overflow: 'auto'
                                        },
                                        '& img': {
                                            maxWidth: '100%',
                                            height: 'auto',
                                            borderRadius: 2
                                        },
                                        '& blockquote': {
                                            borderLeft: '4px solid',
                                            borderColor: 'primary.main',
                                            pl: 2,
                                            ml: 0,
                                            fontStyle: 'italic'
                                        }
                                    }}>
                                        <MarkdownPreview 
                                            source={blog.content}
                                            data-color-mode="light"
                                        />
                                    </Box>

                                    <Divider sx={{ my: 4 }} />

                                    {/* Article Actions */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title={blogState.isLiked ? "Unlike" : "Like"}>
                                                <IconButton onClick={handleLike} color={blogState.isLiked ? "primary" : "default"}>
                                                    {blogState.isLiked ? <ThumbUp /> : <ThumbUpOutlined />}
                                                </IconButton>
                                            </Tooltip>
                                            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                                                {blog.Likes}
                                            </Typography>

                                            <Tooltip title={blogState.isBookmarked ? "Remove bookmark" : "Bookmark"}>
                                                <IconButton onClick={handleBookmark} color={blogState.isBookmarked ? "primary" : "default"}>
                                                    {blogState.isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Tooltip title="Share on Twitter">
                                                <IconButton onClick={() => handleShare('twitter')}>
                                                    <Twitter />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Share on LinkedIn">
                                                <IconButton onClick={() => handleShare('linkedin')}>
                                                    <LinkedIn />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Share on Facebook">
                                                <IconButton onClick={() => handleShare('facebook')}>
                                                    <Facebook />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Copy link">
                                                <IconButton onClick={() => handleShare('copy')}>
                                                    <LinkIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Sidebar */}
                            <Grid item xs={12} lg={4}>
                                <Box sx={{ position: 'sticky', top: 20 }}>
                                    {/* Table of Contents */}
                                    {blogState.tableOfContents.length > 0 && (
                                        <Card sx={{ mb: 3 }}>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                                    Table of Contents
                                                </Typography>
                                                <List dense>
                                                    {blogState.tableOfContents.map((heading) => (
                                                        <ListItem 
                                                            key={heading.id}
                                                            sx={{ 
                                                                pl: heading.level * 2,
                                                                cursor: 'pointer',
                                                                '&:hover': { bgcolor: 'action.hover' }
                                                            }}
                                                            onClick={() => {
                                                                const element = document.getElementById(heading.id);
                                                                element?.scrollIntoView({ behavior: 'smooth' });
                                                            }}
                                                        >
                                                            <ListItemText 
                                                                primary={heading.text}
                                                                primaryTypographyProps={{
                                                                    variant: heading.level <= 2 ? 'body2' : 'caption',
                                                                    fontWeight: heading.level <= 2 ? 'bold' : 'normal'
                                                                }}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Related Blogs */}
                                    {blogState.relatedBlogs.length > 0 && (
                                        <Card>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom fontWeight="bold">
                                                    Related Posts
                                                </Typography>
                                                {blogState.relatedBlogs.map((relatedBlog) => (
                                                    <Box 
                                                        key={relatedBlog.BlogID}
                                                        sx={{ 
                                                            mb: 2, 
                                                            pb: 2, 
                                                            borderBottom: '1px solid',
                                                            borderColor: 'divider',
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: 'action.hover' },
                                                            '&:last-child': { borderBottom: 'none', mb: 0, pb: 0 }
                                                        }}
                                                        onClick={() => router.push(`/blog/${relatedBlog.BlogID}`)}
                                                    >
                                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                                            {relatedBlog.Title}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatDate(relatedBlog.createdAt)} • {formatViews(relatedBlog.Views)} views
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </CardContent>
                                        </Card>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </motion.div>
                </Container>

                <LandingFooter />
            </Box>
        </ThemeProvider>
    );
}