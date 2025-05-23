import React from 'react';
import {
    Search,
    Fingerprint,
    QrCode2,
    DataObject,
    Colorize,
    Palette,
    TextFields,
    Extension,
    DescriptionOutlined,
    Security,
    LinkOutlined,
    Code,
    Password,
    CalendarMonth,
    Key
} from '@mui/icons-material';

// Tool definitions
export const Tools = [
    {
        Query: "BingQuerys",
        Title: "Bing Queries",
        Icon: <Search sx={{ width: 32, height: 32 }} />,
        Description: "Generate and manage Bing search queries",
        Category: 'utility'
    },
    {
        Query: "UUID",
        Title: "UUID Generator",
        Icon: <Fingerprint sx={{ width: 32, height: 32 }} />,
        Description: "Generate random UUIDs",
        Category: 'utility'
    },
    {
        Query: "QR",
        Title: "QR Code Generator",
        Icon: <QrCode2 sx={{ width: 32, height: 32 }} />,
        Description: "Generate QR codes from text or URLs",
        Category: 'utility'
    },
    {
        Query: "JSONObject",
        Title: "JSON/Object Converter",
        Icon: <DataObject sx={{ width: 32, height: 32 }} />,
        Description: "Convert between JSON and JavaScript objects",
        Category: 'data'
    },
    {
        Query: "ColourPalette",
        Title: "Colour Picker",
        Icon: <Colorize sx={{ width: 32, height: 32 }} />,
        Description: "Pick and manage colors",
        Category: 'color'
    },
    {
        Query: "ColourConvert",
        Title: "Colour Converter",
        Icon: <Palette sx={{ width: 32, height: 32 }} />,
        Description: "Convert between color formats (HEX, RGB, HSL)",
        Category: 'color'
    },
    {
        Query: "Case",
        Title: "Case Changer",
        Icon: <TextFields sx={{ width: 32, height: 32 }} />,
        Description: "Convert text between different cases",
        Category: 'text'
    },
    {
        Query: "CRX",
        Title: "CRX Downloader",
        Icon: <Extension sx={{ width: 32, height: 32 }} />,
        Description: "Download Chrome extensions as CRX files",
        Category: 'utility'
    },
    {
        Query: "Markdown",
        Title: "Markdown Preview",
        Icon: <DescriptionOutlined sx={{ width: 32, height: 32 }} />,
        Description: "Preview and edit Markdown files",
        Category: 'text'
    },
    {
        Query: "JWT",
        Title: "JWT Decoder",
        Icon: <Security sx={{ width: 32, height: 32 }} />,
        Description: "Decode and verify JWT tokens",
        Category: 'security'
    },
    {
        Query: "URL",
        Title: "URL Builder",
        Icon: <LinkOutlined sx={{ width: 32, height: 32 }} />,
        Description: "Build and parse URLs with query parameters",
        Category: 'utility'
    },
    {
        Query: "RegExp",
        Title: "RegExp Builder & Tester",
        Icon: <Code sx={{ width: 32, height: 32 }} />,
        Description: "Build and test regular expressions",
        Category: 'text'
    },
    {
        Query: "Password",
        Title: "Password Generator",
        Icon: <Password sx={{ width: 32, height: 32 }} />,
        Description: "Generate secure passwords",
        Category: 'security'
    },
    {
        Query: "DateAndTime",
        Title: "Date & Time Utils",
        Icon: <CalendarMonth sx={{ width: 32, height: 32 }} />,
        Description: "Date and time utilities",
        Category: 'utility'
    },
    {
        Query: "EncryptAndDecrypt",
        Title: "Encrypt & Decrypt",
        Icon: <Key sx={{ width: 32, height: 32 }} />,
        Description: "Encrypt and decrypt text",
        Category: 'security'
    }
];

// Category labels and icons
export const Categories = {
    data: {
        label: "Data Tools",
        icon: <DataObject sx={{ width: 20, height: 20 }} />
    },
    color: {
        label: "Color Tools",
        icon: <Palette sx={{ width: 20, height: 20 }} />
    },
    text: {
        label: "Text Tools",
        icon: <TextFields sx={{ width: 20, height: 20 }} />
    },
    utility: {
        label: "Utilities",
        icon: <Extension sx={{ width: 20, height: 20 }} />
    },
    security: {
        label: "Security Tools",
        icon: <Security sx={{ width: 20, height: 20 }} />
    }
}; 