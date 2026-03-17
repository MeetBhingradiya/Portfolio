"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    TrendingUp,
    TrendingDown,
    Stop,
    Lock,
    BarChart,
    DateRange,
    AttachMoney,
    Shield,
    GpsFixed,
    CheckCircle,
    Description,
    TrendingFlat,
    Warning,
    MenuBook,
    Newspaper,
    School,
} from "@mui/icons-material";
import { Box, Container, Typography, Card, Stack, Chip, Divider } from "@mui/material";

interface TradingRule {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    category: "risk" | "discipline" | "execution" | "psychology" | "protection" | "learning";
    color: string;
}

const TRADING_RULES: TradingRule[] = [
    {
        id: 1,
        title: "Max 3 Trades per Day",
        description: "Limit yourself to a maximum of 3 trade executions daily to prevent overtrading and maintain focus.",
        icon: <BarChart />,
        category: "discipline",
        color: "#1976d2",
    },
    {
        id: 2,
        title: "2 Losses in a Row - Stop Trading",
        description: "If you experience 2 consecutive losing trades, stop trading for the rest of the day to prevent emotional decisions.",
        icon: <TrendingDown />,
        category: "psychology",
        color: "#d32f2f",
    },
    {
        id: 3,
        title: "1.4% Profit Minimum",
        description: "Each trade must generate at least 1.4% profit to cover taxes, brokerage fees, and ensure net positive returns.",
        icon: <AttachMoney />,
        category: "execution",
        color: "#388e3c",
    },
    {
        id: 4,
        title: "Single Simultaneously Open Position",
        description: "Only maintain one open position at a time to simplify risk management and maintain clarity.",
        icon: <Lock />,
        category: "risk",
        color: "#7b1fa2",
    },
    {
        id: 5,
        title: "Max 6 Buy/Sell Orders per Day",
        description: "Limit the total number of buy and sell orders to 6 per trading day to control activity and focus.",
        icon: <TrendingFlat />,
        category: "discipline",
        color: "#f57c00",
    },
    {
        id: 6,
        title: "Skip Monday & Friday",
        description: "No trading on Mondays and Fridays to avoid market volatility and give yourself trading-free days.",
        icon: <DateRange />,
        category: "discipline",
        color: "#c2185b",
    },
    {
        id: 7,
        title: "Account Monitoring & Kill Switch",
        description: "Dhan account ownership allows for real-time monitoring and the ability to immediately close positions if needed.",
        icon: <Shield />,
        category: "protection",
        color: "#00796b",
    },
    {
        id: 8,
        title: "ATM Only - 10 Lots (65 Qty)",
        description: "Trade only At-The-Money (ATM) options with a fixed position size of 10 lots (65 quantity per trade).",
        icon: <GpsFixed />,
        category: "execution",
        color: "#0097a7",
    },
    {
        id: 9,
        title: "No Social Media Distractions",
        description: "Avoid YouTube, Instagram, and Telegram to maintain focus and prevent emotional/impulsive trading decisions.",
        icon: <Warning />,
        category: "psychology",
        color: "#d32f2f",
    },
    {
        id: 10,
        title: "Capital Preservation First",
        description: "Prioritize protecting your capital above all else—it's more important than chasing trades or profits.",
        icon: <AttachMoney />,
        category: "risk",
        color: "#388e3c",
    },
    {
        id: 11,
        title: "Fixed Stop Loss & Target",
        description: "Establish stop loss and target prices BEFORE entering a trade. Never move them once the trade is active.",
        icon: <Stop />,
        category: "discipline",
        color: "#d32f2f",
    },
    {
        id: 12,
        title: "Plan Before Trade",
        description: "Always have a clear, documented plan before placing any trade. No plan = no trade.",
        icon: <Description />,
        category: "discipline",
        color: "#1976d2",
    },
    {
        id: 13,
        title: "No Trade Screenshots",
        description: "Don't take or share screenshots of your trades. Focus on learning, not showing off or ego-boosting.",
        icon: <MenuBook />,
        category: "psychology",
        color: "#7b1fa2",
    },
    {
        id: 14,
        title: "Mandatory Trade Journal",
        description: "Document every trade with entry, exit, stop loss, target, and reasoning to build a learning feedback loop.",
        icon: <Newspaper />,
        category: "learning",
        color: "#f57c00",
    },
    {
        id: 15,
        title: "Weekly Review",
        description: "Review all trades weekly to analyze what worked, what didn't, and identify areas for improvement.",
        icon: <CheckCircle />,
        category: "learning",
        color: "#388e3c",
    },
    {
        id: 16,
        title: "1:2 Risk-Reward Ratio",
        description: "Always maintain a minimum 1:2 risk-reward ratio. Potential profit must be at least twice your potential loss.",
        icon: <TrendingUp />,
        category: "execution",
        color: "#388e3c",
    },
    {
        id: 17,
        title: "Risk Only 1-2% Per Trade",
        description: "Never risk more than 1-2% of your total capital on a single trade to protect your account.",
        icon: <Shield />,
        category: "risk",
        color: "#00796b",
    },
    {
        id: 18,
        title: "Building Your Legacy",
        description: "God gave you vision; now show discipline. Build an empire unseen in your bloodline with consistent, smart trading.",
        icon: <School />,
        category: "psychology",
        color: "#7b1fa2",
    },
    {
        id: 19,
        title: "Stay Market-Informed",
        description: "Always keep updated with market news and events that could impact your trades.",
        icon: <Newspaper />,
        category: "learning",
        color: "#f57c00",
    },
];

