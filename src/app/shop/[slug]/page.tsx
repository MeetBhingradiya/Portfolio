/**
 * Shop — Product Detail Page
 * Displays product info, variants, and allows adding to cart.
 */
"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useDesignTheme } from "@Hooks/useDesignTheme";
import { ShoppingCart, Check, ArrowBack, Star, LocalOffer, Bolt, Inventory2 } from "@mui/icons-material";

interface Variant {
    variantId: string;
    label: string;
    price: number;
    currency: string;
    billingCycle: string;
    features: string[];
    stock?: number;
    isPopular?: boolean;
}

interface Product {
    _id: string;
    productId: string;
    name: string;
    slug: string;
    type: string;
    tagline: string;
    description: string;
    coverImage?: string;
    variants: Variant[];
    tags: string[];
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    license: <LocalOffer fontSize="small" />,
    subscription: <Bolt fontSize="small" />,
    physical: <Inventory2 fontSize="small" />,
    digital: <Star fontSize="small" />
};

export default function ProductDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);
    const [error, setError] = useState("");

    const cardBg = isApple ? (isDark ? "rgba(28,28,32,0.75)" : "rgba(255,255,255,0.75)") : isDark ? "rgba(24,24,28,0.98)" : "#fff";
    const border = `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`;

    useEffect(() => {
        const load = async () => {
            const res = await fetch(`/api/shop/products/${slug}`);
            const json = await res.json();
            if (json.success) {
                setProduct(json.data);
                const popular = json.data.variants.find((v: Variant) => v.isPopular);
                setSelectedVariant(popular?.variantId ?? json.data.variants[0]?.variantId ?? null);
            }
            setLoading(false);
        };
        load();
    }, [slug]);

    const addToCart = async () => {
        if (!product || !selectedVariant) return;
        setAdding(true);
        setError("");
        const res = await fetch("/api/shop/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                productId: product._id,
                variantId: selectedVariant,
                quantity: 1
            })
        });
        const json = await res.json();
        if (json.success) {
            setAdded(true);
            setTimeout(() => setAdded(false), 2500);
        } else {
            setError(json.error ?? "Failed to add to cart.");
        }
        setAdding(false);
    };

    const cycle = (c: string) => (c === "one_time" ? "one-time" : c === "monthly" ? "/mo" : c === "quarterly" ? "/qtr" : "/yr");

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: palette.background }}>
                <div
                    className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                    style={{ borderColor: palette.accent }}
                />
            </div>
        );
    }

    if (!product) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center gap-4"
                style={{ background: palette.background }}>
                <p
                    className="text-xl font-bold"
                    style={{ color: palette.textPrimary }}>
                    Product not found
                </p>
                <Link href="/shop">
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        className="px-5 py-2.5 rounded-xl font-bold"
                        style={{ background: palette.accent, color: "#fff" }}>
                        Back to Shop
                    </motion.button>
                </Link>
            </div>
        );
    }

    const currentVariant = product.variants.find((v) => v.variantId === selectedVariant) ?? product.variants[0];

    return (
        <div
            className="min-h-screen py-12 px-4 md:px-8"
            style={{ background: palette.background }}>
            <div className="max-w-5xl mx-auto">
                {/* Back */}
                <Link href="/shop">
                    <motion.button
                        whileHover={{ x: -3 }}
                        className="flex items-center gap-2 text-sm font-bold mb-8"
                        style={{ color: palette.accent }}>
                        <ArrowBack fontSize="small" /> Back to Shop
                    </motion.button>
                </Link>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left — Product info */}
                    <motion.div
                        initial={{ opacity: 0, x: -24 }}
                        animate={{ opacity: 1, x: 0 }}>
                        {product.coverImage && (
                            <div className="w-full aspect-video rounded-3xl overflow-hidden mb-6">
                                <img
                                    src={product.coverImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-2 mb-3">
                            <span
                                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full"
                                style={{
                                    background: `${palette.accent}18`,
                                    color: palette.accent
                                }}>
                                {TYPE_ICONS[product.type]} {product.type}
                            </span>
                            {product.tags.map((t) => (
                                <span
                                    key={t}
                                    className="text-xs px-2.5 py-1 rounded-full"
                                    style={{
                                        background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                        color: palette.textSecondary
                                    }}>
                                    {t}
                                </span>
                            ))}
                        </div>

                        <h1
                            className={`${isApple ? "text-3xl font-semibold" : "text-4xl font-black"} mb-2`}
                            style={{ color: palette.textPrimary }}>
                            {product.name}
                        </h1>
                        <p
                            className="text-lg mb-4"
                            style={{ color: palette.textSecondary }}>
                            {product.tagline}
                        </p>
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: palette.textSecondary }}>
                            {product.description}
                        </p>

                        {/* Features of selected variant */}
                        {currentVariant?.features?.length > 0 && (
                            <div className="mt-6 space-y-2">
                                <p
                                    className="text-xs font-black uppercase tracking-widest"
                                    style={{ color: palette.textTertiary }}>
                                    Includes
                                </p>
                                {currentVariant.features.map((f) => (
                                    <div
                                        key={f}
                                        className="flex items-center gap-2 text-sm"
                                        style={{ color: palette.textPrimary }}>
                                        <Check
                                            fontSize="small"
                                            style={{ color: "#34C759" }}
                                        />{" "}
                                        {f}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Right — Variant & purchase */}
                    <motion.div
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4">
                        <div
                            className="p-6 rounded-3xl space-y-4"
                            style={{
                                background: cardBg,
                                border,
                                backdropFilter: isApple ? "blur(20px)" : "none"
                            }}>
                            <p
                                className="text-xs font-black uppercase tracking-widest"
                                style={{ color: palette.textTertiary }}>
                                Choose a plan
                            </p>

                            {product.variants.map((v) => (
                                <motion.div
                                    key={v.variantId}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => setSelectedVariant(v.variantId)}
                                    className="p-4 rounded-2xl cursor-pointer relative"
                                    style={{
                                        border: `2px solid ${selectedVariant === v.variantId ? palette.accent : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                                        background:
                                            selectedVariant === v.variantId
                                                ? `${palette.accent}10`
                                                : isDark
                                                  ? "rgba(255,255,255,0.03)"
                                                  : "rgba(0,0,0,0.02)"
                                    }}>
                                    {v.isPopular && (
                                        <div
                                            className="absolute -top-2.5 right-4 text-xs font-black px-3 py-0.5 rounded-full"
                                            style={{
                                                background: palette.accent,
                                                color: "#fff"
                                            }}>
                                            Most Popular
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    borderColor:
                                                        selectedVariant === v.variantId
                                                            ? palette.accent
                                                            : isDark
                                                              ? "rgba(255,255,255,0.2)"
                                                              : "rgba(0,0,0,0.2)"
                                                }}>
                                                {selectedVariant === v.variantId && (
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full"
                                                        style={{
                                                            background: palette.accent
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <p
                                                    className="font-bold text-sm"
                                                    style={{
                                                        color: palette.textPrimary
                                                    }}>
                                                    {v.label}
                                                </p>
                                                {v.stock !== undefined && (
                                                    <p
                                                        className="text-xs"
                                                        style={{
                                                            color: v.stock > 0 ? "#34C759" : "#FF3B30"
                                                        }}>
                                                        {v.stock > 0 ? `${v.stock} in stock` : "Out of stock"}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className="font-black text-xl"
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                ${(v.price / 100).toFixed(2)}
                                            </p>
                                            <p
                                                className="text-xs"
                                                style={{
                                                    color: palette.textSecondary
                                                }}>
                                                {cycle(v.billingCycle)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {error && (
                                <p
                                    className="text-sm text-center"
                                    style={{ color: "#FF3B30" }}>
                                    {error}
                                </p>
                            )}

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={addToCart}
                                disabled={adding || added || !selectedVariant}
                                className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2"
                                style={{
                                    background: added ? "#34C759" : palette.accent,
                                    color: "#fff",
                                    opacity: !selectedVariant ? 0.5 : 1
                                }}>
                                {added ? (
                                    <>
                                        <Check /> Added to Cart
                                    </>
                                ) : adding ? (
                                    "Adding…"
                                ) : (
                                    <>
                                        <ShoppingCart /> Add to Cart
                                    </>
                                )}
                            </motion.button>

                            <Link href="/shop/cart">
                                <p
                                    className="text-center text-sm font-bold"
                                    style={{ color: palette.accent }}>
                                    View Cart →
                                </p>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
