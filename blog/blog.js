// Howard Wang — Blog article shared behaviors
(function () {
  'use strict';

  // ---- Nav scroll effect ----
  const nav = document.getElementById('siteNav');
  function onScroll() {
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Reading progress bar ----
  const bar = document.getElementById('readingProgress');
  function updateProgress() {
    const scrollTop = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const pct = height > 0 ? (scrollTop / height) * 100 : 0;
    bar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // ---- Language switcher (EN / 中文) ----
  const toggles = document.querySelectorAll('.lang-toggle button');
  let currentLang = 'en';
  toggles.forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      if (lang === currentLang) return;
      toggles.forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('[data-en][data-zh]').forEach((el) => {
        const text = el.getAttribute('data-' + lang);
        if (text) el.textContent = text;
      });
      currentLang = lang;
    });
  });

  // ---- Estimated reading time ----
  const body = document.querySelector('.article-body');
  const readTime = document.getElementById('readTime');
  if (body && readTime) {
    const words = body.innerText.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(words / 220));
    readTime.textContent = minutes + ' min read';
  }

  // ---- Reveal on scroll (subtle) ----
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.opacity = '1';
            e.target.style.transform = 'none';
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    document.querySelectorAll('.reveal').forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      io.observe(el);
    });
  }
})();
