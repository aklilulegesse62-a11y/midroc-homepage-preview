const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    });
  });
}

document.querySelectorAll('[data-news-carousel]').forEach((carousel) => {
  const panels = Array.from(carousel.querySelectorAll('.news-panel'));
  const count = document.querySelector('[data-news-count]');
  const previous = document.querySelector('[data-news-prev]');
  const next = document.querySelector('[data-news-next]');
  let activeIndex = Math.max(0, panels.findIndex((panel) => panel.classList.contains('is-active')));

  const activate = (index, bringIntoView = false) => {
    activeIndex = (index + panels.length) % panels.length;
    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === activeIndex;
      panel.classList.toggle('is-active', active);
      panel.querySelector('.news-panel-select')?.setAttribute('aria-expanded', String(active));
    });
    if (count) count.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
    if (bringIntoView && window.matchMedia('(max-width: 680px)').matches) {
      panels[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  panels.forEach((panel, index) => {
    panel.querySelector('.news-panel-select')?.addEventListener('click', () => activate(index, true));
  });
  previous?.addEventListener('click', () => activate(activeIndex - 1, true));
  next?.addEventListener('click', () => activate(activeIndex + 1, true));
  activate(activeIndex);
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealGroups = [
  '.hero-content > *',
  '.intro-strip > *',
  '.clusters .section-heading > *',
  '#clusters .cluster-card > svg, #clusters .cluster-card > strong',
  '.stats-row > div',
  '.product-showcase-copy > *',
  '.product-showcase-visual',
  '.about-band-copy > *',
  '.about-band-photo',
  '.news-masthead > *',
  '.news-carousel-footer > *',
  '.governance-top > *',
  '.principle-card',
  '.contact-cta > :not(.cta-ornament)',
  '.page-reveal'
];

if (prefersReducedMotion || !('IntersectionObserver' in window)) {
  document.querySelectorAll(revealGroups.join(',')).forEach((element) => element.classList.add('is-visible'));
} else {
  revealGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add('motion-reveal');
      element.style.setProperty('--motion-delay', `${Math.min(index * 75, 360)}ms`);
    });
  });

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -45px 0px' });

  document.querySelectorAll('.motion-reveal').forEach((element) => revealObserver.observe(element));

  const countTargets = Array.from(document.querySelectorAll('[data-count]'));
  const animateCount = (element) => {
    if (element.dataset.countStarted) return;
    element.dataset.countStarted = 'true';
    const endValue = Number(element.dataset.count);
    const suffix = element.dataset.suffix || '';
    const startTime = performance.now();
    const duration = 1500;
    const formatter = new Intl.NumberFormat('en-US');

    const frame = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${formatter.format(Math.round(endValue * eased))}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };

    element.textContent = `0${suffix}`;
    requestAnimationFrame(frame);
  };

  if (countTargets.length) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          countTargets.forEach(animateCount);
          observer.disconnect();
        }
      });
    }, { threshold: 0.35 });
    countObserver.observe(countTargets[0].closest('.stats-row') || countTargets[0]);
  }

  const parallaxTargets = [
    { selector: '.hero-image', speed: 0.12, limit: 26 },
    { selector: '.about-hero-image', speed: 0.055, limit: 12 },
    { selector: '.about-visual-image img', speed: 0.04, limit: 10 },
    { selector: '.about-cluster-card img', speed: 0.035, limit: 8 },
    { selector: '.about-band-photo img', speed: 0.065, limit: 17 },
    { selector: '.product-showcase-visual img', speed: 0.035, limit: 9 },
    { selector: '.career-slice', speed: 0.04, limit: 10 },
    { selector: '.news-panel>img', speed: 0.045, limit: 13 },
    { selector: '.business-cluster-image img', speed: 0.04, limit: 12 },
    { selector: '.principal-image img', speed: 0.035, limit: 10 },
    { selector: '.community-masthead-photo img', speed: 0.04, limit: 12 }
  ].flatMap(({ selector, speed, limit }) => Array.from(document.querySelectorAll(selector), (element) => ({ element, speed, limit })));
  let parallaxFrame = 0;

  const updateParallax = () => {
    if (parallaxFrame) return;
    parallaxFrame = requestAnimationFrame(() => {
      parallaxFrame = 0;
      const viewportCenter = window.innerHeight / 2;
      parallaxTargets.forEach(({ element, speed, limit }) => {
        const rect = element.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > window.innerHeight + 80) return;
        const distance = (viewportCenter - (rect.top + rect.height / 2)) * speed;
        const offset = Math.max(-limit, Math.min(limit, distance));
        element.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
      });
    });
  };

  window.addEventListener('scroll', updateParallax, { passive: true });
  window.addEventListener('resize', updateParallax, { passive: true });
  updateParallax();
}

const companyFilter = document.querySelector('[data-company-filter]');
if (companyFilter) {
  const sections = Array.from(document.querySelectorAll('[data-business-section]'));
  const emptyState = document.querySelector('[data-company-empty]');
  companyFilter.addEventListener('input', () => {
    const query = companyFilter.value.trim().toLocaleLowerCase();
    let visibleCount = 0;
    sections.forEach((section) => {
      const details = Array.from(section.querySelectorAll('[data-company-search]'));
      const sectionMatches = query && section.querySelector('.business-cluster-title')?.textContent.toLocaleLowerCase().includes(query);
      let sectionCount = 0;
      details.forEach((item) => {
        const matches = !query || sectionMatches || item.textContent.toLocaleLowerCase().includes(query);
        item.hidden = !matches;
        if (matches) sectionCount += 1;
        if (query && matches) item.open = true;
        if (!query) item.open = false;
      });
      section.hidden = Boolean(query) && sectionCount === 0;
      visibleCount += sectionCount;
    });
    if (emptyState) emptyState.hidden = visibleCount > 0;
  });
}

