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
        name: "Translate",
        url: "https://translate.google.com/",
        icon: "https://www.gstatic.com/images/branding/product/1x/translate_64dp.png"
    },
    {
        name: "Meet",
        url: "https://meet.google.com/",
        keywords: [
            "Meet",
            "Video",
            "Call"
        ]
    },
    {
        name: "Keep",
        url: "https://keep.google.com/",
        icon: "https://www.gstatic.com/images/branding/product/1x/keep_2020q4_48dp.png",
        keywords: [
            "Keep",
            "Notes"
        ]
    },
    {
        name: "DNS",
        url: "https://dns.google/",
        keywords: [
            "Domain Name System",
            "DNS",
            "Google"
        ]
    },
    {
        name: "Calendar",
        url: "https://calendar.google.com/",
        icon: "https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_@Day_2x.png",
        keywords: [
            "Calendar",
            "Workspace",
            "Google"
        ]
    },
    {
        name: "Signout",
        url: "https://accounts.google.com/Logout",
        keywords: [
            "Logout",
            "Sign Out",
            "Google"
        ]
    },
    {
        name: "Microsoft",
        url: "https://microsoft.com",
        icon: "https://www.microsoft.com/favicon.ico",
        keywords: [
            "Microsoft",
            "MS"
        ]
    },
    {
        name: "Products",
        url: "https://support.microsoft.com/en-us/all-products"
    },
    {
        name: "Bing Rewards",
        url: "https://account.microsoft.com/rewards",
        icon: "https://rewards.bing.com/rewards.png",
        keywords: [
            "Rewards",
            "Points",
            "Bing",
            "Microsoft",
            "MSR",
            "BR",
            "MR"
        ]
    },
    {
        name: "Bing",
        url: "https://www.bing.com",
        icon: "https://www.bing.com/favicon.ico",
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
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="2500" height="2500" fill="none" stroke-width="1.5" class="h-6 w-6" viewBox="-0.17090198558635983 0.482230148717937 41.14235318283891 40.0339509076386"><text x="-9999" y="-9999">ChatGPT</text><path d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813zM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496zM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744zM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.01L7.04 23.856a7.504 7.504 0 0 1-2.743-10.237zm27.658 6.437l-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.01l8.052 4.648a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.65-1.132zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763zm-21.063 6.929l-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 6.94 6.94 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225zm1.829-3.943l4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18z" fill="currentColor"/></svg>`,
        isSVGSrc: true,
        SVGStyles: {
            fill: "#fff"
        },
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
        name: "Visual Studio Code",
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
        icon: "https://github.githubassets.com/assets/apple-touch-icon-144x144-b882e354c005.png",
        keywords: [
            "GitHub",
            "Git",
            "Code",
            "Repo"
        ]
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
        icon: `<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"currentColor\" class=\"type-color-fill\" viewBox=\"0 0 16 16\">\n  <path d=\"M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z\"/>\n</svg>`,
        isSVGSrc: true,
        SVGStyles: {
            fill: "#1877F2"
        },
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
        icon: `<svg viewBox="0 0 31 30" height="30" preserveAspectRatio="xMidYMid meet" fill="none">
                <path d="M30.3139 14.3245C30.174 10.4932 28.5594 6.864 25.8073 4.1948C23.0552 1.52559 19.3784 0.0227244 15.5446 4.10118e-06H15.4722C12.8904 -0.00191309 10.3527 0.668375 8.10857 1.94491C5.86449 3.22145 3.99142 5.06026 2.67367 7.28039C1.35592 9.50053 0.6389 12.0255 0.593155 14.6068C0.547411 17.1882 1.17452 19.737 2.41278 22.0024L1.09794 29.8703C1.0958 29.8865 1.09712 29.9029 1.10182 29.9185C1.10651 29.9341 1.11448 29.9485 1.12518 29.9607C1.13588 29.973 1.14907 29.9828 1.16387 29.9896C1.17867 29.9964 1.19475 29.9999 1.21103 30H1.23365L9.01561 28.269C11.0263 29.2344 13.2282 29.7353 15.4586 29.7346C15.6004 29.7346 15.7421 29.7346 15.8838 29.7346C17.8458 29.6786 19.7773 29.2346 21.5667 28.4282C23.3562 27.6218 24.9682 26.469 26.3098 25.0363C27.6514 23.6036 28.696 21.9194 29.3832 20.0809C30.0704 18.2423 30.3867 16.2859 30.3139 14.3245ZM15.8099 27.1487C15.6923 27.1487 15.5747 27.1487 15.4586 27.1487C13.4874 27.1511 11.5444 26.6795 9.79366 25.7735L9.39559 25.5654L4.11815 26.8124L5.09221 21.4732L4.86604 21.0902C3.78579 19.2484 3.20393 17.157 3.17778 15.0219C3.15163 12.8869 3.68208 10.7819 4.71689 8.91419C5.75171 7.0465 7.25518 5.48059 9.07924 4.37067C10.9033 3.26076 12.985 2.64514 15.1194 2.58444C15.238 2.58444 15.3571 2.58444 15.4767 2.58444C18.6992 2.59399 21.7889 3.86908 24.0802 6.13498C26.3715 8.40087 27.681 11.4762 27.7265 14.6984C27.7719 17.9205 26.5498 21.0316 24.3234 23.3612C22.0969 25.6909 19.0444 27.0527 15.8235 27.1532L15.8099 27.1487Z" fill="currentColor"></path><path d="M10.2894 7.69007C10.1057 7.69366 9.92456 7.73407 9.75673 7.80892C9.5889 7.88377 9.43779 7.99154 9.31236 8.12584C8.95801 8.48923 7.96736 9.36377 7.91006 11.2003C7.85277 13.0369 9.13594 14.8538 9.31537 15.1086C9.49481 15.3635 11.7686 19.3306 15.5141 20.9395C17.7156 21.8879 18.6806 22.0507 19.3063 22.0507C19.5642 22.0507 19.7587 22.0236 19.9622 22.0115C20.6483 21.9693 22.1969 21.1762 22.5346 20.3137C22.8724 19.4512 22.895 18.6973 22.806 18.5465C22.7171 18.3957 22.4728 18.2872 22.1049 18.0942C21.737 17.9012 19.9321 16.9361 19.5928 16.8004C19.467 16.7419 19.3316 16.7066 19.1932 16.6964C19.1031 16.7011 19.0155 16.7278 18.938 16.774C18.8605 16.8203 18.7954 16.8847 18.7484 16.9618C18.4469 17.3372 17.7548 18.153 17.5225 18.3882C17.4718 18.4466 17.4093 18.4938 17.3392 18.5265C17.2691 18.5592 17.1928 18.5768 17.1154 18.5782C16.9728 18.5719 16.8333 18.5344 16.7068 18.4681C15.6135 18.0038 14.6167 17.339 13.768 16.5079C12.975 15.7263 12.3022 14.8315 11.7716 13.8526C11.5666 13.4726 11.7716 13.2766 11.9586 13.0987C12.1456 12.9208 12.3461 12.675 12.5391 12.4624C12.6975 12.2808 12.8295 12.0777 12.9312 11.8593C12.9838 11.7578 13.0104 11.6449 13.0085 11.5307C13.0067 11.4165 12.9765 11.3045 12.9206 11.2048C12.8317 11.0149 12.1667 9.14664 11.8546 8.39725C11.6013 7.75642 11.2997 7.73531 11.0358 7.7157C10.8187 7.70062 10.5699 7.69309 10.3211 7.68555H10.2894" fill="currentColor">
                </path>
            </svg>`,
        isSVGSrc: true,
        SVGStyles: {
            fill: "#4CAF50"
        },
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
        name: "FullStack Site Clones",
        url: "https://www.codewithantonio.com/"
    },
    {
        name: "Replit",
        url: "https://replit.com"
    },
    {
        name: "MDN Docs",
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
    {
        name: "New Student Portal",
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
        icon: "https://github.githubassets.com/assets/apple-touch-icon-144x144-b882e354c005.png",
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
            "Amazon Web Services",
            "Amazon",
            "Web",
            "Services",
            "Cloud",
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
    },
    {
        name: "Paypal",
        url: "https://www.paypal.com/",
        keywords: [
            "Paypal",
            "Payment",
            "Gateway"
        ]
    },
    {
        name: "Stripe",
        url: "https://stripe.com/",
        keywords: [
            "Stripe",
            "Payment",
            "Gateway"
        ]
    },
    {
        name: "Pinterest",
        url: "https://www.pinterest.com/",
        keywords: [
            "Pinterest",
            "Images",
            "Photos",
            "Ideas"
        ]
    }
]

function ResolveIcon(link: IBookmark) {
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

// function Make_BookmarkSuggestionDB(array: Array<IBookmark>): Array<ISuggestion> {

//     return array.map((bookmark, index)=> {
//         return {
//             Query: bookmark.name,
//             Link: bookmark.url,
//             Thumbnail: bookmark?.icon,
//             Keywords: bookmark?.keywords
//         }
//     })
// }

// export const BookmarkSuggestionDB: Array<ISuggestion> = Make_BookmarkSuggestionDB(BookmarksDB)