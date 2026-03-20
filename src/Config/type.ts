export interface EmailConfig {
    domain: string;
    contact: string;
    privacy: string;
    security: string;
    legal: string;
    dmca: string;
}

export type Date_Time_Format = `${number | string}-${number | string}-${number | string} ${number | string}:${number | string} ${"AM" | "PM"}`;

export interface NotificationConfig {
    enabled: boolean;
    message: string;
    storageValue?: string;
    type?: "info" | "warning" | "error" | "success";
    link?: {
        text: string;
        href: string;
    };
    dismissible?: boolean;
    schedule?: {
        start: Date_Time_Format;
        end: Date_Time_Format;
    };
}


// ? Main Config Type Structures
interface Common_Config_Type {
    Environment?: "development" | "production" | "test";
}

export interface Client_Config_Type extends Common_Config_Type {
    Notifications?: NotificationConfig[];
    Emails: EmailConfig;
    Origin: string;
}

export interface Server_Config_Type extends Common_Config_Type {
    Immich_Origins: string[];
    Immich_Endpoints: {
        Mobile_Redirect: string;
        Authorization: string;
        User_Settings: string;
    }
}