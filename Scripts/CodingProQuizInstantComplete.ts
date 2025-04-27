import Axios from "axios";

// ? Fill Details Here
const CourseDetails = {
    class: 477,
    // subject: 478 // 478 is for "Advance Full Stack"
    // subject: 482 // 484 is for "Advance Game Development (Unity)"
    // subject: 484 // 484 is for "Python"
    // subject: 485 // 484 is for "Basic Full Stack"
    subject: 486 // 484 is for "Web Development"
}

// ? Meet Credentials
// ? Fill Cookie & Authorization Here
// const Cookie = "<Your Cookie>";
// const Authorization = "<Your Authorization Token>";

// ? Script Start Here
interface Lesson {
    id: number;
    title: string;
    duration: string;
    course_id: number;
    section_id: number;
    video_type: string;
    video_url: string;
    date_added: number;
    last_modified: number;
    lesson_type: string;
    attachment: string;
    attachment_type: string;
    summary: string;
    order: number;
    video_type_for_mobile_application: string;
    video_url_for_mobile_application: string;
    duration_for_mobile_application: string;
    show_lesson: number;
}

interface Section {
    id: number;
    title: string;
    course_id: number;
    lessons: Lesson[];
}

interface Course {
    id: number;
    title: string;
    status: string;
    price: number;
    section: Section[];
    name: string;
    is_top_course: number;
    is_free_course: number;
    meta_keywords: string;
    meta_description: string;
    level: string;
    category_id: number;
    sub_category_id: number;
    language: string;
    outcomes: string;
    short_description: string;
    requirements: string;
    thumbnail: string;
}

interface CourseResponse {
    data: Course[];
    is_purchase: number;
    message: string;
    status: string;
    subject_price: number;
}

// Quiz Question Interfaces
interface SqlNullString {
    String: string;
    Valid: boolean;
}

interface SqlNullInt64 {
    Int64: number;
    Valid: boolean;
}

interface QuizQuestion {
    id: number;
    quiz_id: SqlNullInt64;
    title: SqlNullString;
    type: SqlNullString;
    number_of_options: SqlNullInt64;
    options: SqlNullString;
    correct_answers: SqlNullString;
    order: number;
    image: SqlNullString;
    option_images: SqlNullString;
}

interface QuizQuestionsResponse {
    status: string;
    message: string;
    data: QuizQuestion[];
}

// Quiz Completion Status Interface
interface QuizCompletionStatus {
    correct_answers?: number;
    is_completed: boolean;
    message: string;
    quiz_id?: number;
    total_questions?: number;
}

// Quiz Data Interface
interface Quiz {
    quiz_id: number;
    quiz_name: string;
    quiz_type: string;
    total_questions: number;
    duration: string;
    section_id?: number;
    section_title?: string;
    course_id?: number;
    course_title?: string;
}



const APIs = {
    // ? Set Quiz Result
    QuizSave: "https://codingpro.online/api/v1/timeline/save_quiz_result",

    // ? for getting Quiz  | Response File in Context is Untitled-1
    getCourse: "https://codingpro.online/api/v1/student_dash/courses/course?class=@class&subject=@subject",

    // ? For getting quiz data using quiz id | How many questions are there in the quiz | Response File in Context is Untitled-2
    QuizData: "https://codingpro.online/api/v1/timeline/quiz?quiz_id=@quizid",

    // ? For Checking quiz result using quiz id | Response File in Context is Untitled-3
    QuizResult: "https://codingpro.online/api/v1/quiz_result?quiz_id=@quizid",
}

function QuizResultSave(id:number, total_questions: number) {
    return {
        "quiz_id": id,
        "total_questions":total_questions,
        "correct_answers":total_questions - 1
    }
}

const Headers = {
    "Connection": "keep-alive",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
    "content-type": "application/json",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en,hi;q=0.9,gu;q=0.8",
    "accept": "application/json, text/plain, */*",
    "sec-ch-ua": '"Google Chrome";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "authorization": Authorization,
    "cookie": Cookie,
}

// ? Functions that Required to Run Again & Again
async function getCourse(): Promise<CourseResponse> {
    const url = APIs.getCourse.replace("@class", CourseDetails.class.toString()).replace("@subject", CourseDetails.subject.toString());
    const response = await Axios.get<CourseResponse>(url, { headers: Headers });
    return response.data;
}

