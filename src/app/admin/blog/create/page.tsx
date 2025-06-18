"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Textarea,
    Select,
    SelectItem,
    Switch,
    Chip,
    Spinner,
    Divider,
    Navbar,
    NavbarBrand,
    NavbarContent,
    NavbarItem,
} from "@heroui/react";
import {
    Save,
    Publish,
    ArrowBack,
    Article,
    Public,
    Lock,
    VisibilityOff,
    CloudUpload,
    Visibility
} from "@mui/icons-material";
import { Axios } from "@Utils/Axios";
import { getCSRFToken } from "@Utils";
import { useRouter } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import dynamic from 'next/dynamic';

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(
    () => import('@uiw/react-md-editor').then((mod) => mod.default),
    { ssr: false }
);

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
    isCSRFReady: boolean;
}

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
        previewMode: false,
        isCSRFReady: false
    });

    useEffect(() => {
        initializeCSRFAndLoadPage();
    }, []);

    // Initialize CSRF token before allowing any operations
    const initializeCSRFAndLoadPage = async () => {
        try {
            setIsInitialLoading(true);
            setState(prev => ({ ...prev, error: '' }));

            // Check if we have an auth token first
            const authToken = localStorage.getItem("auth-token");
            if (!authToken) {
                router.push("/auth/signin");
                return;
            }

            // Check admin permissions
            if (currentAccount && !currentAccount.isAdmin) {
                router.push("/dashboard");
                return;
            }

            // Check if CSRF token is already available
            const existingCSRF = localStorage.getItem('trace');
            if (existingCSRF) {
                try {
                    const parsedCSRF = JSON.parse(existingCSRF);
                    if (parsedCSRF?.Status === 1) {
                        setState(prev => ({ ...prev, isCSRFReady: true }));
                        setIsInitialLoading(false);
                        return;
                    }
                } catch (e) {
                    localStorage.removeItem('trace');
                }
            }

            // Get fresh CSRF token with timeout
            const csrfResponse = await Promise.race([
                getCSRFToken(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('CSRF token timeout')), 15000)
                )
            ]);

            if (csrfResponse?.Status === 1) {
                localStorage.setItem('trace', JSON.stringify(csrfResponse));
                setState(prev => ({ ...prev, isCSRFReady: true }));
            } else {
                setState(prev => ({ ...prev, error: "Failed to initialize security token. Please try again." }));
            }
        } catch (error: any) {
            console.error("CSRF initialization error:", error);
            if (error.message === 'CSRF token retrieval in progress') {
                setTimeout(() => {
                    initializeCSRFAndLoadPage();
                }, 2000);
            } else if (error.message === 'CSRF token timeout') {
                setState(prev => ({ ...prev, error: "Security token initialization timed out. Please refresh the page." }));
            } else {
                setState(prev => ({ ...prev, error: "Failed to initialize. Please try again." }));
            }
        } finally {
            setIsInitialLoading(false);
        }
    };

    // Helper function to handle CSRF token errors consistently
    const handleCSRFError = (error: any, defaultMessage: string): string => {
        if (error.message === 'CSRF token retrieval in progress') {
            return "Security token is being prepared. Please try again in a moment.";
        }
        if (error.message === 'CSRF token timeout') {
            return "Security token initialization timed out. Please refresh the page.";
        }
        if (error.message === 'CSRF token retrieval failed') {
            return "Failed to retrieve security token. Please refresh the page.";
        }
        return error?.response?.data?.Message || defaultMessage;
    };

    const handleInputChange = (field: keyof BlogForm, value: any) => {
        setState(prev => ({
            ...prev,
            form: { ...prev.form, [field]: value },
            error: '',
            success: ''
        }));
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
        if (!state.isCSRFReady) {
            setState(prev => ({ ...prev, error: "Security token not ready. Please wait..." }));
            return;
        }

        setState(prev => ({ ...prev, saving: true, error: '', success: '' }));

        try {
            const blogData = {
                ...state.form,
                isPublished: publish
            };

            const response = await Axios.post('/api/blog', blogData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth-token')}`
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
                error: handleCSRFError(error, 'Failed to save blog'),
                saving: false
            }));
        }
    };

    if (isInitialLoading || !currentAccount) {
        return (
            <div className="flex items-center justify-center min-h-screen gap-4">
                <Spinner size="lg" />
                <div className="text-center">
                    <p className="text-lg">Loading Create Blog...</p>
                    {!state.isCSRFReady && (
                        <p className="text-sm text-default-500 mt-2">
                            Initializing security tokens...
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (state.error && !state.isCSRFReady) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <div className="text-center">
                    <p className="text-lg text-danger">{state.error}</p>
                    {(state.error.includes("CSRF") || state.error.includes("Security token")) && (
                        <p className="text-sm text-default-500 mt-2">
                            This usually resolves automatically. Please wait or try again.
                        </p>
                    )}
                </div>
                <Button
                    color="primary"
                    onPress={() => initializeCSRFAndLoadPage()}
                    isLoading={isInitialLoading}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation Bar */}
            <Navbar className="border-b">
                <NavbarBrand>
                    <Button
                        isIconOnly
                        variant="light"
                        onPress={() => router.push('/admin/blog')}
                    >
                        <ArrowBack />
                    </Button>
                    <Article className="text-primary" style={{ fontSize: 28 }} />
                    <div className="ml-3">
                        <h1 className="text-xl font-bold">Create New Blog</h1>
                        <p className="text-sm text-default-500">Write and publish your content</p>
                    </div>
                </NavbarBrand>
                
                <NavbarContent justify="end">
                    <NavbarItem>
                        <Switch
                            isSelected={state.previewMode}
                            onValueChange={(checked) => setState(prev => ({ 
                                ...prev, 
                                previewMode: checked 
                            }))}
                            size="sm"
                        >
                            Preview
                        </Switch>
                    </NavbarItem>
                    <NavbarItem>
                        <Button
                            variant="bordered"
                            startContent={<Save />}
                            onPress={() => saveBlog(false)}
                            isDisabled={state.saving}
                            size="sm"
                        >
                            Save Draft
                        </Button>
                    </NavbarItem>
                    <NavbarItem>
                        <Button
                            color="primary"
                            startContent={<Publish />}
                            onPress={() => saveBlog(true)}
                            isLoading={state.saving}
                            size="sm"
                        >
                            Publish
                        </Button>
                    </NavbarItem>
                </NavbarContent>
            </Navbar>

            <div className="p-6">
                {/* Success/Error Alerts */}
                {(state.error || state.success) && (
                    <Card className={`mb-6 ${state.error ? 'border-danger bg-danger-50' : 'border-success bg-success-50'}`}>
                        <CardBody className="flex flex-row items-center gap-3">
                            <p className={`${state.error ? 'text-danger' : 'text-success'} font-medium`}>
                                {state.error || state.success}
                            </p>
                            <Button
                                size="sm"
                                variant="light"
                                color={state.error ? "danger" : "success"}
                                onPress={() => setState(prev => ({ ...prev, error: '', success: '' }))}
                            >
                                Dismiss
                            </Button>
                        </CardBody>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Main Content Area */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Blog Metadata */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Blog Details</h3>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {/* Title */}
                                <Input
                                    label="Blog Title"
                                    placeholder="Enter your blog title..."
                                    value={state.form.title}
                                    onValueChange={(value) => handleInputChange('title', value)}
                                    description={`${state.form.title.length}/200 characters`}
                                    color={state.form.title.length > 200 ? "danger" : "default"}
                                />

                                {/* Description */}
                                <Textarea
                                    label="Description (Optional)"
                                    placeholder="Brief description of your blog post..."
                                    value={state.form.description}
                                    onValueChange={(value) => handleInputChange('description', value)}
                                    description={`${state.form.description.length}/500 characters`}
                                    color={state.form.description.length > 500 ? "danger" : "default"}
                                    minRows={3}
                                />

                                {/* Tags */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tags</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {state.form.tags.map((tag, index) => (
                                            <Chip
                                                key={index}
                                                onClose={() => {
                                                    const newTags = state.form.tags.filter((_, i) => i !== index);
                                                    handleInputChange('tags', newTags);
                                                }}
                                                variant="flat"
                                            >
                                                {tag}
                                            </Chip>
                                        ))}
                                    </div>
                                    <Input
                                        placeholder="Add a tag and press Enter..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const input = e.target as HTMLInputElement;
                                                const newTag = input.value.trim();
                                                if (newTag && !state.form.tags.includes(newTag) && state.form.tags.length < 10) {
                                                    handleInputChange('tags', [...state.form.tags, newTag]);
                                                    input.value = '';
                                                }
                                            }
                                        }}
                                        description={`${state.form.tags.length}/10 tags`}
                                    />
                                </div>

                                {/* Banner Image */}
                                <Input
                                    label="Banner Image URL (Optional)"
                                    placeholder="https://example.com/image.jpg"
                                    value={state.form.bannerImage}
                                    onValueChange={(value) => handleInputChange('bannerImage', value)}
                                    endContent={
                                        <Button
                                            variant="bordered"
                                            size="sm"
                                            startContent={<CloudUpload />}
                                        >
                                            Upload
                                        </Button>
                                    }
                                />
                            </CardBody>
                        </Card>

                        {/* Content Editor */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Content</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="min-h-[400px]">
                                    <MDEditor
                                        value={state.form.content}
                                        onChange={(val) => handleInputChange('content', val || '')}
                                        preview={state.previewMode ? 'preview' : 'edit'}
                                        height={400}
                                        data-color-mode="light"
                                    />
                                </div>
                                <p className="text-sm text-default-500 mt-2">
                                    {state.form.content.length} characters • Supports Markdown
                                </p>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Publish Settings */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Publish Settings</h3>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                {/* Visibility */}
                                <Select
                                    label="Visibility"
                                    selectedKeys={[state.form.visibility]}
                                    onSelectionChange={(keys) => {
                                        const value = Array.from(keys)[0] as string;
                                        handleInputChange('visibility', value);
                                    }}
                                >
                                    <SelectItem key="public" startContent={<Public className="text-sm" />}>
                                        Public
                                    </SelectItem>
                                    <SelectItem key="unlisted" startContent={<VisibilityOff className="text-sm" />}>
                                        Unlisted
                                    </SelectItem>
                                    <SelectItem key="private" startContent={<Lock className="text-sm" />}>
                                        Private
                                    </SelectItem>
                                </Select>

                                {/* Publish Status */}
                                <Switch
                                    isSelected={state.form.isPublished}
                                    onValueChange={(checked) => handleInputChange('isPublished', checked)}
                                >
                                    Publish immediately
                                </Switch>
                            </CardBody>
                        </Card>

                        {/* Writing Tips */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">Writing Tips</h3>
                            </CardHeader>
                            <CardBody>
                                <ul className="space-y-2 text-sm text-default-600">
                                    <li>• Use clear, descriptive headings</li>
                                    <li>• Include code examples where relevant</li>
                                    <li>• Add images to break up text</li>
                                    <li>• Use bullet points for readability</li>
                                    <li>• Keep paragraphs concise</li>
                                </ul>
                            </CardBody>
                        </Card>

                        {/* SEO Preview */}
                        <Card>
                            <CardHeader>
                                <h3 className="text-lg font-semibold">SEO Preview</h3>
                            </CardHeader>
                            <CardBody>
                                <div className="p-3 bg-default-100 rounded-lg">
                                    <p className="text-primary underline text-sm mb-1">
                                        {state.form.title || 'Your Blog Title'}
                                    </p>
                                    <p className="text-success text-xs mb-1">
                                        meetbhingradiya.vercel.app/blog/...
                                    </p>
                                    <p className="text-default-500 text-xs">
                                        {state.form.description || 'Blog description will appear here...'}
                                    </p>
                                </div>
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}