/**
 * portfolioCache.ts
 * Next.js unstable_cache wrappers for all Portfolio models.
 * All responses are cached for 12 h (ISR aligned) and tagged for
 * on-demand revalidation from admin API routes.
 */

import { unstable_cache } from "next/cache";
import dbConnect from "@Utils/dbConnect";
import {
    Project_Model,
    Skill_Model,
    Education_Model,
    Experience_Model,
    Certificate_Model,
    TestScore_Model
} from "@Models/Portfolio";

const TTL = 43200; // 12 hours

/** Single project by slug */
export const cachedProjectBySlug = (slug: string) =>
    unstable_cache(
        async () => {
            await dbConnect();
            const doc = await Project_Model()
                .findOne({ Slug: slug, isDeleted: false })
                .lean();
            return doc ? JSON.parse(JSON.stringify(doc)) : null;
        },
        [`project-${slug}`],
        { revalidate: TTL, tags: ["projects", `project-${slug}`] }
    )();

/** All visible projects ordered by Order asc, newest first */
export const cachedProjects = unstable_cache(
    async () => {
        await dbConnect();
        const docs = await Project_Model()
            .find({ isDeleted: false })
            .sort({ Order: 1, createdAt: -1 })
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["all-projects"],
    { revalidate: TTL, tags: ["projects"] }
);

/** All skills ordered by Order */
export const cachedSkills = unstable_cache(
    async () => {
        await dbConnect();
        const docs = await Skill_Model()
            .find({ isDeleted: false, Visible: true })
            .sort({ Order: 1 })
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["all-skills"],
    { revalidate: TTL, tags: ["skills"] }
);

/** All education ordered by StartDate desc */
export const cachedEducation = unstable_cache(
    async () => {
        await dbConnect();
        const docs = await Education_Model()
            .find({ isDeleted: false })
            .sort({ StartDate: -1 })
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["all-education"],
    { revalidate: TTL, tags: ["education"] }
);

/** All experience ordered by StartDate desc */
export const cachedExperience = unstable_cache(
    async () => {
        await dbConnect();
        const docs = await Experience_Model()
            .find({ isDeleted: false })
            .sort({ StartDate: -1 })
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["all-experience"],
    { revalidate: TTL, tags: ["experience"] }
);

/** All certificates ordered by IssuedDate desc */
export const cachedCertificates = unstable_cache(
    async () => {
        await dbConnect();
        const docs = await Certificate_Model()
            .find({ isDeleted: false })
            .sort({ IssuedDate: -1, Order: 1 })
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["all-certificates"],
    { revalidate: TTL, tags: ["certificates"] }
);

/** All test scores ordered by Year desc */
export const cachedTestScores = unstable_cache(
    async () => {
        await dbConnect();
        const docs = await TestScore_Model()
            .find({ isDeleted: false })
            .sort({ Year: -1, Order: 1 })
            .lean();
        return JSON.parse(JSON.stringify(docs));
    },
    ["all-test-scores"],
    { revalidate: TTL, tags: ["test-scores"] }
);
