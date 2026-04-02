# New Landing Page - Theme Documentation

## Overview

This portfolio features a cutting-edge dual-theme system inspired by **Apple's Liquid Glass** and **Samsung's One UI 7 Book** design
languages. Both themes are fully adaptable to light and dark modes with dynamic accent color generation.

## Design Themes

### 1. Apple Liquid Glass Theme

**NOT Glassmorphism** - This is Apple's new liquid glass design language featuring:

- **Depth & Fluidity**: Multi-layered depth with smooth, organic transitions
- **Dynamic Lighting**: Interactive glow effects that respond to cursor movement
- **Subtle Blur**: Advanced backdrop filters with saturation enhancement
- **Refined Typography**: San Francisco-inspired font hierarchy with precise weights
- **Smooth Animations**: Buttery 60fps transitions with spring physics
- **Minimalist Spacing**: Comfortable padding with generous breathing room

**Visual Characteristics:**

- Border radius: 16-20px
- Backdrop blur: 10-30px with saturation 120-180%
- Semi-transparent backgrounds: 50-80% opacity
- Subtle borders with low opacity
- Smooth shadows with multiple layers

### 2. Samsung One UI 7 Book Theme

Bold, readable, and thumb-friendly design featuring:

- **Bold Typography**: Extra-black font weights for maximum impact
- **Generous Spacing**: Large padding and comfortable touch targets (min 48px)
- **Clean Aesthetics**: Sharp, clear visual hierarchy
- **Thumb-Friendly**: Bottom-heavy layouts optimized for one-handed use
- **Readability First**: High contrast and large text sizes
- **Rounded Elements**: 24-28px border radius for friendly appearance

**Visual Characteristics:**

- Border radius: 24-28px
- Solid backgrounds with clear elevation
- Bold shadows for depth
- Large, prominent text
- Spacious layouts with 12-32px padding

## Accent Color System

### Dynamic Palette Generation

The system automatically generates a complete color palette from a single accent color:

```typescript
{
    (accent, // Primary brand color
        accentLight, // 30% lighter variant
        accentDark, // 20% darker variant
        accentSubtle, // 10% opacity overlay
        // Backgrounds (light/dark adaptive)
        background,
        backgroundElevated,
        backgroundSecondary,
        backgroundTertiary,
        // Surfaces (cards, modals)
        surface,
        surfaceElevated,
        surfaceSecondary,
        // Text colors
        textPrimary,
        textSecondary,
        textTertiary,
        textOnAccent,
        // Borders
        border,
        borderSubtle,
        // Shadows
        shadowSm,
        shadowMd,
        shadowLg,
        // Effects
        glassBg,
        glassBlur,
        liquidGlow);
}
```

### Preset Colors

**Apple Colors:**

