from docx import Document
import sys

def fill_template(template_path, output_path):
    doc = Document(template_path)
    
    # We will iterate through all paragraphs and replace/append text.
    for p in doc.paragraphs:
        text = p.text.strip()
        
        # TITLE PAGE
        if text == "Student’s Full Name":
            p.text = "Student’s Full Name: Meet Bhingradiya"
        elif text == "Enrollment No.":
            p.text = "Enrollment No.: [Your Enrollment No.]"
        elif text == "Branch:":
            p.text = "Branch: [Your Branch]"
        elif text == "Name of the Company:":
            p.text = "Name of the Company: Valora Infotech"
        elif text == "Location:":
            p.text = "Location: [Location]"
            
        # CHAPTER 1
        elif text == "Company Name":
            p.text = "Company Name: Valora Infotech"
        elif text == "About the Organization":
            p.text = "About the Organization:\nValora Infotech is a forward-thinking technology company specializing in innovative software solutions and product development. They focus on delivering high-quality, robust, and scalable software products."
        elif text == "Vision and Mission":
            p.text = "Vision and Mission:\nTo deliver high-quality, robust, and scalable software products while empowering developers to build cutting-edge solutions."
        elif text == "Products/Services":
            p.text = "Products/Services:\nWeb Application Development, Full Stack Solutions, Game Development."
        elif text == "Department Assigned (Approximately 1–2 pages)":
            p.text = "Department Assigned:\nDevelopment (Full Stack Web Development)"
            
        # CHAPTER 2
        elif text == "Objective 1":
            p.text = "1. To gain practical experience in Full Stack Web Development using modern frameworks like Next.js, React, and Bun."
        elif text == "Objective 2":
            p.text = "2. To understand the software development lifecycle, from project planning to deployment."
        elif text == "Objective 3":
            p.text = "3. To develop a fully functional Resume Builder web application featuring admin dashboards, authentication, and dynamic pages."
        elif text == "Describe your responsibilities during the internship.":
            p.text = "As an Intern in the Development department, my primary responsibility was to design, develop, and test web application components. I collaborated with the team to implement the Resume Builder Application, focusing on creating dynamic React components, managing MongoDB databases, and building RESTful APIs using Next.js (Turbopack). I also handled user authentication and the integration of various pages such as the Landing Page, Experience Page, and Admin Panel Dashboard."
            
        # CHAPTER 3
        elif text == "Explain the work carried out during the internship.":
            p.text = "During the internship, I developed a comprehensive Resume Builder Web Application. Below are the key features and applications of this project:"
        elif text == "Tasks Assigned":
            p.text = (
                "Tasks Assigned & Project Features:\n"
                "- Landing Page: Designed a modern, responsive landing page to introduce the application.\n"
                "- Experience Page & Projects Page: Created dynamic pages to showcase work experience and portfolio projects.\n"
                "- Projects Items Page & Timeline Page: Implemented detailed views and a timeline component for tracking project histories.\n"
                "- Admin Panel Dashboard: Developed a secure dashboard for content management and administrative controls.\n"
                "- Project Edit & Create Model: Built functional models for users to seamlessly add and modify their project details.\n"
                "- Resume Builder Page: Engineered the core resume builder tool with real-time preview and editing capabilities.\n"
                "- Login & Signup Page: Integrated secure user authentication and session management.\n"
                "- Sitemap: Generated a sitemap for better navigation and SEO structure."
            )
        elif text == "Daily/Weekly Activities":
            p.text = (
                "Daily/Weekly Activities:\n"
                "- Week 1: Project setup, requirement analysis, and UI/UX design for the Resume Builder.\n"
                "- Week 2: Implementation of authentication (Login/Signup) and MongoDB schema design.\n"
                "- Week 3: Development of the Admin Panel Dashboard and Project management models.\n"
                "- Week 4: Building user-facing pages including the core Resume Builder, Experience Page, and Timeline.\n"
                "- Week 5: Bug fixing, performance optimization, and testing the overall application using Next.js Turbopack."
            )
        elif text == "Technologies Used":
            p.text = "Technologies Used:\nNext.js (16.1.6), React, Node.js, Bun."
        elif text == "Software/Tools Used":
            p.text = "Software/Tools Used:\nVisual Studio Code, Git, MongoDB."
        elif text == "Programming Languages (if applicable)":
            p.text = "Programming Languages:\nTypeScript, JavaScript, HTML, CSS."
        elif text == "Challenges Faced":
            p.text = "Challenges Faced:\n- Adapting to the Turbopack bundler in Next.js.\n- Managing complex state across the Resume Builder components.\n- Ensuring responsive design across various device screen sizes."
        elif text == "Solutions Implemented":
            p.text = "Solutions Implemented:\n- Utilized Next.js documentation to resolve Turbopack compatibility issues.\n- Implemented robust state management using React Context/Hooks to manage resume data.\n- Used CSS Flexbox/Grid for cross-device compatibility."
            
        # CHAPTER 4
        elif text == "Technical Skills":
            p.text = "Technical Skills:\nProficiency in Next.js and React, experience with MongoDB and NoSQL database design, server-side rendering, and API route development."
        elif text == "Communication Skills":
            p.text = "Communication Skills:\nImproved ability to articulate technical challenges and solutions during team meetings."
        elif text == "Teamwork":
            p.text = "Teamwork:\nLearned the importance of version control (Git) and collaborative development."
        elif text == "Time Management":
            p.text = "Time Management:\nSuccessfully balanced multiple feature requests and met project deadlines."
        elif text == "Problem Solving":
            p.text = "Problem Solving:\nEnhanced debugging skills and logical thinking when resolving application errors."
        elif text == "Professional Ethics":
            p.text = "Professional Ethics:\nGained an understanding of workplace professionalism, meeting etiquette, and code quality standards."
            
        # Conclusion
        elif text == "Summarize the internship experience.":
            p.text = "This summer internship at Valora Infotech has been an invaluable experience. It provided me with a deep understanding of full-stack web development and the intricacies of building a production-ready application. Working on the Resume Builder Application allowed me to apply theoretical knowledge to a practical, real-world project, greatly enhancing my technical and professional skill set."
        elif text == "Overall learning":
            p.text = "- Overall learning: Gained hands-on experience in building a complete Next.js web application."
        elif text == "Industrial exposure":
            p.text = "- Industrial exposure: Understood the agile development lifecycle and team collaboration."
        elif text == "Future scope":
            p.text = "- Future scope: The application can be extended with AI-powered resume suggestions."
        elif text == "Career benefits":
            p.text = "- Career benefits: Laid a strong foundation for my future career as a Full Stack Web Developer."
            
        # References
        elif text == "Official Documentation":
            p.text = "- Next.js Official Documentation (https://nextjs.org/docs)\n- React Documentation (https://react.dev/)"
        elif text == "Company Website":
            p.text = "- Valora Infotech Company Website"
        elif text == "IEEE Papers":
            p.text = ""
        elif text == "Books":
            p.text = "- MongoDB Official Documentation (https://www.mongodb.com/docs/)"
    
    doc.save(output_path)
    print(f"Report successfully generated from template: {output_path}")

if __name__ == '__main__':
    template_file = r"Report\Assets\Project-Summer Training Report - AY-2026_27.docx"
    output_file = "Final_Internship_Report.docx"
    fill_template(template_file, output_file)
