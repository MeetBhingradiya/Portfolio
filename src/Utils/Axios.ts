import { Config } from '@Config';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { RedirectProtocolExecuter , getCSRFToken } from '@Utils';

const Axios: AxiosInstance = axios.create({
    timeout: 8000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let csrfToken: any = null;
let csrfRetryAttempted = false;
let CSRF_UnderProgress = false;

Axios.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>) => {
        if (!csrfToken) {
            if (CSRF_UnderProgress) {
                return Promise.reject({ message: 'CSRF token retrieval in progress' });
            }
            CSRF_UnderProgress = true;
            csrfToken = await getCSRFToken().catch(() => null);
            if (csrfToken?.Status === 1) {
                localStorage.setItem('trace', JSON.stringify(csrfToken));
            } else {

                // ? Redirect Protocols
                RedirectProtocolExecuter(csrfToken?.StatusCode);
                
                csrfToken = null;
                return Promise.reject({ message: 'CSRF token retrieval failed' });
            }
            CSRF_UnderProgress = false;
        }

        config.headers['x-csrf'] = csrfToken.data;
        config.withCredentials = true;
        return config;
    },
    (error: any) => Promise.reject(error)
);

Axios.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
        if (error.response?.data?.StatusCode === "INVALID_AUTHORIZATION") {
            localStorage.removeItem('trace');
            csrfToken = null;

            if (!csrfRetryAttempted) {
                csrfRetryAttempted = true;
                csrfToken = await getCSRFToken().catch(() => null);
                if (csrfToken?.Status === 1) {
                    localStorage.setItem('trace', JSON.stringify(csrfToken));
                    return Axios.request(error.config);
                }
            }
        }

        RedirectProtocolExecuter(error.response?.data?.StatusCode);

        return Promise.reject(error);
    }
);

export { Axios };