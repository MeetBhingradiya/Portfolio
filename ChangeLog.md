# 📝 Meet Bhingradiya Portfolio - ChangeLog
- The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
---

<!-- # vUnreleased - DD/MM/YYYY (Expected)

### 🌟 Added
- 🚀 New feature XYZ.  
- 🛠️ Improved performance of the ABC module.  

### 🔄 Changed
- 🔧 Refactored code in the XYZ module.  

### 🗑️ Removed
- 🐞 Bug in ABC module.  

---


-->

# v1.0.10 - 15/03/2025 (Expected)

### 🌟 Added
- Models > Passkeys, Users, Sessions, Pomodoros
- NextConfig > CORS Headers
- Lib > Request IP for Advanced 
- Hooks > useEmptyFields for Fast Body Validations
- REDIRECT Protocols > Network, Browser, Plateform, Origin
- Signup > Email Checks Added
- IPData > TreatIntellegence Added for Advanced IP Checks [Cloudflare WARP (Proxy) is Whitelisted]

### 🔄 Changed
- 📦 **Dependencies**: Updated to the latest versions (as of `27-02-2025`).
- "INVALID_ORIGIN" Protocol Now Redirect to Original Origin insted of giving ERROR on Console.
- License > Updated to v1.0.10 (All Files)

### 🗑️ Removed
- TailwindCSS V4 Still not Migrated due to `HeroUI` Update is Pending.
- Removed Unused Data Files

---


# v1.0.9 - 16/02/2025

### 🌟 Added
- 3 New Database Models Added #40
- Blogs > Blogs Controllers Added
- Vercel Speed Inslights
- New Settings Ui
- MarketPlace
- Edit & Create 
- Utils > #50
- Models > #46
- Github Actions > Stale & Issue Template for Bug Reports
- Tools > #43

### 🔄 Changed
- 🗨️ **Auto Comments** : All Files License Updated.
- Auto Redirect to Original Origin on "INVALID_ORIGIN" Backend ERROR.
- 📦 **Dependencies**: Updated to the latest versions (as of `05-02-2025`).

### 🗑️ Removed
- Select Defualt Search Engine & Its Local Settings (Temporarily, will be come back soon)
- Keywords Editor (Temporarily, , will be come back soon)
- Expired Trace Tokens Automatically Renewed & Request Try Again Automatically. #41
- Fixed Data Image CSP Issue

---



# v1.0.8 - 28/01/2025

### 🌟 Added
- 2 New Bookmark Added & Few of them are Modified.
- Tools > Suggestions & Search Engine Funcations Added #21
- Tools > Search bar now Focus on Spacebar Press.
- Axios > Request Cancelation Added for Faster Response on Searchbar Query #22
- Library > React Bits - for Advanced Animations & Animated Components #33
- Utils > UserAgent Parser #28

### 🔄 Changed
- Tools > Cloud Sync Disabled By Default.
- Tools > Icons Improved for Better Visibility.
- Utils > Sitemap Utils Improved for Better Performance & Faster Response.
- API > Sitemap > `Prorities` Now Dynamically Generated from `Frequency`.
- NextUI > HeroUI > Migration is Done #23
- Bug > Producation > 403 Invalid Auth on Quey Fetching #26

### 🗑️ Removed
- Chnagelog > Vulnerability Disclosures
- CodeQL > Shell command built from environment values
- Profile README > Moved to Another Repository for Security Reasons of this Repository.

---

# v1.0.7 - 20/01/2025

