import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Financial Management | Meet Bhingradiya',
    description: 'Comprehensive expense and income tracking system with budgeting, analytics, and financial insights.',
    keywords: ['expense tracking', 'income management', 'budgeting', 'financial analytics', 'personal finance'],
    openGraph: {
        title: 'Financial Management - Track Expenses & Income',
        description: 'Manage your finances with our comprehensive expense and income tracking system.',
        type: 'website',
    },
};

export default function FinancialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="financial-layout">
            {children}
        </div>
    );
}
