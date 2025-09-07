'use client';

import React from 'react';
import WalletDashboard from '@Components/Wallet/WalletDashboard';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';

export default function WalletPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Redirect to sign in if not authenticated
    React.useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Show loading spinner while checking session
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Spinner size="lg" color="default" />
            </div>
        );
    }

    // Don't render if not authenticated
    if (!session?.user?.id) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <WalletDashboard />
        </div>
    );
}
