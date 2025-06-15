import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Blogs_Model, BlogVisibility } from "@Models/Blogs";
import { BlogsContents_Model } from "@Models/BlogsContent";
import { Users_Model } from "@Models/Users";
import { Sessions_Model } from "@Models/Sessions";
import { log } from "@Utils";
import { v4 } from "uuid";
import { verifyJWT } from "@Utils/JWT";
import { generateUniqueSlug } from "@Utils/slugify";

// Type definition for blog document
interface BlogDocument {
	BlogID: string;
	Title: string;
	Description?: string;
	Tags?: string[];
	BannerImage?: string;
	Visiblity: BlogVisibility;
	isPublished: boolean;
	PublishDate?: Date;
	ContentID: string;
	AuthorID: string;
	Views: number;
	Likes: number;
	History?: string[];
	isDeleted: boolean;
	createdAt: Date;
	updatedAt: Date;
}

// Helper function to get user from token - FIXED VERSION
async function getUserFromToken(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		const token =
			authHeader?.replace("Bearer ", "") ||
			request.cookies.get("auth-token")?.value;

		if (!token) return null;

		const decoded = await verifyJWT(token);
		if (!decoded) return null;

		await dbConnect();

		// Verify session is still active
		const session = await Sessions_Model.findOne({
			SessionID: decoded.sessionID,
			UserID: decoded.userID,
			ExpiresAt: { $gt: new Date() },
		});

		if (!session) return null;

		// Get full user data
		const user = await Users_Model.findOne({
			UserID: decoded.userID,
			isDeleted: false,
			isLocked: false,
			isSuspended: false,
		});

		return user;
	} catch (error) {
		log(`Token verification error: ${error}`);
		return null;
	}
}

// Define the route context type
interface RouteContext {
	params: Promise<{ id: string }>;
}

