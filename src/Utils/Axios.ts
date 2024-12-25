import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const Axios: AxiosInstance = axios.create({
    // baseURL: 'https://meetbhingradiya.tech/api', // Replace with your API base URL
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor for request configuration
Axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig<any>) => {
        config.withCredentials = true;
        return config;
    },
    (error: any) => {
        // Handle request errors
        return Promise.reject(error);
    }
);

// Interceptor for response handling
Axios.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error: any) => {
        return Promise.reject(error);
    }
);

export { Axios };
