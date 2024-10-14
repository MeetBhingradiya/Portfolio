"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Styles from "./page.module.sass";

export default function PortfolioLandingPage() {
    return (
        <div className={Styles.portfolioPage}>

            {/* Hero Section */}
            <section className={Styles.hero}>
                <motion.div
                    className={Styles.heroContent}
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                >
                    <h1>Hi, I&apos;m Meet Bhingradiya</h1>
                    <p>Full Stack Developer</p>
                    <Link href="#contact" className={Styles.ctaButton}>
                        Hire Me
                    </Link>
                </motion.div>

                <motion.div
                    className={Styles.heroImage}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <Image
                        src="/profile.jpg"
                        alt="Meet Bhingradiya"
                        width={250}
                        height={250}
                        priority={true}
                    />
                </motion.div>
            </section>

            {/* About Section */}
            <section className={Styles.about}>
                <motion.h2
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    About Me
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    I am a passionate full-stack developer with a love for building
                    responsive, high-performance web applications. I specialize in
                    technologies like React, Node.js, and Tailwind CSS.
                </motion.p>
            </section>

            {/* Skills Section */}
            <section className={Styles.skills}>
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.7 }}
                >
                    My Skills
                </motion.h2>
                <motion.div
                    className={Styles.skillsGrid}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                    <div className={Styles.skillCard}>JavaScript</div>
                    <div className={Styles.skillCard}>React</div>
                    <div className={Styles.skillCard}>Node.js</div>
                    <div className={Styles.skillCard}>Tailwind CSS</div>
                </motion.div>
            </section>

            {/* Contact Section */}
            <section className={Styles.contact} id="contact">
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    Get In Touch
                </motion.h2>
                <motion.div
                    className={Styles.contactContent}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7 }}
                >
                    <p>
                        Interested in working together? Feel free to reach out via
                        social media or send me an email!
                    </p>
                    <Link href="mailto:meet@example.com" className={Styles.emailButton}>
                        Send Email
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer>
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.7 }}
                >
                    All rights reserved. Meet Bhingradiya © {new Date().getFullYear()}
                </motion.div>
            </footer>
        </div>
    );
}
