const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
    // Handle CORS preflight
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
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ success: false, error: 'Method Not Allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const { name, email, subject, message, website } = body;

        // 1. Anti-spam honeypot
        if (website && String(website).trim().length > 0) {
            return {
                statusCode: 200,
                headers: { 
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Thank you for contacting AgenticAim! Your message has been sent successfully. We will get back to you as soon as possible.'
                })
            };
        }

        // 2. Validate fields
        if (!name || !email || !subject || !message) {
            return {
                statusCode: 400,
                headers: { 
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'All fields (Full Name, Email Address, Subject, and Message) are required.'
                })
            };
        }

        const rawName = String(name).trim();
        const rawEmail = String(email).trim().toLowerCase();
        const rawSubject = String(subject).trim();
        const rawMessage = String(message).trim();

        if (rawName.length < 2 || rawName.length > 100) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, error: 'Full Name must be between 2 and 100 characters.' })
            };
        }

        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        if (rawEmail.length < 5 || rawEmail.length > 254 || !emailRegex.test(rawEmail)) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, error: 'Please provide a valid email address.' })
            };
        }

        if (rawSubject.length < 2 || rawSubject.length > 150) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, error: 'Subject must be between 2 and 150 characters.' })
            };
        }

        if (rawMessage.length < 5 || rawMessage.length > 5000) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, error: 'Message must be between 5 and 5000 characters.' })
            };
        }

        // Header injection protection
        const cleanName = rawName.replace(/[\r\n\t]/g, ' ').trim();
        const cleanSubject = rawSubject.replace(/[\r\n\t]/g, ' ').trim();
        const cleanEmail = rawEmail.replace(/[\r\n\t]/g, ' ').trim();

        const recipientEmail = process.env.CONTACT_EMAIL_TO || 'sabzada786901@gmail.com';
        const smtpUser = (process.env.SMTP_USER || '').trim();
        const smtpPass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

        if (!smtpUser || !smtpPass) {
            console.error('[NETLIFY] SMTP credentials not set in environment variables');
            return {
                statusCode: 503,
                headers: { 
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Email delivery is currently not configured on Netlify. Please add SMTP_USER and SMTP_PASS in Netlify Site Settings > Environment variables.'
                })
            };
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        const submissionDate = new Date().toUTCString();
        const clientIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'Unknown';

        const escapeHtml = (str) => String(str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        const plainTextContent = `
New Contact Message — AgenticAim
=============================================
Sender Name:    ${cleanName}
Sender Email:   ${cleanEmail}
Subject:        ${cleanSubject}
Submission Date: ${submissionDate}
Client IP:      ${clientIp}

Message:
---------------------------------------------
${rawMessage}
=============================================
(Sent via AgenticAim Official Contact Form - https://agenticaim.online)
`.trim();

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fa; margin: 0; padding: 24px; color: #1e293b; }
  .email-card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 13, 60, 0.08); border: 1px solid #e2e8f0; }
  .email-header { background: linear-gradient(135deg, #000d3c 0%, #170d38 100%); padding: 28px 32px; border-bottom: 3px solid #8b3dff; }
  .brand-title { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; }
  .brand-agentic { color: #8b3dff; }
  .email-subtitle { color: #94a3b8; font-size: 13px; margin: 6px 0 0; text-transform: uppercase; letter-spacing: 1px; }
  .email-body { padding: 32px; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  .info-table td { padding: 10px 12px; font-size: 14.5px; border-bottom: 1px solid #f1f5f9; }
  .info-table td.label { font-weight: 600; color: #64748b; width: 120px; vertical-align: top; }
  .info-table td.value { color: #000d3c; font-weight: 500; }
  .message-box { background: #f8fafc; border-left: 4px solid #8b3dff; padding: 18px 20px; border-radius: 6px; font-size: 15px; line-height: 1.65; color: #1e293b; white-space: pre-wrap; word-break: break-word; }
  .reply-action { margin-top: 26px; text-align: center; }
  .reply-btn { display: inline-block; background: linear-gradient(135deg, #8b3dff 0%, #5b13b9 100%); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; }
  .email-footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>
  <div class="email-card">
    <div class="email-header">
      <div class="brand-title"><span class="brand-agentic">Agentic</span>Aim</div>
      <div class="email-subtitle">New Contact Form Submission</div>
    </div>
    <div class="email-body">
      <table class="info-table">
        <tr>
          <td class="label">Sender Name:</td>
          <td class="value"><strong>${escapeHtml(cleanName)}</strong></td>
        </tr>
        <tr>
          <td class="label">Email Address:</td>
          <td class="value"><a href="mailto:${escapeHtml(cleanEmail)}" style="color: #8b3dff; text-decoration: none;">${escapeHtml(cleanEmail)}</a></td>
        </tr>
        <tr>
          <td class="label">Subject:</td>
          <td class="value">${escapeHtml(cleanSubject)}</td>
        </tr>
        <tr>
          <td class="label">Received:</td>
          <td class="value">${escapeHtml(submissionDate)}</td>
        </tr>
      </table>

      <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; margin: 0 0 10px;">Message:</h4>
      <div class="message-box">${escapeHtml(rawMessage)}</div>

      <div class="reply-action">
        <a href="mailto:${escapeHtml(cleanEmail)}?subject=${encodeURIComponent('Re: ' + cleanSubject)}" class="reply-btn">Direct Reply to ${escapeHtml(cleanName)}</a>
      </div>
    </div>
    <div class="email-footer">
      Sent from AgenticAim Website (https://agenticaim.online) &bull; Client IP: ${escapeHtml(clientIp)}
    </div>
  </div>
</body>
</html>
`.trim();

        const mailOptions = {
            from: `"AgenticAim Contact" <${smtpUser}>`,
            to: recipientEmail,
            replyTo: `"${cleanName}" <${cleanEmail}>`,
            subject: `New Contact Message — AgenticAim: ${cleanSubject}`,
            text: plainTextContent,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[NETLIFY] Email delivered to ${recipientEmail}. MessageId: ${info.messageId}`);

        return {
            statusCode: 200,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Thank you for contacting AgenticAim! Your message has been sent successfully. We will get back to you as soon as possible.'
            })
        };

    } catch (err) {
        console.error('[NETLIFY SEND ERROR]', err);
        return {
            statusCode: 500,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: false,
                error: err.message ? `Email delivery failed: ${err.message}` : 'Your message could not be sent right now. Please try again shortly.'
            })
        };
    }
};
