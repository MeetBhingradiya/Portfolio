/**
 *  @FileID          Utils\Axios.ts
 *  @Description     Currently, there is no description available.
 *  @Author          @MeetBhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the @MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 14/01/25 3:22 PM IST (Kolkata +5:30 UTC)
 */

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
        if (csrfToken.Status === 1) {   
            config.headers['x-csrf'] = csrfToken.data;
            config.withCredentials = true;
            return config;
        } else {
            return Promise.reject(csrfToken);
        }
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
