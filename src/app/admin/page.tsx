"use client";
import React from 'react';
import { getCSRFToken } from '@/Utils/getTrace';

function Admin_Page() {
    const [Essentials, setEssentials] = React.useState({
        csrf: null,
        isFirstRender: true,
    });

    React.useEffect(() => {
        if (Essentials.isFirstRender) {
            setEssentials({
                ...Essentials,
                isFirstRender: false,
            });
        }
    }, [Essentials.isFirstRender]);

    React.useEffect(() => {
        if (!Essentials.csrf) {
            getCSRFToken().then((csrf) => {
                setEssentials({
                    ...Essentials,
                    csrf,
                });
            });
        }
    }, [Essentials.csrf]);

    return (<>
        <div className="Page CENTER">
            Admin
        </div>
    </>)
}

export default Admin_Page;