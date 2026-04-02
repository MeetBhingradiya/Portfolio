"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dayjs, { type Dayjs } from "dayjs";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import { type DateRange } from "@mui/x-date-pickers-pro/models";
import { generateLicense, LicenseInfo, muiXTelemetrySettings } from "@mui/x-license";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    IconButton,
    LinearProgress,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import {
    ArrowBack,
    AutoGraph,
    CalendarMonth,
    CheckCircle,
    Delete,
    EmojiEvents,
    Refresh,
    Warning,
} from "@mui/icons-material";
import { BarChart, LineChart, PieChart } from "@mui/x-charts";

muiXTelemetrySettings.disableTelemetry();

const fallbackLicense = generateLicense({
    expiryDate: new Date(`${new Date().getFullYear() + 1}-12-31`),
    orderNumber: "MUI-LOCAL-DEV",
    planScope: "premium",
    licenseModel: "subscription",
    planVersion: "initial",
});

LicenseInfo.setLicenseKey(
    process.env.NEXT_PUBLIC_MUI_X_LICENSE_KEY?.trim() || fallbackLicense
);

interface Summary {
    total: number;
    wins: number;
    losses: number;
    breakeven: number;
    winRate: number;
    lossRate: number;
    beRate: number;
    netPnL: number;
    grossWin: number;
    grossLoss: number;
    avgWin: number;
    avgLoss: number;
    expectancy: number;
    profitFactor: number;
    maxDrawdownPct: number;
    maxConsecLosses: number;
    avgActualRR: number;
    planAdherenceAvg: number;
    avgHoldingMinutes: number;
    edgeScore: number;
    edgeScoreMax: number;
    sharpeRatio: number;
    dailyCapitalDays: number;
    dailyAvgPnL: number;
    highestPnL: number;
    lowestPnL: number;
    avgCharges: number;
    todayCharges: number;
}

interface AnalyticsData {
    summary: Summary;
    equityCurve: { date: string; equity: number; tradeNo: number }[];
    monthlyPnL: { month: string; pnl: number }[];
    byInstrument: { instrument: string; trades: number; pnl: number; winRate: number }[];
    bySetup: { setup: string; trades: number; pnl: number; winRate: number }[];
    byEmotion: { emotion: string; trades: number; pnl: number; winRate: number }[];
    byMistake: { mistake: string; count: number }[];
    edgeChecklist: { rule: string; pass: boolean }[];
}

interface DailyCapitalEntry {
    Date: string;
    StartingCapital: number;
    EndingCapital: number;
    NetPnL: number;
    DailyReturn: number;
}

interface FilterState {
    period: string;
    filterMode: "preset" | "custom";
    customRange: DateRange<Dayjs>;
}

interface ViewState {
    data: AnalyticsData | null;
    loading: boolean;
    dcEntries: DailyCapitalEntry[];
}

interface DailyCapitalState {
    dcDate: string;
    dcStart: string;
    dcEnd: string;
    dcNotes: string;
    dcSaving: boolean;
    dcSaved: boolean;
    dcDeleting: string | null;
}

const PERIOD_OPTIONS = [
    { label: "All Time", value: "all" },
    { label: "This Month", value: "month" },
    { label: "Last 30d", value: "30d" },
    { label: "Last 90d", value: "90d" },
    { label: "This Year", value: "year" },
];

const fmt = (n: number, dp = 2) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });

const pnlTone = (n: number) => (n > 0 ? "#22c55e" : n < 0 ? "#ef4444" : "#9ca3af");

function MetricCard({
    title,
    value,
    sub,
    tone,
    border,
    surface,
    text,
    radius,
    headingWeight,
    valueWeight,
}: {
    title: string;
    value: string;
    sub: string;
    tone: string;
    border: string;
    surface: string;
    text: string;
    radius: string;
    headingWeight: number;
    valueWeight: number;
}) {
    return (
        <Card sx={{ background: surface, border: `1px solid ${border}`, borderRadius: radius }}>
            <CardContent>
                <Typography variant="caption" sx={{ letterSpacing: 0.6, color: text, fontWeight: headingWeight }}>
                    {title}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1, color: tone, fontWeight: valueWeight, lineHeight: 1.1 }}>
                    {value}
                </Typography>
                <Typography variant="caption" sx={{ color: text, display: "block", mt: 1 }}>
                    {sub}
                </Typography>
            </CardContent>
        </Card>
    );
}

