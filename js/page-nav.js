/**
 * Shared mobile nav + top bar scroll for subpages (play, leaderboard).
 */
document.addEventListener('DOMContentLoaded', function () {
    var topBar = document.querySelector('.top-bar');
    var navToggle = document.getElementById('navToggle');
    var navClose = document.getElementById('navClose');
    var siteNav = document.getElementById('siteNav');
    var navOverlay = document.getElementById('navOverlay');

    function closeMobileNav() {
        if (!siteNav || !navToggle || !navOverlay) return;
        siteNav.classList.remove('is-open');
        navOverlay.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
    }

    function openMobileNav() {
        if (!siteNav || !navToggle || !navOverlay) return;
        siteNav.classList.add('is-open');
        navOverlay.classList.add('is-open');
        navToggle.setAttribute('aria-expanded', 'true');
    }

    if (navToggle) {
        navToggle.addEventListener('click', function () {
            var isOpen = siteNav && siteNav.classList.contains('is-open');
            if (isOpen) closeMobileNav();
            else openMobileNav();
        });
    }
    if (navOverlay) navOverlay.addEventListener('click', closeMobileNav);
    if (navClose) navClose.addEventListener('click', closeMobileNav);

    if (topBar) {
        var updateTopBarState = function () {
            topBar.classList.toggle('scrolled', window.scrollY > 4);
        };
        updateTopBarState();
        window.addEventListener('scroll', updateTopBarState, { passive: true });
    }
});
