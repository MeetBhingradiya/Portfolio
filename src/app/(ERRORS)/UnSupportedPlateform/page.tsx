/**
 *  @file        app\(ERRORS)\UnSupportedPlateform\page.tsx
 *  @description No description available for app\(ERRORS)\UnSupportedPlateform\page.tsx.
 *  @author      Meet Bhingradiya
 *  @license     Licensed to Meet Bhingradiya
 *  
 *  -----------------------------------------------------------------------------
 *  Copyright (c) 2025 Meet Bhingradiya
 *  All rights reserved.
 *  
 *  This file is part of the MeetBhingradiya's Portfolio project and is protected under copyright
 *  law. Unauthorized copying of this file, via any medium, is strictly prohibited
 *  without explicit permission from the author.
 *  
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL 
 *  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING 
 *  FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 *  DEALINGS IN THE SOFTWARE.
 *  -----------------------------------------------------------------------------
 *  @created 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 *  @modified 13/01/25 11:34 AM IST (Kolkata +5:30 UTC)
 */

"use client";
import React from 'react';

function UnSupportedPlateform_Page() {
    const [platform, setPlatform] = React.useState('');

    React.useEffect(() => {

        const userAgent = navigator.userAgent;
        if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
            setPlatform('iOS');
        } else if (userAgent.includes('Android')) {
            setPlatform('Android');
        } else if (userAgent.includes('Windows')) {
            setPlatform('Windows');
        } else if (userAgent.includes('Mac')) {
            setPlatform('Mac');
        }

    }, []);

    return (

        <div className='Page CENTER'>

            <div className='flex flex-col gap-4 justify-center items-center'>
                <h1 className='text-4xl'>UnSupported Oprating System</h1>
                <p className='text-2xl'>{platform}</p>
            </div>

        </div>

    );

}

export default UnSupportedPlateform_Page;