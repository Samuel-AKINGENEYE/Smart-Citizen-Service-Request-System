const nodemailer = require('nodemailer');

// Configure email (use ethereal.email for testing)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
        user: 'test@ethereal.email',
        pass: 'test123'
    }
});

async function sendStatusUpdateEmail(userEmail, userName, requestId, newStatus, referenceNumber) {
    const statusMessages = {
        'in_progress': 'Your request is now being processed',
        'resolved': 'Your request has been resolved',
        'rejected': 'Your request has been reviewed'
    };
    
    const message = statusMessages[newStatus] || `Your request status has been updated to ${newStatus}`;
    
    const mailOptions = {
        from: '"Smart Citizen System" <noreply@scrs.gov>',
        to: userEmail,
        subject: `Request ${referenceNumber} Status Update`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2563eb;">Smart Citizen Request System</h2>
                <p>Dear ${userName},</p>
                <p>${message}</p>
                <p><strong>Request #:</strong> ${referenceNumber}</p>
                <p><strong>New Status:</strong> ${newStatus}</p>
                <p>Track your request at: http://localhost:8000</p>
                <hr>
                <p style="color: #666; font-size: 12px;">Thank you for using Smart Citizen System</p>
            </div>
        `
    };
    
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email error:', error);
        return false;
    }
}

module.exports = { sendStatusUpdateEmail };
