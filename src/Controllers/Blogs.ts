import { Blogs_Model, IBlog, BlogVisibility } from "@Models/Blogs";
import { BlogsContents_Model } from "@Models/BlogsContent";
import dbConnect from "@Utils/dbConnect";
import { v4 } from "uuid";

// ? User Side Controllers
async function Controller_POST_CreateBlog(
	data: IBlog,
	content: string,
	userID: string
) {
	try {
		await dbConnect();

		const ContentDoc = await BlogsContents_Model.create({
			Data: content || "",
		});

		const BlogDoc = await Blogs_Model.create({
			...data,
			BlogID: v4(),
			ContentID: ContentDoc.ContentID,
			AuthorID: userID,
		});
		return {
			Status: 1,
			Message: "ACCEPTED",
			StatusCode: 201,
			Data: BlogDoc,
		};
	} catch (error: any) {
		return {
			Status: 0,
			Message: error.message || "Database ERROR",
			StatusCode: 500,
		};
	}
}

async function Controller_GET_Blog(BlogID: string, userID?: string) {
	try {
		await dbConnect();
		const blog = await Blogs_Model.findOne({ BlogID, isDeleted: false });

		if (!blog) {
			return {
				Status: 0,
				Message: "Blog not found",
				StatusCode: 404,
			};
		} // ? Check the Blog Visiblity if Public then Direct Access
		if (blog.Visiblity === BlogVisibility.Public) {
			await Blogs_Model.findOneAndUpdate(
				{ BlogID, isDeleted: false },
				{ $inc: { Views: 1 } },
				{ new: true }
			);

			blog.Views = (blog.Views as number) + 1;
			return {
				Status: 1,
				Message: "OK",
				StatusCode: 200,
				Data: blog,
			};
		}

		// ? Check if the user is the author of the blog give them access to view the blog
		if (blog.AuthorID === userID) {
			await Blogs_Model.findOneAndUpdate(
				{ BlogID, isDeleted: false },
				{ $inc: { Views: 1 } },
				{ new: true }
			);

			blog.Views = (blog.Views as number) + 1;
			return {
				Status: 1,
				Message: "OK",
				StatusCode: 200,
				Data: blog,
			};
		}

		return {
			Status: 0,
			Message: "Blog not found",
			StatusCode: 403,
		};
	} catch (error: any) {
		return {
			Status: 0,
			Message: error.message || "Database ERROR",
			StatusCode: 500,
		};
	}
}

async function Controller_PUT_UpdateBlogMeta(
	BlogID: string,
	userID: string,
	updates: Partial<IBlog>
) {
	try {
		await dbConnect();
		const Blog = await Blogs_Model.findOne({ BlogID, isDeleted: false });

		if (!Blog) {
			return {
				Status: 0,
				Message: "Blog not found",
				StatusCode: 404,
			};
		}

		if (Blog.AuthorID !== userID) {
			return {
				Status: 0,
				Message: "Unauthorized",
				StatusCode: 403,
			};
		}

		await Blogs_Model.findOneAndUpdate(
			{ BlogID, isDeleted: false },
			updates,
			{ new: true }
		);

		return {
			Status: 0,
			Message: "ACCEPTED",
			StatusCode: 201,
		};
	} catch (error: any) {
		return {
			Status: 0,
			Message: error.message || "Database ERROR",
			StatusCode: 500,
		};
	}
}

