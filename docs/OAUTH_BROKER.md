# OAuth Broker Configuration for Immich

This portfolio site now acts as an OAuth 2.0 provider (broker) for your Immich selfhosted instance.

## Architecture

The OAuth implementation follows the standard OAuth 2.0 Authorization Code Flow:

```
┌─────────┐                                  ┌──────────────┐
│ Immich  │◄────1. Authorization Request────│  Portfolio   │
│         │                                  │  (OAuth)     │
└─────────┘                                  └──────────────┘
     │                                              │
     │  2. User Login & Consent                    │
     │◄────────────────────────────────────────────┤
     │                                              │
     │  3. Authorization Code                      │
     ├─────────────────────────────────────────────►
     │                                              │
     │  4. Token Exchange                          │
     ├─────────────────────────────────────────────►
     │                                              │
     │  5. Access Token                            │
     │◄─────────────────────────────────────────────┤
     │                                              │
     │  6. User Info Request                       │
     ├─────────────────────────────────────────────►
     │                                              │
     │  7. User Profile                            │
     │◄─────────────────────────────────────────────┤
```

## Endpoints

### 1. **Authorization Endpoint**
- **URL**: `https://meetbhingradiya.com/api/oauth/authorize`
- **Method**: `GET`
- **Parameters**:
  - `client_id`: `immich` (required)
  - `redirect_uri`: One of the allowed URIs (required)
  - `response_type`: `code` (required)
  - `state`: Random string for CSRF protection (recommended)
  - `scope`: `openid profile email` (optional)

### 2. **Token Endpoint**
- **URL**: `https://meetbhingradiya.com/api/oauth/token`
- **Method**: `POST`
- **Content-Type**: `application/x-www-form-urlencoded` or `application/json`
- **Authentication**: Basic Auth or client credentials in body
- **Parameters**:
  - `grant_type`: `authorization_code` (required)
  - `code`: Authorization code from step 1 (required)
  - `redirect_uri`: Same as in authorization request (required)
  - `client_id`: `immich` (required)
  - `client_secret`: Your secret key (required)

### 3. **UserInfo Endpoint**
- **URL**: `https://meetbhingradiya.com/api/oauth/userinfo`
- **Method**: `GET`
- **Authentication**: Bearer token in Authorization header
- **Returns**: User profile information

### 4. **Discovery Endpoint**
- **URL**: `https://meetbhingradiya.com/api/oauth/.well-known/openid-configuration`
- **Method**: `GET`
- **Returns**: OpenID Connect discovery metadata

## Immich Configuration

### Step 1: Add OAuth Client in Immich

In your Immich instance, configure the OAuth provider:

```env
# Immich .env file
OAUTH_ENABLED=true
OAUTH_ISSUER_URL=https://meetbhingradiya.com/api/oauth
OAUTH_CLIENT_ID=immich
OAUTH_CLIENT_SECRET=immich-secret-key-change-this-in-production
OAUTH_SCOPE=openid profile email
OAUTH_BUTTON_TEXT=Login with MeetBhingradiya
OAUTH_AUTO_REGISTER=true
OAUTH_AUTO_LAUNCH=false
```

### Step 2: Set Redirect URIs

The following redirect URIs are pre-configured and allowed:
- `https://photos.meetbhingradiya.shop/auth/login`
- `https://photos.meetbhingradiya.shop/user-settings`
- `https://photos.meetbhingradiya.shop/api/oauth/mobile-redirect`

### Step 3: Update Portfolio Environment Variables

Add to your `.env` file:

```env
IMMICH_OAUTH_SECRET=immich-secret-key-change-this-in-production
JWT_SECRET=your-jwt-secret-key-change-this
NEXTAUTH_URL=https://meetbhingradiya.com
```

**Important**: Change the default secrets in production!

## Security Features

1. **Authorization Code Expiry**: Codes expire after 10 minutes
2. **Single-Use Codes**: Each authorization code can only be used once
3. **Redirect URI Validation**: Only whitelisted URIs are allowed
4. **Client Authentication**: Client secret required for token exchange
5. **JWT Token Signing**: Access tokens are signed with HS256
6. **Auto Cleanup**: Expired codes are automatically removed

## Token Lifetime

- **Authorization Code**: 10 minutes
- **Access Token**: 1 hour

## Allowed Redirect URIs

To add more redirect URIs, update the `ALLOWED_REDIRECT_URIS` array in:
`src/app/api/oauth/authorize/route.ts`

```typescript
const ALLOWED_REDIRECT_URIS = [
    "https://photos.meetbhingradiya.shop/auth/login",
    "https://photos.meetbhingradiya.shop/user-settings",
    "https://photos.meetbhingradiya.shop/api/oauth/mobile-redirect",
    // Add more URIs here
];
```

## User Data Provided

When Immich requests user information, the following fields are returned:

```json
{
  "sub": "user-unique-id",
  "email": "user@example.com",
  "email_verified": true,
  "name": "User Display Name",
  "preferred_username": "username",
  "iss": "https://meetbhingradiya.com",
  "aud": "immich"
}
```

## Testing the OAuth Flow

### 1. Test Authorization Endpoint

```bash
# Visit in browser (while logged into your portfolio)
https://meetbhingradiya.com/api/oauth/authorize?client_id=immich&redirect_uri=https://photos.meetbhingradiya.shop/auth/login&response_type=code&state=random-string
```

### 2. Test Token Exchange

```bash
curl -X POST https://meetbhingradiya.com/api/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -u "immich:immich-secret-key-change-this-in-production" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE" \
  -d "redirect_uri=https://photos.meetbhingradiya.shop/auth/login"
```

### 3. Test UserInfo Endpoint

```bash
curl https://meetbhingradiya.com/api/oauth/userinfo \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Production Considerations

### 1. **Use Redis for Authorization Codes**

The current implementation uses in-memory storage. For production, use Redis:

```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL
});

// Store authorization code
await redis.setEx(`auth_code:${code}`, 600, JSON.stringify(authData));

// Retrieve authorization code
const authData = await redis.get(`auth_code:${code}`);
```

### 2. **Generate Strong Secrets**

```bash
# Generate client secret
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 64
```

### 3. **Enable HTTPS Only**

Ensure all OAuth endpoints are only accessible via HTTPS.

### 4. **Rate Limiting**

Add rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### 5. **Logging & Monitoring**

Monitor OAuth flows for suspicious activity:
- Failed authorization attempts
- Expired/invalid codes
- Token exchange failures

## Troubleshooting

### Issue: "Invalid redirect_uri"
- Ensure the redirect URI in Immich exactly matches one in `ALLOWED_REDIRECT_URIS`
- Check for trailing slashes or http vs https mismatches

### Issue: "Invalid client credentials"
- Verify `OAUTH_CLIENT_ID` is exactly `immich`
- Verify `OAUTH_CLIENT_SECRET` matches `IMMICH_OAUTH_SECRET` in portfolio

### Issue: "Authorization code expired"
- Codes expire after 10 minutes
- Complete the OAuth flow within this timeframe

### Issue: "User not found"
- User must be logged into portfolio before authorizing Immich
- Ensure user account is not deleted or locked

## Support

For issues or questions:
- Check logs in portfolio: Look for `OAuth` prefixed log messages
- Check Immich logs: Look for OAuth-related errors
- Verify environment variables are set correctly

## License

This OAuth implementation is part of the Meet Bhingradiya Portfolio project.
