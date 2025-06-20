import { NextRequest } from "next/server";
import { Config } from "@Config";
import { ControllerResponseMap } from "@Utils/ControllerResponseMap";
import * as jose from "jose";
import dbConnect from "@Utils/dbConnect";
import { Bookmarks_Model } from "@Models/Bookmarks";
import { verifyAdminToken } from "@Utils/verifyAdminToken";

// ? Enables Cache
export const revalidate = 60;

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();

        const { _page, _limit, excludeID, adminSignature, query } = body;

        let page = parseInt(_page || "1");
        let limit = parseInt(_limit || "20");

        if (limit > 20) {
            limit = 20;
        }

        if (limit < 5) {
            limit = 5;
        }

        const adminToken =
            req.headers.get("x-admin-signature") || adminSignature;
        const isAdmin = await verifyAdminToken(adminToken || "");

        // Get already added bookmark IDs from body
        const excludeIds = Array.isArray(excludeID)
            ? excludeID
            : excludeID
              ? excludeID.split(",")
              : [];

        await dbConnect();

        // ? Sort By Pipeline (First Attempt)
        const sortPriority: Record<string, 1 | -1> = {
            // ? Sponsored Bookmarks have highest priority
            isSponsored: -1,
            // ? Exact match in Name field
            ...(query ? { exactNameMatch: -1 } : {}),
            // ? Starts with query in Name field
            ...(query ? { startsWithMatch: -1 } : {}),
            // ? Keyword match
            ...(query ? { keywordMatch: -1 } : {}),
            // ? WebLink match
            ...(query ? { urlMatch: -1 } : {}),
            // ? Finally sort by name alphabetically
            Name: 1
        };

        // ? Pipeline for advanced search and sorting
        let pipeline = [];

        // ? Match stage for basic filtering
        pipeline.push({
            $match: {
                isDeleted: false,
                BookmarkID: { $nin: excludeIds },
                isPublished: isAdmin ? { $ne: false } : true,
                isAdminOnly: isAdmin ? { $ne: false } : false
            }
        });

        // ? If query is provided, add text search logic
        if (query && query.trim().length > 0) {
            const queryRegex = new RegExp(query, "i");

            pipeline.push({
                $match: {
                    $or: [
                        { Name: queryRegex },
                        { Description: queryRegex },
                        { Keywords: queryRegex },
                        { WebLink: queryRegex },
                        { Windows: queryRegex },
                        { Android: queryRegex }
                    ]
                }
            });

            // ? Add fields for sorting priorities based on match type
            pipeline.push({
                $addFields: {
                    exactNameMatch: {
                        $cond: {
                            if: {
                                $eq: [
                                    { $toLower: "$Name" },
                                    query.toLowerCase()
                                ]
                            },
                            then: 1,
                            else: 0
                        }
                    },
                    startsWithMatch: {
                        $cond: {
                            if: {
                                $regexMatch: {
                                    input: { $toLower: "$Name" },
                                    regex: new RegExp(`^${query.toLowerCase()}`)
                                }
                            },
                            then: 1,
                            else: 0
                        }
                    },
                    keywordMatch: {
                        $cond: {
                            if: {
                                $gt: [
                                    {
                                        $size: {
                                            $filter: {
                                                input: {
                                                    $ifNull: ["$Keywords", []]
                                                },
                                                as: "keyword",
                                                cond: {
                                                    $regexMatch: {
                                                        input: {
                                                            $toLower:
                                                                "$$keyword"
                                                        },
                                                        regex: queryRegex
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    0
                                ]
                            },
                            then: 1,
                            else: 0
                        }
                    },
                    urlMatch: {
                        $cond: {
                            if: {
                                $regexMatch: {
                                    input: { $toLower: "$WebLink" },
                                    regex: queryRegex
                                }
                            },
                            then: 1,
                            else: 0
                        }
                    }
                }
            });
        }

        // ? Sort stage
        pipeline.push({ $sort: sortPriority });

        // ? Skip and limit for pagination
        pipeline.push({ $skip: (page - 1) * limit });
        pipeline.push({ $limit: limit });

        // Explicitly cast pipeline to any to avoid TypeScript errors with complex aggregation pipelines
        let Bookmarks = await Bookmarks_Model.aggregate(pipeline as any).exec();

        if (!Bookmarks || Bookmarks.length === 0) {
            return ControllerResponseMap({
                Status: 1,
                Message: "No bookmarks available",
                StatusCode: 200,
                Data: {
                    Bookmarks: [],
                    Pagination: {
                        page,
                        limit,
                        totalItems: 0,
                        totalPages: 0,
                        hasMore: false
                    }
                }
            });
        }

        // Pagination
        const totalItems = Bookmarks.length;
        const totalPages = Math.ceil(totalItems / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedResults = Bookmarks.slice(startIndex, endIndex);

        return ControllerResponseMap({
            Status: 1,
            Message: "Bookmarks Successfully Fetched",
            StatusCode: 200,
            Data: {
                Bookmarks: paginatedResults,
                Pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages,
                    hasMore: page < totalPages
                }
            }
        });
    } catch (error) {
        return ControllerResponseMap({
            Status: 0,
            Message: "Error processing request",
            StatusCode: 500,
            Data: [],
            Debug: error
        });
    }
}
