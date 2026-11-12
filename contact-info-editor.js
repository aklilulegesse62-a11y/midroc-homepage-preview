(() => {
  const params = new URLSearchParams(location.search);
  if (params.get('contactInfoEditor') !== '1') return;

  const details = document.querySelector('#contact-details');
  if (!details) return;
  const names = [
    { key: 'all', label: 'All contact details', element: details },
    { key: 'address', label: 'Address', element: details.children[0] },
    { key: 'email', label: 'Email', element: details.children[1] },
    { key: 'phone', label: 'Phone', element: details.children[2] },
    { key: 'industries', label: 'Industries link', element: details.children[3] }
  ].filter((item) => item.element);
  const prefix = 'midroc-contact-info-v2:';
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
  const bases = new Map(names.map(({ key, element }) => [key, parse(getComputedStyle(element).translate)]));
  const offsets = new Map(names.map(({ key }) => [key, read(key)]));
  let selected = 'all';
  let drag = null;

  const apply = (key) => {
    const base = bases.get(key);
    const offset = offsets.get(key);
    names.find((item) => item.key === key).element.style.setProperty('translate', `calc(${base.x}px + ${offset.x}px) calc(${base.y}px + ${offset.y}px)`, 'important');
  };
  const save = (key) => {
    apply(key);
    try { localStorage.setItem(storageKey(key), JSON.stringify(offsets.get(key))); } catch {}
  };
  names.forEach(({ key, element }) => {
    apply(key);
    element.setAttribute('data-contact-info-editable', key);
    element.setAttribute('draggable', 'false');
    element.addEventListener('click', (event) => event.preventDefault());
    element.addEventListener('pointerdown', (event) => {
      if (key !== selected || (event.button !== undefined && event.button !== 0)) return;
      drag = { key, id: event.pointerId, x: event.clientX, y: event.clientY, startX: offsets.get(key).x, startY: offsets.get(key).y };
      element.setPointerCapture?.(event.pointerId);
      document.body.classList.add('mcie-dragging');
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
      document.body.classList.remove('mcie-dragging');
    };
    element.addEventListener('pointerup', finish);
    element.addEventListener('pointercancel', finish);
  });

  const style = document.createElement('style');
  style.textContent = [
    '#midroc-contact-info-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(390px,calc(100vw - 28px));padding:14px 15px 13px;border:1px solid #ffffff24;border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px #0a191433;font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-contact-info-editor *{box-sizing:border-box}',
    '#midroc-contact-info-editor p{margin:0}',
    '#midroc-contact-info-editor .mcie-title{margin-bottom:3px;font-size:13px;font-weight:700}',
    '#midroc-contact-info-editor .mcie-hint{color:#ffffffc7;font-size:11px}',
    '#midroc-contact-info-editor .mcie-view{color:#d7bd7b}',
    '#midroc-contact-info-editor .mcie-selectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}',
    '#midroc-contact-info-editor button{min-height:32px;padding:6px 9px;border:1px solid #ffffff4d;border-radius:5px;background:transparent;color:#fff;font:600 10px Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-contact-info-editor button:hover,#midroc-contact-info-editor button:focus-visible{border-color:#d3ad58;background:#ffffff1a;outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-contact-info-editor button[aria-pressed="true"]{border-color:#d3ad58;background:#d3ad58;color:#203d34}',
    '#midroc-contact-info-editor .mcie-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}',
    '#midroc-contact-info-editor .mcie-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mcie-editing [data-contact-info-editable]{outline:1px dashed #d4ad5980!important;outline-offset:4px!important;cursor:grab!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mcie-editing [data-contact-info-editable][data-contact-info-selected="true"]{outline:2px dashed #d4ad59!important;outline-offset:6px!important}',
    'body.mcie-dragging,body.mcie-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-contact-info-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto;max-height:min(58vh,430px);overflow:auto}}'
  ].join('');
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.id = 'midroc-contact-info-editor';
  panel.setAttribute('aria-label', 'Contact details position controls');
  panel.innerHTML = '<p class="mcie-title">Move contact details <span class="mcie-view"></span></p><p class="mcie-hint">Choose a block, then drag it directly into place. Desktop and phone positions save separately.</p><div class="mcie-selectors"></div><div class="mcie-actions"><button type="button" data-mcie-reset>Reset selected block</button><button type="button" data-mcie-download>Download positions</button><button class="mcie-done" type="button" data-mcie-done>Done</button></div>';
  const selectorList = panel.querySelector('.mcie-selectors');
  names.forEach(({ key, label }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.mcieSelect = key;
    button.textContent = label;
    button.setAttribute('aria-pressed', 'false');
    selectorList.appendChild(button);
  });
  document.body.appendChild(panel);
  const viewLabel = panel.querySelector('.mcie-view');
  const updatePanel = () => {
    viewLabel.textContent = view() === 'phone' ? '· Phone' : '· Desktop';
    panel.querySelectorAll('[data-mcie-select]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mcieSelect === selected)));
    names.forEach(({ key, element }) => element.setAttribute('data-contact-info-selected', String(key === selected)));
  };
  document.body.classList.add('mcie-editing');
  updatePanel();
  panel.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mcie-select]');
    if (!button) return;
    selected = button.dataset.mcieSelect;
    updatePanel();
  });
  phone.addEventListener?.('change', () => {
    names.forEach(({ key }) => { offsets.set(key, read(key)); apply(key); });
    updatePanel();
  });
  panel.querySelector('[data-mcie-reset]').addEventListener('click', () => {
    offsets.set(selected, { x: 0, y: 0 });
    try { localStorage.removeItem(storageKey(selected)); } catch {}
    apply(selected);
  });
  panel.querySelector('[data-mcie-download]').addEventListener('click', () => {
    const placements = Object.fromEntries(names.map(({ key }) => [key, { desktop: read(key, 'desktop'), phone: read(key, 'phone') }]));
    const blob = new Blob([JSON.stringify({ instructions: 'MIDROC contact details positions, saved separately for desktop and phone.', placements }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-contact-details-positions.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  panel.querySelector('[data-mcie-done]').addEventListener('click', () => {
    const clean = new URL(location.href);
    clean.searchParams.delete('contactInfoEditor');
    history.replaceState({}, '', clean.pathname + clean.search + clean.hash);
    panel.remove();
    style.remove();
    document.body.classList.remove('mcie-editing', 'mcie-dragging');
    names.forEach(({ element }) => {
      element.removeAttribute('data-contact-info-editable');
      element.removeAttribute('data-contact-info-selected');
      element.removeAttribute('draggable');
    });
  });
})();
