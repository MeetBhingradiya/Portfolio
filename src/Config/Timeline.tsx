import React from "react";
import {
    FaFacebook,
    FaLinkedin,
    FaTwitter,
    FaInstagram,
    FaYoutube
} from "react-icons/fa";

enum TimelineItemType {
    // ? CV & Resume Visible Items on PDF
    Experience = "Experience",
    Education = "Education",
    Project = "Project",

    // ? None CV & Resume Visible Items on PDF
    Certification = "Certification",
    Publication = "Publication",
    Award = "Award",
    Skill = "Skill",
    Volunteer = "Volunteer",
    Course = "Course",
    Technology = "Technology",
    Language = "Language"
}

interface ITimeline {
    // ? For Display on Site
    visiblity: boolean;

    // ? Human Readable Dates DD/MM/YYYY (INDIA) OR Month & Year
    Start?:
    | `${number}${number}-${number}${number}-${number}${number}${number}${number}`
    | `${number}${number}-${number}${number}`;
    isCurrent?: boolean;
    End?:
    | `${number}${number}-${number}${number}-${number}${number}${number}${number}`
    | `${number}${number}-${number}${number}`;

    ItemType: TimelineItemType;

    // ? Common Fields
    Title: string;
    Logo?: string | React.ReactElement;
    Description: string;
    Link?: string;

    // ? for Experience & Project
    Company?: string;
    CompanySocials?: Array<{
        icon: string | React.ReactElement;
        link: string;
    }>;
    Location?: {
        Map?: {
            lat: number;
            lng: number;
        };
        GoogleMapsLink?: string;
        Address?: string;
    };
    Role?: string;
    Technology?: string[];
    Projects?: TimelineItemType[]; // ? Restricted to Project Type Only
    Images?: string[];

    // ? for Education
    University?: string;
    UniversitySocials?: Array<{
        icon: string | React.ReactElement;
        link: string;
    }>;
    Specialization?: string;
    Grade?: string | number; // ? CGPA or Percentage

    // ? for Skill
    SkillID?: string; // ? Unique Premade Presets of Tools, Frameworks, etc.
    Proficiency?: number; // ? 0 to 100
    Category?: string; // ? Frontend, Backend, DevOps, etc.
}

