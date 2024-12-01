export const StaticPages: Array<{
    route: string;
    priority?: number;
    frequency?: "daily" | "weekly" | "monthly" | "yearly";
}> = [
    {
        route: '',
        priority: 1.0,
        frequency: "daily",
    },
    {
        route: 'Tools',
        priority: 0.8,
        frequency: "weekly",
    },
    {
        route: 'Tools/QR',
        priority: 0.8,
        frequency: "weekly",
    }
];