- Blue (#007AFF) - Default
- Purple (#AF52DE)
- Pink (#FF2D55)
- Red (#FF3B30)
- Orange (#FF9500)
- Yellow (#FFCC00)
- Green (#34C759)
- Teal (#5AC8FA)

**Samsung Colors:**

- Blue (#5E97F6) - Default
- Purple (#9C6FFF)
- Pink (#FF6B9D)
- Green (#3DDC84)
- Orange (#FF9F43)
- Teal (#26C6DA)

## Components

### Apple Liquid Glass Components

```tsx
import { LiquidGlassCard, LiquidGlassButton, LiquidGlassNav, LiquidGlassModal, LiquidGlassSection } from "@Components/LiquidGlass";
```

**Features:**

- Tilt effect on hover (3D perspective)
- Dynamic glow that follows cursor
- Blur intensity levels (subtle, medium, strong)
- Smooth spring animations

### Samsung One UI Components

```tsx
import { OneUICard, OneUIButton, OneUIHeader, OneUIBadge, OneUIListItem, OneUITabs, OneUISection, OneUIDivider } from "@Components/OneUI";
```

**Features:**

- Bold, readable text hierarchy
- Large touch targets (min 48px height)
- Generous spacing (comfortable/relaxed/spacious)
- High contrast colors
- Thumb-friendly layouts

## Navigation Header

The advanced navigation features:

- **Product-style mega menu** with category dropdowns
- **Hover-activated submenus** with smooth animations
- **Icon + description items** for better UX
- **Social links integration**
- **Adaptive styling** for both themes
- **Responsive mobile menu** with smooth transitions

## Hero Section

Recruiter-optimized hero featuring:

- **Availability badge** (green pulse indicator)
- **Animated role switcher** (6 different titles)
- **Key statistics** in visual cards (Experience, Projects, etc.)
- **Core expertise tags** with stagger animation
- **Primary CTAs** (Get In Touch, Download Resume)
- **Social proof** (GitHub, LinkedIn)
- **Background effects** (liquid orbs for Apple, grid for Samsung)

## Theme Switcher

Located in the footer, allows users to:

1. **Switch design themes** (Apple ↔ Samsung)
2. **Toggle light/dark mode**
3. **Choose accent color** from preset palette
4. **Preview changes** in real-time

All preferences are saved to localStorage.

## Usage

### Basic Implementation

```tsx
import { DesignThemeProvider } from "@Hooks/useDesignTheme";

export default function App() {
    return (
        <DesignThemeProvider>
            <YourComponents />
        </DesignThemeProvider>
    );
}
```

### Using the Theme Hook

```tsx
import { useDesignTheme } from "@Hooks/useDesignTheme";

function MyComponent() {
    const {
        designTheme, // "apple" | "samsung"
        colorMode, // "light" | "dark"
        accentColor, // Current accent color hex
        palette, // Generated color palette
        setDesignTheme, // Switch theme
        setColorMode, // Switch mode
        setAccentColor, // Change accent
        toggleColorMode // Toggle light/dark
    } = useDesignTheme();

    // Use theme values
    const isApple = designTheme === "apple";

    return <div style={{ color: palette.textPrimary }}>{/* Your content */}</div>;
}
```

## Landing Page Sections

### 1. Hero Section

- Personal introduction
- Role animation
- Availability status
- Quick stats
- Primary CTAs

### 2. Projects Section

- Featured projects grid
- GitHub stats
- Tech stack tags
- Live links

### 3. Skills Section

- Visual skill bars
- Category grouping
- Proficiency percentages
- Icon representations

### 4. Experience Section

- Timeline format
- Role descriptions
- Key achievements
- Period indicators

### 5. Footer

- Navigation links
- Social media
- Legal pages
- Theme switcher

## Accessibility

- **Keyboard navigation** fully supported
- **Focus indicators** visible and clear
- **ARIA labels** on interactive elements
- **Reduced motion** support for animations
- **Color contrast** meets WCAG AA standards
- **Screen reader** friendly structure

## Performance

- **CSS variables** for instant theme switching
- **Framer Motion** for 60fps animations
- **Code splitting** for optimal loading
- **Lazy loading** for images
- **Optimized re-renders** with React memoization

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Samsung Internet 14+

## Customization

### Adding New Preset Colors

Edit `src/Utils/themeGenerator.ts`:

```typescript
export const PRESET_COLORS = {
    apple: {
        // Add your color
        custom: "#YOUR_HEX"
    }
};
```

### Creating Custom Components

Follow the pattern in existing components:

```tsx
export const MyComponent = () => {
    const { designTheme, palette } = useDesignTheme();
    const isApple = designTheme === "apple";

    return (
        <div
            style={{
                background: isApple ? palette.glassBg : palette.surface,
                backdropFilter: isApple ? palette.glassBlur : "none",
                borderRadius: isApple ? "16px" : "24px"
            }}>
            {/* Content */}
        </div>
    );
};
```

## Design Principles

### Apple Theme

- **Less is more** - Minimal UI, maximum impact
- **Fluid interactions** - Natural, physics-based animations
- **Depth through blur** - Layered transparency
- **Precision** - Pixel-perfect alignment

### Samsung Theme

- **Bold is beautiful** - Strong typography
- **Comfort first** - Generous spacing
- **Clear hierarchy** - Obvious importance levels
- **One-handed friendly** - Bottom-weighted layouts

## Credits

Inspired by:

- Apple's macOS and iOS design languages
- Samsung's One UI 7 design system
- Material Design 3 principles
- Modern web design trends

---

**Note:** This is a custom implementation inspired by these design languages, not official Apple or Samsung components.
