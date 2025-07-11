import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


const sendMail = async () => {
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
            from: "Stream Net - manthanbhai67@gmail.com",
            to: "manthanbhai67@gmail.com",
            subject: "Testing Email",
            text: "This Is Testing Text",
            html: "<strong> This Is Testing Html </strong>"
        })

        console.log("Email Sent Successfully : ", res);

    } catch (error) {
        console.log("Error While Sending Email : ", error);
    }
}
sendMail()