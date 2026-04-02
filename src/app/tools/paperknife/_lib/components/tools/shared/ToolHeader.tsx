import { useRouter } from "next/navigation";
import { ArrowLeft } from "@/app/tools/paperknife/_lib/muiLucide";
import { Capacitor } from "@capacitor/core";
import { useDesignTheme } from "@Hooks";

interface ToolHeaderProps {
    title: string;
    highlight?: string;
    description: string;
}

export default function ToolHeader({ title, highlight, description }: ToolHeaderProps) {
    const router = useRouter();
    const isNative = Capacitor.isNativePlatform();
    const { palette, designTheme } = useDesignTheme();
    const isApple = designTheme === "apple";

    return (
        <div className="relative text-center mb-8 md:mb-12">
            {isNative && (
                <button
                    onClick={() => router.push("/tools/paperknife")}
                    className="absolute left-0 top-0 p-3 rounded-2xl transition-colors md:hidden"
                    style={{
                        background: palette.backgroundSecondary,
                        color: palette.textSecondary
                    }}>
                    <ArrowLeft size={20} />
                </button>
            )}
            <h2
                className={`${isApple ? "text-3xl md:text-5xl font-semibold" : "text-3xl md:text-5xl font-black"} mb-3 md:mb-4 px-10`}
                style={{ color: palette.textPrimary }}>
                {title} <span style={{ color: palette.accent }}>{highlight}.</span>
            </h2>
            <p
                className="text-sm md:text-base max-w-lg mx-auto leading-relaxed"
                style={{ color: palette.textSecondary }}>
                {description}
            </p>
        </div>
    );
}
