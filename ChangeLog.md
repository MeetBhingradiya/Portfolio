# Meet Bhingradiya Portfolio - Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Current Goals
- 10+ New Tools
- A Embrodery Company Management System
- Blogging
- Portfolio Management System
- Wallets Management System Linked with BANK APIs
- Desktop & Mobile App of React Native & Electron

## Current Tasks
- [ ] Bug : Fix Theme of Tools > QR

<!-- ## [Unreleased]

### Added
- New feature XYZ
- Improved performance of ABC module

### Changed
- Refactored code in XYZ module

### Fixed
- Bug in ABC module -->

## v1.0.2 - 09/12/2024

### Added
- Hooks > useStore - Added for Store Management of the Client Side Pages faster and easier to manage
- Models > New Models > Permissions, VerificationCodes, Users, Transactions, Wallets
- Utils > ExtensionsDetector - Added for Detecting the Extensions is Installed or Not in the Browser
- Utils > Crypto - Added for Encrypting and Decrypting Technologie for the Project (9 Algorithms Supported, upto 40+ Algorithms)
- Changelog > Current Goals & Current Tasks Added

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