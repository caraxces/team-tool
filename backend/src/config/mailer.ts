import nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/json-transport';

// This configuration uses Ethereal for testing.
// Ethereal creates a temporary, free SMTP account to test email sending.
// Sent emails are not delivered to real inboxes but are caught in an Ethereal mailbox.
// For production, replace this with your actual SMTP provider (e.g., SendGrid, Mailgun, AWS SES).

let transporter: nodemailer.Transporter;

const initializeMailer = async () => {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    console.log("****************************************************");
    console.log("Ethereal Mail Test Account Created");
    console.log(`User: ${testAccount.user}`);
    console.log(`Pass: ${testAccount.pass}`);
    console.log("Check the console after requesting a password change for the specific preview URL.");
    console.log("****************************************************");


    // create reusable transporter object using the default SMTP transport
    transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
};

export const sendEmail = async (options: MailOptions) => {
    if (!transporter) {
        await initializeMailer();
    }

    try {
        let info = await transporter.sendMail(options);
        console.log("Message sent: %s", info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Could not send email.");
    }
};

initializeMailer().catch(console.error); 