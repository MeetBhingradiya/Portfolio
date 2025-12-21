export const metadata = {
    title: 'Wallet Management - Portfolio',
    description: 'Manage your wallets, track expenses, income, and financial overview'
};

export default function WalletLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {children}
        </div>
    );
}
