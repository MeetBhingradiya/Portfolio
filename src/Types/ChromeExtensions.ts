interface IExtensions {
    Name: string
    ID: string
    Icon: string
    Settings: {
        // ? If this Extension is installed then Application will Stop
        isBlocked: boolean

        // ? If this Extension is installed then Application will show a Warning
        isWarning: boolean

        // ? Status of Extension
        Flag: "Installed" | "NInstalled"
    }

    // ? Endpoits of Content Scripts or Images for Flag as Installed or Not Installed
    Files: Array<string>

}

interface IState {
    Extensions: Array<IExtensions>
    isBlocked: boolean
    isWarning: boolean
    FlaggedExtensions: Array<IExtensions>
}

export type { 
    IExtensions, 
    IState 
}