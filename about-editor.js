(() => {
  const params = new URLSearchParams(location.search);
  const editing = params.get('aboutEditor') === '1';
  const definitions = [
    { key: 'eyebrow', label: 'Eyebrow', selector: '#about-hero-eyebrow' },
    { key: 'headline', label: 'Main headline', selector: '#about-hero-title' },
    { key: 'description', label: 'Supporting text', selector: '#about-hero-description' },
    { key: 'aboutLink', label: 'About link', selector: '#about-hero-about-link' },
    { key: 'leadershipLink', label: 'Leadership link', selector: '#about-hero-leadership-link' },
    { key: 'brochureLink', label: 'Brochure link', selector: '#about-hero-brochure' }
  ].map((item) => ({ ...item, element: document.querySelector(item.selector) })).filter((item) => item.element);
  if (!definitions.length) return;

  const prefix = 'midroc-about-hero-text-v2:';
  const legacyPrefix = 'midroc-about-headline-v1:';
  const phone = matchMedia('(max-width: 680px)');
  const view = () => phone.matches ? 'phone' : 'desktop';
  const storageKey = (key, size = view()) => `${prefix}${size}:${key}`;
  const read = (key, size = view()) => {
    try {
      const saved = localStorage.getItem(storageKey(key, size));
      const legacy = key === 'headline' ? localStorage.getItem(legacyPrefix + size) : null;
      const value = JSON.parse(saved || legacy || '{"x":0,"y":0}');
      return { x: Number(value.x) || 0, y: Number(value.y) || 0 };
    } catch { return { x: 0, y: 0 }; }
  };
  const parse = (value) => {
    const numbers = (value && value !== 'none' ? value : '').match(/-?(?:\d+\.?\d*|\.\d+)/g) || [];
    return { x: Number(numbers[0]) || 0, y: Number(numbers[1]) || 0 };
  };
  const byKey = new Map(definitions.map((item) => [item.key, item]));
  const bases = new Map(definitions.map((item) => [item.key, parse(getComputedStyle(item.element).translate)]));
  const offsets = new Map(definitions.map((item) => [item.key, read(item.key)]));
  let selected = 'headline';
  let drag = null;

  const apply = (key) => {
    const base = bases.get(key);
    const offset = offsets.get(key);
    byKey.get(key).element.style.setProperty('translate', `calc(${base.x}px + ${offset.x}px) calc(${base.y}px + ${offset.y}px)`, 'important');
  };
  const save = (key) => {
    apply(key);
    try { localStorage.setItem(storageKey(key), JSON.stringify(offsets.get(key))); } catch {}
  };
  definitions.forEach(({ key }) => apply(key));
  if (!editing) return;

  const style = document.createElement('style');
  style.textContent = [
    '#midroc-about-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(390px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;padding:14px 15px 13px;border:1px solid #ffffff24;border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px #0a191433;font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-about-editor *{box-sizing:border-box}',
    '#midroc-about-editor p{margin:0}',
    '#midroc-about-editor .mae-title{margin-bottom:3px;font-size:13px;font-weight:700}',
    '#midroc-about-editor .mae-hint{color:#ffffffc7;font-size:11px}',
    '#midroc-about-editor .mae-view{color:#d7bd7b}',
    '#midroc-about-editor .mae-selectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}',
    '#midroc-about-editor button{min-height:32px;padding:6px 9px;border:1px solid #ffffff4d;border-radius:5px;background:transparent;color:#fff;font:600 10px Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-about-editor button:hover,#midroc-about-editor button:focus-visible{border-color:#d3ad58;background:#ffffff1a;outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-about-editor button[aria-pressed="true"]{border-color:#d3ad58;background:#d3ad58;color:#203d34}',
    '#midroc-about-editor .mae-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}',
    '#midroc-about-editor .mae-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mae-editing [data-about-hero-editable]{outline:1px dashed #d4ad5980!important;outline-offset:4px!important;cursor:grab!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mae-editing [data-about-hero-editable][data-about-hero-selected="true"]{outline:2px dashed #d4ad59!important;outline-offset:6px!important}',
    'body.mae-dragging,body.mae-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-about-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto;max-height:min(58vh,430px)}}'
  ].join('');
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.id = 'midroc-about-editor';
  panel.setAttribute('aria-label', 'About hero text position controls');
  panel.innerHTML = '<p class="mae-title">Move About hero text <span class="mae-view"></span></p><p class="mae-hint">Choose a text block, then drag it directly into place. Each block saves separate desktop and phone positions.</p><div class="mae-selectors"></div><div class="mae-actions"><button type="button" data-mae-reset>Reset selected text</button><button type="button" data-mae-download>Download positions</button><button class="mae-done" type="button" data-mae-done>Done</button></div>';
  const selectorList = panel.querySelector('.mae-selectors');
  definitions.forEach(({ key, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.maeSelect = key;
    button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    selectorList.appendChild(button);
  });
  document.body.appendChild(panel);
  const viewLabel = panel.querySelector('.mae-view');
  const updatePanel = () => {
    viewLabel.textContent = view() === 'phone' ? '· Phone' : '· Desktop';
    panel.querySelectorAll('[data-mae-select]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.maeSelect === selected)));
    definitions.forEach(({ key, element }) => element.setAttribute('data-about-hero-selected', String(key === selected)));
  };
  document.body.classList.add('mae-editing');
  definitions.forEach(({ key, element }) => {
    element.setAttribute('data-about-hero-editable', key);
    element.setAttribute('draggable', 'false');
    element.setAttribute('tabindex', '0');
    element.addEventListener('click', (event) => event.preventDefault());
    element.addEventListener('pointerdown', (event) => {
      if (key !== selected || (event.button !== undefined && event.button !== 0)) return;
      drag = { key, id: event.pointerId, x: event.clientX, y: event.clientY, startX: offsets.get(key).x, startY: offsets.get(key).y };
      element.setPointerCapture?.(event.pointerId);
      document.body.classList.add('mae-dragging');
      event.preventDefault();
    });
    element.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.id || drag.key !== key) return;
      offsets.set(key, {
        x: Math.round((drag.startX + event.clientX - drag.x) * 10) / 10,
        y: Math.round((drag.startY + event.clientY - drag.y) * 10) / 10
      });
      save(key);
    });
    const finish = (event) => {
      if (!drag || event.pointerId !== drag.id || drag.key !== key) return;
      drag = null;
      document.body.classList.remove('mae-dragging');
    };
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
    element.addEventListener('keydown', (event) => {
      if (key !== selected) return;
      const step = event.shiftKey ? 10 : 1;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      if (!delta) return;
      event.preventDefault();
      const current = offsets.get(key);
      offsets.set(key, { x: current.x + delta[0], y: current.y + delta[1] });
      save(key);
    });
  });
  updatePanel();
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mae-select]');
    if (!button) return;
    selected = button.dataset.maeSelect;
    updatePanel();
  });
  phone.addEventListener?.('change', () => {
    definitions.forEach(({ key }) => { offsets.set(key, read(key)); apply(key); });
    updatePanel();
  });
  panel.querySelector('[data-mae-reset]').addEventListener('click', () => {
    offsets.set(selected, { x: 0, y: 0 });
    try { localStorage.removeItem(storageKey(selected)); } catch {}
    apply(selected);
  });
  panel.querySelector('[data-mae-download]').addEventListener('click', () => {
    const placements = Object.fromEntries(definitions.map(({ key }) => [key, { desktop: read(key, 'desktop'), phone: read(key, 'phone') }]));
    const blob = new Blob([JSON.stringify({ instructions: 'MIDROC About hero text positions, saved separately for desktop and phone.', placements }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-about-hero-text-positions.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  panel.querySelector('[data-mae-done]').addEventListener('click', () => {
    const clean = new URL(location.href);
    clean.searchParams.delete('aboutEditor');
    history.replaceState({}, '', clean.pathname + clean.search + clean.hash);
    panel.remove();
    style.remove();
    document.body.classList.remove('mae-editing', 'mae-dragging');
    definitions.forEach(({ element }) => {
      element.removeAttribute('data-about-hero-editable');
      element.removeAttribute('data-about-hero-selected');
      element.removeAttribute('tabindex');
      element.removeAttribute('draggable');
    });
  });
})();
