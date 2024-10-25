"use client";
import Styles from "./page.module.sass";
import Footer from "@Components/Footer/component";
import Header from "@Components/Header/component";

export default function Home() {
    return (
        <div className={Styles.Home}>
            <Header/>
            <Footer/>
        </div>
    );
}
