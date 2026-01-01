export interface EmailConfig {
    domain: string;
    contact: string;
    privacy: string;
    security: string;
    legal: string;
    dmca: string;
}

export interface NotificationConfig {
    enabled: boolean;
    message: string;
    type?: "info" | "warning" | "error" | "success";
    link?: {
        text: string;
        href: string;
    };
    dismissible?: boolean;
}


// ? Main Config Type Structures
interface Common_Config_Type {
    Environment?: "development" | "production" | "test";
}

export interface Client_Config_Type extends Common_Config_Type {
    Notification?: NotificationConfig;
    Emails: EmailConfig;
}

export interface Server_Config_Type extends Common_Config_Type {

}