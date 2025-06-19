import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@Utils/dbConnect";
import { Users_Model } from "@Models/Users";
import {
	getOAuthProvider,
	exchangeCodeForToken,
	getUserInfo,
	normalizeUserInfo,
} from "@Utils/OAuthProviders";
import { log } from "@Utils";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ provider: string }> }
) {
	try {
		const { provider } = await params;
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		// Handle OAuth errors
		if (error) {
			log(`OAuth error for provider ${provider}: ${error}`);
			return NextResponse.redirect(
				new URL(
					`/dashboard?error=oauth_${error}&provider=${provider}`,
					request.url
				)
			);
		}

		if (!code || !state) {
			log(`Missing code or state parameter for provider ${provider}`);
			return NextResponse.redirect(
				new URL(
					`/dashboard?error=oauth_missing_params&provider=${provider}`,
					request.url
				)
			);
		}

		// Verify state parameter
		const storedState = request.cookies.get(
			`oauth_state_${provider}`
		)?.value;
		const userID = request.cookies.get(`oauth_user_${provider}`)?.value;

		if (!storedState || storedState !== state) {
			log(`Invalid state parameter for provider ${provider}`);
			return NextResponse.redirect(
				new URL(
					`/dashboard?error=oauth_invalid_state&provider=${provider}`,
					request.url
				)
			);
		}

		if (!userID) {
			log(`Missing user ID in OAuth callback for provider ${provider}`);
			return NextResponse.redirect(
				new URL(
					`/dashboard?error=oauth_missing_user&provider=${provider}`,
					request.url
				)
			);
		}

		// Get host from request
		const host = request.headers.get("host") || "localhost:3000";

		// Get OAuth provider configuration
		const oauthProvider = getOAuthProvider(provider, host);
		if (!oauthProvider) {
			log(`Unsupported OAuth provider: ${provider}`);
			return NextResponse.redirect(
				new URL(
					`/dashboard?error=oauth_unsupported&provider=${provider}`,
					request.url
				)
			);
		}

		// Exchange authorization code for access token
		const tokenData = await exchangeCodeForToken(oauthProvider, code);
		if (!tokenData) {
			log(`Failed to exchange code for token for provider ${provider}`);
			return NextResponse.redirect(
				new URL(
					`/dashboard?error=oauth_token_exchange&provider=${provider}`,
					request.url
				)
			);
		}

		// Get user information from provider
		const userInfo = await getUserInfo(
			oauthProvider,
			tokenData.access_token
		);
		if (!userInfo) {
			log(`Failed to get user info for provider ${provider}`);
			return NextResponse.redirect(
				new URL(
					`/dashboard?error=oauth_user_info&provider=${provider}`,
					request.url
				)
			);
		}

		// Normalize user information
		const normalizedInfo = normalizeUserInfo(provider, userInfo);

		// Connect to database
		await dbConnect();

		// Find the user
		const user = await Users_Model.findOne({ UserID: userID });
		if (!user) {
			log(`User not found during OAuth callback: ${userID}`);
			return NextResponse.redirect(
				new URL(
					`/dashboard?error=user_not_found&provider=${provider}`,
					request.url
				)
			);
		}

		// Check if this provider is already connected
		const existingConnection = user.thirdPartyConnections?.find(
			(conn: any) => conn.provider === provider
		);

		if (existingConnection) {
			// Update existing connection
			existingConnection.accessToken = tokenData.access_token;
			existingConnection.refreshToken = tokenData.refresh_token;
			existingConnection.lastUsed = new Date();
			existingConnection.email = normalizedInfo.email;
			existingConnection.username = normalizedInfo.username;
		} else {
			// Add new connection
			if (!user.thirdPartyConnections) {
				user.thirdPartyConnections = [];
			}

			user.thirdPartyConnections.push({
				provider: provider as any,
				providerId: normalizedInfo.providerId,
				email: normalizedInfo.email,
				username: normalizedInfo.username,
				accessToken: tokenData.access_token,
				refreshToken: tokenData.refresh_token,
				connectedAt: new Date(),
				lastUsed: new Date(),
			});
		}

		// Save the updated user
		await user.save();

		// Clear OAuth cookies
		const response = NextResponse.redirect(
			new URL(
				`/dashboard?success=oauth_connected&provider=${provider}`,
				request.url
			)
		);

		response.cookies.delete(`oauth_state_${provider}`);
		response.cookies.delete(`oauth_user_${provider}`);

		log(
			`OAuth connection successful for user ${userID} with provider ${provider}`
		);
		return response;
	} catch (error: any) {
		log(`OAuth callback error: ${error?.message}`);
		const { provider } = await params;
		return NextResponse.redirect(
			new URL(
				`/dashboard?error=oauth_internal&provider=${provider}`,
				request.url
			)
		);
	}
}
