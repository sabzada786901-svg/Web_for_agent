/**
 * server.js
 * Production-ready Express & Nodemailer backend for AgenticAim website.
 * Serves static frontend assets and handles secure contact form submissions.
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;
const RECIPIENT_EMAIL = process.env.CONTACT_EMAIL_TO || 'sabzada786901@gmail.com';

// ------------------------------------------------------------------
// 1. CORS Configuration
// ------------------------------------------------------------------
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
    : ['*'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy: Not allowed by Access-Control-Allow-Origin'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

// ------------------------------------------------------------------
// 2. Body Parsing Middleware
// ------------------------------------------------------------------
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: false, limit: '50kb' }));

// ------------------------------------------------------------------
// 3. Static File Serving
// ------------------------------------------------------------------
app.use(express.static(path.join(__dirname, '.')));

// ------------------------------------------------------------------
// 4. Rate Limiting for Contact Submissions
// ------------------------------------------------------------------
const windowMinutes = parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15;
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX, 10) || 5;

const contactLimiter = rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: `Too many submissions from this connection. Please try again after ${windowMinutes} minutes.`
    }
});

// ------------------------------------------------------------------
// 5. Nodemailer Transporter Setup
// ------------------------------------------------------------------
let transporter = null;
let isSmtpConfigured = false;
let testAccountInfo = null;

async function setupTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = (process.env.SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

    if (user && pass) {
        const transportConfig = (host.includes('gmail') || host === 'smtp.gmail.com')
            ? {
                service: 'gmail',
                auth: { user, pass }
            }
            : {
                host,
                port,
                secure,
                auth: { user, pass },
                tls: {
                    rejectUnauthorized: false
                }
            };

        transporter = nodemailer.createTransport(transportConfig);

        try {
            await transporter.verify();
            isSmtpConfigured = true;
            console.log(`[SMTP] Successfully connected to mail service as ${user}`);
        } catch (err) {
            isSmtpConfigured = false;
            console.error(`[SMTP ERROR] Failed to connect as ${user}:`, err.message);
        }
    } else if (process.env.USE_TEST_ACCOUNT === 'true') {
        try {
            console.log('[SMTP] USE_TEST_ACCOUNT=true detected. Creating Ethereal test account...');
            const testAccount = await nodemailer.createTestAccount();
            transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });
            isSmtpConfigured = true;
            testAccountInfo = testAccount;
            console.log(`[SMTP] Ethereal test account created: ${testAccount.user}`);
        } catch (err) {
            console.error('[SMTP ERROR] Failed to create test account:', err.message);
        }
    } else {
        isSmtpConfigured = false;
        console.warn('------------------------------------------------------------');
        console.warn('[NOTICE] SMTP credentials are not yet configured in .env');
        console.warn('To enable real email delivery to ' + RECIPIENT_EMAIL + ':');
        console.warn('1. Open .env');
        console.warn('2. Set SMTP_USER=your_email@gmail.com');
        console.warn('3. Set SMTP_PASS=your_16_digit_app_password');
        console.warn('4. Restart the server');
        console.warn('------------------------------------------------------------');
    }
}

// ------------------------------------------------------------------
// 6. Sanitization Helpers
// ------------------------------------------------------------------
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function stripHeaderBreaks(text) {
    if (!text) return '';
    return String(text).replace(/[\r\n\t]/g, ' ').trim();
}

// ------------------------------------------------------------------
// 7. API Routes
// ------------------------------------------------------------------

// Health Check & Diagnostic Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'AgenticAim Contact API',
        smtpConfigured: isSmtpConfigured,
        recipient: RECIPIENT_EMAIL,
        rateLimit: {
            windowMinutes,
            maxRequests
        },
        hasTestAccount: !!testAccountInfo
    });
});

// Contact Form Submission Endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
    try {
        const { name, email, subject, message, website } = req.body;

        // 1. Honeypot check (Spam bots usually fill invisible website/hp fields)
        if (website && String(website).trim().length > 0) {
            console.warn(`[SPAM DETECTED] Honeypot triggered from IP ${req.ip}`);
            // Return fake success to confuse bots without sending email
            return res.status(200).json({
                success: true,
                message: 'Thank you for contacting AgenticAim! Your message has been sent successfully. We will get back to you as soon as possible.'
            });
        }

        // 2. Field existence check
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields (Full Name, Email Address, Subject, and Message) are required.'
            });
        }

        // 3. String trimming & basic typing
        const rawName = String(name).trim();
        const rawEmail = String(email).trim().toLowerCase();
        const rawSubject = String(subject).trim();
        const rawMessage = String(message).trim();

        // 4. Length limits
        if (rawName.length < 2 || rawName.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Full Name must be between 2 and 100 characters.'
            });
        }

        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        if (rawEmail.length < 5 || rawEmail.length > 254 || !emailRegex.test(rawEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid email address.'
            });
        }

        if (rawSubject.length < 2 || rawSubject.length > 150) {
            return res.status(400).json({
                success: false,
                error: 'Subject must be between 2 and 150 characters.'
            });
        }

        if (rawMessage.length < 5 || rawMessage.length > 5000) {
            return res.status(400).json({
                success: false,
                error: 'Message must be between 5 and 5000 characters.'
            });
        }

        // 5. Header Injection Defense (strip newlines from header fields)
        const cleanName = stripHeaderBreaks(rawName);
        const cleanSubject = stripHeaderBreaks(rawSubject);
        const cleanEmail = stripHeaderBreaks(rawEmail);

        // 6. Check SMTP readiness
        if (!isSmtpConfigured || !transporter) {
            console.error('[SUBMISSION ERROR] Email transporter is not configured. Received contact request from:', cleanEmail);
            return res.status(503).json({
                success: false,
                error: 'Email delivery service is currently not configured on the server. Please configure SMTP credentials in .env.'
            });
        }

        // 7. Compose Email Content
        const submissionDate = new Date().toUTCString();
        const senderIp = req.ip || req.connection.remoteAddress || 'Unknown';

        const plainTextContent = `
New Contact Message — AgenticAim
=============================================
Sender Name:    ${cleanName}
Sender Email:   ${cleanEmail}
Subject:        ${cleanSubject}
Submission Date: ${submissionDate}
Client IP:      ${senderIp}

Message:
---------------------------------------------
${rawMessage}
=============================================
(Sent via AgenticAim Official Contact Form)
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
      Sent from AgenticAim Website &bull; Client IP: ${escapeHtml(senderIp)}
    </div>
  </div>
</body>
</html>
`.trim();

        // 8. Configure mail options
        const smtpUser = (process.env.SMTP_USER || '').trim();
        const fromAddress = (process.env.SMTP_HOST || '').includes('gmail')
            ? `"AgenticAim Contact" <${smtpUser}>`
            : (process.env.SMTP_FROM || `"AgenticAim Contact" <${smtpUser || 'noreply@agenticaim.com'}>`);
        
        const mailOptions = {
            from: fromAddress,
            to: RECIPIENT_EMAIL,
            replyTo: `"${cleanName}" <${cleanEmail}>`,
            subject: `New Contact Message — AgenticAim: ${cleanSubject}`,
            text: plainTextContent,
            html: htmlContent
        };

        // 9. Send the message via Nodemailer
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL DELIVERED] Message sent successfully to ${RECIPIENT_EMAIL}. MessageId: ${info.messageId}`);

        let previewUrl = null;
        if (testAccountInfo) {
            previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`[TEST PREVIEW URL] View email: ${previewUrl}`);
        }

        return res.status(200).json({
            success: true,
            message: 'Thank you for contacting AgenticAim! Your message has been sent successfully. We will get back to you as soon as possible.',
            previewUrl: previewUrl || undefined
        });

    } catch (err) {
        console.error('[SENDMAIL ERROR] Failed to send email:', err);
        return res.status(500).json({
            success: false,
            error: 'Your message could not be sent right now. Please try again shortly.'
        });
    }
});

// Fallback for contact page navigation
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// Start Server
app.listen(PORT, async () => {
    console.log(`=======================================================`);
    console.log(`AgenticAim Server running at http://localhost:${PORT}`);
    console.log(`Recipient Email: ${RECIPIENT_EMAIL}`);
    console.log(`=======================================================`);
    await setupTransporter();
});

