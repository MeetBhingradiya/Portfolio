import {
    Email,
    GitHub,
    LinkedIn,
    Twitter,
    Home,
    Work,
    Article,
    Timeline,
    Build,
    CalendarMonth,
    Dashboard,
    Settings,
    ContactMail,
    ConfirmationNumber,
    Policy,
    Description
} from "@mui/icons-material";

export interface FooterLink {
    label: string;
    href: string;
    external?: boolean;
    icon?: React.ReactNode;
}

export interface FooterSection {
    title: string;
    links: FooterLink[];
}

export const footerSections: FooterSection[] = [
    {
        title: "Navigation",
        links: [
            { label: "Projects", href: "/projects", icon: <Work className="text-base" /> },
            { label: "Blogs", href: "/blogs", icon: <Article className="text-base" /> },
            { label: "Timeline", href: "/timeline", icon: <Timeline className="text-base" /> }
        ]
    },
    {
        title: "Tools",
        links: [
            { label: "Timetable", href: "/timetable", icon: <CalendarMonth className="text-base" /> },
        ]
    },
    {
        title: "Connect",
        links: [
            { label: "Contact", href: "/contact", icon: <ContactMail className="text-base" /> },
            // { label: "Tickets", href: "/tickets", icon: <ConfirmationNumber className="text-base" /> },
            // { label: "Resume", href: "/resume.pdf", external: true, icon: <Description className="text-base" /> },
            { label: "LinkedIn", href: "https://linkedin.com/in/meetbhingradiya", external: true, icon: <LinkedIn className="text-base" /> },
            { label: "GitHub", href: "https://github.com/MeetBhingradiya", external: true, icon: <GitHub className="text-base" /> }
        ]
    },
    {
        title: "Agreements & Legal",
        links: [
            { label: "Privacy", href: "/privacy", icon: <Policy className="text-base" /> },
            { label: "Terms of Service", href: "/terms", icon: <Description className="text-base" /> },
            { label: "Security", href: "/agreements/security", icon: <Policy className="text-base" /> },
            { label: "", href: "", icon: <></> },
            { label: "Products Privacy", href: "/agreements/covered-products-privacy", icon: <Policy className="text-base" /> },
            { label: "Products Terms", href: "/agreements/covered-products-terms", icon: <Description className="text-base" /> }
        ]
    }
];

export const socialLinks = [
    {
        icon: <GitHub />,
        href: "https://github.com/MeetBhingradiya",
        label: "GitHub",
        color: "#333333"
    },
    {
        icon: <LinkedIn />,
        href: "https://linkedin.com/in/meetbhingradiya",
        label: "LinkedIn",
        color: "#0A66C2"
    },
    {
        icon: <Twitter />,
        href: "https://twitter.com/meetbhingradiya",
        label: "Twitter",
        color: "#1DA1F2"
    },
    {
        icon: <Email />,
        href: "/contact",
        label: "Email",
        color: "#EA4335"
    }
];