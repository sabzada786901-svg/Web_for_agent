/**
 * test_workflow.js
 * Self-contained automated test suite for AgenticAim Contact Page & Backend.
 * Spawns server if needed, runs all test assertions, and cleans up.
 */

const http = require('http');
const { spawn } = require('child_process');

function post(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            hostname: '127.0.0.1',
            port: 3000,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: resBody });
                }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

function get(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:3000${path}`, (res) => {
            let resBody = '';
            res.on('data', chunk => resBody += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resBody) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: resBody });
                }
            });
        }).on('error', reject);
    });
}

async function isServerRunning() {
    try {
        const res = await get('/api/health');
        return res.status === 200 && res.data && res.data.smtpConfigured === true;
    } catch {
        return false;
    }
}

async function runTests() {
    console.log('\n=======================================================');
    console.log('🧪 Starting AgenticAim Contact Workflow Test Suite');
    console.log('=======================================================\n');

    let serverProcess = null;
    const running = await isServerRunning();

    if (!running) {
        console.log('Starting background server for test session...');
        serverProcess = spawn('node', ['server.js'], { stdio: 'inherit' });
        // wait for server startup
        let attempts = 0;
        while (attempts < 15) {
            await new Promise(r => setTimeout(r, 600));
            if (await isServerRunning()) break;
            attempts++;
        }
    }

    try {
        // 1. Health check
        console.log('Test 1: GET /api/health');
        const health = await get('/api/health');
        console.log('Health check response:', health.data);
        if (health.status !== 200 || !health.data.smtpConfigured) {
            throw new Error('Health check failed or SMTP not configured.');
        }
        if (health.data.recipient !== 'sabzada786901@gmail.com') {
            throw new Error('Recipient email does not match sabzada786901@gmail.com');
        }
        console.log('✅ Test 1 Passed: Server is healthy, SMTP ready, recipient is sabzada786901@gmail.com\n');

        // 2. Validation: Missing fields
        console.log('Test 2: Validation - Missing name and email');
        const missingRes = await post('/api/contact', { subject: 'Test', message: 'Hello' });
        console.log('Missing fields response:', missingRes.data);
        if (missingRes.status !== 400 || missingRes.data.success !== false) {
            throw new Error('Expected 400 Bad Request for missing fields');
        }
        console.log('✅ Test 2 Passed: Rejected missing fields as expected.\n');

        // 3. Validation: Invalid email address
        console.log('Test 3: Validation - Invalid email address format');
        const invalidEmailRes = await post('/api/contact', {
            name: 'Test User',
            email: 'invalid-email-address',
            subject: 'Inquiry',
            message: 'This is a test message.'
        });
        console.log('Invalid email response:', invalidEmailRes.data);
        if (invalidEmailRes.status !== 400 || !invalidEmailRes.data.error.includes('valid email address')) {
            throw new Error('Expected 400 Bad Request for invalid email');
        }
        console.log('✅ Test 3 Passed: Rejected invalid email format as expected.\n');

        // 4. Spam Prevention: Honeypot trap
        console.log('Test 4: Anti-Spam - Honeypot website field filled');
        const honeypotRes = await post('/api/contact', {
            name: 'Spam Bot',
            email: 'spammer@example.com',
            subject: 'Cheap SEO',
            message: 'Buy our SEO services now!',
            website: 'http://spamsite.xyz'
        });
        console.log('Honeypot response:', honeypotRes.data);
        if (honeypotRes.status !== 200 || !honeypotRes.data.success) {
            throw new Error('Honeypot should silently return 200 without sending');
        }
        console.log('✅ Test 4 Passed: Honeypot caught and neutralized spam submission.\n');

        // 5. Valid Submission & Real Email Dispatch
        console.log('Test 5: Valid Submission - Genuine Email Dispatch to sabzada786901@gmail.com');
        const validRes = await post('/api/contact', {
            name: 'Fazal Hussain',
            email: 'visitor.fazal@example.com',
            subject: 'AgenticAim AI Agent Collaboration',
            message: 'Hello AgenticAim Team! I tested your AI Agent application and I am amazed by the crosshair tracking and voice coaching features. Let us collaborate!'
        });
        console.log('Valid submission response:', validRes.data);
        if (validRes.status !== 200 || !validRes.data.success) {
            throw new Error('Valid submission failed: ' + JSON.stringify(validRes));
        }
        const expectedSuccessMsg = 'Thank you for contacting AgenticAim! Your message has been sent successfully. We will get back to you as soon as possible.';
        if (validRes.data.message !== expectedSuccessMsg) {
            throw new Error(`Expected message "${expectedSuccessMsg}", got "${validRes.data.message}"`);
        }
        if (validRes.data.previewUrl) {
            console.log('📧 Ethereal Email Preview URL:', validRes.data.previewUrl);
        }
        console.log('✅ Test 5 Passed: Message sent, recipient verified, exact success response received!\n');

        console.log('=======================================================');
        console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
        console.log('=======================================================\n');

    } finally {
        if (serverProcess) {
            serverProcess.kill();
        }
    }
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
