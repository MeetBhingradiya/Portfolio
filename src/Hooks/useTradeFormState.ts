/**
 * Consolidated Trade Form State Management
 * - Single useReducer for all form fields (replacing multiple useState)
 * - Auto-save to localStorage for instant recovery
 * - Debounced auto-save to backend drafts (optional)
 * - Loads existing draft on mount
 */
"use client";

import { useReducer, useEffect, useRef, useCallback, useState } from "react";
import { TradeFormData } from "@App/trade-journal/components/TradeForm";

const DRAFT_STORAGE_KEY = "tradeform_draft";
const DRAFT_TIMESTAMP_KEY = "tradeform_draft_timestamp";
const DRAFT_ID_KEY = "tradeform_draft_id";
const AUTO_SAVE_DELAY_MS = 3000; // Save draft 3s after last change
const DRAFT_EXPIRY_HOURS = 24;

type FormAction =
    | { type: "SET_FIELD"; key: keyof TradeFormData; value: any }
    | { type: "RESET_FORM"; data: Partial<TradeFormData> }
    | { type: "MERGE_FORM"; data: Partial<TradeFormData> }
    | { type: "CLEAR_DRAFT" };

const initialFormState: TradeFormData = {
    Date: new Date().toISOString().slice(0, 10),
    EntryTime: "09:15 AM",
    ExitTime: "",
    InstrumentName: "",
    Segment: "OPTIONS",
    PositionDuration: "SHORT",
    OptionType: "",
    Strike: "",
    Expiry: "",
    EntryPrice: "",
    ExitPrice: "",
    StopLoss: "",
    Target: "",
    Quantity: "",
    LotSize: "",
    Brokerage: "",
    Taxes: "",
    IsHit: "AUTO",
    PnLAmount: "",
    PnLSign: "PROFIT",
    SetupType: "",
    StrategyName: "",
    MarketCondition: "",
    EmotionalState: "",
    MistakeType: "",
    Notes: "",
    Tags: "",
    AttachmentLinks: "",
    ScreenshotCdnUrls: [],
};

function formReducer(state: TradeFormData, action: FormAction): TradeFormData {
    switch (action.type) {
        case "SET_FIELD":
            return { ...state, [action.key]: action.value };
        case "RESET_FORM":
            return { ...initialFormState, ...action.data };
        case "MERGE_FORM":
            return { ...state, ...action.data };
        case "CLEAR_DRAFT":
            return initialFormState;
        default:
            return state;
    }
}

interface UseTradeFormStateReturn {
    form: TradeFormData;
    setField: (key: keyof TradeFormData, value: any) => void;
    resetForm: (data?: Partial<TradeFormData>) => void;
    mergeForm: (data: Partial<TradeFormData>) => void;
    clearDraft: () => void;
    saveDraft: (asBackend?: boolean) => Promise<void>;
    hasDraft: boolean;
    draftAge: number; // milliseconds
    lastSaveTime: number;
    draftSaving: boolean;
}

interface UseTradeFormStateOptions {
    enableBackendDraft?: boolean;
    enableLocalDraft?: boolean;
}

function toDraftPayload(form: TradeFormData) {
    return {
        ...form,
        Instrument: (form.Instrument || form.InstrumentName || "").toUpperCase(),
        Direction: form.PositionDuration,
        PositionDuration: form.PositionDuration,
        StrikePrice: form.Strike !== "" && form.Strike != null ? Number(form.Strike) : undefined,
        EntryPrice: form.EntryPrice !== "" ? Number(form.EntryPrice) : undefined,
        ExitPrice: form.ExitPrice !== "" ? Number(form.ExitPrice) : undefined,
        StopLoss: form.StopLoss !== "" ? Number(form.StopLoss) : undefined,
        Target: form.Target !== "" ? Number(form.Target) : undefined,
        Quantity: form.Quantity !== "" ? Number(form.Quantity) : undefined,
        LotSize: form.LotSize !== "" ? Number(form.LotSize) : undefined,
        PnLAmount: form.PnLAmount !== "" ? Number(form.PnLAmount) : undefined,
        Tags: form.Tags ? form.Tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        Screenshots: form.AttachmentLinks
            ? form.AttachmentLinks.split(",").map((s: string) => s.trim()).filter(Boolean)
            : form.ScreenshotCdnUrls || [],
        IsDraft: true,
        DraftID: form.DraftID,
        AttachmentUrls: Array.isArray(form.ScreenshotCdnUrls) ? form.ScreenshotCdnUrls : [],
    };
}

