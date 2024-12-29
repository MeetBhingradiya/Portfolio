const Config = {
    version: "1.0.6",
    releasedate: "2025-1-15",
    visiblebranch: "Development",
    isHomeReleased: true,
    Environment: process.env.NODE_ENV,
    WhiteListedDomains: [
        "admin.meetbhingradiya.tech",
        "stage.meetbhingradiya.tech",
        "dev.meetbhingradiya.tech",
        "meetbhingradiya.tech",
        // "meetbhingradiya.vercel.app",
        // "dev-meetbhingradiya.vercel.app",
        // "stage-meetbhingradiya.vercel.app",
        // "admin-meetbhingradiya.vercel.app"
    ]
}

export { Config };