# Passkey Authenticator Blocklist & Icon Support

## Overview

The User model now implements a **blocklist** approach instead of a whitelist for passkey authenticators. This allows us to block specific password managers (like 1Password, which we hate because Apple 😂) while allowing most platform authenticators.

## What Changed

### 1. **Blocklist Implementation**

Instead of only allowing specific authenticators, we now **block** password managers:

- ✅ **Blocked**: 1Password, Bitwarden, LastPass, Dashlane, Keeper, NordPass/Enpass
- ✅ **Allowed**: Windows Hello, Face ID, Touch ID, Samsung Pass, and most platform authenticators

### 2. **Authenticator Metadata & Icons**

Each passkey now stores:
- `authenticatorName` - Human-readable name (e.g., "Windows Hello", "Samsung Pass")
- `authenticatorIcon` - Base64-encoded SVG icon as data URI for UI display

### 3. **AAGUID Database**

Added a comprehensive database from [passkey-authenticator-aaguids](https://github.com/agektmr/passkey-authenticator-aaguids) with:
- Authenticator names
- Light/dark mode icons
- Support for 100+ authenticators

## Usage Examples

### Registering a Passkey

```typescript
try {
    await user.addPasskey({
        credentialId: 'base64-encoded-id',
        publicKey: 'base64-encoded-public-key',
        deviceName: 'My Windows PC',
        deviceType: 'platform',
        transports: ['internal'],
        aaguid: '08987058-cadc-4b81-b6e1-30de50dcbe96' // Windows Hello
    });
    console.log('Passkey registered successfully!');
} catch (error) {
    // Error: "1Password is not allowed. Please use platform authenticators..."
    console.error(error.message);
}
```

### Checking if Authenticator is Blocked

```typescript
const aaguid = 'b84e4048-15dc-4dd0-8640-f4f60813c8af'; // 1Password

if (Users_Model.isAuthenticatorBlocked(aaguid)) {
    console.log('This authenticator is blocked!');
}
```

### Getting Authenticator Metadata

```typescript
const metadata = Users_Model.getAuthenticatorMetadata(aaguid);
console.log(metadata);
// {
//   name: 'Windows Hello',
//   icon_dark: 'data:image/svg+xml;base64,...',
//   icon_light: 'data:image/svg+xml;base64,...'
// }
```

### Displaying Passkey Icons in UI

```tsx
import Users_Model from '@/Models/Users';

function PasskeyList({ user }) {
    return (
        <div>
            {user.passkeys.map(passkey => (
                <div key={passkey.credentialId}>
                    {passkey.authenticatorIcon && (
                        <img 
                            src={passkey.authenticatorIcon} 
                            alt={passkey.authenticatorName}
                            width={24}
                            height={24}
                        />
                    )}
                    <span>{passkey.authenticatorName || 'Unknown Device'}</span>
                    <span>{passkey.deviceName}</span>
                </div>
            ))}
        </div>
    );
}
```

## API Reference

### Static Methods

#### `isAuthenticatorBlocked(aaguid: string): boolean`

Checks if an authenticator AAGUID is in the blocked list.

**Parameters:**
- `aaguid` - Authenticator Attestation GUID

**Returns:** `true` if blocked (password manager), `false` if allowed

#### `getAuthenticatorMetadata(aaguid: string): object`

Gets metadata including name and icons for an authenticator.

**Parameters:**
- `aaguid` - Authenticator Attestation GUID

**Returns:** `{ name: string; icon_dark?: string; icon_light?: string }`

#### `getAuthenticatorName(aaguid: string): string`

Gets the friendly name of an authenticator.

**Parameters:**
- `aaguid` - Authenticator Attestation GUID

**Returns:** Human-readable authenticator name

## Blocked Authenticators

| Authenticator | AAGUIDs | Reason |
|--------------|---------|---------|
| 1Password | `b84e4048-15dc-4dd0-8640-f4f60813c8af` | Password manager (we hate Apple 😂) |
| Bitwarden | `adce0002-35bc-c60a-648b-0b25f1f05503` | Third-party password manager |
| LastPass | `00000000-0000-0000-0000-000000000001` | Third-party password manager |
| Dashlane | `00000000-0000-0000-0000-000000000002` | Third-party password manager |
| Keeper | `0ea242b4-43c4-4a1b-8b17-dd6d0b6baec6` | Third-party password manager |
| Enpass | `f3809540-7f14-49c1-a8b3-8f813b225541` | Third-party password manager |

## Supported Platform Authenticators

All platform authenticators are supported by default, including:
- ✅ Windows Hello (all variants)
- ✅ Apple Face ID
- ✅ Apple Touch ID
- ✅ Samsung Pass
- ✅ Google Password Manager (platform-bound)
- ✅ Android Fingerprint
- ✅ YubiKey (hardware security key)
- ✅ And many more...

## Database Schema Changes

### Passkeys Collection

```typescript
interface IPasskey {
    credentialId: string;
    publicKey: string;
    counter: number;
    deviceName?: string;
    deviceType: "platform" | "cross-platform";
    transports?: ("usb" | "nfc" | "ble" | "internal" | "hybrid")[];
    createdAt: Date;
    lastUsedAt?: Date;
    aaguid: string; // Required
    authenticatorName?: string; // NEW: e.g., "Windows Hello"
    authenticatorIcon?: string; // NEW: Base64 data URI
    isActive: boolean;
}
```

## Migration Notes

### For Existing Passkeys

Existing passkeys will NOT have `authenticatorName` or `authenticatorIcon` fields. You can run a migration script to populate these:

```typescript
import Users_Model from '@/Models/Users';

async function migratePasskeyMetadata() {
    const users = await Users_Model.find({ 'passkeys.0': { $exists: true } });
    
    for (const user of users) {
        let updated = false;
        
        for (const passkey of user.passkeys) {
            if (!passkey.authenticatorName && passkey.aaguid) {
                const metadata = Users_Model.getAuthenticatorMetadata(passkey.aaguid);
                passkey.authenticatorName = metadata.name;
                passkey.authenticatorIcon = metadata.icon_dark || metadata.icon_light;
                updated = true;
            }
        }
        
        if (updated) {
            await user.save();
            console.log(`Updated passkeys for user: ${user.email}`);
        }
    }
}
```

## Error Messages

When a blocked authenticator attempts to register:

```
1Password is not allowed. Please use platform authenticators like Windows Hello, Face ID, Touch ID, or Samsung Pass instead of password managers.
```

## Benefits

1. **Better UX**: Users can see icons for their saved passkeys
2. **Security**: Blocks third-party password managers that might be compromised
3. **Flexibility**: Easy to add/remove blocked authenticators
4. **Transparency**: Clear error messages explain why authenticators are blocked
5. **Scalability**: Supports 100+ authenticators with metadata

## Related Resources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [FIDO Alliance](https://fidoalliance.org/)
- [Passkey Authenticator AAGUIDs Database](https://github.com/agektmr/passkey-authenticator-aaguids)

---

**Last Updated**: November 27, 2025  
**Version**: 2.0.0
