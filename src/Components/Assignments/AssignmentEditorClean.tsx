/**
 * AssignmentEditor Component
 * Main component for creating and editing assignment documents
 */

"use client";

import React, { useEffect, useState } from "react";
import { Button, Input, Textarea, Card, CardBody, Chip } from "@heroui/react";
import {
    AssignmentDocument,
    AssignmentPrivacy,
    BlockType,
    CodeBlock,
    CodeBlockLanguage,
    CodeSnippetBlock,
    ContentBlock,
    ImageBlock,
    StepsBlock,
    TableBlock,
    TextBlock
} from "@/Types/Assignment";
import { AssignmentViewer } from "./AssignmentViewer";

interface AssignmentEditorProps {
    assignment?: AssignmentDocument;
    onSave?: (assignment: Partial<AssignmentDocument>) => Promise<void>;
    isLoading?: boolean;
}

type TextBlockFormat = NonNullable<TextBlock["format"]>;
type TableColumnType = NonNullable<TableBlock["columns"][number]["type"]>;

const CODE_LANGUAGES: CodeBlockLanguage[] = [
    CodeBlockLanguage.JavaScript,
    CodeBlockLanguage.TypeScript,
    CodeBlockLanguage.Python,
    CodeBlockLanguage.Java,
    CodeBlockLanguage.CSharp,
    CodeBlockLanguage.Cpp,
    CodeBlockLanguage.C,
    CodeBlockLanguage.SQL,
    CodeBlockLanguage.HTML,
    CodeBlockLanguage.CSS,
    CodeBlockLanguage.Bash,
    CodeBlockLanguage.Shell,
    CodeBlockLanguage.JSON,
    CodeBlockLanguage.XML,
    CodeBlockLanguage.YAML,
    CodeBlockLanguage.Markdown,
    CodeBlockLanguage.PlainText
];

function createBlock(type: BlockType): ContentBlock {
    switch (type) {
        case BlockType.CodeSnippet:
            return {
                type,
                code: "// Enter your code here",
                language: CodeBlockLanguage.JavaScript,
                description: "Code snippet"
            };
        case BlockType.CodeBlock:
            return {
                type,
                title: "Code Block",
                description: "Describe the code and its output",
                steps: [
                    {
                        lineNumber: 1,
                        description: "Step 1",
                        code: "console.log('Hello world');",
                        language: CodeBlockLanguage.JavaScript
                    }
                ]
            };
        case BlockType.StepsBlock:
            return {
                type,
                title: "Steps",
                description: "Follow these steps",
                steps: [
                    {
                        stepNumber: 1,
                        title: "Step 1",
                        description: "Describe this step"
                    }
                ]
            };
        case BlockType.Table:
            return {
                type,
                title: "Table",
                description: "Editable table data",
                columns: [
                    { header: "Column 1", key: "col1", type: "text" },
                    { header: "Column 2", key: "col2", type: "text" }
                ],
                rows: [{ col1: "Data 1", col2: "Data 2" }]
            };
        case BlockType.TextBlock:
            return {
                type,
                title: "Text Block",
                content: "Enter your text content here",
                format: "markdown"
            };
        case BlockType.Image:
            return {
                type,
                title: "Image",
                description: "Image URL or CDN asset ID",
                imageUrl: "",
                caption: "Image caption"
            };
    }
}

function getBlockLabel(block: ContentBlock): string {
    if (block.type === BlockType.CodeSnippet) return block.description || "Code Snippet";
    if (block.type === BlockType.Image) return block.title || "Image";
    return "title" in block ? block.title : "";
}

function updateArrayItem<T>(items: T[], index: number, updater: (value: T) => T): T[] {
    return items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item));
}

const isCodeSnippetBlock = (block: ContentBlock): block is CodeSnippetBlock => block.type === BlockType.CodeSnippet;
const isCodeBlock = (block: ContentBlock): block is CodeBlock => block.type === BlockType.CodeBlock;
const isStepsBlock = (block: ContentBlock): block is StepsBlock => block.type === BlockType.StepsBlock;
const isTableBlock = (block: ContentBlock): block is TableBlock => block.type === BlockType.Table;
const isTextBlock = (block: ContentBlock): block is TextBlock => block.type === BlockType.TextBlock;
const isImageBlock = (block: ContentBlock): block is ImageBlock => block.type === BlockType.Image;

