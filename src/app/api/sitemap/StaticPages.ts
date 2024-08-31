export const StaticPages: Array<{
    route: string;
    priority?: number;
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
}> = [
    {
        route: '',
        priority: 1.0,
        frequency: "daily",
    }
];