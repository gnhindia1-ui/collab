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
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #0056b3;">Password Reset Request</h2>
                </div>
                <p>Hello,</p>
                <p>You recently requested to reset the password for your account. Click the button below to proceed.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #007bff; color: #ffffff; padding: 12px 25px; border-radius: 5px; text-decoration: none; font-weight: bold;">
                        Reset Your Password
                    </a>
                </p>
                <p>If you did not request a password reset, please ignore this email or contact support if you have any concerns.</p>
                <p>This password reset link is valid for 1 hour.</p>
                <p>Thanks,</p>
                <p>The [Your Application Name] Team</p>
                <div style="text-align: center; margin-top: 20px; font-size: 0.8em; color: #888;">
                    <p>&copy; ${new Date().getFullYear()} [Your Application Name]. All rights reserved.</p>
                </div>
            </div>
        `,
    });
}