export const AssignmentEditor: React.FC<AssignmentEditorProps> = ({ assignment, onSave, isLoading = false }) => {
    const [formData, setFormData] = useState({
        assignmentNo: assignment?.assignmentNo || "",
        assignmentTitle: assignment?.assignmentTitle || "",
        studentName: assignment?.studentName || "",
        studentEnrollmentNo: assignment?.studentEnrollmentNo || "",
        subject: assignment?.subject || "",
        subjectCode: assignment?.subjectCode || "",
        description: assignment?.description || "",
        privacy: assignment?.privacy || AssignmentPrivacy.Private,
        watermarkEnabled: assignment?.watermarkEnabled || false,
        tags: assignment?.tags || []
    });

    const [blocks, setBlocks] = useState<ContentBlock[]>(assignment?.blocks || []);
    const [newTag, setNewTag] = useState("");
    const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!assignment) return;

        setFormData({
            assignmentNo: assignment.assignmentNo || "",
            assignmentTitle: assignment.assignmentTitle || "",
            studentName: assignment.studentName || "",
            studentEnrollmentNo: assignment.studentEnrollmentNo || "",
            subject: assignment.subject || "",
            subjectCode: assignment.subjectCode || "",
            description: assignment.description || "",
            privacy: assignment.privacy || AssignmentPrivacy.Private,
            watermarkEnabled: assignment.watermarkEnabled || false,
            tags: assignment.tags || []
        });
        setBlocks(assignment.blocks || []);
    }, [assignment]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as HTMLInputElement;
        const { name, value, type } = target;
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? target.checked : value }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const addTag = () => {
        const value = newTag.trim();
        if (!value || formData.tags.includes(value)) return;
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }));
        setNewTag("");
    };

    const removeTag = (tag: string) => {
        setFormData((prev) => ({ ...prev, tags: prev.tags.filter((currentTag) => currentTag !== tag) }));
    };

    const addBlock = (type: BlockType) => setBlocks((prev) => [...prev, createBlock(type)]);

    const removeBlock = (index: number) => setBlocks((prev) => prev.filter((_, currentIndex) => currentIndex !== index));

    const moveBlock = (index: number, direction: -1 | 1) => {
        setBlocks((prev) => {
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= prev.length) return prev;
            const next = [...prev];
            [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
            return next;
        });
    };

    const moveBlockToIndex = (fromIndex: number, toIndex: number) => {
        setBlocks((prev) => {
            if (fromIndex === toIndex || toIndex < 0 || toIndex >= prev.length) return prev;
            const next = [...prev];
            const [movedBlock] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, movedBlock);
            return next;
        });
        setDraggedBlockIndex(null);
    };

    function updateBlock<T extends ContentBlock>(index: number, updater: (block: T) => T) {
        setBlocks((prev) => updateArrayItem(prev as T[], index, updater));
    }

    const handleSave = async () => {
        try {
            await onSave?.({
                assignmentNo: formData.assignmentNo?.trim() || `ASS-${Date.now().toString().slice(-6)}`,
                assignmentTitle: formData.assignmentTitle?.trim() || "Untitled Assignment",
                studentName: formData.studentName?.trim() || "Student",
                studentEnrollmentNo: formData.studentEnrollmentNo?.trim() || "N/A",
                subject: formData.subject?.trim() || undefined,
                subjectCode: formData.subjectCode?.trim() || undefined,
                description: formData.description?.trim() || undefined,
                privacy: formData.privacy,
                watermarkEnabled: formData.watermarkEnabled,
                tags: formData.tags,
                blocks
            });
        } catch (error) {
            console.error("Failed to save assignment:", error);
            alert("Failed to save assignment");
        }
    };

    const renderCodeSnippetEditor = (block: CodeSnippetBlock, index: number) => (
        <div className="space-y-3">
            <Input label="Description" value={block.description || ""} onChange={(event) => updateBlock<CodeSnippetBlock>(index, (current) => ({ ...current, description: event.target.value }))} />
            <Input label="File Name" value={block.fileName || ""} onChange={(event) => updateBlock<CodeSnippetBlock>(index, (current) => ({ ...current, fileName: event.target.value }))} />
            <label className="block text-sm font-medium">Language</label>
            <select value={block.language} onChange={(event) => updateBlock<CodeSnippetBlock>(index, (current) => ({ ...current, language: event.target.value as CodeBlockLanguage }))} className="w-full rounded-lg border border-default-200 bg-background px-3 py-2 text-sm">
                {CODE_LANGUAGES.map((language) => (
                    <option key={language} value={language}>
                        {language}
                    </option>
                ))}
            </select>
            <Textarea label="Code" minRows={10} value={block.code} onChange={(event) => updateBlock<CodeSnippetBlock>(index, (current) => ({ ...current, code: event.target.value }))} />
        </div>
    );

    const renderTextEditor = (block: TextBlock, index: number) => (
        <div className="space-y-3">
            <Input label="Title" value={block.title} onChange={(event) => updateBlock<TextBlock>(index, (current) => ({ ...current, title: event.target.value }))} />
            <label className="block text-sm font-medium">Format</label>
            <select value={block.format || "markdown"} onChange={(event) => updateBlock<TextBlock>(index, (current) => ({ ...current, format: event.target.value as TextBlockFormat }))} className="w-full rounded-lg border border-default-200 bg-background px-3 py-2 text-sm">
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="plain">Plain Text</option>
            </select>
            <Textarea label="Content" minRows={8} value={block.content} onChange={(event) => updateBlock<TextBlock>(index, (current) => ({ ...current, content: event.target.value }))} />
        </div>
    );

    const renderCodeBlockEditor = (block: CodeBlock, index: number) => (
        <div className="space-y-4">
            <Input label="Title" value={block.title} onChange={(event) => updateBlock<CodeBlock>(index, (current) => ({ ...current, title: event.target.value }))} />
            <Textarea label="Description" minRows={3} value={block.description || ""} onChange={(event) => updateBlock<CodeBlock>(index, (current) => ({ ...current, description: event.target.value }))} />

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Steps</h4>
                    <Button size="sm" variant="flat" onClick={() => updateBlock<CodeBlock>(index, (current) => ({ ...current, steps: [...current.steps, { lineNumber: current.steps.length + 1, description: "New step", code: "", language: CodeBlockLanguage.JavaScript }] }))}>
                        Add Step
                    </Button>
                </div>

                <div className="space-y-3">
                    {block.steps.map((step, stepIndex) => (
                        <Card key={stepIndex} className="border border-default-200">
                            <CardBody className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-semibold">Step {stepIndex + 1}</span>
                                    <Button size="sm" variant="flat" onClick={() => updateBlock<CodeBlock>(index, (current) => ({ ...current, steps: current.steps.filter((_, currentStepIndex) => currentStepIndex !== stepIndex) }))}>
                                        Remove
                                    </Button>
                                </div>
                                <Input label="Description" value={step.description} onChange={(event) => updateBlock<CodeBlock>(index, (current) => ({ ...current, steps: current.steps.map((currentStep, currentStepIndex) => (currentStepIndex === stepIndex ? { ...currentStep, description: event.target.value } : currentStep)) }))} />
                                <Input label="Code" value={step.code} onChange={(event) => updateBlock<CodeBlock>(index, (current) => ({ ...current, steps: current.steps.map((currentStep, currentStepIndex) => (currentStepIndex === stepIndex ? { ...currentStep, code: event.target.value } : currentStep)) }))} />
                                <label className="block text-sm font-medium">Language</label>
                                <select value={step.language} onChange={(event) => updateBlock<CodeBlock>(index, (current) => ({ ...current, steps: current.steps.map((currentStep, currentStepIndex) => (currentStepIndex === stepIndex ? { ...currentStep, language: event.target.value as CodeBlockLanguage } : currentStep)) }))} className="w-full rounded-lg border border-default-200 bg-background px-3 py-2 text-sm">
                                    {CODE_LANGUAGES.map((language) => (
                                        <option key={language} value={language}>
                                            {language}
                                        </option>
                                    ))}
                                </select>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStepsEditor = (block: StepsBlock, index: number) => (
        <div className="space-y-4">
            <Input label="Title" value={block.title} onChange={(event) => updateBlock<StepsBlock>(index, (current) => ({ ...current, title: event.target.value }))} />
            <Textarea label="Description" minRows={3} value={block.description || ""} onChange={(event) => updateBlock<StepsBlock>(index, (current) => ({ ...current, description: event.target.value }))} />

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">Steps</h4>
                    <Button size="sm" variant="flat" onClick={() => updateBlock<StepsBlock>(index, (current) => ({ ...current, steps: [...current.steps, { stepNumber: current.steps.length + 1, title: "New Step", description: "Describe this step" }] }))}>
                        Add Step
                    </Button>
                </div>

                {block.steps.map((step, stepIndex) => (
                    <Card key={stepIndex} className="border border-default-200">
                        <CardBody className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold">Step {stepIndex + 1}</span>
                                <Button size="sm" variant="flat" onClick={() => updateBlock<StepsBlock>(index, (current) => ({ ...current, steps: current.steps.filter((_, currentStepIndex) => currentStepIndex !== stepIndex) }))}>
                                    Remove
                                </Button>
                            </div>
                            <Input label="Step Title" value={step.title} onChange={(event) => updateBlock<StepsBlock>(index, (current) => ({ ...current, steps: current.steps.map((currentStep, currentStepIndex) => (currentStepIndex === stepIndex ? { ...currentStep, title: event.target.value } : currentStep)) }))} />
                            <Textarea label="Description" minRows={2} value={step.description} onChange={(event) => updateBlock<StepsBlock>(index, (current) => ({ ...current, steps: current.steps.map((currentStep, currentStepIndex) => (currentStepIndex === stepIndex ? { ...currentStep, description: event.target.value } : currentStep)) }))} />
                            <Input label="Code" value={step.code || ""} onChange={(event) => updateBlock<StepsBlock>(index, (current) => ({ ...current, steps: current.steps.map((currentStep, currentStepIndex) => (currentStepIndex === stepIndex ? { ...currentStep, code: event.target.value } : currentStep)) }))} />
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    );

    const renderTableEditor = (block: TableBlock, index: number) => {
        return (
            <div className="space-y-4">
                <Input label="Title" value={block.title} onChange={(event) => updateBlock<TableBlock>(index, (current) => ({ ...current, title: event.target.value }))} />
                <Textarea label="Description" minRows={3} value={block.description || ""} onChange={(event) => updateBlock<TableBlock>(index, (current) => ({ ...current, description: event.target.value }))} />

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold">Columns</h4>
                        <Button size="sm" variant="flat" onClick={() => updateBlock<TableBlock>(index, (current) => ({ ...current, columns: [...current.columns, { header: `Column ${current.columns.length + 1}`, key: `col${current.columns.length + 1}`, type: "text" }] }))}>
                            Add Column
                        </Button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-default-200">
                        <table className="w-full border-collapse text-sm">
                            <thead className="bg-default-100">
                                <tr>
                                    <th className="border-b border-default-200 px-3 py-2 text-left">Row</th>
                                    {block.columns.map((column, columnIndex) => (
                                        <th key={columnIndex} className="min-w-[180px] border-b border-default-200 p-2 align-top">
                                            <div className="space-y-2">
                                                <Input
                                                    size="sm"
                                                    label="Header"
                                                    value={column.header}
                                                    onChange={(event) => updateBlock<TableBlock>(index, (current) => ({ ...current, columns: current.columns.map((currentColumn, currentColumnIndex) => (currentColumnIndex === columnIndex ? { ...currentColumn, header: event.target.value } : currentColumn)) }))}
                                                />
                                                <Input
                                                    size="sm"
                                                    label="Key"
                                                    value={column.key}
                                                    onChange={(event) => updateBlock<TableBlock>(index, (current) => ({ ...current, columns: current.columns.map((currentColumn, currentColumnIndex) => (currentColumnIndex === columnIndex ? { ...currentColumn, key: event.target.value } : currentColumn)) }))}
                                                />
                                                <div className="flex gap-2">
                                                    <select value={column.type || "text"} onChange={(event) => updateBlock<TableBlock>(index, (current) => ({ ...current, columns: current.columns.map((currentColumn, currentColumnIndex) => (currentColumnIndex === columnIndex ? { ...currentColumn, type: event.target.value as TableColumnType } : currentColumn)) }))} className="w-full rounded-lg border border-default-200 bg-background px-2 py-2 text-sm">
                                                        <option value="text">Text</option>
                                                        <option value="number">Number</option>
                                                        <option value="boolean">Boolean</option>
                                                        <option value="date">Date</option>
                                                    </select>
                                                    <Button size="sm" variant="flat" color="danger" onClick={() => updateBlock<TableBlock>(index, (current) => ({ ...current, columns: current.columns.filter((_, currentColumnIndex) => currentColumnIndex !== columnIndex) }))}>
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {block.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="align-top odd:bg-background even:bg-default-50">
                                        <td className="border-b border-default-200 px-3 py-3 font-medium">{rowIndex + 1}</td>
                                        {block.columns.map((column, columnIndex) => (
                                            <td key={columnIndex} className="border-b border-default-200 p-2 align-top">
                                                <Textarea
                                                    minRows={2}
                                                    value={String(row[column.key] ?? "")}
                                                    onChange={(event) =>
                                                        updateBlock<TableBlock>(index, (current) => ({
                                                            ...current,
                                                            rows: current.rows.map((currentRow, currentRowIndex) =>
                                                                currentRowIndex === rowIndex ? { ...currentRow, [column.key]: event.target.value } : currentRow
                                                            )
                                                        }))
                                                    }
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Button
                        size="sm"
                        variant="flat"
                        onClick={() =>
                            updateBlock<TableBlock>(index, (current) => ({
                                ...current,
                                rows: [
                                    ...current.rows,
                                    current.columns.reduce<Record<string, any>>((row, column) => {
                                        row[column.key] = "";
                                        return row;
                                    }, {})
                                ]
                            }))
                        }>
                        Add Row
                    </Button>
                </div>
            </div>
        );
    };

    const renderImageEditor = (block: ImageBlock, index: number) => (
        <div className="space-y-3">
            <Input label="Title" value={block.title || ""} onChange={(event) => updateBlock<ImageBlock>(index, (current) => ({ ...current, title: event.target.value }))} />
            <Input label="Description" value={block.description || ""} onChange={(event) => updateBlock<ImageBlock>(index, (current) => ({ ...current, description: event.target.value }))} />
            <Input label="Image URL / CDN Asset ID" value={block.imageUrl} onChange={(event) => updateBlock<ImageBlock>(index, (current) => ({ ...current, imageUrl: event.target.value }))} />
            <Input label="Caption" value={block.caption || ""} onChange={(event) => updateBlock<ImageBlock>(index, (current) => ({ ...current, caption: event.target.value }))} />
        </div>
    );

    const renderBlockEditor = (block: ContentBlock, index: number) => {
        const label = getBlockLabel(block);

        return (
            <Card key={`${block.type}-${index}`} className="border border-default-200">
                <CardBody className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-default-500">{block.type}</p>
                            <h4 className="text-base font-semibold">{label}</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                size="sm"
                                variant="flat"
                                draggable
                                onDragStart={() => setDraggedBlockIndex(index)}
                                onDragEnd={() => setDraggedBlockIndex(null)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => draggedBlockIndex !== null && moveBlockToIndex(draggedBlockIndex, index)}>
                                Drag
                            </Button>
                            <Button size="sm" variant="flat" isDisabled={index === 0} onClick={() => moveBlock(index, -1)}>
                                Up
                            </Button>
                            <Button size="sm" variant="flat" isDisabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)}>
                                Down
                            </Button>
                            <Button size="sm" color="danger" variant="flat" onClick={() => removeBlock(index)}>
                                Remove
                            </Button>
                        </div>
                    </div>

                    {isCodeSnippetBlock(block) && renderCodeSnippetEditor(block, index)}
                    {isCodeBlock(block) && renderCodeBlockEditor(block, index)}
                    {isStepsBlock(block) && renderStepsEditor(block, index)}
                    {isTableBlock(block) && renderTableEditor(block, index)}
                    {isTextBlock(block) && renderTextEditor(block, index)}
                    {isImageBlock(block) && renderImageEditor(block, index)}
                </CardBody>
            </Card>
        );
    };

    const previewAssignment: AssignmentDocument = {
        assignmentNo: formData.assignmentNo || "ASS001",
        assignmentTitle: formData.assignmentTitle || "Assignment Preview",
        studentName: formData.studentName || "Student Name",
        studentEnrollmentNo: formData.studentEnrollmentNo || "Enrollment No",
        subject: formData.subject || undefined,
        subjectCode: formData.subjectCode || undefined,
        description: formData.description || undefined,
        privacy: formData.privacy,
        watermarkEnabled: formData.watermarkEnabled,
        tags: formData.tags,
        blocks,
        ownerId: assignment?.ownerId || "preview-owner",
        ownerEmail: assignment?.ownerEmail || "preview@example.com",
        ownerName: assignment?.ownerName || "Preview Owner",
        views: assignment?.views || 0,
        downloads: assignment?.downloads || 0,
        shares: assignment?.shares || 0,
        version: assignment?.version || 1,
        createdAt: assignment?.createdAt || new Date(),
        updatedAt: assignment?.updatedAt,
        signatureHash: assignment?.signatureHash
    };

    return (
        <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input label="Assignment No" name="assignmentNo" value={formData.assignmentNo} onChange={handleInputChange} placeholder="e.g., ASS001" required />
                <Input label="Assignment Title" name="assignmentTitle" value={formData.assignmentTitle} onChange={handleInputChange} placeholder="Enter assignment title" required />
                <Input label="Student Name" name="studentName" value={formData.studentName} onChange={handleInputChange} placeholder="Enter student name" required />
                <Input label="Enrollment No" name="studentEnrollmentNo" value={formData.studentEnrollmentNo} onChange={handleInputChange} placeholder="Enter enrollment number" required />
                <Input label="Subject (Optional)" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="Enter subject name" />
                <Input label="Subject Code (Optional)" name="subjectCode" value={formData.subjectCode} onChange={handleInputChange} placeholder="Enter subject code" />
            </div>

            <Textarea label="Description (Optional)" name="description" value={formData.description} onChange={handleInputChange} placeholder="Enter assignment description" minRows={3} />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium">Privacy</label>
                    <select name="privacy" value={formData.privacy} onChange={handleSelectChange} className="w-full rounded-lg border border-default-200 bg-background px-3 py-2 text-sm">
                        <option value={AssignmentPrivacy.Private}>Private</option>
                        <option value={AssignmentPrivacy.Unlisted}>Unlisted</option>
                        <option value={AssignmentPrivacy.Public}>Public</option>
                    </select>
                </div>

                <div className="flex items-center">
                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" name="watermarkEnabled" checked={formData.watermarkEnabled} onChange={handleInputChange} />
                        <span className="text-sm">Enable Watermark</span>
                    </label>
                </div>
            </div>

            <Card>
                <CardBody>
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Tags</label>
                        <div className="flex gap-2">
                            <Input size="sm" placeholder="Add a tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} />
                            <Button size="sm" onClick={addTag}>
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag) => (
                                <Chip key={tag} onClose={() => removeTag(tag)}>
                                    {tag}
                                </Chip>
                            ))}
                        </div>
                    </div>
                </CardBody>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card>
                    <CardBody>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-lg font-semibold">Content Blocks</h3>
                                <p className="text-sm text-default-500">Add blocks, edit content, and reorder them.</p>
                            </div>

                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => addBlock(BlockType.CodeSnippet)} color="primary" variant="flat">Add Code Snippet</Button>
                            <Button size="sm" onClick={() => addBlock(BlockType.CodeBlock)} color="primary" variant="flat">Add Code Block</Button>
                            <Button size="sm" onClick={() => addBlock(BlockType.TextBlock)} color="primary" variant="flat">Add Text</Button>
                            <Button size="sm" onClick={() => addBlock(BlockType.StepsBlock)} color="primary" variant="flat">Add Steps</Button>
                            <Button size="sm" onClick={() => addBlock(BlockType.Table)} color="primary" variant="flat">Add Table</Button>
                            <Button size="sm" onClick={() => addBlock(BlockType.Image)} color="primary" variant="flat">Add Image</Button>
                        </div>

                            {blocks.length === 0 ? <p className="text-sm text-default-500">No content blocks added yet</p> : <div className="space-y-4">{blocks.map((block, index) => renderBlockEditor(block, index))}</div>}
                        </div>
                    </CardBody>
                </Card>

                <Card className="h-fit xl:sticky xl:top-6">
                    <CardBody>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold">Live Preview</h3>
                                <p className="text-sm text-default-500">Updates as you edit.</p>
                            </div>
                        </div>
                        <div className="max-h-[75vh] overflow-auto rounded-xl border border-default-200">
                            <AssignmentViewer assignment={previewAssignment} canDownload={false} canShare={false} canEdit={false} />
                        </div>
                    </CardBody>
                </Card>
            </div>

            <div className="flex justify-end gap-3">
                <Button color="default" variant="flat" onClick={() => window.history.back()}>Cancel</Button>
                <Button color="primary" onPress={handleSave} isLoading={isLoading}>{assignment ? "Update Assignment" : "Create Assignment"}</Button>
            </div>
        </div>
    );
};
