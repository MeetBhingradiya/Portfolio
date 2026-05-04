/**
 * AssignmentEditor Component
 * Main component for creating and editing assignment documents
 */

"use client";

import React, { useState, useCallback } from "react";
import { Button, Input, Textarea, Select, SelectItem, Card, CardBody, Chip } from "@heroui/react";
import { AssignmentPrivacy, BlockType, CodeBlockLanguage, ContentBlock, AssignmentDocument } from "@/Types/Assignment";

interface AssignmentEditorProps {
    assignment?: AssignmentDocument;
    onSave?: (assignment: Partial<AssignmentDocument>) => Promise<void>;
    isLoading?: boolean;
}

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as any;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
            setFormData((prev) => ({
                ...prev,
                tags: [...prev.tags, newTag.trim()]
            }));
            setNewTag("");
        }
    };

    const removeTag = (tag: string) => {
        setFormData((prev) => ({
            ...prev,
            tags: prev.tags.filter((t) => t !== tag)
        }));
    };

    const addCodeSnippetBlock = () => {
        const newBlock: ContentBlock = {
            type: BlockType.CodeSnippet,
            code: "// Enter your code here",
            language: CodeBlockLanguage.JavaScript,
            description: "Code snippet"
        };
        setBlocks([...blocks, newBlock]);
    };

    const addTextBlock = () => {
        const newBlock: ContentBlock = {
            type: BlockType.TextBlock,
            title: "New Text Block",
            content: "Enter your text content here",
            format: "markdown"
        };
        setBlocks([...blocks, newBlock]);
    };

    const addStepsBlock = () => {
        const newBlock: ContentBlock = {
            type: BlockType.StepsBlock,
            title: "Steps",
            description: "Follow these steps:",
            steps: [
                {
                    stepNumber: 1,
                    title: "Step 1",
                    description: "Description of step 1"
                }
            ]
        };
        setBlocks([...blocks, newBlock]);
    };

    const addTableBlock = () => {
        const newBlock: ContentBlock = {
            type: BlockType.Table,
            title: "Table",
            columns: [
                { header: "Column 1", key: "col1", type: "text" },
                { header: "Column 2", key: "col2", type: "text" }
            ],
            rows: [
                { col1: "Data 1", col2: "Data 2" }
            ]
        };
        setBlocks([...blocks, newBlock]);
    };

    const removeBlock = (index: number) => {
        setBlocks(blocks.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!formData.assignmentNo || !formData.assignmentTitle || !formData.studentName || !formData.studentEnrollmentNo) {
            alert("Please fill in all required fields");
            return;
        }

        if (blocks.length === 0) {
            alert("Please add at least one content block");
            return;
        }

        try {
            await onSave?.({
                ...formData,
                blocks
            });
        } catch (error) {
            console.error("Failed to save assignment:", error);
            alert("Failed to save assignment");
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Assignment No"
                    name="assignmentNo"
                    value={formData.assignmentNo}
                    onChange={handleInputChange}
                    placeholder="e.g., ASS001"
                    required
                />
                <Input
                    label="Assignment Title"
                    name="assignmentTitle"
                    value={formData.assignmentTitle}
                    onChange={handleInputChange}
                    placeholder="Enter assignment title"
                    required
                />
                <Input
                    label="Student Name"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    placeholder="Enter student name"
                    required
                />
                <Input
                    label="Enrollment No"
                    name="studentEnrollmentNo"
                    value={formData.studentEnrollmentNo}
                    onChange={handleInputChange}
                    placeholder="Enter enrollment number"
                    required
                />
                <Input
                    label="Subject (Optional)"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Enter subject name"
                />
                <Input
                    label="Subject Code (Optional)"
                    name="subjectCode"
                    value={formData.subjectCode}
                    onChange={handleInputChange}
                    placeholder="Enter subject code"
                />
            </div>

            <Textarea
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter assignment description"
                minRows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Privacy</label>
                    <select
                        name="privacy"
                        value={formData.privacy}
                        onChange={handleSelectChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value={AssignmentPrivacy.Private}>Private</option>
                        <option value={AssignmentPrivacy.Unlisted}>Unlisted</option>
                        <option value={AssignmentPrivacy.Public}>Public</option>
                    </select>
                </div>

                <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            name="watermarkEnabled"
                            checked={formData.watermarkEnabled}
                            onChange={handleInputChange}
                            className="mr-2"
                        />
                        <span className="text-sm">Enable Watermark</span>
                    </label>
                </div>
            </div>

            {/* Tags Section */}
            <Card>
                <CardBody>
                    <div className="space-y-3">
                        <label className="text-sm font-medium">Tags</label>
                        <div className="flex gap-2">
                            <Input
                                size="sm"
                                placeholder="Add a tag"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && addTag()}
                            />
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

            {/* Content Blocks */}
            <Card>
                <CardBody>
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Content Blocks</h3>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={addCodeSnippetBlock} color="primary" variant="flat">
                                Add Code Snippet
                            </Button>
                            <Button size="sm" onClick={addTextBlock} color="primary" variant="flat">
                                Add Text
                            </Button>
                            <Button size="sm" onClick={addStepsBlock} color="primary" variant="flat">
                                Add Steps
                            </Button>
                            <Button size="sm" onClick={addTableBlock} color="primary" variant="flat">
                                Add Table
                            </Button>
                        </div>

                        {blocks.length === 0 ? (
                            <p className="text-gray-500 text-sm">No content blocks added yet</p>
                        ) : (
                            <div className="space-y-3">
                                {blocks.map((block, index) => (
                                    <div key={index} className="p-3 bg-gray-100 rounded-md flex justify-between items-center">
                                        <div>
                                            <span className="font-medium">{block.type}</span>
                                            {(block as any).title && <span className="ml-2 text-gray-600">- {(block as any).title}</span>}
                                        </div>
                                        <Button size="sm" isIconOnly color="danger" variant="flat" onClick={() => removeBlock(index)}>
                                            ✕
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
                <Button color="default" variant="flat">
                    Cancel
                </Button>
                <Button color="primary" onClick={handleSave} isLoading={isLoading}>
                    {assignment ? "Update Assignment" : "Create Assignment"}
                </Button>
            </div>
        </div>
    );
};
