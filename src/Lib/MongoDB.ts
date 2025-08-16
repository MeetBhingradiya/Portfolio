import { dbConnect } from '@/Utils/dbConnect';

// Simple wrapper for the existing dbConnect function
export const connectToDatabase = async () => {
    try {
        await dbConnect();
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};
