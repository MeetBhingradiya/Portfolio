# Superbase Schema for Portfolio Website & Single Person Resume or CV Generator

## Site Settings
| Column      | Type      | Default             | Constraints |
| ----------- | --------- | ------------------- | ----------- |
| `SettingID` | `uuid`    | `gen_random_uuid()` | Primary     |
| `Key`       | `varchar` | NULL                | Unique      |
| `Value`     | `varchar` | NULL                |             |

```JSON
{
    "Hero": true,
    "About": true,
    "Skills": {
        "enabled": true,
        "limit": 5,
        "shuffle": true,
        "category": true,
        "stars": true,
        "categorylimit": 5
    },
    "Experience": {
        "enabled": true,
        "limit": 5,
        "shuffle": true
    },
    "Projects": {
        "enabled": true,
        "limit": 5,
        "shuffle": true,
        "linksShow": true
    },
    "Blogs": {
        "enabled": true,
        "limit": 5,
        "shuffle": true,
        "SEO": true
    },
    "Social": {
        "enabled": true,
        "limit": 5,
        "shuffle": true
    },
    "Tickets": {
        "enabled": true,
        "messageLimitbeforeReply": 3,
        "userMaxCreatelimit": 1
    },
    "Contact": {
        "enabled": true,
        "location": false,
        "mobile": false,
        "email": true,
        "data": {
            "address": "",
            "phone": "",
            "email": ""
        }
    },
    "ResumeDownload": false,
    "CVDonwload": false,
    
}
```

## Certifications
| Column            | Type      | Default                 | Constraints |
| ----------------- | --------- | ----------------------- | ----------- |
| `CertificationID` | `uuid`    | `gen_random_uuid()`     | Primary     |
| `Name`            | `varchar` | NULL                    |             |
| `Authority`       | `varchar` | NULL                    |             |
| `URL`             | `varchar` | NULL                    |             |
| `Thumbnail`       | `varchar` | NULL                    |             |
| `isShown`         | `boolean` | `false`                 |             |

## EmailBlacklist
| Column          | Type      | Default                 | Constraints |
| --------------- | --------- | ----------------------- | ----------- |
| `EmailID`       | `uuid`    | `gen_random_uuid()`     | Primary     |
| `Username`      | `varchar` | NULL                    |             |
| `Email`         | `varchar` | NULL                    | Unique      |
| `Reason`        | `varchar` | NULL                    |             |
| `isBlacklisted` | `boolean` | `true`                  |             |

## Skills
| Column     | Type      | Default                 | Constraints |
| ---------- | --------- | ----------------------- | ----------- |
| `SkillID`  | `uuid`    | `gen_random_uuid()`     | Primary     |
| `Name`     | `varchar` | NULL                    |             |
| `Category` | `varchar` | NULL                    |             |
| `Stars`    | `int`     | `0`                     |             |
| `Icon`     | `varchar` | NULL                    |             |
| `isShown`  | `boolean` | `false`                 |             |

## Experiences
| Column         | Type      | Default                 | Constraints                    |
| -------------- | --------- | ----------------------- | ------------------------------ |
| `ExperienceID` | `uuid`    | `gen_random_uuid()`     | Primary                        |
| `Company`      | `varchar` | NULL                    |                                |
| `Title`        | `varchar` | NULL                    |                                |
| `Description`  | `varchar` | NULL                    |                                |
| `Start`        | `date`    | `now()`                 |                                |
| `End`          | `date`    | `now()`                 |                                |
| `isCurrent`    | `boolean` | `false`                 |                                |
| `Skills`       | `uuid[]`  | NULL                    | REFERENCES Skills(SkillID)     |
| `Projects`     | `uuid[]`  | NULL                    | REFERENCES Projects(ProjectID) |
| `isShown`      | `boolean` | `false`                 |                                |

