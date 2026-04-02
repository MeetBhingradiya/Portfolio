import { redirect } from "next/navigation";
import DbSyncAdminClient from "./DbSyncAdminClient";

export const metadata = {
    title: "DB Sync | Admin Portal",
    robots: { index: false, follow: false }
};

export default function DbSyncPage() {
    if (process.env.NODE_ENV === "production") {
        redirect("/admin");
    }

    return <DbSyncAdminClient />;
}
