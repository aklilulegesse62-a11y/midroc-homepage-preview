(() => {
  const params = new URLSearchParams(location.search);
  const editing = params.get('historyEditor') === '1';
  const headline = document.querySelector('#history-hero-title');
  if (!headline) return;

  const prefix = 'midroc-history-headline-position-v1:';
  const phone = matchMedia('(max-width: 680px)');
  const view = () => phone.matches ? 'phone' : 'desktop';
  const key = (size = view()) => prefix + size;
  const read = (size = view()) => {
    try {
      const value = JSON.parse(localStorage.getItem(key(size)) || '{"x":0,"y":0}');
      return { x: Number(value.x) || 0, y: Number(value.y) || 0 };
    } catch { return { x: 0, y: 0 }; }
  };
  const parse = (value) => {
    const numbers = (value && value !== 'none' ? value : '').match(/-?(?:\d+\.?\d*|\.\d+)/g) || [];
    return { x: Number(numbers[0]) || 0, y: Number(numbers[1]) || 0 };
  };
  const base = parse(getComputedStyle(headline).translate);
  let offset = read();
  let drag = null;
  const apply = () => headline.style.setProperty('translate', `calc(${base.x}px + ${offset.x}px) calc(${base.y}px + ${offset.y}px)`, 'important');
  const save = () => {
    apply();
    try { localStorage.setItem(key(), JSON.stringify(offset)); } catch {}
  };
  apply();
  if (!editing) return;

  const style = document.createElement('style');
  style.textContent = [
    '#midroc-history-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(380px,calc(100vw - 28px));padding:14px 15px 13px;border:1px solid #ffffff24;border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px #0a191433;font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-history-editor *{box-sizing:border-box}',
    '#midroc-history-editor p{margin:0}',
    '#midroc-history-editor .mhe-title{margin-bottom:3px;font-size:13px;font-weight:700}',
    '#midroc-history-editor .mhe-hint{color:#ffffffc7;font-size:11px}',
    '#midroc-history-editor .mhe-view{color:#d7bd7b}',
    '#midroc-history-editor button{min-height:32px;padding:6px 9px;border:1px solid #ffffff4d;border-radius:5px;background:transparent;color:#fff;font:600 10px Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-history-editor button:hover,#midroc-history-editor button:focus-visible{border-color:#d3ad58;background:#ffffff1a;outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-history-editor .mhe-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}',
    '#midroc-history-editor .mhe-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mhe-editing #history-hero-title{outline:2px dashed #d4ad59!important;outline-offset:7px!important;cursor:move!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mhe-dragging,body.mhe-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-history-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto}}'
  ].join('');
  document.head.appendChild(style);

  const panel = document.createElement('aside');
  panel.id = 'midroc-history-editor';
  panel.setAttribute('aria-label', 'History headline position controls');
  panel.innerHTML = '<p class="mhe-title">Move the history headline <span class="mhe-view"></span></p><p class="mhe-hint">Drag the headline into place. Desktop and phone positions save separately in this browser.</p><div class="mhe-actions"><button type="button" data-mhe-reset>Reset this view</button><button type="button" data-mhe-download>Download positions</button><button class="mhe-done" type="button" data-mhe-done>Done</button></div>';
  document.body.appendChild(panel);
  const label = panel.querySelector('.mhe-view');
  const updateLabel = () => { label.textContent = view() === 'phone' ? '· Phone' : '· Desktop'; };
  updateLabel();
  document.body.classList.add('mhe-editing');
  headline.setAttribute('tabindex', '0');
  headline.setAttribute('draggable', 'false');

  headline.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: offset.x, startY: offset.y };
    headline.setPointerCapture?.(event.pointerId);
    document.body.classList.add('mhe-dragging');
    event.preventDefault();
  });
  headline.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    offset = { x: Math.round((drag.startX + event.clientX - drag.x) * 10) / 10, y: Math.round((drag.startY + event.clientY - drag.y) * 10) / 10 };
    save();
  });
  const finish = (event) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    document.body.classList.remove('mhe-dragging');
  };
  headline.addEventListener('pointerup', finish);
  headline.addEventListener('pointercancel', finish);
  headline.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 10 : 1;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    offset = { x: offset.x + delta[0], y: offset.y + delta[1] };
    save();
  });
  phone.addEventListener?.('change', () => { offset = read(); apply(); updateLabel(); });

  panel.querySelector('[data-mhe-reset]').addEventListener('click', () => {
    offset = { x: 0, y: 0 };
    try { localStorage.removeItem(key()); } catch {}
    apply();
  });
  panel.querySelector('[data-mhe-download]').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ instructions: 'MIDROC history headline positions, saved separately for desktop and phone.', placements: { desktop: read('desktop'), phone: read('phone') } }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-history-headline-positions.json';
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
    headline.removeAttribute('tabindex');
    headline.removeAttribute('draggable');
  });
})();
