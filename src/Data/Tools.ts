import type {
    IBookmark,
    ISuggestion
} from "@Types/Tools";
import { v4 as uuidv4 } from 'uuid';

const BookmarksDB_: Array<IBookmark> = [
    {
        name: "Meet Bhingradiya",
        url: "/",
        icon: "https://meetbhingradiya.vercel.app/favicon.ico",
        keywords: [
            "Meet",
            "Bhingradiya",
            "Portfolio"
        ]
    },
    {
        name: "QR Code Generator",
        url: "/Tools/QR",
        icon: "https://img.icons8.com/fluency/256/qr-code.png",
        keywords: [
            "QR",
            "Code",
            "Generator"
        ]
    },
    {
        name: "Google Trends",
        url: "/Tools/Googletrends",
        icon: "https://www.gstatic.com/trends/favicon.ico",
        keywords: [
            "Google",
            "Trends",
            "Querys",
            "Copy",
            "Paste"
        ]
    },
    {
        name: "Google",
        url: "https://google.com",
        icon: "https://www.google.com/favicon.ico",
        keywords: [
            "Search",
            "Google",
            "G"
        ]
    },
    {
        name: "Accounts",
        url: "https://accounts.google.com",
        keywords: [
            "Google",
            "Accounts",
            "Login"
        ]
    },
    {
        name: "Products",
        url: "https://about.google/intl/ALL_in/products/",
        keywords: [
            "Google",
            "Products"
        ]
    },
    {
        name: "Play Store",
        url: "https://play.google.com",
        icon: "https://lh3.googleusercontent.com/aTWbsnyhhmgnwKeD6_8X0cdmN12iq1vC2D6dMfw2B36N5Nh73BN1e1IplijPNtzp4IUgiJRRA-4M5e2SLfTIFOfVW09DeezqPYGnXoEfNBliIP4l=h120",
        keywords: [
            "Play Store",
            "Apps",
            "Games",
            "Google Play",
            "Google"
        ]
    },
    {
        name: "Play Games",
        url: "https://play.google.com/games",
        keywords: [
            "Play Games",
            "Games",
            "Google Play",
            "Google"
        ],
        icon: "https://lh3.googleusercontent.com/1bBfkvken8Lqz8NftP9_n8PmC2j6iMPUovX_c-tahFJYXo1tImjmPBU1nv1ATO_XIIh2dHUH6DMp0blUuhL7PZ7JvhZwNQ4QaiYnBsE7sGZcTDP3fLI=h120"
    },
    {
        name: "Maps",
        url: "https://maps.google.com",
        keywords: [
            "Maps",
            "Google Maps",
            "Google"
        ],
        icon: "https://lh3.googleusercontent.com/9NuRdiRepVI3n1txfg7Ky2wWzB3DvXkWABXeFMSn2tzDYYkv8T_RMA9R17fWi0ziUDIDTVJx0JruCzOev37c4dkK9Wrgkeyam3pM8lI=h120"
    },
    {
        name: "Pay",
        url: "https://pay.google.com",
        icon: "https://lh3.googleusercontent.com/yemTWtzfavZZqaWs0_ijOcSrLtp93cAfiJA4HqGSpJNYBxe13WWQxeqV7xt7Bdf34Nug2nw2z-a4T85pXURHj8tcOPFh1-l7BvYANqrAXd7zHVQ93x0=h120"
    },
    {
        name: "GMail",
        url: "https://mail.google.com/",
        icon: "https://lh3.googleusercontent.com/mK6uPlO8TKCVSU8TsniV0pOUB0SSETbAPB_QUaaJ96qbBdZwaygmzf_bWRTIHmCNKgJ2hhn86KSfEAHvHN-P2EjFWAxPd77ob_2k8ew=h120",
        keywords: [
            "Gmail",
            "Mail"
        ]
    },
    {
        name: "YouTube",
        url: "https://youtube.com",
        icon: "https://lh3.googleusercontent.com/I95wjYii8vhFSSx-aSYdh2hPAMjgZkA9yjarSQoOd98COwOxkAVn_dulBcTcfbsa7Limy6IKX6G95ep6OB6y2yMLMiX0YEqFx3KQHQ=h120"
    },
    {
        name: "Drive",
        url: "https://drive.google.com",
        icon: "https://lh3.googleusercontent.com/AGsg9hOAylBkWuFrfSgOt8psYWcr3b-vZcmIVk0ocwx7KAVSu--tg1ZIAUSL7nAbORTHI5eZaweHYVPMJu5ac8Xw7GP_WiCs1w60=h120"
    },
    {
        name: "Gemini",
        url: "https://gemini.google.com",
        keywords: [
            "Gemini",
            "AI",
            "Chat"
        ]
    },
    {
        name: "Classroom",
        url: "https://classroom.google.com",
        icon: "https://www.gstatic.com/classroom/logo_square_rounded.svg",
        keywords: [
            "Classroom",
            "GC"
        ]
    },
    {
        name: "Android",
        url: "https://developer.android.com/"
    },
    {
        name: "Colab",
        url: "https://colab.research.google.com/",
        icon: "https://ssl.gstatic.com/colaboratory-static/common/b124d179c25e30ffc6a1ff293e85eba8/img/favicon.ico"
    },
    {
        name: "Fonts",
        url: "https://fonts.google.com/",
        icon: "https://www.gstatic.com/images/branding/product/1x/google_fonts_64dp.png"
    },
    {
        name: "Analytics",
        url: "https://analytics.google.com/",
        icon: "https://lh3.googleusercontent.com/oLcLMz42MUjK9Iv4M4YSOfBIHcxUh9dck3PN8kT8FR_z9_mUlWzyf4JHqPavPsKHJ7FR2rlGZf51vgEv1k5i0QQai4_J0ffYkIFbaJA=h120"
    },
    {
        name: "AdSense",
        url: "https://adsense.google.com/",
        icon: "https://lh3.googleusercontent.com/kSVhJx6xNAhqot_OjnzSAp8kyKtL9nW65nqObijdjYcNfqDn4bLx-1g_1h4rz0maXRwJp6K4AEDCQi8dOg_tn_Y80R3NjNXbUN6Hag=h120"
    },
    {
        name: "AdMob",
        url: "https://admob.google.com/",
        icon: "https://lh3.googleusercontent.com/6cr6PdE9s0J1ovFNm38uf-dwcOP--68QMWey603BCUah-QcO0gL0TvyqmTBYIgNnJfk8AEgISH_xpw_zd8FNao0jA14Q5MQ7p-eeIto=h120"
    },
    {
        name: "Trends",
        url: "https://trends.google.com/trends/?geo=US",
        icon: "https://ssl.gstatic.com/trends_nrtr/2431_RC03/favicon.ico"
    },
    {
        name: "Assistant",
        url: "https://assistant.google.com/",
        icon: "https://www.gstatic.com/images/branding/product/2x/assistant_64dp.png"
    },
    {
        name: "DNS",
        url: "https://dns.google/"
    },
    {
        name: "Calendar",
        url: "https://calendar.google.com/",
        icon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_@Day_2x.png"
    },
    {
        name: "Signout",
        url: "https://accounts.google.com/Logout",
        keywords: [
            "Logout",
            "Sign Out"
        ]
    },
    {
        name: "Microsoft",
        url: "https://microsoft.com",
        icon: "https://www.microsoft.com/favicon.ico"
    },
    {
        name: "Products",
        url: "https://support.microsoft.com/en-us/all-products"
    },
    {
        name: "Bing Rewards",
        url: "https://account.microsoft.com/rewards",
        icon: "https://rewards.bing.com/rewards.png"
    },
    {
        name: "Bing",
        url: "https://www.bing.com",
        icon: "https://www.bing.com/favicon.ico"
    },
    {
        name: "Copilot",
        url: "https://www.bing.com/Chat",
        icon: "https://www.bing.com/sa/simg/favicon-cplt.ico",
        keywords: [
            "Copilot",
            "Chat",
            "AI",
            "Bing",
            "Bing AI"
        ]
    },
    {
        name: "Chat GPT",
        url: "https://chat.openai.com",
        keywords: [
            "OpenAI",
            "GPT",
            "Chat",
            "AI",
            "ChatGPT"
        ]
    },
    {
        name: "Designer",
        url: "https://designer.microsoft.com/",
        keywords: [
            "Designer",
            "Microsoft",
            "Design"
        ]
    },
    {
        name: "Outlook",
        url: "https://outlook.com/",
        icon: "https://outlook.live.com/favicon.ico",
        keywords: [
            "Outlook",
            "Mail",
            "Email"
        ]
    },
    {
        name: "Office",
        url: "https://office.com/",
        keywords: [
            "Office",
            "Microsoft",
            "Docs",
            "Word",
            "Excel",
            "PowerPoint"
        ]
    },
    {
        name: "OneDrive",
        url: "https://onedrive.live.com/",
        icon: "https://onedrive.live.com/favicon.ico",
        keywords: [
            "OneDrive",
            "Cloud",
            "CloudDrive",
            "Cloud Storage",
            "Microsoft"
        ]
    },
    {
        name: "Teams",
        url: "https://teams.microsoft.com/",
        icon: "https://teams.microsoft.com/favicon.ico"
    },
    {
        name: "Visual Studio Code - Web",
        url: "https://vscode.dev/",
        icon: "https://code.visualstudio.com/favicon.ico"
    },
    {
        name: "Xbox",
        url: "https://www.xbox.com/",
        icon: "https://img.icons8.com/fluency/512/xbox.png"
    },
    {
        name: "Github",
        url: "https://github.com",
        icon: "https://github.githubassets.com/assets/apple-touch-icon-144x144-b882e354c005.png"
    },
    {
        name: "Azure",
        url: "https://portal.azure.com/",
        icon: "https://img.icons8.com/fluency/512/azure-1.png",
        keywords: [
            "Azure",
            "Cloud",
            "Microsoft"
        ]
    },
    {
        name: "Bing Image",
        url: "https://www.bing.com/images/create",
        keywords: [
            "Image",
            "Creator",
            "AI"
        ]
    },
    {
        name: "Fluent 2 UI",
        url: "https://fluent2.microsoft.design/",
        icon: "https://www.microsoft.com/favicon.ico"
    },
    {
        name: "Fluent UI",
        url: "https://developer.microsoft.com/en-us/fluentui#/controls/web",
        icon: "https://developer.microsoft.com/favicon.ico"
    },
    {
        name: "Facebook",
        url: "https://facebook.com",
        icon: "https://www.facebook.com/favicon.ico",
        keywords: [
            "Social",
            "Facebook",
            "FB"
        ]
    },
    {
        name: "Instagram",
        url: "https://instagram.com",
        icon: "https://img.icons8.com/fluency/512/instagram-new.png",
        keywords: [
            "Social",
            "Instagram",
            "IG",
            "Meta"
        ]
    },
    {
        name: "Twitter",
        url: "https://x.com",
        icon: "https://www.x.com/favicon.ico",
        keywords: [
            "Social",
            "Twitter",
            "Tweet",
            "X",
            "Bird"
        ]
    },
    {
        name: "Reddit",
        url: "https://reddit.com",
        icon: "https://www.reddit.com/favicon.ico",
        keywords: [
            "Social",
            "Reddit",
            "R"
        ]
    },
    {
        name: "Twitch",
        url: "https://twitch.tv",
        icon: "https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png"
    },
    {
        name: "Discord",
        url: "https://discord.com/app"
    },
    {
        name: "WhatsApp",
        url: "https://web.whatsapp.com",
        icon: "https://static.whatsapp.net/rsrc.php/v3/yz/r/ujTY9i_Jhs1.png",
        keywords: [
            "Social",
            "WhatsApp",
            "W"
        ]
    },
    {
        name: "Telegram",
        url: "https://web.telegram.org",
        icon: "https://telegram.org/favicon.ico",
        keywords: [
            "Social",
            "Telegram",
            "T"
        ]
    },
    {
        name: "LinkedIn",
        url: "https://linkedin.com",
        icon: "https://www.linkedin.com/favicon.ico",
        keywords: [
            "Social",
            "LinkedIn",
            "In"
        ]
    },
    {
        name: "Snapchat",
        url: "https://web.snapchat.com"
    },
    {
        name: "Vercel",
        url: "https://vercel.com",
        icon: "https://vercel.com/favicon.ico"
    },
    {
        name: "Stack Overflow",
        url: "https://stackoverflow.com",
        icon: "https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico?v=ec617d715196"
    },
    {
        name: "Notion",
        url: "https://notion.so",
        icon: "https://www.notion.so/images/favicon.ico"
    },
    {
        name: "Notion Logout",
        url: "https://www.notion.so/logout"
    },
    {
        name: "W3Schools",
        url: "https://w3schools.com",
        icon: "https://www.w3schools.com/favicon.ico"
    },
    {
        name: "ZeroGPT",
        url: "https://zerogpt.com"
    },
    {
        name: "React",
        url: "https://react.dev",
        keywords: [
            "React",
            "JS",
            "Library",
            "Docs"
        ]
    },
    {
        name: "Remix",
        url: "https://remix.run",
        icon: "https://remix.run/favicon-128.png"
    },
    {
        name: "Next Js",
        url: "https://nextjs.org",
        icon: "https://nextjs.org/static/favicon/favicon.ico"
    },
    {
        name: "Tailwind UI",
        url: "https://tailwindui.com",
        icon: "https://tailwindui.com/favicon.ico"
    },
    {
        name: "PHPMyAdmin",
        url: "https://www.phpmyadmin.net/",
        icon: "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.phpmyadmin.net/&size=128"
    },
    {
        name: "Local DB Admin",
        url: "http://localhost/phpmyadmin/",
        icon: "https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.phpmyadmin.net/&size=128"
    },
    {
        name: "MUi",
        url: "https://mui.com"
    },
    {
        name: "Domain Lookup",
        url: "https://www.whois.com/whois/",
        icon: "https://www.whois.com/images/favicon.ico"
    },
    {
        name: "Icon8",
        url: "https://icons8.com/",
        icon: "https://maxst.icons8.com/vue-static/icon/favicon/icons8_fav_32×32.png"
    },
    {
        name: "Figma",
        url: "https://figma.com",
        icon: "https://static.figma.com/uploads/b6df2735e4cb368306acf5480b50f96e69f96099"
    },
    {
        name: "FullStack Website Clones",
        url: "https://www.codewithantonio.com/"
    },
    {
        name: "Replit",
        url: "https://replit.com"
    },
    {
        name: "MDN Web Docs",
        url: "https://developer.mozilla.org/en-US/"
    },
    {
        name: "Dashboard",
        url: "https://dash.cloudflare.com/",
        icon: "https://dash.cloudflare.com/favicon.ico"
    },
    {
        name: "Cloudflare",
        url: "https://cloudflare.com/",
        icon: "https://www.cloudflare.com/favicon.ico"
    },
    {
        name: "Warp",
        url: "https://1.1.1.1/"
    },
    {
        name: "P P Savani University",
        url: "https://ppsu.ac.in/",
        icon: "/assets/ppsu.png"
    },
    {
        name: "Student Syllabus",
        url: "https://ppsu.ac.in/soe/Academics.php",
        icon: "/assets/ppsu.png"
    },
    {
        name: "Student Portal",
        url: "https://ppsu.emli.in/student-ppsavani.php",
        icon: "/assets/ppsu.png"
    },
    {        name: "New Student Portal",
        url: "https://erp.ppsu.ac.in/",
        icon: "/assets/ppsu.png"
    },
    {
        name: "PPSU - Exam Papers",
        url: "https://sites.google.com/ppsu.ac.in/soeexam",
        icon: "/assets/ppsu.png"
    },
    {
        name: "Redux",
        url: "https://redux.js.org/"
    },
    {
        name: "Toolkit",
        url: "https://redux-toolkit.js.org/",
        keywords: [
            "Redux",
            "Toolkit",
            "JS",
            "Framework"
        ]
    },
    {
        name: "React Redux",
        url: "https://react-redux.js.org/",
        keywords: [
            "React",
            "Redux",
            "JS",
            "Framework"
        ]
    },
    {
        name: "Saga",
        url: "https://redux-saga.js.org/",
        keywords: [
            "Redux",
            "Saga",
            "JS",
            "Framework"
        ]
    },
    {
        name: "Vite",
        url: "https://vitejs.dev/",
        icon: "https://vitejs.dev/logo.svg",
        keywords: [
            "Vite",
            "JS",
            "Framework",
            "Vue",
            "React",
            "JavaScript"
        ]
    },
    {
        name: "JS Object to JSON",
        url: "https://www.convertsimple.com/convert-javascript-to-json/",
        icon: "https://www.convertsimple.com/wp-content/uploads/2020/08/cropped-ConvertSimpleFavicon512-32x32.png"
    },
    {
        name: "JSON to JS Object",
        url: "https://www.convertsimple.com/convert-json-to-javascript/",
        icon: "https://www.convertsimple.com/wp-content/uploads/2020/08/cropped-ConvertSimpleFavicon512-32x32.png"
    },
    {
        name: "Black Box AI",
        url: "https://blackbox.ai/",
        keywords: [
            "Black Box",
            "AI",
            "Chat"
        ]
    },
    {
        name: "My Compiler",
        url: "https://mycompiler.io/"
    },
    {
        name: "NPM",
        url: "https://www.npmjs.com/",
        keywords: [
            "NPM",
            "Node",
            "Package",
            "Manager"
        ]
    },
    {
        name: "NodeJS",
        url: "https://nodejs.org/",
        keywords: [
            "Node",
            "JS",
            "MERN",
            "MEAN",
            "JavaScript",
            "Framework",
            "V8"
        ]
    },
    {
        name: "Gatsby",
        url: "https://www.gatsbyjs.com/",
        keywords: [
            "Gatsby",
            "React",
            "JS",
            "Framework",
            "GraphQL"
        ]
    },
    {
        name: "Student Developer",
        url: "https://education.github.com/pack",
        icon: "https://github.githubassets.com/favicons/favicon-dark.png",
        keywords: [
            "Student",
            "Developer",
            "GitHub",
            "Pack"
        ]
    },
    {
        name: "GraphQL",
        url: "https://graphql.org/",
        keywords: [
            "GraphQL",
            "API",
            "Query",
            "Language"
        ]
    },
    {
        name: "Amazon",
        url: "https://www.amazon.in/",
        keywords: [
            "Amazon",
            "Shopping",
            "Ecommerce"
        ]
    },
    {
        name: "AWS",
        url: "https://aws.amazon.com/",
        keywords: [
            "Amazon",
            "Web",
            "Services",
            "Cloud"
        ]
    },
    {
        name: "Spotify",
        url: "https://open.spotify.com/",
        keywords: [
            "Spotify",
            "Music",
            "Songs",
            "Playlist"
        ]
    },
    {
        name: "YouTube Music",
        url: "https://music.youtube.com/",
        keywords: [
            "YouTube",
            "Music",
            "Songs",
            "Playlist"
        ]
    },
    {
        name: "YouTube Studio",
        url: "https://studio.youtube.com/",
        keywords: [
            "YouTube",
            "Studio",
            "Content",
            "Creator"
        ]
    },
    {
        name: "Netflix",
        url: "https://www.netflix.com/",
        keywords: [
            "Netflix",
            "Movies",
            "Shows",
            "Series"
        ]
    },
    {
        name: "Prime Video",
        url: "https://www.primevideo.com/",
        keywords: [
            "Amazon",
            "Prime",
            "Video",
            "Movies",
            "Shows",
            "Series"
        ]
    },
    {
        name: "Jio Cinema",
        url: "https://www.jiocinema.com/",
        keywords: [
            "Jio",
            "Cinema",
            "Movies",
            "Shows",
            "TV"
        ]
    },
    {
        name: "Hotstar",
        url: "https://www.hotstar.com/",
        keywords: [
            "Hotstar",
            "Disney",
            "Movies",
            "Shows",
            "Series"
        ]
    },
    {
        name: "Zee5",
        url: "https://www.zee5.com/",
        keywords: [
            "Zee5",
            "Movies",
            "Shows",
            "Series"
        ]
    },
    {
        name: "Sony Liv",
        url: "https://www.sonyliv.com/",
        keywords: [
            "Sony",
            "Liv",
            "Movies",
            "Shows",
            "Series"
        ]
    }
]

