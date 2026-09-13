// Howard Wang — shared article navigation and reading progress.
(function () {
  'use strict';

  const nav = document.getElementById('siteNav');
  const bar = document.getElementById('readingProgress');
  const body = document.querySelector('.article-body');
  const readTime = document.getElementById('readTime');
  const toggles = document.querySelectorAll('.lang-toggle button');
  const minutes = body
    ? Math.max(1, Math.round(body.textContent.trim().split(/\s+/).length / 220))
    : 0;
  const languageStorageKey = 'howardwang-language';
  let currentLang = 'en';
  try {
    currentLang = localStorage.getItem(languageStorageKey) === 'zh' ? 'zh' : 'en';
  } catch (_) {
    // Navigation still works when browser storage is unavailable.
  }

  function updateReadingTime() {
    if (!readTime || !minutes) return;
    readTime.textContent = currentLang === 'zh'
      ? minutes + ' 分钟阅读'
      : minutes + ' min read';
  }

  function updateScroll() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
    if (!bar) return;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const progress = height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
    bar.style.width = progress * 100 + '%';
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('resize', updateScroll);
  window.addEventListener('load', updateScroll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(updateScroll);

  // Only the navigation and article controls are translated; essays remain English.
  function setLanguage(lang) {
    currentLang = lang === 'zh' ? 'zh' : 'en';
    try {
      localStorage.setItem(languageStorageKey, currentLang);
    } catch (_) {
      // Keep the current page usable without persistent storage.
    }
    toggles.forEach((button) => {
      const active = button.dataset.lang === currentLang;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('[data-en][data-zh]').forEach((element) => {
      element.textContent = element.getAttribute('data-' + currentLang);
      element.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    });
    const backLink = document.querySelector('.back-link');
    if (backLink) backLink.setAttribute('aria-label', currentLang === 'zh' ? '返回随笔' : 'Back to Writings');
    updateReadingTime();
  }

  toggles.forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });

  // Never hide an entire essay behind an intersection threshold: long articles
  // can exceed the viewport by enough that the threshold is impossible to reach.
  setLanguage(currentLang);
  updateScroll();
})();
