import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Blogs_Model } from "@Models/Blogs";
import { BlogsContents_Model } from "@Models/BlogsContent";
import { Users_Model } from "@Models/Users";

// Move the generateSlug function to a separate utility file or keep it internal
function generateSlugInternal(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Define the route context type
interface RouteContext {
    params: Promise<{ slug: string }>;
}

// GET /api/blog/slug/[slug] - Get blog by slug
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        await dbConnect();
        
        // Await the params
        const params = await context.params;
        const { slug } = params;

        // Find blog by matching slug against title
        const blogs = await Blogs_Model.find({
            isDeleted: false,
            isPublished: true,
            Visiblity: 'public'
        }).lean();

        const blog = blogs.find(b => generateSlugInternal(b.Title) === slug);

        if (!blog) {
            return NextResponse.json({
                Status: 0,
                Message: 'Blog not found',
                StatusCode: 404
            }, { status: 404 });
        }

        // Get blog content
        const content = await BlogsContents_Model.findOne({ 
            ContentID: blog.ContentID 
        }).lean();

        // Get author information
        const author = await Users_Model.findOne({ UserID: blog.AuthorID })
            .select('UserID Username FirstName LastName Icon')
            .lean();

        // Increment view count
        await Blogs_Model.updateOne(
            { BlogID: blog.BlogID },
            { $inc: { Views: 1 } }
        );

        return NextResponse.json({
            Status: 1,
            Message: 'Blog retrieved successfully',
            StatusCode: 200,
            Data: {
                blog: {
                    ...blog,
                    content: content?.Data || '',
                    author: author ? {
                        userID: author.UserID,
                        username: author.Username,
                        name: `${author.FirstName} ${author.LastName}`.trim(),
                        icon: author.Icon
                    } : null
                }
            }
        });

    } catch (error: any) {
        return NextResponse.json({
            Status: 0,
            Message: 'Failed to retrieve blog',
            StatusCode: 500
        }, { status: 500 });
    }
}