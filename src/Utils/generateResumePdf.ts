import { jsPDF } from "jspdf";

type Category = "skills" | "education" | "experience" | "certificates" | "testScores" | "projects";

interface ResumeMeta {
    name: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    github: string;
    linkedin: string;
    summary: string;
}

interface ResumeStyle {
    fontScale: number;
    pagePadding: number;
    accentColor: string;
}

type DataState = Record<Category, any[]>;

const A4_WIDTH_PX = 794;
const DEFAULT_ACCENT = "#23A8F2";

const SECTION_BY_KEY: Record<Category, { label: string }> = {
    projects: { label: "Projects" },
    skills: { label: "Skills" },
    education: { label: "Education" },
    experience: { label: "Experience" },
    certificates: { label: "Certificates" },
    testScores: { label: "Test Scores" }
};

function normalizeTags(value: unknown): string[] {
    const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
    return Array.from(
        new Set(
            values
                .flatMap((entry) => (typeof entry === "string" ? entry.split(",") : []))
                .map((entry) => entry.trim())
                .filter(Boolean)
        )
    ).slice(0, 16);
}

function normalizeUrl(value: unknown): string {
    if (typeof value !== "string") return "";
    const url = value.trim();
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function toPdfText(value: unknown): string {
    return String(value ?? "")
        .replace(/[–—]/g, "-")
        .replace(/[•·]/g, "|")
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/\s+/g, " ")
        .trim();
}

function hexToRgb(hex: string): [number, number, number] {
    const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : DEFAULT_ACCENT;
    return [
        Number.parseInt(normalized.slice(1, 3), 16),
        Number.parseInt(normalized.slice(3, 5), 16),
        Number.parseInt(normalized.slice(5, 7), 16)
    ];
}

