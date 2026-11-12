(() => {
  const params = new URLSearchParams(window.location.search);
  const isEditorOpen = params.get('contactEditor') === '1';
  const target = document.querySelector('#contact-hero-title');
  if (!target) return;

  const storagePrefix = 'midroc-contact-headline-position-v2:';
  const mobileQuery = window.matchMedia('(max-width: 680px)');
  const viewName = () => mobileQuery.matches ? 'phone' : 'desktop';
  const storageKey = (view = viewName()) => storagePrefix + view;
  const read = (view = viewName()) => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey(view)) || '{"x":0,"y":0}');
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
  const base = parseTranslate(getComputedStyle(target).translate);
  let offset = read();
  let editorActive = isEditorOpen;
  let drag = null;
  let toolbar;
  let style;

  const apply = () => target.style.setProperty('translate', `calc(${base.x}px + ${offset.x}px) calc(${base.y}px + ${offset.y}px)`, 'important');
  const save = () => {
    apply();
    try { localStorage.setItem(storageKey(), JSON.stringify(offset)); } catch {}
  };
  apply();

  if (!isEditorOpen) return;

  style = document.createElement('style');
  style.textContent = [
    '#midroc-contact-editor{position:fixed;z-index:2147483000;top:14px;right:14px;width:min(380px,calc(100vw - 28px));padding:14px 15px 13px;border:1px solid rgba(255,255,255,.14);border-radius:12px;background:#203d34;color:#fff;box-shadow:0 12px 34px rgba(10,25,20,.3);font:500 12px/1.45 Montserrat,Arial,sans-serif}',
    '#midroc-contact-editor *{box-sizing:border-box}',
    '#midroc-contact-editor .mce-title{margin:0 0 3px;font-size:13px;font-weight:700}',
    '#midroc-contact-editor .mce-hint{margin:0;color:rgba(255,255,255,.78);font-size:11px}',
    '#midroc-contact-editor .mce-view{color:#d7bd7b}',
    '#midroc-contact-editor button{min-height:32px;padding:6px 9px;border:1px solid rgba(255,255,255,.3);border-radius:5px;background:transparent;color:#fff;font:600 10px Montserrat,Arial,sans-serif;cursor:pointer}',
    '#midroc-contact-editor button:hover,#midroc-contact-editor button:focus-visible{border-color:#d3ad58;background:rgba(255,255,255,.1);outline:2px solid #d3ad58;outline-offset:2px}',
    '#midroc-contact-editor .mce-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}',
    '#midroc-contact-editor .mce-done{margin-left:auto;background:#719a58;border-color:#719a58}',
    'body.mce-editing #contact-hero-title{outline:2px dashed #d4ad59!important;outline-offset:7px!important;cursor:move!important;touch-action:none!important;user-select:none!important;-webkit-user-select:none!important}',
    'body.mce-dragging,body.mce-dragging *{cursor:grabbing!important;user-select:none!important;-webkit-user-select:none!important}',
    '@media(max-width:680px){#midroc-contact-editor{top:auto;right:10px;bottom:10px;left:10px;width:auto}}'
  ].join('');
  document.head.appendChild(style);

  toolbar = document.createElement('aside');
  toolbar.id = 'midroc-contact-editor';
  toolbar.setAttribute('aria-label', 'Contact headline position controls');
  toolbar.innerHTML = '<p class="mce-title">Move the contact headline <span class="mce-view"></span></p><p class="mce-hint">Drag the headline directly into place. Desktop and phone positions save separately in this browser.</p><div class="mce-actions"><button type="button" data-mce-reset>Reset this view</button><button type="button" data-mce-download>Download positions</button><button class="mce-done" type="button" data-mce-done>Done</button></div>';
  document.body.appendChild(toolbar);
  const viewLabel = toolbar.querySelector('.mce-view');
  const updateViewLabel = () => { viewLabel.textContent = viewName() === 'phone' ? '· Phone' : '· Desktop'; };
  updateViewLabel();
  document.body.classList.add('mce-editing');
  target.setAttribute('tabindex', '0');
  target.setAttribute('draggable', 'false');

  target.addEventListener('pointerdown', (event) => {
    if (!editorActive || (event.button !== undefined && event.button !== 0)) return;
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: offset.x, startY: offset.y };
    target.setPointerCapture?.(event.pointerId);
    document.body.classList.add('mce-dragging');
    event.preventDefault();
  });
  target.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    offset = {
      x: Math.round((drag.startX + event.clientX - drag.x) * 10) / 10,
      y: Math.round((drag.startY + event.clientY - drag.y) * 10) / 10
    };
    save();
  });
  const finishDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = null;
    document.body.classList.remove('mce-dragging');
  };
  target.addEventListener('pointerup', finishDrag);
  target.addEventListener('pointercancel', finishDrag);
  target.addEventListener('keydown', (event) => {
    if (!editorActive) return;
    const step = event.shiftKey ? 10 : 1;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!delta) return;
    event.preventDefault();
    offset = { x: offset.x + delta[0], y: offset.y + delta[1] };
    save();
  });

  mobileQuery.addEventListener?.('change', () => {
    offset = read();
    apply();
    updateViewLabel();
  });
  toolbar.querySelector('[data-mce-reset]').addEventListener('click', () => {
    offset = { x: 0, y: 0 };
    try { localStorage.removeItem(storageKey()); } catch {}
    apply();
  });
  toolbar.querySelector('[data-mce-download]').addEventListener('click', () => {
    const placements = { desktop: read('desktop'), phone: read('phone') };
    const blob = new Blob([JSON.stringify({ instructions: 'MIDROC contact headline positions, stored separately for desktop and phone.', placements }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'midroc-contact-headline-positions.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  toolbar.querySelector('[data-mce-done]').addEventListener('click', () => {
    editorActive = false;
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('contactEditor');
    history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    toolbar.remove();
    style.remove();
    document.body.classList.remove('mce-editing', 'mce-dragging');
    target.removeAttribute('tabindex');
    target.removeAttribute('draggable');
  });
})();