export default function AnalyticsPage() {
    const { palette, actualColorMode, designTheme } = useDesignTheme();
    const isDark = actualColorMode === "dark";
    const isApple = designTheme === "apple";

    const today = new Date().toISOString().slice(0, 10);
    const [viewState, setViewState] = useState<ViewState>({
        data: null,
        loading: true,
        dcEntries: [],
    });
    const [filterState, setFilterState] = useState<FilterState>({
        period: "all",
        filterMode: "preset",
        customRange: [null, null],
    });
    const [dailyCapitalState, setDailyCapitalState] = useState<DailyCapitalState>({
        dcDate: today,
        dcStart: "",
        dcEnd: "",
        dcNotes: "",
        dcSaving: false,
        dcSaved: false,
        dcDeleting: null,
    });

    const { data, loading, dcEntries } = viewState;
    const { period, filterMode, customRange } = filterState;
    const { dcDate, dcStart, dcEnd, dcNotes, dcSaving, dcSaved, dcDeleting } = dailyCapitalState;

    const surfaceBg = isApple
        ? isDark ? "rgba(30, 30, 34, 0.58)" : "rgba(255, 255, 255, 0.72)"
        : palette.surface;
    const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)";
    const textSoft = isDark ? "rgba(255,255,255,0.68)" : "rgba(0,0,0,0.58)";

    const cardRadius = isApple ? "18px" : "26px";
    const cardPadding = isApple ? 2 : 2.5;
    const headingWeight = isApple ? 700 : 900;
    const valueWeight = isApple ? 800 : 900;

    const pageBackground = isApple
        ? isDark
            ? "radial-gradient(120% 120% at 12% 0%, rgba(94,53,177,0.16), transparent 40%), radial-gradient(100% 90% at 100% 100%, rgba(0,122,255,0.14), transparent 35%)"
            : "radial-gradient(120% 120% at 12% 0%, rgba(94,53,177,0.10), transparent 45%), radial-gradient(100% 90% at 100% 100%, rgba(0,122,255,0.10), transparent 40%)"
        : isDark
            ? "linear-gradient(180deg, rgba(16,16,20,0.96) 0%, rgba(22,22,28,0.96) 100%)"
            : "linear-gradient(180deg, rgba(251,251,253,0.96) 0%, rgba(244,244,248,0.96) 100%)";

    const panelSx = {
        borderRadius: cardRadius,
        border: `1px solid ${borderColor}`,
        background: surfaceBg,
        backdropFilter: isApple ? "blur(20px) saturate(135%)" : "none",
        boxShadow: isApple
            ? (isDark ? "0 18px 56px rgba(0,0,0,0.35)" : "0 18px 44px rgba(15,23,42,0.14)")
            : (isDark ? "0 14px 28px rgba(0,0,0,0.42)" : "0 10px 20px rgba(15,23,42,0.12)"),
    };

    const controlButtonSx = {
        borderRadius: isApple ? "14px" : "18px",
        textTransform: "none",
        fontWeight: isApple ? 650 : 800,
        minHeight: isApple ? 38 : 48,
        color: palette.textPrimary,
    };

    const backButtonSx = {
        border: `1px solid ${borderColor}`,
        borderRadius: isApple ? "14px" : "18px",
        color: `${palette.textPrimary} !important`,
        background: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.03)",
        "&:hover": {
            background: isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)",
            borderColor: isDark ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.18)",
        },
    };

    const logButtonSx = {
        ...controlButtonSx,
        color: isDark ? "#03111f" : "#ffffff",
        background: palette.accent,
        border: `1px solid ${palette.accent}`,
        "&:hover": {
            background: isDark ? "#7bc0ff" : "#2563eb",
            borderColor: isDark ? "#7bc0ff" : "#2563eb",
        },
        "&.Mui-disabled": {
            color: isDark ? "rgba(255,255,255,0.56)" : "rgba(0,0,0,0.44)",
            background: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.10)",
            borderColor: isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.14)",
        },
    };

    const chartSx = {
        "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
            stroke: isDark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.25)",
        },
        "& .MuiChartsAxis-label, & .MuiChartsAxis-label tspan": {
            fill: `${palette.textPrimary} !important`,
            color: `${palette.textPrimary} !important`,
            fontWeight: isApple ? 550 : 750,
        },
        "& .MuiChartsLegend-label, & .MuiChartsLegend-label tspan": {
            fill: `${palette.textSecondary} !important`,
            color: `${palette.textSecondary} !important`,
            fontWeight: isApple ? 500 : 700,
        },
        "& .MuiChartsAxis-tickLabel, & .MuiChartsAxis-tickLabel tspan": {
            fill: `${palette.textSecondary} !important`,
            color: `${palette.textSecondary} !important`,
            fontWeight: isApple ? 520 : 720,
            fontSize: isApple ? 12 : 13,
        },
        "& .MuiChartsGrid-line": {
            stroke: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
            strokeDasharray: isApple ? "2 6" : "4 4",
        },
    };

    const inputSx = {
        "& .MuiInputLabel-root": {
            color: `${textSoft} !important`,
            fontWeight: isApple ? 520 : 760,
        },
        "& .MuiInputLabel-root.Mui-focused": {
            color: `${palette.accent} !important`,
        },
        "& .MuiOutlinedInput-root": {
            borderRadius: isApple ? "14px" : "18px",
            minHeight: isApple ? 44 : 50,
            fontWeight: isApple ? 500 : 700,
            color: `${palette.textPrimary} !important`,
            background: isApple
                ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)")
                : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.02)"),
        },
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: `${borderColor} !important`,
        },
        "& .MuiInputBase-input": {
            color: `${palette.textPrimary} !important`,
            WebkitTextFillColor: `${palette.textPrimary} !important`,
        },
        "& input, & textarea": {
            color: `${palette.textPrimary} !important`,
            WebkitTextFillColor: `${palette.textPrimary} !important`,
            caretColor: `${palette.textPrimary} !important`,
        },
        "& .MuiInputBase-input::placeholder": {
            color: `${palette.textSecondary} !important`,
            opacity: 1,
        },
        "& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus": {
            WebkitTextFillColor: `${palette.textPrimary} !important`,
            transition: "background-color 9999s ease-in-out 0s",
            boxShadow: `0 0 0px 1000px ${isDark ? "rgba(18,18,22,0.85)" : "rgba(255,255,255,0.88)"} inset`,
        },
        "& .MuiSvgIcon-root": {
            color: `${palette.textSecondary} !important`,
        },
        "& input[type='date']": {
            color: `${palette.textPrimary} !important`,
            WebkitTextFillColor: `${palette.textPrimary} !important`,
        },
        "& input[type='date']::-webkit-calendar-picker-indicator": {
            filter: isDark ? "invert(1) opacity(0.9)" : "invert(0) opacity(0.75)",
        },
    };

    const chartPalette = useMemo(
        () => ["#34d399", "#fb7185", "#f59e0b", "#60a5fa", "#a78bfa", "#2dd4bf", "#f97316", "#14b8a6"],
        []
    );

    const fetchDailyCapital = useCallback(async () => {
        const res = await fetch("/api/trade-journal/daily-capital?limit=30").then(r => r.json());
        if (res.success) {
            setViewState(prev => ({ ...prev, dcEntries: res.data as DailyCapitalEntry[] }));
        }
    }, []);

    const fetchAnalytics = useCallback(async () => {
        setViewState(prev => ({ ...prev, loading: true }));
        try {
            const params = new URLSearchParams();
            const now = new Date();

            if (filterMode === "custom") {
                const [start, end] = customRange;
                if (!start || !end) {
                    setViewState(prev => ({ ...prev, loading: false }));
                    return;
                }
                params.set("from", start.format("YYYY-MM-DD"));
                params.set("to", end.format("YYYY-MM-DD"));
            } else if (period === "month") {
                const from = new Date(now.getFullYear(), now.getMonth(), 1);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to", now.toISOString().slice(0, 10));
            } else if (period === "30d") {
                const from = new Date(now);
                from.setDate(now.getDate() - 30);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to", now.toISOString().slice(0, 10));
            } else if (period === "90d") {
                const from = new Date(now);
                from.setDate(now.getDate() - 90);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to", now.toISOString().slice(0, 10));
            } else if (period === "year") {
                const from = new Date(now.getFullYear(), 0, 1);
                params.set("from", from.toISOString().slice(0, 10));
                params.set("to", now.toISOString().slice(0, 10));
            }

            const res = await fetch(`/api/trade-journal/analytics?${params}`);
            const json = await res.json();
            if (json.success) {
                setViewState(prev => ({ ...prev, data: json.data as AnalyticsData }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setViewState(prev => ({ ...prev, loading: false }));
        }
    }, [customRange, filterMode, period]);

    useEffect(() => {
        fetchDailyCapital();
    }, [fetchDailyCapital]);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    const handleLogCapital = async () => {
        if (!dcDate || !dcStart || !dcEnd) return;
        setDailyCapitalState(prev => ({ ...prev, dcSaving: true }));
        try {
            await fetch("/api/trade-journal/daily-capital", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    Date: dcDate,
                    StartingCapital: parseFloat(dcStart),
                    EndingCapital: parseFloat(dcEnd),
                    Notes: dcNotes,
                }),
            });
            setDailyCapitalState(prev => ({
                ...prev,
                dcSaved: true,
                dcStart: "",
                dcEnd: "",
                dcNotes: "",
            }));
            setTimeout(() => {
                setDailyCapitalState(prev => ({ ...prev, dcSaved: false }));
            }, 1800);
            fetchDailyCapital();
            fetchAnalytics();
        } finally {
            setDailyCapitalState(prev => ({ ...prev, dcSaving: false }));
        }
    };

    const handleDeleteDc = async (date: string) => {
        setDailyCapitalState(prev => ({ ...prev, dcDeleting: date }));
        await fetch(`/api/trade-journal/daily-capital?date=${date}`, { method: "DELETE" });
        setDailyCapitalState(prev => ({ ...prev, dcDeleting: null }));
        fetchDailyCapital();
        fetchAnalytics();
    };

    const s = data?.summary;

    const equityLabels = (data?.equityCurve ?? []).map(p => `#${p.tradeNo}`);
    const equitySeries = (data?.equityCurve ?? []).map(p => p.equity);

    const monthly = data?.monthlyPnL ?? [];
    const instrumentTop = (data?.byInstrument ?? []).slice(0, 8);
    const setupTop = (data?.bySetup ?? []).slice(0, 8);
    const emotionData = (data?.byEmotion ?? []).slice(0, 8);
    const mistakeData = (data?.byMistake ?? []).slice(0, 8);

    const stats = s ? [
        { title: "Net P&L", value: `₹${fmt(s.netPnL)}`, sub: `Gross ₹${fmt(s.grossWin)} / Loss ₹${fmt(s.grossLoss)}`, tone: pnlTone(s.netPnL) },
        { title: "Daily Avg P&L", value: `₹${fmt(s.dailyAvgPnL)}`, sub: "Net per trading day", tone: pnlTone(s.dailyAvgPnL) },
        { title: "Win Rate", value: `${fmt(s.winRate)}%`, sub: `${s.wins}W ${s.losses}L ${s.breakeven}BE`, tone: s.winRate >= 50 ? "#22c55e" : "#f59e0b" },
        { title: "Profit Factor", value: s.profitFactor ? s.profitFactor.toFixed(2) : "-", sub: "Gross Win / Gross Loss", tone: s.profitFactor >= 1.5 ? "#22c55e" : "#f59e0b" },
        { title: "Highest P&L", value: `₹${fmt(s.highestPnL, 0)}`, sub: "Best trade", tone: pnlTone(s.highestPnL) },
        { title: "Lowest P&L", value: `₹${fmt(s.lowestPnL, 0)}`, sub: "Worst trade", tone: pnlTone(s.lowestPnL) },
        { title: "Average Charges", value: `₹${fmt(s.avgCharges)}`, sub: "Brokerage + taxes per trade", tone: "#f59e0b" },
        { title: "Today Charges", value: `₹${fmt(s.todayCharges)}`, sub: "Today brokerage + taxes", tone: s.todayCharges > 0 ? "#ef4444" : "#9ca3af" },
    ] : [];

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ maxWidth: 1400, mx: "auto", py: 4, px: { xs: 1.5, md: 2 }, pb: 12, background: pageBackground }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Link href="/trade-journal">
                                <IconButton sx={backButtonSx}>
                                    <ArrowBack sx={{ color: `${palette.textPrimary} !important` }} />
                                </IconButton>
                            </Link>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: valueWeight, color: palette.textPrimary, letterSpacing: isApple ? 0 : 0.2 }}>
                                    Analytics Command Center
                                </Typography>
                                <Typography variant="body2" sx={{ color: textSoft }}>
                                    Performance, behavior and risk in one view.
                                </Typography>
                            </Box>
                        </Stack>
                        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchAnalytics} sx={controlButtonSx}>
                            Refresh
                        </Button>
                    </Stack>
                </motion.div>

                <Card sx={{ mt: 2, ...panelSx }}>
                    <CardContent sx={{ p: cardPadding }}>
                        <Stack spacing={2}>
                            <Stack direction={{ xs: "column", lg: "row" }} gap={2} alignItems={{ lg: "center" }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 210 }}>
                                    <CalendarMonth sx={{ color: palette.accent }} />
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ color: palette.textPrimary, fontWeight: headingWeight }}>
                                            Date Wise Filter
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: textSoft }}>
                                            Presets or exact custom range.
                                        </Typography>
                                    </Box>
                                </Stack>

                                <Stack direction="row" flexWrap="wrap" gap={1}>
                                    {PERIOD_OPTIONS.map(opt => (
                                        <Button
                                            key={opt.value}
                                            size="small"
                                            variant={filterMode === "preset" && period === opt.value ? "contained" : "outlined"}
                                            sx={controlButtonSx}
                                            onClick={() => {
                                                setFilterState(prev => ({ ...prev, filterMode: "preset", period: opt.value }));
                                            }}
                                        >
                                            {opt.label}
                                        </Button>
                                    ))}
                                </Stack>
                            </Stack>

                            <Stack direction={{ xs: "column", lg: "row" }} gap={1.5}>
                                <DateRangePicker
                                    value={customRange}
                                    onChange={(next) => {
                                        setFilterState(prev => ({ ...prev, filterMode: "custom", customRange: next }));
                                    }}
                                    format="DD MMM YYYY"
                                    sx={{
                                        flex: 1,
                                        "& .MuiInputBase-root": {
                                            minHeight: isApple ? 44 : 50,
                                            borderRadius: isApple ? "14px" : "20px",
                                            background: isApple
                                                ? (isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.76)")
                                                : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.03)"),
                                            color: palette.textPrimary,
                                            fontWeight: isApple ? 520 : 760,
                                        },
                                        "& .MuiInputBase-input": {
                                            color: `${palette.textPrimary} !important`,
                                            WebkitTextFillColor: `${palette.textPrimary} !important`,
                                        },
                                        "& .MuiInputBase-input::placeholder": {
                                            color: `${palette.textSecondary} !important`,
                                            opacity: 1,
                                        },
                                        "& .MuiDateRangePickerInput-root, & .MuiDateRangePickerInput-root span": {
                                            color: `${palette.textPrimary} !important`,
                                        },
                                        "& .MuiDateRangePickerInput-root .MuiDateRangePickerInput-rangeSeparator": {
                                            color: `${palette.textSecondary} !important`,
                                        },
                                        "& [class*='MuiDateRangePickerInput']": {
                                            color: `${palette.textPrimary} !important`,
                                        },
                                        "& [class*='MuiDateRangePickerInput'] *": {
                                            color: `${palette.textPrimary} !important`,
                                            WebkitTextFillColor: `${palette.textPrimary} !important`,
                                        },
                                        "& .MuiDateRangePickerInput-sectionContent": {
                                            color: `${palette.textPrimary} !important`,
                                        },
                                        "& .MuiDateRangePickerInput-sectionContent.Mui-selected": {
                                            color: "#fff !important",
                                        },
                                        "& .MuiInputAdornment-root": {
                                            color: `${palette.textSecondary} !important`,
                                        },
                                        "& .MuiOutlinedInput-notchedOutline": {
                                            borderColor: borderColor,
                                        },
                                        "& .MuiSvgIcon-root": {
                                            color: palette.accent,
                                        },
                                    }}
                                    slotProps={{
                                        textField: {
                                            sx: {
                                                ...inputSx,
                                                "& .MuiPickersInputBase-root": {
                                                    color: `${palette.textPrimary} !important`,
                                                    borderRadius: isApple ? "14px" : "18px",
                                                    minHeight: isApple ? 44 : 50,
                                                },
                                                "& .MuiPickersSectionList-root": {
                                                    color: `${palette.textPrimary} !important`,
                                                },
                                                "& .MuiPickersSectionList-sectionContent": {
                                                    color: `${palette.textPrimary} !important`,
                                                    WebkitTextFillColor: `${palette.textPrimary} !important`,
                                                },
                                                "& .MuiPickersRangeSeparator-root": {
                                                    color: `${palette.textSecondary} !important`,
                                                },
                                            },
                                        },
                                        popper: {
                                            sx: {
                                                "& .MuiPaper-root": {
                                                    borderRadius: isApple ? "18px" : "24px",
                                                    background: isApple
                                                        ? (isDark ? "rgba(26,26,30,0.82)" : "rgba(255,255,255,0.90)")
                                                        : (isDark ? "rgba(22,22,26,0.98)" : "rgba(255,255,255,0.98)"),
                                                    border: `1px solid ${borderColor}`,
                                                    backdropFilter: isApple ? "blur(18px) saturate(130%)" : "none",
                                                },
                                                "& .MuiTypography-root, & .MuiDayCalendar-weekDayLabel, & .MuiPickersCalendarHeader-label": {
                                                    color: `${palette.textPrimary} !important`,
                                                },
                                                "& .MuiPickersCalendarHeader-switchViewButton, & .MuiPickersArrowSwitcher-button": {
                                                    color: `${palette.textPrimary} !important`,
                                                },
                                                "& .MuiPickersSectionList-root, & .MuiPickersSectionList-sectionContent": {
                                                    color: `${palette.textPrimary} !important`,
                                                },
                                                "& .MuiPickersDay-root": {
                                                    borderRadius: isApple ? "10px" : "14px",
                                                    fontWeight: isApple ? 500 : 800,
                                                    color: `${palette.textPrimary} !important`,
                                                },
                                                "& .MuiPickersDay-root.Mui-selected": {
                                                    background: palette.accent,
                                                },
                                                "& .MuiDateRangePickerDay-rangeIntervalDayHighlight": {
                                                    background: `${palette.accent}30`,
                                                },
                                            },
                                        },
                                    }}
                                />
                                <Button size="small" sx={controlButtonSx} onClick={() => {
                                    const d = dayjs();
                                    setFilterState(prev => ({ ...prev, filterMode: "custom", customRange: [d, d] }));
                                }}>
                                    Today
                                </Button>
                                <Button size="small" sx={controlButtonSx} onClick={() => {
                                    const d = dayjs().subtract(1, "day");
                                    setFilterState(prev => ({ ...prev, filterMode: "custom", customRange: [d, d] }));
                                }}>
                                    Yesterday
                                </Button>
                                <Button
                                    size="small"
                                    sx={{ ...controlButtonSx, color: palette.textSecondary, borderColor: borderColor }}
                                    onClick={() => {
                                        setFilterState(prev => ({ ...prev, filterMode: "preset", period: "all", customRange: [null, null] }));
                                    }}
                                >
                                    Clear
                                </Button>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {loading && <LinearProgress sx={{ mt: 2, borderRadius: 999 }} />}

                {s && (
                    <Card sx={{ mt: 2, ...panelSx }}>
                        <CardContent sx={{ p: cardPadding }}>
                            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <AutoGraph sx={{ color: palette.accent }} />
                                    <Box>
                                        <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary }}>
                                            Edge Score {s.edgeScore}/{s.edgeScoreMax}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: textSoft }}>
                                            {s.edgeScore >= 6 ? "Strong system behavior" : s.edgeScore >= 4 ? "Developing edge" : "Insufficient edge quality"}
                                        </Typography>
                                    </Box>
                                </Stack>
                                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                                    {Array.from({ length: s.edgeScoreMax }).map((_, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: isApple ? "6px" : "4px",
                                                background: i < s.edgeScore ? palette.accent : `${palette.accent}2e`,
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                )}

                <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.5 }}>
                    {stats.map(item => (
                        <MetricCard
                            key={item.title}
                            title={item.title}
                            value={item.value}
                            sub={item.sub}
                            tone={item.tone}
                            border={borderColor}
                            surface={surfaceBg}
                            text={textSoft}
                            radius={cardRadius}
                            headingWeight={headingWeight}
                            valueWeight={valueWeight}
                        />
                    ))}
                </Box>

                <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" }, gap: 1.5 }}>
                    <Card sx={panelSx}>
                        <CardContent sx={{ p: cardPadding }}>
                            <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary, mb: 1.5 }}>Equity Curve</Typography>
                            {equitySeries.length ? (
                                <LineChart
                                    height={320}
                                    sx={chartSx}
                                    xAxis={[{ scaleType: "point", data: equityLabels }]}
                                    yAxis={[{ valueFormatter: (v: number | null) => `₹${fmt((v ?? 0) as number, 0)}` }]}
                                    series={[{ data: equitySeries, area: true, color: pnlTone(equitySeries[equitySeries.length - 1] ?? 0), showMark: false }]}
                                    grid={{ horizontal: true }}
                                />
                            ) : (
                                <Typography sx={{ color: textSoft, py: 8, textAlign: "center" }}>No closed trades yet.</Typography>
                            )}
                        </CardContent>
                    </Card>

                    <Card sx={panelSx}>
                        <CardContent sx={{ p: cardPadding }}>
                            <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary, mb: 1 }}>Emotion Mix</Typography>
                            {emotionData.length ? (
                                <PieChart
                                    height={320}
                                    sx={chartSx}
                                    series={[{
                                        innerRadius: isApple ? 54 : 36,
                                        outerRadius: 110,
                                        paddingAngle: 2,
                                        cornerRadius: isApple ? 6 : 2,
                                        data: emotionData.map((e, i) => ({ id: e.emotion, value: e.trades, label: e.emotion.replace(/_/g, " "), color: chartPalette[i % chartPalette.length] })),
                                    }]}
                                />
                            ) : (
                                <Typography sx={{ color: textSoft, py: 8, textAlign: "center" }}>No emotion data.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5 }}>
                    <Card sx={panelSx}>
                        <CardContent sx={{ p: cardPadding }}>
                            <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary, mb: 1.5 }}>Monthly P&L</Typography>
                            {monthly.length ? (
                                <BarChart
                                    height={300}
                                    sx={chartSx}
                                    xAxis={[{ scaleType: "band", data: monthly.map(m => m.month) }]}
                                    yAxis={[{ valueFormatter: (v: number | null) => `₹${fmt((v ?? 0) as number, 0)}` }]}
                                    series={[{ data: monthly.map(m => m.pnl), color: isApple ? palette.accent : "#4f46e5" }]}
                                    grid={{ horizontal: true }}
                                />
                            ) : (
                                <Typography sx={{ color: textSoft, py: 8, textAlign: "center" }}>No monthly data.</Typography>
                            )}
                        </CardContent>
                    </Card>

                    <Card sx={panelSx}>
                        <CardContent sx={{ p: cardPadding }}>
                            <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary, mb: 1.5 }}>Top Instruments by P&L</Typography>
                            {instrumentTop.length ? (
                                <BarChart
                                    layout="horizontal"
                                    height={300}
                                    sx={chartSx}
                                    yAxis={[{ scaleType: "band", data: instrumentTop.map(i => i.instrument) }]}
                                    xAxis={[{ valueFormatter: (v: number | null) => `₹${fmt((v ?? 0) as number, 0)}` }]}
                                    series={[{ data: instrumentTop.map(i => i.pnl), color: isApple ? "#60a5fa" : "#0ea5e9" }]}
                                    grid={{ vertical: true }}
                                />
                            ) : (
                                <Typography sx={{ color: textSoft, py: 8, textAlign: "center" }}>No instrument data.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                <Box sx={{ mt: 1.5, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 1.5 }}>
                    <Card sx={panelSx}>
                        <CardContent sx={{ p: cardPadding }}>
                            <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary, mb: 1.5 }}>Setups by P&L</Typography>
                            {setupTop.length ? (
                                <BarChart
                                    layout="horizontal"
                                    height={300}
                                    sx={chartSx}
                                    yAxis={[{ scaleType: "band", data: setupTop.map(i => i.setup.replace(/_/g, " ")) }]}
                                    xAxis={[{ valueFormatter: (v: number | null) => `₹${fmt((v ?? 0) as number, 0)}` }]}
                                    series={[{ data: setupTop.map(i => i.pnl), color: isApple ? "#14b8a6" : "#22c55e" }]}
                                    grid={{ vertical: true }}
                                />
                            ) : (
                                <Typography sx={{ color: textSoft, py: 8, textAlign: "center" }}>No setup data.</Typography>
                            )}
                        </CardContent>
                    </Card>

                    <Card sx={panelSx}>
                        <CardContent sx={{ p: cardPadding }}>
                            <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary, mb: 1.5 }}>Mistake Frequency</Typography>
                            {mistakeData.length ? (
                                <BarChart
                                    layout="horizontal"
                                    height={300}
                                    sx={chartSx}
                                    yAxis={[{ scaleType: "band", data: mistakeData.map(i => i.mistake.replace(/_/g, " ")) }]}
                                    xAxis={[{}]}
                                    series={[{ data: mistakeData.map(i => i.count), color: isApple ? "#fb7185" : "#ef4444" }]}
                                    grid={{ vertical: true }}
                                />
                            ) : (
                                <Typography sx={{ color: textSoft, py: 8, textAlign: "center" }}>No mistake data.</Typography>
                            )}
                        </CardContent>
                    </Card>
                </Box>

                {data && s && (
                    <Card sx={{ mt: 1.5, ...panelSx }}>
                        <CardContent sx={{ p: cardPadding }}>
                            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <EmojiEvents sx={{ color: palette.accent }} />
                                    <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary }}>Edge Validation Checklist</Typography>
                                </Stack>
                                <Chip color={s.edgeScore >= 6 ? "success" : s.edgeScore >= 4 ? "warning" : "error"} label={`${s.edgeScore}/${s.edgeScoreMax} Rules Passing`} />
                            </Stack>
                            <Divider sx={{ my: 1.5 }} />
                            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", xl: "repeat(4, minmax(0,1fr))" }, gap: 1 }}>
                                {data.edgeChecklist.map(item => (
                                    <Chip
                                        key={item.rule}
                                        icon={item.pass ? <CheckCircle /> : <Warning />}
                                        label={item.rule}
                                        color={item.pass ? "success" : "error"}
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                )}

                <Card sx={{ mt: 1.5, ...panelSx }}>
                    <CardContent sx={{ p: cardPadding }}>
                        <Typography sx={{ fontWeight: headingWeight, color: palette.textPrimary }}>Daily Capital Logger</Typography>
                        <Typography variant="caption" sx={{ color: textSoft }}>
                            Sharpe input: add one portfolio snapshot after market close.
                        </Typography>

                        <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0,1fr))" }, gap: 1 }}>
                            <TextField
                                label="Date"
                                type="date"
                                value={dcDate}
                                onChange={(e) => setDailyCapitalState(prev => ({ ...prev, dcDate: e.target.value }))}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                sx={inputSx}
                            />
                            <TextField
                                label="Starting Capital"
                                type="number"
                                value={dcStart}
                                onChange={(e) => setDailyCapitalState(prev => ({ ...prev, dcStart: e.target.value }))}
                                size="small"
                                sx={inputSx}
                            />
                            <TextField
                                label="Ending Capital"
                                type="number"
                                value={dcEnd}
                                onChange={(e) => setDailyCapitalState(prev => ({ ...prev, dcEnd: e.target.value }))}
                                size="small"
                                sx={inputSx}
                            />
                            <TextField
                                label="Notes"
                                value={dcNotes}
                                onChange={(e) => setDailyCapitalState(prev => ({ ...prev, dcNotes: e.target.value }))}
                                size="small"
                                sx={inputSx}
                            />
                        </Box>

                        <Stack direction="row" gap={1} sx={{ mt: 1.5 }}>
                            <Button variant="contained" sx={logButtonSx} disabled={dcSaving || !dcDate || !dcStart || !dcEnd} onClick={handleLogCapital}>
                                {dcSaving ? "Saving..." : dcSaved ? "Saved" : "Log Capital"}
                            </Button>
                            {!!dcStart && !!dcEnd && parseFloat(dcStart) > 0 && (
                                <Chip
                                    color={parseFloat(dcEnd) >= parseFloat(dcStart) ? "success" : "error"}
                                    label={`Daily Return ${(((parseFloat(dcEnd) - parseFloat(dcStart)) / parseFloat(dcStart)) * 100).toFixed(2)}%`}
                                />
                            )}
                        </Stack>

                        {dcEntries.length > 0 && (
                            <TableContainer sx={{ mt: 2, border: `1px solid ${borderColor}`, borderRadius: isApple ? "14px" : "18px" }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: textSoft, fontWeight: headingWeight }}>Date</TableCell>
                                            <TableCell sx={{ color: textSoft, fontWeight: headingWeight }}>Start</TableCell>
                                            <TableCell sx={{ color: textSoft, fontWeight: headingWeight }}>End</TableCell>
                                            <TableCell sx={{ color: textSoft, fontWeight: headingWeight }}>Net P&L</TableCell>
                                            <TableCell sx={{ color: textSoft, fontWeight: headingWeight }}>Return %</TableCell>
                                            <TableCell align="right" sx={{ color: textSoft, fontWeight: headingWeight }}>Action</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {dcEntries.map(entry => {
                                            const ret = (entry.DailyReturn ?? 0) * 100;
                                            const pos = ret >= 0;
                                            return (
                                                <TableRow key={entry.Date}>
                                                    <TableCell sx={{ color: palette.textPrimary }}>{entry.Date}</TableCell>
                                                    <TableCell sx={{ color: palette.textPrimary }}>{fmt(entry.StartingCapital, 0)}</TableCell>
                                                    <TableCell sx={{ color: palette.textPrimary }}>{fmt(entry.EndingCapital, 0)}</TableCell>
                                                    <TableCell sx={{ color: pos ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                                                        {pos ? "+" : ""}₹{fmt(Math.abs(entry.NetPnL), 0)}
                                                    </TableCell>
                                                    <TableCell sx={{ color: pos ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                                                        {pos ? "+" : ""}{ret.toFixed(3)}%
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <IconButton color="error" size="small" disabled={dcDeleting === entry.Date} onClick={() => handleDeleteDc(entry.Date)}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </LocalizationProvider>
    );
}