// GET /api/blog/[id] - Get specific blog
export async function GET(request: NextRequest, context: RouteContext) {
	try {
		await dbConnect();

		// Await the params
		const params = await context.params;
		const { id: blogID } = params;

		const user = await getUserFromToken(request); // Find blog
		const blogResult = await Blogs_Model.findOne({
			BlogID: blogID,
			isDeleted: false,
		}).lean();

		if (!blogResult || Array.isArray(blogResult)) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Blog not found",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		const blog = blogResult as unknown as BlogDocument;

		// Check visibility permissions
		if (!user || !user.isAdmin) {
			if (!blog.isPublished || blog.Visiblity !== BlogVisibility.Public) {
				return NextResponse.json(
					{
						Status: 0,
						Message: "Blog not accessible",
						StatusCode: 403,
					},
					{ status: 403 }
				);
			}
		} // Get blog content
		const content = await BlogsContents_Model.findOne({
			ContentID: blog.ContentID,
		}).lean();

		// Get author information
		const author = await Users_Model.findOne({ UserID: blog.AuthorID })
			.select("UserID Username FirstName LastName Icon")
			.lean(); // Increment view count (only for published public blogs or if user is authenticated)
		if (
			blog.isPublished &&
			(blog.Visiblity === BlogVisibility.Public || user)
		) {
			await Blogs_Model.updateOne(
				{ BlogID: blogID },
				{ $inc: { Views: 1 } }
			);
		}

		return NextResponse.json({
			Status: 1,
			Message: "Blog retrieved successfully",
			StatusCode: 200,
			Data: {
				blog: {
					...blog,
					content: content?.Data || "",
					author: author
						? {
								userID: author.UserID,
								username: author.Username,
								name: `${author.FirstName} ${author.LastName}`.trim(),
								icon: author.Icon,
							}
						: null,
				},
			},
		});
	} catch (error: any) {
		log(`Blog retrieval error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to retrieve blog",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}

// PUT /api/blog/[id] - Update blog post
export async function PUT(request: NextRequest, context: RouteContext) {
	try {
		const user = await getUserFromToken(request);

		if (!user) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Authentication required",
					StatusCode: 401,
				},
				{ status: 401 }
			);
		}

		await dbConnect();

		// Await the params
		const params = await context.params;
		const { id: blogID } = params;

		const body = await request.json();

		// Find existing blog
		const existingBlog = await Blogs_Model.findOne({
			BlogID: blogID,
			isDeleted: false,
		});

		if (!existingBlog) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Blog not found",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		// Check permissions (author or admin) - FIXED: Use UserID instead of userID
		if (existingBlog.AuthorID !== user.UserID && !user.isAdmin) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Insufficient permissions to edit this blog",
					StatusCode: 403,
				},
				{ status: 403 }
			);
		}

		// If content is being updated, create new content version
		if (body.content) {
			const newContentID = v4();
			await BlogsContents_Model.create({
				ContentID: newContentID,
				Data: body.content,
			});

			// Add old content ID to history
			existingBlog.History = existingBlog.History || [];
			existingBlog.History.push(existingBlog.ContentID);
			existingBlog.ContentID = newContentID;
		}

		// Update blog fields
		const updateData: any = {};
		if (body.title) {
			updateData.Title = body.title;
			// Generate new slug if title changed
			const existingSlugs = await Blogs_Model.find({
				isDeleted: false,
				BlogID: { $ne: blogID }, // Exclude current blog
			}).distinct("Slug");
			updateData.Slug = generateUniqueSlug(body.title, existingSlugs);
		}
		if (body.description !== undefined)
			updateData.Description = body.description;
		if (body.tags) updateData.Tags = body.tags;
		if (body.bannerImage !== undefined)
			updateData.BannerImage = body.bannerImage;
		if (body.visibility) updateData.Visiblity = body.visibility;

		// Handle publishing status
		if (body.isPublished !== undefined) {
			updateData.isPublished = body.isPublished;
			if (body.isPublished && !existingBlog.isPublished) {
				updateData.PublishDate = new Date();
			}
		}

		// Update content ID if changed
		if (body.content) {
			updateData.ContentID = existingBlog.ContentID;
			updateData.History = existingBlog.History;
		}

		await Blogs_Model.updateOne({ BlogID: blogID }, updateData);

		return NextResponse.json({
			Status: 1,
			Message: "Blog updated successfully",
			StatusCode: 200,
			Data: {
				blogID: blogID,
				slug: updateData.Slug || existingBlog.Slug,
				updated: Object.keys(updateData),
			},
		});
	} catch (error: any) {
		log(`Blog update error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to update blog",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}

// DELETE /api/blog/[id] - Delete blog post
export async function DELETE(request: NextRequest, context: RouteContext) {
	try {
		const user = await getUserFromToken(request);

		if (!user) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Authentication required",
					StatusCode: 401,
				},
				{ status: 401 }
			);
		}

		await dbConnect();

		// Await the params
		const params = await context.params;
		const { id: blogID } = params;

		// Find existing blog
		const existingBlog = await Blogs_Model.findOne({
			BlogID: blogID,
			isDeleted: false,
		});

		if (!existingBlog) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Blog not found",
					StatusCode: 404,
				},
				{ status: 404 }
			);
		}

		// Check permissions (author or admin) - FIXED: Use UserID instead of userID
		if (existingBlog.AuthorID !== user.UserID && !user.isAdmin) {
			return NextResponse.json(
				{
					Status: 0,
					Message: "Insufficient permissions to delete this blog",
					StatusCode: 403,
				},
				{ status: 403 }
			);
		}

		// Soft delete
		await Blogs_Model.updateOne(
			{ BlogID: blogID },
			{
				isDeleted: true,
				isPublished: false,
			}
		);

		return NextResponse.json({
			Status: 1,
			Message: "Blog deleted successfully",
			StatusCode: 200,
			Data: { blogID },
		});
	} catch (error: any) {
		log(`Blog deletion error: ${error.message}`);
		return NextResponse.json(
			{
				Status: 0,
				Message: "Failed to delete blog",
				StatusCode: 500,
			},
			{ status: 500 }
		);
	}
}
