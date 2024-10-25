"use client";
import "@Styles/Home.sass";
import Footer from "@Components/Footer/component";
import Header from "@Components/Header/component";

export default function Home() {
    return (
        <div className={"Home"}>
            <Header/>
            <Footer/>
        </div>
    );
}
