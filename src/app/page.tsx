import Image from "next/image";

export default function Home() {
    return (
        <>
            <a className="Container" href="https://github.com/meetbhingradiya">
                <h1>Meet Bhingradiya</h1>
                <div className="CENTER">
                <Image
                    src="/meet.jpg"
                    alt="Meet Bhingradiya"
                    width={150}
                    height={150}
                    priority={true}
                />
                </div>
                <p className="soon">
                    Coming Soon!
                </p>
            </a>
            <p>
                Blogs, DevTools and more!
            </p>
            <div className="footer">
                Copyright © 2021 - {new Date().getFullYear()} Meet Bhingradiya
            </div>
        </>
    );
}
