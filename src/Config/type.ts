interface Common_Config_Type {
    Environment?: "development" | "production" | "test";
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