import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop | Meet Bhingradiya",
    description: "Browse licenses, subscriptions, and digital products."
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
