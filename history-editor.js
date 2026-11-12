(() => {
  const params = new URLSearchParams(location.search);
  const editing = params.get('historyEditor') === '1';
  const definitions = [
    { key: 'eyebrow', label: 'Eyebrow', selector: '#history-hero-eyebrow' },
    { key: 'headline', label: 'Main headline', selector: '#history-hero-title' },
    { key: 'description', label: 'Supporting text', selector: '#history-hero-description' },
    { key: 'aboutLink', label: 'About link', selector: '#history-hero-about-link' },
    { key: 'brochureLink', label: 'Brochure link', selector: '#history-hero-brochure' }
  ].map((item) => ({ ...item, element: document.querySelector(item.selector) })).filter((item) => item.element);
  if (!definitions.length) return;

  const prefix = 'midroc-history-hero-text-v3:';
  const phone = matchMedia('(max-width: 680px)');
  const view = () => phone.matches ? 'phone' : 'desktop';
  const storageKey = (target, size = view()) => `${prefix}${size}:${target}`;
  const read = (target, size = view()) => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(target, size)) || '{"x":0,"y":0}');
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
    '#midroc-history-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(390px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;padding:14px 15px 13px;border:1px solid #ffffff24;border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px #0a191433;font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-history-editor *{box-sizing:border-box}',
    '#midroc-history-editor p{margin:0}',
    '#midroc-history-editor .mhe-title{margin-bottom:3px;font-size:13px;font-weight:700}',
    '#midroc-history-editor .mhe-hint{color:#ffffffc7;font-size:11px}',
    '#midroc-history-editor .mhe-view{color:#d7bd7b}',
    '#midroc-history-editor .mhe-selectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}',
    '#midroc-history-editor button{min-height:32px;padding:6px 9px;border:1px solid #ffffff4d;border-radius:5px;background:transparent;color:#fff;font:600 10px Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-history-editor button:hover,#midroc-history-editor button:focus-visible{border-color:#d3ad58;background:#ffffff1a;outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-history-editor button[aria-pressed="true"]{border-color:#d3ad58;background:#d3ad58;color:#203d34}',
    '#midroc-history-editor .mhe-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}',
    '#midroc-history-editor .mhe-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mhe-editing [data-history-editable]{outline:1px dashed #d4ad5980!important;outline-offset:4px!important;cursor:grab!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mhe-editing [data-history-editable][data-history-selected="true"]{outline:2px dashed #d4ad59!important;outline-offset:6px!important}',
    'body.mhe-dragging,body.mhe-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-history-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto;max-height:min(58vh,430px)}}'
  ].join('');
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.id = 'midroc-history-editor';
  panel.setAttribute('aria-label', 'History hero text position controls');
  panel.innerHTML = '<p class="mhe-title">Move history hero text <span class="mhe-view"></span></p><p class="mhe-hint">Choose a text block, then drag it directly into place. Each block saves separate desktop and phone positions.</p><div class="mhe-selectors"></div><div class="mhe-actions"><button type="button" data-mhe-reset>Reset selected text</button><button type="button" data-mhe-download>Download positions</button><button class="mhe-done" type="button" data-mhe-done>Done</button></div>';
  const selectorList = panel.querySelector('.mhe-selectors');
  definitions.forEach(({ key, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mheSelect = key;
    button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    selectorList.appendChild(button);
  });
  document.body.appendChild(panel);
  const viewLabel = panel.querySelector('.mhe-view');
  const updatePanel = () => {
    viewLabel.textContent = view() === 'phone' ? '· Phone' : '· Desktop';
    panel.querySelectorAll('[data-mhe-select]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mheSelect === selected)));
    definitions.forEach(({ key, element }) => element.setAttribute('data-history-selected', String(key === selected)));
  };
  document.body.classList.add('mhe-editing');
  definitions.forEach(({ key, element }) => {
    element.setAttribute('data-history-editable', key);
    element.setAttribute('draggable', 'false');
    element.setAttribute('tabindex', '0');
    element.addEventListener('pointerdown', (event) => {
      if (key !== selected || (event.button !== undefined && event.button !== 0)) return;
      drag = { key, id: event.pointerId, x: event.clientX, y: event.clientY, startX: offsets.get(key).x, startY: offsets.get(key).y };
      element.setPointerCapture?.(event.pointerId);
      document.body.classList.add('mhe-dragging');
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
      document.body.classList.remove('mhe-dragging');
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
    const button = event.target.closest('[data-mhe-select]');
    if (!button) return;
    selected = button.dataset.mheSelect;
    updatePanel();
  });
  phone.addEventListener?.('change', () => {
    definitions.forEach(({ key }) => { offsets.set(key, read(key)); apply(key); });
    updatePanel();
  });
  panel.querySelector('[data-mhe-reset]').addEventListener('click', () => {
    offsets.set(selected, { x: 0, y: 0 });
    try { localStorage.removeItem(storageKey(selected)); } catch {}
    apply(selected);
  });
  panel.querySelector('[data-mhe-download]').addEventListener('click', () => {
    const placements = Object.fromEntries(definitions.map(({ key }) => [key, { desktop: read(key, 'desktop'), phone: read(key, 'phone') }]));
    const blob = new Blob([JSON.stringify({ instructions: 'MIDROC history hero text positions, saved separately for desktop and phone.', placements }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-history-hero-text-positions.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  panel.querySelector('[data-mhe-done]').addEventListener('click', () => {
    const clean = new URL(location.href);
    clean.searchParams.delete('historyEditor');
    history.replaceState({}, '', clean.pathname + clean.search + clean.hash);
    panel.remove();
    style.remove();
    document.body.classList.remove('mhe-editing', 'mhe-dragging');
    definitions.forEach(({ element }) => {
      element.removeAttribute('data-history-editable');
      element.removeAttribute('data-history-selected');
      element.removeAttribute('tabindex');
      element.removeAttribute('draggable');
    });
  });
})();
