/**
 * main.js
 * Handles newsletter client-side validation, contact form validation, and interactive UI behaviors.
 */

(function () {
    // Newsletter Form Full-Stack Submission (Footer)
    function initNewsletter() {
        const form = document.getElementById('newsletter-form');
        const emailInput = document.getElementById('newsletter-email');
        const feedback = document.getElementById('newsletter-feedback');

        if (!form || !emailInput || !feedback) {
            return;
        }

        const submitBtn = form.querySelector('.newsletter-btn');
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
        let isSubmitting = false;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (isSubmitting) return;

            const value = emailInput.value.trim();

            if (!value) {
                feedback.textContent = 'Please enter an email address.';
                feedback.className = 'newsletter-feedback error';
                emailInput.focus();
                return;
            }

            if (!emailRegex.test(value)) {
                feedback.textContent = 'Please enter a valid email address.';
                feedback.className = 'newsletter-feedback error';
                emailInput.focus();
                return;
            }

            // Set loading state
            isSubmitting = true;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            }
            feedback.textContent = '';
            feedback.className = 'newsletter-feedback';

            try {
                const endpointsToTry = [];
                if (window.AGENTICAIM_SUBSCRIBE_URL) {
                    endpointsToTry.push(window.AGENTICAIM_SUBSCRIBE_URL);
                } else if (window.location.port === '3000') {
                    endpointsToTry.push('/api/subscribe');
                } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
                    endpointsToTry.push('http://localhost:3000/api/subscribe');
                    if (window.location.protocol !== 'file:') {
                        endpointsToTry.push('/api/subscribe');
                    }
                } else {
                    endpointsToTry.push('/api/subscribe');
                    endpointsToTry.push('http://localhost:3000/api/subscribe');
                }

                let lastError = null;
                let successData = null;

                for (const endpoint of endpointsToTry) {
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({ email: value })
                        });

                        const data = await response.json().catch(() => null);

                        if (response.ok && data && data.success) {
                            successData = data;
                            break;
                        } else if (data && data.error) {
                            lastError = data.error;
                            break;
                        } else if (response.status === 404 && endpointsToTry.length > 1) {
                            continue;
                        } else {
                            lastError = (data && data.error) ? data.error : 'Subscription failed. Please try again.';
                        }
                    } catch (err) {
                        lastError = 'Unable to connect to server. Please try again.';
                    }
                }

                if (successData) {
                    feedback.textContent = successData.message || 'Thank you for subscribing! You will receive our latest updates.';
                    feedback.className = 'newsletter-feedback success';
                    emailInput.value = '';

                    setTimeout(function () {
                        if (feedback.classList.contains('success')) {
                            feedback.textContent = '';
                            feedback.className = 'newsletter-feedback';
                        }
                    }, 6000);
                } else {
                    feedback.textContent = lastError || 'Subscription could not be processed. Please try again.';
                    feedback.className = 'newsletter-feedback error';
                }
            } catch (err) {
                feedback.textContent = 'Subscription could not be processed. Please try again.';
                feedback.className = 'newsletter-feedback error';
            } finally {
                isSubmitting = false;
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>';
                }
            }
        });

        emailInput.addEventListener('input', function () {
            if (feedback.classList.contains('error')) {
                feedback.textContent = '';
                feedback.className = 'newsletter-feedback';
            }
        });
    }

    // Contact Page Form Full-Stack Submission
    function initContactForm() {
        const contactForm = document.getElementById('contact-page-form');
        const feedback = document.getElementById('contact-feedback');
        const submitBtn = document.getElementById('contact-submit-btn');

        if (!contactForm || !feedback || !submitBtn) {
            return;
        }

        const nameInput = document.getElementById('contact-name');
        const emailInput = document.getElementById('contact-email');
        const subjectInput = document.getElementById('contact-subject');
        const messageInput = document.getElementById('contact-message');
        const honeypotInput = document.getElementById('contact-website');

        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

        let isSubmitting = false;

        // Clear feedback when user resumes typing
        [nameInput, emailInput, subjectInput, messageInput].forEach(input => {
            if (input) {
                input.addEventListener('input', () => {
                    if (feedback.classList.contains('error')) {
                        feedback.textContent = '';
                        feedback.className = 'form-feedback';
                    }
                });
            }
        });

        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Prevent duplicate submissions
            if (isSubmitting) {
                return;
            }

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const subject = subjectInput.value.trim();
            const message = messageInput.value.trim();
            const website = honeypotInput ? honeypotInput.value.trim() : '';

            // Client-side Validation
            if (!name) {
                feedback.textContent = 'Please enter your Full Name.';
                feedback.className = 'form-feedback error';
                nameInput.focus();
                return;
            }

            if (!email) {
                feedback.textContent = 'Please enter your Email Address.';
                feedback.className = 'form-feedback error';
                emailInput.focus();
                return;
            }

            if (!emailRegex.test(email)) {
                feedback.textContent = 'Please enter a valid email address.';
                feedback.className = 'form-feedback error';
                emailInput.focus();
                return;
            }

            if (!subject) {
                feedback.textContent = 'Please enter a Subject for your message.';
                feedback.className = 'form-feedback error';
                subjectInput.focus();
                return;
            }

            if (!message) {
                feedback.textContent = 'Please enter your Message.';
                feedback.className = 'form-feedback error';
                messageInput.focus();
                return;
            }

            if (message.length < 5) {
                feedback.textContent = 'Please provide a more detailed message (at least 5 characters).';
                feedback.className = 'form-feedback error';
                messageInput.focus();
                return;
            }

            // Set loading state
            isSubmitting = true;
            submitBtn.disabled = true;
            const originalBtnHtml = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span class="btn-text">Sending Message...</span>';
            feedback.textContent = '';
            feedback.className = 'form-feedback';

            try {
                // Smart API endpoint resolution:
                // If running on local static servers (like port 8000, 5500, etc.) or file://, target http://localhost:3000/api/contact
                // If running on backend (port 3000) or production domain, target /api/contact with fallback to http://localhost:3000
                const endpointsToTry = [];
                if (window.AGENTICAIM_API_URL) {
                    endpointsToTry.push(window.AGENTICAIM_API_URL);
                } else if (window.location.port === '3000') {
                    endpointsToTry.push('/api/contact');
                } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
                    endpointsToTry.push('http://localhost:3000/api/contact');
                    if (window.location.protocol !== 'file:') {
                        endpointsToTry.push('/api/contact');
                    }
                } else {
                    endpointsToTry.push('/api/contact');
                    endpointsToTry.push('http://localhost:3000/api/contact');
                }

                let lastError = null;
                let successData = null;

                for (const endpoint of endpointsToTry) {
                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify({
                                name,
                                email,
                                subject,
                                message,
                                website
                            })
                        });

                        const data = await response.json().catch(() => null);

                        if (response.ok && data && data.success) {
                            successData = data;
                            break;
                        } else if (data && data.error) {
                            lastError = data.error;
                            break;
                        } else if (response.status === 404 && endpointsToTry.length > 1) {
                            // If this dev server doesn't host /api/contact, try next endpoint
                            continue;
                        } else {
                            lastError = (data && data.error) 
                                ? data.error 
                                : 'Your message could not be sent right now. Please try again shortly.';
                        }
                    } catch (err) {
                        console.warn(`Attempt to send to ${endpoint} failed:`, err);
                        lastError = 'Unable to connect to the backend server. Please make sure the server is running on http://localhost:3000.';
                    }
                }

                if (successData) {
                    feedback.textContent = 'Thank you for contacting AgenticAim! Your message has been sent successfully. We will get back to you as soon as possible.';
                    feedback.className = 'form-feedback success';
                    contactForm.reset();
                } else {
                    feedback.textContent = lastError || 'Your message could not be sent right now. Please try again shortly.';
                    feedback.className = 'form-feedback error';
                }
            } catch (err) {
                console.error('Contact submission error:', err);
                feedback.textContent = 'Unable to connect to the backend server. Please make sure the server is running on http://localhost:3000.';
                feedback.className = 'form-feedback error';
            } finally {
                // Restore button state
                isSubmitting = false;
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        });
    }

    // FAQ Accordion Interaction
    function initFaqAccordion() {
        const faqSection = document.getElementById('faq');
        if (!faqSection) return;

        const faqCards = faqSection.querySelectorAll('.faq-card');
        const triggers = faqSection.querySelectorAll('.faq-trigger');

        triggers.forEach(trigger => {
            trigger.addEventListener('click', function () {
                const card = this.closest('.faq-card');
                const isExpanded = this.getAttribute('aria-expanded') === 'true';

                // Exclusive accordion: collapse other open cards
                faqCards.forEach(otherCard => {
                    if (otherCard !== card) {
                        otherCard.classList.remove('is-active');
                        const otherTrigger = otherCard.querySelector('.faq-trigger');
                        if (otherTrigger) {
                            otherTrigger.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                // Toggle current card
                if (isExpanded) {
                    card.classList.remove('is-active');
                    this.setAttribute('aria-expanded', 'false');
                } else {
                    card.classList.add('is-active');
                    this.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    function initAll() {
        initNewsletter();
        initContactForm();
        initFaqAccordion();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
