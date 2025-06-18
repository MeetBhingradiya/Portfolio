import axios, {
	AxiosInstance,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from "axios";
import { RedirectProtocolExecuter, getCSRFToken } from "@Utils";
import { handle401Error } from "@Utils/SessionManager";

const Axios: AxiosInstance = axios.create({
	timeout: 10000,
});

let csrfToken: any = null;
let csrfRetryAttempted = false;
let CSRF_UnderProgress = false;

Axios.interceptors.request.use(
	async (config: InternalAxiosRequestConfig<any>) => {
		if (!csrfToken) {
			if (CSRF_UnderProgress) {
				return Promise.reject({
					message: "CSRF token retrieval in progress",
				});
			}
			CSRF_UnderProgress = true;
			csrfToken = await getCSRFToken().catch(() => null);
			if (csrfToken?.Status === 1) {
				localStorage.setItem("trace", JSON.stringify(csrfToken));
			} else {
				RedirectProtocolExecuter(csrfToken?.StatusCode);
				csrfToken = null;
				return Promise.reject({
					message: "CSRF token retrieval failed",
				});
			}
			CSRF_UnderProgress = false;
		}

		config.headers["x-csrf"] = csrfToken.Data.token;

        if (!config.headers["Authorization"]) {
            config.headers["Authorization"] = `Bearer ${localStorage.getItem("auth-token")}`;
        }
		config.withCredentials = true;
		return config;
	},
	(error: any) => Promise.reject(error)
);

Axios.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: any) => {
		const statusCode = error.response?.data?.StatusCode;
		const status = error.response?.status;

		if (status === 429) {
			console.warn("Rate limit exceeded:", error.response?.data);
			return Promise.reject(error);
		}

		if (statusCode === "INVALID_AUTHORIZATION") {
			localStorage.removeItem("trace");
			if (!csrfRetryAttempted) {
				csrfRetryAttempted = true;
				csrfToken = null;

				try {
					csrfToken = await getCSRFToken().catch(() => null);
					if (csrfToken?.Status === 1) {
						localStorage.setItem(
							"trace",
							JSON.stringify(csrfToken)
						);
						csrfRetryAttempted = false;

						const newAuthToken = localStorage.getItem("auth-token");
						if (newAuthToken) {
							return Axios.request(error.config);
						}
					}
				} catch (tokenError) {
					console.error("Failed to refresh CSRF token:", tokenError);
				}
				csrfRetryAttempted = false;
			}

			return Promise.reject(error);
		}

		if (statusCode) {
			RedirectProtocolExecuter(statusCode);
		}

		return Promise.reject(error);
	}
);

export { Axios };
