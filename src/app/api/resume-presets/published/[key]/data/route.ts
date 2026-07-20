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

        const selectedIds = preset.selectedIdsByCategory || {};
        const populatedData: any = {
            projects: [],
            skills: [],
            education: [],
            experience: [],
            certificates: [],
            testScores: []
        };

        // Fetch populated data using the selected IDs
        if (selectedIds.projects && selectedIds.projects.length > 0) {
            populatedData.projects = await Project_Model().find({ ProjectID: { $in: selectedIds.projects } }).lean();
        }
        if (selectedIds.skills && selectedIds.skills.length > 0) {
            populatedData.skills = await Skill_Model().find({ SkillID: { $in: selectedIds.skills } }).lean();
        }
        if (selectedIds.education && selectedIds.education.length > 0) {
            populatedData.education = await Education_Model().find({ EducationID: { $in: selectedIds.education } }).lean();
        }
        if (selectedIds.experience && selectedIds.experience.length > 0) {
            populatedData.experience = await Experience_Model().find({ ExperienceID: { $in: selectedIds.experience } }).lean();
        }
        if (selectedIds.certificates && selectedIds.certificates.length > 0) {
            populatedData.certificates = await Certificate_Model().find({ CertificateID: { $in: selectedIds.certificates } }).lean();
        }
        if (selectedIds.testScores && selectedIds.testScores.length > 0) {
            populatedData.testScores = await TestScore_Model().find({ TestScoreID: { $in: selectedIds.testScores } }).lean();
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
