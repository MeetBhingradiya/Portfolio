import nodemailer from 'nodemailer';
import { Config } from '@Config';

function createEmailTransport() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_APP_PASS) {
        throw new Error('SMTP configuration is incomplete');
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: Config.Environment === 'production',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_APP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

export {
    createEmailTransport
}