import React from 'react'
import { ArrowLeft } from '@/app/tools/paperknife/_lib/muiLucide'
import { useRouter } from 'next/navigation'
import { Capacitor } from '@capacitor/core'
import { useDesignTheme } from '@Hooks'
import ToolHeader from './ToolHeader'

interface NativeToolLayoutProps {
    title: string
    description: string
    children: React.ReactNode
    actions?: React.ReactNode
    onBack?: () => void
}

export const NativeToolLayout = ({
    title,
    description,
    children,
    actions,
    onBack
}: NativeToolLayoutProps) => {
    const router = useRouter()
    const { palette, designTheme, actualColorMode } = useDesignTheme()
    const isApple = designTheme === 'apple'
    const isDark = actualColorMode === 'dark'

    // Determine if we should show the native-style header
    // It should only show if we are in Android/APK mode
    const isNative = Capacitor.isNativePlatform()
    const isAndroidView = isNative || document.body.classList.contains('android-mode') || window.location.pathname.includes('android')

    // A more reliable way is to check the layout context or simply use media queries 
    // but since we want to avoid double headers with the main Layout.tsx:
    const showNativeHeader = isAndroidView

    return (
        <div
            className="flex flex-col min-h-screen transition-colors"
            style={{ background: palette.background }}
        >
            {/* Ultra-Compact Native AppBar - Only shown in Android/Native mode on mobile */}
            {showNativeHeader && (
                <header
                    className="px-4 pt-safe pb-1 flex items-center justify-between sticky top-0 z-30 md:hidden"
                    style={{
                        background: isApple
                            ? (isDark ? 'rgba(22,22,24,0.82)' : 'rgba(255,255,255,0.78)')
                            : palette.surface,
                        backdropFilter: isApple ? 'blur(24px) saturate(165%)' : 'none',
                        borderBottom: `1px solid ${palette.border}`,
                    }}
                >
                    <div className="flex items-center gap-2 h-14">
                        <button
                            onClick={onBack || (() => router.back())}
                            className="w-10 h-10 flex items-center justify-center rounded-full transition-colors -ml-1"
                            style={{
                                color: palette.textPrimary,
                                background: isApple ? 'transparent' : palette.backgroundSecondary,
                            }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1
                            className={`${isApple ? 'text-[17px] font-semibold' : 'text-lg font-black'} tracking-tight ml-1`}
                            style={{ color: palette.textPrimary }}
                        >
                            {title}
                        </h1>
                    </div>
                    <div className="w-10" />
                </header>
            )}

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col p-4 md:p-8 max-w-5xl mx-auto w-full ${actions ? 'pb-32 md:pb-8' : ''}`}>
                {/* Web View Header (Only Visible on Desktop or when native header is hidden) */}
                <div className={`${showNativeHeader ? 'hidden md:block' : 'block'} mb-8`}>
                    <ToolHeader title={title} description={description} />
                </div>

                {/* Content Wrapper */}
                <div className="flex-1">
                    {children}
                </div>
            </main>

            {/* Grounded Bottom Action Bar */}
            {actions && (
                <div
                    className="fixed bottom-0 left-0 right-0 z-40 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
                    style={{
                        background: isApple
                            ? (isDark ? 'rgba(22,22,24,0.86)' : 'rgba(255,255,255,0.84)')
                            : palette.surface,
                        backdropFilter: isApple ? 'blur(24px) saturate(165%)' : 'none',
                        borderTop: `1px solid ${palette.border}`,
                        boxShadow: isApple ? '0 -8px 32px rgba(0,0,0,0.12)' : '0 -10px 40px rgba(0,0,0,0.05)',
                    }}
                >
                    <div className="p-4 max-w-md mx-auto">
                        {actions}
                    </div>
                </div>
            )}
        </div>
    )
}
