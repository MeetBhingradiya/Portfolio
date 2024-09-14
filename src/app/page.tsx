import Image from "next/image";

export default function Home() {


    return (
        <div className="CommingSoon">
            <div className="Notification">
                <Image width="30" height="30" src="https://img.icons8.com/ios-glyphs/512/error--v1.png" alt="error--v1"/> This website is under construction. Please visit later.
            </div>
            {/* <a className="Notification" href="/Home">
                This website is under construction. Click heare to Visit Home Page.
            </a> */}
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
            <div className="footer">
                Copyright © 2021 - {new Date().getFullYear()} Meet Bhingradiya
            </div>
        </div>
    );
}
