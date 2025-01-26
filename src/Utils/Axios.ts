/**
 *  @FileID          Utils\Axios.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium, is strictly prohibited without prior written consent from the
 *  author or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  Notice: GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is not affiliated with, endorsed by, or in any way associated with GitHub or 
 *  Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last sUpdated on Version: 1.0.8
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 22/01/25 11:34 AM IST (Kolkata +5:30 UTC)
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
        let csrfToken: any = null;
        if (localStorage.getItem('trace')) {
            const LocalStorehasValidToken = JSON.parse(localStorage.getItem('trace') || '{}')?.data; 
            if (LocalStorehasValidToken) {
                csrfToken = LocalStorehasValidToken
            } else {
                csrfToken = await getCSRFToken();
                localStorage.setItem('trace', JSON.stringify(csrfToken));
            }
        } else {
            csrfToken = await getCSRFToken();
            localStorage.setItem('trace', JSON.stringify(csrfToken));
        }

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
        if (error.response?.status === 403) {
            localStorage.removeItem('trace');
            window.location.reload();
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

export { Axios };
