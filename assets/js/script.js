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

    function initializeHeroSlideshow() {
        const slides = Array.from(document.querySelectorAll('.hero-slide'));
        if (slides.length < 2) return;
        const hero = slides[0].closest('.hero') || document.getElementById('home');
        const previous = document.getElementById('heroPrevious');
        const next = document.getElementById('heroNext');
        const pause = document.getElementById('heroPause');
        const playbackLabel = document.getElementById('heroPlaybackLabel');
        const counter = document.getElementById('heroSlideCounter');
        let current = Math.max(0, slides.findIndex(slide => slide.classList.contains('active')));
        let userPaused = !pause;
        let motionPaused = reducedMotion.matches;
        let inView = true;
        let timer;

        const isPaused = () => userPaused || motionPaused;
        const localize = () => {
            const language = document.documentElement.lang.startsWith('zh') ? 'zh' : 'en';
            const setLabel = (button, english, chinese) => {
                if (!button) return;
                button.setAttribute('data-aria-en', english);
                button.setAttribute('data-aria-zh', chinese);
                button.setAttribute('aria-label', language === 'zh' ? chinese : english);
            };
            setLabel(previous, 'Previous background photo', '上一张背景照片');
            setLabel(next, 'Next background photo', '下一张背景照片');
            setLabel(pause, isPaused() ? 'Play background slideshow' : 'Pause background slideshow',
                isPaused() ? '播放背景幻灯片' : '暂停背景幻灯片');
            if (playbackLabel) {
                playbackLabel.dataset.en = isPaused() ? 'Play' : 'Pause';
                playbackLabel.dataset.zh = isPaused() ? '播放' : '暂停';
                playbackLabel.textContent = playbackLabel.dataset[language];
            }
            if (pause) {
                pause.dataset.paused = String(isPaused());
                const icon = pause.querySelector('.fa-pause, .fa-play');
                icon?.classList.toggle('fa-pause', !isPaused());
                icon?.classList.toggle('fa-play', isPaused());
            }
        };
        const render = () => {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === current);
                slide.setAttribute('aria-hidden', 'true');
            });
            if (counter) {
                counter.setAttribute('aria-hidden', 'true');
                counter.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
            }
        };
        const schedule = () => {
            window.clearTimeout(timer);
            if (isPaused() || document.hidden || !inView) return;
            timer = window.setTimeout(() => {
                current = (current + 1) % slides.length;
                render();
                schedule();
            }, 7000);
        };
        const move = direction => {
            current = (current + direction + slides.length) % slides.length;
            render();
            schedule();
        };
        previous?.addEventListener('click', () => move(-1));
        next?.addEventListener('click', () => move(1));
        pause?.addEventListener('click', () => {
            if (isPaused()) {
                userPaused = false;
                motionPaused = false;
            } else userPaused = true;
            localize();
            schedule();
        });
        reducedMotion.addEventListener('change', event => {
            motionPaused = event.matches;
            localize();
            schedule();
        });
        document.addEventListener('visibilitychange', schedule);
        new MutationObserver(localize).observe(document.documentElement, {
            attributes: true, attributeFilter: ['lang']
        });
        if (hero) {
            const updateVisibility = () => {
                const bounds = hero.getBoundingClientRect();
                inView = bounds.bottom > 0 && bounds.top < window.innerHeight;
                schedule();
            };
            updateVisibility();
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(entries => {
                    inView = entries[0].isIntersecting;
                    schedule();
                }).observe(hero);
            } else {
                window.addEventListener('scroll', updateVisibility, { passive: true });
                window.addEventListener('resize', updateVisibility);
            }
            hero.classList.add('slideshow-ready');
        }
        render();
        localize();
        schedule();
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
        initializeHeroSlideshow();
        initializeBackToTop();
        alignInitialFragment();
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
