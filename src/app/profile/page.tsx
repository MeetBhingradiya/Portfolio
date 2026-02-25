/**
 * Profile Page — redirects to /settings/profile
 * Profile management has been merged into /settings/profile
 */

import { redirect } from "next/navigation";

export default function ProfilePage() {
    redirect("/settings/profile");
}
