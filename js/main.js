/* ============================================
   Casa Bawi — Main JavaScript
   i18n system, animations, gallery, navigation
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // i18n SYSTEM
  // ============================================
  const LANG_KEY = 'casabawi-lang';
  const localeCache = {};
  let currentLocale = {};

  /**
   * Resolve a dot-notation key from an object.
   * e.g. resolve('nav.about', {nav:{about:'Sobre'}}) => 'Sobre'
   */
  function resolve(key, obj) {
    return key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
  }

  /**
   * Load a locale JSON file, with caching.
   */
  async function loadLocale(lang) {
    if (localeCache[lang]) return localeCache[lang];

    try {
      const resp = await fetch(`locales/${lang}.json`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      localeCache[lang] = data;
      return data;
    } catch (err) {
      console.error(`Failed to load locale "${lang}":`, err);
      return null;
    }
  }

  /**
   * Apply translations to all elements with data-i18n and data-i18n-placeholder.
   */
  function applyTranslations(locale) {
    if (!locale) return;
    currentLocale = locale;

    // Text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = resolve(key, locale);
      if (value !== null) {
        el.textContent = value;
      }
    });

    // Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const value = resolve(key, locale);
      if (value !== null) {
        el.placeholder = value;
      }
    });
  }

  /**
   * Set the language and apply all translations.
   */
  async function setLanguage(lang) {
    const locale = await loadLocale(lang);
    if (!locale) return;

    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);

    applyTranslations(locale);

    // Update toggle buttons (both navbar and mobile)
    document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
  }

  function initLanguage() {
    const saved = localStorage.getItem(LANG_KEY) || 'es';

    // Bind click handlers on all toggle buttons
    document.querySelectorAll('.lang-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        setLanguage(btn.dataset.lang);
      });
    });

    // Initial load
    setLanguage(saved);
  }

  // ============================================
  // NAVBAR SCROLL EFFECT
  // ============================================
  function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const threshold = 80;

    function onScroll() {
      navbar.classList.toggle('scrolled', window.scrollY > threshold);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ============================================
  // MOBILE MENU
  // ============================================
  function initMobileMenu() {
    const burger = document.querySelector('.burger');
    const mobileNav = document.querySelector('.mobile-nav');
    if (!burger || !mobileNav) return;

    burger.addEventListener('click', () => {
      burger.classList.toggle('open');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.classList.remove('open');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ============================================
  // SCROLL ANIMATIONS (Intersection Observer)
  // ============================================
  function initScrollAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    if (!elements.length) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    elements.forEach(el => observer.observe(el));
  }

  // ============================================
  // GALLERY CAROUSEL PAGINATION
  // ============================================
  function initGalleryCarousel() {
    var pages = document.querySelectorAll('.gallery__page');
    var dots = document.querySelectorAll('.gallery__dot');
    var prevBtn = document.querySelector('.gallery__pag-prev');
    var nextBtn = document.querySelector('.gallery__pag-next');
    if (!pages.length) return;

    var current = 0;
    var total = pages.length;

    function goTo(index) {
      pages[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = (index + total) % total;
      pages[current].classList.add('active');
      dots[current].classList.add('active');
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); });

    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        goTo(parseInt(dot.dataset.page, 10));
      });
    });
  }

  // ============================================
  // LIGHTBOX GALLERY
  // ============================================
  function initLightbox() {
    var lightbox = document.querySelector('.lightbox');
    if (!lightbox) return;

    var closeBtn = lightbox.querySelector('.lightbox__close');
    var prevBtn = lightbox.querySelector('.lightbox__nav--prev');
    var nextBtn = lightbox.querySelector('.lightbox__nav--next');
    var contentArea = lightbox.querySelector('.lightbox__content');

    // Collect ALL photos across all pages in order
    var allItems = Array.from(document.querySelectorAll('.gallery__item'));
    var currentIndex = 0;

    function getSrc(item) {
      var img = item.querySelector('img');
      return img ? img.src : '';
    }
    function getAlt(item) {
      var img = item.querySelector('img');
      return img ? img.alt : 'Casa Bawi';
    }

    function openLightbox(index) {
      currentIndex = index;
      updateContent();
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    function updateContent() {
      var src = getSrc(allItems[currentIndex]);
      var alt = getAlt(allItems[currentIndex]);
      contentArea.innerHTML = '';
      if (src) {
        var img = document.createElement('img');
        img.src = src;
        img.alt = alt;
        contentArea.appendChild(img);
      }
    }

    function next() { currentIndex = (currentIndex + 1) % allItems.length; updateContent(); }
    function prev() { currentIndex = (currentIndex - 1 + allItems.length) % allItems.length; updateContent(); }

    allItems.forEach(function(item, index) {
      item.addEventListener('click', function() { openLightbox(index); });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
  }

  // ============================================
  // SMOOTH SCROLL for anchor links
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return; // skip whatsapp-link buttons
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
          const top = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ============================================
  // WHATSAPP LINK
  // ============================================
  function initWhatsApp() {
    const phone = '529581075503';

    document.querySelectorAll('.whatsapp-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const msg = resolve('booking.whatsapp_message', currentLocale) || '';
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      });
    });
  }

  // ============================================
  // CONTACT FORM
  // ============================================
  function initContactForm() {
    const form = document.querySelector('.booking__form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.querySelector('[name="name"]')?.value || '';
      const email = form.querySelector('[name="email"]')?.value || '';
      const message = form.querySelector('[name="message"]')?.value || '';

      if (!name || !email || !message) return;

      const phone = '529581075503';
      const text = `Nuevo mensaje desde Casa Bawi web:\n\nNombre: ${name}\nEmail: ${email}\nMensaje: ${message}`;
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');

      form.reset();
    });
  }

  // ============================================
  // INIT
  // ============================================
  function init() {
    initLanguage();
    initNavbar();
    initMobileMenu();
    initScrollAnimations();
    initGalleryCarousel();
    initLightbox();
    initSmoothScroll();
    initWhatsApp();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
