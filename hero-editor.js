(() => {
  const params = new URLSearchParams(window.location.search);
  const isEditorOpen = params.get('heroEditor') === '1';
  const path = window.location.pathname.toLowerCase();

  const pageConfigs = [
    { id: 'home', title: 'Home', selector: '.home-hero:not(.leadership-masthead) .hero-content' },
    {
      id: 'about',
      title: 'About',
      selector: '.about-hero:not(.history-page-hero) .about-hero-copy',
      additionalTargets: [
        { id: 'story-heading', title: 'Our story heading', selector: '.about-story > div:first-child' },
        { id: 'story-text', title: 'Our story paragraphs', selector: '.about-story .about-story-copy' }
      ]
    },
    { id: 'history', title: 'History', selector: '.history-page-hero .about-hero-copy' },
    { id: 'industries', title: 'Industries', selector: '.business-masthead-reference .business-masthead-copy' },
    { id: 'leadership', title: 'Leadership', selector: '.leadership-masthead .leadership-hero-content' },
    { id: 'community', title: 'Community', selector: '.community-masthead .community-masthead-copy' },
    { id: 'governance', title: 'Governance', selector: '.governance-masthead .governance-masthead-copy' },
    { id: 'news', title: 'News', selector: '.hero-h' },
    { id: 'contact', title: 'Contact', selector: 'main > section.stripes-banner .wrap > div:first-child' },
    { id: 'industry-agriculture', title: 'Agro', selector: '.industry-detail-hero .industry-detail-copy' },
    { id: 'industry-commerce', title: 'Commerce & Service', selector: '.industry-detail-hero .industry-detail-copy' },
    { id: 'industry-construction', title: 'Construction & Real Estate', selector: '.industry-detail-hero .industry-detail-copy' },
    { id: 'industry-hotels', title: 'Hotel & Resort', selector: '.industry-detail-hero .industry-detail-copy' },
    { id: 'industry-manufacturing', title: 'Manufacturing', selector: '.industry-detail-hero .industry-detail-copy' },
    { id: 'industry-mining', title: 'Mining', selector: '.industry-detail-hero .industry-detail-copy' },
  ];
  const pageId = path.endsWith('/about.html') ? 'about'
    : path.endsWith('/history.html') ? 'history'
    : path.endsWith('/businesses.html') ? 'industries'
    : path.endsWith('/people.html') ? 'leadership'
    : path.endsWith('/community.html') ? 'community'
    : path.endsWith('/governance.html') ? 'governance'
    : path.endsWith('/news.html') ? 'news'
    : path.endsWith('/contact.html') ? 'contact'
    : path.endsWith('/industry-agriculture.html') ? 'industry-agriculture'
    : path.endsWith('/industry-commerce.html') ? 'industry-commerce'
    : path.endsWith('/industry-construction.html') ? 'industry-construction'
    : path.endsWith('/industry-hotels.html') ? 'industry-hotels'
    : path.endsWith('/industry-manufacturing.html') ? 'industry-manufacturing'
    : path.endsWith('/industry-mining.html') ? 'industry-mining'
    : 'home';
  const page = pageConfigs.find((item) => item.id === pageId);
  if (!page) return;

  const targetDefinitions = [
    { id: 'hero', title: page.title + ' hero', selector: page.selector },
    ...(page.additionalTargets || [])
  ];
  const targets = targetDefinitions
    .map((definition) => ({ ...definition, element: document.querySelector(definition.selector) }))
    .filter((item) => item.element);
  if (!targets.length) return;

  document.body.dataset.heroEditorPage = page.id;
  const storagePrefix = 'midroc-hero-placement-v1:';
  const mobileQuery = window.matchMedia('(max-width: 680px)');
  const viewName = () => mobileQuery.matches ? 'phone' : 'desktop';
  const storageKey = (targetId) => storagePrefix + page.id + ':' + targetId + ':' + viewName();
  const read = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{"x":0,"y":0}');
      return { x: Number(value.x) || 0, y: Number(value.y) || 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  };
  targets.forEach((item) => {
    item.offset = read(storageKey(item.id));
    item.element.style.setProperty('translate', item.offset.x + 'px ' + item.offset.y + 'px', 'important');
  });

  if (!isEditorOpen) return;

  const introSkip = document.querySelector('[data-brand-intro-skip]');
  if (introSkip) introSkip.click();

  const style = document.createElement('style');
  style.textContent = [
    '#midroc-hero-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(410px,calc(100vw - 28px));padding:13px 15px 12px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px rgba(10,25,20,.27);font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-hero-editor *{box-sizing:border-box}',
    '#midroc-hero-editor .mhe-title{margin:0 0 3px;font-size:13px;font-weight:700;letter-spacing:.02em}',
    '#midroc-hero-editor .mhe-hint{margin:0;color:rgba(255,255,255,.78);font-size:11px}',
    '#midroc-hero-editor .mhe-targets{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
    '#midroc-hero-editor button{min-height:31px;padding:6px 9px;border:1px solid rgba(255,255,255,.3);border-radius:5px;background:transparent;color:#fff;font:600 10px/1.1 Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-hero-editor button:hover,#midroc-hero-editor button:focus-visible{border-color:#d3ad58;background:rgba(255,255,255,.1);outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-hero-editor [aria-pressed=true]{border-color:#d4ad59;background:#d4ad59;color:#203d34}',
    '#midroc-hero-editor .mhe-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}',
    '#midroc-hero-editor .mhe-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mhe-editing [data-mhe-current-target=\"true\"]{outline:2px dashed #d4ad59!important;outline-offset:8px!important;cursor:move!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mhe-dragging,body.mhe-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-hero-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto}}'
  ].join('');
  document.head.appendChild(style);

  let activeIndex = 0;
  const toolbar = document.createElement('aside');
  toolbar.id = 'midroc-hero-editor';
  toolbar.setAttribute('aria-label', 'Hero position editor');
  toolbar.innerHTML = '<p class="mhe-title">Move the <span data-mhe-active-title></span> <span class="mhe-view"></span></p><p class="mhe-hint">Select a text block, then drag it directly into place. Each screen size saves separately.</p><div class="mhe-targets" aria-label="Choose text to move"></div><div class="mhe-actions"><button type="button" data-mhe-reset>Reset this view</button><button type="button" data-mhe-download>Download placements</button><button class="mhe-done" type="button" data-mhe-done>Done</button></div>';
  document.body.appendChild(toolbar);
  const activeTitle = toolbar.querySelector('[data-mhe-active-title]');
  const viewLabel = toolbar.querySelector('.mhe-view');
  const targetButtons = toolbar.querySelector('.mhe-targets');
  const paint = (item) => {
    item.element.style.setProperty('translate', item.offset.x + 'px ' + item.offset.y + 'px', 'important');
  };
  const refreshSelection = () => {
    activeTitle.textContent = targets[activeIndex].title;
    viewLabel.textContent = viewName() === 'phone' ? 'Phone' : 'Desktop';
    targets.forEach((item, index) => {
      const active = index === activeIndex;
      if (active) item.element.dataset.mheCurrentTarget = 'true';
      else delete item.element.dataset.mheCurrentTarget;
      const button = targetButtons.querySelector('[data-mhe-target="' + item.id + '"]');
      if (button) button.setAttribute('aria-pressed', String(active));
    });
  };
  targets.forEach((item) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mheTarget = item.id;
    button.textContent = item.title;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      activeIndex = targets.indexOf(item);
      refreshSelection();
      const rect = item.element.getBoundingClientRect();
      if (rect.top < 90 || rect.bottom > window.innerHeight - 90) item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    targetButtons.appendChild(button);

    item.element.setAttribute('tabindex', '0');
    item.element.setAttribute('aria-label', item.title + '. Drag to reposition, or use arrow keys.');
    item.element.setAttribute('draggable', 'false');
    item.element.addEventListener('pointerdown', (event) => {
      if (targets[activeIndex] !== item || (event.button !== undefined && event.button !== 0)) return;
      item.dragStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: item.offset.x, startY: item.offset.y };
      item.element.setPointerCapture?.(event.pointerId);
      document.body.classList.add('mhe-dragging');
      event.preventDefault();
    });
    item.element.addEventListener('pointermove', (event) => {
      if (!item.dragStart || event.pointerId !== item.dragStart.pointerId) return;
      item.offset = {
        x: Math.round((item.dragStart.startX + event.clientX - item.dragStart.x) * 10) / 10,
        y: Math.round((item.dragStart.startY + event.clientY - item.dragStart.y) * 10) / 10
      };
      paint(item);
      try { localStorage.setItem(storageKey(item.id), JSON.stringify(item.offset)); } catch {}
    });
    const finishDrag = (event) => {
      if (!item.dragStart || event.pointerId !== item.dragStart.pointerId) return;
      item.dragStart = null;
      document.body.classList.remove('mhe-dragging');
    };
    item.element.addEventListener('pointerup', finishDrag);
    item.element.addEventListener('pointercancel', finishDrag);
    item.element.addEventListener('click', (event) => {
      if (targets[activeIndex] === item) event.preventDefault();
    });
    item.element.addEventListener('keydown', (event) => {
      if (targets[activeIndex] !== item) return;
      const step = event.shiftKey ? 10 : 1;
      const delta = {
        ArrowLeft: [-step, 0], ArrowRight: [step, 0],
        ArrowUp: [0, -step], ArrowDown: [0, step]
      }[event.key];
      if (!delta) return;
      event.preventDefault();
      item.offset = { x: item.offset.x + delta[0], y: item.offset.y + delta[1] };
      paint(item);
      try { localStorage.setItem(storageKey(item.id), JSON.stringify(item.offset)); } catch {}
    });
  });

  document.body.classList.add('mhe-editing');
  const updateView = () => {
    targets.forEach((item) => {
      item.offset = read(storageKey(item.id));
      paint(item);
    });
    refreshSelection();
  };
  refreshSelection();
  mobileQuery.addEventListener?.('change', updateView);

  toolbar.querySelector('[data-mhe-reset]').addEventListener('click', () => {
    const item = targets[activeIndex];
    item.offset = { x: 0, y: 0 };
    paint(item);
    try { localStorage.removeItem(storageKey(item.id)); } catch {}
  });
  toolbar.querySelector('[data-mhe-download]').addEventListener('click', () => {
    const placements = {};
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith(storagePrefix)) placements[key.slice(storagePrefix.length)] = JSON.parse(localStorage.getItem(key));
      }
    } catch {}
    targets.forEach((item) => { placements[page.id + ':' + item.id + ':' + viewName()] = item.offset; });
    const payload = {
      instructions: 'Hero and section text placements moved with the visual MIDROC editor. Desktop and phone positions are stored separately.',
      placements
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-hero-placements.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  toolbar.querySelector('[data-mhe-done]').addEventListener('click', () => {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('heroEditor');
    history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    toolbar.remove();
    style.remove();
    document.body.classList.remove('mhe-editing', 'mhe-dragging');
    targets.forEach((item) => {
      delete item.element.dataset.mheCurrentTarget;
      item.element.removeAttribute('tabindex');
      item.element.removeAttribute('aria-label');
      item.element.removeAttribute('draggable');
    });
  });

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented) return;
    let next;
    try { next = new URL(link.href, window.location.href); } catch { return; }
    if (next.origin !== window.location.origin || !next.pathname.toLowerCase().endsWith('.html')) return;
    next.searchParams.set('heroEditor', '1');
    link.href = next.href;
  }, true);
})();