# 📝 Meet Bhingradiya Portfolio - Change Log  

All notable changes to this project will be documented here.  

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).  

---

## 🔐 Vulnerability, Bug, or Issue Disclosures  
- 🛡️ **`SvgComponent`** - Sanitized to ensure better security.  

---

<!-- ✨ vUnreleased - DD/MM/YYYY (Expected)  

### 🌟 Added  
- 🚀 New feature XYZ.  
- 🛠️ Improved performance of the ABC module.  

### 🔄 Changed  
- 🔧 Refactored code in the XYZ module.  

### 🗑️ Removed  
- 🐞 Bug in ABC module.  

---

-->
# ✨ 1.0.5 - 1/1/2024 (Expected)  

### 🌟 Added
- Page > Tools > Searchbar > Clear Query Button added with Animation Visibility on Exit also.

### 🔄 Changed
- Page > Tools > Searchbar has now Add & Settings Button as Floating Action Button like A `Dashy` Extenstion has.
- Chnagelog > Decorated & Enhanced for better readability.

### 🗑️ Removed  
- Disabled CSRF Protection for temporary time.

---




## v1.0.4 - 22/12/2024 🎉  

### 🌟 Added  
- 📄 **Tools**: Added a new context menu for `Open in New Tab` & `Open in New Window`.  
- ⚛️ **Hooks**: `useWindowCheck` created to address React hydration issues in Next.js.  
- 🌈 **Hooks**: `useTheme` introduced for theme switching (partially implemented).  
- 📚 **Data**: Added new keywords and 2 new bookmarks under Tools.  

### 🔄 Changed  
- 🦶 **Footer**: Displays only at the bottom of the page, hiding during upward scroll.  
- 🛠️ **Footer**: Resolved re-rendering issue when navigating pages.  
- ⚙️ **Tools Page**: Optimized size with columns and improved height management.  
- ⏳ **Date.Now**: Updated to a static date to fix hydration issues.  
- 🖼️ **SVGComponent**: Added rendering for WhatsApp-perfect icons.  
- 📦 **Dependencies**: Updated to the latest versions (as of `20-12-2024`).  

### 🗑️ Removed  
- 🚫 `suppressHydrationWarning`: No longer required due to resolved issues.  
- 🔍 **DevIndicators**: Removed Next.js DevIndicators for a smoother development experience.  

---

## v1.0.3 - 18/12/2024 🎊  

### 🌟 Added  
- 📄 **Env**: Example environment file added at the root directory.  
- 🛠️ **Tools**: New tool - Google Trends Query Generator with instant copy-to-clipboard feature.  
- 🏳️ **Public Flags**: Added over 260 country flags.  
- 🦶 **Footer**: Introduced a global footer for all pages.  

### 🔄 Changed  
- 🔒 **Crypto Utils**: Updated algorithm to fix encryption bugs.  
- 🌐 **Footer Enhancements**:  
  - Added version changelog link and version info.  
  - Applied backdrop blur for an elegant look.  
  - Added social links with an enable/disable toggle.  
- 🔗 **Stack Overflow**: Added to homepage links.  
- 🖼️ **Tools Page**: Updated keywords for better SEO, added 2 new bookmarks, and 1 tool.  
- 📦 **Dependencies**: Updated to the latest versions (`15-12-2024`).  

### 🗑️ Removed  
- 📝 **LICENSE**: Replaced with a `COPYRIGHT` file.  

---

## v1.0.2 - 08/12/2024 🚀  

### 🌟 Added  
- ⚛️ **Hooks**:  
  - `useStore`: Simplifies client-side store management.  
- 📊 **Models**: Added new models: Permissions, VerificationCodes, Users, Transactions, and Wallets.  
- 🛠️ **Utils**:  
  - `ExtensionsDetector`: Identifies installed browser extensions.  
  - `Crypto`: Supports encryption and decryption (9 algorithms, 40+ total).  
- 📄 **Changelog**: Added goals and tasks for transparency.  
- 🔧 **TS Configs**: Introduced improved module resolution.  

### 🔄 Changed  
- 🛠️ **Bug Fix**: Resolved CSP issues in QR Gen Tool and Tools Page.  
- 📝 **Version Format**: Updated from `[1.0.0]` to `v1.0.0`.  
- 🖌️ **Index Page**: Adjusted gradient offset for better mobile and desktop views.  

### 🗑️ Removed  
- 🗂️ Temporary modules and scripts.  
- ⚙️ Tools settings for `isNewWindow`, as it was not working properly.  

---

## v1.0.1 - 25/11/2024 🌟  

### 🌟 Added  
- 📄 **Bookmark Page**.  
- 🛠️ **QR Generator Updates**: Added templates, border text modifiers, and UPI support.  
- 🔒 **CSRF Protection**: Secured all APIs starting with `/api/`.  
- 🖼️ **Remote Image Loader**: Enabled for the Bookmark Page.  

### 🔄 Changed  
- ⚙️ **Next/TS Configs**: Enhanced module resolution.  
- 🧠 **Build Tree**: Added IntelliSense for IDEs.  
- ⚡ Performance: Resolved Bookmark Page re-rendering issues with `useRef`.  

### 🗑️ Removed  
- 🗂️ Deprecated HTML files and outdated JWT, replaced with 'Jose' for Next.js.  

---

## v1.0.0 - 01/08/2024 🎉  

### 🌟 Added  
- 🌟 Initial project launch with a Next.js template.  

---
