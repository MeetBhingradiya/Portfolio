// import nodemailer from 'nodemailer';

/**
 * Send Email using Nodemailer
 * @param {string} to Email Address to send email
 * @param {string} subject Email Subject
 * @param {string} html Email Body
 * @returns {Promise<boolean>} Email Sent Status
 */
// async function SendEmail(to: string, subject: string, html: string): Promise<boolean> {
//     const transporter = nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: 465,
//         secure: true,
//         auth: {
//             user: process.env.EMAIL_USER,
//             pass: process.env.EMAIL_PASS
//         }
//     });

//     const info = await transporter.sendMail({
//         from: process.env.EMAIL_FROM,
//         to,
//         subject,
//         html
//     });

//     return info.accepted.length > 0;
// }

// export { SendEmail };