export function useTradeFormState(initialData?: Partial<TradeFormData>, options?: UseTradeFormStateOptions): UseTradeFormStateReturn {
    const [form, dispatch] = useReducer(formReducer, { ...initialFormState, ...initialData });
    const [hasDraft, setHasDraft] = useState(false);
    const [lastSaveTime, setLastSaveTime] = useState(0);
    const [draftSaving, setDraftSaving] = useState(false);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const draftTimestampRef = useRef<number>(0);
    const draftIdRef = useRef<string>(String(initialData?.DraftID || ""));
    const enableBackendDraft = Boolean(options?.enableBackendDraft);
    const enableLocalDraft = options?.enableLocalDraft !== false;

    // Load draft from localStorage on mount
    useEffect(() => {
        if (!enableLocalDraft) return;
        if (typeof window === "undefined") return;

        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        const savedTimestamp = localStorage.getItem(DRAFT_TIMESTAMP_KEY);

        if (savedDraft && savedTimestamp) {
            const ageHours = (Date.now() - parseInt(savedTimestamp)) / (1000 * 60 * 60);

            // Only load draft if it's less than 24 hours old
            if (ageHours < DRAFT_EXPIRY_HOURS) {
                try {
                    const draftData = JSON.parse(savedDraft);
                    const draftId = localStorage.getItem(DRAFT_ID_KEY) || "";
                    dispatch({ type: "MERGE_FORM", data: draftData });
                    if (draftId) {
                        draftIdRef.current = draftId;
                        dispatch({ type: "SET_FIELD", key: "DraftID", value: draftId });
                    }
                    setHasDraft(true);
                    draftTimestampRef.current = parseInt(savedTimestamp);
                } catch (e) {
                    console.error("Failed to load draft:", e);
                }
            } else {
                // Clear expired draft
                localStorage.removeItem(DRAFT_STORAGE_KEY);
                localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
                localStorage.removeItem(DRAFT_ID_KEY);
            }
        }
    }, [enableLocalDraft]);

    // Auto-save to localStorage on form change (with debounce)
    useEffect(() => {
        if (!enableLocalDraft) return;
        if (typeof window === "undefined") return;

        // Clear previous timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Set new timer to save after delay
        autoSaveTimerRef.current = setTimeout(async () => {
            try {
                localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form));
                localStorage.setItem(DRAFT_TIMESTAMP_KEY, Date.now().toString());
                setHasDraft(true);
                draftTimestampRef.current = Date.now();
                setLastSaveTime(Date.now());

                if (enableBackendDraft) {
                    setDraftSaving(true);
                    const res = await fetch("/api/trade-journal/draft", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(toDraftPayload(form)),
                    });
                    const json = await res.json();
                    if (json.success && json.data?.DraftID) {
                        draftIdRef.current = json.data.DraftID;
                        localStorage.setItem(DRAFT_ID_KEY, json.data.DraftID);
                        dispatch({ type: "SET_FIELD", key: "DraftID", value: json.data.DraftID });
                    }
                }
            } catch (e) {
                console.error("Failed to save draft to localStorage:", e);
            } finally {
                setDraftSaving(false);
            }
        }, AUTO_SAVE_DELAY_MS);

        // Cleanup
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [form, enableBackendDraft, enableLocalDraft]);

    // Save draft on demand
    const saveDraft = useCallback(async (asBackend = false) => {
        if (!asBackend) return;

        try {
            const payload = toDraftPayload(form);
            const res = await fetch("/api/trade-journal/draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (json.success && json.data?.DraftID) {
                draftIdRef.current = json.data.DraftID;
                if (typeof window !== "undefined") {
                    localStorage.setItem(DRAFT_ID_KEY, json.data.DraftID);
                }
                dispatch({ type: "SET_FIELD", key: "DraftID", value: json.data.DraftID });
            }
            setLastSaveTime(Date.now());
        } catch (e) {
            console.error("Failed to save draft to backend:", e);
        }
    }, [form]);

    const setField = useCallback((key: keyof TradeFormData, value: any) => {
        dispatch({ type: "SET_FIELD", key, value });
    }, []);

    const resetForm = useCallback((data?: Partial<TradeFormData>) => {
        dispatch({ type: "RESET_FORM", data: data || {} });
    }, []);

    const mergeForm = useCallback((data: Partial<TradeFormData>) => {
        dispatch({ type: "MERGE_FORM", data });
    }, []);

    const clearDraftFn = useCallback(() => {
        dispatch({ type: "CLEAR_DRAFT" });
        if (typeof window !== "undefined") {
            localStorage.removeItem(DRAFT_STORAGE_KEY);
            localStorage.removeItem(DRAFT_TIMESTAMP_KEY);
            localStorage.removeItem(DRAFT_ID_KEY);
        }
        draftIdRef.current = "";
        setHasDraft(false);
        draftTimestampRef.current = 0;
    }, []);

    const draftAge = hasDraft ? Date.now() - draftTimestampRef.current : 0;

    return {
        form,
        setField,
        resetForm,
        mergeForm,
        clearDraft: clearDraftFn,
        saveDraft,
        hasDraft,
        draftAge,
        lastSaveTime,
        draftSaving,
    };
}
