/**
 * team.js
 * Handles scroll-triggered reveal animations using Intersection Observer and interactive behaviors.
 */

(function () {
    function initTeamScrollAnimations() {
        const revealElements = document.querySelectorAll('.reveal-on-scroll');
        
        if (!revealElements.length) {
            return;
        }

        // Apply staggered index to team cards
        const teamCards = document.querySelectorAll('.team-card');
        teamCards.forEach((card, index) => {
            card.style.setProperty('--card-index', index);
        });

        // Check if IntersectionObserver is supported
        if ('IntersectionObserver' in window) {
            const observerOptions = {
                root: null,
                rootMargin: '0px 0px 40px 0px',
                threshold: 0.05
            };

            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                        obs.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            revealElements.forEach(el => observer.observe(el));
        } else {
            // Fallback: reveal immediately
            revealElements.forEach(el => el.classList.add('is-revealed'));
        }

        // Smooth scroll for anchor links (e.g. #team)
        const teamAnchorLinks = document.querySelectorAll('a[href^="#"]');
        teamAnchorLinks.forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId && targetId !== '#' && targetId.startsWith('#')) {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        targetEl.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTeamScrollAnimations);
    } else {
        initTeamScrollAnimations();
    }
})();

