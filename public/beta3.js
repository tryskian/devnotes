(() => {
  if (window.__devNotesBeta3) {
    window.__devNotesBeta3.show();
    return;
  }

  const beta2Host = document.getElementById('devnotes');
  const beta2WasVisible = Boolean(window.__devNotes && beta2Host?.style.display !== 'none');
  window.__devNotes?.hide?.();

  const source = document.documentElement.cloneNode(true);
  source.querySelector('#devnotes')?.remove();
  source.querySelector('#devnotes-beta3')?.remove();
  source.querySelector('#devnotes-loader')?.remove();
  source.querySelector('#devnotes-beta3-loader')?.remove();
  source.querySelectorAll('script,noscript').forEach((element) => element.remove());
  source.querySelectorAll('meta[http-equiv="Content-Security-Policy" i]').forEach((element) => element.remove());

  const base = source.ownerDocument.createElement('base');
  base.href = location.href;
  source.querySelector('head')?.prepend(base);

  const frozenStyle = source.ownerDocument.createElement('style');
  frozenStyle.textContent = `
    *,*::before,*::after{animation-play-state:paused!important;transition:none!important;scroll-behavior:auto!important}
    [data-devnotes-beta3-layer]{cursor:default!important}
    [data-devnotes-beta3-hover]{outline:1px dashed #3264ff!important;outline-offset:2px!important}
    [data-devnotes-beta3-selected]{outline:2px solid #3264ff!important;outline-offset:2px!important}
    [contenteditable="true"]{cursor:text!important;outline:2px solid #050505!important;outline-offset:3px!important}
  `;
  source.querySelector('head')?.append(frozenStyle);

  const frozenMarkup = `<!doctype html>${source.outerHTML}`;
  const host = document.createElement('div');
  host.id = 'devnotes-beta3';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:auto;';
  document.documentElement.append(host);
  const root = host.attachShadow({ mode: 'open' });

  root.innerHTML = `
    <style>
      :host{all:initial;color-scheme:light}*{box-sizing:border-box}
      button,input{font:600 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      button{min-height:38px;padding:0 11px;border:0;border-right:1px solid #050505;border-radius:0;background:#fefefe;color:#050505;text-transform:uppercase;letter-spacing:.055em;cursor:pointer}
      button:last-child{border-right:0}button:hover,button[aria-pressed="true"]{background:#050505;color:#fefefe}button:disabled{opacity:.32;cursor:not-allowed;background:#fefefe;color:#050505}
      button:focus-visible,input:focus-visible{outline:2px solid #3264ff;outline-offset:3px}
      .stage{position:fixed;inset:0;overflow:hidden;background:#d9d9d6}
      .frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fefefe}
      .topbar{position:fixed;z-index:20;top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:stretch;max-width:calc(100vw - 24px);border:1px solid #050505;background:#fefefe;box-shadow:0 5px 18px #05050518}
      .brand{display:grid;align-content:center;min-width:max-content;padding:0 13px;border-right:1px solid #050505;font:700 11px/1.15 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.07em;text-transform:uppercase}.brand small{display:block;margin-top:3px;color:#777;font-size:8px;font-weight:500}
      .topbar-group{display:flex;min-width:0;border-right:1px solid #050505}.topbar-group:last-child{border-right:0}.layer-count{display:grid;min-width:62px;place-items:center;padding:0 10px;color:#666;font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:nowrap}
      .inspector{position:fixed;z-index:18;right:14px;top:70px;width:min(294px,calc(100vw - 28px));padding:13px 14px 14px;border:1px solid #050505;background:#fefefef5;box-shadow:0 8px 22px #05050516;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      .inspector[hidden]{display:none}.inspector-header{display:flex;align-items:start;justify-content:space-between;gap:12px;padding-bottom:10px;border-bottom:1px solid #bbb}.layer-name{min-width:0;margin:0;font-size:12px;line-height:1.35;word-break:break-word}.source-name{display:block;margin-top:4px;color:#777;font-size:9px;font-weight:500}.geometry{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin:11px 0;background:#bbb;border:1px solid #bbb}.metric{padding:7px 6px;background:#fefefe}.metric span{display:block;color:#777;font-size:8px;text-transform:uppercase}.metric output{display:block;margin-top:3px;font-size:10px}.inspector-actions{display:flex;border:1px solid #050505}.inspector-actions button{flex:1;padding:0 7px}.inspector-note{margin:10px 0 0;color:#666;font-size:9px;line-height:1.45}
      .selection{position:fixed;z-index:12;display:none;border:2px solid #3264ff;pointer-events:none}.selection.visible{display:block}.selection-label{position:absolute;left:-2px;top:-22px;max-width:260px;padding:4px 6px;background:#3264ff;color:#fff;font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:auto;cursor:move}.handle{position:absolute;width:12px;height:12px;border:2px solid #3264ff;background:#fefefe;pointer-events:auto}.handle-e{right:-7px;top:50%;transform:translateY(-50%);cursor:ew-resize}.handle-s{bottom:-7px;left:50%;transform:translateX(-50%);cursor:ns-resize}.handle-se{right:-7px;bottom:-7px;cursor:nwse-resize}
      .notice{position:fixed;z-index:30;left:50%;bottom:14px;transform:translateX(-50%);width:min(520px,calc(100vw - 28px));padding:10px 13px;border:1px solid #050505;background:#fefefe;box-shadow:0 7px 22px #05050518;font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.notice[hidden]{display:none}
      .editing-original .selection{opacity:.45}.editing-original .inspector{opacity:.7}
      @media(max-width:760px){.topbar{left:10px;right:10px;transform:none;overflow-x:auto}.brand{display:none}.layer-count{display:none}.inspector{top:auto;bottom:62px;left:10px;right:10px;width:auto}.notice{bottom:10px}}
    </style>
    <div class="stage">
      <iframe class="frame" title="Frozen page experiment" sandbox="allow-same-origin"></iframe>
      <div class="selection" aria-hidden="true"><span class="selection-label"></span><span class="handle handle-e" data-direction="e"></span><span class="handle handle-s" data-direction="s"></span><span class="handle handle-se" data-direction="se"></span></div>
    </div>
    <header class="topbar" aria-label="Beta 3 frozen canvas controls">
      <div class="brand">DevNotes Beta 3<small>Frozen canvas proof</small></div>
      <div class="topbar-group"><button class="view-original" type="button" aria-pressed="false">Original</button><button class="view-experiment" type="button" aria-pressed="true">Experiment</button></div>
      <div class="topbar-group"><button class="undo" type="button" disabled>Undo</button><button class="redo" type="button" disabled>Redo</button><button class="reset" type="button" disabled>Reset</button></div>
      <span class="layer-count">Freezing…</span>
      <div class="topbar-group"><button class="exit" type="button">Exit</button></div>
    </header>
    <aside class="inspector" hidden aria-label="Selected layer">
      <h2 class="layer-name"></h2>
      <div class="geometry"><div class="metric"><span>X</span><output data-metric="x">0</output></div><div class="metric"><span>Y</span><output data-metric="y">0</output></div><div class="metric"><span>W</span><output data-metric="width">0</output></div><div class="metric"><span>H</span><output data-metric="height">0</output></div></div>
      <div class="inspector-actions"><button class="edit-copy" type="button">Edit copy</button><button class="select-parent" type="button">Parent</button><button class="revert-layer" type="button">Revert layer</button></div>
      <p class="inspector-note">Drag the object or its blue label to move it. Use the handles to resize. Double-click simple text to edit it.</p>
    </aside>
    <p class="notice" role="status">Freezing the current viewport…</p>
  `;

  const frame = root.querySelector('.frame');
  const selectionBox = root.querySelector('.selection');
  const selectionLabel = root.querySelector('.selection-label');
  const inspector = root.querySelector('.inspector');
  const layerName = root.querySelector('.layer-name');
  const layerCount = root.querySelector('.layer-count');
  const notice = root.querySelector('.notice');
  const originalButton = root.querySelector('.view-original');
  const experimentButton = root.querySelector('.view-experiment');
  const undoButton = root.querySelector('.undo');
  const redoButton = root.querySelector('.redo');
  const resetButton = root.querySelector('.reset');
  const editCopyButton = root.querySelector('.edit-copy');
  const parentButton = root.querySelector('.select-parent');
  const revertLayerButton = root.querySelector('.revert-layer');

  const originalPageScroll = { x: scrollX, y: scrollY };
  const layers = new Map();
  const history = [];
  let historyCursor = 0;
  let frameDocument = null;
  let selected = null;
  let hovered = null;
  let viewMode = 'experiment';
  let drag = null;
  let resize = null;
  let noticeTimer = null;

  function showNotice(message, duration = 2600) {
    if (noticeTimer) clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.hidden = false;
    if (duration > 0) noticeTimer = setTimeout(() => { notice.hidden = true; }, duration);
  }

  function meaningfulElement(element) {
    if (!(element instanceof frame.contentWindow.Element)) return false;
    if (['HTML', 'BODY', 'HEAD', 'SCRIPT', 'STYLE', 'LINK', 'META', 'BASE', 'NOSCRIPT'].includes(element.tagName)) return false;
    const rect = element.getBoundingClientRect();
    const style = frame.contentWindow.getComputedStyle(element);
    return rect.width >= 2 && rect.height >= 2 && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
  }

  function sourceIdentity(element) {
    if (element.id) return `#${element.id}`;
    const classes = [...element.classList].filter((name) => !name.startsWith('devnotes-')).slice(0, 3);
    const suffix = classes.length ? `.${classes.join('.')}` : '';
    return `${element.tagName.toLowerCase()}${suffix}`;
  }

  function simpleTextLayer(element) {
    return element.dataset.devnotesBeta3TextLayer === 'true'
      || (element.childElementCount === 0 && Boolean((element.textContent || '').trim()));
  }

  function snapshotState(element) {
    return {
      style: element.getAttribute('style'),
      text: simpleTextLayer(element) ? element.textContent : null,
    };
  }

  function applyState(element, state) {
    if (state.style === null || state.style === undefined) element.removeAttribute('style');
    else element.setAttribute('style', state.style);
    if (state.text !== null && state.text !== undefined && simpleTextLayer(element)) element.textContent = state.text;
  }

  function sameState(a, b) {
    return a.style === b.style && a.text === b.text;
  }

  function assignLayers() {
    const candidates = [...frameDocument.body.querySelectorAll('*')].filter(meaningfulElement);
    candidates.forEach((element, index) => {
      const id = `layer-${index + 1}`;
      const textLayer = element.childElementCount === 0 && Boolean((element.textContent || '').trim());
      element.dataset.devnotesBeta3Layer = id;
      if (textLayer) element.dataset.devnotesBeta3TextLayer = 'true';
      layers.set(id, {
        id,
        element,
        identity: sourceIdentity(element),
        original: snapshotState(element),
      });
    });
    layerCount.textContent = `${layers.size} layers`;
  }

  function resetAllLayers() {
    for (const layer of layers.values()) applyState(layer.element, layer.original);
  }

  function applyHistory(count) {
    resetAllLayers();
    for (let index = 0; index < count; index += 1) {
      const operation = history[index];
      const layer = layers.get(operation.layerId);
      if (layer) applyState(layer.element, operation.after);
    }
    updateSelection();
    updateControls();
  }

  function commitOperation(element, before, type) {
    const after = snapshotState(element);
    if (sameState(before, after)) return;
    history.splice(historyCursor);
    history.push({ layerId: element.dataset.devnotesBeta3Layer, type, before, after });
    historyCursor = history.length;
    updateControls();
  }

  function updateControls() {
    const editable = viewMode === 'experiment';
    originalButton.setAttribute('aria-pressed', String(!editable));
    experimentButton.setAttribute('aria-pressed', String(editable));
    undoButton.disabled = !editable || historyCursor === 0;
    redoButton.disabled = !editable || historyCursor >= history.length;
    resetButton.disabled = !editable || history.length === 0;
    editCopyButton.disabled = !editable || !selected || !simpleTextLayer(selected);
    parentButton.disabled = !selected || !meaningfulElement(selected.parentElement);
    revertLayerButton.disabled = !editable || !selected || !history.some((operation, index) => index < historyCursor && operation.layerId === selected.dataset.devnotesBeta3Layer);
    host.classList.toggle('editing-original', !editable);
  }

  function metric(name, value) {
    root.querySelector(`[data-metric="${name}"]`).textContent = String(Math.round(value));
  }

  function updateSelection() {
    if (!selected || !selected.isConnected) {
      selectionBox.classList.remove('visible');
      inspector.hidden = true;
      return;
    }
    const rect = selected.getBoundingClientRect();
    selectionBox.style.left = `${rect.left}px`;
    selectionBox.style.top = `${rect.top}px`;
    selectionBox.style.width = `${rect.width}px`;
    selectionBox.style.height = `${rect.height}px`;
    selectionBox.classList.toggle('visible', rect.width > 0 && rect.height > 0);
    const identity = sourceIdentity(selected);
    selectionLabel.textContent = identity;
    layerName.textContent = identity;
    const source = document.createElement('span');
    source.className = 'source-name';
    source.textContent = `${selected.tagName.toLowerCase()} · ${selected.dataset.devnotesBeta3Layer}`;
    layerName.replaceChildren(document.createTextNode(identity), source);
    metric('x', rect.left);
    metric('y', rect.top);
    metric('width', rect.width);
    metric('height', rect.height);
    inspector.hidden = false;
    updateControls();
  }

  function selectLayer(element) {
    if (!meaningfulElement(element)) return;
    selected?.removeAttribute('data-devnotes-beta3-selected');
    selected = element;
    selected.setAttribute('data-devnotes-beta3-selected', '');
    updateSelection();
  }

  function clearHover() {
    hovered?.removeAttribute('data-devnotes-beta3-hover');
    hovered = null;
  }

  function parseTranslate(element) {
    const value = frame.contentWindow.getComputedStyle(element).translate;
    if (!value || value === 'none') return { x: 0, y: 0 };
    const parts = value.split(/\s+/).map((part) => Number.parseFloat(part) || 0);
    return { x: parts[0] || 0, y: parts[1] || 0 };
  }

  function beginMove(event, element, captureTarget = element) {
    if (viewMode !== 'experiment' || event.button !== 0 || element.isContentEditable) return;
    const translate = parseTranslate(element);
    drag = {
      pointerId: event.pointerId,
      element,
      startX: event.clientX,
      startY: event.clientY,
      translate,
      before: snapshotState(element),
      captureTarget,
    };
    captureTarget.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function movePointer(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    drag.element.style.translate = `${drag.translate.x + dx}px ${drag.translate.y + dy}px`;
    updateSelection();
  }

  function finishMove(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.captureTarget.releasePointerCapture?.(event.pointerId);
    commitOperation(drag.element, drag.before, 'move-layer');
    drag = null;
    updateSelection();
  }

  function beginResize(event) {
    if (!selected || viewMode !== 'experiment') return;
    const rect = selected.getBoundingClientRect();
    resize = {
      pointerId: event.pointerId,
      direction: event.currentTarget.dataset.direction,
      startX: event.clientX,
      startY: event.clientY,
      width: rect.width,
      height: rect.height,
      before: snapshotState(selected),
      element: selected,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function resizePointer(event) {
    if (!resize || resize.pointerId !== event.pointerId) return;
    const dx = event.clientX - resize.startX;
    const dy = event.clientY - resize.startY;
    if (resize.direction.includes('e')) {
      resize.element.style.width = `${Math.max(24, resize.width + dx)}px`;
      resize.element.style.maxWidth = 'none';
    }
    if (resize.direction.includes('s')) {
      resize.element.style.height = `${Math.max(18, resize.height + dy)}px`;
      resize.element.style.maxHeight = 'none';
    }
    resize.element.style.boxSizing = 'border-box';
    updateSelection();
  }

  function finishResize(event) {
    if (!resize || resize.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    commitOperation(resize.element, resize.before, 'resize-layer');
    resize = null;
    updateSelection();
  }

  function startCopyEdit() {
    if (!selected || !simpleTextLayer(selected) || viewMode !== 'experiment') {
      showNotice('Select a simple text layer to edit its copy.');
      return;
    }
    const element = selected;
    const before = snapshotState(element);
    element.contentEditable = 'true';
    element.focus({ preventScroll: true });
    const range = frameDocument.createRange();
    range.selectNodeContents(element);
    const selection = frame.contentWindow.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const finish = () => {
      element.contentEditable = 'false';
      element.removeAttribute('contenteditable');
      commitOperation(element, before, 'edit-copy');
      element.removeEventListener('blur', finish);
      updateSelection();
    };
    element.addEventListener('blur', finish);
  }

  function revertSelectedLayer() {
    if (!selected || viewMode !== 'experiment') return;
    const id = selected.dataset.devnotesBeta3Layer;
    const appliedKeptCount = history
      .slice(0, historyCursor)
      .filter((operation) => operation.layerId !== id)
      .length;
    const kept = history.filter((operation) => operation.layerId !== id);
    history.splice(0, history.length, ...kept);
    historyCursor = appliedKeptCount;
    applyHistory(historyCursor);
    showNotice('Selected layer restored to its frozen state.');
  }

  function setViewMode(next) {
    viewMode = next;
    applyHistory(next === 'original' ? 0 : historyCursor);
    showNotice(next === 'original' ? 'Showing immutable original.' : 'Showing editable experiment.');
  }

  function resetExperiment() {
    history.splice(0);
    historyCursor = 0;
    viewMode = 'experiment';
    applyHistory(0);
    showNotice('Experiment reset. The live page was never changed.');
  }

  function exitBeta3() {
    if (noticeTimer) clearTimeout(noticeTimer);
    selected?.removeAttribute('data-devnotes-beta3-selected');
    clearHover();
    host.remove();
    delete window.__devNotesBeta3;
    if (beta2WasVisible) window.__devNotes?.show?.();
  }

  async function connectFrame() {
    frameDocument = frame.contentDocument;
    await frameDocument.fonts?.ready;
    frame.contentWindow.scrollTo(originalPageScroll.x, originalPageScroll.y);
    assignLayers();

    frameDocument.addEventListener('pointerover', (event) => {
      if (viewMode !== 'experiment' || drag || resize) return;
      const element = event.target.closest?.('[data-devnotes-beta3-layer]');
      if (!element || element === selected) return;
      clearHover();
      hovered = element;
      hovered.setAttribute('data-devnotes-beta3-hover', '');
    }, true);

    frameDocument.addEventListener('pointerout', (event) => {
      if (event.target === hovered) clearHover();
    }, true);

    frameDocument.addEventListener('pointerdown', (event) => {
      const element = event.target.closest?.('[data-devnotes-beta3-layer]');
      if (!element) return;
      clearHover();
      selectLayer(element);
      beginMove(event, element);
    }, true);

    frameDocument.addEventListener('pointermove', movePointer, true);
    frameDocument.addEventListener('pointerup', finishMove, true);
    frameDocument.addEventListener('pointercancel', finishMove, true);
    frameDocument.addEventListener('click', (event) => {
      if (event.target.closest?.('[data-devnotes-beta3-layer]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    frameDocument.addEventListener('dblclick', (event) => {
      const element = event.target.closest?.('[data-devnotes-beta3-layer]');
      if (!element) return;
      selectLayer(element);
      startCopyEdit();
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
    frameDocument.addEventListener('scroll', updateSelection, { passive: true });
    frame.contentWindow.addEventListener('resize', updateSelection);
    showNotice(`${layers.size} rendered layers frozen. Select one to begin.`, 4200);
    updateControls();
  }

  root.querySelectorAll('.handle').forEach((handle) => {
    handle.addEventListener('pointerdown', beginResize);
    handle.addEventListener('pointermove', resizePointer);
    handle.addEventListener('pointerup', finishResize);
    handle.addEventListener('pointercancel', finishResize);
  });

  selectionLabel.addEventListener('pointerdown', (event) => {
    if (selected) beginMove(event, selected, selectionLabel);
  });
  selectionLabel.addEventListener('pointermove', movePointer);
  selectionLabel.addEventListener('pointerup', finishMove);
  selectionLabel.addEventListener('pointercancel', finishMove);

  originalButton.addEventListener('click', () => setViewMode('original'));
  experimentButton.addEventListener('click', () => setViewMode('experiment'));
  undoButton.addEventListener('click', () => { if (historyCursor > 0) { historyCursor -= 1; applyHistory(historyCursor); } });
  redoButton.addEventListener('click', () => { if (historyCursor < history.length) { historyCursor += 1; applyHistory(historyCursor); } });
  resetButton.addEventListener('click', resetExperiment);
  editCopyButton.addEventListener('click', startCopyEdit);
  parentButton.addEventListener('click', () => { if (selected?.parentElement && meaningfulElement(selected.parentElement)) selectLayer(selected.parentElement); });
  revertLayerButton.addEventListener('click', revertSelectedLayer);
  root.querySelector('.exit').addEventListener('click', exitBeta3);
  addEventListener('resize', updateSelection);
  addEventListener('keydown', (event) => {
    if (!host.isConnected) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redoButton.click();
      else undoButton.click();
    } else if (event.key === 'Escape' && selected?.isContentEditable) {
      selected.blur();
    }
  }, true);

  frame.addEventListener('load', connectFrame, { once: true });
  frame.srcdoc = frozenMarkup;

  window.__devNotesBeta3 = {
    show: () => { host.style.display = ''; window.__devNotes?.hide?.(); },
    hide: () => { host.style.display = 'none'; if (beta2WasVisible) window.__devNotes?.show?.(); },
    remove: exitBeta3,
    reset: resetExperiment,
    state: () => ({
      layers: layers.size,
      history: history.map(({ layerId, type }) => ({ layerId, type })),
      historyCursor,
      viewMode,
      selectedLayer: selected?.dataset.devnotesBeta3Layer || null,
      sourceUrl: location.href,
      sourceUnchanged: true,
    }),
  };
})();
