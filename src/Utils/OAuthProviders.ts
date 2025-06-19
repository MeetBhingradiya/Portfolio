import { Config } from "@Config";

export interface OAuthProvider {
	clientId: string;
	clientSecret: string;
	redirectUri: string;
	scope: string;
	authUrl: string;
	tokenUrl: string;
	userInfoUrl: string;
	name: string;
}

export function getOAuthProvider(
	provider: string,
	host: string
): OAuthProvider | null {
	const baseRedirectUri = `https://${host}/api/auth/callback/${provider}`;

	switch (provider.toLowerCase()) {
		case "google":
			return {
				clientId: Config.Env.GOOGLE_CLIENT_ID || "",
				clientSecret: Config.Env.GOOGLE_CLIENT_SECRET || "",
				redirectUri: baseRedirectUri,
				scope: "openid email profile",
				authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
				tokenUrl: "https://oauth2.googleapis.com/token",
				userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
				name: "Google",
			};

		case "github":
			return {
				clientId: Config.Env.GITHUB_CLIENT_ID || "",
				clientSecret: Config.Env.GITHUB_CLIENT_SECRET || "",
				redirectUri: baseRedirectUri,
				scope: "user:email",
				authUrl: "https://github.com/login/oauth/authorize",
				tokenUrl: "https://github.com/login/oauth/access_token",
				userInfoUrl: "https://api.github.com/user",
				name: "GitHub",
			};

		case "microsoft":
			return {
				clientId: Config.Env.MICROSOFT_CLIENT_ID || "",
				clientSecret: Config.Env.MICROSOFT_CLIENT_SECRET || "",
				redirectUri: baseRedirectUri,
				scope: "openid email profile",
				authUrl:
					"https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
				tokenUrl:
					"https://login.microsoftonline.com/common/oauth2/v2.0/token",
				userInfoUrl: "https://graph.microsoft.com/v1.0/me",
				name: "Microsoft",
			};

		case "linkedin":
			return {
				clientId: Config.Env.LINKEDIN_CLIENT_ID || "",
				clientSecret: Config.Env.LINKEDIN_CLIENT_SECRET || "",
				redirectUri: baseRedirectUri,
				scope: "r_liteprofile r_emailaddress",
				authUrl: "https://www.linkedin.com/oauth/v2/authorization",
				tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
				userInfoUrl: "https://api.linkedin.com/v2/people/~",
				name: "LinkedIn",
			};

		case "facebook":
			return {
				clientId: Config.Env.FACEBOOK_CLIENT_ID || "",
				clientSecret: Config.Env.FACEBOOK_CLIENT_SECRET || "",
				redirectUri: baseRedirectUri,
				scope: "email",
				authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
				tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
				userInfoUrl:
					"https://graph.facebook.com/me?fields=id,name,email",
				name: "Facebook",
			};

		case "instagram":
			return {
				clientId: Config.Env.INSTAGRAM_CLIENT_ID || "",
				clientSecret: Config.Env.INSTAGRAM_CLIENT_SECRET || "",
				redirectUri: baseRedirectUri,
				scope: "user_profile,user_media",
				authUrl: "https://api.instagram.com/oauth/authorize",
				tokenUrl: "https://api.instagram.com/oauth/access_token",
				userInfoUrl:
					"https://graph.instagram.com/me?fields=id,username",
				name: "Instagram",
			};

		case "discord":
			return {
				clientId: Config.Env.DISCORD_CLIENT_ID || "",
				clientSecret: Config.Env.DISCORD_CLIENT_SECRET || "",
				redirectUri: baseRedirectUri,
				scope: "identify email",
				authUrl: "https://discord.com/api/oauth2/authorize",
				tokenUrl: "https://discord.com/api/oauth2/token",
				userInfoUrl: "https://discord.com/api/users/@me",
				name: "Discord",
			};

		default:
			return null;
	}
}

export function generateState(): string {
	return (
		Math.random().toString(36).substring(2, 15) +
		Math.random().toString(36).substring(2, 15)
	);
}

