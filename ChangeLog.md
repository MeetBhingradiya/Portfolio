# Meet Bhingradiya Portfolio - Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- vUnreleased

### Added
- New feature XYZ
- Improved performance of ABC module

### Changed
- Refactored code in XYZ module

### Removed
- Bug in ABC module -->

## v1.0.3 - 18/12/2024 (Expected)

### Added
- Env > Example Env File on Root
- Page > Tools > New Tool - Google Trends Query Generator & Instent Copy to Clipboard
- Public > Flags > Added for Country Flags (260+ Flags)
- Components > New Component - Footer Now Global Footer for All Pages

### Changed
- Utils > Crypto > Changed new Algorithm for Bug of Encryption
- Home > Footer > Added Version Chnagelog as Link & Version Info
- Home > Footer > Added Backdrop Blur for Elegant Look
- Home > Footer > Added Social Links with Enabling & Disabling Feature when its needed
- Home > Links > Stackoverflow Added
- Home > Container Design
- Page > Tools > Updated Keywords for Better SEO
- Page > Tools > 2 New Bookmark & 1 New Tool Added
- Dependencies > Updated to Latest Version on `15-12-2024`

### Removed
- LICENSE - Removed due to Not Needed for the Project replaced with `COPYRIGHT` File

## v1.0.2 - 08/12/2024

### Added
- Hooks > useStore - Added for Store Management of the Client Side Pages faster and easier to manage
- Models > New Models > Permissions, VerificationCodes, Users, Transactions, Wallets
- Utils > ExtensionsDetector - Added for Detecting the Extensions is Installed or Not in the Browser
- Utils > Crypto - Added for Encrypting and Decrypting Technologie for the Project (9 Algorithms Supported, upto 40+ Algorithms)
- Changelog > Current Goals & Current Tasks Added
TS Configs - New Module Resolution [Config]

### Changed
- Bug : Fixed CSP Issue on QR Gen Tool & Tools Page
- Chnagelog - Version format changed to `[1.0.0]` from `v1.0.0`
- Index Page - Chnaged Gredient Offset for Better View on Mobile & Also for Desktop
- TS Config Paths Now Automatically Resolved in Next Config
- Models > "Blog" Renamed to "Blogs
- Models > Blogs > Removed default propertys
- Models > State > Authentication Settings Added & Refactored Model Structure

### Removed
- Temporary Modules
- Tools > Settings > isNewWindow - Due to Not Working Properly
- Scripts Removed due to Not longer needed for the Project

## v1.0.1 - 25/11/2024

### Added
- Bookmark Page
- Updated Tool - QR Generator [Templates, Border Texts Modify, UPI Now Supports]
- CSRF Froms Protection on All the APIs starts from `/api/`
- Remote Image Loader - Added for Bookmark Page

### Changed
- Next/TS Configs - New Module Resolutions [Public, Controllers, Data, Models, Types]
- Build Providers Tree - IDE Intellisense Added
- Hydration Warnings Suppressed
- Acsessibility - Added Tabindex on Home Page Avatar Container
- Performance Issue Resolved in Bookmark Page using `useRef` becouse its not a reRender the Conponent on every state change insted of `useState`

### Removed
- OLD Html Files [index, Skillicon Generator, QRBorderLicenseBypass Checks]
- JSON Web Token - Removed from the Project alternative is 'Jose' Library for NextJS

## v1.0.0 - 01/08/2024

### Added
- Initial start of the project a nextjs Template