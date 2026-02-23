/**
 * Projects Data
 * Comprehensive project information with details
 */

export interface IPackage {
    name: string;
    type: "npm" | "pip" | "gem" | "composer" | "cargo" | "go";
    url: string;
}

export interface IProject {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    fullDescription: string;
    featured: boolean;
    status: "completed" | "in-progress" | "maintained" | "archived";
    category: "web" | "mobile" | "desktop" | "api" | "library" | "tool" | "other";
    
    // Links
    githubUrl?: string;
    liveUrl?: string;
    demoUrl?: string;
    documentationUrl?: string;
    
    // Media
    thumbnail: string;
    screenshots: string[];
    videoUrl?: string;
    
    // Tech Stack
    technologies: string[];
    frameworks: string[];
    tools: string[];
    packages: IPackage[];
    
    // Metadata
    startDate: string;
    endDate?: string;
    stars?: number;
    forks?: number;
    contributors?: number;
    
    // Features
    features: string[];
    challenges?: string[];
    learnings?: string[];
    
    // Team
    teamSize?: number;
    role?: string;
}

export const projects: IProject[] = [
    {
        id: "1",
        slug: "portfolio-ecosystem",
        title: "Portfolio Ecosystem",
        shortDescription: "Advanced portfolio with multi-theme support, authentication, and admin panel",
        fullDescription: "A comprehensive portfolio website built with Next.js 14 featuring dual-theme system (Apple Liquid Glass & Samsung One UI 7), dynamic accent colors, authentication with passkeys, admin dashboard, blog system, and advanced security features.",
        featured: true,
        status: "maintained",
        category: "web",
        
        githubUrl: "https://github.com/Meetbhingradiya/Portfolio",
        liveUrl: "https://meetbhingradiya.vercel.app",
        
        thumbnail: "/assets/projects/portfolio-thumbnail.jpg",
        screenshots: [
            "/assets/projects/portfolio-home.jpg",
            "/assets/projects/portfolio-themes.jpg",
            "/assets/projects/portfolio-admin.jpg",
            "/assets/projects/portfolio-blog.jpg"
        ],
        
        technologies: ["TypeScript", "JavaScript", "Python", "HTML", "CSS"],
        frameworks: ["Next.js 14", "React 18", "Tailwind CSS", "Framer Motion", "Material-UI"],
        tools: ["VS Code", "Git", "MongoDB", "Vercel", "GitHub Actions"],
        packages: [
            { name: "next", type: "npm", url: "https://www.npmjs.com/package/next" },
            { name: "react", type: "npm", url: "https://www.npmjs.com/package/react" },
            { name: "typescript", type: "npm", url: "https://www.npmjs.com/package/typescript" },
            { name: "tailwindcss", type: "npm", url: "https://www.npmjs.com/package/tailwindcss" },
            { name: "framer-motion", type: "npm", url: "https://www.npmjs.com/package/framer-motion" },
            { name: "mongoose", type: "npm", url: "https://www.npmjs.com/package/mongoose" },
            { name: "@mui/material", type: "npm", url: "https://www.npmjs.com/package/@mui/material" },
            { name: "axios", type: "npm", url: "https://www.npmjs.com/package/axios" },
            { name: "bcryptjs", type: "npm", url: "https://www.npmjs.com/package/bcryptjs" }
        ],
        
        startDate: "2023-01",
        stars: 15,
        forks: 3,
        contributors: 1,
        
        features: [
            "Dual-theme system: Apple Liquid Glass & Samsung One UI 7",
            "14 preset accent colors with dynamic palette generation",
            "Light & Dark mode support",
            "Authentication with email, passkeys, and social providers",
            "Admin dashboard with analytics",
            "Blog system with markdown support",
            "Timeline of education, experience, and projects",
            "Contact form with email notifications",
            "Timetable management",
            "Bookmark system",
            "SEO optimized",
            "Progressive Web App (PWA) ready",
            "Fully responsive design"
        ],
        challenges: [
            "Implementing complex dual-theme system with dynamic colors",
            "Building secure authentication with passkey support",
            "Optimizing performance with large datasets",
            "Creating smooth animations without performance impact"
        ],
        learnings: [
            "Advanced Next.js app router patterns",
            "CSS custom properties for dynamic theming",
            "MongoDB aggregation pipelines",
            "WebAuthn API for passkeys",
            "Performance optimization techniques"
        ],
        
        teamSize: 1,
        role: "Full Stack Developer"
    },
    {
        id: "2",
        slug: "security-suite",
        title: "Security Suite",
        shortDescription: "Comprehensive security tools and DevOps automation scripts",
        fullDescription: "A collection of security tools and automation scripts for DevOps workflows, including vulnerability scanning, secure key generation, automated deployment checks, and security best practices enforcement.",
        featured: true,
        status: "maintained",
        category: "tool",
        
        githubUrl: "https://github.com/Meetbhingradiya/Security-Suite",
        
        thumbnail: "/assets/projects/security-thumbnail.jpg",
        screenshots: [
            "/assets/projects/security-dashboard.jpg",
            "/assets/projects/security-scan.jpg",
            "/assets/projects/security-reports.jpg"
        ],
        
        technologies: ["Python", "Bash", "TypeScript"],
        frameworks: [],
        tools: ["Git", "Docker", "GitHub Actions", "Jenkins"],
        packages: [
            { name: "cryptography", type: "pip", url: "https://pypi.org/project/cryptography/" },
            { name: "paramiko", type: "pip", url: "https://pypi.org/project/paramiko/" },
            { name: "requests", type: "pip", url: "https://pypi.org/project/requests/" },
            { name: "python-dotenv", type: "pip", url: "https://pypi.org/project/python-dotenv/" }
        ],
        
        startDate: "2022-06",
        stars: 8,
        forks: 2,
        contributors: 1,
        
        features: [
            "RSA key pair generation with various bit sizes",
            "Automated vulnerability scanning",
            "Deployment verification checks",
            "Security header validation",
            "Automated backup and restore",
            "Git history sanitization",
            "Environment variable validation",
            "Dependency security auditing"
        ],
        challenges: [
            "Implementing secure key generation algorithms",
            "Building cross-platform compatibility",
            "Handling various security protocols"
        ],
        learnings: [
            "Cryptography fundamentals",
            "Security best practices",
            "Automation scripting patterns",
            "CI/CD pipeline integration"
        ],
        
        teamSize: 1,
        role: "Security Engineer"
    },
    {
        id: "3",
        slug: "cloud-infrastructure",
        title: "Cloud Infrastructure",
        shortDescription: "Scalable cloud architecture with automated deployment pipelines",
        fullDescription: "Enterprise-grade cloud infrastructure setup with automated CI/CD pipelines, containerization, orchestration, monitoring, and auto-scaling capabilities. Built for high availability and fault tolerance.",
        featured: false,
        status: "completed",
        category: "api",
        
        githubUrl: "https://github.com/Meetbhingradiya/Cloud-Infrastructure",
        documentationUrl: "https://docs.example.com",
        
        thumbnail: "/assets/projects/cloud-thumbnail.jpg",
        screenshots: [
            "/assets/projects/cloud-architecture.jpg",
            "/assets/projects/cloud-monitoring.jpg",
            "/assets/projects/cloud-pipeline.jpg"
        ],
        
        technologies: ["Docker", "Kubernetes", "Terraform", "Bash"],
        frameworks: [],
        tools: ["AWS", "GitHub Actions", "Prometheus", "Grafana", "Jenkins"],
        packages: [],
        
        startDate: "2023-03",
        endDate: "2023-09",
        stars: 12,
        forks: 5,
        contributors: 1,
        
        features: [
            "Multi-region deployment",
            "Auto-scaling based on load",
            "Automated CI/CD pipelines",
            "Container orchestration with Kubernetes",
            "Infrastructure as Code with Terraform",
            "Real-time monitoring and alerting",
            "Automated backups and disaster recovery",
            "Zero-downtime deployments"
        ],
        challenges: [
            "Designing for high availability",
            "Optimizing costs without sacrificing performance",
            "Implementing secure networking",
            "Managing state across multiple regions"
        ],
        learnings: [
            "Cloud architecture patterns",
            "Kubernetes orchestration",
            "Infrastructure automation",
            "DevOps best practices",
            "Cost optimization strategies"
        ],
        
        teamSize: 1,
        role: "DevOps Engineer"
    },
    {
        id: "4",
        slug: "ai-chatbot",
        title: "AI Chatbot Platform",
        shortDescription: "Intelligent chatbot with NLP and context-aware responses",
        fullDescription: "An advanced AI-powered chatbot platform featuring natural language processing, context-aware conversations, multi-language support, and integration with various messaging platforms.",
        featured: true,
        status: "in-progress",
        category: "api",
        
        githubUrl: "https://github.com/Meetbhingradiya/AI-Chatbot",
        demoUrl: "https://chatbot-demo.example.com",
        
        thumbnail: "/assets/projects/chatbot-thumbnail.jpg",
        screenshots: [
            "/assets/projects/chatbot-interface.jpg",
            "/assets/projects/chatbot-analytics.jpg"
        ],
        
        technologies: ["Python", "TypeScript", "JavaScript"],
        frameworks: ["FastAPI", "React", "TensorFlow"],
        tools: ["Docker", "Redis", "PostgreSQL"],
        packages: [
            { name: "fastapi", type: "pip", url: "https://pypi.org/project/fastapi/" },
            { name: "tensorflow", type: "pip", url: "https://pypi.org/project/tensorflow/" },
            { name: "transformers", type: "pip", url: "https://pypi.org/project/transformers/" },
            { name: "langchain", type: "pip", url: "https://pypi.org/project/langchain/" },
            { name: "openai", type: "pip", url: "https://pypi.org/project/openai/" }
        ],
        
        startDate: "2024-01",
        stars: 25,
        forks: 8,
        contributors: 1,
        
        features: [
            "Natural language understanding",
            "Context-aware conversations",
            "Multi-language support",
            "Intent recognition",
            "Entity extraction",
            "Custom training data support",
            "Analytics dashboard",
            "API integration"
        ],
        challenges: [
            "Training accurate NLP models",
            "Maintaining conversation context",
            "Optimizing response time"
        ],
        learnings: [
            "Machine learning fundamentals",
            "NLP techniques",
            "API design patterns",
            "Real-time processing"
        ],
        
        teamSize: 1,
        role: "AI Engineer"
    },
    {
        id: "5",
        slug: "e-commerce-platform",
        title: "E-Commerce Platform",
        shortDescription: "Full-featured online shopping platform with payment integration",
        fullDescription: "A complete e-commerce solution with product catalog, shopping cart, payment processing, order management, inventory tracking, and admin dashboard.",
        featured: false,
        status: "completed",
        category: "web",
        
        githubUrl: "https://github.com/Meetbhingradiya/E-Commerce",
        liveUrl: "https://shop.example.com",
        
        thumbnail: "/assets/projects/ecommerce-thumbnail.jpg",
        screenshots: [
            "/assets/projects/ecommerce-home.jpg",
            "/assets/projects/ecommerce-product.jpg",
            "/assets/projects/ecommerce-checkout.jpg"
        ],
        
        technologies: ["TypeScript", "JavaScript", "PostgreSQL"],
        frameworks: ["Next.js", "Prisma", "tRPC"],
        tools: ["Stripe", "Vercel", "Docker"],
        packages: [
            { name: "next", type: "npm", url: "https://www.npmjs.com/package/next" },
            { name: "prisma", type: "npm", url: "https://www.npmjs.com/package/prisma" },
            { name: "@trpc/server", type: "npm", url: "https://www.npmjs.com/package/@trpc/server" },
            { name: "stripe", type: "npm", url: "https://www.npmjs.com/package/stripe" },
            { name: "zustand", type: "npm", url: "https://www.npmjs.com/package/zustand" }
        ],
        
        startDate: "2022-09",
        endDate: "2023-02",
        stars: 18,
        forks: 6,
        contributors: 1,
        
        features: [
            "Product catalog with search and filters",
            "Shopping cart and wishlist",
            "Secure payment processing",
            "Order tracking",
            "Inventory management",
            "Admin dashboard",
            "Email notifications",
            "Responsive design"
        ],
        challenges: [
            "Implementing secure payment flow",
            "Managing inventory in real-time",
            "Optimizing database queries"
        ],
        learnings: [
            "Payment gateway integration",
            "Database design for e-commerce",
            "Type-safe API development",
            "State management patterns"
        ],
        
        teamSize: 1,
        role: "Full Stack Developer"
    },
    {
        id: "6",
        slug: "mobile-fitness-app",
        title: "Mobile Fitness App",
        shortDescription: "Cross-platform fitness tracking app with workout plans",
        fullDescription: "A comprehensive fitness tracking mobile application with custom workout plans, progress tracking, nutrition logging, and social features.",
        featured: false,
        status: "archived",
        category: "mobile",
        
        githubUrl: "https://github.com/Meetbhingradiya/Fitness-App",
        
        thumbnail: "/assets/projects/fitness-thumbnail.jpg",
        screenshots: [
            "/assets/projects/fitness-dashboard.jpg",
            "/assets/projects/fitness-workout.jpg"
        ],
        
        technologies: ["TypeScript", "JavaScript"],
        frameworks: ["React Native", "Expo"],
        tools: ["Firebase", "Redux"],
        packages: [
            { name: "react-native", type: "npm", url: "https://www.npmjs.com/package/react-native" },
            { name: "expo", type: "npm", url: "https://www.npmjs.com/package/expo" },
            { name: "react-navigation", type: "npm", url: "https://www.npmjs.com/package/@react-navigation/native" },
            { name: "redux-toolkit", type: "npm", url: "https://www.npmjs.com/package/@reduxjs/toolkit" }
        ],
        
        startDate: "2021-06",
        endDate: "2022-03",
        stars: 10,
        forks: 3,
        contributors: 1,
        
        features: [
            "Custom workout plans",
            "Exercise library with videos",
            "Progress tracking",
            "Nutrition logging",
            "Social feed",
            "Achievement system"
        ],
        
        teamSize: 1,
        role: "Mobile Developer"
    }
];

export default projects;