const CATEGORY_COLORS: Record<string, string> = {
    risk: "#ff6b6b",
    discipline: "#4ecdc4",
    execution: "#45b7d1",
    psychology: "#f9ca24",
    protection: "#6c5ce7",
    learning: "#a29bfe",
};

const CATEGORY_LABELS: Record<string, string> = {
    risk: "Risk Management",
    discipline: "Discipline",
    execution: "Execution",
    psychology: "Psychology",
    protection: "Protection",
    learning: "Learning & Analysis",
};

export default function TradingRulesPage() {
    const { palette, designTheme } = useDesignTheme();
    const isApple = designTheme === "apple";

    const groupedRules = useMemo(() => {
        const grouped: Record<string, TradingRule[]> = {
            risk: [],
            discipline: [],
            execution: [],
            psychology: [],
            protection: [],
            learning: [],
        };
        TRADING_RULES.forEach((rule) => grouped[rule.category].push(rule));
        return grouped;
    }, []);

    const containerBg = isApple
        ? "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)"
        : `linear-gradient(135deg, ${palette.surface}20 0%, ${palette.surface}10 100%)`;

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: isApple
                    ? "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)"
                    : `linear-gradient(135deg, ${palette.background} 0%, ${palette.background} 100%)`,
                py: { xs: 3, md: 6 },
            }}
        >
            <Container maxWidth="lg">
                {/* Header Section */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <Stack spacing={2} sx={{ mb: { xs: 4, md: 6 }, textAlign: "center" }}>
                        <Typography
                            variant="h2"
                            sx={{
                                fontSize: { xs: "2rem", md: "3.5rem" },
                                fontWeight: 700,
                                background: isApple
                                    ? "linear-gradient(135deg, #fff 0%, #ccc 100%)"
                                    : `linear-gradient(135deg, ${palette.accent} 0%, ${palette.accent} 100%)`,
                                backgroundClip: "text",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                            }}
                        >
                            Trading Rules
                        </Typography>
                        <Typography
                            variant="body1"
                            sx={{
                                fontSize: { xs: "1rem", md: "1.25rem" },
                                color: isApple ? "rgba(255, 255, 255, 0.7)" : palette.textSecondary,
                                maxWidth: "600px",
                                mx: "auto",
                            }}
                        >
                            Your Complete Trading Discipline Framework — 19 Essential Rules for Consistent, Profitable Trading
                        </Typography>
                    </Stack>
                </motion.div>

                {/* Rules by Category */}
                <Stack spacing={{ xs: 4, md: 6 }}>
                    {Object.entries(groupedRules).map((entry, categoryIndex) => {
                        const [category, rules] = entry;
                        if (rules.length === 0) return null;

                        return (
                            <motion.div
                                key={category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                            >
                                <Stack spacing={2}>
                                    {/* Category Header */}
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                                        <Box
                                            sx={{
                                                width: "4px",
                                                height: "32px",
                                                borderRadius: "2px",
                                                background: CATEGORY_COLORS[category],
                                            }}
                                        />
                                        <Typography
                                            variant="h5"
                                            sx={{
                                                fontWeight: 600,
                                                color: isApple ? "rgba(255, 255, 255, 0.9)" : palette.textPrimary,
                                                fontSize: { xs: "1.1rem", md: "1.5rem" },
                                            }}
                                        >
                                            {CATEGORY_LABELS[category]}
                                        </Typography>
                                        <Chip
                                            label={`${rules.length} Rules`}
                                            size="small"
                                            sx={{
                                                background: `${CATEGORY_COLORS[category]}20`,
                                                color: CATEGORY_COLORS[category],
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Box>

                                    {/* Rules Grid */}
                                    <Stack spacing={2}>
                                        {rules.map((rule, ruleIndex) => (
                                            <motion.div
                                                key={rule.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.4, delay: ruleIndex * 0.05 }}
                                                whileHover={{ x: 4 }}
                                            >
                                                <Card
                                                    sx={{
                                                        background: containerBg,
                                                        border: `1px solid ${CATEGORY_COLORS[category]}30`,
                                                        backdropFilter: "blur(8px)",
                                                        borderRadius: { xs: "12px", md: "16px" },
                                                        p: { xs: 2, md: 3 },
                                                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                                        cursor: "pointer",
                                                        _hover: {
                                                            borderColor: `${CATEGORY_COLORS[category]}60`,
                                                        },
                                                        "&:hover": {
                                                            borderColor: `${CATEGORY_COLORS[category]}60`,
                                                            boxShadow: isApple
                                                                ? `0 8px 32px rgba(175, 82, 222, 0.15)`
                                                                : `0 8px 32px ${CATEGORY_COLORS[category]}15`,
                                                        },
                                                    }}
                                                >
                                                    <Stack spacing={1.5}>
                                                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                                                            <Box
                                                                sx={{
                                                                    width: { xs: "40px", md: "48px" },
                                                                    height: { xs: "40px", md: "48px" },
                                                                    borderRadius: "12px",
                                                                    background: `${CATEGORY_COLORS[category]}20`,
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    flexShrink: 0,
                                                                    color: CATEGORY_COLORS[category],
                                                                    "& svg": {
                                                                        fontSize: { xs: "1.5rem", md: "1.75rem" },
                                                                    },
                                                                }}
                                                            >
                                                                {rule.icon}
                                                            </Box>
                                                            <Stack spacing={0.5} flex={1}>
                                                                <Typography
                                                                    variant="h6"
                                                                    sx={{
                                                                        fontWeight: 600,
                                                                        color: isApple ? "rgba(255, 255, 255, 0.95)" : palette.textPrimary,
                                                                        fontSize: { xs: "1rem", md: "1.1rem" },
                                                                    }}
                                                                >
                                                                    Rule {rule.id}: {rule.title}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: isApple ? "rgba(255, 255, 255, 0.65)" : palette.textSecondary,
                                                                lineHeight: 1.6,
                                                                fontSize: { xs: "0.9rem", md: "1rem" },
                                                            }}
                                                        >
                                                            {rule.description}
                                                        </Typography>
                                                    </Stack>
                                                </Card>
                                            </motion.div>
                                        ))}
                                    </Stack>

                                    {/* Category Divider */}
                                    {categoryIndex < Object.keys(groupedRules).length - 1 && (
                                        <Divider
                                            sx={{
                                                my: { xs: 1, md: 2 },
                                                borderColor: isApple ? "rgba(255, 255, 255, 0.1)" : `${palette.accent}20`,
                                            }}
                                        />
                                    )}
                                </Stack>
                            </motion.div>
                        );
                    })}
                </Stack>

                {/* Footer Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    <Card
                        sx={{
                            mt: { xs: 4, md: 6 },
                            background: containerBg,
                            border: `1px solid ${palette.accent}30`,
                            backdropFilter: "blur(8px)",
                            borderRadius: { xs: "12px", md: "16px" },
                            p: { xs: 2.5, md: 3.5 },
                            textAlign: "center",
                        }}
                    >
                        <Stack spacing={1.5}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    color: isApple ? "rgba(255, 255, 255, 0.9)" : palette.textPrimary,
                                    fontSize: { xs: "1rem", md: "1.2rem" },
                                }}
                            >
                                The Foundation of Profitable Trading
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: isApple ? "rgba(255, 255, 255, 0.65)" : palette.textSecondary,
                                    lineHeight: 1.7,
                                    fontSize: { xs: "0.9rem", md: "1rem" },
                                }}
                            >
                                These 19 rules form the backbone of a disciplined trading approach. Success comes from consistent adherence to these principles, not from chasing profits. Master these rules, execute them flawlessly, and build the empire you envision.
                            </Typography>
                        </Stack>
                    </Card>
                </motion.div>
            </Container>
        </Box>
    );
}
