export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            Blogs: {
                Row: {
                    Author: string | null
                    BannerImage: string | null
                    BlogID: string
                    Content: string | null
                    CreateDate: string | null
                    Description: string | null
                    isPublished: boolean | null
                    PublishDate: string | null
                    Tags: Json | null
                    Title: string | null
                    UpdateDate: string | null
                    Visiblity: string | null
                }
                Insert: {
                    Author?: string | null
                    BannerImage?: string | null
                    BlogID?: string
                    Content?: string | null
                    CreateDate?: string | null
                    Description?: string | null
                    isPublished?: boolean | null
                    PublishDate?: string | null
                    Tags?: Json | null
                    Title?: string | null
                    UpdateDate?: string | null
                    Visiblity?: string | null
                }
                Update: {
                    Author?: string | null
                    BannerImage?: string | null
                    BlogID?: string
                    Content?: string | null
                    CreateDate?: string | null
                    Description?: string | null
                    isPublished?: boolean | null
                    PublishDate?: string | null
                    Tags?: Json | null
                    Title?: string | null
                    UpdateDate?: string | null
                    Visiblity?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "Blogs_Author_fkey"
                        columns: ["Author"]
                        isOneToOne: false
                        referencedRelation: "EmailBlacklist"
                        referencedColumns: ["Username"]
                    },
                ]
            }
            Certifications: {
                Row: {
                    Authority: string | null
                    CertificationID: string
                    isShown: boolean | null
                    Name: string
                    Thumbnail: string | null
                    URL: string | null
                }
                Insert: {
                    Authority?: string | null
                    CertificationID?: string
                    isShown?: boolean | null
                    Name: string
                    Thumbnail?: string | null
                    URL?: string | null
                }
                Update: {
                    Authority?: string | null
                    CertificationID?: string
                    isShown?: boolean | null
                    Name?: string
                    Thumbnail?: string | null
                    URL?: string | null
                }
                Relationships: []
            }
            EmailBlacklist: {
                Row: {
                    Email: string
                    EmailID: string
                    isBlacklisted: boolean
                    Reason: string
                    Username: string
                }
                Insert: {
                    Email: string
                    EmailID?: string
                    isBlacklisted?: boolean
                    Reason: string
                    Username: string
                }
                Update: {
                    Email?: string
                    EmailID?: string
                    isBlacklisted?: boolean
                    Reason?: string
                    Username?: string
                }
                Relationships: []
            }
            Experiences: {
                Row: {
                    Company: string | null
                    Description: string | null
                    End: string | null
                    ExperienceID: string
                    isCurrent: boolean | null
                    isShown: boolean | null
                    Projects: string[] | null
                    Skills: string[] | null
                    Start: string | null
                    Title: string | null
                }
                Insert: {
                    Company?: string | null
                    Description?: string | null
                    End?: string | null
                    ExperienceID?: string
                    isCurrent?: boolean | null
                    isShown?: boolean | null
                    Projects?: string[] | null
                    Skills?: string[] | null
                    Start?: string | null
                    Title?: string | null
                }
                Update: {
                    Company?: string | null
                    Description?: string | null
                    End?: string | null
                    ExperienceID?: string
                    isCurrent?: boolean | null
                    isShown?: boolean | null
                    Projects?: string[] | null
                    Skills?: string[] | null
                    Start?: string | null
                    Title?: string | null
                }
                Relationships: []
            }
            Messages: {
                Row: {
                    DecryptionKey: string | null
                    Email: string | null
                    EncryptedContent: string | null
                    FileType: string | null
                    FileURL: string | null
                    IsSystemMessage: boolean | null
                    MessagesID: string
                    ReadAt: string | null
                    SentAt: string | null
                    TicketID: string | null
                    UpdatedAt: string | null
                }
                Insert: {
                    DecryptionKey?: string | null
                    Email?: string | null
                    EncryptedContent?: string | null
                    FileType?: string | null
                    FileURL?: string | null
                    IsSystemMessage?: boolean | null
                    MessagesID?: string
                    ReadAt?: string | null
                    SentAt?: string | null
                    TicketID?: string | null
                    UpdatedAt?: string | null
                }
                Update: {
                    DecryptionKey?: string | null
                    Email?: string | null
                    EncryptedContent?: string | null
                    FileType?: string | null
                    FileURL?: string | null
                    IsSystemMessage?: boolean | null
                    MessagesID?: string
                    ReadAt?: string | null
                    SentAt?: string | null
                    TicketID?: string | null
                    UpdatedAt?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "Messages_Email_fkey"
                        columns: ["Email"]
                        isOneToOne: false
                        referencedRelation: "EmailBlacklist"
                        referencedColumns: ["Email"]
                    },
                    {
                        foreignKeyName: "Messages_TicketID_fkey"
                        columns: ["TicketID"]
                        isOneToOne: false
                        referencedRelation: "Tickets"
                        referencedColumns: ["TicketID"]
                    },
                ]
            }
            Projects: {
                Row: {
                    Category: string | null
                    Description: string | null
                    Images: Json | null
                    isShown: boolean | null
                    Name: string
                    ProjectID: string
                    Tags: Json[] | null
                    Thumbnail: string | null
                    URL: string | null
                }
                Insert: {
                    Category?: string | null
                    Description?: string | null
                    Images?: Json | null
                    isShown?: boolean | null
                    Name: string
                    ProjectID?: string
                    Tags?: Json[] | null
                    Thumbnail?: string | null
                    URL?: string | null
                }
                Update: {
                    Category?: string | null
                    Description?: string | null
                    Images?: Json | null
                    isShown?: boolean | null
                    Name?: string
                    ProjectID?: string
                    Tags?: Json[] | null
                    Thumbnail?: string | null
                    URL?: string | null
                }
                Relationships: []
            }
            Settings: {
                Row: {
                    Key: string
                    SettingID: string
                    Value: string | null
                }
                Insert: {
                    Key: string
                    SettingID?: string
                    Value?: string | null
                }
                Update: {
                    Key?: string
                    SettingID?: string
                    Value?: string | null
                }
                Relationships: []
            }
            Skills: {
                Row: {
                    Category: string | null
                    Icon: string | null
                    isShown: boolean | null
                    Name: string
                    SkillID: string
                    Stars: number | null
                }
                Insert: {
                    Category?: string | null
                    Icon?: string | null
                    isShown?: boolean | null
                    Name: string
                    SkillID?: string
                    Stars?: number | null
                }
                Update: {
                    Category?: string | null
                    Icon?: string | null
                    isShown?: boolean | null
                    Name?: string
                    SkillID?: string
                    Stars?: number | null
                }
                Relationships: []
            }
            Social: {
                Row: {
                    isShown: boolean | null
                    Profile: string | null
                    Site: string | null
                    SocialID: string
                    URL: string | null
                    Username: string | null
                }
                Insert: {
                    isShown?: boolean | null
                    Profile?: string | null
                    Site?: string | null
                    SocialID?: string
                    URL?: string | null
                    Username?: string | null
                }
                Update: {
                    isShown?: boolean | null
                    Profile?: string | null
                    Site?: string | null
                    SocialID?: string
                    URL?: string | null
                    Username?: string | null
                }
                Relationships: []
            }
            Tickets: {
                Row: {
                    Create: string
                    Description: string | null
                    Email: string | null
                    isOpen: boolean | null
                    TicketID: string
                    Title: string | null
                    Update: string | null
                }
                Insert: {
                    Create?: string
                    Description?: string | null
                    Email?: string | null
                    isOpen?: boolean | null
                    TicketID?: string
                    Title?: string | null
                    Update?: string | null
                }
                Update: {
                    Create?: string
                    Description?: string | null
                    Email?: string | null
                    isOpen?: boolean | null
                    TicketID?: string
                    Title?: string | null
                    Update?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "Tickets_Email_fkey"
                        columns: ["Email"]
                        isOneToOne: false
                        referencedRelation: "EmailBlacklist"
                        referencedColumns: ["Email"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
