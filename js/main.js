/**
 * main.js
 * Handles newsletter client-side validation, contact form validation, and interactive UI behaviors.
 */

(function () {
    // Newsletter Form Validation (Footer)
    function initNewsletter() {
        const form = document.getElementById('newsletter-form');
        const emailInput = document.getElementById('newsletter-email');
        const feedback = document.getElementById('newsletter-feedback');

        if (!form || !emailInput || !feedback) {
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
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

            feedback.textContent = 'Email format validated! (Demo mode: no backend connected).';
            feedback.className = 'newsletter-feedback success';
            emailInput.value = '';

            setTimeout(function () {
                if (feedback.classList.contains('success')) {
                    feedback.textContent = '';
                    feedback.className = 'newsletter-feedback';
                }
            }, 5000);
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
                // Determine API endpoint (smart fallback for file:// and localhost)
                let apiEndpoint = window.AGENTICAIM_API_URL;
                if (!apiEndpoint) {
                    if (window.location.protocol === 'file:') {
                        apiEndpoint = 'http://localhost:3000/api/contact';
                    } else {
                        apiEndpoint = '/api/contact';
                    }
                }

                const response = await fetch(apiEndpoint, {
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
                    // Success: show designated message and reset form fields
                    feedback.textContent = 'Thank you for contacting AgenticAim! Your message has been sent successfully. We will get back to you as soon as possible.';
                    feedback.className = 'form-feedback success';
                    contactForm.reset();
                } else {
                    // Failure: display error and PRESERVE entered input values
                    const errorMsg = (data && data.error) 
                        ? data.error 
                        : 'Your message could not be sent right now. Please try again shortly.';
                    feedback.textContent = errorMsg;
                    feedback.className = 'form-feedback error';
                }
            } catch (err) {
                // Network or connection failure: preserve inputs
                console.error('Contact submission error:', err);
                const isConnectionRefused = window.location.protocol === 'file:' || err.name === 'TypeError';
                if (isConnectionRefused) {
                    feedback.textContent = 'Unable to connect to the backend server. Please make sure the server is running (run "npm start" in terminal).';
                } else {
                    feedback.textContent = 'Your message could not be sent right now. Please try again shortly.';
                }
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