export function buildAuthUrl(provider: OAuthProvider, state: string): string {
	const params = new URLSearchParams({
		client_id: provider.clientId,
		redirect_uri: provider.redirectUri,
		scope: provider.scope,
		response_type: "code",
		state: state,
		...(provider.name === "Microsoft" && { response_mode: "query" }),
		...(provider.name === "LinkedIn" && { response_type: "code" }),
		...(provider.name === "Facebook" && { response_type: "code" }),
		...(provider.name === "Instagram" && { response_type: "code" }),
	});

	return `${provider.authUrl}?${params.toString()}`;
}

export async function exchangeCodeForToken(
	provider: OAuthProvider,
	code: string
): Promise<{
	access_token: string;
	refresh_token?: string;
	expires_in?: number;
} | null> {
	try {
		const body = new URLSearchParams({
			client_id: provider.clientId,
			client_secret: provider.clientSecret,
			code: code,
			redirect_uri: provider.redirectUri,
			grant_type: "authorization_code",
		});

		const response = await fetch(provider.tokenUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body: body.toString(),
		});

		if (!response.ok) {
			console.error(
				`Token exchange failed for ${provider.name}:`,
				await response.text()
			);
			return null;
		}

		return await response.json();
	} catch (error) {
		console.error(
			`Error exchanging code for token (${provider.name}):`,
			error
		);
		return null;
	}
}

export async function getUserInfo(
	provider: OAuthProvider,
	accessToken: string
): Promise<any | null> {
	try {
		const headers: Record<string, string> = {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/json",
		};

		// Special handling for different providers
		if (provider.name === "GitHub") {
			headers["User-Agent"] = "Meet-Bhingradiya-App";
		}

		const response = await fetch(provider.userInfoUrl, {
			headers,
		});

		if (!response.ok) {
			console.error(
				`User info fetch failed for ${provider.name}:`,
				await response.text()
			);
			return null;
		}

		const userInfo = await response.json();

		// For GitHub, we need to fetch email separately if not public
		if (provider.name === "GitHub" && !userInfo.email) {
			const emailResponse = await fetch(
				"https://api.github.com/user/emails",
				{
					headers,
				}
			);

			if (emailResponse.ok) {
				const emails = await emailResponse.json();
				const primaryEmail = emails.find(
					(email: any) => email.primary && email.verified
				);
				if (primaryEmail) {
					userInfo.email = primaryEmail.email;
				}
			}
		}

		return userInfo;
	} catch (error) {
		console.error(`Error fetching user info (${provider.name}):`, error);
		return null;
	}
}

export function normalizeUserInfo(
	provider: string,
	userInfo: any
): {
	providerId: string;
	email?: string;
	username?: string;
	name?: string;
} {
	switch (provider.toLowerCase()) {
		case "google":
			return {
				providerId: userInfo.id,
				email: userInfo.email,
				username: userInfo.email?.split("@")[0],
				name: userInfo.name,
			};

		case "github":
			return {
				providerId: userInfo.id.toString(),
				email: userInfo.email,
				username: userInfo.login,
				name: userInfo.name || userInfo.login,
			};

		case "microsoft":
			return {
				providerId: userInfo.id,
				email: userInfo.mail || userInfo.userPrincipalName,
				username: userInfo.userPrincipalName?.split("@")[0],
				name: userInfo.displayName,
			};

		case "linkedin":
			return {
				providerId: userInfo.id,
				email: userInfo.emailAddress?.["handle~"]?.emailAddress,
				username:
					userInfo.localizedFirstName + userInfo.localizedLastName,
				name: `${userInfo.localizedFirstName} ${userInfo.localizedLastName}`,
			};

		case "facebook":
			return {
				providerId: userInfo.id,
				email: userInfo.email,
				username: userInfo.email?.split("@")[0],
				name: userInfo.name,
			};

		case "instagram":
			return {
				providerId: userInfo.id,
				username: userInfo.username,
				name: userInfo.username,
			};

		case "discord":
			return {
				providerId: userInfo.id,
				email: userInfo.email,
				username: userInfo.username,
				name: userInfo.global_name || userInfo.username,
			};

		default:
			return {
				providerId: userInfo.id?.toString() || "unknown",
				email: userInfo.email,
				username: userInfo.username || userInfo.login,
				name: userInfo.name || userInfo.display_name,
			};
	}
}
