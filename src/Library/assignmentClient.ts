/**
 * Assignment API Client Utility
 * Helper functions for API interactions with the Assignment System
 */

import { AssignmentDocument, AssignmentPermission } from "@/Types/Assignment";

interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ── CRUD Operations ──────────────────────────────────────────────

export async function fetchAssignment(id: string): Promise<AssignmentDocument> {
    const res = await fetch(`/api/assignments?id=${id}`);
    const data: APIResponse<AssignmentDocument> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch assignment");
    return data.data!;
}

export async function fetchMyAssignments(limit = 20, skip = 0): Promise<{ data: AssignmentDocument[]; total: number }> {
    const res = await fetch(`/api/assignments?mine=true&limit=${limit}&skip=${skip}`);
    const data: APIResponse<{ data: AssignmentDocument[]; total: number }> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to fetch assignments");
    return data.data!;
}

export async function searchAssignments(
    query: string,
    limit = 20,
    skip = 0,
    tag?: string
): Promise<{ data: AssignmentDocument[]; total: number }> {
    const params = new URLSearchParams({ search: query, limit: limit.toString(), skip: skip.toString() });
    if (tag) params.append("tag", tag);

    const res = await fetch(`/api/assignments?${params}`);
    const data: APIResponse<{ data: AssignmentDocument[]; total: number }> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to search assignments");
    return data.data!;
}

export async function createAssignment(assignment: Partial<AssignmentDocument>): Promise<AssignmentDocument> {
    const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignment)
    });
    const data: APIResponse<AssignmentDocument> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to create assignment");
    return data.data!;
}

export async function updateAssignment(id: string, updates: Partial<AssignmentDocument>): Promise<AssignmentDocument> {
    const res = await fetch(`/api/assignments?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
    });
    const data: APIResponse<AssignmentDocument> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to update assignment");
    return data.data!;
}

export async function deleteAssignment(id: string, permanent = false): Promise<void> {
    const res = await fetch(`/api/assignments?id=${id}&permanent=${permanent}`, { method: "DELETE" });
    const data: APIResponse<void> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to delete assignment");
}

export async function restoreAssignment(id: string): Promise<AssignmentDocument> {
    const res = await fetch(`/api/assignments?id=${id}&action=restore`, { method: "PATCH" });
    const data: APIResponse<AssignmentDocument> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to restore assignment");
    return data.data!;
}

// ── Sharing ───────────────────────────────────────────────────────

export async function shareAssignmentWithUser(
    assignmentId: string,
    userId: string,
    email: string,
    permissions: AssignmentPermission[],
    name?: string
): Promise<AssignmentDocument> {
    const res = await fetch(`/api/assignments/share?id=${assignmentId}&action=share-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email, name, permissions })
    });
    const data: APIResponse<AssignmentDocument> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to share assignment");
    return data.data!;
}

export interface ShareLinkResponse {
    shareLink: any;
    shareUrl: string;
    token: string;
}

export async function generateShareLink(
    assignmentId: string,
    expiresIn?: number,
    allowDownload = true
): Promise<ShareLinkResponse> {
    const res = await fetch(`/api/assignments/share?id=${assignmentId}&action=share-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn, allowDownload })
    });
    const data: APIResponse<ShareLinkResponse> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to generate share link");
    return data.data!;
}

export async function revokeUserAccess(assignmentId: string, userId: string): Promise<void> {
    const res = await fetch(`/api/assignments/share?id=${assignmentId}&userId=${userId}`, { method: "DELETE" });
    const data: APIResponse<void> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to revoke access");
}

export async function deleteShareLink(assignmentId: string, tokenId: string): Promise<void> {
    const res = await fetch(`/api/assignments/share?id=${assignmentId}&tokenId=${tokenId}`, { method: "DELETE" });
    const data: APIResponse<void> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to delete share link");
}

export async function accessSharedAssignment(token: string): Promise<{ assignment: AssignmentDocument; shareLink: any }> {
    const res = await fetch(`/api/assignments/share?token=${token}`);
    const data: APIResponse<{ assignment: AssignmentDocument; shareLink: any }> = await res.json();
    if (!data.success) throw new Error(data.error || "Failed to access shared assignment");
    return data.data!;
}

// ── PDF Export ───────────────────────────────────────────────────

export async function exportAssignmentPDF(assignmentId: string): Promise<void> {
    const res = await fetch(`/api/assignments/export/pdf?id=${assignmentId}`);
    if (!res.ok) throw new Error("Failed to export PDF");

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assignment_${assignmentId}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
}

export async function exportAssignmentPDFAsStream(assignmentId: string): Promise<Blob> {
    const res = await fetch(`/api/assignments/export/pdf?id=${assignmentId}`);
    if (!res.ok) throw new Error("Failed to export PDF");
    return res.blob();
}
