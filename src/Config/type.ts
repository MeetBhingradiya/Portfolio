interface Common_Config_Type {
    Environment?: "development" | "production" | "test";
    Emails: EmailConfig;
}

export interface EmailConfig {
    domain: string;
    contact: string;
    privacy: string;
    security: string;
    legal: string;
    dmca: string;
}

export interface NotificationConfig {
    // ? Landing Page Notification Banner
    enabled: boolean;
    message: string;
    type?: "info" | "warning" | "error" | "success";
    link?: {
        text: string;
        href: string;
    };
    dismissible?: boolean;
}

export interface Client_Config_Type extends Common_Config_Type {
    Notification?: NotificationConfig;
}

export interface Server_Config_Type extends Common_Config_Type {

}