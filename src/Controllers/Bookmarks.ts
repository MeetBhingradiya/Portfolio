import { Bookmarks_Model } from "@Models/Bookmarks";
import dbConnect from "@Utils/dbConnect";
import { v4 } from "uuid";
import { BookmarksDB } from "@Data/Tools";

// Get bookmarks with more flexible querying
async function Controller_GET_Bookmarks(
    options: {
        isAdmin?: boolean;
        excludeIds?: string[];
        showUnpublished?: boolean;
    } = {}
) {
    const {
        isAdmin = false,
        excludeIds = [],
        showUnpublished = false
    } = options;

    await dbConnect();

    // Base query - only admins or explicit request can see unpublished or deleted items
    const query: any = {};

    if (!isAdmin && !showUnpublished) {
        query.isPublished = true;
        query.isDeleted = false;
    }

    let Bookmarks = await Bookmarks_Model.find(query).lean().exec();

    if (!Bookmarks || Bookmarks.length === 0) {
        // Initialize with default bookmarks
        const defaultBookmarks = [];

        for (const data of BookmarksDB) {
            const docid: string = v4();
            const newBookmark = new Bookmarks_Model({
                BookmarkID: docid,
                Name: data.Name,
                WebLink: data.WebLink,
                Icon: data.Icon,
                Description: data.Description,
                isSVG: data.isSVG,
                fillColor: data.fillColor,
                Keywords: data.Keywords,
                isPublished: true,
                isDeleted: false
            });

            // Add to return array
            defaultBookmarks.push(newBookmark.toObject());

            // Save to database (don't await here to avoid blocking)
            newBookmark.save().catch((err) => {
                console.error("Error saving default bookmark:", err);
            });
        }

        // Return the default bookmarks immediately
        return defaultBookmarks;
    }

    // Filter out excluded IDs if provided
    if (excludeIds.length > 0) {
        Bookmarks = Bookmarks.filter(
            (bookmark) =>
                !excludeIds.includes(bookmark.BookmarkID || bookmark.id || "")
        );
    }

    return Bookmarks;
}

/**
 * Get cloud-synchronized bookmarks for a specific user
 * @param userId The user ID
 * @returns Array of bookmarks synced to cloud for the user
 */
async function getCloudBookmarks(userId: string) {
    await dbConnect();

    try {
        const query = {
            userId: userId,
            isCloudSync: true,
            isDeleted: false
        };

        const bookmarks = await Bookmarks_Model.find(query)
            .sort({ updatedAt: -1 })
            .lean()
            .exec();

        return {
            success: true,
            data: {
                bookmarks,
                count: bookmarks.length
            }
        };
    } catch (error: any) {
        console.error("Error getting cloud bookmarks:", error);
        return {
            success: false,
            error: error.message || "Failed to get cloud bookmarks"
        };
    }
}

/**
 * Synchronize bookmarks with cloud storage
 * @param userId The user ID
 * @param bookmarks Array of bookmarks to sync
 * @returns Result of the sync operation
 */
async function syncCloudBookmarks(userId: string, bookmarks: any[]) {
    await dbConnect();

    try {
        if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
            return {
                success: false,
                error: "No bookmarks provided for syncing"
            };
        }

        // Ensure all bookmarks have required fields
        const processedBookmarks = bookmarks.map((bookmark) => ({
            ...bookmark,
            userId: userId,
            isCloudSync: true,
            updatedAt: new Date()
        }));

        // Prepare bulk operations for upsert
        const bulkOperations = processedBookmarks.map((bookmark) => ({
            updateOne: {
                filter: { BookmarkID: bookmark.BookmarkID, userId: userId },
                update: { $set: bookmark },
                upsert: true
            }
        }));

        // Execute bulk operation
        const result = await Bookmarks_Model.bulkWrite(bulkOperations);

        return {
            success: true,
            data: {
                modified: result.modifiedCount,
                upserted: result.upsertedCount,
                total: processedBookmarks.length
            }
        };
    } catch (error: any) {
        console.error("Error syncing cloud bookmarks:", error);
        return {
            success: false,
            error: error.message || "Failed to sync bookmarks with cloud"
        };
    }
}

/**
 * Delete bookmarks from cloud storage
 * @param userId The user ID
 * @param bookmarkIds Array of bookmark IDs to delete
 * @returns Result of the delete operation
 */
async function deleteCloudBookmarks(userId: string, bookmarkIds: string[]) {
    await dbConnect();

    try {
        if (!Array.isArray(bookmarkIds) || bookmarkIds.length === 0) {
            return {
                success: false,
                error: "No bookmark IDs provided for deletion"
            };
        }

        // Delete bookmarks (set isDeleted flag to true instead of actually deleting)
        const result = await Bookmarks_Model.updateMany(
            {
                BookmarkID: { $in: bookmarkIds },
                userId: userId
            },
            {
                $set: {
                    isDeleted: true,
                    updatedAt: new Date()
                }
            }
        );

        return {
            success: true,
            data: {
                deleted: result.modifiedCount
            }
        };
    } catch (error: any) {
        console.error("Error deleting cloud bookmarks:", error);
        return {
            success: false,
            error: error.message || "Failed to delete bookmarks from cloud"
        };
    }
}

/**
 * Update a single bookmark in cloud storage
 * @param userId The user ID
 * @param bookmark The bookmark data to update
 * @returns Result of the update operation
 */
async function updateCloudBookmark(userId: string, bookmark: any) {
    await dbConnect();

    try {
        if (!bookmark || !bookmark.BookmarkID) {
            return {
                success: false,
                error: "Invalid bookmark data. BookmarkID is required."
            };
        }

        // Prepare bookmark data with required fields
        const bookmarkData = {
            ...bookmark,
            userId: userId,
            isCloudSync: true,
            updatedAt: new Date()
        };

        // Update or create bookmark
        const result = await Bookmarks_Model.findOneAndUpdate(
            { BookmarkID: bookmark.BookmarkID, userId: userId },
            { $set: bookmarkData },
            { upsert: true, new: true }
        );

        return {
            success: true,
            data: {
                bookmark: result
            }
        };
    } catch (error: any) {
        console.error("Error updating cloud bookmark:", error);
        return {
            success: false,
            error: error.message || "Failed to update bookmark in cloud"
        };
    }
}

// Create BookmarkController object to export the functions
const BookmarkController = {
    getBookmarks: Controller_GET_Bookmarks,
    getCloudBookmarks,
    syncCloudBookmarks,
    deleteCloudBookmarks,
    updateCloudBookmark
};

export { Controller_GET_Bookmarks, BookmarkController };