async function Controller_PUT_UpdateBlogContent(
	BlogID: string,
	userID: string,
	content: string
) {
	try {
		await dbConnect();
		const Blog = await Blogs_Model.findOne({ BlogID, isDeleted: false });

		if (!Blog) {
			return {
				Status: 0,
				Message: "Blog not found",
				StatusCode: 404,
			};
		} // ! Check if the user is the author of the blog give them access to edit the blog
		if (Blog.AuthorID !== userID) {
			return {
				Status: 0,
				Message: "Unauthorized",
				StatusCode: 403,
			};
		} // Remove the isLocked check since it's not in the model

		if (Blog.ContentID) {
			const existingContent = await BlogsContents_Model.findOne({
				ContentID: Blog.ContentID,
			});
			if (existingContent && existingContent.Data === content) {
				return {
					Status: 0,
					Message: "No changes detected",
					StatusCode: 400,
				};
			}
		}

		const ContentDoc = await BlogsContents_Model.create({
			Data: content || "",
		});
		const OLDContentID = Blog.ContentID;

		await Blogs_Model.findOneAndUpdate(
			{ BlogID, isDeleted: false },
			{
				ContentID: ContentDoc.ContentID,
				History: [OLDContentID, ...(Blog?.History as string[])],
			},
			{ new: true }
		);

		return {
			Status: 0,
			Message: "ACCEPTED",
			StatusCode: 201,
		};
	} catch (error: any) {
		return {
			Status: 0,
			Message: error.message || "Database ERROR",
			StatusCode: 500,
		};
	}
}

async function Controller_DELETE_Blog(BlogID: string, userID: string) {
	try {
		await dbConnect();
		const Blog = await Blogs_Model.findOne({ BlogID, isDeleted: false });

		if (!Blog) {
			return {
				Status: 0,
				Message: "Blog not found",
				StatusCode: 404,
			};
		}

		if (Blog.AuthorID !== userID) {
			return {
				Status: 0,
				Message: "Unauthorized",
				StatusCode: 403,
			};
		}

		await Blogs_Model.findOneAndUpdate(
			{ BlogID, isDeleted: false },
			{ isDeleted: true }
		);

		return {
			Status: 0,
			Message: "ACCEPTED",
			StatusCode: 201,
		};
	} catch (error: any) {
		return {
			Status: 0,
			Message: error.message || "Database ERROR",
			StatusCode: 500,
		};
	}
}

// ? Feed/Likes/Views Side Controllers
async function Controller_GET_BlogsFeed(userID: string) {
	try {
		await dbConnect(); // ? Instead of Just Directly Fetching the Blogs, We can also filter the blogs based on the user's likes
		// ? 10 of Them & latest sorted
		const blogs = await Blogs_Model.find({
			isDeleted: false,
			Visiblity: BlogVisibility.Public,
			isPublished: true,
			AuthorID: { $ne: userID },
		})
			.limit(10)
			.sort({ createdAt: -1 });

		return {
			Status: 0,
			Message: "OK",
			StatusCode: 200,
			Data: blogs,
		};
	} catch (error: any) {
		return {
			Status: 0,
			Message: error.message || "Database ERROR",
			StatusCode: 500,
		};
	}
}

async function Controller_POST_LikeBlog(BlogID: string, userID: string) {
	try {
		await dbConnect();
		const Blog = await Blogs_Model.findOne({ BlogID, isDeleted: false });

		if (!Blog) {
			return {
				Status: 0,
				Message: "Blog not found",
				StatusCode: 404,
			};
		}

		if (!Blog.isPublished) {
			return {
				Status: 0,
				Message: "Blog not published",
				StatusCode: 403,
			};
		}

		if (Blog.AuthorID === userID) {
			return {
				Status: 0,
				Message: "You can't like your own blog",
				StatusCode: 403,
			};
		}

		const isLikedBy = Blog.LikedBy || [];

		if (!isLikedBy.includes(userID)) {
			isLikedBy.push(userID);
		} else {
			return {
				Status: 0,
				Message: "Already Liked",
				StatusCode: 403,
			};
		}

		// ! Check if the user has already liked the blog

		await Blogs_Model.findOneAndUpdate(
			{ BlogID, isDeleted: false },
			{ $inc: { Likes: 1 }, $addToSet: { LikedBy: userID } },
			{ new: true }
		);

		return {
			Status: 0,
			Message: "ACCEPTED",
			StatusCode: 201,
		};
	} catch (error: any) {
		return {
			Status: 0,
			Message: error.message || "Database ERROR",
			StatusCode: 500,
		};
	}
}

export {
	Controller_POST_CreateBlog,
	Controller_GET_Blog,
	Controller_PUT_UpdateBlogMeta,
	Controller_PUT_UpdateBlogContent,
	Controller_DELETE_Blog,
	Controller_GET_BlogsFeed,
	Controller_POST_LikeBlog,
};
