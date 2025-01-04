import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getCSRFToken } from './getTrace';

const Axios: AxiosInstance = axios.create({
    timeout: 8000,
    headers: {
        'Content-Type': 'application/json',
    },
});

Axios.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>) => {
        const csrfToken = await getCSRFToken();
        config.headers['x-csrf'] = csrfToken;
        config.withCredentials = true;
        return config;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

Axios.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

export { Axios };
