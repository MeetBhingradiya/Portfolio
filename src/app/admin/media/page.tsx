"use client";

import React, { useState, useCallback } from "react";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    Avatar,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Progress,
    Tabs,
    Tab,
    Image
} from "@heroui/react";
import {
    CloudUpload,
    Search,
    Filter,
    MoreVert,
    Delete,
    Edit,
    Download,
    Share,
    Image as ImageIcon,
    VideoLibrary,
    AudioFile,
    InsertDriveFile,
    Folder,
    GridView,
    ViewList
} from "@mui/icons-material";
import { AdminLayout, StatsGrid } from "@/Components/Admin";
import { useAccountSwitcher } from "@/Hooks/useAccountSwitcher";

interface MediaFile {
    id: string;
    name: string;
    type: "image" | "video" | "audio" | "document";
    size: number;
    url: string;
    thumbnail?: string;
    uploadDate: Date;
    uploader: string;
    dimensions?: { width: number; height: number };
    duration?: number;
    tags: string[];
    downloads: number;
    folder: string;
}

// Mock data
const mockMediaFiles: MediaFile[] = [
    {
        id: "1",
        name: "hero-banner.jpg",
        type: "image",
        size: 2456789,
        url: "/uploads/hero-banner.jpg",
        thumbnail: "/uploads/thumbs/hero-banner.jpg",
        uploadDate: new Date("2024-01-15"),
        uploader: "John Doe",
        dimensions: { width: 1920, height: 1080 },
        tags: ["banner", "hero", "homepage"],
        downloads: 45,
        folder: "banners"
    },
    {
        id: "2",
        name: "product-demo.mp4",
        type: "video",
        size: 15678901,
        url: "/uploads/product-demo.mp4",
        thumbnail: "/uploads/thumbs/product-demo.jpg",
        uploadDate: new Date("2024-01-14"),
        uploader: "Jane Smith",
        duration: 120,
        tags: ["product", "demo", "video"],
        downloads: 23,
        folder: "videos"
    },
    {
        id: "3",
        name: "background-music.mp3",
        type: "audio",
        size: 5432109,
        url: "/uploads/background-music.mp3",
        uploadDate: new Date("2024-01-13"),
        uploader: "Mike Johnson",
        duration: 180,
        tags: ["music", "background", "audio"],
        downloads: 12,
        folder: "audio"
    },
    {
        id: "4",
        name: "user-manual.pdf",
        type: "document",
        size: 1234567,
        url: "/uploads/user-manual.pdf",
        uploadDate: new Date("2024-01-12"),
        uploader: "Sarah Wilson",
        tags: ["manual", "documentation", "pdf"],
        downloads: 89,
        folder: "documents"
    }
];

const folders = [
    "all",
    "banners",
    "videos",
    "audio",
    "documents",
    "icons",
    "logos"
];

