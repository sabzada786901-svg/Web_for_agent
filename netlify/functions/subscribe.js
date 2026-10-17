const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Accept',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { email } = body;

        const rawEmail = String(email || '').trim().toLowerCase();
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

        if (rawEmail.length < 5 || rawEmail.length > 254 || !emailRegex.test(rawEmail)) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, error: 'Please provide a valid email address.' })
            };
        }

        const cleanEmail = rawEmail.replace(/[\r\n\t]/g, ' ').trim();
        const recipientEmail = process.env.CONTACT_EMAIL_TO || 'sabzada786901@gmail.com';
        const smtpUser = (process.env.SMTP_USER || '').trim();
        const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
        const submissionDate = new Date().toUTCString();

        if (smtpUser && smtpPass) {
            try {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: { user: smtpUser, pass: smtpPass }
                });

                await transporter.sendMail({
                    from: `"AgenticAim Newsletter" <${smtpUser}>`,
                    to: recipientEmail,
                    replyTo: cleanEmail,
                    subject: `New Newsletter Subscriber — AgenticAim: ${cleanEmail}`,
                    text: `New subscriber joined AgenticAim newsletter:\n\nEmail: ${cleanEmail}\nDate: ${submissionDate}`,
                    html: `
                        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; background: #f8fafc; border-radius: 10px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0;">
                            <h3 style="color: #000d3c; margin-top: 0; font-size: 20px;">New Newsletter Subscription</h3>
                            <p style="color: #475569; font-size: 14px;">A new visitor has subscribed to AgenticAim updates:</p>
                            <p><strong>Email:</strong> <a href="mailto:${cleanEmail}" style="color: #8b3dff;">${cleanEmail}</a></p>
                            <p><strong>Date:</strong> ${submissionDate}</p>
                        </div>
                    `.trim()
                });
                console.log(`[NETLIFY] Subscriber notification sent for ${cleanEmail}`);
            } catch (mailErr) {
                console.warn('[NETLIFY SUBSCRIBE MAIL WARNING]', mailErr.message);
            }
        }

        return {
            statusCode: 200,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Thank you for subscribing! You will receive our latest updates.'
            })
        };
    } catch (err) {
        console.error('[NETLIFY SUBSCRIBE ERROR]', err);
        return {
            statusCode: 500,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: 'Subscription could not be processed right now. Please try again shortly.'
            })
        };
    }
};
