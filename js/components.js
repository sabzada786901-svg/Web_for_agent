/**
 * components.js
 * Injects shared Header and Footer components dynamically across all pages for AgenticAim.
 */

(function () {
    // Determine active page
    const currentPath = window.location.pathname.toLowerCase();
    const isAbout = currentPath.endsWith('about.html');
    const isServices = currentPath.endsWith('services.html');
    const isContact = currentPath.endsWith('contact.html');
    const isHome = currentPath.endsWith('index.html') || (!isAbout && !isServices && !isContact);

    // Shared Header Template with AgenticAim branding
    const headerHTML = `
        <header class="site-header">
            <div class="header-container">
                <a href="index.html" class="logo" aria-label="AgenticAim Home">
                    <span class="logo-icon"><i class="fa-solid fa-crosshairs"></i></span>
                    <span class="brand-name">
                        <span class="brand-agentic">Agentic</span><span class="brand-aim">Aim</span>
                    </span>
                </a>

                <nav aria-label="Main Navigation">
                    <ul class="nav-menu">
                        <li><a href="index.html" class="nav-link ${isHome ? 'active' : ''}">Home</a></li>
                        <li><a href="about.html" class="nav-link ${isAbout ? 'active' : ''}">About</a></li>
                        <li><a href="services.html" class="nav-link ${isServices ? 'active' : ''}">Services</a></li>
                        <li><a href="contact.html" class="nav-link ${isContact ? 'active' : ''}">Contact</a></li>
                    </ul>
                </nav>

                <div class="header-actions">
                    <a href="contact.html" class="btn-primary">Get Started</a>
                    <button id="hamburger-btn" class="hamburger-btn" aria-label="Toggle navigation drawer" aria-expanded="false">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        </header>

        <!-- Sidebar Navigation Drawer -->
        <div id="sidebar-backdrop" class="sidebar-backdrop" aria-hidden="true"></div>
        <aside id="sidebar-drawer" class="sidebar-drawer" aria-label="Mobile Navigation Drawer" aria-hidden="true">
            <div class="sidebar-header">
                <a href="index.html" class="logo" aria-label="AgenticAim Home">
                    <span class="logo-icon"><i class="fa-solid fa-crosshairs"></i></span>
                    <span class="brand-name">
                        <span class="brand-agentic">Agentic</span><span class="brand-aim">Aim</span>
                    </span>
                </a>
                <button id="sidebar-close-btn" class="sidebar-close-btn" aria-label="Close navigation">&times;</button>
            </div>

            <ul class="sidebar-nav">
                <li><a href="index.html" class="sidebar-nav-link ${isHome ? 'active' : ''}">Home</a></li>
                <li><a href="about.html" class="sidebar-nav-link ${isAbout ? 'active' : ''}">About</a></li>
                <li><a href="services.html" class="sidebar-nav-link ${isServices ? 'active' : ''}">Services</a></li>
                <li><a href="contact.html" class="sidebar-nav-link ${isContact ? 'active' : ''}">Contact</a></li>
            </ul>

            <div class="sidebar-cta">
                <a href="contact.html" class="btn-primary">Get Started</a>
            </div>
        </aside>
    `;

    // Shared Footer Template strictly preserving the exact specifications
    const footerHTML = `
        <footer>
            <div class="foot">
                <!-- Column 1: Contact us -->
                <div class="footer-col col-contact">
                    <h3>Contact us<div class="underline"><span></span></div></h3>
                    <p class="contact-desc">
                        Empowering competitive gaming through cutting-edge AI telemetry, neural voice coaching, and high-performance hardware optimization. Connect with our engineering team for inquiries and partnerships.
                    </p>
                    <a href="mailto:sabzada786901@gmail.com" class="footer-email">sabzada786901@gmail.com</a>
                    <a href="tel:+923288394863" class="footer-phone">+92 328 8394863</a>
                </div>

                <!-- Column 2: links -->
                <div class="footer-col col-links">
                    <h3>links<div class="underline"><span></span></div></h3>
                    <ul class="footer-links-list">
                        <li><a href="index.html">Home</a></li>
                        <li><a href="services.html">Services</a></li>
                        <li><a href="about.html">about</a></li>
                        <li><a href="contact.html">contact us</a></li>
                    </ul>
                </div>

                <!-- Column 3: Social links -->
                <div class="footer-col col-social">
                    <h3>Social links<div class="underline"><span></span></div></h3>
                    <form class="newsletter-form" id="newsletter-form" name="newsletter" method="POST" data-netlify="true" novalidate>
                        <i class="fa-regular fa-envelope newsletter-icon"></i>
                        <input type="email" id="newsletter-email" class="newsletter-input" placeholder="Enter your email id" required autocomplete="email" />
                        <button type="submit" class="newsletter-btn" aria-label="Submit newsletter subscription">
                            <i class="fa-solid fa-arrow-right"></i>
                        </button>
                    </form>
                    <div id="newsletter-feedback" class="newsletter-feedback" aria-live="polite"></div>

                    <div class="social-icons-row">
                        <a href="https://wa.me/923288394863" target="_blank" rel="noopener noreferrer" class="social-circle" aria-label="WhatsApp">
                            <i class="fa-brands fa-whatsapp"></i>
                        </a>
                        <a href="https://www.facebook.com/share/17hzjd35pn/" target="_blank" rel="noopener noreferrer" class="social-circle" aria-label="Facebook">
                            <i class="fa-brands fa-facebook-f"></i>
                        </a>
                        <a href="https://www.linkedin.com/in/gull-muhammad-91a56240a/recent-activity/all/" target="_blank" rel="noopener noreferrer" class="social-circle" aria-label="LinkedIn">
                            <i class="fa-brands fa-linkedin-in"></i>
                        </a>
                        <a href="https://github.com/sabzada786901-svg" target="_blank" rel="noopener noreferrer" class="social-circle" aria-label="GitHub">
                            <i class="fa-brands fa-github"></i>
                        </a>
                    </div>
                </div>
            </div>

            <!-- Footer Bottom Line & Copyright -->
            <div class="footer-bottom-wrapper">
                <hr class="footer-divider" />
                <div class="footer-copyright">
                    <p>© 2026 AgenticAim. All rights reserved.</p>
                </div>
            </div>
        </footer>
    `;

    function renderComponents() {
        const headerPlaceholder = document.getElementById('header-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (headerPlaceholder) {
            headerPlaceholder.outerHTML = headerHTML;
        }

        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = footerHTML;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderComponents);
    } else {
        renderComponents();
    }
})();
