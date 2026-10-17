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

    // Contact Page Form Validation
    function initContactForm() {
        const contactForm = document.getElementById('contact-page-form');
        const feedback = document.getElementById('contact-feedback');

        if (!contactForm || !feedback) {
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const subject = document.getElementById('contact-subject').value.trim();
            const message = document.getElementById('contact-message').value.trim();

            if (!name || !email || !subject || !message) {
                feedback.textContent = 'Please complete all fields before submitting.';
                feedback.className = 'form-feedback error';
                return;
            }

            if (!emailRegex.test(email)) {
                feedback.textContent = 'Please enter a valid email address.';
                feedback.className = 'form-feedback error';
                return;
            }

            feedback.textContent = 'Thank you! Your message format has been validated. (Demo mode: no live backend).';
            feedback.className = 'form-feedback success';
            contactForm.reset();

            setTimeout(function () {
                if (feedback.classList.contains('success')) {
                    feedback.textContent = '';
                    feedback.className = 'form-feedback';
                }
            }, 5000);
        });
    }

    function initAll() {
        initNewsletter();
        initContactForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
})();
