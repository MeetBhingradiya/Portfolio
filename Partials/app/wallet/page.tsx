'use client';

import React from 'react';
import WalletDashboard from '../../Components/Wallet/WalletDashboard';
import { useSession } from '../../Lib/auth-client';
import { useRouter } from 'next/navigation';
import { Spinner } from '@heroui/react';
import { useDesignTheme } from '../../Hooks/useDesignTheme';

export default function WalletPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    // Redirect to sign in if not authenticated
    React.useEffect(() => {
        if (!isPending && !session) {
            router.push('/auth/signin');
        }
    }, [isPending, session, router]);

    // Show loading spinner while checking session
    if (isPending) {
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

    return <WalletDashboard />;
}
