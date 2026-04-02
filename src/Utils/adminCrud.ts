/**
 * Generic CRUD helpers for admin API routes.
 * Each resource route calls these with its model and ID field name.
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import mongoose from "mongoose";
import dbConnect from "@Utils/dbConnect";
import { requireAdmin } from "@Library/auth";

type ModelFn = () => mongoose.Model<any>;

function notFound(id: string) {
    return NextResponse.json({ success: false, error: "Not found", id }, { status: 404 });
}

function forbidden() {
    return NextResponse.json({ success: false, error: "Admin only" }, { status: 403 });
}

function serverError(err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export async function adminGetAll(
    request: NextRequest,
    modelFn: ModelFn,
    opts?: {
        searchFields?: string[];
        defaultSort?: Record<string, 1 | -1>;
    }
) {
    try {
        await requireAdmin(request.headers);
        await dbConnect();

        const q = request.nextUrl.searchParams;
        const page = Math.max(1, parseInt(q.get("page") || "1"));
        const limit = Math.min(100, parseInt(q.get("limit") || "20"));
        const search = q.get("search") || "";

        const Model = modelFn();
        const query: any = { isDeleted: { $ne: true } };

        if (search && opts?.searchFields?.length) {
            query.$or = opts.searchFields.map((f) => ({
                [f]: { $regex: search, $options: "i" }
            }));
        }

        const total = await Model.countDocuments(query);
        const data = await Model.find(query)
            .sort(opts?.defaultSort || { createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") return forbidden();
        return serverError(err);
    }
}

export async function adminCreate(request: NextRequest, modelFn: ModelFn, tags: string[] = []) {
    try {
        await requireAdmin(request.headers);
        await dbConnect();
        const body = await request.json();
        const Model = modelFn();
        const doc = await Model.create(body);
        tags.forEach((t) => revalidateTag(t, "max"));
        return NextResponse.json({ success: true, data: doc }, { status: 201 });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") return forbidden();
        return serverError(err);
    }
}

export async function adminUpdate(request: NextRequest, modelFn: ModelFn, idField: string, id: string, tags: string[] = []) {
    try {
        await requireAdmin(request.headers);
        await dbConnect();
        const body = await request.json();
        const Model = modelFn();
        const doc = await Model.findOneAndUpdate({ [idField]: id, isDeleted: { $ne: true } }, body, { new: true, runValidators: true });
        if (!doc) return notFound(id);
        tags.forEach((t) => revalidateTag(t, "max"));
        return NextResponse.json({ success: true, data: doc });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") return forbidden();
        return serverError(err);
    }
}

export async function adminDelete(request: NextRequest, modelFn: ModelFn, idField: string, id: string, tags: string[] = []) {
    try {
        await requireAdmin(request.headers);
        await dbConnect();
        const Model = modelFn();
        const doc = await Model.findOneAndUpdate({ [idField]: id }, { isDeleted: true }, { new: true });
        if (!doc) return notFound(id);
        tags.forEach((t) => revalidateTag(t, "max"));
        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (err: any) {
        if (err?.message === "Forbidden: Admin only") return forbidden();
        return serverError(err);
    }
}
