import Image from "next/image";

export default function Home() {
    return (
        <>
            <a className="Container" href="https://github.com/meetbhingradiya">
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
                    Blogs, Projects and more...
                </p>
            </a>
            <div className="footer">
                2021 - 2024 © Meet Bhingradiya
            </div>
        </>
    );
}