function getQuizes_fromCourse(courseData: CourseResponse): Quiz[] {
    const quizes: Quiz[] = [];
    
    courseData.data.forEach(course => {
        course.section.forEach(section => {
            section.lessons.forEach(lesson => {
                if (lesson.lesson_type === "quiz") {
                    quizes.push({
                        quiz_id: lesson.id,
                        quiz_name: lesson.title,
                        quiz_type: "course_quiz",
                        total_questions: 0, // Not provided in lesson data
                        duration: lesson.duration,
                        section_id: section.id,
                        section_title: section.title,
                        course_id: course.id,
                        course_title: course.title
                    });
                }
            });
        });
    });
    
    return quizes;
}

// Additional functions needed for the main script
async function getQuizData(quizId: number): Promise<QuizQuestionsResponse> {
    const url = APIs.QuizData.replace("@quizid", quizId.toString());
    const response = await Axios.get<QuizQuestionsResponse>(url, { headers: Headers });
    return response.data;
}

async function getQuizResult(quizId: number): Promise<QuizCompletionStatus> {
    const url = APIs.QuizResult.replace("@quizid", quizId.toString());
    const response = await Axios.get<QuizCompletionStatus>(url, { headers: Headers });
    return response.data;
}

async function saveQuizResult(quizId: number, totalQuestions: number): Promise<any> {
    const url = APIs.QuizSave;
    const data = QuizResultSave(quizId, totalQuestions);
    const response = await Axios.post(url, data, { headers: Headers });
    return response.data;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main Script
(async function Main() {
    try {
        console.log("Starting Quiz Auto-Completion Script...");
        
        // Get Course Data
        console.log("Fetching course data...");
        const courseData = await getCourse();
        
        // Extract quizzes from course data
        const quizzes = getQuizes_fromCourse(courseData);
        console.log(`Found ${quizzes.length} quizzes in the course.`);
        
        // Process each quiz
        for (const quiz of quizzes) {
            console.log(`\nProcessing quiz: "${quiz.quiz_name}" (ID: ${quiz.quiz_id})`);
            
            try {
                // Check if quiz is already completed
                const quizResult = await getQuizResult(quiz.quiz_id);
                
                // If the quiz is completed but with a bad score, submit again for a better score
                if (quizResult.is_completed && 
                    quizResult.correct_answers !== undefined && 
                    quizResult.total_questions !== undefined && 
                    quizResult.correct_answers !== quizResult.total_questions - 1) {
                    
                    console.log(`Quiz was completed with ${quizResult.correct_answers}/${quizResult.total_questions} correct answers.`);
                    console.log(`This is not a near-perfect score. Submitting result again...`);
                    
                    const saveResult = await saveQuizResult(quiz.quiz_id, quizResult.total_questions);
                    console.log(`Quiz score improved successfully: ${saveResult.message}`);
                    
                    // Add delay to avoid rate limiting
                    console.log("Waiting 3 seconds before processing next quiz...");
                    await sleep(3000);
                    continue;
                }
                
                // If the quiz is already completed with a good score, skip it
                if (quizResult.is_completed) {
                    console.log(`Quiz already completed with ${quizResult.correct_answers}/${quizResult.total_questions} correct answers.`);
                    console.log('Score is already near-perfect. Skipping...');
                    continue;
                }
                
                // Quiz is not completed, get quiz questions to determine total count
                console.log("Quiz not completed yet. Fetching quiz questions...");
                const quizData = await getQuizData(quiz.quiz_id);
                const totalQuestions = quizData.data.length;
                
                if (totalQuestions === 0) {
                    console.log("Quiz has no questions. Skipping...");
                    continue;
                }
                
                console.log(`Quiz has ${totalQuestions} questions. Submitting result...`);
                
                // Submit quiz result
                const saveResult = await saveQuizResult(quiz.quiz_id, totalQuestions);
                console.log(`Quiz completed successfully: ${saveResult.message}`);
                
                // Add delay to avoid rate limiting
                console.log("Waiting 3 seconds before processing next quiz...");
                await sleep(3000);
                
            } catch (error) {
                console.error(`Error processing quiz ${quiz.quiz_id}:`, error);
            }
        }
        
        console.log("\nQuiz auto-completion process finished!");
        
    } catch (error) {
        console.error("Error in main function:", error);
    }
})();