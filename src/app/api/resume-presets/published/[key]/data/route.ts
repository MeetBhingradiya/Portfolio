import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@Utils/dbConnect";
import { ResumePreset } from "@Models/ResumePreset";
import {
    Project_Model,
    Skill_Model,
    Education_Model,
    Experience_Model,
    Certificate_Model,
    TestScore_Model
} from "@Models/Portfolio";

type Params = { params: Promise<{ key: string }> };

export async function GET(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();
        
        const { key } = await params;
        const preset = await ResumePreset.findOne({ key, isPublished: true }).lean();
        
        if (!preset) {
            return NextResponse.json({ success: false, error: "Preset not found or not published" }, { status: 404 });
        }

        const selectedIds = preset.selectedIdsByCategory || preset.pinnedIdsByCategory || {};
        const itemOrder = preset.itemOrderByCategory || preset.pinnedIdsByCategory || {};
        const populatedData: any = {
            projects: [],
            skills: [],
            education: [],
            experience: [],
            certificates: [],
            testScores: []
        };

        const sortItems = (items: any[], cat: string) => {
            const order = itemOrder[cat] || [];
            const idField = cat === "skills" ? "SkillID" : cat === "education" ? "EducationID" : cat === "experience" ? "ExperienceID" : cat === "certificates" ? "CertificateID" : cat === "testScores" ? "TestScoreID" : "ProjectID";
            return items.sort((a, b) => {
                const idA = a[idField] || a._id;
                const idB = b[idField] || b._id;
                const idxA = order.indexOf(String(idA));
                const idxB = order.indexOf(String(idB));
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return 0;
            });
        };

        // Fetch populated data using the selected IDs
        if (selectedIds.projects && selectedIds.projects.length > 0) {
            const items = await Project_Model().find({ ProjectID: { $in: selectedIds.projects } }).lean();
            populatedData.projects = sortItems(items, "projects");
        }
        if (selectedIds.skills && selectedIds.skills.length > 0) {
            const items = await Skill_Model().find({ SkillID: { $in: selectedIds.skills } }).lean();
            populatedData.skills = sortItems(items, "skills");
        }
        if (selectedIds.education && selectedIds.education.length > 0) {
            const items = await Education_Model().find({ EducationID: { $in: selectedIds.education } }).lean();
            populatedData.education = sortItems(items, "education");
        }
        if (selectedIds.experience && selectedIds.experience.length > 0) {
            const items = await Experience_Model().find({ ExperienceID: { $in: selectedIds.experience } }).lean();
            populatedData.experience = sortItems(items, "experience");
        }
        if (selectedIds.certificates && selectedIds.certificates.length > 0) {
            const items = await Certificate_Model().find({ CertificateID: { $in: selectedIds.certificates } }).lean();
            populatedData.certificates = sortItems(items, "certificates");
        }
        if (selectedIds.testScores && selectedIds.testScores.length > 0) {
            const items = await TestScore_Model().find({ TestScoreID: { $in: selectedIds.testScores } }).lean();
            populatedData.testScores = sortItems(items, "testScores");
        }

        return NextResponse.json({ 
            success: true, 
            data: {
                preset,
                populatedData

            } 
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message || "Failed to fetch preset data" }, { status: 500 });
    }
}
