/**
 * Shop Page
 * Public product listing — licenses, subscriptions, physical & digital items.
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import {
    ShoppingCart,
    Search,
    FilterList,
    Star,
    LocalOffer,
    Bolt,
    Inventory2,
    Subscriptions,
    Key,
    ArrowForward,
    CheckCircle
} from "@mui/icons-material";

interface ProductVariant {
    variantId: string;
    name: string;
    price: number;
    currency: string;
    billingCycle: string;
    features: string[];
    isPopular?: boolean;
    isActive: boolean;
}

interface Product {
    _id: string;
    productId: string;
    name: string;
    slug: string;
    shortDescription?: string;
    description: string;
    type: string;
    status: string;
    category: string;
    tags: string[];
    thumbnail?: string;
    variants: ProductVariant[];
    totalSales: number;
    rating: number;
    reviewCount: number;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    license: <Key fontSize="small" />,
    subscription: <Subscriptions fontSize="small" />,
    physical: <Inventory2 fontSize="small" />,
    digital: <Bolt fontSize="small" />
};

const TYPE_COLORS: Record<string, string> = {
    license: "#AF52DE",
    subscription: "#007AFF",
    physical: "#FF9500",
    digital: "#34C759"
};

function formatPrice(price: number, currency: string): string {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        minimumFractionDigits: 0
    }).format(price / 100);
}

function BillingLabel({ cycle }: { cycle: string }) {
    const labels: Record<string, string> = {
        one_time: "",
        monthly: "/mo",
        quarterly: "/qtr",
        yearly: "/yr"
    };
    return <span className="text-xs opacity-60">{labels[cycle] ?? ""}</span>;
}

function ProductCard({ product }: { product: Product }) {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const defaultVariant = product.variants.find((v) => v.isActive) || product.variants[0];
    const popularVariant = product.variants.find((v) => v.isPopular && v.isActive) || defaultVariant;
    const typeColor = TYPE_COLORS[product.type] || "#007AFF";
    const [cartAdding, setCartAdding] = useState(false);
    const [cartDone, setCartDone] = useState(false);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        setCartAdding(true);
        try {
            await fetch("/api/shop/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: product.productId,
                    variantId: popularVariant?.variantId,
                    quantity: 1
                })
            });
            setCartDone(true);
            setTimeout(() => setCartDone(false), 2000);
        } catch {
            /* silent */
        }
        setCartAdding(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full rounded-2xl overflow-hidden"
            style={{
                background: isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                backdropFilter: isApple ? "blur(24px) saturate(180%)" : "none",
                borderRadius: isApple ? 20 : 24
            }}>
            {/* Thumbnail */}
            <div
                className="relative h-44 flex items-center justify-center"
                style={{ background: `${typeColor}15` }}>
                {product.thumbnail ? (
                    <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div
                        style={{
                            color: typeColor,
                            fontSize: 56,
                            opacity: 0.5
                        }}>
                        {TYPE_ICONS[product.type]}
                    </div>
                )}
                {/* Type badge */}
                <div
                    className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: `${typeColor}22`, color: typeColor }}>
                    {TYPE_ICONS[product.type]}
                    <span className="capitalize">{product.type}</span>
                </div>
                {popularVariant?.isPopular && (
                    <div
                        className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold"
                        style={{ background: "#FF9500", color: "#fff" }}>
                        Popular
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-5 flex flex-col gap-3">
                <div>
                    <p
                        className="text-xs font-semibold mb-1"
                        style={{ color: typeColor }}>
                        {product.category}
                    </p>
                    <h3
                        className={`${isApple ? "text-lg font-semibold" : "text-xl font-black"} leading-snug mb-1`}
                        style={{ color: palette.textPrimary }}>
                        {product.name}
                    </h3>
                    <p
                        className="text-sm leading-relaxed line-clamp-2"
                        style={{ color: palette.textSecondary }}>
                        {product.shortDescription || product.description}
                    </p>
                </div>

                {/* Tags */}
                {product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {product.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: palette.textSecondary
                                }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Rating */}
                {product.reviewCount > 0 && (
                    <div className="flex items-center gap-1.5">
                        <Star style={{ color: "#FFCC00", fontSize: 16 }} />
                        <span
                            className="text-sm font-semibold"
                            style={{ color: palette.textPrimary }}>
                            {product.rating.toFixed(1)}
                        </span>
                        <span
                            className="text-xs"
                            style={{ color: palette.textSecondary }}>
                            ({product.reviewCount})
                        </span>
                    </div>
                )}

                {/* Pricing */}
                {popularVariant && (
                    <div className="mt-auto">
                        <div className="flex items-baseline gap-1">
                            <span
                                className={`${isApple ? "text-2xl font-bold" : "text-3xl font-black"}`}
                                style={{ color: palette.textPrimary }}>
                                {formatPrice(popularVariant.price, popularVariant.currency)}
                            </span>
                            <BillingLabel cycle={popularVariant.billingCycle} />
                        </div>
                        {product.variants.length > 1 && (
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: palette.textSecondary }}>
                                {product.variants.length} plans available
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 flex gap-2">
                <Link
                    href={`/shop/${product.slug}`}
                    className="flex-1">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                        style={{
                            background: `${typeColor}15`,
                            color: typeColor
                        }}>
                        View Details <ArrowForward fontSize="small" />
                    </motion.button>
                </Link>
                <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddToCart}
                    disabled={cartAdding || cartDone}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5"
                    style={{
                        background: cartDone ? "#34C759" : palette.accent,
                        color: "#fff",
                        minWidth: 44
                    }}>
                    {cartDone ? <CheckCircle fontSize="small" /> : <ShoppingCart fontSize="small" />}
                </motion.button>
            </div>
        </motion.div>
    );
}

const CATEGORIES = ["All", "License", "Subscription", "Physical", "Digital"];

export default function ShopPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "12",
                ...(search ? { search } : {}),
                ...(typeFilter ? { type: typeFilter } : {})
            });
            const res = await fetch(`/api/shop/products?${params}`);
            const json = await res.json();
            if (json.success) {
                setProducts(json.data);
                setTotalPages(json.pagination?.pages ?? 1);
            }
        } catch {
            /* silent */
        }
        setLoading(false);
    }, [page, search, typeFilter]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const cardStyle = {
        background: isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.95)" : "#fff",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        backdropFilter: isApple ? "blur(20px) saturate(180%)" : "none"
    };

    return (
        <div
            className="min-h-screen py-12 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-4"
                        style={{
                            background: `${palette.accent}18`,
                            color: palette.accent
                        }}>
                        <LocalOffer fontSize="small" /> Shop
                    </div>
                    <h1
                        className={`${isApple ? "text-4xl font-semibold" : "text-5xl font-black"} mb-3`}
                        style={{ color: palette.textPrimary }}>
                        Products & Licenses
                    </h1>
                    <p
                        className="text-lg max-w-2xl mx-auto"
                        style={{ color: palette.textSecondary }}>
                        Licenses, subscriptions, and tools — everything you need to build faster.
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-wrap gap-3 items-center mb-8">
                    {/* Search */}
                    <div
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 min-w-[200px]"
                        style={{ ...cardStyle, borderRadius: 14 }}>
                        <Search
                            style={{
                                color: palette.textSecondary,
                                fontSize: 20
                            }}
                        />
                        <input
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            placeholder="Search products…"
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ color: palette.textPrimary }}
                        />
                    </div>

                    {/* Type filter */}
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORIES.map((cat) => (
                            <motion.button
                                key={cat}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => {
                                    setTypeFilter(cat === "All" ? "" : cat.toLowerCase());
                                    setPage(1);
                                }}
                                className="px-4 py-2 rounded-xl text-sm font-semibold"
                                style={{
                                    background:
                                        typeFilter === cat.toLowerCase() || (cat === "All" && !typeFilter)
                                            ? palette.accent
                                            : isDark
                                              ? "rgba(255,255,255,0.07)"
                                              : "rgba(0,0,0,0.05)",
                                    color:
                                        typeFilter === cat.toLowerCase() || (cat === "All" && !typeFilter) ? "#fff" : palette.textSecondary
                                }}>
                                {cat}
                            </motion.button>
                        ))}
                    </div>

                    {/* Cart link */}
                    <Link href="/shop/cart">
                        <motion.button
                            whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
                            style={{
                                background: palette.accent,
                                color: "#fff"
                            }}>
                            <ShoppingCart fontSize="small" /> Cart
                        </motion.button>
                    </Link>
                </motion.div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-80 rounded-2xl animate-pulse"
                                style={{
                                    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"
                                }}
                            />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24">
                        <Inventory2
                            style={{
                                fontSize: 64,
                                color: palette.textTertiary,
                                opacity: 0.4
                            }}
                        />
                        <p
                            className="mt-4 text-lg font-semibold"
                            style={{ color: palette.textSecondary }}>
                            No products found
                        </p>
                        <p
                            className="text-sm mt-1"
                            style={{ color: palette.textTertiary }}>
                            Try adjusting your search or filters.
                        </p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((p, i) => (
                            <motion.div
                                key={p._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}>
                                <ProductCard product={p} />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-10">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                            <motion.button
                                key={n}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setPage(n)}
                                className="w-10 h-10 rounded-xl text-sm font-bold"
                                style={{
                                    background: n === page ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                                    color: n === page ? "#fff" : palette.textSecondary
                                }}>
                                {n}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
