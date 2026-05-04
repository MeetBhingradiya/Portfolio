/**
 * Edit Assignment Page
 * Route: /assignments/[id]/edit
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody, Spinner, Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AssignmentEditor } from "@/Components/Assignments";
import { fetchAssignment, updateAssignment } from "@/Library/assignmentClient";
import { AssignmentDocument } from "@/Types/Assignment";

export default function EditAssignmentPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [assignment, setAssignment] = useState<AssignmentDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAssignment();
    }, [params.id]);

    const loadAssignment = async () => {
        try {
            setIsLoading(true);
            const data = await fetchAssignment(params.id);
            setAssignment(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load assignment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (data: Partial<AssignmentDocument>) => {
        try {
            setIsSaving(true);
            setError(null);
            await updateAssignment(params.id, data);
            router.push(`/assignments/${params.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update assignment");
            setIsSaving(false);
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
            <div className="max-w-5xl mx-auto p-6">
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
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold">✏️ Edit Assignment</h1>
                    <p className="text-gray-600 mt-1">{assignment.assignmentTitle}</p>
                </div>
                <Link href={`/assignments/${params.id}`}>
                    <Button variant="flat">← Back</Button>
                </Link>
            </div>

            {/* Error Message */}
            {error && (
                <Card className="bg-red-50 border border-red-200">
                    <CardBody>
                        <p className="text-red-700">{error}</p>
                    </CardBody>
                </Card>
            )}

            {/* Editor */}
            <Card>
                <CardBody>
                    <AssignmentEditor assignment={assignment} onSave={handleSave} isLoading={isSaving} />
                </CardBody>
            </Card>

            {/* Version Info */}
            <Card className="bg-gray-50">
                <CardBody>
                    <p className="text-sm text-gray-600">
                        Version {assignment.version} • Last edited{" "}
                        {assignment.editedAt
                            ? new Date(assignment.editedAt).toLocaleDateString()
                            : new Date(assignment.createdAt!).toLocaleDateString()}
                    </p>
                </CardBody>
            </Card>
        </div>
    );
}
