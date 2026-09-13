// Small, progressively enhanced interactions. Content and anchor links work without JS.
(() => {
    'use strict';

    const mobileNavigation = window.matchMedia('(max-width: 900px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function getFragmentTarget(hash) {
        if (!hash || hash === '#') return null;
        try { return document.getElementById(decodeURIComponent(hash.slice(1))); }
        catch { return null; }
    }

    function alignInitialFragment() {
        const hash = window.location.hash;
        const target = getFragmentTarget(hash);
        const navigation = window.performance?.getEntriesByType?.('navigation')?.[0];
        if (!target || navigation?.type === 'back_forward') return;

        let cancelled = false;
        const cancel = () => { cancelled = true; };
        const cancelOnKey = event => {
            if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancel();
        };
        window.addEventListener('wheel', cancel, { passive: true });
        window.addEventListener('touchstart', cancel, { passive: true });
        window.addEventListener('keydown', cancelOnKey);
        const align = () => {
            Promise.resolve(document.fonts?.ready).then(() => {
                window.requestAnimationFrame(() => {
                    window.removeEventListener('wheel', cancel);
                    window.removeEventListener('touchstart', cancel);
                    window.removeEventListener('keydown', cancelOnKey);
                    if (!cancelled && window.location.hash === hash) {
                        target.scrollIntoView({ block: 'start', behavior: 'instant' });
                    }
                });
            });
        };
        if (document.readyState === 'complete') align();
        else window.addEventListener('load', align, { once: true });
    }

    function initializeNavigation() {
        const navbar = document.getElementById('navbar');
        const hamburger = document.getElementById('hamburger');
        const menu = document.getElementById('navMenu');
        const links = Array.from(document.querySelectorAll('.nav-link'));
        const targets = links.map(link => ({
            link, section: getFragmentTarget(link.hash)
        })).filter(target => target.section);

        if (hamburger && menu) {
            const setOpen = (open, restoreFocus = false) => {
                const expanded = mobileNavigation.matches && open;
                hamburger.classList.toggle('active', expanded);
                menu.classList.toggle('active', expanded);
                hamburger.setAttribute('aria-expanded', String(expanded));
                menu.inert = mobileNavigation.matches && !expanded;
                if (restoreFocus) hamburger.focus();
            };
            hamburger.setAttribute('aria-controls', menu.id);
            setOpen(false);
            document.documentElement.classList.add('navigation-ready');
            hamburger.addEventListener('click', () => {
                setOpen(hamburger.getAttribute('aria-expanded') !== 'true');
            });
            menu.addEventListener('click', event => {
                if (event.target.closest('a')) setOpen(false);
            });
            document.addEventListener('click', event => {
                if (!menu.contains(event.target) && !hamburger.contains(event.target)) setOpen(false);
            });
            document.addEventListener('focusin', event => {
                if (!menu.contains(event.target) && !hamburger.contains(event.target)) setOpen(false);
            });
            document.addEventListener('keydown', event => {
                if (event.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
                    setOpen(false, true);
                }
            });
            mobileNavigation.addEventListener('change', () => setOpen(false));
        }

        let scheduled = false;
        const update = () => {
            scheduled = false;
            navbar?.classList.toggle('scrolled', window.scrollY > 24);
            const offset = (navbar?.getBoundingClientRect().height || 0) + 48;
            let current;
            targets.forEach(target => {
                if (target.section.getBoundingClientRect().top <= offset) current = target;
            });
            targets.forEach(target => {
                const active = target === current;
                target.link.classList.toggle('active', active);
                if (active) target.link.setAttribute('aria-current', 'location');
                else target.link.removeAttribute('aria-current');
            });
        };
        const scheduleUpdate = () => {
            if (!scheduled) {
                scheduled = true;
                window.requestAnimationFrame(update);
            }
        };
        window.addEventListener('scroll', scheduleUpdate, { passive: true });
        window.addEventListener('resize', scheduleUpdate);
        window.addEventListener('hashchange', scheduleUpdate);
        window.addEventListener('load', scheduleUpdate, { once: true });
        update();
        // Keep native fragment navigation and browser Back/Forward behavior intact.
    }

    function initializeLanguageSwitcher() {
        const buttons = document.querySelectorAll('.language-toggle[data-lang]');
        const storageKey = 'howardwang-language';
        const applyLanguage = language => {
            if (language !== 'en' && language !== 'zh') return;
            document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
            document.querySelectorAll('[data-en][data-zh]').forEach(element => {
                element.textContent = element.getAttribute(`data-${language}`);
            });
            document.querySelectorAll('[data-aria-en][data-aria-zh]').forEach(element => {
                element.setAttribute('aria-label', element.getAttribute(`data-aria-${language}`));
            });
            buttons.forEach(button => {
                const active = button.dataset.lang === language;
                button.classList.toggle('active', active);
                button.setAttribute('aria-pressed', String(active));
            });
            try { window.localStorage.setItem(storageKey, language); } catch { /* Storage is optional. */ }
        };
        let language = 'en';
        try {
            const saved = window.localStorage.getItem(storageKey);
            if (saved === 'en' || saved === 'zh') language = saved;
        } catch { /* Private or restricted storage must not break the page. */ }
        applyLanguage(language);
        buttons.forEach(button => button.addEventListener('click', () => {
            const activeLink = document.querySelector('.nav-link[aria-current="location"]');
            const section = getFragmentTarget(activeLink?.hash || '#home');
            const previousTop = section?.getBoundingClientRect().top;
            applyLanguage(button.dataset.lang);
            if (section) {
                window.scrollBy({ top: section.getBoundingClientRect().top - previousTop, behavior: 'instant' });
            }
        }));
    }

    function initializeBackToTop() {
        const button = document.getElementById('backToTop');
        if (!button) return;
        const update = () => {
            const visible = window.scrollY > 500;
            button.classList.toggle('visible', visible);
            button.hidden = !visible;
        };
        window.addEventListener('scroll', update, { passive: true });
        update();
        // An anchor needs no click handler: its native hash also updates history.
        if (button.tagName !== 'A') {
            button.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
            });
        }
    }

    function initialize() {
        initializeLanguageSwitcher();
        initializeNavigation();
        initializeBackToTop();
        alignInitialFragment();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
