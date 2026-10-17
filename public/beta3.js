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
    *,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
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
      button,input,select{font:600 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      button{min-height:38px;padding:0 11px;border:0;border-right:1px solid #050505;border-radius:0;background:#fefefe;color:#050505;text-transform:uppercase;letter-spacing:.055em;cursor:pointer}
      button:last-child{border-right:0}button:hover,button[aria-pressed="true"]{background:#050505;color:#fefefe}button:disabled{opacity:.32;cursor:not-allowed;background:#fefefe;color:#050505}
      button:focus-visible,input:focus-visible{outline:2px solid #3264ff;outline-offset:3px}
      .stage{position:fixed;inset:0;overflow:hidden;background:#d9d9d6}
      .frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fefefe}
      .topbar{position:fixed;z-index:23;top:12px;left:50%;transform:translateX(-50%);display:flex;align-items:stretch;width:max-content;max-width:calc(100vw - 24px);overflow-x:auto;border:1px solid #050505;background:#fefefe;box-shadow:0 5px 18px #05050518}
      .topbar[hidden]{display:none}
      .brand{display:grid;align-content:center;min-width:max-content;padding:0 13px;border-right:1px solid #050505;font:700 11px/1.15 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.07em;text-transform:uppercase;cursor:move;user-select:none}.brand small{display:block;margin-top:3px;color:#777;font-size:8px;font-weight:500}
      .topbar-group{display:flex;flex:0 0 auto;min-width:0;border-right:1px solid #050505}.topbar-group:last-child{border-right:0}.layer-count{display:grid;flex:0 0 auto;min-width:62px;place-items:center;padding:0 10px;color:#666;font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:nowrap}
      .inspector{position:fixed;z-index:22;right:14px;top:70px;width:min(356px,calc(100vw - 28px));max-height:calc(100svh - 84px);overflow:auto;padding:13px 14px 14px;border:1px solid #050505;background:#fefefef5;box-shadow:0 8px 22px #05050516;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      .inspector[hidden],.inspector-body[hidden],.inspector-empty[hidden]{display:none}.inspector-header{display:flex;align-items:start;justify-content:space-between;gap:12px;padding-bottom:10px;border-bottom:1px solid #bbb;cursor:move;user-select:none}.inspector-header button{min-height:28px;padding:0 7px;border:1px solid #888;font-size:8px;cursor:pointer}.layer-name{min-width:0;margin:0;font-size:12px;line-height:1.35;word-break:break-word}.source-name{display:block;margin-top:4px;color:#777;font-size:9px;font-weight:500}.inspector-empty{margin:12px 0 0;color:#666;font-size:10px;line-height:1.5}.geometry{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin:11px 0;background:#bbb;border:1px solid #bbb}.metric{padding:7px 6px;background:#fefefe}.metric span{display:block;color:#777;font-size:8px;text-transform:uppercase}.metric output{display:block;margin-top:3px;font-size:10px}.text-controls,.css-controls{margin:0 0 11px;padding:10px 0;border-top:1px solid #bbb;border-bottom:1px solid #bbb}.text-controls[hidden],.css-controls[hidden]{display:none}.text-controls-title,.css-controls-title{display:block;margin-bottom:8px;color:#666;font-size:9px;text-transform:uppercase;letter-spacing:.08em}.text-measures{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.text-field{display:grid;gap:4px;color:#777;font-size:8px;text-transform:uppercase}.text-field input,.text-field select,.css-property,.css-value{width:100%;min-width:0;height:30px;padding:0 6px;border:1px solid #aaa;border-radius:0;background:#fefefe;color:#050505}.text-size-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-top:7px;border:1px solid #050505}.text-size-actions button{min-height:30px;padding:0 5px}.text-selects{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}.text-format-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin-top:7px;border:1px solid #050505}.text-format-actions button{min-height:32px;padding:0 5px}.css-form{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr) auto;gap:5px}.css-form button{min-height:30px;padding:0 8px;border:1px solid #050505}.css-read{display:block;width:100%;margin-top:6px;min-height:30px;border:1px solid #050505}.css-error{min-height:1.4em;margin:6px 0 0;color:#b00020;font-size:9px;line-height:1.4}.css-error:empty{display:none}.css-declarations{display:grid;gap:1px;margin-top:8px;background:#bbb;border:1px solid #bbb}.css-declaration{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px;padding:6px;background:#fefefe}.css-declaration code{min-width:0;overflow-wrap:anywhere;font:500 9px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.css-declaration button{min-height:25px;padding:0 6px;border:1px solid #888;font-size:8px}.css-declarations:empty{display:none}.inspector-actions{display:flex;border:1px solid #050505}.inspector-actions button{flex:1;padding:0 7px}.inspector-note{margin:10px 0 0;color:#666;font-size:9px;line-height:1.45}
      .selection{position:fixed;z-index:19;display:none;border:2px solid #3264ff;pointer-events:none}.selection.visible{display:block}.selection-label{position:absolute;left:-2px;top:-22px;max-width:260px;padding:4px 6px;background:#3264ff;color:#fff;font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:auto;cursor:move}.handle{position:absolute;width:12px;height:12px;border:2px solid #3264ff;background:#fefefe;pointer-events:auto}.handle-e{right:-7px;top:50%;transform:translateY(-50%);cursor:ew-resize}.handle-s{bottom:-7px;left:50%;transform:translateX(-50%);cursor:ns-resize}.handle-se{right:-7px;bottom:-7px;cursor:nwse-resize}
      .guide{position:fixed;z-index:11;background:#e5008a;pointer-events:none}.guide[hidden]{display:none}.guide-v{top:0;bottom:0;width:1px}.guide-h{left:0;right:0;height:1px}
      .notice{position:fixed;z-index:30;left:50%;bottom:14px;transform:translateX(-50%);width:min(520px,calc(100vw - 28px));padding:10px 13px;border:1px solid #050505;background:#fefefe;box-shadow:0 7px 22px #05050518;font:500 11px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.notice[hidden]{display:none}
      .ui-reveal{position:fixed;z-index:31;top:12px;left:12px;min-height:34px;border:1px solid #050505;background:#fefefe;box-shadow:0 5px 18px #05050518}.ui-reveal[hidden]{display:none}
      .editing-original .selection{opacity:.45}.editing-original .inspector{opacity:.7}
      @media(max-width:760px){.topbar{left:10px;right:10px;transform:none;overflow-x:auto}.brand{display:none}.layer-count{display:none}.inspector{top:auto;bottom:62px;left:10px;right:10px;width:auto}.notice{bottom:10px}}
    </style>
    <div class="stage">
      <iframe class="frame" title="Frozen page experiment" sandbox="allow-same-origin"></iframe>
      <div class="guide guide-v" hidden></div><div class="guide guide-h" hidden></div>
    </div>
    <div class="selection" aria-hidden="true"><span class="selection-label"></span><span class="handle handle-e" data-direction="e"></span><span class="handle handle-s" data-direction="s"></span><span class="handle handle-se" data-direction="se"></span></div>
    <header class="topbar" aria-label="Beta 3 frozen canvas controls">
      <div class="brand">DevNotes Beta 3<small>Frozen canvas proof</small></div>
      <div class="topbar-group"><button class="view-original" type="button" aria-pressed="false">Original</button><button class="view-experiment" type="button" aria-pressed="true">Experiment</button></div>
      <div class="topbar-group"><button class="undo" type="button" disabled>Undo</button><button class="redo" type="button" disabled>Redo</button><button class="reset" type="button" disabled>Reset</button></div>
      <span class="layer-count">Freezing…</span>
      <div class="topbar-group"><button class="toggle-controls" type="button">Hide controls</button><button class="hide-toolbar" type="button">Hide toolbar</button><button class="hide-ui" type="button">Hide both</button></div>
      <div class="topbar-group"><button class="exit" type="button">Exit</button></div>
    </header>
    <button class="ui-reveal" type="button" hidden>Show UI</button>
    <aside class="inspector" data-empty="true" aria-label="Selected layer controls">
      <div class="inspector-header"><h2 class="layer-name">Select a layer</h2><button class="hide-controls" type="button">Hide</button></div>
      <p class="inspector-empty">Click a rendered element to inspect geometry, typography and inline CSS.</p>
      <div class="inspector-body" hidden>
        <div class="geometry"><div class="metric"><span>X</span><output data-metric="x">0</output></div><div class="metric"><span>Y</span><output data-metric="y">0</output></div><div class="metric"><span>W</span><output data-metric="width">0</output></div><div class="metric"><span>H</span><output data-metric="height">0</output></div></div>
        <section class="text-controls" hidden aria-label="Text formatting">
          <strong class="text-controls-title">Text formatting</strong>
          <div class="text-measures"><label class="text-field">Size<input class="font-size" type="number" min="1" max="1200" step="0.1"></label><label class="text-field">Leading<input class="line-height" type="number" min="1" max="1600" step="0.1"></label><label class="text-field">Tracking<input class="letter-spacing" type="number" min="-100" max="300" step="0.1"></label></div>
          <div class="text-size-actions" aria-label="Font size adjustments"><button type="button" data-size-delta="-8">−8</button><button type="button" data-size-delta="-2">−2</button><button type="button" data-size-delta="2">+2</button><button type="button" data-size-delta="8">+8</button></div>
          <div class="text-selects"><label class="text-field">Case<select class="text-transform"><option value="none">None</option><option value="uppercase">Uppercase</option><option value="lowercase">Lowercase</option><option value="capitalize">Capitalize</option></select></label><label class="text-field">Align<select class="text-align"><option value="left">Left</option><option value="center">Centre</option><option value="right">Right</option><option value="justify">Justify</option></select></label></div>
          <div class="text-format-actions"><button class="format-bold" type="button" aria-pressed="false">Bold</button><button class="format-italic" type="button" aria-pressed="false">Italic</button><button class="format-underline" type="button" aria-pressed="false">Underline</button><button class="format-strike" type="button" aria-pressed="false">Strike</button></div>
        </section>
        <section class="css-controls" aria-label="Inline CSS">
          <strong class="css-controls-title">Inline CSS</strong>
          <form class="css-form"><input class="css-property" list="devnotes-beta3-css-properties" autocomplete="off" placeholder="property" aria-label="CSS property"><input class="css-value" autocomplete="off" placeholder="value" aria-label="CSS value"><button class="apply-css" type="submit">Apply</button></form>
          <button class="css-read" type="button">Read computed value</button>
          <p class="css-error" role="alert"></p>
          <div class="css-declarations" aria-label="Inline declarations"></div>
          <datalist id="devnotes-beta3-css-properties"><option value="color"></option><option value="background-color"></option><option value="font-family"></option><option value="font-size"></option><option value="font-weight"></option><option value="line-height"></option><option value="letter-spacing"></option><option value="text-align"></option><option value="width"></option><option value="height"></option><option value="max-width"></option><option value="margin"></option><option value="padding"></option><option value="gap"></option><option value="display"></option><option value="position"></option><option value="inset"></option><option value="translate"></option><option value="rotate"></option><option value="scale"></option><option value="opacity"></option><option value="border"></option><option value="border-radius"></option><option value="box-shadow"></option><option value="overflow"></option><option value="z-index"></option></datalist>
        </section>
        <div class="inspector-actions"><button class="edit-copy" type="button">Edit copy</button><button class="select-parent" type="button">Parent</button><button class="revert-layer" type="button">Revert layer</button></div>
        <p class="inspector-note">Drag the object or its blue label to move it. Use the handles to resize. Double-click simple text to edit it.</p>
      </div>
    </aside>
    <p class="notice" role="status">Freezing the current viewport…</p>
  `;

  const frame = root.querySelector('.frame');
  const selectionBox = root.querySelector('.selection');
  const selectionLabel = root.querySelector('.selection-label');
  const verticalGuide = root.querySelector('.guide-v');
  const horizontalGuide = root.querySelector('.guide-h');
  const topbar = root.querySelector('.topbar');
  const inspector = root.querySelector('.inspector');
  const inspectorBody = root.querySelector('.inspector-body');
  const inspectorEmpty = root.querySelector('.inspector-empty');
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
  const textControls = root.querySelector('.text-controls');
  const fontSizeInput = root.querySelector('.font-size');
  const lineHeightInput = root.querySelector('.line-height');
  const letterSpacingInput = root.querySelector('.letter-spacing');
  const textTransformSelect = root.querySelector('.text-transform');
  const textAlignSelect = root.querySelector('.text-align');
  const boldButton = root.querySelector('.format-bold');
  const italicButton = root.querySelector('.format-italic');
  const underlineButton = root.querySelector('.format-underline');
  const strikeButton = root.querySelector('.format-strike');
  const sizeButtons = [...root.querySelectorAll('[data-size-delta]')];
  const toggleControlsButton = root.querySelector('.toggle-controls');
  const hideToolbarButton = root.querySelector('.hide-toolbar');
  const hideUiButton = root.querySelector('.hide-ui');
  const hideControlsButton = root.querySelector('.hide-controls');
  const uiRevealButton = root.querySelector('.ui-reveal');
  const cssForm = root.querySelector('.css-form');
  const cssPropertyInput = root.querySelector('.css-property');
  const cssValueInput = root.querySelector('.css-value');
  const applyCssButton = root.querySelector('.apply-css');
  const cssReadButton = root.querySelector('.css-read');
  const cssError = root.querySelector('.css-error');
  const cssDeclarations = root.querySelector('.css-declarations');

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
  let activeTextEdit = null;
  let savedTextRange = null;
  let toolbarVisible = true;
  let controlsVisible = true;
  const textDrafts = new Map();

  const textBlockSelector = 'h1,h2,h3,h4,h5,h6,p,a,button,label,summary,figcaption,dt,dd,blockquote,pre,code,li';

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

  function textLayer(element) {
    return element?.dataset.devnotesBeta3TextLayer === 'true';
  }

  function snapshotState(element) {
    return {
      style: element.getAttribute('style'),
      html: textLayer(element) ? element.innerHTML : null,
    };
  }

  function applyState(element, state) {
    if (state.style === null || state.style === undefined) element.removeAttribute('style');
    else element.setAttribute('style', state.style);
    if (state.html !== null && state.html !== undefined && textLayer(element)) element.innerHTML = state.html;
  }

  function sameState(a, b) {
    return a.style === b.style && a.html === b.html;
  }

  function assignLayers() {
    const visible = [...frameDocument.body.querySelectorAll('*')].filter(meaningfulElement);
    const candidates = visible.filter((element) => {
      const authoredTextRoot = element.closest(textBlockSelector);
      return !authoredTextRoot || authoredTextRoot === element || !meaningfulElement(authoredTextRoot);
    });
    candidates.forEach((element, index) => {
      const id = `layer-${index + 1}`;
      const hasText = Boolean((element.textContent || '').trim());
      const nestedTextRoot = element.querySelector(textBlockSelector);
      const isTextLayer = hasText && (element.childElementCount === 0
        || (element.matches(textBlockSelector) && !nestedTextRoot));
      element.dataset.devnotesBeta3Layer = id;
      if (isTextLayer) element.dataset.devnotesBeta3TextLayer = 'true';
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

  function numericStyle(value, fallback = 0) {
    const number = Number.parseFloat(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function updateUiVisibility() {
    topbar.hidden = !toolbarVisible;
    inspector.hidden = !controlsVisible;
    toggleControlsButton.textContent = controlsVisible ? 'Hide controls' : 'Show controls';
    toggleControlsButton.setAttribute('aria-pressed', String(controlsVisible));
    const anyHidden = !toolbarVisible || !controlsVisible;
    uiRevealButton.hidden = !anyHidden;
    uiRevealButton.textContent = !toolbarVisible && !controlsVisible
      ? 'Show UI'
      : !toolbarVisible
        ? 'Show toolbar'
        : 'Show controls';
  }

  function setUiVisibility({toolbar = toolbarVisible, controls = controlsVisible} = {}) {
    toolbarVisible = toolbar;
    controlsVisible = controls;
    updateUiVisibility();
  }

  function clampFloatingPanel(panel) {
    if (panel.hidden || !panel.style.left || !panel.style.top) return;
    const rect = panel.getBoundingClientRect();
    const left = Math.min(Math.max(8, rect.left), Math.max(8, innerWidth - rect.width - 8));
    const top = Math.min(Math.max(8, rect.top), Math.max(8, innerHeight - rect.height - 8));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
  }

  function makeFloatingPanelDraggable(panel, handle) {
    let panelDrag = null;

    function movePanel(event) {
      if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const left = Math.min(
        Math.max(8, event.clientX - panelDrag.offsetX),
        Math.max(8, innerWidth - width - 8),
      );
      const top = Math.min(
        Math.max(8, event.clientY - panelDrag.offsetY),
        Math.max(8, innerHeight - height - 8),
      );
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }

    function finishPanelDrag(event) {
      if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
      panelDrag = null;
      if (handle.hasPointerCapture?.(event.pointerId)) handle.releasePointerCapture(event.pointerId);
    }

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest?.('button,input,select,textarea,option')) return;
      const rect = panel.getBoundingClientRect();
      panel.style.left = `${rect.left}px`;
      panel.style.top = `${rect.top}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
      panelDrag = {
        pointerId: event.pointerId,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
      };
      handle.setPointerCapture?.(event.pointerId);
      event.preventDefault();
    });
    handle.addEventListener('pointermove', movePanel);
    handle.addEventListener('pointerup', finishPanelDrag);
    handle.addEventListener('pointercancel', finishPanelDrag);
  }

  function updateCssDeclarations() {
    cssDeclarations.replaceChildren();
    if (!selected) return;
    for (let index = 0; index < selected.style.length; index += 1) {
      const property = selected.style.item(index);
      const row = document.createElement('div');
      row.className = 'css-declaration';
      const declaration = document.createElement('code');
      const priority = selected.style.getPropertyPriority(property);
      declaration.textContent = `${property}: ${selected.style.getPropertyValue(property)}${priority ? ' !important' : ''};`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.dataset.cssRemove = property;
      remove.textContent = 'Remove';
      remove.disabled = viewMode !== 'experiment';
      row.append(declaration, remove);
      cssDeclarations.append(row);
    }
  }

  function cssPropertyName() {
    return cssPropertyInput.value.trim().toLowerCase();
  }

  function readComputedCssValue() {
    cssError.textContent = '';
    if (!selected) {
      cssError.textContent = 'Select a layer first.';
      return;
    }
    const property = cssPropertyName();
    if (!property) {
      cssError.textContent = 'Enter a CSS property.';
      return;
    }
    const value = frame.contentWindow.getComputedStyle(selected).getPropertyValue(property).trim();
    if (!value) {
      cssError.textContent = `No computed value found for ${property}.`;
      return;
    }
    cssValueInput.value = value;
  }

  function applyCssDeclaration(event) {
    event?.preventDefault();
    cssError.textContent = '';
    if (!selected || viewMode !== 'experiment') {
      cssError.textContent = 'Select a layer in Experiment first.';
      return;
    }
    const property = cssPropertyName();
    const value = cssValueInput.value.trim();
    if (!property || !value) {
      cssError.textContent = 'Enter both a property and value.';
      return;
    }
    const validName = property.startsWith('--') || /^-?[a-z][a-z0-9-]*$/.test(property);
    const validValue = property.startsWith('--') || frame.contentWindow.CSS.supports(property, value);
    if (!validName || !validValue) {
      cssError.textContent = `Invalid declaration: ${property}: ${value}`;
      return;
    }
    finishTextEdit();
    const before = snapshotState(selected);
    selected.style.setProperty(property, value);
    commitOperation(selected, before, 'set-css-property');
    cssPropertyInput.value = property;
    cssValueInput.value = selected.style.getPropertyValue(property);
    updateSelection();
    showNotice(`${property} applied to the selected layer.`);
  }

  function removeCssDeclaration(property) {
    if (!selected || viewMode !== 'experiment' || !property) return;
    finishTextEdit();
    const before = snapshotState(selected);
    selected.style.removeProperty(property);
    commitOperation(selected, before, 'remove-css-property');
    updateSelection();
    showNotice(`${property} removed from the selected layer.`);
  }

  function updateTextControls() {
    const visible = Boolean(selected && textLayer(selected));
    textControls.hidden = !visible;
    if (!visible) return;
    const style = frame.contentWindow.getComputedStyle(selected);
    const size = numericStyle(style.fontSize, 16);
    fontSizeInput.value = String(Math.round(size * 10) / 10);
    lineHeightInput.value = String(Math.round(numericStyle(style.lineHeight, size * 1.2) * 10) / 10);
    letterSpacingInput.value = String(Math.round(numericStyle(style.letterSpacing, 0) * 10) / 10);
    const transform = ['none', 'uppercase', 'lowercase', 'capitalize'].includes(style.textTransform)
      ? style.textTransform
      : 'none';
    const align = style.textAlign === 'start' ? 'left' : style.textAlign === 'end' ? 'right' : style.textAlign;
    textTransformSelect.value = transform;
    textAlignSelect.value = ['left', 'center', 'right', 'justify'].includes(align) ? align : 'left';
    boldButton.setAttribute('aria-pressed', String(numericStyle(style.fontWeight, 400) >= 600));
    italicButton.setAttribute('aria-pressed', String(style.fontStyle === 'italic' || style.fontStyle === 'oblique'));
    const decorations = new Set(style.textDecorationLine.split(/\s+/));
    underlineButton.setAttribute('aria-pressed', String(decorations.has('underline')));
    strikeButton.setAttribute('aria-pressed', String(decorations.has('line-through')));
  }

  function updateControls() {
    const editable = viewMode === 'experiment';
    originalButton.setAttribute('aria-pressed', String(!editable));
    experimentButton.setAttribute('aria-pressed', String(editable));
    undoButton.disabled = !editable || historyCursor === 0;
    redoButton.disabled = !editable || historyCursor >= history.length;
    resetButton.disabled = !editable || history.length === 0;
    editCopyButton.disabled = !editable || !selected || !textLayer(selected);
    editCopyButton.textContent = activeTextEdit?.element === selected ? 'Done text' : 'Edit text';
    parentButton.disabled = !selected || !meaningfulElement(selected.parentElement);
    revertLayerButton.disabled = !editable || !selected || !history.some((operation, index) => index < historyCursor && operation.layerId === selected.dataset.devnotesBeta3Layer);
    for (const control of [fontSizeInput, lineHeightInput, letterSpacingInput, textTransformSelect, textAlignSelect, boldButton, italicButton, underlineButton, strikeButton, ...sizeButtons]) control.disabled = !editable || !selected || !textLayer(selected);
    for (const control of [cssPropertyInput, cssValueInput, cssReadButton, applyCssButton]) control.disabled = !editable || !selected;
    host.classList.toggle('editing-original', !editable);
    updateTextControls();
    updateCssDeclarations();
    updateUiVisibility();
  }

  function metric(name, value) {
    root.querySelector(`[data-metric="${name}"]`).textContent = String(Math.round(value));
  }

  function updateSelection() {
    if (!selected || !selected.isConnected) {
      selectionBox.classList.remove('visible');
      inspector.dataset.empty = 'true';
      inspectorBody.hidden = true;
      inspectorEmpty.hidden = false;
      layerName.textContent = 'Select a layer';
      textControls.hidden = true;
      updateControls();
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
    inspector.dataset.empty = 'false';
    inspectorBody.hidden = false;
    inspectorEmpty.hidden = true;
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

  function clearGuides() {
    verticalGuide.hidden = true;
    horizontalGuide.hidden = true;
  }

  function alignmentCandidates(element) {
    const x = new Set([0, frame.contentWindow.innerWidth / 2, frame.contentWindow.innerWidth]);
    const y = new Set([0, frame.contentWindow.innerHeight / 2, frame.contentWindow.innerHeight]);
    for (const layer of layers.values()) {
      const candidate = layer.element;
      if (candidate === element || !candidate.isConnected || candidate.contains(element) || element.contains(candidate)) continue;
      const rect = candidate.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2 || rect.right < 0 || rect.bottom < 0 || rect.left > innerWidth || rect.top > innerHeight) continue;
      x.add(rect.left);x.add(rect.left + rect.width / 2);x.add(rect.right);
      y.add(rect.top);y.add(rect.top + rect.height / 2);y.add(rect.bottom);
    }
    return { x: [...x], y: [...y] };
  }

  function closestSnap(points, candidates, tolerance = 7) {
    let best = null;
    for (const point of points) {
      for (const candidate of candidates) {
        const offset = candidate - point;
        if (Math.abs(offset) <= tolerance && (!best || Math.abs(offset) < Math.abs(best.offset))) best = { candidate, offset };
      }
    }
    return best;
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
      rect: element.getBoundingClientRect(),
      candidates: alignmentCandidates(element),
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
    const proposedX = [drag.rect.left + dx, drag.rect.left + drag.rect.width / 2 + dx, drag.rect.right + dx];
    const proposedY = [drag.rect.top + dy, drag.rect.top + drag.rect.height / 2 + dy, drag.rect.bottom + dy];
    const snapX = closestSnap(proposedX, drag.candidates.x);
    const snapY = closestSnap(proposedY, drag.candidates.y);
    drag.element.style.translate = `${drag.translate.x + dx + (snapX?.offset || 0)}px ${drag.translate.y + dy + (snapY?.offset || 0)}px`;
    verticalGuide.hidden = !snapX;
    horizontalGuide.hidden = !snapY;
    if (snapX) verticalGuide.style.left = `${snapX.candidate}px`;
    if (snapY) horizontalGuide.style.top = `${snapY.candidate}px`;
    updateSelection();
  }

  function finishMove(event) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.captureTarget.releasePointerCapture?.(event.pointerId);
    commitOperation(drag.element, drag.before, 'move-layer');
    drag = null;
    clearGuides();
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
      captureTarget: event.currentTarget,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    addEventListener('pointermove', resizePointer, true);
    addEventListener('pointerup', finishResize, true);
    addEventListener('pointercancel', finishResize, true);
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
    resize.captureTarget.releasePointerCapture?.(event.pointerId);
    removeEventListener('pointermove', resizePointer, true);
    removeEventListener('pointerup', finishResize, true);
    removeEventListener('pointercancel', finishResize, true);
    commitOperation(resize.element, resize.before, 'resize-layer');
    resize = null;
    updateSelection();
  }

  function finishTextEdit() {
    if (!activeTextEdit) return;
    const { element, before } = activeTextEdit;
    element.contentEditable = 'false';
    element.removeAttribute('contenteditable');
    activeTextEdit = null;
    savedTextRange = null;
    commitOperation(element, before, 'edit-copy');
    updateSelection();
  }

  function startCopyEdit({ selectAll = true } = {}) {
    if (!selected || !textLayer(selected) || viewMode !== 'experiment') {
      showNotice('Select a text layer to edit its copy.');
      return;
    }
    if (activeTextEdit?.element === selected) {
      finishTextEdit();
      return;
    }
    finishTextEdit();
    const element = selected;
    activeTextEdit = { element, before: snapshotState(element) };
    savedTextRange = null;
    element.contentEditable = 'true';
    element.focus({ preventScroll: true });
    if (selectAll) {
      const range = frameDocument.createRange();
      range.selectNodeContents(element);
      const selection = frame.contentWindow.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      savedTextRange = range.cloneRange();
    }
    updateControls();
    showNotice('Text editing active. Select a word or phrase for inline formatting.');
  }

  function selectedInlineRange() {
    if (!activeTextEdit || !savedTextRange || savedTextRange.collapsed) return null;
    const ancestor = savedTextRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? savedTextRange.commonAncestorContainer
      : savedTextRange.commonAncestorContainer.parentElement;
    return activeTextEdit.element.contains(ancestor) ? savedTextRange : null;
  }

  function applyInlineCommand(command) {
    const range = selectedInlineRange();
    if (!range || !activeTextEdit) return false;
    const element = activeTextEdit.element;
    const before = snapshotState(element);
    element.focus({ preventScroll: true });
    const selection = frame.contentWindow.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    frameDocument.execCommand(command, false);
    const currentSelection = frame.contentWindow.getSelection();
    savedTextRange = currentSelection.rangeCount ? currentSelection.getRangeAt(0).cloneRange() : null;
    commitOperation(element, before, 'format-inline-text');
    activeTextEdit.before = snapshotState(element);
    updateSelection();
    return true;
  }

  function applyTextStyle(mutator) {
    if (!selected || !textLayer(selected) || viewMode !== 'experiment') return;
    const element = selected;
    const before = snapshotState(element);
    mutator(element, frame.contentWindow.getComputedStyle(element));
    commitOperation(element, before, 'format-text');
    if (activeTextEdit?.element === element) activeTextEdit.before = snapshotState(element);
    updateSelection();
  }

  function beginTextMeasure(input) {
    if (!selected || !textLayer(selected) || viewMode !== 'experiment') return;
    textDrafts.set(input, { element: selected, before: snapshotState(selected) });
  }

  function previewTextMeasure(input, property) {
    const draft = textDrafts.get(input);
    const value = Number.parseFloat(input.value);
    if (!draft || !Number.isFinite(value)) return;
    draft.element.style[property] = `${value}px`;
    updateSelection();
  }

  function finishTextMeasure(input) {
    const draft = textDrafts.get(input);
    if (!draft) return;
    textDrafts.delete(input);
    commitOperation(draft.element, draft.before, 'format-text');
    if (activeTextEdit?.element === draft.element) activeTextEdit.before = snapshotState(draft.element);
    updateSelection();
  }

  function toggleDecoration(name) {
    const command = name === 'line-through' ? 'strikeThrough' : name;
    if (applyInlineCommand(command)) return;
    applyTextStyle((element, style) => {
      const lines = new Set(style.textDecorationLine.split(/\s+/).filter((line) => line && line !== 'none'));
      if (lines.has(name)) lines.delete(name);
      else lines.add(name);
      element.style.textDecorationLine = lines.size ? [...lines].join(' ') : 'none';
    });
  }

  function revertSelectedLayer() {
    if (!selected || viewMode !== 'experiment') return;
    finishTextEdit();
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
    finishTextEdit();
    viewMode = next;
    applyHistory(next === 'original' ? 0 : historyCursor);
    showNotice(next === 'original' ? 'Showing immutable original.' : 'Showing editable experiment.');
  }

  function resetExperiment() {
    finishTextEdit();
    clearGuides();
    history.splice(0);
    historyCursor = 0;
    viewMode = 'experiment';
    applyHistory(0);
    showNotice('Experiment reset. The live page was never changed.');
  }

  function exitBeta3() {
    finishTextEdit();
    if (noticeTimer) clearTimeout(noticeTimer);
    clearGuides();
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
      if (activeTextEdit) {
        if (activeTextEdit.element.contains(event.target)) {
          selectLayer(activeTextEdit.element);
          return;
        }
        finishTextEdit();
      }
      clearHover();
      selectLayer(element);
      beginMove(event, element);
    }, true);

    frameDocument.addEventListener('pointermove', movePointer, true);
    frameDocument.addEventListener('pointerup', finishMove, true);
    frameDocument.addEventListener('pointercancel', finishMove, true);
    frameDocument.addEventListener('click', (event) => {
      if (activeTextEdit?.element.contains(event.target)) return;
      if (event.target.closest?.('[data-devnotes-beta3-layer]')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
    frameDocument.addEventListener('dblclick', (event) => {
      const element = event.target.closest?.('[data-devnotes-beta3-layer]');
      if (!element) return;
      if (activeTextEdit?.element === element) return;
      selectLayer(element);
      startCopyEdit({ selectAll: false });
    }, true);
    frameDocument.addEventListener('selectionchange', () => {
      if (!activeTextEdit) return;
      const selection = frame.contentWindow.getSelection();
      if (!selection.rangeCount) return;
      const range = selection.getRangeAt(0);
      const ancestor = range.commonAncestorContainer.nodeType === 1
        ? range.commonAncestorContainer
        : range.commonAncestorContainer.parentElement;
      if (activeTextEdit.element.contains(ancestor)) savedTextRange = range.cloneRange();
    });
    frameDocument.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redoButton.click();
        else undoButton.click();
      } else if (event.key === 'Escape' && activeTextEdit) {
        event.preventDefault();
        finishTextEdit();
      }
    }, true);
    frameDocument.addEventListener('scroll', updateSelection, { passive: true });
    frame.contentWindow.addEventListener('resize', updateSelection);
    showNotice(`${layers.size} rendered layers frozen. Select one to begin.`, 4200);
    updateSelection();
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

  for (const [input, property] of [
    [fontSizeInput, 'fontSize'],
    [lineHeightInput, 'lineHeight'],
    [letterSpacingInput, 'letterSpacing'],
  ]) {
    input.addEventListener('focus', () => beginTextMeasure(input));
    input.addEventListener('input', () => previewTextMeasure(input, property));
    input.addEventListener('change', () => finishTextMeasure(input));
    input.addEventListener('blur', () => finishTextMeasure(input));
  }

  textTransformSelect.addEventListener('change', () => applyTextStyle((element) => { element.style.textTransform = textTransformSelect.value; }));
  textAlignSelect.addEventListener('change', () => applyTextStyle((element) => { element.style.textAlign = textAlignSelect.value; }));
  sizeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const delta = Number(button.dataset.sizeDelta);
      applyTextStyle((element, style) => {
        element.style.fontSize = `${Math.max(1, numericStyle(style.fontSize, 16) + delta)}px`;
      });
    });
  });
  boldButton.addEventListener('click', () => { if (!applyInlineCommand('bold')) applyTextStyle((element, style) => { element.style.fontWeight = numericStyle(style.fontWeight, 400) >= 600 ? '400' : '700'; }); });
  italicButton.addEventListener('click', () => { if (!applyInlineCommand('italic')) applyTextStyle((element, style) => { element.style.fontStyle = style.fontStyle === 'italic' || style.fontStyle === 'oblique' ? 'normal' : 'italic'; }); });
  underlineButton.addEventListener('click', () => toggleDecoration('underline'));
  strikeButton.addEventListener('click', () => toggleDecoration('line-through'));

  cssForm.addEventListener('submit', applyCssDeclaration);
  cssReadButton.addEventListener('click', readComputedCssValue);
  cssDeclarations.addEventListener('click', (event) => {
    const remove = event.target.closest?.('[data-css-remove]');
    if (remove) removeCssDeclaration(remove.dataset.cssRemove);
  });

  toggleControlsButton.addEventListener('click', () => setUiVisibility({ controls: !controlsVisible }));
  hideToolbarButton.addEventListener('click', () => setUiVisibility({ toolbar: false }));
  hideUiButton.addEventListener('click', () => setUiVisibility({ toolbar: false, controls: false }));
  hideControlsButton.addEventListener('click', () => setUiVisibility({ controls: false }));
  uiRevealButton.addEventListener('click', () => setUiVisibility({ toolbar: true, controls: true }));
  makeFloatingPanelDraggable(topbar, root.querySelector('.brand'));
  makeFloatingPanelDraggable(inspector, root.querySelector('.inspector-header'));

  originalButton.addEventListener('click', () => setViewMode('original'));
  experimentButton.addEventListener('click', () => setViewMode('experiment'));
  undoButton.addEventListener('click', () => { finishTextEdit();if (historyCursor > 0) { historyCursor -= 1; applyHistory(historyCursor); } });
  redoButton.addEventListener('click', () => { finishTextEdit();if (historyCursor < history.length) { historyCursor += 1; applyHistory(historyCursor); } });
  resetButton.addEventListener('click', resetExperiment);
  editCopyButton.addEventListener('click', startCopyEdit);
  parentButton.addEventListener('click', () => { finishTextEdit();if (selected?.parentElement && meaningfulElement(selected.parentElement)) selectLayer(selected.parentElement); });
  revertLayerButton.addEventListener('click', revertSelectedLayer);
  root.querySelector('.exit').addEventListener('click', exitBeta3);
  addEventListener('resize', () => {
    clampFloatingPanel(topbar);
    clampFloatingPanel(inspector);
    updateSelection();
  });
  addEventListener('keydown', (event) => {
    if (!host.isConnected) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) redoButton.click();
      else undoButton.click();
    } else if (event.key === 'Escape' && activeTextEdit) {
      event.preventDefault();
      finishTextEdit();
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
      ui: { toolbarVisible, controlsVisible },
      sourceUrl: location.href,
      sourceUnchanged: true,
    }),
  };
})();
