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
                    width={200}
                    height={200}
                    property="false"
                />
                </div>
                <p className="soon">
                    Coming Soon!
                </p>
                <p>
                    Blogs, Projects and more...
                </p>
            </a>
            <div className="footer">
                Copyright © 2021 - {new Date().getFullYear()} Meet Bhingradiya
            </div>
        </>
    );
}