const MyTimeline: ITimeline[] = [
    // Current Experience - 2024 to Present
    // {
    //     visiblity: true,
    //     Start: "01-2024",
    //     isCurrent: true,
    //     ItemType: TimelineItemType.Experience,
    //     Title: "Senior Full Stack Developer",
    //     Company: "Tech Innovation Corp",
    //     Role: "Lead Developer & Architecture Designer",
    //     Description: "Leading the development of scalable web applications using modern tech stack. Architecting microservices, implementing CI/CD pipelines, and mentoring junior developers. Specializing in React, Node.js, and cloud technologies.",
    //     Technology: ["React", "TypeScript", "Node.js", "AWS", "Docker", "MongoDB", "Redis", "GraphQL", "Next.js"],
    //     Location: {
    //         Address: "Remote",
    //         GoogleMapsLink: "https://maps.google.com/"
    //     },
    //     Link: "https://portfolio.meetbhingradiya.com"
    // },

    // Recent Project - 2025
    // {
    //     visiblity: true,
    //     Start: "06-2025",
    //     End: "09-2025",
    //     ItemType: TimelineItemType.Project,
    //     Title: "AI-Powered Portfolio Analytics Platform",
    //     Description: "Developed a comprehensive analytics platform that uses machine learning to provide insights on portfolio performance. Features include real-time data processing, predictive analytics, and interactive dashboards.",
    //     Technology: ["Next.js", "Python", "TensorFlow", "PostgreSQL", "Redis", "AWS Lambda", "TypeScript"],
    //     Link: "https://github.com/meetbhingradiya/portfolio-analytics"
    // },

    // AWS Certification - 2025
    // {
    //     visiblity: true,
    //     Start: "03-2025",
    //     End: "04-2025",
    //     ItemType: TimelineItemType.Certification,
    //     Title: "AWS Certified Solutions Architect",
    //     Description: "Achieved AWS Solutions Architect certification demonstrating expertise in designing distributed systems on AWS platform. Covers topics like scalability, reliability, and cost optimization.",
    //     Link: "https://aws.amazon.com/certification/"
    // },

    // Internship - 2023-2024
    // {
    //     visiblity: true,
    //     Start: "06-2023",
    //     End: "12-2023",
    //     ItemType: TimelineItemType.Experience,
    //     Title: "Full Stack Developer Intern",
    //     Company: "StartupX Technologies",
    //     Role: "Frontend & Backend Development",
    //     Description: "Contributed to the development of a SaaS platform for small businesses. Worked on both frontend user interfaces and backend APIs. Gained experience in agile development practices and modern web technologies.",
    //     Technology: ["React", "Express.js", "MySQL", "Firebase", "Material-UI", "JavaScript"],
    //     Location: {
    //         Address: "Mumbai, Maharashtra, India"
    //     }
    // },

    // Major Project - 2024
    // {
    //     visiblity: true,
    //     Start: "01-2024",
    //     End: "05-2024",
    //     ItemType: TimelineItemType.Project,
    //     Title: "E-commerce Platform with ML Recommendations",
    //     Description: "Built a full-featured e-commerce platform with machine learning-powered product recommendations. Implemented user authentication, payment gateway integration, and real-time inventory management.",
    //     Technology: ["Next.js", "Node.js", "MongoDB", "Stripe", "TensorFlow.js", "Docker"]
    // },

    // Skill Development - 2022 to Present
    // {
    //     visiblity: true,
    //     Start: "01-2022",
    //     isCurrent: true,
    //     ItemType: TimelineItemType.Skill,
    //     Title: "React & TypeScript Expert",
    //     SkillID: "react-typescript",
    //     Category: "Frontend Development",
    //     Proficiency: 95,
    //     Description: "Advanced proficiency in React ecosystem including hooks, context, state management with Redux, and TypeScript for type-safe development. Experience with Next.js, testing libraries, and performance optimization."
    // },

    // Award - 2024
    // {
    //     visiblity: true,
    //     Start: "11-2024",
    //     ItemType: TimelineItemType.Award,
    //     Title: "Best Innovation Award",
    //     Description: "Received the Best Innovation Award at the National Student Tech Conference for developing an AI-powered code review tool that helps developers write better code.",
    //     Link: "https://studenttechconf.com/awards"
    // },

    // Course - 2023
    // {
    //     visiblity: true,
    //     Start: "09-2023",
    //     End: "11-2023",
    //     ItemType: TimelineItemType.Course,
    //     Title: "Advanced Machine Learning Specialization",
    //     University: "Stanford University (Online)",
    //     Description: "Completed comprehensive machine learning course covering deep learning, neural networks, and practical AI applications. Implemented multiple ML projects and gained hands-on experience with TensorFlow and PyTorch.",
    //     Technology: ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy"]
    // },

    // Open Source - 2022 to Present
    // {
    //     visiblity: true,
    //     Start: "01-2022",
    //     isCurrent: true,
    //     ItemType: TimelineItemType.Volunteer,
    //     Title: "Open Source Contributor",
    //     Description: "Active contributor to various open source projects. Maintained several npm packages, contributed to React ecosystem tools, and helped newcomers get started with programming through mentorship.",
    //     Technology: ["JavaScript", "TypeScript", "React", "Node.js", "Git"],
    //     Link: "https://github.com/meetbhingradiya"
    // },

    // First Internship - 2022
    // {
    //     visiblity: true,
    //     Start: "06-2022",
    //     End: "08-2022",
    //     ItemType: TimelineItemType.Experience,
    //     Title: "Frontend Developer Intern",
    //     Company: "Local Tech Startup",
    //     Role: "UI/UX Development",
    //     Description: "First professional experience building responsive web interfaces. Learned industry best practices for code organization, version control, and collaborative development.",
    //     Technology: ["HTML", "CSS", "JavaScript", "React", "Git"],
    //     Location: {
    //         Address: "Vadodara, Gujarat, India"
    //     }
    // },

    // Early Project - 2022
    // {
    //     visiblity: true,
    //     Start: "03-2022",
    //     End: "05-2022",
    //     ItemType: TimelineItemType.Project,
    //     Title: "Personal Portfolio Website",
    //     Description: "Created my first professional portfolio website to showcase projects and skills. Implemented responsive design, dark mode, and smooth animations. This project marked the beginning of my web development journey.",
    //     Technology: ["HTML", "CSS", "JavaScript", "GSAP"]
    // },

    // B.Tech CSE - 2025 to Present
    {
        visiblity: true,
        isCurrent: true,
        Start: "07-2025",
        End: "05-2027",
        ItemType: TimelineItemType.Education,
        Title: "B.Tech in Computer Science",
        University: "P. P. Savani University",
        Description: "Pursuing advanced computer science education with focus on software development, data structures, and algorithms. Building expertise in modern technologies and programming practices.",
        Technology: [
            "C",
            "Object Oriented Programming",
            "Data Structures",
            "Software Engineering",
            "Database Management Systems"
        ],
        Logo: "/assets/ppsu.png",
        UniversitySocials: [
            {
                icon: <FaLinkedin />,
                link: "https://www.linkedin.com/school/p-p-savani-university"
            },
            {
                icon: <FaInstagram />,
                link: "https://www.instagram.com/ppsavaniuniversity/"
            },
            {
                icon: <FaFacebook />,
                link: "https://www.facebook.com/ppsuni"
            },
            {
                icon: <FaYoutube />,
                link: "https://www.youtube.com/ppsavaniuniversityofficial"
            }
        ]
    },

    // Diploma - 2022 to 2025
    {
        visiblity: true,
        Start: "07-2022",
        End: "05-2025",
        ItemType: TimelineItemType.Education,
        Title: "Diploma in Information Technology",
        University: "P. P. Savani University",
        Grade: 7.45,
        Description: "Completed comprehensive IT education covering programming fundamentals, software development methodologies, and system administration. Gained practical experience through hands-on projects.",
        Technology: [
            "C",
            "Java",
            "Data Structures",
            "Software Engineering",
            "Operating Systems"
        ],
        Logo: "/assets/ppsu.png",
        UniversitySocials: [
            {
                icon: <FaLinkedin />,
                link: "https://www.linkedin.com/school/p-p-savani-university"
            },
            {
                icon: <FaInstagram />,
                link: "https://www.instagram.com/ppsavaniuniversity/"
            },
            {
                icon: <FaFacebook />,
                link: "https://www.facebook.com/ppsuni"
            },
            {
                icon: <FaYoutube />,
                link: "https://www.youtube.com/ppsavaniuniversityofficial"
            }
        ]
    }
];

export { MyTimeline, TimelineItemType, type ITimeline };
