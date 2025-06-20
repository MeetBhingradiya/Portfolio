"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Card,
    CardBody,
    CardHeader,
    Button,
    Select,
    SelectItem,
    Chip,
    Progress,
    Divider
} from "@heroui/react";
import {
    TrendingUp,
    TrendingDown,
    Visibility,
    ThumbUp,
    Share,
    Comment,
    People,
    Language,
    Schedule,
    Analytics,
    BarChart,
    PieChart,
    Timeline
} from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useAccountSwitcher } from "@Hooks/useAccountSwitcher";
import AdminLayout from "@Components/Admin/Layout/AdminLayout";
import StatsGrid from "@Components/Admin/Widgets/StatsGrid";

interface AnalyticsData {
    pageViews: number;
    uniqueVisitors: number;
    bounceRate: number;
    avgSessionDuration: string;
    topPages: PageAnalytics[];
    referrers: ReferrerData[];
    deviceTypes: DeviceData[];
    countries: CountryData[];
    timeSeriesData: TimeSeriesData[];
}

interface PageAnalytics {
    path: string;
    views: number;
    uniqueViews: number;
    avgTimeOnPage: string;
    bounceRate: number;
}

interface ReferrerData {
    source: string;
    visits: number;
    percentage: number;
}

interface DeviceData {
    type: string;
    sessions: number;
    percentage: number;
}

interface CountryData {
    country: string;
    sessions: number;
    percentage: number;
}

interface TimeSeriesData {
    date: string;
    pageViews: number;
    uniqueVisitors: number;
    sessions: number;
}

const mockAnalyticsData: AnalyticsData = {
    pageViews: 45678,
    uniqueVisitors: 12345,
    bounceRate: 65.4,
    avgSessionDuration: "2m 34s",
    topPages: [
        {
            path: "/",
            views: 8543,
            uniqueViews: 6234,
            avgTimeOnPage: "3m 12s",
            bounceRate: 58.2
        },
        {
            path: "/blog",
            views: 5432,
            uniqueViews: 4321,
            avgTimeOnPage: "4m 45s",
            bounceRate: 45.6
        },
        {
            path: "/about",
            views: 3456,
            uniqueViews: 2876,
            avgTimeOnPage: "2m 23s",
            bounceRate: 72.1
        },
        {
            path: "/contact",
            views: 2345,
            uniqueViews: 1987,
            avgTimeOnPage: "1m 56s",
            bounceRate: 78.5
        },
        {
            path: "/services",
            views: 1876,
            uniqueViews: 1543,
            avgTimeOnPage: "3m 34s",
            bounceRate: 52.3
        }
    ],
    referrers: [
        { source: "Google", visits: 6543, percentage: 52.1 },
        { source: "Direct", visits: 2876, percentage: 22.9 },
        { source: "Facebook", visits: 1543, percentage: 12.3 },
        { source: "Twitter", visits: 876, percentage: 7.0 },
        { source: "LinkedIn", visits: 432, percentage: 3.4 },
        { source: "Other", visits: 287, percentage: 2.3 }
    ],
    deviceTypes: [
        { type: "Desktop", sessions: 7654, percentage: 61.2 },
        { type: "Mobile", sessions: 3876, percentage: 31.0 },
        { type: "Tablet", sessions: 976, percentage: 7.8 }
    ],
    countries: [
        { country: "United States", sessions: 4567, percentage: 36.5 },
        { country: "United Kingdom", sessions: 2345, percentage: 18.7 },
        { country: "Canada", sessions: 1876, percentage: 15.0 },
        { country: "Australia", sessions: 1234, percentage: 9.9 },
        { country: "Germany", sessions: 987, percentage: 7.9 },
        { country: "France", sessions: 654, percentage: 5.2 },
        { country: "Other", sessions: 876, percentage: 7.0 }
    ],
    timeSeriesData: [
        {
            date: "2024-01-15",
            pageViews: 1234,
            uniqueVisitors: 987,
            sessions: 876
        },
        {
            date: "2024-01-14",
            pageViews: 1543,
            uniqueVisitors: 1234,
            sessions: 1087
        },
        {
            date: "2024-01-13",
            pageViews: 1876,
            uniqueVisitors: 1456,
            sessions: 1234
        },
        {
            date: "2024-01-12",
            pageViews: 1654,
            uniqueVisitors: 1321,
            sessions: 1154
        },
        {
            date: "2024-01-11",
            pageViews: 1432,
            uniqueVisitors: 1176,
            sessions: 1032
        },
        {
            date: "2024-01-10",
            pageViews: 1765,
            uniqueVisitors: 1398,
            sessions: 1198
        },
        {
            date: "2024-01-09",
            pageViews: 1987,
            uniqueVisitors: 1567,
            sessions: 1345
        }
    ]
};