## Projects
| Column        | Type      | Default                 | Constraints |
| ------------- | --------- | ----------------------- | ----------- |
| `ProjectID`   | `uuid`    | `gen_random_uuid()`     | Primary     |
| `Name`        | `varchar` | NULL                    |             |
| `Description` | `varchar` | NULL                    |             |
| `Category`    | `varchar` | NULL                    |             |
| `URL`         | `varchar` | NULL                    |             |
| `Thumbnail`   | `varchar` | NULL                    |             |
| `Images`      | `Json`    | NULL                    |             |
| `Tags`        | `Json`    | NULL                    |             |
| `isShown`     | `boolean` | `false`                 |             |

## Social
| Column        | Type      | Default                 | Constraints |
| ------------- | --------- | ----------------------- | ----------- |
| `SocialID`    | `uuid`    | `gen_random_uuid()`     | Primary     |
| `Site`        | `varchar` | NULL                    |             |
| `Profile`     | `varchar` | NULL                    |             |
| `URL`         | `varchar` | NULL                    |             |
| `Username`    | `varchar` | NULL                    |             |
| `isShown`     | `boolean` | `false`                 |             |

## Tickets
| Column        | Type          | Default                            | Constraints                      |
| ------------- | ------------- | ---------------------------------- | -------------------------------- |
| `TicketID`    | `uuid`        | `gen_random_uuid()`                | Primary                          |
| `isOpen`      | `boolean`     | `true`                             |                                  |
| `Email`       | `varchar`     | NULL                               | REFERENCES EmailBlacklist(Email) |
| `Title`       | `varchar`     | NULL                               |                                  |
| `Description` | `varchar`     | NULL                               |                                  |
| `Update`      | `timestamptz` | `(now() AT TIME ZONE 'utc'::text)` |                                  |
| `Create`      | `timestamptz` | `(now() AT TIME ZONE 'utc'::text)` |                                  |

## Messages
| Column            | Type          | Default                            | Constraints                      |
| ----------------- | ------------- | ---------------------------------- | -------------------------------- |
| `MessageID`       | `uuid`        | `gen_random_uuid()`                | Primary                          |
| `TicketID`        | `uuid`        | NULL                               | References Tickets(TicketID)     |
| `EncryptedContent`| `varchar`     | NULL                               |                                  |
| `IsSystemMessage` | `boolean`     | `false`                            |                                  |
| `FileURL`         | `varchar`     | NULL                               |                                  |
| `FileType`        | `varchar`     | NULL                               |                                  |
| `SentAt`          | `timestamptz` | `(now() AT TIME ZONE 'utc'::text)` |                                  |
| `UpdatedAt`       | `timestamptz` | `(now() AT TIME ZONE 'utc'::text)` |                                  |
| `Email`           | `varchar`     | NULL                               | REFERENCES EmailBlacklist(Email) |
| `ReadAt`          | `timestamptz` | `(now() AT TIME ZONE 'utc'::text)` |                                  |
| `DecryptionKey`   | `varchar`     | NULL                               |                                  |

## Blogs
| Column        | Type          | Default                            | Constraints                         |
| ------------- | ------------- | ---------------------------------- | ----------------------------------- |
| `BlogID`      | `uuid`        | `gen_random_uuid()`                | Primary                             |
| `Author`      | `varchar`     | NULL                               | REFERENCES EmailBlacklist(Username) |
| `BannerImage` | `varchar`     | NULL                               |                                     |
| `Title`       | `varchar`     | NULL                               |                                     |
| `Tags`        | `Json`        | JSON                               |                                     |
| `Description` | `varchar`     | NULL                               |                                     |
| `Content`     | `Text`        | NULL                               |                                     |
| `Visiblity`   | `varchar`     | `Private`                          |                                     |
| `PublishDate` | `timestamptz` | `(now() AT TIME ZONE 'utc'::text)` |                                     |
| `isPublished` | `boolean`     | `false`                            |                                     |
| `UpdateDate`  | `timestamptz` | `(now() AT TIME ZONE 'utc'::text)` |                                     |
| `CreateDate`  | `timestamptz` | `(now() AT TIME ZONE 'utc'::text)` |                                     |