/**
 * Assignments Dashboard - List & Search
 * Route: /assignments
 */

"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, CardBody, Tabs, Tab, Spinner } from "@heroui/react";
import Link from "next/link";
import { AssignmentList } from "@/Components/Assignments";
import { fetchMyAssignments, searchAssignments, deleteAssignment } from "@/Library/assignmentClient";
import { AssignmentDocument } from "@/Types/Assignment";

export default function AssignmentsPage() {
    const [myAssignments, setMyAssignments] = useState<AssignmentDocument[]>([]);
    const [publicAssignments, setPublicAssignments] = useState<AssignmentDocument[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadAssignments();
    }, [page, searchQuery]);

    const loadAssignments = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load my assignments
            const myData = await fetchMyAssignments(20, (page - 1) * 20);
            setMyAssignments(myData.data);

            // Load public assignments if searching
            if (searchQuery) {
                const publicData = await searchAssignments(searchQuery, 20, (page - 1) * 20);
                setPublicAssignments(publicData.data);
            } else {
                setPublicAssignments([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load assignments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteAssignment(id);
            setMyAssignments((prev) => prev.filter((a) => a._id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to delete assignment");
        }
    };

    if (isLoading && myAssignments.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Spinner label="Loading assignments..." />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold">📚 Assignments</h1>
                    <p className="text-gray-600 mt-1">Create, view, and manage your assignment documents</p>
                </div>
                <Link href="/assignments/new">
                    <Button color="primary" size="lg">
                        ➕ New Assignment
                    </Button>
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

            {/* Tabs */}
            <Tabs>
                <Tab key="my-assignments" title={`My Assignments (${myAssignments.length})`}>
                    <Card>
                        <CardBody className="p-6">
                            {myAssignments.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 mb-4">No assignments created yet</p>
                                    <Link href="/assignments/new">
                                        <Button color="primary" variant="flat">
                                            Create Your First Assignment
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <AssignmentList
                                    assignments={myAssignments}
                                    onViewAssignment={(id) => (window.location.href = `/assignments/${id}`)}
                                    onEditAssignment={(id) => (window.location.href = `/assignments/${id}/edit`)}
                                    onDeleteAssignment={handleDelete}
                                    canEdit={true}
                                    canDelete={true}
                                    isLoading={isLoading}
                                />
                            )}
                        </CardBody>
                    </Card>
                </Tab>

                <Tab key="search" title="Search & Explore">
                    <Card>
                        <CardBody className="p-6">
                            <AssignmentList
                                assignments={publicAssignments}
                                onViewAssignment={(id) => (window.location.href = `/assignments/${id}`)}
                                onSearch={setSearchQuery}
                                isLoading={isLoading}
                            />
                        </CardBody>
                    </Card>
                </Tab>
            </Tabs>
        </div>
    );
}
