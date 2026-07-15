/**
 * Home page scroll navigation — loads early so nav works even if main.js errors later.
 */
document.addEventListener('DOMContentLoaded', function () {
    var navItems = document.querySelectorAll('.nav-item[data-target], .footer-link-btn[data-target]');
    if (!navItems.length) return;

    var topBar = document.querySelector('.top-bar');
    var navToggle = document.getElementById('navToggle');
    var navClose = document.getElementById('navClose');
    var siteNav = document.getElementById('siteNav');
    var navOverlay = document.getElementById('navOverlay');
    var contactTriggers = document.querySelectorAll('.contact-nav');
    var headerOffset = 92;

    function getHeaderHeight() {
        if (topBar) return topBar.offsetHeight;
        var root = getComputedStyle(document.documentElement);
        var parsed = parseFloat(root.getPropertyValue('--header-height'));
        return isNaN(parsed) ? headerOffset : parsed;
    }

    function scrollToSection(targetSection) {
        if (!targetSection) return;

        var headerH = getHeaderHeight();
        var rect = targetSection.getBoundingClientRect();
        var sectionTop = rect.top + window.scrollY;
        var sectionHeight = targetSection.offsetHeight;
        var viewportH = window.innerHeight;
        var visibleH = Math.max(0, viewportH - headerH);
        var y;

        if (sectionHeight >= visibleH) {
            y = sectionTop - headerH;
        } else {
            y = sectionTop - headerH - (visibleH - sectionHeight) / 2;
        }

        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
    }

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

    navItems.forEach(function (item) {
        item.addEventListener('click', function (event) {
            var targetId = item.getAttribute('data-target');
            var targetSection = document.getElementById(targetId);
            if (!targetSection) return;
            event.preventDefault();
            closeMobileNav();
            requestAnimationFrame(function () {
                scrollToSection(targetSection);
            });
        });
    });

    contactTriggers.forEach(function (trigger) {
        trigger.addEventListener('click', function () {
            var enquiryModal = document.getElementById('enquiryModal');
            if (enquiryModal) enquiryModal.style.display = 'flex';
            closeMobileNav();
        });
    });

    var homeButton = document.querySelector('.home-button:not(.home-button--sprint)');
    if (homeButton) {
        homeButton.addEventListener('click', function () {
            scrollToSection(document.getElementById('amcSection'));
        });
    }

    function scrollToHash(hashId, delayMs) {
        var hashSection = document.getElementById(hashId);
        if (!hashSection) return;
        setTimeout(function () {
            scrollToSection(hashSection);
        }, delayMs || 120);
    }

    if (window.location.hash) {
        scrollToHash(window.location.hash.slice(1), 120);
    }

    window.addEventListener('hashchange', function () {
        if (window.location.hash) {
            scrollToHash(window.location.hash.slice(1), 0);
        }
    });

    var sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = entry.target.getAttribute('id');
            document.querySelectorAll('.nav-item[data-target]').forEach(function (nav) {
                nav.classList.toggle('active', nav.getAttribute('data-target') === id);
            });
        });
    }, { threshold: 0.35, rootMargin: '-10% 0px -45% 0px' });

    document.querySelectorAll('main section[id]').forEach(function (sec) {
        sectionObserver.observe(sec);
    });

    if (topBar) {
        var updateTopBarState = function () {
            topBar.classList.toggle('scrolled', window.scrollY > 4);
        };
        updateTopBarState();
        window.addEventListener('scroll', updateTopBarState, { passive: true });
    }
});