function ResolveIcon(link: IBookmark): string {
    const iconUrl = link.icon
        ? link.icon
        : `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${link.url}&size=128`;

    const variables = [
        { Name: "Date", Value: new Date().toLocaleDateString() },
        { Name: "Day", Value: new Date().toLocaleDateString().split("/")[0] },
        { Name: "Month", Value: new Date().toLocaleDateString().split("/")[1] },
        { Name: "Year", Value: new Date().toLocaleDateString().split("/")[2] },
        { Name: "Time", Value: new Date().toLocaleTimeString() },
        { Name: "Hour", Value: new Date().toLocaleTimeString().split(":")[0] },
        { Name: "Minute", Value: new Date().toLocaleTimeString().split(":")[1] },
        { Name: "Second", Value: new Date().toLocaleTimeString().split(":")[2] },
    ];

    let resolvedIcon = iconUrl;
    variables.forEach((variable) => {
        resolvedIcon = resolvedIcon.replace(`@${variable.Name}`, variable.Value);
    });

    return resolvedIcon;
}

export const BookmarksDB: Array<IBookmark> = BookmarksDB_.map((bookmark) => {
    const updatedKeywords = bookmark.keywords || [];
    if (bookmark.name && !updatedKeywords.includes(bookmark.name)) {
        updatedKeywords.push(bookmark.name);
    }

    return {
        ...bookmark,
        id: uuidv4(),
        size: "128",
        icon: ResolveIcon(bookmark),
        keywords: updatedKeywords,
    };
})

function Make_BookmarkSuggestionDB(array: Array<IBookmark>): Array<ISuggestion> {

    return array.map((bookmark, index)=> {
        return {
            Query: bookmark.name,
            Link: bookmark.url,
            Thumbnail: bookmark?.icon,
            Keywords: bookmark?.keywords
        }
    })
}

export const BookmarkSuggestionDB: Array<ISuggestion> = Make_BookmarkSuggestionDB(BookmarksDB)