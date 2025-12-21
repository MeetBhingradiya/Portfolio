import axios, {
    AxiosInstance,
    AxiosResponse,
    InternalAxiosRequestConfig
} from "axios";
import { RedirectProtocolExecuter, getCSRFToken } from ".";
import { handle401Error } from "./SessionManager";

const Axios: AxiosInstance = axios.create({
    timeout: 10000
});

let csrfToken: any = null;
let csrfRetryAttempted = false;
let csrfTokenPromise: Promise<any> | null = null;

const ensureCSRFToken = async (): Promise<any> => {
    // If token already exists, return it
    if (csrfToken) {
        return csrfToken;
    }

    // If token retrieval is in progress, wait for it
    if (csrfTokenPromise) {
        return csrfTokenPromise;
    }

    // Start new token retrieval
    csrfTokenPromise = getCSRFToken()
        .then((token) => {
            if (token?.Status === 1) {
                localStorage.setItem("trace", JSON.stringify(token));
                csrfToken = token;
                return token;
            } else {
                RedirectProtocolExecuter(token?.StatusCode);
                throw new Error("CSRF token retrieval failed");
            }
        })
        .catch((error) => {
            csrfToken = null;
            throw error;
        })
        .finally(() => {
            csrfTokenPromise = null;
        });

    return csrfTokenPromise;
};

Axios.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>) => {
        try {
            const token = await ensureCSRFToken();
            config.headers["x-csrf"] = token.Data.token;
        } catch (error) {
            return Promise.reject({
                message: "CSRF token retrieval failed",
                originalError: error
            });
        }

        if (!config.headers["Authorization"]) {
            config.headers["Authorization"] =
                `Bearer ${localStorage.getItem("auth-token")}`;
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
                csrfTokenPromise = null;

                try {
                    const newToken = await ensureCSRFToken();
                    if (newToken?.Status === 1) {
                        csrfRetryAttempted = false;

                        const newAuthToken = localStorage.getItem("auth-token");
                        if (newAuthToken) {
                            return Axios.request(error.config);
                        }
                    }
                } catch (tokenError) {
                    console.error("Failed to refresh CSRF token:", tokenError);
                    csrfRetryAttempted = false;
                }
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
