"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Chip,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    CircularProgress,
    Stack,
    AppBar,
    Toolbar,
    IconButton,
    Switch,
    FormControlLabel,
    Autocomplete,
} from "@mui/material";
import {
    Save,
    Publish,
    ArrowBack,
    Article,
    Public,
    Lock,
    VisibilityOff,
    CloudUpload,
    UnpublishedOutlined
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Axios } from "@Utils/Axios";
import { useRouter, useParams } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import dynamic from 'next/dynamic';

const MDEditor = dynamic(
    () => import('@uiw/react-md-editor').then((mod) => mod.default),
    { ssr: false }
);

// Same theme as create page
const githubTheme = createTheme({
    // ... same theme configuration as create page
});

interface BlogForm {
    title: string;
    description: string;
    content: string;
    tags: string[];
    bannerImage: string;
    visibility: 'public' | 'private' | 'unlisted';
    isPublished: boolean;
}

interface EditBlogState {
    form: BlogForm;
    loading: boolean;
    saving: boolean;
    error: string;
    success: string;
    previewMode: boolean;
    blogExists: boolean;
}

const COMMON_TAGS = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
    'Security', 'Automation', 'AI', 'Machine Learning', 'DevOps', 'AWS',
    // ... rest of tags
];

export default function EditBlogPage() {
    const router = useRouter();
    const params = useParams();
    const { currentAccount } = useAccountSwitcher();
    const blogId = params.id as string;
    
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [state, setState] = useState<EditBlogState>({
        form: {
            title: '',
            description: '',
            content: '',
            tags: [],
            bannerImage: '',
            visibility: 'public',
            isPublished: false
        },
        loading: true,
        saving: false,
        error: '',
        success: '',
        previewMode: false,
        blogExists: false
    });

    useEffect(() => {
        // Allow time for account switcher to load
        const timer = setTimeout(() => {
            setIsInitialLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isInitialLoading) return;

        // Check authentication - require both currentAccount and auth-token
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
        
        if (!currentAccount || !authToken) {
            router.push('/auth/signin');
            return;
        }

        // Check admin permissions
        if (!currentAccount.profileData.isAdmin) {
            router.push('/dashboard');
            return;
        }

        loadBlog();
    }, [currentAccount, router, blogId, isInitialLoading]);

    const loadBlog = async () => {
        if (!blogId) {
            setState(prev => ({ ...prev, error: 'Blog ID is required', loading: false }));
            return;
        }

        try {
            const response = await Axios.get(`/api/blog/${blogId}`, {
                headers: {
                    Authorization: `Bearer ${currentAccount?.encryptedToken}`
                }
            });

            if (response.data.Status === 1) {
                const blog = response.data.Data.blog;
                setState(prev => ({
                    ...prev,
                    form: {
                        title: blog.Title,
                        description: blog.Description || '',
                        content: blog.content,
                        tags: blog.Tags || [],
                        bannerImage: blog.BannerImage || '',
                        visibility: blog.Visiblity,
                        isPublished: blog.isPublished
                    },
                    blogExists: true,
                    loading: false
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    error: 'Blog not found',
                    loading: false
                }));
            }
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error?.response?.data?.Message || 'Failed to load blog',
                loading: false
            }));
        }
    };

    const handleInputChange = (field: keyof BlogForm, value: any) => {
        setState(prev => ({
            ...prev,
            form: { ...prev.form, [field]: value },
            error: '',
            success: ''
        }));
    };

    const handleTagsChange = (event: any, newValue: string[]) => {
        if (newValue.length <= 10) {
            handleInputChange('tags', newValue);
        }
    };

    const validateForm = (): boolean => {
        if (!state.form.title.trim()) {
            setState(prev => ({ ...prev, error: 'Title is required' }));
            return false;
        }

        if (state.form.title.length > 200) {
            setState(prev => ({ ...prev, error: 'Title must be less than 200 characters' }));
            return false;
        }

        if (!state.form.content.trim()) {
            setState(prev => ({ ...prev, error: 'Content is required' }));
            return false;
        }

        if (state.form.content.length < 100) {
            setState(prev => ({ ...prev, error: 'Content must be at least 100 characters' }));
            return false;
        }

        return true;
    };

    const updateBlog = async (publish?: boolean) => {
        if (!validateForm()) return;

        setState(prev => ({ ...prev, saving: true, error: '', success: '' }));

        try {
            const blogData = {
                ...state.form,
                isPublished: publish !== undefined ? publish : state.form.isPublished
            };

            const response = await Axios.put(`/api/blog/${blogId}`, blogData, {
                headers: {
                    Authorization: `Bearer ${currentAccount?.encryptedToken}`
                }
            });

            if (response.data.Status === 1) {
                setState(prev => ({
                    ...prev,
                    success: 'Blog updated successfully!',
                    saving: false,
                    form: { ...prev.form, isPublished: blogData.isPublished }
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    error: response.data.Message || 'Failed to update blog',
                    saving: false
                }));
            }
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error?.response?.data?.Message || 'Failed to update blog',
                saving: false
            }));
        }
    };

    const togglePublishStatus = async () => {
        const newStatus = !state.form.isPublished;
        await updateBlog(newStatus);
    };    if (isInitialLoading || !currentAccount) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (state.loading) {
        return (
            <ThemeProvider theme={githubTheme}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading blog...</Typography>
                </Box>
            </ThemeProvider>
        );
    }

    if (!state.blogExists) {
        return (
            <ThemeProvider theme={githubTheme}>
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                    <Typography variant="h5" gutterBottom>Blog Not Found</Typography>
                    <Button onClick={() => router.push('/admin/blog')} startIcon={<ArrowBack />}>
                        Back to Blog List
                    </Button>
                </Box>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={githubTheme}>
            <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
                {/* Top App Bar */}
                <AppBar 
                    position="static" 
                    elevation={0}
                    sx={{ 
                        bgcolor: 'background.paper', 
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        color: 'text.primary'
                    }}
                >
                    <Toolbar>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                            <IconButton
                                onClick={() => router.push('/admin/blog')}
                                color="inherit"
                            >
                                <ArrowBack />
                            </IconButton>
                            <Article sx={{ fontSize: 28, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="h6" fontWeight="bold">
                                    Edit Blog
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {state.form.title || 'Untitled Blog'}
                                </Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Preview Toggle */}
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={state.previewMode}
                                        onChange={(e) => setState(prev => ({ 
                                            ...prev, 
                                            previewMode: e.target.checked 
                                        }))}
                                        size="small"
                                    />
                                }
                                label="Preview"
                                sx={{ fontSize: '0.875rem' }}
                            />

                            {/* Save Changes */}
                            <Button
                                variant="outlined"
                                startIcon={<Save />}
                                onClick={() => updateBlog()}
                                disabled={state.saving}
                                size="small"
                            >
                                Save Changes
                            </Button>

                            {/* Publish/Unpublish Toggle */}
                            <Button
                                variant="contained"
                                startIcon={state.form.isPublished ? <UnpublishedOutlined /> : <Publish />}
                                onClick={togglePublishStatus}
                                disabled={state.saving}
                                size="small"
                                color={state.form.isPublished ? "warning" : "primary"}
                            >
                                {state.saving 
                                    ? (state.form.isPublished ? 'Unpublishing...' : 'Publishing...') 
                                    : (state.form.isPublished ? 'Unpublish' : 'Publish')
                                }
                            </Button>
                        </Box>
                    </Toolbar>
                </AppBar>

                <Box sx={{ p: 3 }}>
                    {/* Success/Error Alerts */}
                    <AnimatePresence>
                        {(state.error || state.success) && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Alert 
                                    severity={state.error ? "error" : "success"}
                                    sx={{ mb: 3, borderRadius: 2 }} 
                                    onClose={() => setState(prev => ({ ...prev, error: '', success: '' }))}
                                >
                                    {state.error || state.success}
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Same form layout as create page but with loaded data */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
                            {/* Main Content Area */}
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Blog Metadata */}
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        Blog Details
                                    </Typography>
                                    
                                    <Stack spacing={3}>
                                        {/* Title */}
                                        <TextField
                                            fullWidth
                                            label="Blog Title"
                                            placeholder="Enter your blog title..."
                                            value={state.form.title}
                                            onChange={(e) => handleInputChange('title', e.target.value)}
                                            helperText={`${state.form.title.length}/200 characters`}
                                            error={state.form.title.length > 200}
                                        />

                                        {/* Description */}
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Description (Optional)"
                                            placeholder="Brief description of your blog post..."
                                            value={state.form.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            helperText={`${state.form.description.length}/500 characters`}
                                            error={state.form.description.length > 500}
                                        />

                                        {/* Tags */}
                                        <Autocomplete
                                            multiple
                                            options={COMMON_TAGS}
                                            freeSolo
                                            value={state.form.tags}
                                            onChange={handleTagsChange}
                                            renderTags={(value, getTagProps) =>
                                                value.map((option, index) => (
                                                    <Chip
                                                        variant="outlined"
                                                        label={option}
                                                        {...getTagProps({ index })}
                                                        key={index}
                                                    />
                                                ))
                                            }
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Tags"
                                                    placeholder="Add tags..."
                                                    helperText={`${state.form.tags.length}/10 tags`}
                                                />
                                            )}
                                        />

                                        {/* Banner Image */}
                                        <TextField
                                            fullWidth
                                            label="Banner Image URL (Optional)"
                                            placeholder="https://example.com/image.jpg"
                                            value={state.form.bannerImage}
                                            onChange={(e) => handleInputChange('bannerImage', e.target.value)}
                                        />
                                    </Stack>
                                </Paper>

                                {/* Content Editor */}
                                <Paper sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        Content
                                    </Typography>
                                    
                                    <Box sx={{ flex: 1, minHeight: 400 }}>
                                        <MDEditor
                                            value={state.form.content}
                                            onChange={(val) => handleInputChange('content', val || '')}
                                            preview={state.previewMode ? 'preview' : 'edit'}
                                            height={400}
                                            data-color-mode="light"
                                        />
                                    </Box>
                                    
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                        {state.form.content.length} characters • Supports Markdown
                                    </Typography>
                                </Paper>
                            </Box>

                            {/* Sidebar - Same as create page */}
                            <Box sx={{ width: 300, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {/* Publish Settings */}
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        Publish Settings
                                    </Typography>
                                    
                                    <Stack spacing={2}>
                                        {/* Visibility */}
                                        <FormControl fullWidth>
                                            <InputLabel>Visibility</InputLabel>
                                            <Select
                                                value={state.form.visibility}
                                                label="Visibility"
                                                onChange={(e) => handleInputChange('visibility', e.target.value)}
                                            >
                                                <MenuItem value="public">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Public sx={{ fontSize: 16 }} />
                                                        Public
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="unlisted">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <VisibilityOff sx={{ fontSize: 16 }} />
                                                        Unlisted
                                                    </Box>
                                                </MenuItem>
                                                <MenuItem value="private">
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Lock sx={{ fontSize: 16 }} />
                                                        Private
                                                    </Box>
                                                </MenuItem>
                                            </Select>
                                        </FormControl>

                                        {/* Current Status */}
                                        <Box sx={{ p: 2, bgcolor: state.form.isPublished ? 'success.light' : 'warning.light', borderRadius: 1 }}>
                                            <Typography variant="body2" fontWeight="bold">
                                                Status: {state.form.isPublished ? 'Published' : 'Draft'}
                                            </Typography>
                                            <Typography variant="caption">
                                                {state.form.isPublished 
                                                    ? 'This blog is live and visible to readers'
                                                    : 'This blog is saved as a draft'
                                                }
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Paper>

                                {/* SEO Preview */}
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        SEO Preview
                                    </Typography>
                                    
                                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                                        <Typography 
                                            variant="body2" 
                                            color="primary" 
                                            sx={{ textDecoration: 'underline', mb: 0.5 }}
                                        >
                                            {state.form.title || 'Your Blog Title'}
                                        </Typography>
                                        <Typography variant="caption" color="success.main">
                                            meetbhingradiya.vercel.app/blog/{blogId}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {state.form.description || 'Blog description will appear here...'}
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        </Box>
                    </motion.div>
                </Box>
            </Box>
        </ThemeProvider>
    );
}