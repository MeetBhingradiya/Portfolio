import Image from "next/image";

export default function Home() {
    return (
        <div>
            <h1>Meet Bhingradiya&apos;s Portfolio</h1>
            <Image
                src="/meet.jpg"
                alt="Meet Bhingradiya"
                width={200}
                height={200}
                property="false"
            />
            <p>
                Coming Soon!
            </p>
            <p>
                Blogs, ResearchPapers, Projects, Dev Tools and more...
            </p>
        </div>
    );
}
