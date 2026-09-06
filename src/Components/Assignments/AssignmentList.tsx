/**
 * AssignmentList Component
 * Component for listing and searching assignments
 */

"use client";

import React, { useState, useEffect } from "react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Input, Card, CardBody, Chip, Pagination } from "@heroui/react";
import { AssignmentDocument, AssignmentPrivacy } from "@/Types/Assignment";

interface AssignmentListProps {
    assignments: AssignmentDocument[];
    onViewAssignment?: (id: string) => void;
    onEditAssignment?: (id: string) => void;
    onDeleteAssignment?: (id: string) => Promise<void>;
    canEdit?: boolean;
    canDelete?: boolean;
    isLoading?: boolean;
    total?: number;
    onPageChange?: (page: number) => void;
    onSearch?: (query: string) => void;
}

export const AssignmentList: React.FC<AssignmentListProps> = ({
    assignments,
    onViewAssignment,
    onEditAssignment,
    onDeleteAssignment,
    canEdit = false,
    canDelete = false,
    isLoading = false,
    total = 0,
    onPageChange,
    onSearch
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setPage(1);
        onSearch?.(e.target.value);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this assignment?")) {
            try {
                await onDeleteAssignment?.(id);
            } catch (error) {
                console.error("Failed to delete assignment:", error);
                alert("Failed to delete assignment");
            }
        }
    };

    const privacyColorMap = {
        [AssignmentPrivacy.Public]: "success",
        [AssignmentPrivacy.Unlisted]: "warning",
        [AssignmentPrivacy.Private]: "default"
    };

    return (
        <div className="space-y-4">
            <Input
                isClearable
                placeholder="Search assignments by title, no, or student name..."
                value={searchQuery}
                onChange={handleSearch}
                size="lg"
                startContent={<span>🔍</span>}
            />

            <Card>
                <CardBody>
                    <Table isStriped>
                        <TableHeader>
                            <TableColumn>ASSIGNMENT NO</TableColumn>
                            <TableColumn>TITLE</TableColumn>
                            <TableColumn>STUDENT</TableColumn>
                            <TableColumn>PRIVACY</TableColumn>
                            <TableColumn>VIEWS</TableColumn>
                            <TableColumn>DATE</TableColumn>
                            <TableColumn>ACTIONS</TableColumn>
                        </TableHeader>
                        <TableBody isLoading={isLoading} items={assignments}>
                            {(item) => (
                                <TableRow key={item._id}>
                                    <TableCell className="font-mono text-sm">{item.assignmentNo}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-semibold">{item.assignmentTitle}</p>
                                            {item.subject && <p className="text-xs text-gray-500">{item.subject}</p>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-semibold">{item.studentName}</p>
                                            <p className="text-xs text-gray-500">{item.studentEnrollmentNo}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            size="sm"
                                            color={privacyColorMap[item.privacy] as any}
                                            variant="flat"
                                        >
                                            {item.privacy}
                                        </Chip>
                                    </TableCell>
                                    <TableCell className="text-center">{item.views}</TableCell>
                                    <TableCell className="text-sm">{new Date(item.createdAt!).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onClick={() => onViewAssignment?.(item._id as string)}
                                            >
                                                👁️
                                            </Button>
                                            {canEdit && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    onClick={() => onEditAssignment?.(item._id as string)}
                                                >
                                                    ✏️
                                                </Button>
                                            )}
                                            {canDelete && (
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    onClick={() => handleDelete(item._id as string)}
                                                >
                                                    🗑️
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {total > itemsPerPage && (
                <div className="flex justify-center">
                    <Pagination
                        total={Math.ceil(total / itemsPerPage)}
                        color="primary"
                        page={page}
                        onChange={(p) => {
                            setPage(p);
                            onPageChange?.(p);
                        }}
                    />
                </div>
            )}
        </div>
    );
};
