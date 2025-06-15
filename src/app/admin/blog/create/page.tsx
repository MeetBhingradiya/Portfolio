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
    Card,
    CardContent,
    Stack,
    AppBar,
    Toolbar,
    IconButton,
    Switch,
    FormControlLabel,
    Autocomplete,
    Divider
} from "@mui/material";
import {
    Save,
    Publish,
    Preview,
    ArrowBack,
    Add,
    Image,
    Code,
    FormatBold,
    FormatItalic,
    FormatListBulleted,
    FormatListNumbered,
    Link as LinkIcon,
    Article,
    Visibility,
    Public,
    Lock,
    VisibilityOff,
    CloudUpload,
    Delete
} from "@mui/icons-material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Axios } from "@Utils/Axios";
import { useRouter } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import dynamic from 'next/dynamic';

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(
    () => import('@uiw/react-md-editor').then((mod) => mod.default),
    { ssr: false }
);

// Import the GitHub theme for consistency
const githubTheme = createTheme({
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
        success: {
            main: '#1a7f37',
            light: '#2da44e',
            dark: '#0f5132',
        },
        warning: {
            main: '#fb8500',
            light: '#ffb700',
            dark: '#e85d00',
        },
        error: {
            main: '#da3633',
            light: '#ff6b6b',
            dark: '#b91c1c',
        },
        background: {
            default: '#f6f8fa',
            paper: '#ffffff',
        },
        text: {
            primary: '#24292f',
            secondary: '#656d76',
        },
        divider: '#d1d9e0',
    },
    shape: {
        borderRadius: 8,
    },
    typography: {
        fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #d1d9e0',
                    borderRadius: '12px',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 500,
                },
            },
        },
    },
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

interface CreateBlogState {
    form: BlogForm;
    loading: boolean;
    saving: boolean;
    error: string;
    success: string;
    previewMode: boolean;
}

// Common blog tags for suggestions
const COMMON_TAGS = [
    'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
    'Security', 'Automation', 'AI', 'Machine Learning', 'DevOps', 'AWS',
    'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'Database', 'MongoDB',
    'PostgreSQL', 'Redis', 'Performance', 'Optimization', 'Testing',
    'CI/CD', 'Git', 'Open Source', 'Career', 'Learning', 'Tutorial',
    'Best Practices', 'Architecture', 'Microservices', 'Serverless',
    'Frontend', 'Backend', 'Full Stack', 'Web Development', 'Mobile',
    'iOS', 'Android', 'Flutter', 'React Native', 'UI/UX', 'Design'
];

export default function CreateBlogPage() {
    const router = useRouter();
    const { currentAccount } = useAccountSwitcher();
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [state, setState] = useState<CreateBlogState>({
        form: {
            title: '',
            description: '',
            content: '# Your Blog Title\n\nStart writing your amazing content here...\n\n## Introduction\n\nWrite your introduction here.\n\n## Main Content\n\n### Subsection\n\nAdd your detailed content with:\n- Code examples\n- Images\n- Links\n- Lists\n\n```javascript\n// Example code block\nconst example = "Hello World";\nconsole.log(example);\n```\n\n## Conclusion\n\nSummarize your key points here.',
            tags: [],
            bannerImage: '',
            visibility: 'public',
            isPublished: false
        },
        loading: false,
        saving: false,
        error: '',
        success: '',
        previewMode: false
    });

    useEffect(() => {
        // Set initial loading to false after a brief delay to allow account switcher to load
        const timer = setTimeout(() => {
            setIsInitialLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Don't check authentication until initial loading is complete
        if (isInitialLoading) return;

        // Check if user is authenticated (both account and token must exist)
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
    }, [currentAccount, router, isInitialLoading]);

    const handleInputChange = (field: keyof BlogForm, value: any) => {
        setState(prev => ({
            ...prev,
            form: { ...prev.form, [field]: value },
            error: '',
            success: ''
        }));
    };

    const handleTagsChange = (event: any, newValue: string[]) => {
        // Limit to 10 tags
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

        if (state.form.description.length > 500) {
            setState(prev => ({ ...prev, error: 'Description must be less than 500 characters' }));
            return false;
        }

        return true;
    };

    const saveBlog = async (publish: boolean = false) => {
        if (!validateForm()) return;

        setState(prev => ({ ...prev, saving: true, error: '', success: '' }));

        try {
            const blogData = {
                ...state.form,
                isPublished: publish
            };

            const response = await Axios.post('/api/blog', blogData, {
                headers: {
                    Authorization: `Bearer ${currentAccount?.encryptedToken}`
                }
            });

            if (response.data.Status === 1) {
                setState(prev => ({
                    ...prev,
                    success: publish 
                        ? 'Blog published successfully!' 
                        : 'Blog saved as draft successfully!',
                    saving: false
                }));

                // Redirect to blog list after a short delay
                setTimeout(() => {
                    router.push('/admin/blog');
                }, 2000);
            } else {
                setState(prev => ({
                    ...prev,
                    error: response.data.Message || 'Failed to save blog',
                    saving: false
                }));
            }
        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error?.response?.data?.Message || 'Failed to save blog',
                saving: false
            }));
        }
    };

    const handleImageUpload = async (file: File) => {
        // This would integrate with your image upload service (Cloudinary, AWS S3, etc.)
        // For now, we'll show a placeholder
        const imageUrl = `https://via.placeholder.com/800x400?text=${encodeURIComponent(file.name)}`;
        
        // Insert image markdown into content
        const imageMarkdown = `\n![${file.name}](${imageUrl})\n`;
        const newContent = state.form.content + imageMarkdown;
        handleInputChange('content', newContent);
    };

    if (!currentAccount) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
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
                                    Create New Blog
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Write and publish your content
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

                            {/* Save Draft */}
                            <Button
                                variant="outlined"
                                startIcon={<Save />}
                                onClick={() => saveBlog(false)}
                                disabled={state.saving}
                                size="small"
                            >
                                Save Draft
                            </Button>

                            {/* Publish */}
                            <Button
                                variant="contained"
                                startIcon={<Publish />}
                                onClick={() => saveBlog(true)}
                                disabled={state.saving}
                                size="small"
                            >
                                {state.saving ? 'Publishing...' : 'Publish'}
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
                                            InputProps={{
                                                endAdornment: (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<CloudUpload />}
                                                        sx={{ ml: 1 }}
                                                    >
                                                        Upload
                                                    </Button>
                                                )
                                            }}
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

                            {/* Sidebar */}
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

                                        {/* Publish Status */}
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={state.form.isPublished}
                                                    onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                                                />
                                            }
                                            label="Publish immediately"
                                        />
                                    </Stack>
                                </Paper>

                                {/* Writing Tips */}
                                <Paper sx={{ p: 3 }}>
                                    <Typography variant="h6" gutterBottom fontWeight="bold">
                                        Writing Tips
                                    </Typography>
                                    
                                    <Stack spacing={1}>
                                        <Typography variant="body2" color="text.secondary">
                                            • Use clear, descriptive headings
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • Include code examples where relevant
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • Add images to break up text
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • Use bullet points for readability
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            • Keep paragraphs concise
                                        </Typography>
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
                                            meetbhingradiya.vercel.app/blog/...
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