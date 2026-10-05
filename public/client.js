(() => {
  if (window.__liveInterfaceAnnotationPrototype) {
    window.__liveInterfaceAnnotationPrototype.show();
    window.__liveInterfaceAnnotationPrototype.reload();
    return;
  }

  const api = 'http://127.0.0.1:4347';
  const svgNS = 'http://www.w3.org/2000/svg';
  const tools = {
    polygon: 'Polygon',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    line: 'Line',
    arrow: 'Arrow',
    highlight: 'Highlight',
  };

  const host = document.createElement('div');
  host.id = 'live-interface-annotation-prototype';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  document.documentElement.append(host);
  const root = host.attachShadow({ mode: 'open' });

  root.innerHTML = `
    <style>
      :host{all:initial;color-scheme:light}*{box-sizing:border-box}
      button,select,textarea,input{font:500 12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      button,select{min-height:42px;border:0;border-right:1px solid #050505;background:#fefefe;color:#050505;border-radius:0;cursor:pointer;text-transform:uppercase;letter-spacing:.06em}
      button:hover,button[aria-pressed="true"]{background:#050505;color:#fefefe}
      button:focus-visible,select:focus-visible,textarea:focus-visible,input:focus-visible{outline:2px solid #050505;outline-offset:3px}
      .dock{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));display:flex;align-items:stretch;max-width:calc(100vw - 36px);pointer-events:auto;background:#fefefe;border:1px solid #050505}
      .dock select{max-width:132px;padding:0 30px 0 12px}.dock button{padding:0 12px}.dock button:last-child{border-right:0}
      .colour-wrap{display:grid;place-items:center;width:44px;border-right:1px solid #050505;background:#fefefe}
      .colour{width:24px;height:24px;padding:0;border:1px solid #050505;border-radius:50%;background:none;cursor:pointer;overflow:hidden}
      .colour::-webkit-color-swatch-wrapper{padding:0}.colour::-webkit-color-swatch{border:0;border-radius:50%}
      .count{display:grid;min-width:38px;place-items:center;padding:0 8px;font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      .surface{position:fixed;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}.surface.drawing{cursor:crosshair;pointer-events:auto;touch-action:none}
      .saved-shape,.draft-shape{stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.saved-shape{fill-opacity:.08}.draft-shape{fill-opacity:.05;stroke-dasharray:5 4}
      .saved-shape.highlight-shape{stroke:none;fill-opacity:.28}.draft-shape.highlight-shape{stroke:none;fill-opacity:.22}
      .draft-vertex{fill:#fefefe;stroke-width:2;vector-effect:non-scaling-stroke}.draft-vertex.start{stroke:#fefefe;stroke-width:2}
      .marker circle{stroke:#fefefe;stroke-width:1.5}.marker text{fill:#fefefe;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-anchor:middle;dominant-baseline:central}
      .editor{position:fixed;right:max(18px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top));width:min(360px,calc(100vw - 36px));max-height:calc(100svh - 36px);overflow:auto;padding:14px;background:#fefefe;border:1px solid #050505;pointer-events:auto}
      .editor[hidden]{display:none}.editor-label{display:block;margin:0 0 10px;text-transform:uppercase;letter-spacing:.08em;font:500 11px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      textarea{display:block;width:100%;min-height:112px;resize:vertical;border:1px solid #050505;border-radius:0;padding:10px;background:#fefefe;color:#050505}
      .actions{display:flex;justify-content:flex-end;gap:8px;margin-top:10px}.actions button{padding:8px 11px;border:1px solid #050505}.save{background:#050505;color:#fefefe}.status{min-height:16px;margin:9px 0 0;color:#555;font:500 11px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      @media(max-width:600px){.dock{left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));display:grid;grid-template-columns:minmax(0,1fr) 44px auto 38px 34px 34px}.dock select{width:100%;max-width:none}.dock button{padding:0 7px}.count{min-width:0;padding:0 5px}.editor{left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));width:auto;max-height:calc(100svh - 88px)}}
    </style>
    <svg class="surface" aria-hidden="true">
      <defs><marker id="lia-arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"></path></marker></defs>
      <g class="saved"></g><g class="draft"></g><g class="vertices"></g>
    </svg>
    <section class="editor" hidden aria-label="Selection note">
      <label class="editor-label" for="lia-note">Note on this shape</label>
      <textarea id="lia-note" placeholder="What do you notice?"></textarea>
      <div class="actions"><button class="cancel" type="button">Cancel</button><button class="save" type="button">Save note</button></div>
      <p class="status" role="status"></p>
    </section>
    <div class="dock" aria-label="Live annotation controls">
      <select class="tool" aria-label="Drawing tool">${Object.entries(tools).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select>
      <label class="colour-wrap" title="Annotation colour"><input class="colour" type="color" value="#111111" aria-label="Annotation colour"></label>
      <button class="draw" type="button" aria-pressed="false">Draw</button>
      <button class="visibility" type="button" aria-pressed="true" aria-label="Show or hide notes">◎</button>
      <span class="count" aria-label="Saved note count">0</span>
      <button class="close" type="button" aria-label="Remove annotation layer">×</button>
    </div>`;

  const surface = root.querySelector('.surface');
  const savedLayer = root.querySelector('.saved');
  const draftLayer = root.querySelector('.draft');
  const vertices = root.querySelector('.vertices');
  const editor = root.querySelector('.editor');
  const textArea = root.querySelector('textarea');
  const status = root.querySelector('.status');
  const toolSelect = root.querySelector('.tool');
  const colourInput = root.querySelector('.colour');
  const drawButton = root.querySelector('.draw');
  const visibilityButton = root.querySelector('.visibility');
  const count = root.querySelector('.count');
  let enabled = false;
  let dragging = false;
  let visible = true;
  let draft = null;
  let notes = [];

  const pageUrl = () => `${location.origin}${location.pathname}${location.search}`;
  const eventPoint = (event) => ({ x: Math.round((event.clientX + scrollX) * 10) / 10, y: Math.round((event.clientY + scrollY) * 10) / 10 });
  const viewportPoint = (point) => ({ x: point.x - scrollX, y: point.y - scrollY });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function boxFor(points) { const xs=points.map(p=>p.x),ys=points.map(p=>p.y),left=Math.min(...xs),top=Math.min(...ys);return {left,top,width:Math.max(...xs)-left,height:Math.max(...ys)-top}; }
  function selectorFor(element) { if (!(element instanceof Element)) return null; if (element.id) return `#${CSS.escape(element.id)}`; const classes=[...element.classList].slice(0,3).map(name=>`.${CSS.escape(name)}`).join(''); return `${element.tagName.toLowerCase()}${classes}`; }
  function elementsWithin(box) {
    const samples=[[box.left,box.top],[box.left+box.width/2,box.top+box.height/2],[box.left+box.width,box.top+box.height],[box.left+box.width,box.top],[box.left,box.top+box.height]],seen=new Set(),result=[];
    for(const [dx,dy] of samples){const x=Math.max(0,Math.min(innerWidth-1,dx-scrollX)),y=Math.max(0,Math.min(innerHeight-1,dy-scrollY));for(const element of document.elementsFromPoint(x,y)){if(element===host||seen.has(element)||element===document.documentElement||element===document.body)continue;seen.add(element);const rect=element.getBoundingClientRect();result.push({selector:selectorFor(element),tag:element.tagName.toLowerCase(),text:(element.innerText||'').trim().replace(/\s+/g,' ').slice(0,240),bounds:{left:Math.round((rect.left+scrollX)*10)/10,top:Math.round((rect.top+scrollY)*10)/10,width:Math.round(rect.width*10)/10,height:Math.round(rect.height*10)/10}});if(result.length>=8)return result;}}
    return result;
  }

  function responsiveSelection(note) {
    const selection = note.selection;
    const anchor = note.elements?.[0];
    if (!anchor?.selector || !anchor.bounds || !note.viewport || Math.abs(note.viewport.width - innerWidth) < 2) return selection;
    let element;
    try { element = document.querySelector(anchor.selector); } catch { return selection; }
    if (!element || anchor.bounds.width <= 0 || anchor.bounds.height <= 0) return selection;
    const rect = element.getBoundingClientRect();
    const current = { left: rect.left + scrollX, top: rect.top + scrollY, width: rect.width, height: rect.height };
    return {
      ...selection,
      points: selection.points.map((point) => ({
        x: current.left + ((point.x - anchor.bounds.left) / anchor.bounds.width) * current.width,
        y: current.top + ((point.y - anchor.bounds.top) / anchor.bounds.height) * current.height,
      })),
    };
  }

  function shapeFor(selection, className) {
    const type=selection.type==='lasso'?'polygon':selection.type,colour=selection.color||'#111111',points=selection.points.map(viewportPoint);let shape;
    if(type==='polygon'){shape=document.createElementNS(svgNS,'polygon');shape.setAttribute('points',points.map(p=>`${p.x},${p.y}`).join(' '));}
    else if(type==='rectangle'||type==='highlight'){const box=boxFor(points);shape=document.createElementNS(svgNS,'rect');shape.setAttribute('x',box.left);shape.setAttribute('y',box.top);shape.setAttribute('width',box.width);shape.setAttribute('height',box.height);}
    else if(type==='ellipse'){const box=boxFor(points);shape=document.createElementNS(svgNS,'ellipse');shape.setAttribute('cx',box.left+box.width/2);shape.setAttribute('cy',box.top+box.height/2);shape.setAttribute('rx',box.width/2);shape.setAttribute('ry',box.height/2);}
    else{shape=document.createElementNS(svgNS,'line');shape.setAttribute('x1',points[0].x);shape.setAttribute('y1',points[0].y);shape.setAttribute('x2',points[1].x);shape.setAttribute('y2',points[1].y);if(type==='arrow')shape.setAttribute('marker-end','url(#lia-arrowhead)');}
    shape.setAttribute('class',`${className}${type==='highlight'?' highlight-shape':''}`);shape.setAttribute('stroke',type==='highlight'?'none':colour);shape.setAttribute('fill',['polygon','rectangle','ellipse','highlight'].includes(type)?colour:'none');return shape;
  }

  function render() {
    savedLayer.replaceChildren(); if (!visible) return;
    for (const note of notes) {
      const selection = responsiveSelection(note);
      savedLayer.append(shapeFor(selection,'saved-shape'));
      const first=viewportPoint(selection.points[0]),colour=selection.color||'#111111',marker=document.createElementNS(svgNS,'g');marker.setAttribute('class','marker');marker.setAttribute('transform',`translate(${first.x},${first.y})`);
      const circle=document.createElementNS(svgNS,'circle');circle.setAttribute('r','12');circle.setAttribute('fill',colour);const label=document.createElementNS(svgNS,'text');label.textContent=String(note.number);marker.append(circle,label);savedLayer.append(marker);
    }
  }
  function renderDraft() {
    draftLayer.replaceChildren(); vertices.replaceChildren(); if (!draft) return;
    const selection={type:draft.type,color:draft.color,points:draft.type==='polygon'&&draft.hover?[...draft.points,draft.hover]:draft.points};draftLayer.append(shapeFor(selection,'draft-shape'));
    if(draft.type==='polygon')draft.points.forEach((point,index)=>{const p=viewportPoint(point),vertex=document.createElementNS(svgNS,'circle');vertex.setAttribute('class',`draft-vertex${index===0?' start':''}`);vertex.setAttribute('cx',p.x);vertex.setAttribute('cy',p.y);vertex.setAttribute('r',index===0?'7':'5');vertex.setAttribute('stroke',draft.color);if(index===0)vertex.setAttribute('fill',draft.color);vertices.append(vertex);});
  }
  function setEnabled(next) { enabled=next;drawButton.setAttribute('aria-pressed',String(enabled));surface.classList.toggle('drawing',enabled);drawButton.textContent=enabled?'Drawing':'Draw';if(!enabled)dragging=false; }
  function cancelDraft() { draft=null;draftLayer.replaceChildren();vertices.replaceChildren();editor.hidden=true;textArea.value='';status.textContent=''; }
  async function loadNotes() { const response=await fetch(`${api}/api/notes?url=${encodeURIComponent(pageUrl())}`);if(!response.ok)throw new Error(`load_failed_${response.status}`);notes=(await response.json()).notes;count.textContent=String(notes.length);render(); }
  function finishDraft() { if(!draft)return;const minimum=draft.type==='polygon'?3:2;if(draft.points.length<minimum){status.textContent=`Place at least ${minimum} points.`;return;}draft.hover=null;draft.selectionBounds=boxFor(draft.points);if(draft.selectionBounds.width<5&&draft.selectionBounds.height<5){cancelDraft();return;}draft.elements=elementsWithin(draft.selectionBounds);setEnabled(false);editor.hidden=false;queueMicrotask(()=>textArea.focus()); }

  surface.addEventListener('pointerdown',(event)=>{
    if(!enabled||!editor.hidden)return;const point=eventPoint(event),type=toolSelect.value;
    if(type==='polygon'){
      if(!draft)draft={type,color:colourInput.value,points:[point],hover:point};
      else if(draft.points.length>=3&&distance(point,draft.points[0])<=14){finishDraft();event.preventDefault();return;}
      else{draft.points.push(point);draft.hover=point;}
    }else{dragging=true;surface.setPointerCapture(event.pointerId);draft={type,color:colourInput.value,points:[point,point]};}
    renderDraft();event.preventDefault();
  });
  surface.addEventListener('pointermove',(event)=>{if(!enabled||!draft)return;const point=eventPoint(event);if(draft.type==='polygon')draft.hover=point;else if(dragging)draft.points[1]=point;renderDraft();});
  surface.addEventListener('pointerup',(event)=>{if(!dragging||!draft||draft.type==='polygon')return;dragging=false;surface.releasePointerCapture(event.pointerId);if(distance(draft.points[0],draft.points[1])<6){cancelDraft();return;}finishDraft();event.preventDefault();});
  root.querySelector('.save').addEventListener('click',async()=>{if(!draft||!textArea.value.trim()){status.textContent='Write a note before saving.';return;}status.textContent='Saving…';try{const response=await fetch(`${api}/api/notes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:pageUrl(),title:document.title,note:textArea.value,viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,scrollX,scrollY},selection:{type:draft.type,color:draft.color,points:draft.points,bounds:draft.selectionBounds},elements:draft.elements})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||`save_failed_${response.status}`);notes.push(result.note);count.textContent=String(notes.length);cancelDraft();render();}catch(error){status.textContent=`Could not save: ${error.message}`;}});
  root.querySelector('.cancel').addEventListener('click',cancelDraft);
  drawButton.addEventListener('click',()=>{cancelDraft();setEnabled(!enabled);});
  toolSelect.addEventListener('change',()=>{cancelDraft();if(enabled)drawButton.textContent='Drawing';});
  visibilityButton.addEventListener('click',()=>{visible=!visible;visibilityButton.setAttribute('aria-pressed',String(visible));render();});
  root.querySelector('.close').addEventListener('click',()=>{host.remove();delete window.__liveInterfaceAnnotationPrototype;});
  addEventListener('scroll',()=>{render();renderDraft();},{passive:true});addEventListener('resize',()=>{render();renderDraft();});
  addEventListener('keydown',(event)=>{if(event.key==='Escape'){cancelDraft();setEnabled(false);}else if(event.key==='Enter'&&enabled&&draft?.type==='polygon'&&draft.points.length>=3){event.preventDefault();finishDraft();}});
  window.__liveInterfaceAnnotationPrototype={show:()=>{host.style.display='';loadNotes().catch(()=>{});},hide:()=>{host.style.display='none';},remove:()=>{host.remove();delete window.__liveInterfaceAnnotationPrototype;},reload:loadNotes};
  loadNotes().catch(error=>{count.textContent='!';count.title=error.message;});
})();