### 🌟 Added
- Github Projects Now New Tracking System for the Project.
- 2 New File Descriptions.
- Bypass CORS API (#18)
- New Tool : UUID Generator
- 5 New Bookmarks Added.

### 🔄 Changed
- Scripts > Git Modifyed Files Detection Imporved.
- Global > Main Github Profile Readme Updated Status.
- Utils > Sitemap Domains now follows which domain is opened that domain sitemap will be generated.
- Middleware > Exluded CSRF Endpoints Accuracy Improved using Regex.
- Types > Gender Enum Moved to Types
- Tools > Google Trend Querys to Bing Querys
- Tools > BingQuerys > Now not need of Extension for Query Fetching #18
- Tools > Bookmark Commands using Keywords Added for Faster Access.

### 🗑️ Removed
- Footer > Removed Unwanted String from the Footer.
- Tools > Flag Not Loading Issue Fixed by #17
- Tools > Selected Value Rendering #16

---

# v1.0.6 - 15/1/2025

### 🌟 Added
- Pages > Test Page > New Page for Testing the New Features & Components.
- Security > CSRF > Advanced CSRF Protection Added for All the API's excluding SiteMap & Robots.
- Providers > NextUi Provider Moved to MUIRegistry for Better Performance & Theme Switching.
- Hooks > useTheme > Now Contex Based Theme Switching with LocalStorage & System Theme. Added Toggle, Effective Mode & Specific Mode Switching.
- Page > Tools > Enter to Open Bookmark Added for Faster Access.
- Page > Tools > Cloud Sync Now Fully Supported All of the Devices.
- Page > Tools > New Only Dev Environment Setting : Global Database Sync
- Scripts > File Licensing Added for All the Files with Future of Git Modify Detect & Create Dates are Dynamic on each & Every File
- Scripts > Python Automation Done of SEO Boost

### 🔄 Changed
- Fixed > Bookmark API Not Working due to CSRF Protection Enabled on All the API's.
- Fixed > NextUI & MUI Theme Chnage Simeotaniously on Native Theme Switching.
- `CSRF` Renamed to `Trace`
- Page > Tools > Improved Search Algorithm Name > Keywords > URL is Priority.
- Utils > Axios > Timeout > `5s` to `8s`.
- 📦 **Dependencies**: Updated to the latest versions (as of `04-01-2025`).
- Mac & IOS Now Blocklisted Systems

### 🗑️ Removed
- Python CommentUpdater Engine Removed Due to Too Slow when Multiple Files are Reqired to Open & Write!
- Below has Benchmarks that i tested on localy on my machine. Full Src Folder Replaced Comment time with `console.time()`

| **Nodejs** Native Fs **Sync Module** | **Python** Terminal Driver |
| ------- | ------- |
| `35s` | `120.51s` |

# v1.0.5 - 29/12/2024

### 🌟 Added
- Page > Tools > Searchbar > Clear Query Button added with Animation Visibility on Exit also.
- Page > Tools > Google Trends Query Generator > Fixed Deplyment Issue.
- App > Struture > Added New Endpoints for User, Auth, Dashboard, Admin etc.
- SEO > Sitemaps > Dynamic Sitemaps Enabled from `MongoDB` Database.
- Google ADS Sense > Added to Main Layout for Monetization & Only Triggered on Production Build.
- Sitemap > New Sitemap Templates Added for Better Redering.

### 🔄 Changed
- Page > Tools > Searchbar has now Add & Settings Button as Floating Action Button like A `Dashy` Extenstion has.
- Chnagelog > Decorated & Enhanced for better readability.
- Models > Transactions & Wallets > Updated with new fields.
- Models > Users > Updated Bug of Mongooose Schema.
- 📦 **Dependencies**: Updated to the latest versions (as of `26-12-2024`).
- Theme > SASS Variable Setup for Light, Dark & System Theme.
- Page > Tools > Bookmark Add & Edit Modal > Updated Spacing & Buttons Chnaged with Title.

### 🗑️ Removed  
- Disabled CSRF Protection for temporary time.

---

## v1.0.4 - 22/12/2024

### 🌟 Added
- Page > Tools > New Context Menu Open in New Tab & Open in New Window for the Tools
- Hooks > useWindowCheck - Added due to React Hydration Issue on NextJS these hooks will help to check the window is available or not in the current environment without react hydration issue
- Hooks > useTheme - Added for Theme Swtiching (Partially Implemented)
- Data > Tools > New Keywords & 2 New Bookmarks

### 🔄 Changed
- Components > Footer > Now Only Show on Last of The Page & Hide When Scrolled Up
- Components > Footer > ReRender Issue Fixed on Every Page Change
- Page > Tools > Page Size Optimized with Colums & Height of the Tools Page
- Fixed Hydration Issue & Make Date.Now() as a Static Date for the Project
- Page > Tools > SVGComponent Rendering Added due to Whatsapp Perfect Icon Issued On SVG
- Dependencies > Updated to Latest Version on 20-12-2024

### 🗑️ Removed
- suppressHydrationWarning - Removed due to Fixed the Issue of Hydration
- DevIndicators - NextJS DevIndicators Removed due to Blocking UI on Development Mode sometime its Annoying.

---

## v1.0.3 - 18/12/2024

### 🌟 Added
- Env > Example Env File on Root
- Page > Tools > New Tool - Google Trends Query Generator & Instent Copy to Clipboard
- Public > Flags > Added for Country Flags (260+ Flags)
- Components > New Component - Footer Now Global Footer for All Pages

### 🔄 Changed
- Utils > Crypto > Changed new Algorithm for Bug of Encryption
- Home > Footer > Added Version Chnagelog as Link & Version Info
- Home > Footer > Added Backdrop Blur for Elegant Look
- Home > Footer > Added Social Links with Enabling & Disabling Feature when its needed
- Home > Links > Stackoverflow Added
- Home > Container Design
- Page > Tools > Updated Keywords for Better SEO
- Page > Tools > 2 New Bookmark & 1 New Tool Added
- Dependencies > Updated to Latest Version on 15-12-2024

### 🗑️ Removed
- LICENSE - Removed due to Not Needed for the Project replaced with COPYRIGHT File

---

## v1.0.2 - 08/12/2024

### 🌟 Added
- Hooks > useStore - Added for Store Management of the Client Side Pages faster and easier to manage
- Models > New Models > Permissions, VerificationCodes, Users, Transactions, Wallets
- Utils > ExtensionsDetector - Added for Detecting the Extensions is Installed or Not in the Browser
- Utils > Crypto - Added for Encrypting and Decrypting Technologie for the Project (9 Algorithms Supported, upto 40+ Algorithms)
- Changelog > Current Goals & Current Tasks Added
TS Configs - New Module Resolution [Config]

### 🔄 Changed
- Bug : Fixed CSP Issue on QR Gen Tool & Tools Page
- Chnagelog - Version format changed to [1.0.0] from v1.0.0
- Index Page - Chnaged Gredient Offset for Better View on Mobile & Also for Desktop
- TS Config Paths Now Automatically Resolved in Next Config
- Models > "Blog" Renamed to "Blogs
- Models > Blogs > Removed default propertys
- Models > State > Authentication Settings Added & Refactored Model Structure

### 🗑️ Removed
- Temporary Modules
- Tools > Settings > isNewWindow - Due to Not Working Properly
- Scripts Removed due to Not longer needed for the Project

---

## v1.0.1 - 25/11/2024

### 🌟 Added
- Bookmark Page
- Updated Tool - QR Generator [Templates, Border Texts Modify, UPI Now Supports]
- CSRF Froms Protection on All the APIs starts from /api/
- Remote Image Loader - Added for Bookmark Page

### 🔄 Changed
- Next/TS Configs - New Module Resolutions [Public, Controllers, Data, Models, Types]
- Build Providers Tree - IDE Intellisense Added
- Hydration Warnings Suppressed
- Acsessibility - Added Tabindex on Home Page Avatar Container
- Performance Issue Resolved in Bookmark Page using useRef becouse its not a reRender the Conponent on every state change insted of useState

### 🗑️ Removed
- OLD Html Files [index, Skillicon Generator, QRBorderLicenseBypass Checks]
- JSON Web Token - Removed from the Project alternative is 'Jose' Library for NextJS
---

## v1.0.0 - 01/08/2024

### 🌟 Added
- Initial start of the project a nextjs Template
