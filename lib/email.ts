import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport(
    process.env.MAILER_DSN_IT || {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    }
);

export async function sendPasswordResetEmail(
    to: string,
    token: string
): Promise<void> {
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password/${token}`; // Assuming NEXT_PUBLIC_BASE_URL is set

    await transporter.sendMail({
        from: process.env.MAILER_FROM_IT || process.env.EMAIL_FROM,
        to: to,
        subject: 'Password Reset Request',
        html: `
            <p>You requested a password reset</p>
            <p>Click this <a href="${resetLink}">link</a> to reset your password.</p>
            <p>This link is valid for 1 hour.</p>
        `,
    });
}
