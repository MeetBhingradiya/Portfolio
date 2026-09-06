/**
 * View Assignment Page - Preview & Actions
 * Route: /assignments/[id]
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input } from "@heroui/react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AssignmentViewer } from "@/Components/Assignments";
import { fetchAssignment, exportAssignmentPDF, generateShareLink, shareAssignmentWithUser } from "@/Library/assignmentClient";
import { AssignmentDocument } from "@/Types/Assignment";

export default function ViewAssignmentPage({ params }: { params?: { id?: string } }) {
    const router = useRouter();
    const routeParams = useParams<{ id: string }>();
    const assignmentId = (routeParams?.id as string) || (typeof params?.id === "string" ? params.id : "");
    const [assignment, setAssignment] = useState<AssignmentDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [canEdit, setCanEdit] = useState(false);
    const [canDelete, setCanDelete] = useState(false);
    const [canShare, setCanShare] = useState(false);
    const [canDownload, setCanDownload] = useState(false);

    const { isOpen: isShareOpen, onOpen: onShareOpen, onOpenChange: onShareChange } = useDisclosure();
    const [shareEmail, setShareEmail] = useState("");
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (assignmentId) {
            loadAssignment();
        }
    }, [assignmentId]);

    const loadAssignment = async () => {
        try {
            setIsLoading(true);
            const data = await fetchAssignment(assignmentId);
            setAssignment(data);

            // Check permissions (basic - should match backend)
            setCanEdit(true); // Owner check happens on backend
            setCanDelete(true); // Owner check happens on backend
            setCanShare(true); // Owner check happens on backend
            setCanDownload(true); // Privacy check happens on backend
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load assignment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!assignmentId) return;
        try {
            await exportAssignmentPDF(assignmentId);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to download PDF");
        }
    };

    const handleGenerateShareLink = async () => {
        if (!assignmentId) return;
        try {
            const result = await generateShareLink(assignmentId, 24, true); // 24 hours expiry
            setShareUrl(result.shareUrl);
            // Copy to clipboard
            navigator.clipboard.writeText(result.shareUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate share link");
        }
    };

    const handleShareWithUser = async () => {
        if (!assignmentId) return;
        try {
            setIsSharing(true);
            await shareAssignmentWithUser(
                assignmentId,
                "user-id", // Would come from user selection
                shareEmail,
                ["Tools.AssignmentSystem.View", "Tools.AssignmentSystem.Download"]
            );
            setShareEmail("");
            onShareChange();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to share assignment");
        } finally {
            setIsSharing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner label="Loading assignment..." />
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card className="bg-red-50 border border-red-200">
                    <CardBody>
                        <p className="text-red-700">{error || "Assignment not found"}</p>
                    </CardBody>
                </Card>
                <Link href="/assignments">
                    <Button className="mt-4">← Back to Assignments</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Fixed Toolbar */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b z-50 shadow">
                <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
                    <div>
                        <Link href="/assignments">
                            <Button isIconOnly variant="light">
                                ←
                            </Button>
                        </Link>
                    </div>

                    <div className="flex gap-2">
                        {canDownload && (
                            <Button color="primary" onClick={handleDownloadPDF}>
                                ⬇️ PDF
                            </Button>
                        )}
                        {canShare && (
                            <>
                                <Button color="secondary" onClick={onShareOpen}>
                                    👥 Share
                                </Button>
                                <Button color="secondary" onClick={handleGenerateShareLink} variant="flat">
                                    🔗 Link
                                </Button>
                            </>
                        )}
                        {canEdit && (
                            <Link href={`/assignments/${assignmentId}/edit`}>
                                <Button color="warning" variant="flat">
                                    ✏️ Edit
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Share URL Display */}
                {shareUrl && (
                    <div className="max-w-6xl mx-auto px-6 py-2 bg-green-50 border-t text-sm">
                        <p className="text-green-700">
                            ✅ Share link copied: <code className="bg-white px-2 py-1 rounded">{shareUrl}</code>
                        </p>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="pt-24">
                <AssignmentViewer
                    assignment={assignment}
                    onDownloadPDF={handleDownloadPDF}
                    onShare={onShareOpen}
                    canEdit={canEdit}
                    canDownload={canDownload}
                    canShare={canShare}
                />
            </div>

            {/* Share Modal */}
            <Modal isOpen={isShareOpen} onOpenChange={onShareChange} size="md">
                <ModalContent>
                    <ModalHeader>Share Assignment</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email Address</label>
                                <Input
                                    placeholder="user@example.com"
                                    value={shareEmail}
                                    onChange={(e) => setShareEmail(e.target.value)}
                                    type="email"
                                />
                            </div>
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                                Shared users can view and download this assignment based on their permissions.
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="default" onPress={() => onShareChange()}>
                            Cancel
                        </Button>
                        <Button color="primary" onClick={handleShareWithUser} isLoading={isSharing}>
                            Share
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}
