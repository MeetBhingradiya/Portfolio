import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@Utils/dbConnect';
import { Tickets_Model } from '@Models/Tickets';
import { verifyAdminToken } from '@Utils/verifyAdminToken';
import { v4 } from 'uuid';

// Get all tickets with admin filters
export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const isValidAdmin = await verifyAdminToken(token);
        
        if (!isValidAdmin) {
            return NextResponse.json(
                { success: false, error: 'Invalid admin credentials' },
                { status: 403 }
            );
        }

        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search');

        // Build query
        const query: any = {};
        if (status && status !== 'all') query.status = status;
        if (priority && priority !== 'all') query.priority = priority;
        if (search) {
            query.$or = [
                { id: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await Tickets_Model.countDocuments(query);
        
        // Get tickets with pagination
        const tickets = await Tickets_Model
            .find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            tickets,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Admin tickets retrieval error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to retrieve tickets' },
            { status: 500 }
        );
    }
}

// Update ticket status or add admin response
export async function PATCH(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const isValidAdmin = await verifyAdminToken(token);
        
        if (!isValidAdmin) {
            return NextResponse.json(
                { success: false, error: 'Invalid admin credentials' },
                { status: 403 }
            );
        }

        await dbConnect();
        
        const data = await request.json();
        const { ticketId, status, response } = data;

        if (!ticketId) {
            return NextResponse.json(
                { success: false, error: 'Ticket ID is required' },
                { status: 400 }
            );
        }

        const ticket = await Tickets_Model.findOne({ id: ticketId });
        
        if (!ticket) {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }

        // Update status if provided
        if (status && ['open', 'in-progress', 'resolved', 'closed'].includes(status)) {
            ticket.status = status;
        }

        // Add admin response if provided
        if (response && response.trim()) {
            const adminResponse = {
                id: v4(),
                message: response.trim(),
                isAdmin: true,
                createdAt: new Date()
            };
            ticket.responses.push(adminResponse);
        }

        await ticket.save();

        return NextResponse.json({
            success: true,
            message: 'Ticket updated successfully',
            ticket: {
                id: ticket.id,
                status: ticket.status,
                updatedAt: ticket.updatedAt,
                responsesCount: ticket.responses.length
            }
        });

    } catch (error) {
        console.error('Admin ticket update error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update ticket' },
            { status: 500 }
        );
    }
}

// Delete ticket (admin only)
export async function DELETE(request: NextRequest) {
    try {
        // Verify admin authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const isValidAdmin = await verifyAdminToken(token);
        
        if (!isValidAdmin) {
            return NextResponse.json(
                { success: false, error: 'Invalid admin credentials' },
                { status: 403 }
            );
        }

        await dbConnect();
        
        const { searchParams } = new URL(request.url);
        const ticketId = searchParams.get('id');

        if (!ticketId) {
            return NextResponse.json(
                { success: false, error: 'Ticket ID is required' },
                { status: 400 }
            );
        }

        const result = await Tickets_Model.deleteOne({ id: ticketId });
        
        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Ticket deleted successfully'
        });

    } catch (error) {
        console.error('Admin ticket deletion error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete ticket' },
            { status: 500 }
        );
    }
}
