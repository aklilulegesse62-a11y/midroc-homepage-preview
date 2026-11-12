(() => {
  const params = new URLSearchParams(location.search);
  const editing = params.get('aboutEditor') === '1';
  const target = document.querySelector('#about-hero-title');
  if (!target) return;

  const prefix = 'midroc-about-headline-v1:';
  const phone = matchMedia('(max-width: 680px)');
  const view = () => phone.matches ? 'phone' : 'desktop';
  const storageKey = (size = view()) => prefix + size;
  const read = (size = view()) => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(size)) || '{"x":0,"y":0}');
      return { x: Number(value.x) || 0, y: Number(value.y) || 0 };
    } catch { return { x: 0, y: 0 }; }
  };
  const parse = (value) => {
    const numbers = (value && value !== 'none' ? value : '').match(/-?(?:\d+\.?\d*|\.\d+)/g) || [];
    return { x: Number(numbers[0]) || 0, y: Number(numbers[1]) || 0 };
  };
  const base = parse(getComputedStyle(target).translate);
  let offset = read();
  let drag = null;
  const apply = () => target.style.setProperty('translate', `calc(${base.x}px + ${offset.x}px) calc(${base.y}px + ${offset.y}px)`, 'important');
  const save = () => {
    apply();
    try { localStorage.setItem(storageKey(), JSON.stringify(offset)); } catch {}
  };
  apply();
  if (!editing) return;

  const style = document.createElement('style');
  style.textContent = [
    '#midroc-about-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(380px,calc(100vw - 28px));padding:14px 15px 13px;border:1px solid #ffffff24;border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px #0a191433;font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-about-editor *{box-sizing:border-box}',
    '#midroc-about-editor p{margin:0}',
    '#midroc-about-editor .mae-title{margin-bottom:3px;font-size:13px;font-weight:700}',
    '#midroc-about-editor .mae-hint{color:#ffffffc7;font-size:11px}',
    '#midroc-about-editor .mae-view{color:#d7bd7b}',
    '#midroc-about-editor button{min-height:32px;padding:6px 9px;border:1px solid #ffffff4d;border-radius:5px;background:transparent;color:#fff;font:600 10px Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-about-editor button:hover,#midroc-about-editor button:focus-visible{border-color:#d3ad58;background:#ffffff1a;outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-about-editor .mae-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}',
    '#midroc-about-editor .mae-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mae-editing #about-hero-title{outline:2px dashed #d4ad59!important;outline-offset:7px!important;cursor:grab!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mae-dragging,body.mae-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-about-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto}}'
  ].join('');
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.id = 'midroc-about-editor';
  panel.setAttribute('aria-label', 'About headline position controls');
  panel.innerHTML = '<p class="mae-title">Move the About headline <span class="mae-view"></span></p><p class="mae-hint">Drag the headline directly into place. Desktop and phone positions save separately in this browser.</p><div class="mae-actions"><button type="button" data-mae-reset>Reset this view</button><button type="button" data-mae-download>Download positions</button><button class="mae-done" type="button" data-mae-done>Done</button></div>';
  document.body.appendChild(panel);
  const viewLabel = panel.querySelector('.mae-view');
  const updateViewLabel = () => { viewLabel.textContent = view() === 'phone' ? '· Phone' : '· Desktop'; };
  updateViewLabel();
  document.body.classList.add('mae-editing');
  target.setAttribute('tabindex', '0');
  target.setAttribute('draggable', 'false');
  target.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: offset.x, startY: offset.y };
    target.setPointerCapture?.(event.pointerId);
    document.body.classList.add('mae-dragging');
    event.preventDefault();
  });
  target.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    offset = { x: Math.round((drag.startX + event.clientX - drag.x) * 10) / 10, y: Math.round((drag.startY + event.clientY - drag.y) * 10) / 10 };
    save();
  });
  const finish = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    document.body.classList.remove('mae-dragging');
  };
  target.addEventListener('pointerup', finish);
  target.addEventListener('pointercancel', finish);
  target.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 10 : 1;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    offset = { x: offset.x + delta[0], y: offset.y + delta[1] };
    save();
  });
  phone.addEventListener?.('change', () => { offset = read(); apply(); updateViewLabel(); });
  panel.querySelector('[data-mae-reset]').addEventListener('click', () => {
    offset = { x: 0, y: 0 };
    try { localStorage.removeItem(storageKey()); } catch {}
    apply();
  });
  panel.querySelector('[data-mae-download]').addEventListener('click', () => {
    const placements = { desktop: read('desktop'), phone: read('phone') };
    const blob = new Blob([JSON.stringify({ instructions: 'MIDROC About headline positions, saved separately for desktop and phone.', placements }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-about-headline-positions.json';
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
    target.removeAttribute('tabindex');
    target.removeAttribute('draggable');
  });
})();
