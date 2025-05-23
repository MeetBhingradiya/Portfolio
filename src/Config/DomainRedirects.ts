interface DomainRedirectsCondition {
    Domain: Array<string>
    RedirectPath: string
    isReplaceEnpoints?: boolean
}

const DomainRedirects: Array<DomainRedirectsCondition> = [
    {
        Domain: [
            "meetbhingradiya.shop"
        ],
        RedirectPath: "/Shop",
    },
    {
        Domain: [
            "meetbhingradiya.tech"
        ],
        RedirectPath: "/Home",
    },
    {
        Domain: [
            "bookmarks.meetbhingradiya.tech"
        ],
        RedirectPath: "/Tools",
        isReplaceEnpoints: true,
    },
]