export default function MediaPage() {
    const { currentAccount } = useAccountSwitcher();
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(mockMediaFiles);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFolder, setSelectedFolder] = useState("all");
    const [selectedType, setSelectedType] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const {
        isOpen: isUploadOpen,
        onOpen: onUploadOpen,
        onClose: onUploadClose
    } = useDisclosure();
    const {
        isOpen: isDeleteOpen,
        onOpen: onDeleteOpen,
        onClose: onDeleteClose
    } = useDisclosure();
    const {
        isOpen: isEditOpen,
        onOpen: onEditOpen,
        onClose: onEditClose
    } = useDisclosure();

    // Stats data
    const statsData = [
        {
            title: "Total Files",
            value: mediaFiles.length.toString(),
            icon: <InsertDriveFile className="w-6 h-6" />,
            color: "primary" as const
        },
        {
            title: "Total Size",
            value: formatFileSize(
                mediaFiles.reduce((acc, file) => acc + file.size, 0)
            ),
            icon: <Folder className="w-6 h-6" />,
            color: "secondary" as const
        },
        {
            title: "Images",
            value: mediaFiles
                .filter((f) => f.type === "image")
                .length.toString(),
            icon: <ImageIcon className="w-6 h-6" />,
            color: "success" as const
        },
        {
            title: "Videos",
            value: mediaFiles
                .filter((f) => f.type === "video")
                .length.toString(),
            icon: <VideoLibrary className="w-6 h-6" />,
            color: "warning" as const
        }
    ];

    // Filter files
    const filteredFiles = mediaFiles.filter((file) => {
        const matchesSearch =
            file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.tags.some((tag) =>
                tag.toLowerCase().includes(searchTerm.toLowerCase())
            );
        const matchesFolder =
            selectedFolder === "all" || file.folder === selectedFolder;
        const matchesType =
            selectedType === "all" || file.type === selectedType;

        return matchesSearch && matchesFolder && matchesType;
    });

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    function getFileIcon(type: string) {
        switch (type) {
            case "image":
                return <ImageIcon className="w-5 h-5" />;
            case "video":
                return <VideoLibrary className="w-5 h-5" />;
            case "audio":
                return <AudioFile className="w-5 h-5" />;
            default:
                return <InsertDriveFile className="w-5 h-5" />;
        }
    }

    function getFileTypeColor(type: string) {
        switch (type) {
            case "image":
                return "success";
            case "video":
                return "warning";
            case "audio":
                return "secondary";
            default:
                return "default";
        }
    }

    const handleFileUpload = useCallback(
        async (files: FileList) => {
            setIsUploading(true);
            setUploadProgress(0);

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setIsUploading(false);
                        onUploadClose();
                        return 100;
                    }
                    return prev + 10;
                });
            }, 200);

            // Mock file processing
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const newMediaFile: MediaFile = {
                    id: Date.now().toString() + i,
                    name: file.name,
                    type: file.type.startsWith("image/")
                        ? "image"
                        : file.type.startsWith("video/")
                          ? "video"
                          : file.type.startsWith("audio/")
                            ? "audio"
                            : "document",
                    size: file.size,
                    url: URL.createObjectURL(file),
                    uploadDate: new Date(),
                    uploader:
                        currentAccount?.FName + " " + currentAccount?.LName ||
                        "Unknown",
                    tags: [],
                    downloads: 0,
                    folder: "uploads"
                };

                setMediaFiles((prev) => [newMediaFile, ...prev]);
            }
        },
        [currentAccount, onUploadClose]
    );

    const handleDelete = useCallback(() => {
        setMediaFiles((prev) =>
            prev.filter((file) => !selectedFiles.has(file.id))
        );
        setSelectedFiles(new Set());
        onDeleteClose();
    }, [selectedFiles, onDeleteClose]);

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Media Library
                            </h1>
                            <p className="text-default-500">
                                Manage your files, images, videos, and documents
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                color="primary"
                                startContent={<CloudUpload />}
                                onPress={onUploadOpen}>
                                Upload Files
                            </Button>
                            {selectedFiles.size > 0 && (
                                <Button
                                    color="danger"
                                    variant="flat"
                                    startContent={<Delete />}
                                    onPress={onDeleteOpen}>
                                    Delete ({selectedFiles.size})
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <StatsGrid
                    stats={statsData}
                    columns={4}
                />

                {/* Filters and Search */}
                <Card>
                    <CardBody>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                                placeholder="Search files..."
                                startContent={<Search className="w-4 h-4" />}
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                                className="flex-1"
                            />
                            <Select
                                placeholder="Folder"
                                selectedKeys={[selectedFolder]}
                                onSelectionChange={(keys) =>
                                    setSelectedFolder(
                                        Array.from(keys)[0] as string
                                    )
                                }
                                className="w-40">
                                {folders.map((folder) => (
                                    <SelectItem key={folder}>
                                        {folder === "all"
                                            ? "All Folders"
                                            : folder}
                                    </SelectItem>
                                ))}
                            </Select>
                            <Select
                                placeholder="Type"
                                selectedKeys={[selectedType]}
                                onSelectionChange={(keys) =>
                                    setSelectedType(
                                        Array.from(keys)[0] as string
                                    )
                                }
                                className="w-40">
                                <SelectItem key="all">All Types</SelectItem>
                                <SelectItem key="image">Images</SelectItem>
                                <SelectItem key="video">Videos</SelectItem>
                                <SelectItem key="audio">Audio</SelectItem>
                                <SelectItem key="document">
                                    Documents
                                </SelectItem>
                            </Select>
                            <div className="flex items-center gap-2">
                                <Button
                                    isIconOnly
                                    variant={
                                        viewMode === "grid" ? "solid" : "light"
                                    }
                                    onPress={() => setViewMode("grid")}>
                                    <GridView />
                                </Button>
                                <Button
                                    isIconOnly
                                    variant={
                                        viewMode === "list" ? "solid" : "light"
                                    }
                                    onPress={() => setViewMode("list")}>
                                    <ViewList />
                                </Button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Media Grid/List */}
                {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {filteredFiles.map((file) => (
                            <Card
                                key={file.id}
                                isPressable
                                className={`${selectedFiles.has(file.id) ? "border-primary border-2" : ""}`}
                                onPress={() => {
                                    const newSelected = new Set(selectedFiles);
                                    if (newSelected.has(file.id)) {
                                        newSelected.delete(file.id);
                                    } else {
                                        newSelected.add(file.id);
                                    }
                                    setSelectedFiles(newSelected);
                                }}>
                                <CardBody className="p-3">
                                    <div className="aspect-square bg-default-100 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                                        {file.type === "image" &&
                                        file.thumbnail ? (
                                            <Image
                                                src={file.thumbnail}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="text-default-400">
                                                {getFileIcon(file.type)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium truncate">
                                            {file.name}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <Chip
                                                size="sm"
                                                color={getFileTypeColor(
                                                    file.type
                                                )}
                                                variant="flat">
                                                {file.type}
                                            </Chip>
                                            <p className="text-xs text-default-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card>
                        <Table aria-label="Media files table">
                            <TableHeader>
                                <TableColumn>FILE</TableColumn>
                                <TableColumn>TYPE</TableColumn>
                                <TableColumn>SIZE</TableColumn>
                                <TableColumn>UPLOADED</TableColumn>
                                <TableColumn>UPLOADER</TableColumn>
                                <TableColumn>DOWNLOADS</TableColumn>
                                <TableColumn>ACTIONS</TableColumn>
                            </TableHeader>
                            <TableBody>
                                {filteredFiles.map((file) => (
                                    <TableRow key={file.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-default-100 rounded-lg flex items-center justify-center">
                                                    {file.type === "image" &&
                                                    file.thumbnail ? (
                                                        <Image
                                                            src={file.thumbnail}
                                                            alt={file.name}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        getFileIcon(file.type)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-sm text-default-500">
                                                        {file.folder}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                size="sm"
                                                color={getFileTypeColor(
                                                    file.type
                                                )}
                                                variant="flat">
                                                {file.type}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {formatFileSize(file.size)}
                                        </TableCell>
                                        <TableCell>
                                            {file.uploadDate.toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>{file.uploader}</TableCell>
                                        <TableCell>{file.downloads}</TableCell>
                                        <TableCell>
                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <Button
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light">
                                                        <MoreVert className="w-4 h-4" />
                                                    </Button>
                                                </DropdownTrigger>{" "}
                                                <DropdownMenu>
                                                    <DropdownItem
                                                        key="download"
                                                        startContent={
                                                            <Download className="w-4 h-4" />
                                                        }>
                                                        Download
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        key="share"
                                                        startContent={
                                                            <Share className="w-4 h-4" />
                                                        }>
                                                        Share
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        key="edit"
                                                        startContent={
                                                            <Edit className="w-4 h-4" />
                                                        }>
                                                        Edit
                                                    </DropdownItem>
                                                    <DropdownItem
                                                        key="delete"
                                                        startContent={
                                                            <Delete className="w-4 h-4" />
                                                        }
                                                        className="text-danger"
                                                        color="danger">
                                                        Delete
                                                    </DropdownItem>
                                                </DropdownMenu>
                                            </Dropdown>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}

                {/* Upload Modal */}
                <Modal
                    isOpen={isUploadOpen}
                    onClose={onUploadClose}
                    size="2xl">
                    <ModalContent>
                        <ModalHeader>Upload Files</ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div
                                    className="border-2 border-dashed border-default-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        if (e.dataTransfer.files) {
                                            handleFileUpload(
                                                e.dataTransfer.files
                                            );
                                        }
                                    }}
                                    onDragOver={(e) => e.preventDefault()}>
                                    <CloudUpload className="w-12 h-12 text-default-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium">
                                        Drop files here or click to browse
                                    </p>
                                    <p className="text-default-500">
                                        Support for images, videos, audio, and
                                        documents
                                    </p>
                                    <input
                                        type="file"
                                        multiple
                                        className="hidden"
                                        id="file-upload"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                handleFileUpload(
                                                    e.target.files
                                                );
                                            }
                                        }}
                                    />
                                    <Button
                                        as="label"
                                        htmlFor="file-upload"
                                        color="primary"
                                        variant="flat"
                                        className="mt-4">
                                        Choose Files
                                    </Button>
                                </div>

                                {isUploading && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span>Uploading...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <Progress
                                            value={uploadProgress}
                                            color="primary"
                                        />
                                    </div>
                                )}
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onUploadClose}>
                                Cancel
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>

                {/* Delete Confirmation Modal */}
                <Modal
                    isOpen={isDeleteOpen}
                    onClose={onDeleteClose}>
                    <ModalContent>
                        <ModalHeader>Delete Files</ModalHeader>
                        <ModalBody>
                            <p>
                                Are you sure you want to delete{" "}
                                {selectedFiles.size} file(s)? This action cannot
                                be undone.
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onDeleteClose}>
                                Cancel
                            </Button>
                            <Button
                                color="danger"
                                onPress={handleDelete}>
                                Delete
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </div>
        </AdminLayout>
    );
}
