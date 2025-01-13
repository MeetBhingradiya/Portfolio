# Account Model

## Bacis Account Info
- AccountID (Unique)
- Username (Unique)
- FName
- LName

## KYC Info
- Emails
- Phone
- DOB
- Gender

## Authentication Info
- Hash : A Encrypted HashData of the Password
- Salt : A Key to Decode HashData of the Password
- MFAOrder ["Email", "Phone", "Passkey", "Authenticator"] 
- isSosialLinked
- Sosials ["Google", "Github", "Apple"]
- isMFA [Boolean]
- isSuspiciousActivity [Boolean]
- isDeactivated [Boolean]
- isDeleted [Boolean]

## Profiles
- ProfilesID

## PassKeys
- PasskeysIDs

## Authenticator
- Google Authenticator App

## Global Admin Control Settings
- Autoban Sosial [Boolean]
- Autoban Sosials ["Apple"]
- New Account [Boolean]
- Email Transfer [Boolean]
- Linked Max Profiles [Number]
- Linked Max Emails [Number]
- Linked Min Emails [Number]
- Linked Max Phone [Number]
- Linked Min Phone [Number]