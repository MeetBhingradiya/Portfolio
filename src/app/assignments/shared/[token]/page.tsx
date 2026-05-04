/**
 * Shared Assignment View Page
 * Route: /assignments/shared/[token]
 * Public access via share link
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { AssignmentViewer } from "@/Components/Assignments";
import { accessSharedAssignment, exportAssignmentPDF } from "@/Library/assignmentClient";
import { AssignmentDocument } from "@/Types/Assignment";

export default function SharedAssignmentPage({ params }: { params: { token: string } }) {
    const [assignment, setAssignment] = useState<AssignmentDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canDownload, setCanDownload] = useState(false);

    useEffect(() => {
        loadSharedAssignment();
    }, [params.token]);

    const loadSharedAssignment = async () => {
        try {
            setIsLoading(true);
            const result = await accessSharedAssignment(params.token);
            setAssignment(result.assignment);
            setCanDownload(result.shareLink.allowDownload);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load shared assignment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            await exportAssignmentPDF(assignment!._id as string);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to download PDF");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner label="Loading shared assignment..." />
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="bg-red-50 border border-red-200 max-w-md">
                    <CardBody>
                        <p className="text-red-700 font-semibold">Access Denied</p>
                        <p className="text-red-600 text-sm mt-2">
                            {error || "This shared assignment is no longer available or has expired"}
                        </p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Fixed Toolbar */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b z-50 shadow">
                <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="font-semibold">📋 Shared Assignment</div>

                    {canDownload && (
                        <Button color="primary" onClick={handleDownloadPDF}>
                            ⬇️ Download PDF
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="pt-24">
                <AssignmentViewer
                    assignment={assignment}
                    onDownloadPDF={canDownload ? handleDownloadPDF : undefined}
                    canDownload={canDownload}
                    canEdit={false}
                    canShare={false}
                />
            </div>

            {/* Footer */}
            <div className="text-center py-8 border-t text-sm text-gray-600">
                <p>This is a shared assignment document. View and download access is controlled by the owner.</p>
            </div>
        </div>
    );
}
