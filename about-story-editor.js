(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('aboutStoryEditor') !== '1') return;
  const definitions = [
    { key: 'eyebrow', label: 'Our story label', selector: '#about-story-eyebrow' },
    { key: 'headline', label: 'Story headline', selector: '#about-story-title' },
    { key: 'paragraph1', label: 'Paragraph 1', selector: '#about-story-paragraph-1' },
    { key: 'paragraph2', label: 'Paragraph 2', selector: '#about-story-paragraph-2' },
    { key: 'paragraph3', label: 'Paragraph 3', selector: '#about-story-paragraph-3' }
  ].map((item) => ({ ...item, element: document.querySelector(item.selector) })).filter((item) => item.element);
  if (!definitions.length) return;

  const prefix = 'midroc-about-story-text-v1:';
  const phone = matchMedia('(max-width: 680px)');
  const view = () => phone.matches ? 'phone' : 'desktop';
  const storageKey = (key, size = view()) => `${prefix}${size}:${key}`;
  const read = (key, size = view()) => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(key, size)) || '{"x":0,"y":0}');
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

  const style = document.createElement('style');
  style.textContent = [
    '#midroc-story-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(390px,calc(100vw - 28px));max-height:calc(100vh - 28px);overflow:auto;padding:14px 15px 13px;border:1px solid #ffffff24;border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px #0a191433;font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-story-editor *{box-sizing:border-box}',
    '#midroc-story-editor p{margin:0}',
    '#midroc-story-editor .mse-title{margin-bottom:3px;font-size:13px;font-weight:700}',
    '#midroc-story-editor .mse-hint{color:#ffffffc7;font-size:11px}',
    '#midroc-story-editor .mse-view{color:#d7bd7b}',
    '#midroc-story-editor .mse-selectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}',
    '#midroc-story-editor button{min-height:32px;padding:6px 9px;border:1px solid #ffffff4d;border-radius:5px;background:transparent;color:#fff;font:600 10px Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-story-editor button:hover,#midroc-story-editor button:focus-visible{border-color:#d3ad58;background:#ffffff1a;outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-story-editor button[aria-pressed="true"]{border-color:#d3ad58;background:#d3ad58;color:#203d34}',
    '#midroc-story-editor .mse-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}',
    '#midroc-story-editor .mse-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mse-editing [data-story-editable]{outline:1px dashed #d4ad5980!important;outline-offset:4px!important;cursor:grab!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mse-editing [data-story-editable][data-story-selected="true"]{outline:2px dashed #d4ad59!important;outline-offset:6px!important}',
    'body.mse-dragging,body.mse-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-story-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto;max-height:min(58vh,430px)}}'
  ].join('');
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.id = 'midroc-story-editor';
  panel.setAttribute('aria-label', 'Our story position controls');
  panel.innerHTML = '<p class="mse-title">Move Our Story text <span class="mse-view"></span></p><p class="mse-hint">Choose a text block, then drag it directly into place. Each block saves separate desktop and phone positions.</p><div class="mse-selectors"></div><div class="mse-actions"><button type="button" data-mse-reset>Reset selected text</button><button type="button" data-mse-download>Download positions</button><button class="mse-done" type="button" data-mse-done>Done</button></div>';
  const selectorList = panel.querySelector('.mse-selectors');
  definitions.forEach(({ key, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mseSelect = key;
    button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    selectorList.appendChild(button);
  });
  document.body.appendChild(panel);
  const viewLabel = panel.querySelector('.mse-view');
  const updatePanel = () => {
    viewLabel.textContent = view() === 'phone' ? '· Phone' : '· Desktop';
    panel.querySelectorAll('[data-mse-select]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mseSelect === selected)));
    definitions.forEach(({ key, element }) => element.setAttribute('data-story-selected', String(key === selected)));
  };
  document.body.classList.add('mse-editing');
  definitions.forEach(({ key, element }) => {
    element.setAttribute('data-story-editable', key);
    element.setAttribute('draggable', 'false');
    element.setAttribute('tabindex', '0');
    element.addEventListener('pointerdown', (event) => {
      if (key !== selected || (event.button !== undefined && event.button !== 0)) return;
      drag = { key, id: event.pointerId, x: event.clientX, y: event.clientY, startX: offsets.get(key).x, startY: offsets.get(key).y };
      element.setPointerCapture?.(event.pointerId);
      document.body.classList.add('mse-dragging');
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
      document.body.classList.remove('mse-dragging');
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
    const button = event.target.closest('[data-mse-select]');
    if (!button) return;
    selected = button.dataset.mseSelect;
    updatePanel();
  });
  phone.addEventListener?.('change', () => {
    definitions.forEach(({ key }) => { offsets.set(key, read(key)); apply(key); });
    updatePanel();
  });
  panel.querySelector('[data-mse-reset]').addEventListener('click', () => {
    offsets.set(selected, { x: 0, y: 0 });
    try { localStorage.removeItem(storageKey(selected)); } catch {}
    apply(selected);
  });
  panel.querySelector('[data-mse-download]').addEventListener('click', () => {
    const placements = Object.fromEntries(definitions.map(({ key }) => [key, { desktop: read(key, 'desktop'), phone: read(key, 'phone') }]));
    const blob = new Blob([JSON.stringify({ instructions: 'MIDROC Our Story text positions, saved separately for desktop and phone.', placements }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-about-our-story-positions.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  panel.querySelector('[data-mse-done]').addEventListener('click', () => {
    const clean = new URL(location.href);
    clean.searchParams.delete('aboutStoryEditor');
    history.replaceState({}, '', clean.pathname + clean.search + clean.hash);
    panel.remove();
    style.remove();
    document.body.classList.remove('mse-editing', 'mse-dragging');
    definitions.forEach(({ element }) => {
      element.removeAttribute('data-story-editable');
      element.removeAttribute('data-story-selected');
      element.removeAttribute('tabindex');
      element.removeAttribute('draggable');
    });
  });
})();
