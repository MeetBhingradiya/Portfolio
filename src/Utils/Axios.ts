/**
 *  @FileID          Utils\Axios.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 03/03/25 8:11 AM IST (Kolkata +5:30 UTC)
 */


import { Config } from '@Config';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { RedirectProtocolExecuter , getCSRFToken} from '@Utils';

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