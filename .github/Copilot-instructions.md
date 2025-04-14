# Portfolio of Meet Bhingradiya
- This is a portfolio of Meet Bhingradiya, a software engineer with experience in various technologies and programming languages.

## Tech Stack

## Database Structure

## Source Structure
```js
└── 📁MD // Static Markdown Files
    └── Privacy.md 
    └── Terms.md
└── 📁Public // CDN is Required we still Prefer Github Raw from Remote Repository
└── 📁Scripts
    └── Comments.ts // Script for Add Comments on All the Src Files for License
    └── CreateSignatures.ts // Script for Create Signatures for Admins on Env (Local/Remote)
    └── DeployCheck.ts // Vercel Issue Deployment Check (if This File Permits then Vercel will Deploy)
    └── FilesDescriptions.ts // Database for Files Descriptions that Used on Comments.ts Script
    └── pre-commit.ts // Before Commit Checks Next Build ERROR & Warnings
    └── SEOBoost.py // Automation BOT Script to Improve SEO on Google
    └── UpdateRemoteSettings.ts // Sign State.json & Update on Remote Repository
    
└── 📁src // Next JS Source Folder
    └── 📁app 
        └── icon.ico // Favicon
        └── layout.tsx // Main Layout of the App
        └── page.tsx // Landing Page
        └── 📁(agreements) // Markdown Rendered Files Fetches Strings from Github Raw Files to Save bandwidth
            └── 📁privacy
                └── page.tsx
            └── 📁terms
                └── page.tsx
        └── 📁(ERRORS) // Redirects Just Like 404, 400 but Some Advanced Restrictions (VPN, Proxy or TOR etc.)
            └── 📁Test
                └── page.tsx
            └── 📁UnSupportedBrowser
                └── page.tsx
            └── 📁UnSupportedNetwork
                └── page.tsx
            └── 📁UnSupportedPlatform
                └── page.tsx
        └── 📁(static)
            └── 📁About
                └── page.tsx
            └── 📁Certifications
                └── page.tsx
            └── 📁contact
                └── page.tsx
            └── 📁Education
                └── page.tsx
            └── 📁Experience
                └── page.tsx
            └── 📁Home
                └── page.tsx
            └── 📁Projects // My Work and Short Utilities
                └── page.tsx
            └── 📁Showcase // Links of My Projects & Visually Appeling & Promoting My Projects
                └── page.tsx
            └── 📁Skills // My Skills (Technologies, Tech Stack)
                └── page.tsx
            └── 📁Support // Open Source Projects that Devliver Solid Foundations or Utilities to Communities
                └── page.tsx
            └── 📁Timeline // Projects, Experience, Skills & Education on Timeline (in Short Supermoodule that Renders My Work Database on Relative of Time)
                └── page.tsx
        └── 📁(user)
            └── 📁account // Account Management Dashboard Just Like Google
                └── 📁Home
                    └── page.tsx
                └── 📁Info
                    └── page.tsx
                └── 📁Payments // Payment History & Edit Bilng Details like (Cards, UPI VPA, Subscriptions)
                    └── page.tsx
                └── 📁Security // User Authentication Settings (Chnagepassword, Email Chnage, Passkey, Sessions etc.)
                    └── page.tsx
                └── 📁Services
                    └── page.tsx
            └── 📁admin // Administration of Site, Minimal Settings Even Controlled heare about Users can Login, Register or do Payments or not 
                └── 📁Analytics
                    └── page.tsx
                └── 📁Dashboard
                    └── page.tsx
                └── 📁Database // Control of MongoDB Connections [Module] (Connect, CURD Of Collections, Documents)
                    └── page.tsx
                └── 📁Settings // Control of Current State of Site (Collect Analytics, Passwords Encrypt Settings, 2FA Reqirements etc.)
                    └── page.tsx
                └── 📁Users // View Data of URD Opration of Users (heare deleted users data removed from whole database)
                    └── page.tsx
        └── 📁api
            └── 📁(auth)
                └── 📁adminsignature
                    └── route.ts
                └── 📁email
                    └── route.ts
                    └── 📁verify
                        └── route.ts
                └── 📁session
                    └── route.ts
                └── 📁signin
                    └── route.ts
                └── 📁signup
                    └── route.ts
                └── 📁trace
                    └── route.ts
                └── 📁username
                    └── route.ts
            └── 📁(seo)
                └── 📁robots
                    └── route.ts
                └── 📁sitemap
                    └── 📁blogs
                        └── route.ts
                    └── route.ts
                    └── StaticPages.ts
            └── 📁(tools)
                └── 📁bookmarks
                    └── 📁[id]
                        └── route.ts
                    └── route.ts
                └── 📁cors
                    └── route.ts
                └── 📁ip
                    └── route.ts
                └── 📁QRBorderLicense
                    └── route.ts
        └── 📁auth
            └── 📁authenticator
                └── layout.tsx
            └── 📁email
                └── layout.tsx
            └── layout.tsx
            └── 📁passkey
            └── 📁phone
                └── layout.tsx
            └── 📁signin
                └── layout.tsx
                └── page.tsx
            └── 📁signup
                └── layout.tsx
                └── page.tsx
        └── 📁Tools
            └── 📁Colour
                └── layout.tsx
                └── page.tsx
            └── 📁CRX
                └── layout.ts
                └── page.tsx
            └── 📁DateAndTime
                └── layout.tsx
                └── page.tsx
            └── 📁EncryptAndDecrypt
            └── 📁JSONObject
                └── layout.tsx
                └── page.tsx
            └── 📁JWT
                └── layout.tsx
                └── page.tsx
            └── layout.tsx
            └── 📁Markdown
            └── page.tsx
            └── 📁Password
                └── layout.tsx
                └── page.tsx
            └── 📁QR
                └── generateLicenseKey.ts
                └── page.tsx
                └── Templates.ts
            └── 📁RegExp
                └── layout.tsx
                └── page.tsx
            └── 📁Settings
            └── Settings.tsx
                └── BeAdmin.tsx
                └── BookmarkEditor.tsx
                └── BookmarkItem.tsx
                └── BookmarkItemMarketPlace.tsx
                └── BookmarkItemSkeleton.tsx
                └── Cloud.tsx
                └── ContextMenu.tsx
                └── Contribute.tsx
                └── Footer.tsx
                └── Header.tsx
                └── index.tsx
                └── Marketplace.tsx
                └── Preferences.tsx
                └── Sidebar.tsx
                └── Types.tsx
            └── 📁Todo
                └── layout.tsx
                └── page.tsx
            └── 📁URL
            └── 📁UUID
                └── layout.ts
                └── page.tsx
    └── 📁Components
        └── BuildProvidersTree.tsx
        └── 📁Footer
            └── index.tsx
            └── LandingFooter.tsx
        └── 📁Header
            └── index.tsx
        └── 📁Markdown
            └── Note.tsx
            └── Prose.tsx
        └── MUIRegistry.tsx
        └── Providers.tsx
        └── SVGComponent.tsx
        └── ToolContextMenu.tsx
        └── ToolNavigation.tsx
    └── 📁Config
        └── index.ts
        └── Protocols.ts
        └── RedirectProtocols.ts
        └── SocialLinks.tsx
    └── 📁Controllers
        └── Blogs.ts
        └── Bookmarks.ts
        └── index.ts
        └── Passkey.ts
        └── Signup.ts
        └── Template.ts
    └── 📁Data
        └── Tools.ts
        └── ToolsData.tsx
    └── 📁Hooks
        └── index.ts
        └── useAuth.ts
        └── useEmptyFields.ts
        └── useLanguage.tsx
        └── useStore.ts
        └── useTheme.tsx
        └── useWindowCheck.ts
    └── 📁Lib
        └── index.ts
        └── 📁memory-store // Cache Memory Storage Valid for Max 1 Min
            └── index.ts
            └── types.ts
        └── 📁reactbits
            └── index.ts
            └... // Files Related to React Bits
        └── 📁request-ip
            └── index.ts
            └── is.ts
    └── 📁Models
        └── Blogs.ts
        └── BlogsContent.ts
        └── Bookmarks.ts
        └── index.ts
        └── OneTimePass.ts
        └── Passkeys.ts
        └── Pomodoros.ts
        └── RSAKeys.ts
        └── Sessions.ts
        └── Sitemap.ts
        └── State.ts
        └── Transactions.ts
        └── Users.ts
        └── Wallets.ts
        └── 📁Willbe
            └── Categories.ts
            └── Certifications.ts
            └── Experiences.ts
            └── Logs.ts
            └── Messages.ts
            └── Organizations.ts
            └── Payments.ts
            └── Products.ts
            └── Profiles.ts
            └── Projects.ts
            └── Skills.ts
            └── Supabase.OLD.ts
            └── Tickets.ts
    └── 📁Styles
        └── Auth.sass
        └── Body.sass
        └── Footer.sass
        └── globals.sass
        └── Header.sass
        └── Home.sass
        └── LandingFooter.sass
        └── Tool.sass
        └── Tools-Bookmark.sass
        └── Tools-ColourConvert.sass
        └── Tools-CRX.sass
        └── Tools-DateAndTime.sass
        └── Tools-GoogleTrends.sass
        └── Tools-JSONObject.sass
        └── Tools-JWT.sass
        └── Tools-Navigation.sass
        └── Tools-Password.sass
        └── Tools-QR.sass
        └── Tools-RegExp.sass
        └── Tools-Todo.sass
    └── 📁Types
        └── ChromeExtensions.ts
        └── Controllers.ts
        └── Currency.ts
        └── Gender.ts
        └── index.ts
        └── IPProviders.ts
        └── Languages.ts
        └── Organization.ts
        └── Privacy.ts
        └── QR.ts
        └── RateLimitStore.ts
        └── Region.ts
        └── Tools.ts
    └── 📁Utils
        └── Axios.ts
        └── CaseChnage.ts
        └── ControllerResponseMap.ts
        └── Crypto.ts
        └── CSP.ts
        └── dbConnect.ts
        └── EmailSend.ts
        └── ExtensionsDetector.ts
        └── getEnvs.ts
        └── getTrace.ts
        └── HMACSignature.ts
        └── index.ts
        └── IPData.ts
        └── log.ts
        └── OTP.ts
        └── ParseIPDatatoConfig.ts
        └── RateLimit.ts
        └── RateLimitStore.ts
        └── RedirectProtocolExecuter.ts
        └── Relativetime.ts
        └── RemoteImageLoader.ts
        └── RemoveDuplicates.ts
        └── RSA.ts
        └── Sitemap.ts
        └── Sleep.ts
        └── SMSSend.ts
        └── UserAgent.ts
        └── windowcheck.ts
    └── global.d.ts
    └── middleware.ts
```