export default function AnalyticsAdminPage() {
    const router = useRouter();
    const { currentAccount } = useAccountSwitcher();
    const [analyticsData] = useState<AnalyticsData>(mockAnalyticsData);
    const [timeRange, setTimeRange] = useState("7d");
    const [loading, setLoading] = useState(false);
    const statsData = [
        {
            title: "Page Views",
            value: analyticsData.pageViews.toLocaleString(),
            change: {
                value: "+12.5%",
                type: "increase" as const,
                period: "vs last month"
            },
            icon: <Visibility className="w-6 h-6" />,
            color: "primary" as const
        },
        {
            title: "Unique Visitors",
            value: analyticsData.uniqueVisitors.toLocaleString(),
            change: {
                value: "+8.2%",
                type: "increase" as const,
                period: "vs last month"
            },
            icon: <People className="w-6 h-6" />,
            color: "success" as const
        },
        {
            title: "Bounce Rate",
            value: `${analyticsData.bounceRate}%`,
            change: {
                value: "-3.1%",
                type: "increase" as const,
                period: "vs last month"
            },
            icon: <TrendingDown className="w-6 h-6" />,
            color: "warning" as const
        },
        {
            title: "Avg. Session Duration",
            value: analyticsData.avgSessionDuration,
            change: {
                value: "+15.4%",
                type: "increase" as const,
                period: "vs last month"
            },
            icon: <Schedule className="w-6 h-6" />,
            color: "secondary" as const
        }
    ];

    const getBounceRateColor = (rate: number) => {
        if (rate < 40) return "success";
        if (rate < 60) return "warning";
        return "danger";
    };

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Analytics Dashboard
                            </h1>
                            <p className="text-default-500">
                                Website performance and visitor insights
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select
                                placeholder="Time Range"
                                selectedKeys={[timeRange]}
                                onSelectionChange={(keys) =>
                                    setTimeRange(Array.from(keys)[0] as string)
                                }
                                className="w-40">
                                <SelectItem key="1d">Last 24 Hours</SelectItem>
                                <SelectItem key="7d">Last 7 Days</SelectItem>
                                <SelectItem key="30d">Last 30 Days</SelectItem>
                                <SelectItem key="90d">Last 90 Days</SelectItem>
                                <SelectItem key="1y">Last Year</SelectItem>
                            </Select>
                            <Button
                                color="primary"
                                startContent={<Analytics />}
                                onPress={() =>
                                    router.push("/admin/analytics/reports")
                                }>
                                Generate Report
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <StatsGrid stats={statsData} />

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Traffic Chart */}
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <BarChart className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">
                                    Traffic Overview
                                </h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {analyticsData.timeSeriesData
                                    .slice(0, 5)
                                    .map((data, index) => (
                                        <div
                                            key={data.date}
                                            className="flex items-center justify-between">
                                            <span className="text-sm text-default-500">
                                                {new Date(
                                                    data.date
                                                ).toLocaleDateString()}
                                            </span>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">
                                                        {data.pageViews.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-default-500">
                                                        Page Views
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium">
                                                        {data.uniqueVisitors.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-default-500">
                                                        Visitors
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Device Types */}
                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold">
                                    Device Types
                                </h3>
                            </div>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {analyticsData.deviceTypes.map((device) => (
                                    <div
                                        key={device.type}
                                        className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                {device.type}
                                            </span>
                                            <span className="text-sm text-default-500">
                                                {device.sessions.toLocaleString()}{" "}
                                                ({device.percentage}%)
                                            </span>
                                        </div>
                                        <Progress
                                            value={device.percentage}
                                            className="w-full"
                                            color={
                                                device.type === "Desktop"
                                                    ? "primary"
                                                    : device.type === "Mobile"
                                                      ? "success"
                                                      : "warning"
                                            }
                                            size="sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Top Pages and Referrers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Pages */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Top Pages</h3>
                        </CardHeader>
                        <CardBody className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-default-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-default-600 uppercase tracking-wider">
                                                Page
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-default-600 uppercase tracking-wider">
                                                Views
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-default-600 uppercase tracking-wider">
                                                Avg. Time
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-default-600 uppercase tracking-wider">
                                                Bounce Rate
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-default-200">
                                        {analyticsData.topPages.map((page) => (
                                            <motion.tr
                                                key={page.path}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="hover:bg-default-50">
                                                <td className="px-4 py-4">
                                                    <span className="text-sm font-medium text-primary">
                                                        {page.path}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="text-sm text-foreground">
                                                        {page.views.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-default-500">
                                                        {page.uniqueViews.toLocaleString()}{" "}
                                                        unique
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-foreground">
                                                    {page.avgTimeOnPage}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <Chip
                                                        size="sm"
                                                        color={getBounceRateColor(
                                                            page.bounceRate
                                                        )}
                                                        variant="flat">
                                                        {page.bounceRate}%
                                                    </Chip>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Traffic Sources */}
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold">
                                Traffic Sources
                            </h3>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {analyticsData.referrers.map((referrer) => (
                                    <div
                                        key={referrer.source}
                                        className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">
                                                {referrer.source}
                                            </span>
                                            <span className="text-sm text-default-500">
                                                {referrer.visits.toLocaleString()}{" "}
                                                ({referrer.percentage}%)
                                            </span>
                                        </div>
                                        <Progress
                                            value={referrer.percentage}
                                            className="w-full"
                                            color="primary"
                                            size="sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Geographic Data */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Language className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">
                                Geographic Distribution
                            </h3>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {analyticsData.countries.map((country) => (
                                <div
                                    key={country.country}
                                    className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {country.country}
                                        </span>
                                        <span className="text-sm text-default-500">
                                            {country.percentage}%
                                        </span>
                                    </div>
                                    <div className="text-sm text-default-500">
                                        {country.sessions.toLocaleString()}{" "}
                                        sessions
                                    </div>
                                    <Progress
                                        value={country.percentage}
                                        className="w-full"
                                        color="primary"
                                        size="sm"
                                    />
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>

                {/* Real-time Activity */}
                <Card>
                    <CardHeader className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Timeline className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold">
                                Real-time Activity
                            </h3>
                        </div>
                        <Chip
                            size="sm"
                            color="success"
                            variant="dot">
                            Live
                        </Chip>
                    </CardHeader>
                    <CardBody>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">
                                    23
                                </div>
                                <div className="text-sm text-default-500">
                                    Active Users
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-success">
                                    156
                                </div>
                                <div className="text-sm text-default-500">
                                    Page Views (1h)
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-warning">
                                    89
                                </div>
                                <div className="text-sm text-default-500">
                                    Sessions (1h)
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-danger">
                                    12
                                </div>
                                <div className="text-sm text-default-500">
                                    Events (1h)
                                </div>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </AdminLayout>
    );
}
