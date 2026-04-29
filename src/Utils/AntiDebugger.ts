/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║              ANTI-DEBUGGER ENGINE — Meet Bhingradiya                 ║
 * ║  Layer 1 : Debugger Traps (pause the attacker's DevTools)            ║
 * ║  Layer 2 : Anti-Extension Tackle (defeat Anti-anti-debug extensions) ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * HOW ATTACKERS WORK
 * ──────────────────
 * Common "Anti Anti-Debugger" browser extensions (e.g., "AA-Debugger",
 * "Disable Debugger", etc.) defeat protection by:
 *   1. Hooking `Function.prototype.toString` so toString-based checks fail.
 *   2. Patching `console` methods to suppress timing side-channels.
 *   3. No-op-ing the `debugger` keyword via devtools "never pause here" rules.
 *   4. Overriding `performance.now` / `Date.now` to hide timing deltas.
 *   5. Wrapping native APIs in Proxy to intercept devtools property access.
 *
 * WHAT WE DO ABOUT IT
 * ───────────────────
 *   • Steal pristine native references from a sandboxed <iframe> before any
 *     extension can hook the top-level window.
 *   • Verify the integrity of every native function we use.
 *   • Run multiple INDEPENDENT detection channels so defeating one still
 *     triggers the others.
 *   • Encode the most sensitive checks inside `eval(atob(...))` so static
 *     analysis / extension content-scripts can't find and patch the strings.
 *   • React to detection with obfuscated, delayed countermeasures rather
 *     than an obvious `console.warn("debugger detected")`.
 */

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */

type DetectionChannel =
    | "timing"
    | "devtools-size"
    | "toString-integrity"
    | "console-hook"
    | "proxy-trap"
    | "debugger-skip"
    | "extension-script";

interface ThreatReport {
    channel: DetectionChannel;
    detail: string;
    ts: number;
}

type ActionHandler = (reports: ThreatReport[]) => void;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Config                                                                      */
/* ─────────────────────────────────────────────────────────────────────────── */

const CFG = {
    /** ms — a debugger pause takes longer than this */
    TIMING_THRESHOLD_MS: 120,
    /** px — devtools side-panel widens the window by roughly this much */
    DEVTOOLS_WIDTH_THRESHOLD: 160,
    /** ms — how often we poll timing / size checks */
    POLL_INTERVAL_MS: 1_500,
    /** ms — delay before taking the drastic action (avoid false positives) */
    ACTION_DEBOUNCE_MS: 2_500,
    /** number of independent detections before acting */
    DETECTION_QUORUM: 2
} as const;

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Pristine native references (iframe sandbox)                                */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Anti-Anti-Debug extensions inject their hooks into `window` before scripts
 * run.  A freshly created, same-origin <iframe> gets a clean copy of all
 * built-ins BEFORE the extension's content-script can reach it because the
 * extension hooks are installed on the top-level window object only.
 */
function getPristineNatives(): {
    toString: typeof Function.prototype.toString;
    perfNow: () => number;
    dateNow: () => number;
    getOwnPropDesc: typeof Object.getOwnPropertyDescriptor;
    jsonStringify: typeof JSON.stringify;
} {
    if (typeof document === "undefined") {
        // SSR — return the module-level references (not used server-side anyway)
        return {
            toString: Function.prototype.toString,
            perfNow: () => performance.now(),
            dateNow: Date.now,
            getOwnPropDesc: Object.getOwnPropertyDescriptor,
            jsonStringify: JSON.stringify
        };
    }

    try {
        const iframe = document.createElement("iframe");
        iframe.style.cssText = "display:none;width:0;height:0;border:0";
        document.documentElement.appendChild(iframe);

        const iwin = iframe.contentWindow as Window & typeof globalThis;

        const natives = {
            toString: iwin.Function.prototype.toString,
            perfNow: iwin.performance.now.bind(iwin.performance),
            dateNow: iwin.Date.now.bind(iwin.Date),
            getOwnPropDesc: iwin.Object.getOwnPropertyDescriptor.bind(iwin.Object),
            jsonStringify: iwin.JSON.stringify.bind(iwin.JSON)
        };

        iframe.remove();
        return natives;
    } catch {
        // Fallback — best-effort with top-level references
        return {
            toString: Function.prototype.toString,
            perfNow: () => performance.now(),
            dateNow: Date.now,
            getOwnPropDesc: Object.getOwnPropertyDescriptor,
            jsonStringify: JSON.stringify
        };
    }
}

/** Create a small Dedicated Worker to provide an isolated timing source. */
function createTimingWorker(): Worker | null {
    if (typeof window === "undefined" || typeof Blob === "undefined") return null;

    try {
        const code = `self.addEventListener('message', (e) => { if (e.data === 'ping') { self.postMessage({ workerNow: (typeof performance !== 'undefined') ? performance.now() : Date.now(), ts: Date.now() }); } });`;
        const blob = new Blob([code], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const w = new Worker(url);
        // Release the object URL; worker keeps running.
        URL.revokeObjectURL(url);
        return w;
    } catch {
        return null;
    }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Helper — native code check                                                  */
/* ─────────────────────────────────────────────────────────────────────────── */

function isNative(fn: Function, pristineToString: typeof Function.prototype.toString): boolean {
    try {
        const src = pristineToString.call(fn);
        return /\[native code\]/.test(src);
    } catch {
        // toString itself threw — high probability it is hooked
        return false;
    }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Anti-Debugger Engine                                                        */
/* ─────────────────────────────────────────────────────────────────────────── */

export class AntiDebuggerEngine {
    private readonly _natives = getPristineNatives();
    private readonly _reports: ThreatReport[] = [];
    private readonly _seenChannels = new Set<DetectionChannel>();
    private _actionHandler: ActionHandler | null = null;
    private _actionTimer: ReturnType<typeof setTimeout> | null = null;
    private _intervalId: ReturnType<typeof setInterval> | null = null;
    private _trapIntervalId: ReturnType<typeof setInterval> | null = null;
    private _active = false;
    private _worker: Worker | null = null;
    private _workerAvailable = false;
    private _workerBaseline = 0;
    private _baselineToString: string | null = null;
    private _baselineConsole: Record<string, string> | null = null;

    /* ── Public API ─────────────────────────────────────────────────────── */

    /**
     * Start the engine.
     * @param onDetect Called when a threat is confirmed (quorum reached).
     */
    start(onDetect: ActionHandler): this {
        if (this._active) return this;
        this._active = true;
        this._actionHandler = onDetect;

        // Init worker timing channel + fast calibration
        this._worker = createTimingWorker();
        this._workerAvailable = !!this._worker;
        if (this._worker) {
            // calibrate with a few quick pings
            (async () => {
                try {
                    const samples: number[] = [];
                    for (let i = 0; i < 4; i++) {
                        const r = await this._workerPing();
                        samples.push(r);
                        await new Promise((s) => setTimeout(s, 40));
                    }
                    const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
                    this._workerBaseline = avg;
                } catch {
                    this._workerBaseline = 0;
                }
            })();
        }

        // Capture a lightweight baseline snapshot to detect live tampering
        try {
            this._baselineToString = this._natives.toString.call(Function.prototype.toString);
            const methods = ["log", "warn", "error", "debug", "table"] as const;
            const b: Record<string, string> = {};
            for (const m of methods) {
                try {
                    const fn = console[m] as Function;
                    b[m] = this._natives.toString.call(fn);
                } catch {
                    b[m] = "";
                }
            }
            this._baselineConsole = b;
        } catch {
            this._baselineToString = null;
            this._baselineConsole = null;
        }

        this._runLayer1_DebuggerTrap();
        this._runLayer2_AntiExtensionTackle();
        this._startPolling();

        return this;
    }

    stop(): this {
        this._active = false;
        if (this._intervalId) clearInterval(this._intervalId);
        if (this._trapIntervalId) clearInterval(this._trapIntervalId);
        if (this._worker) {
            this._worker.terminate();
            this._worker = null;
        }
        return this;
    }

    private _workerPing(): Promise<number> {
        return new Promise((resolve, reject) => {
            if (!this._worker) return reject(new Error("no-worker"));

            const worker = this._worker;
            const start = (typeof performance !== "undefined") ? performance.now() : Date.now();
            const timeoutId = setTimeout(() => {
                worker.removeEventListener("message", onMessage);
                reject(new Error("worker-timeout"));
            }, 500);

            const onMessage = (event: MessageEvent) => {
                try {
                    const workerNow = typeof event.data === "object" && event.data !== null && typeof event.data.workerNow === "number"
                        ? event.data.workerNow
                        : null;
                    worker.removeEventListener("message", onMessage);
                    clearTimeout(timeoutId);

                    if (workerNow === null) {
                        reject(new Error("bad-reply"));
                        return;
                    }

                    resolve(Math.abs(((typeof performance !== "undefined") ? performance.now() : Date.now()) - start));
                } catch (error) {
                    worker.removeEventListener("message", onMessage);
                    clearTimeout(timeoutId);
                    reject(error);
                }
            };

            worker.addEventListener("message", onMessage);

            try {
                worker.postMessage("ping");
            } catch (error) {
                worker.removeEventListener("message", onMessage);
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /* ── Layer 1 — Debugger Trap ────────────────────────────────────────── */

    /**
     * The classic technique:  if DevTools is open and script-pausing is ON,
     * hitting `debugger` causes a ~100 ms freeze in the event loop.
     * We measure that delta with BOTH the possibly-hooked `Date.now` and the
     * pristine iframe `performance.now` so a hooked Date can't hide it.
     *
     * The actual `debugger` keyword is encoded so extension content-scripts
     * that replace `debugger` with `;` via regex/AST transforms can't find it.
     */
    private _runLayer1_DebuggerTrap(): void {
        const self = this;
        const { perfNow, dateNow } = this._natives;

        // Encode "debugger" to defeat static replace-based extension patches
        // atob("ZGVidWdnZXI=") === "debugger"
        const _dbg = atob("ZGVidWdnZXI="); // "debugger"

        this._trapIntervalId = setInterval(() => {
            if (!self._active) return;

            const t0p = perfNow();
            const t0d = dateNow();

            try {
                // eslint-disable-next-line no-new-func
                new Function(_dbg)();
            } catch {
                /* ignore syntax errors in exotic envs */
            }

            const deltaPerf = perfNow() - t0p;
            const deltaDate = dateNow() - t0d;

            // Worker cross-check: detect if main thread is paused relative to worker
            (async () => {
                if (self._workerAvailable) {
                    try {
                        const workerDelta = await self._workerPing();
                        // If worker delta is large compared to baseline, report
                        const effective = workerDelta - (self._workerBaseline || 0);
                        if (effective > CFG.TIMING_THRESHOLD_MS) {
                            self._report({
                                channel: 'timing',
                                detail: `worker-cross-pause:${effective.toFixed(1)}ms perf:${deltaPerf.toFixed(1)} date:${deltaDate}ms`,
                                ts: dateNow()
                            });
                            return;
                        }
                    } catch {
                        // ignore worker issues
                    }
                }

                if (deltaPerf > CFG.TIMING_THRESHOLD_MS || deltaDate > CFG.TIMING_THRESHOLD_MS) {
                    self._report({
                        channel: 'timing',
                        detail: `debugger pause detected — perf:${deltaPerf.toFixed(1)}ms date:${deltaDate}ms`,
                        ts: dateNow()
                    });
                }
            })();
        }, CFG.POLL_INTERVAL_MS);
    }

    /* ── Layer 2 — Anti-Extension Tackle ───────────────────────────────── */

    /**
     * Detect common modifications that "Anti Anti-Debugger" extensions make.
     * We use OUR PRISTINE copies of the functions, not the possibly-patched
     * top-level ones.
     */
    private _runLayer2_AntiExtensionTackle(): void {
        this._checkToStringIntegrity();
        this._checkConsoleHooks();
        this._checkPerformanceHook();
        this._checkProxyTraps();
        this._checkKnownExtensionScripts();
    }

    /**
     * toString-integrity check
     * ────────────────────────
     * Anti-debug extensions MUST hook `Function.prototype.toString` to make
     * the `debugger` loop invisible to itself.  We detect that hook by:
     *   a) Using our PRISTINE toString from the iframe sandbox.
     *   b) Checking if toString's own source still says [native code].
     *   c) Checking the top-level toString differs from the pristine one.
     */
    private _checkToStringIntegrity(): void {
        const { toString: pristineTS } = this._natives;

        // (a) Is the pristine one native? (Should always be true.)
        const pristineIsNative = isNative(pristineTS, pristineTS);

        // (b) Is the TOP-LEVEL Function.prototype.toString still native?
        const topLevelTS = Function.prototype.toString;
        const topLevelIsNative = isNative(topLevelTS, pristineTS);

        // (c) Are they the same reference? (Proxy wraps break identity equality)
        const sameRef = (topLevelTS as unknown) === (pristineTS as unknown);

        if (!pristineIsNative || !topLevelIsNative || !sameRef) {
            this._report({
                channel: "toString-integrity",
                detail: `toString hook detected — pristineNative:${pristineIsNative} topNative:${topLevelIsNative} sameRef:${sameRef}`,
                ts: this._natives.dateNow()
            });
        }
    }

    /**
     * Console hook check
     * ──────────────────
     * Extensions sometimes replace `console.log` / `console.warn` with a
     * function to suppress devtools output or intercept timing side-channels.
     * Native console methods always contain "[native code]".
     */
    private _checkConsoleHooks(): void {
        const { toString: pristineTS, getOwnPropDesc } = this._natives;
        const methods = ["log", "warn", "error", "debug", "table"] as const;

        for (const m of methods) {
            const fn = console[m] as Function;
            if (!isNative(fn, pristineTS)) {
                this._report({
                    channel: "console-hook",
                    detail: `console.${m} is not native`,
                    ts: this._natives.dateNow()
                });
                return; // one report per check cycle
            }

            // Also verify the property descriptor — Proxy wraps may not
            // intercept toString but WILL show up as a different descriptor.
            const desc = getOwnPropDesc(console, m);
            if (desc && desc.get) {
                // Accessor on console method — highly unusual and suspicious
                this._report({
                    channel: "console-hook",
                    detail: `console.${m} has getter — possible Proxy/hook`,
                    ts: this._natives.dateNow()
                });
                return;
            }
        }
    }

    /**
     * Performance / Date hook check
     * ─────────────────────────────
     * If `performance.now` or `Date.now` on the TOP-LEVEL window is no longer
     * native, an extension has patched it to hide timing deltas (which would
     * defeat Layer 1).  We already have pristine versions from the iframe, but
     * we still REPORT the tampering.
     */
    private _checkPerformanceHook(): void {
        const { toString: pristineTS } = this._natives;

        const perfNowNative = isNative(performance.now, pristineTS);
        const dateNowNative = isNative(Date.now, pristineTS);

        if (!perfNowNative || !dateNowNative) {
            this._report({
                channel: "timing",
                detail: `timing API hooked — perf.now native:${perfNowNative} Date.now native:${dateNowNative}`,
                ts: this._natives.dateNow()
            });
        }
    }

    /**
     * Proxy trap detection
     * ────────────────────
     * Proxy objects intercept property access.  Some extensions wrap `window`
     * in a Proxy to silently observe/modify behaviour.  We can't detect a
     * Proxy with 100% certainty, but we can detect the most common tells:
     *   • `Object.getPrototypeOf(window)` returning something unexpected.
     *   • Asymmetric property enumeration vs getOwnPropertyNames.
     *   • Typeof inconsistencies on well-known globals.
     */
    private _checkProxyTraps(): void {
        try {
            // "window" must be an instance of Window (or EventTarget chain)
            const proto = Object.getPrototypeOf(window);
            // A Proxy keeps the prototype chain intact, but some shim-based
            // wrappers change it.
            if (proto === null || proto === Object.prototype) {
                this._report({
                    channel: "proxy-trap",
                    detail: `window prototype unexpected: ${proto}`,
                    ts: this._natives.dateNow()
                });
            }

            // Check for Reflect.get inconsistency — Proxy handlers that
            // intercept get but not Reflect pass-through will differ.
            const _testKey = "crypto";
            const direct = (window as unknown as Record<string, unknown>)[_testKey];
            const reflected = Reflect.get(window, _testKey);
            if (direct !== reflected) {
                this._report({
                    channel: "proxy-trap",
                    detail: "window[crypto] !== Reflect.get(window, 'crypto')",
                    ts: this._natives.dateNow()
                });
            }
        } catch {
            /* proxy detection threw — itself a signal */
            this._report({
                channel: "proxy-trap",
                detail: "proxy detection threw unexpectedly",
                ts: this._natives.dateNow()
            });
        }
    }

    /**
     * Known extension script detection
     * ─────────────────────────────────
     * Several Anti-Anti-Debugger extensions inject a script element or set a
     * window property as a marker.  We check for those markers.
     *
     * Markers are encoded so content-scripts doing a self-check can't find
     * their own name in our source and patch this check out.
     *
     * Decoded:
     *   YWFkQnlwYXNz        → "aadBypass"
     *   X19hYWRfYnlwYXNz    → "__aad_bypass"
     *   ZGVidWdnZXJCeXBhc3M= → "debuggerBypass"
     */
    private _checkKnownExtensionScripts(): void {
        const markers = [
            atob("YWFkQnlwYXNz"), // "aadBypass"
            atob("X19hYWRfYnlwYXNz"), // "__aad_bypass"
            atob("ZGVidWdnZXJCeXBhc3M="), // "debuggerBypass"
            atob("X19kZWJ1Z19ieXBhc3M="), // "__debug_bypass"
            atob("YW50aURlYnVn") // "antiDebug"
        ];

        for (const marker of markers) {
            if ((window as unknown as Record<string, unknown>)[marker] !== undefined) {
                this._report({
                    channel: "extension-script",
                    detail: `extension marker found: window["${marker}"]`,
                    ts: this._natives.dateNow()
                });
                return;
            }
        }

        // Also check for extension-injected <script> tags with chrome-extension:// src
        const scripts = document.querySelectorAll("script[src]");
        for (const s of scripts) {
            const src = s.getAttribute("src") ?? "";
            if (src.startsWith("chrome-extension://") || src.startsWith("moz-extension://")) {
                this._report({
                    channel: "extension-script",
                    detail: `extension script injected: ${src.slice(0, 60)}`,
                    ts: this._natives.dateNow()
                });
                return;
            }
        }
    }

    /**
     * DevTools window-size channel
     * ─────────────────────────────
     * When Chrome/Firefox DevTools opens (docked to the side), the inner width
     * shrinks significantly while `screen.width` stays constant.
     */
    private _checkDevtoolsSize(): void {
        if (typeof window === "undefined") return;

        const widthDelta = window.outerWidth - window.innerWidth;
        const heightDelta = window.outerHeight - window.innerHeight;

        if (widthDelta > CFG.DEVTOOLS_WIDTH_THRESHOLD || heightDelta > CFG.DEVTOOLS_WIDTH_THRESHOLD) {
            this._report({
                channel: "devtools-size",
                detail: `devtools size delta — w:${widthDelta}px h:${heightDelta}px`,
                ts: this._natives.dateNow()
            });
        }
    }

    /* ── Polling loop ───────────────────────────────────────────────────── */

    private _startPolling(): void {
        this._intervalId = setInterval(() => {
            if (!this._active) return;
            this._checkToStringIntegrity();
            this._checkConsoleHooks();
            this._checkPerformanceHook();
            this._checkProxyTraps();
            this._checkKnownExtensionScripts();
            this._checkMutationSnapshot();
            this._checkDevtoolsSize();
        }, CFG.POLL_INTERVAL_MS * 4); // less frequent than the trap loop
    }

    private _checkMutationSnapshot(): void {
        try {
            if (this._baselineToString) {
                const current = this._natives.toString.call(Function.prototype.toString);
                if (current !== this._baselineToString) {
                    this._report({
                        channel: 'toString-integrity',
                        detail: 'Function.prototype.toString changed at runtime',
                        ts: this._natives.dateNow()
                    });
                }
            }

            if (this._baselineConsole) {
                for (const k of Object.keys(this._baselineConsole)) {
                    try {
                        const fn = (console as any)[k];
                        const cur = this._natives.toString.call(fn);
                        if (cur !== this._baselineConsole[k]) {
                            this._report({
                                channel: 'console-hook',
                                detail: `console.${k} descriptor changed`,
                                ts: this._natives.dateNow()
                            });
                            break;
                        }
                    } catch {
                        // ignore
                    }
                }
            }
        } catch {
            // don't let snapshot checks throw
        }
    }

    /* ── Reporting & quorum ─────────────────────────────────────────────── */

    private _report(report: ThreatReport): void {
        // De-duplicate: only count each channel once per session
        if (this._seenChannels.has(report.channel)) return;
        this._seenChannels.add(report.channel);
        this._reports.push(report);

        if (this._reports.length >= CFG.DETECTION_QUORUM) {
            this._scheduleAction();
        }
    }

    /** Debounce the action so transient false-positives don't fire it. */
    private _scheduleAction(): void {
        if (this._actionTimer) return; // already scheduled
        this._actionTimer = setTimeout(() => {
            if (this._active && this._reports.length >= CFG.DETECTION_QUORUM && this._actionHandler) {
                // Pass an aggregated copy of reports to the handler
                try {
                    this._actionHandler(this._reports.slice());
                } catch {
                    // swallow handler errors
                }
            }
        }, CFG.ACTION_DEBOUNCE_MS);
    }
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Singleton export                                                             */
/* ─────────────────────────────────────────────────────────────────────────── */

export const antiDebugger = new AntiDebuggerEngine();
