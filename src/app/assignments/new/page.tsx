/**
 * Create New Assignment Page
 * Route: /assignments/new
 */

"use client";

import React, { useState } from "react";
import { Card, CardBody, Spinner, Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AssignmentEditor } from "@/Components/Assignments";
import { createAssignment } from "@/Library/assignmentClient";
import { AssignmentDocument } from "@/Types/Assignment";

export default function NewAssignmentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async (data: Partial<AssignmentDocument>) => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await createAssignment(data);
            router.push(`/assignments/${result._id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create assignment");
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold">✍️ Create Assignment</h1>
                    <p className="text-gray-600 mt-1">Create a new assignment document with rich content blocks</p>
                </div>
                <Link href="/assignments">
                    <Button variant="flat">← Back to Assignments</Button>
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
                    <AssignmentEditor onSave={handleSave} isLoading={isLoading} />
                </CardBody>
            </Card>

            {/* Tips */}
            <Card className="bg-blue-50 border border-blue-200">
                <CardBody>
                    <h3 className="font-semibold text-blue-900 mb-2">💡 Tips:</h3>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Fill in all required fields (Assignment No, Title, Student Name, Enrollment No)</li>
                        <li>Add at least one content block (Code, Text, Steps, Table, or Image)</li>
                        <li>Set privacy level: Private (owner only), Unlisted (share link), or Public</li>
                        <li>Enable watermark to protect your document</li>
                        <li>Add tags for better discoverability</li>
                    </ul>
                </CardBody>
            </Card>
        </div>
    );
}
