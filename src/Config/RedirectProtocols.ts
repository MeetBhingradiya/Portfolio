const RedirectProtocols: Array<{
    protocol: string
    redirectpath?: string
    useUserPathasRedirect?: boolean
}> = [
    {
        protocol: "INVALID_ORIGIN",
        useUserPathasRedirect: true
    },
    {
        protocol: "UNSUPPORTED_NETWORK",
        redirectpath: "/UnSupportedNetwork"
    },
    {
        protocol: "UNSUPPORTED_BROWSER",
        redirectpath: "/UnSupportedBrowser"
    },
    {
        protocol: "UNSUPPORTED_PLATFORM",
        redirectpath: "/UnSupportedPlatform"
    }
]

export { RedirectProtocols };