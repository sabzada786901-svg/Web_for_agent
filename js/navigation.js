/**
 * navigation.js
 * Handles sidebar drawer open/close behavior, keyboard escape, outside click, and smooth navigation.
 */

(function () {
    function initNavigation() {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const sidebarDrawer = document.getElementById('sidebar-drawer');
        const sidebarBackdrop = document.getElementById('sidebar-backdrop');
        const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
        const sidebarNavLinks = document.querySelectorAll('.sidebar-nav-link, .sidebar-cta a');

        if (!hamburgerBtn || !sidebarDrawer || !sidebarBackdrop) {
            return;
        }

        function openSidebar() {
            sidebarDrawer.classList.add('active');
            sidebarBackdrop.classList.add('active');
            hamburgerBtn.setAttribute('aria-expanded', 'true');
            sidebarDrawer.setAttribute('aria-hidden', 'false');
            sidebarBackdrop.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }

        function closeSidebar() {
            sidebarDrawer.classList.remove('active');
            sidebarBackdrop.classList.remove('active');
            hamburgerBtn.setAttribute('aria-expanded', 'false');
            sidebarDrawer.setAttribute('aria-hidden', 'true');
            sidebarBackdrop.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        hamburgerBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isOpen = sidebarDrawer.classList.contains('active');
            if (isOpen) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });

        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                closeSidebar();
            });
        }

        // Close on clicking backdrop (outside)
        sidebarBackdrop.addEventListener('click', function () {
            closeSidebar();
        });

        // Close on pressing Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebarDrawer.classList.contains('active')) {
                closeSidebar();
            }
        });

        // Close after selecting a navigation link
        sidebarNavLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                closeSidebar();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigation);
    } else {
        initNavigation();
    }
})();

