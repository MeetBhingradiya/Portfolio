import { NextRequest } from "next/server";
import { ControllerResponseMap } from "../../../../Utils/ControllerResponseMap";
import dbConnect from "../../../../Utils/dbConnect";
import { Bookmarks_Model } from "../../../../Models/Bookmarks";
import { verifyAdminToken } from "../../../../Utils/verifyAdminToken";

type Params = {
    params: Promise<{
        id: string;
    }>;
};

export async function POST(req: NextRequest, { params }: Params) {
    try {
        await dbConnect();

        const body = await req.json();
        const { adminSignature, bookmark } = body;

        const isAdminAuthenticated = await verifyAdminToken(
            adminSignature || req.headers.get("x-admin-signature")
        );
        if (!isAdminAuthenticated) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Unauthorized: Admin authentication required",
                StatusCode: 401
            });
        }

        const { id } = await params;

        if (!id || id === "undefined") {
            return ControllerResponseMap({
                Status: 0,
                Message: "Invalid bookmark ID",
                StatusCode: 400
            });
        }

        const existingID = await Bookmarks_Model.findOne({
            BookmarkID: id
        });
        if (existingID) {
            return ControllerResponseMap({
                Status: 0,
                Message: "Bookmark with this ID already exists",
                StatusCode: 409
            });
        }

        const existingBookmark = await Bookmarks_Model.findOne({
            $or: [
                { WebLink: bookmark.WebLink, $and: [{ WebLink: { $ne: "" } }] },
                { Windows: bookmark.Windows, $and: [{ Windows: { $ne: "" } }] },
                { Android: bookmark.Android, $and: [{ Android: { $ne: "" } }] }
            ]
        });

        const newBookmark = new Bookmarks_Model({
            ...bookmark,
            BookmarkID: id
        });

        await newBookmark.save();

        return ControllerResponseMap({
            Status: 1,
            Message: existingBookmark
                ? "Warning: Bookmark with same URL already exists, but new bookmark created successfully"
                : "Bookmark created successfully",
            StatusCode: 201,
            Data: {
                Bookmark: newBookmark,
                Exists: existingBookmark ? true : false
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

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//     try {
//         await dbConnect();

//         const body = await req.json();
//         const { adminSignature, bookmark } = body;

//         const isAdminAuthenticated = await verifyAdminToken(adminSignature || req.headers.get('x-admin-signature'));
//         if (!isAdminAuthenticated) {
//             return ControllerResponseMap({
//                 Status: 0,
//                 Message: "Unauthorized: Admin authentication required",
//                 StatusCode: 401
//             });
//         }

//         if (!params.id || params.id === 'undefined') {
//             return ControllerResponseMap({
//                 Status: 0,
//                 Message: "Invalid bookmark ID",
//                 StatusCode: 400
//             });
//         }

//         const existingBookmark = await Bookmarks_Model.findOne({ BookmarkID: params.id });
//         if (!existingBookmark) {
//             return ControllerResponseMap({
//                 Status: 0,
//                 Message: "Bookmark with this ID does not exist",
//                 StatusCode: 404
//             });
//         }

//         const updatedBookmark = await Bookmarks_Model.findOneAndUpdate(
//             { BookmarkID: params.id },
//             { ...bookmark },
//             { new: true }
//         );

//         return ControllerResponseMap({
//             Status: 1,
//             Message: "Bookmark updated successfully",
//             StatusCode: 200,
//             Data: {
//                 Bookmark: updatedBookmark
//             }
//         });
//     } catch (error) {
//         return ControllerResponseMap({
//             Status: 0,
//             Message: "Error processing request",
//             StatusCode: 500,
//             Data: [],
//             Debug: error
//         });
//     }
// }

// // DELETE API for removing bookmarks
// export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
//     try {
//         await dbConnect();

//         const url = new URL(req.url);
//         const adminSignature = url.searchParams.get('adminSignature') || req.headers.get('x-admin-signature');        // 1. Check for Admin Authentication Signature
//         const isAdminAuthenticated = await verifyAdminToken(adminSignature || '');
//         if (!isAdminAuthenticated) {
//             return ControllerResponseMap({
//                 Status: 0,
//                 Message: "Unauthorized: Admin authentication required",
//                 StatusCode: 401
//             });
//         }

//         if (!params.id || params.id === 'undefined') {
//             return ControllerResponseMap({
//                 Status: 0,
//                 Message: "Invalid bookmark ID",
//                 StatusCode: 400
//             });
//         }

//         const existingBookmark = await Bookmarks_Model.findOne({ BookmarkID: params.id });
//         if (!existingBookmark) {
//             return ControllerResponseMap({
//                 Status: 0,
//                 Message: "Bookmark with this ID does not exist",
//                 StatusCode: 404
//             });
//         }

//         await Bookmarks_Model.deleteOne({ BookmarkID: params.id });

//         return ControllerResponseMap({
//             Status: 1,
//             Message: "Bookmark deleted successfully",
//             StatusCode: 200,
//             Data: {
//                 DeletedID: params.id
//             }
//         });
//     } catch (error) {
//         return ControllerResponseMap({
//             Status: 0,
//             Message: "Error processing request",
//             StatusCode: 500,
//             Data: [],
//             Debug: error
//         });
//     }
// }
