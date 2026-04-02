/**
 * Todo — /tools/todo
 * Minimal, theme-adaptive todo list with localStorage persistence.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { useDesignTheme, useToolDefaults } from "@Hooks";
import { LiquidGlassCard } from "@Components/Atoms/LiquidGlass";
import { OneUICard } from "@Components/Atoms/OneUI";
import ToolPageWrapper from "@Components/Organisms/Tools/ToolPageWrapper";
import { CheckCircleOutline, RadioButtonUnchecked, Delete, Add, FilterList, Edit, Save, ChecklistRtl } from "@mui/icons-material";

interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "tools_todo_items";

export default function TodoPage() {
    const { designTheme, palette, actualColorMode } = useDesignTheme();
    const isApple = designTheme === "apple";
    const isDark = actualColorMode === "dark";
    const Card = isApple ? LiquidGlassCard : OneUICard;

    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [input, setInput] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [editId, setEditId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const { defaults: toolDefaults } = useToolDefaults();
    const defaultsApplied = React.useRef(false);

    useEffect(() => {
        if (defaultsApplied.current || !toolDefaults.todo) return;
        defaultsApplied.current = true;
        if (toolDefaults.todo.defaultFilter) setFilter(toolDefaults.todo.defaultFilter as Filter);
    }, [toolDefaults]);

    // Load from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setTodos(JSON.parse(raw));
        } catch {
            /* ignore */
        }
    }, []);

    // Persist
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    }, [todos]);

    const addTodo = useCallback(() => {
        const text = input.trim();
        if (!text) return;
        setTodos((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                text,
                completed: false,
                createdAt: Date.now()
            }
        ]);
        setInput("");
    }, [input]);

    const toggleTodo = (id: string) => setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

    const deleteTodo = (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id));

    const saveEdit = () => {
        if (!editId) return;
        setTodos((prev) => prev.map((t) => (t.id === editId ? { ...t, text: editText } : t)));
        setEditId(null);
        setEditText("");
    };

    const clearCompleted = () => setTodos((prev) => prev.filter((t) => !t.completed));

    const filtered = todos.filter((t) => {
        if (filter === "active") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
    });

    const active = todos.filter((t) => !t.completed).length;

    const filters: { value: Filter; label: string }[] = [
        { value: "all", label: `All (${todos.length})` },
        { value: "active", label: `Active (${active})` },
        { value: "completed", label: `Done (${todos.length - active})` }
    ];

    return (
        <ToolPageWrapper
            title="Todo"
            description="Simple task list with local storage"
            icon={<ChecklistRtl sx={{ fontSize: 24 }} />}
            accentColor="#5E97F6">
            <div className="max-w-2xl mx-auto space-y-5">
                {/* ── Add input ── */}
                <Card>
                    <div className="flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addTodo()}
                            placeholder="Add a task…"
                            className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                            style={{
                                background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                color: palette.textPrimary,
                                border: `1.5px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
                                borderRadius: isApple ? "12px" : "16px"
                            }}
                        />
                        <motion.button
                            onClick={addTodo}
                            className="flex items-center justify-center px-4 rounded-full text-sm font-bold"
                            style={{
                                background: palette.accent,
                                color: "#fff",
                                minWidth: 48
                            }}
                            whileTap={{ scale: 0.93 }}>
                            <Add sx={{ fontSize: 20 }} />
                        </motion.button>
                    </div>
                </Card>

                {/* ── Filters ── */}
                <div className="flex items-center justify-between">
                    <div className="flex gap-1.5">
                        {filters.map((f) => (
                            <motion.button
                                key={f.value}
                                onClick={() => setFilter(f.value)}
                                className="px-3 py-1.5 rounded-full text-xs font-bold"
                                style={{
                                    background:
                                        filter === f.value ? palette.accent : isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    color: filter === f.value ? "#fff" : palette.textSecondary
                                }}
                                whileTap={{ scale: 0.95 }}>
                                {f.label}
                            </motion.button>
                        ))}
                    </div>

                    {todos.length - active > 0 && (
                        <motion.button
                            onClick={clearCompleted}
                            className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{
                                color: "#FF3B30",
                                background: "rgba(255,59,48,.12)"
                            }}
                            whileTap={{ scale: 0.95 }}>
                            Clear done
                        </motion.button>
                    )}
                </div>

                {/* ── Todo list ── */}
                <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                        {filtered.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-center py-16"
                                style={{ color: palette.textTertiary }}>
                                <ChecklistRtl sx={{ fontSize: 48, opacity: 0.3 }} />
                                <p className="mt-3 text-sm">{filter === "all" ? "No tasks yet — add one above" : `No ${filter} tasks`}</p>
                            </motion.div>
                        )}

                        {filtered.map((todo) => (
                            <motion.div
                                key={todo.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -60 }}
                                transition={{ duration: 0.25 }}>
                                <Card>
                                    <div className="flex items-center gap-3">
                                        {/* Checkbox */}
                                        <motion.button
                                            onClick={() => toggleTodo(todo.id)}
                                            whileTap={{ scale: 0.85 }}
                                            style={{
                                                color: todo.completed ? "#34C759" : palette.textTertiary
                                            }}>
                                            {todo.completed ? (
                                                <CheckCircleOutline sx={{ fontSize: 24 }} />
                                            ) : (
                                                <RadioButtonUnchecked sx={{ fontSize: 24 }} />
                                            )}
                                        </motion.button>

                                        {/* Text or edit input */}
                                        {editId === todo.id ? (
                                            <input
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                                                autoFocus
                                                className="flex-1 px-3 py-1.5 rounded-lg text-sm outline-none"
                                                style={{
                                                    background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                                                    color: palette.textPrimary,
                                                    border: `1px solid ${palette.accent}`
                                                }}
                                            />
                                        ) : (
                                            <span
                                                className={`flex-1 text-sm ${todo.completed ? "line-through opacity-50" : ""}`}
                                                style={{
                                                    color: palette.textPrimary
                                                }}>
                                                {todo.text}
                                            </span>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            {editId === todo.id ? (
                                                <motion.button
                                                    onClick={saveEdit}
                                                    whileTap={{ scale: 0.9 }}
                                                    style={{
                                                        color: "#34C759"
                                                    }}>
                                                    <Save sx={{ fontSize: 18 }} />
                                                </motion.button>
                                            ) : (
                                                <motion.button
                                                    onClick={() => {
                                                        setEditId(todo.id);
                                                        setEditText(todo.text);
                                                    }}
                                                    whileTap={{ scale: 0.9 }}
                                                    style={{
                                                        color: palette.textTertiary
                                                    }}>
                                                    <Edit sx={{ fontSize: 18 }} />
                                                </motion.button>
                                            )}
                                            <motion.button
                                                onClick={() => deleteTodo(todo.id)}
                                                whileTap={{ scale: 0.9 }}
                                                style={{ color: "#FF3B30" }}>
                                                <Delete sx={{ fontSize: 18 }} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </ToolPageWrapper>
    );
}