const newsSearch = document.querySelector('[data-news-search]');
const newsLanguage = document.querySelector('[data-news-language]');
if (newsSearch || newsLanguage) {
  const stories = Array.from(document.querySelectorAll('[data-news-stories] [data-story-language]'));
  const emptyState = document.querySelector('[data-news-empty]');
  const filterStories = () => {
    const query = (newsSearch?.value || '').trim().toLocaleLowerCase();
    const language = newsLanguage?.value || 'all';
    let visibleCount = 0;
    stories.forEach((story) => {
      const languageMatches = language === 'all' || story.dataset.storyLanguage === language;
      const textMatches = !query || story.textContent.toLocaleLowerCase().includes(query);
      story.hidden = !(languageMatches && textMatches);
      if (!story.hidden) visibleCount += 1;
    });
    if (emptyState) emptyState.hidden = visibleCount > 0;
  };
  newsSearch?.addEventListener('input', filterStories);
  newsLanguage?.addEventListener('change', filterStories);
}



/* Homepage product spotlight: cycle through MIDROC products every three seconds */
(() => {
  const showcase = document.querySelector('.product-showcase');
  if (!showcase) return;
  const layers = [...showcase.querySelectorAll('[data-product-layer]')];
  const brand = showcase.querySelector('[data-product-brand]');
  const name = showcase.querySelector('[data-product-name]');
  const description = showcase.querySelector('[data-product-description]');
  const format = showcase.querySelector('[data-product-format]');
  const category = showcase.querySelector('[data-product-category]');
  const copy = [brand, name, description, showcase.querySelector('.product-showcase-details')].filter(Boolean);
  if (layers.length < 2 || !brand || !name) return;

  const products = [
    { image: 'assets/products-normalized/merti-tomato-paste.png', alt: 'Merti tomato paste tin', brand: 'MERTI', name: 'TOMATO PASTE', description: 'A MIDROC Agro product', format: '800 g', category: 'Tomato paste' },
    { image: 'assets/products-normalized/elico-brown-leather-satchel-with-bow-and-tag.png', alt: 'Brown ELICO leather satchel with bow and tag', brand: 'ELICO', name: 'LEATHER SATCHEL', description: 'Leather products by Ethio-Leather Industry', format: 'Leather', category: 'ELICO collection' },
    { image: 'assets/products-normalized/elico-spider-man-kids-bag.png', alt: 'ELICO Spider-Man children’s bag', brand: 'ELICO', name: 'KIDS BAG', description: 'Leather products by Ethio-Leather Industry', format: 'Kids’ bag', category: 'ELICO collection' },
    { image: 'assets/products-normalized/oche-tomato-ketchup-jugs.png', alt: 'OCHE tomato ketchup jugs', brand: 'OCHE', name: 'TOMATO KETCHUP', description: 'A MIDROC food product', format: 'Ketchup', category: 'Food products' },
    { image: 'assets/products-normalized/shola-chedder-cheese.png', alt: 'Shola cheddar cheese', brand: 'SHOLA', name: 'CHEDDAR CHEESE', description: 'Produced by Lame Dairy', format: 'Cheddar', category: 'Dairy products' },
    { image: 'assets/products-normalized/shola-uht-milk.png', alt: 'Shola UHT milk pouch', brand: 'SHOLA', name: 'UHT MILK', description: 'Produced by Lame Dairy', format: '500 ml', category: 'Dairy products' }
  ];
  products.forEach((product) => { const image = new Image(); image.src = product.image; });

  let index = 0;
  let activeLayer = 0;
  let timer = 0;
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const update = (product) => {
    brand.textContent = product.brand;
    name.textContent = product.name;
    if (description) description.textContent = product.description;
    if (format) format.textContent = product.format;
    if (category) category.textContent = product.category;
  };
  const showNext = () => {
    index = (index + 1) % products.length;
    const product = products[index];
    copy.forEach((element) => element.classList.add('is-product-changing'));
    const nextLayerIndex = 1 - activeLayer;
    const nextLayer = layers[nextLayerIndex];
    const currentLayer = layers[activeLayer];
    window.setTimeout(() => {
      update(product);
      nextLayer.src = product.image;
      nextLayer.alt = product.alt;
      nextLayer.removeAttribute('aria-hidden');
      currentLayer.setAttribute('aria-hidden', 'true');
      currentLayer.alt = '';
      nextLayer.classList.add('is-active');
      currentLayer.classList.remove('is-active');
      activeLayer = nextLayerIndex;
      requestAnimationFrame(() => copy.forEach((element) => element.classList.remove('is-product-changing')));
    }, motionPreference.matches ? 0 : 180);
  };
  const start = () => { if (!timer && !document.hidden) timer = window.setInterval(showNext, 3000); };
  const pause = () => { if (timer) window.clearInterval(timer); timer = 0; };
  showcase.addEventListener('focusin', pause);
  showcase.addEventListener('focusout', (event) => { if (!showcase.contains(event.relatedTarget)) start(); });
  document.addEventListener('visibilitychange', () => document.hidden ? pause() : start());
  start();
})();
