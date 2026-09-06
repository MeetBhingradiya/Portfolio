/**
 * AssignmentViewer Component
 * Component for viewing assignment documents
 */

"use client";

import React from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { ContentBlock, BlockType, AssignmentDocument } from "@/Types/Assignment";

interface AssignmentViewerProps {
    assignment: AssignmentDocument;
    onDownloadPDF?: () => Promise<void>;
    onShare?: () => void;
    canEdit?: boolean;
    canDownload?: boolean;
    canShare?: boolean;
}

const CodeSnippetRenderer: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const codeBlock = block as any;
    return (
        <Card className="my-4">
            <CardBody>
                {codeBlock.description && <p className="text-sm text-gray-600 mb-3">{codeBlock.description}</p>}
                {codeBlock.fileName && <p className="text-xs text-gray-500 mb-2">📄 {codeBlock.fileName}</p>}
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                    <code>{codeBlock.code}</code>
                </pre>
            </CardBody>
        </Card>
    );
};

const TextBlockRenderer: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const textBlock = block as any;
    return (
        <Card className="my-4">
            <CardBody>
                <h3 className="text-lg font-semibold mb-3">{textBlock.title}</h3>
                <div className="prose max-w-none">{textBlock.content}</div>
            </CardBody>
        </Card>
    );
};

const StepsBlockRenderer: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const stepsBlock = block as any;
    return (
        <Card className="my-4">
            <CardBody>
                <h3 className="text-lg font-semibold mb-2">{stepsBlock.title}</h3>
                {stepsBlock.description && <p className="text-sm text-gray-600 mb-4">{stepsBlock.description}</p>}
                <ol className="space-y-3">
                    {stepsBlock.steps.map((step: any, idx: number) => (
                        <li key={idx} className="flex gap-4">
                            <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                                {step.stepNumber}
                            </span>
                            <div className="flex-1">
                                <h4 className="font-semibold">{step.title}</h4>
                                <p className="text-gray-600 text-sm">{step.description}</p>
                                {step.code && (
                                    <pre className="bg-gray-100 p-2 rounded text-xs mt-2 overflow-x-auto">
                                        <code>{step.code}</code>
                                    </pre>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </CardBody>
        </Card>
    );
};

const TableBlockRenderer: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const tableBlock = block as any;
    return (
        <Card className="my-4">
            <CardBody>
                <h3 className="text-lg font-semibold mb-2">{tableBlock.title}</h3>
                {tableBlock.description && <p className="text-sm text-gray-600 mb-4">{tableBlock.description}</p>}
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                {tableBlock.columns.map((col: any, idx: number) => (
                                    <th key={idx} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableBlock.rows.map((row: any, ridx: number) => (
                                <tr key={ridx} className="hover:bg-gray-50">
                                    {tableBlock.columns.map((col: any, cidx: number) => (
                                        <td key={cidx} className="border border-gray-300 px-4 py-2">
                                            {row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardBody>
        </Card>
    );
};

const ImageBlockRenderer: React.FC<{ block: ContentBlock }> = ({ block }) => {
    const imageBlock = block as any;
    return (
        <Card className="my-4">
            <CardBody>
                {imageBlock.title && <h3 className="text-lg font-semibold mb-3">{imageBlock.title}</h3>}
                {imageBlock.description && <p className="text-sm text-gray-600 mb-3">{imageBlock.description}</p>}
                <img src={imageBlock.imageUrl} alt={imageBlock.caption || "Assignment image"} className="max-w-full h-auto rounded" />
                {imageBlock.caption && <p className="text-sm text-gray-500 mt-2">{imageBlock.caption}</p>}
            </CardBody>
        </Card>
    );
};

export const AssignmentViewer: React.FC<AssignmentViewerProps> = ({
    assignment,
    onDownloadPDF,
    onShare,
    canEdit = false,
    canDownload = true,
    canShare = false
}) => {
    const renderBlock = (block: ContentBlock, index: number) => {
        switch (block.type) {
            case BlockType.CodeSnippet:
                return <CodeSnippetRenderer key={index} block={block} />;
            case BlockType.TextBlock:
                return <TextBlockRenderer key={index} block={block} />;
            case BlockType.StepsBlock:
                return <StepsBlockRenderer key={index} block={block} />;
            case BlockType.Table:
                return <TableBlockRenderer key={index} block={block} />;
            case BlockType.Image:
                return <ImageBlockRenderer key={index} block={block} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 p-6 max-w-4xl mx-auto">
            {/* Header */}
            <Card>
                <CardBody className="space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold">{assignment.assignmentTitle}</h1>
                        <p className="text-gray-600">Assignment No: {assignment.assignmentNo}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Student Name</span>
                            <p className="font-semibold">{assignment.studentName}</p>
                        </div>
                        <div>
                            <span className="text-gray-600">Enrollment No</span>
                            <p className="font-semibold">{assignment.studentEnrollmentNo}</p>
                        </div>
                        {assignment.subject && (
                            <div>
                                <span className="text-gray-600">Subject</span>
                                <p className="font-semibold">{assignment.subject}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-600">Date</span>
                            <p className="font-semibold">{new Date(assignment.editedAt || assignment.createdAt!).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {assignment.description && <p className="text-gray-700">{assignment.description}</p>}

                    {/* Tags */}
                    {assignment.tags && assignment.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {assignment.tags.map((tag) => (
                                <Chip key={tag} size="sm" variant="flat">
                                    {tag}
                                </Chip>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex gap-6 text-sm text-gray-600 pt-4 border-t">
                        <span>👁️ {assignment.views} views</span>
                        <span>⬇️ {assignment.downloads} downloads</span>
                        <span>🔗 {assignment.shares} shares</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        {canDownload && (
                            <Button color="primary" onClick={onDownloadPDF}>
                                ⬇️ Download PDF
                            </Button>
                        )}
                        {canShare && (
                            <Button color="secondary" onClick={onShare}>
                                🔗 Share
                            </Button>
                        )}
                        {canEdit && (
                            <Button color="default" variant="flat">
                                ✏️ Edit
                            </Button>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Content Blocks */}
            <div>{assignment.blocks?.map((block, index) => renderBlock(block, index))}</div>

            {/* Footer */}
            {assignment.watermarkEnabled && (
                <div className="text-center text-gray-400 text-sm py-4 border-t">
                    ⚠️ This document is watermarked
                </div>
            )}
            {assignment.signatureHash && (
                <div className="text-center text-gray-400 text-xs py-2">
                    Hash: {assignment.signatureHash.substring(0, 16)}...
                </div>
            )}
        </div>
    );
};
