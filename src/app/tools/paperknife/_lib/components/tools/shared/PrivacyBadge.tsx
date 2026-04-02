import {
    GitHub
} from "@mui/icons-material";
import { Capacitor } from '@capacitor/core'
import { useDesignTheme } from '@Hooks'

export default function PrivacyBadge() {
    const { palette, designTheme } = useDesignTheme()
    const isApple = designTheme === 'apple'

    // Only show this footer in the native APK version
    if (!Capacitor.isNativePlatform()) return null

    return (
        <div
            className="mt-16 pt-8 flex flex-col items-center gap-6 animate-in fade-in duration-700"
            style={{ borderTop: `1px solid ${palette.borderSubtle}` }}
        >
            <div className="flex flex-col items-center gap-4">
                <div
                    className="flex items-center gap-3 px-4 py-2 rounded-full border"
                    style={{
                        background: "rgba(52,199,89,0.10)",
                        borderColor: "rgba(52,199,89,0.25)",
                        borderRadius: isApple ? 999 : 20,
                    }}
                >
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Secure Offline Session Active</span>
                </div>

                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest" style={{ color: palette.textTertiary }}>
                    <a href="https://github.com/potatameister/PaperKnife/issues" target="_blank" rel="noreferrer" className="transition-colors flex items-center gap-2" style={{ color: palette.textSecondary }}>
                        <GitHub sx={{ fontSize: 14 }} /> Support
                    </a>
                    <span className="opacity-20">•</span>
                    <p className="opacity-70">Made by <span style={{ color: palette.accent }}>potatameister</span></p>
                </div>
            </div>
        </div>
    )
}
