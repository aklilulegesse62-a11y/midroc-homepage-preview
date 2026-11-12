(() => {
  const params = new URLSearchParams(window.location.search);
  const isEditorOpen = params.get('leadershipEditor') === '1';
  const page = document.querySelector('.leadership-page');
  if (!page) return;

  let editorActive = isEditorOpen;
  if (isEditorOpen) document.querySelector('[data-brand-intro-skip]')?.click();
  const storagePrefix = 'midroc-leadership-placement-v1:';
  const mobileQuery = window.matchMedia('(max-width: 680px)');
  const viewName = () => mobileQuery.matches ? 'phone' : 'desktop';
  const storageKey = (id, view = viewName()) => storagePrefix + id + ':' + view;
  const read = (id, view = viewName()) => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(id, view)) || '{"x":0,"y":0}');
      return { x: Number(value.x) || 0, y: Number(value.y) || 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  };
  const parseTranslate = (value) => {
    if (!value || value === 'none') return { x: 0, y: 0 };
    const numbers = value.match(/-?(?:\d+\.?\d*|\.\d+)/g) || [];
    return { x: Number(numbers[0]) || 0, y: Number(numbers[1]) || 0 };
  };
  const baseOffsets = new WeakMap();
  let targets = [];
  let activeIndex = 0;
  let toolbar;
  const placementTargetSelector = '.leadership-hero-content,.principal-desktop-card,.principal-mobile-card,.leadership-clusters-label,.deputy-desktop-card,.deputy-mobile-card';
  const principalTitles = ['Chairman and Owner', 'CEO'];
  const deputyTitles = [
    'Ato Akalewold Admassu', 'Ato Dulla Mekonne', 'Ato Feleke Tadesse', 'Ato Hussein Ahmed',
    'Ato Solomone Zewdu', 'W/ro Zahra Abdulhaidi', 'Dr. Sani Redi', 'Dr. Zeraye Mehari'
  ];

  const definitionsForView = () => {
    const definitions = [
      { id: 'hero-text', title: 'Leadership hero text', selector: '.leadership-masthead .leadership-hero-content' }
    ];
    if (viewName() === 'phone') {
      document.querySelectorAll('.principal-mobile-card').forEach((element, index) => {
        definitions.push({ id: 'principal-' + (index + 1), title: principalTitles[index] + ' image', element });
      });
    } else {
      document.querySelectorAll('.principal-desktop-card').forEach((element, index) => {
        definitions.push({ id: 'principal-' + (index + 1), title: principalTitles[index] + ' image', element });
      });
    }
    definitions.push({ id: 'deputy-heading', title: 'Deputy CEOs heading', selector: '.leadership-clusters-label' });
    if (viewName() === 'phone') {
      document.querySelectorAll('.deputy-mobile-card').forEach((element, index) => {
        definitions.push({ id: 'deputy-' + (index + 1), title: deputyTitles[index] + ' image', element });
      });
    } else {
      document.querySelectorAll('.deputy-desktop-card').forEach((element, index) => {
        definitions.push({ id: 'deputy-' + (index + 1), title: deputyTitles[index] + ' image', element });
      });
    }
    return definitions.map((item) => ({ ...item, element: item.element || document.querySelector(item.selector) }))
      .filter((item) => item.element);
  };

  const setPosition = (item) => {
    const base = baseOffsets.get(item.element) || { x: 0, y: 0 };
    item.element.style.setProperty('translate', `calc(${base.x}px + ${item.offset.x}px) calc(${base.y}px + ${item.offset.y}px)`, 'important');
  };
  const applySavedPositions = () => {
    document.querySelectorAll(placementTargetSelector).forEach((element) => {
      if (!baseOffsets.has(element)) baseOffsets.set(element, parseTranslate(getComputedStyle(element).translate));
    });
    targets = definitionsForView().map((item) => ({ ...item, offset: read(item.id) }));
    targets.forEach(setPosition);
  };

  applySavedPositions();
  if (!isEditorOpen) return;

  const style = document.createElement('style');
  style.textContent = [
    '#midroc-leadership-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(400px,calc(100vw - 28px));padding:14px 15px 13px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px rgba(10,25,20,.3);font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-leadership-editor *{box-sizing:border-box}',
    '#midroc-leadership-editor .mle-title{margin:0 0 3px;font-size:13px;font-weight:700}',
    '#midroc-leadership-editor .mle-hint{margin:0;color:rgba(255,255,255,.78);font-size:11px}',
    '#midroc-leadership-editor .mle-select{display:block;width:100%;min-height:36px;margin-top:10px;padding:7px 10px;border:1px solid rgba(255,255,255,.32);border-radius:5px;background:#294a3e;color:#fff;font:600 11px Montserrat,Arial,sans-serif}',
    '#midroc-leadership-editor button{min-height:32px;padding:6px 9px;border:1px solid rgba(255,255,255,.3);border-radius:5px;background:transparent;color:#fff;font:600 10px Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-leadership-editor button:hover,#midroc-leadership-editor button:focus-visible{border-color:#d3ad58;background:rgba(255,255,255,.1);outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-leadership-editor .mle-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}',
    '#midroc-leadership-editor .mle-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mle-editing [data-mle-current-target="true"]{outline:2px dashed #d4ad59!important;outline-offset:6px!important;cursor:move!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mle-dragging,body.mle-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-leadership-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto;max-height:45vh;overflow:auto}}'
  ].join('');
  document.head.appendChild(style);

  toolbar = document.createElement('aside');
  toolbar.id = 'midroc-leadership-editor';
  toolbar.setAttribute('aria-label', 'Leadership page visual position controls');
  toolbar.title = 'Leadership visual drag controls';
  toolbar.innerHTML = '<p class="mle-title">Move leadership elements <span data-mle-view></span></p><p class="mle-hint">Choose an item, then drag it directly into place. Desktop and phone positions save separately. Use arrow keys for small adjustments.</p><select class="mle-select" aria-label="Choose a leadership element"></select><div class="mle-actions"><button type="button" data-mle-reset>Reset selected</button><button type="button" data-mle-download>Download positions</button><button class="mle-done" type="button" data-mle-done>Done</button></div>';
  document.body.appendChild(toolbar);
  const selector = toolbar.querySelector('.mle-select');
  const viewLabel = toolbar.querySelector('[data-mle-view]');

  const refreshSelection = () => {
    viewLabel.textContent = viewName() === 'phone' ? '· Phone' : '· Desktop';
    targets.forEach((item, index) => {
      if (index === activeIndex) item.element.dataset.mleCurrentTarget = 'true';
      else delete item.element.dataset.mleCurrentTarget;
    });
    selector.value = targets[activeIndex]?.id || '';
  };
  const rebuildOptions = () => {
    applySavedPositions();
    selector.replaceChildren(...targets.map((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.title;
      return option;
    }));
    activeIndex = Math.min(activeIndex, Math.max(0, targets.length - 1));
    refreshSelection();
  };
  const save = (item) => {
    setPosition(item);
    try { localStorage.setItem(storageKey(item.id), JSON.stringify(item.offset)); } catch {}
  };

  selector.addEventListener('change', () => {
    activeIndex = targets.findIndex((item) => item.id === selector.value);
    refreshSelection();
    const element = targets[activeIndex]?.element;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    if (rect.top < 90 || rect.bottom > window.innerHeight - 90) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.querySelectorAll(placementTargetSelector).forEach((element) => {
    element.setAttribute('tabindex', '0');
    element.setAttribute('draggable', 'false');
    element.addEventListener('pointerdown', (event) => {
      if (!editorActive) return;
      const item = targets[activeIndex];
      if (!item || item.element !== element || (event.button !== undefined && event.button !== 0)) return;
      element._mleDrag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: item.offset.x, startY: item.offset.y };
      element.setPointerCapture?.(event.pointerId);
      document.body.classList.add('mle-dragging');
      event.preventDefault();
    });
    element.addEventListener('pointermove', (event) => {
      const drag = element._mleDrag;
      const item = targets[activeIndex];
      if (!drag || !item || item.element !== element || event.pointerId !== drag.pointerId) return;
      item.offset = {
        x: Math.round((drag.startX + event.clientX - drag.x) * 10) / 10,
        y: Math.round((drag.startY + event.clientY - drag.y) * 10) / 10
      };
      save(item);
    });
    const finishDrag = (event) => {
      const drag = element._mleDrag;
      if (!drag || event.pointerId !== drag.pointerId) return;
      element._mleDrag = null;
      document.body.classList.remove('mle-dragging');
    };
    element.addEventListener('pointerup', finishDrag);
    element.addEventListener('pointercancel', finishDrag);
    element.addEventListener('keydown', (event) => {
      if (!editorActive) return;
      const item = targets[activeIndex];
      if (!item || item.element !== element) return;
      const step = event.shiftKey ? 10 : 1;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (!delta) return;
      event.preventDefault();
      item.offset = { x: item.offset.x + delta[0], y: item.offset.y + delta[1] };
      save(item);
    });
  });

  document.body.classList.add('mle-editing');
  selector.addEventListener('change', refreshSelection);
  mobileQuery.addEventListener?.('change', rebuildOptions);
  window.addEventListener('resize', () => {
    if (viewName() !== viewLabel.textContent.replace('· ', '').toLowerCase()) rebuildOptions();
  });
  rebuildOptions();

  toolbar.querySelector('[data-mle-reset]').addEventListener('click', () => {
    const item = targets[activeIndex];
    if (!item) return;
    item.offset = { x: 0, y: 0 };
    save(item);
    try { localStorage.removeItem(storageKey(item.id)); } catch {}
  });
  toolbar.querySelector('[data-mle-download]').addEventListener('click', () => {
    const placements = {};
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith(storagePrefix)) placements[key.slice(storagePrefix.length)] = JSON.parse(localStorage.getItem(key));
      }
    } catch {}
    targets.forEach((item) => { placements[item.id + ':' + viewName()] = item.offset; });
    const blob = new Blob([JSON.stringify({
      instructions: 'MIDROC leadership visual positions. Drag the artwork and headings on screen; desktop and phone coordinates are saved separately.',
      placements
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-leadership-positions.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  toolbar.querySelector('[data-mle-done]').addEventListener('click', () => {
    editorActive = false;
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('leadershipEditor');
    history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    toolbar.remove();
    style.remove();
    document.body.classList.remove('mle-editing', 'mle-dragging');
    document.querySelectorAll('[data-mle-current-target]').forEach((element) => delete element.dataset.mleCurrentTarget);
  });
})();
