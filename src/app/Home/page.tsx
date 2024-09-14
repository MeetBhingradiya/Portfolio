import React from 'react';
import Styles from './page.module.sass';

function Home() {
    return (
        <div className={Styles.Home}>
            {/* @ Navigation */}
            <div className={Styles.Navigation}>
                <div className={Styles.Logo}>
                    <h1>Logo</h1>
                </div>
                <div className={Styles.Menu}>
                    <ul>
                        <li>Home</li>
                        <li>About</li>
                        <li>Services</li>
                        <li>Contact</li>
                    </ul>
                </div>
            </div>
            {/* @ Hero Section */}

            {/* @ Footer */}
            <div className={Styles.Footer}>
                <p>Meet Bhingradiya © 2021 - {new Date().getFullYear()} All Rights Reserved</p>
            </div>
        </div>
    )
}

export default Home;