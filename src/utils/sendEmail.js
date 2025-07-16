import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const generateEmailContent = ({ data, type }) => {
    let content = "";
    switch (type) {
        case type === "forget-password":
            content = `
                <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 40px auto; background: #f4f8fb; padding: 32px 28px; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.07);">
                    <h2 style="color: #2563eb; margin-bottom: 12px;">Password Reset OTP</h2>
                    <p style="font-size: 16px; color: #22223b; margin-bottom: 8px;">
                        Hello${data?.username ? ` ${data.username} ` : data?.email ? ` ${data.email} ` : ''},
                    </p>
                    <p style="font-size: 15px; color: #4a5568; margin-bottom: 18px;">
                        We received a request to reset your password for your Stream Net account.
                    </p>
                    <div style="background: #fff; border-radius: 6px; padding: 24px 0; text-align: center; margin: 24px 0;">
                        <span style="display: block; font-size: 15px; color: #64748b; margin-bottom: 10px;">Your One-Time Password (OTP) is:</span>
                        <span style="font-size: 32px; letter-spacing: 8px; color: #2563eb; font-weight: bold; background: #e0e7ff; padding: 10px 24px; border-radius: 6px; display: inline-block;">
                            ${data?.otp || '------'}
                        </span>
                    </div>
                    <p style="font-size: 14px; color: #718096; margin-bottom: 8px;">
                        Please enter this OTP in the password reset page to proceed. This OTP is valid for 10 minutes.
                    </p>
                </div>
            `
            break;

        default:
            content = ""
            break;

    }
    return content;
}

const sendEmail = async ({ email, type, data, text, subject }) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASS,
            },
        });

        const res = await transporter.sendMail({
            from: `Stream Net - ${process.env.EMAIL} `,
            to: email,
            subject: subject,
            text: text,
            html: `${generateEmailContent({ type, data })}`
        })

        console.log("Email Sent Successfully : ", res);

    } catch (error) {
        console.log("Error While Sending Email : ", error);
    }
}

export { sendEmail }