export async function generateResumePdf(
    meta: ResumeMeta,
    selectedData: DataState,
    sectionOrder: Category[],
    resumeStyle: ResumeStyle,
    customFileName?: string
) {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // ── Layout constants ──────────────────────────────────────────
    const PW = 210;
    const PH = 297;
    const PX_TO_MM = PW / A4_WIDTH_PX;
    const M = resumeStyle.pagePadding * PX_TO_MM;
    const CW = PW - M * 2;
    const [aR, aG, aB] = hexToRgb(resumeStyle.accentColor);
    const sc = resumeStyle.fontScale;
    let y = M;

    // ── Typography helpers ────────────────────────────────────────
    const mm = (pt: number) => pt * 0.353;
    const lh = (pt: number) => mm(pt) * 1.4;
    const bl = (pt: number) => mm(pt) * 0.78;

    const pageBreak = (need: number) => {
        if (y + need > PH - M) {
            pdf.addPage();
            y = M;
        }
    };

    const style = (weight: "normal" | "bold" | "italic" | "bolditalic", pt: number, r: number, g: number, b: number) => {
        pdf.setFont("helvetica", weight);
        pdf.setFontSize(pt);
        pdf.setTextColor(r, g, b);
    };

    /** Draw inline text at current y (does NOT advance y). */
    const ink = (text: string, x: number, pt: number, align?: "left" | "right") => {
        pdf.text(toPdfText(text), x, y + bl(pt), { align });
    };

    /** Draw wrapped paragraph at x; advances y; returns consumed height. */
    const para = (text: string, x: number, pt: number, w: number = CW - (x - M)) => {
        const lines: string[] = pdf.splitTextToSize(toPdfText(text), w);
        const h = lh(pt);
        let total = 0;
        for (const line of lines) {
            pageBreak(h);
            pdf.text(line, x, y + bl(pt));
            y += h;
            total += h;
        }
        return total;
    };

    /** Draw accent-coloured section heading with underline; advances y. */
    const heading = (title: string) => {
        const pt = 10 * sc;
        pageBreak(lh(pt) + 3);
        style("bold", pt, aR, aG, aB);
        ink(title.toUpperCase(), M, pt);
        y += lh(pt) + 0.5;
        pdf.setDrawColor(224, 224, 224);
        pdf.setLineWidth(0.2);
        pdf.line(M, y, PW - M, y);
        y += 2.5;
    };

    /** Draw wrapped tag chips; advances y. */
    const drawChips = (tags: string[], pt: number = 8 * sc) => {
        if (!tags.length) return;
        const chipH = mm(pt) * 1.8;
        const padX = 2;
        const gap = 1.5;
        let cx = M;
        pageBreak(chipH + 1);

        for (const tag of tags) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(pt);
            const t = toPdfText(tag);
            const tw = pdf.getTextWidth(t);
            const cw = tw + padX * 2;

            if (cx + cw > PW - M && cx > M) {
                cx = M;
                y += chipH + gap * 0.5;
                pageBreak(chipH + 1);
            }

            // Chip background + border
            pdf.setFillColor(245, 247, 250);
            pdf.setDrawColor(215, 219, 224);
            pdf.setLineWidth(0.15);
            pdf.roundedRect(cx, y, cw, chipH, 0.8, 0.8, "FD");

            // Chip label
            pdf.setTextColor(51, 51, 51);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(pt);
            pdf.text(t, cx + padX, y + chipH * 0.65);

            cx += cw + gap;
        }
        y += chipH + 2;
    };

    const fmtDate = (d?: string | Date) =>
        d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "Present";

    // ══════════════════════════════════════════════════════════════
    //  HEADER
    // ══════════════════════════════════════════════════════════════

    // Name
    const namePt = 22 * sc;
    style("bold", namePt, 17, 17, 17);
    ink(meta.name, M, namePt);
    y += lh(namePt);

    // Professional title
    const titPt = 12 * sc;
    style("bold", titPt, aR, aG, aB);
    ink(meta.title, M, titPt);
    y += lh(titPt) + 1;

    // Contact info (text with separators + clickable links)
    const cPt = 8.5 * sc;
    const contacts: { t: string; url?: string }[] = [];
    if (meta.email) contacts.push({ t: meta.email, url: `mailto:${meta.email}` });
    if (meta.phone) contacts.push({ t: meta.phone, url: `tel:${meta.phone.replace(/\s+/g, "")}` });
    if (meta.location) contacts.push({ t: meta.location, url: `tel:${meta.phone.replace(/\s+/g, "")}` });
    if (meta.website) {
        const u = normalizeUrl(meta.website);
        contacts.push({ t: "Portfolio", url: u });
    }
    if (meta.github) {
        const u = normalizeUrl(meta.github);
        contacts.push({ t: "Github", url: u });
    }
    if (meta.linkedin) {
        const u = normalizeUrl(meta.linkedin);
        contacts.push({ t: "Linkedin", url: u });
    }

    if (contacts.length) {
        style("normal", cPt, 85, 85, 85);
        const sep = "  |  ";
        const sw = pdf.getTextWidth(sep);
        let cx = M;

        for (let i = 0; i < contacts.length; i++) {
            const c = contacts[i];
            const t = toPdfText(c.t);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(cPt);
            const tw = pdf.getTextWidth(t);
            const need = (i > 0 && cx > M ? sw : 0) + tw;

            // Wrap to next line if overflow
            if (cx + need > PW - M && cx > M) {
                y += lh(cPt);
                cx = M;
            }

            // Separator
            if (i > 0 && cx > M) {
                pdf.setTextColor(170, 170, 170);
                pdf.text(sep, cx, y + bl(cPt));
                cx += sw;
            }

            // Contact text + optional hyperlink
            pdf.setTextColor(85, 85, 85);
            pdf.text(t, cx, y + bl(cPt));
            if (c.url) {
                pdf.link(cx, y, tw, lh(cPt), { url: c.url });
            }
            cx += tw;
        }
        y += lh(cPt) + 1;
    }

    // Header accent rule
    y += 1;
    pdf.setDrawColor(aR, aG, aB);
    pdf.setLineWidth(0.5);
    pdf.line(M, y, PW - M, y);
    y += 5;

    // ══════════════════════════════════════════════════════════════
    //  SUMMARY
    // ══════════════════════════════════════════════════════════════

    if (meta.summary) {
        heading("Summary");
        const sPt = 9.5 * sc;
        style("normal", sPt, 51, 51, 51);
        para(meta.summary, M, sPt, CW);
        y += 3;
    }

    // ══════════════════════════════════════════════════════════════
    //  BODY SECTIONS (in user-defined order)
    // ══════════════════════════════════════════════════════════════

    for (const cat of sectionOrder) {
        const items = selectedData[cat];
        if (!items?.length) continue;

        const title =
            cat === "certificates" ? "Certifications" : cat === "testScores" ? "Test Scores & Rankings" : SECTION_BY_KEY[cat].label;

        // ── Skills (rendered as chips) ──
        if (cat === "skills") {
            heading(title);
            drawChips(
                items.map((s: any) =>
                    // s.Proficiency != null ? `${s.Name} (${s.Proficiency}%)` : s.Name
                    s.Name
                )
            );
            continue;
        }

        // ── Items with individual entries ──
        items.forEach((item: any, idx: number) => {
            if (idx === 0) heading(title);

            // ── Experience ──
            if (cat === "experience") {
                const tPt = 11 * sc;
                const bPt = 9.5 * sc;
                const sPt2 = 8.5 * sc;
                pageBreak(lh(tPt) + lh(sPt2) + 6);

                // Role - Company … Date
                style("bold", tPt, 17, 17, 17);
                const role = toPdfText(item.Role);
                ink(role, M, tPt);
                const rw = pdf.getTextWidth(role);
                style("normal", 10.5 * sc, aR, aG, aB);
                pdf.text(` - ${toPdfText(item.Company)}`, M + rw, y + bl(tPt));
                style("normal", sPt2, 119, 119, 119);
                ink(
                    `${fmtDate(item.StartDate)} - ${item.CurrentlyWorking ? "Present" : fmtDate(item.EndDate)}`,
                    PW - M,
                    sPt2,
                    "right"
                );
                y += lh(tPt);

                // Location | Employment type
                if (item.Location) {
                    style("normal", sPt2, 119, 119, 119);
                    const loc = item.EmploymentType
                        ? `${item.Location} | ${String(item.EmploymentType).replaceAll("_", " ")}`
                        : item.Location;
                    ink(toPdfText(loc), M, sPt2);
                    y += lh(sPt2);
                }

                // Description
                if (item.Description) {
                    style("normal", bPt, 68, 68, 68);
                    para(item.Description, M, bPt, CW);
                    y += 0.5;
                }

                // Bullet achievements
                if (Array.isArray(item.Achievements) && item.Achievements.length) {
                    style("normal", bPt, 68, 68, 68);
                    for (const ach of item.Achievements) {
                        pageBreak(lh(bPt));
                        pdf.text("\u2022", M + 2, y + bl(bPt));
                        para(ach, M + 5, bPt, CW - 5);
                    }
                    y += 0.5;
                }

                // Tech stack chips
                drawChips(normalizeTags(item.TechStack), 7.5 * sc);
                y += 2;
            }

            // ── Projects ──
            if (cat === "projects") {
                const tPt = 11 * sc;
                const bPt = 9.5 * sc;
                const sPt2 = 8.5 * sc;
                pageBreak(lh(tPt) + 8);

                // Title … Date
                style("bold", tPt, 17, 17, 17);
                ink(toPdfText(item.Title), M, tPt);
                style("normal", sPt2, 119, 119, 119);
                ink(
                    `${fmtDate(item.StartDate)} - ${item.CurrentlyWorking ? "Present" : fmtDate(item.EndDate)}`,
                    PW - M,
                    sPt2,
                    "right"
                );
                y += lh(tPt);

                // Links as clickable text labels
                const linkDefs: [string, unknown][] = [
                    ["GitHub", item.Links?.github],
                    ["Live", item.Links?.live],
                    ["NPM", item.Links?.npm],
                    ["Docs", item.Links?.documentation],
                    ["Demo", item.Links?.demo],
                    ["Chrome Store", item.Links?.chromeWebstore],
                    ["Play Store", item.Links?.playstore]
                ];
                const validLinks = linkDefs.filter(([, v]) => normalizeUrl(v)).map(([label, v]) => ({ label, url: normalizeUrl(v) }));

                if (validLinks.length) {
                    const lPt = 7.5 * sc;
                    let lx = M;
                    for (let li = 0; li < validLinks.length; li++) {
                        const lk = validLinks[li];
                        style("normal", lPt, aR, aG, aB);
                        const lt = toPdfText(lk.label);
                        const ltw = pdf.getTextWidth(lt);
                        const sepText = li < validLinks.length - 1 ? "  " : "";
                        if (lx + ltw > PW - M && lx > M) {
                            y += lh(lPt);
                            lx = M;
                        }
                        pdf.text(lt, lx, y + bl(lPt));
                        pdf.link(lx, y, ltw, lh(lPt), { url: lk.url });
                        lx += ltw + pdf.getTextWidth(sepText);
                    }
                    y += lh(lPt) + 0.5;
                }

                // Description
                if (item.Description) {
                    style("normal", bPt, 68, 68, 68);
                    para(item.Description, M, bPt, CW);
                    y += 0.5;
                }

                // Tech stack chips
                drawChips(normalizeTags(item.TechStack), 7.5 * sc);
                y += 2;
            }

            // ── Education ──
            if (cat === "education") {
                const tPt = 11 * sc;
                const bPt = 9.5 * sc;
                const sPt2 = 8.5 * sc;
                pageBreak(lh(tPt) + lh(bPt) + 4);

                // Degree + field … Date
                style("bold", tPt, 17, 17, 17);
                const deg = toPdfText(item.Degree);
                ink(deg, M, tPt);
                if (item.FieldOfStudy) {
                    const dw = pdf.getTextWidth(deg);
                    style("normal", 10.5 * sc, 85, 85, 85);
                    pdf.text(` in ${toPdfText(item.FieldOfStudy)}`, M + dw, y + bl(tPt));
                }
                style("normal", sPt2, 119, 119, 119);
                ink(
                    `${fmtDate(item.StartDate)} - ${item.CurrentlyStudying ? "Present" : fmtDate(item.EndDate)}`,
                    PW - M,
                    sPt2,
                    "right"
                );
                y += lh(tPt);

                // Institution
                style("normal", bPt, 85, 85, 85);
                para(toPdfText(item.Institution), M, bPt);

                // Grade
                if (item.Grade) {
                    style("normal", sPt2, 119, 119, 119);
                    para(`Grade: ${item.Grade}${item.MaxGrade ? `/${item.MaxGrade}` : ""}`, M, sPt2);
                }
                y += 3;
            }

            // ── Certificates ──
            if (cat === "certificates") {
                const tPt = 10.5 * sc;
                const sPt2 = 8.5 * sc;
                pageBreak(lh(tPt) + 4);

                style("bold", tPt, 17, 17, 17);
                const ct = toPdfText(item.Title);
                ink(ct, M, tPt);

                if (item.IssuingOrganization) {
                    const tw2 = pdf.getTextWidth(ct);
                    style("normal", 9.5 * sc, 85, 85, 85);
                    pdf.text(` | ${toPdfText(item.IssuingOrganization)}`, M + tw2, y + bl(tPt));
                }

                style("normal", sPt2, 119, 119, 119);
                ink(fmtDate(item.IssuedDate), PW - M, sPt2, "right");
                y += lh(tPt) + 2;
            }

            // ── Test Scores ──
            if (cat === "testScores") {
                const tPt = 10.5 * sc;
                pageBreak(lh(tPt) + 4);

                style("bold", tPt, 17, 17, 17);
                const exam = toPdfText(`${item.ExamName} ${item.Year}`);
                ink(exam, M, tPt);

                if (item.Subject) {
                    const ew = pdf.getTextWidth(exam);
                    style("normal", 9.5 * sc, 85, 85, 85);
                    pdf.text(` (${toPdfText(item.Subject)})`, M + ew, y + bl(tPt));
                }

                // Score right-aligned
                let scoreText = String(item.Score || "");
                if (item.MaxScore) scoreText += `/${item.MaxScore}`;
                if (item.Percentile) scoreText += ` | P${item.Percentile}`;
                if (item.Rank) scoreText += ` | Rank ${item.Rank}`;
                style("bold", 9.5 * sc, 17, 17, 17);
                ink(toPdfText(scoreText), PW - M, 9.5 * sc, "right");
                y += lh(tPt) + 2;
            }
        });
    }

    pdf.save(customFileName || `${meta.name.replace(/\s+/g, "_")}_Resume.pdf`);
}
