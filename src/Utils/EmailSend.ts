/**
 *  @FileID          Utils\EmailSend.ts
 *  @Description     Currently, there is no description available.
 *  @Author          Meet Bhingradiya (@MeetBhingradiya)
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  @license
 *  Copyright (c) 2021 - 2025 Meet Bhingradiya.
 *  All rights reserved.
 *  
 *  This file is a proprietary component of Meet Bhingradiya's Portfolio project
 *  and is protected under applicable copyright and intellectual property laws.
 *  Unauthorized use, reproduction, distribution, folks, or modification of this file,
 *  via any medium even in public/private repository, is strictly prohibited without
 *  prior written consent from the author, modifier or the organization.
 *  
 *  -----------------------------------------------------------------------------
 *  
 *  GitHub® is a registered trademark of Microsoft Corporation. This project 
 *  is hosted on GitHub, which is a repository hosting service provided by Microsoft. 
 *  This project is not officially affiliated with, endorsed by, or in any way associated 
 *  with GitHub or Microsoft Corporation.
 *  
 *  -----------------------------------------------------------------------------
 *  Last Updated on Version: 1.0.10
 *  -----------------------------------------------------------------------------
 *  @created 28/01/25 12:00 PM IST (Kolkata +5:30 UTC)
 *  @modified 22/02/25 7:26 PM IST (Kolkata +5:30 UTC)
 */


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
//         port: 587,
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