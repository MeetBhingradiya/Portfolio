import type { ReactNode } from "react";
import PaperKnifeProvider from "./_lib/PaperKnifeProvider";

export default function PaperKnifeLayout({ children }: { children: ReactNode }) {
    return <PaperKnifeProvider>{children}</PaperKnifeProvider>;
}

