import Image from "next/image";

export default function Home() {
    return (
        <>
            <div className="Container">
                <h1>Meet Bhingradiya</h1>
                <Image
                    src="/meet.jpg"
                    alt="Meet Bhingradiya"
                    width={200}
                    height={200}
                    property="false"
                />
                <p className="soon">
                    Coming Soon!
                </p>
                <p>
                    Blogs, Projects, and more...
                </p>
            </div>
            <div className="footer">
                <a href="https://github.com/meetbhingradiya">
                    2021 - 2024 © Meet Bhingradiya
                </a>
            </div>
        </>
    );
}
