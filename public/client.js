(() => {
  if (window.__devNotes) {
    window.__devNotes.show();
    window.__devNotes.reload();
    return;
  }
  window.__liveInterfaceAnnotationPrototype?.remove?.();

  const api = 'http://127.0.0.1:4347';
  const svgNS = 'http://www.w3.org/2000/svg';
  const tools = {
    polygon: 'Polygon',
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    line: 'Line',
    arrow: 'Arrow',
    'double-arrow': 'Double arrow',
    highlight: 'Highlight',
    text: 'Text',
  };

  const host = document.createElement('div');
  host.id = 'devnotes';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  document.documentElement.append(host);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host{all:initial;color-scheme:light}*{box-sizing:border-box}
      button,select,textarea,input{font:500 12px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      button,select{min-height:42px;border:0;border-right:1px solid #050505;background:#fefefe;color:#050505;border-radius:0;cursor:pointer;text-transform:uppercase;letter-spacing:.06em}
      button:hover,button[aria-pressed="true"]{background:#050505;color:#fefefe}button:disabled{cursor:not-allowed;opacity:.35;background:#fefefe;color:#050505}
      button:focus-visible,select:focus-visible,textarea:focus-visible,input:focus-visible{outline:2px solid #050505;outline-offset:3px}
      .dock{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));display:flex;align-items:stretch;max-width:calc(100vw - 36px);pointer-events:auto;background:#fefefe;border:1px solid #050505}.dock[hidden]{display:none}
      .dock select{max-width:140px;padding:0 30px 0 12px}.dock button{padding:0 12px}.dock button:last-child{border-right:0}
      .colour-wrap{display:grid;place-items:center;width:44px;border-right:1px solid #050505;background:#fefefe}.colour{width:24px;height:24px;padding:0;border:1px solid #050505;border-radius:50%;background:none;cursor:pointer;overflow:hidden}.colour::-webkit-color-swatch-wrapper{padding:0}.colour::-webkit-color-swatch{border:0;border-radius:50%}
      .count{display:grid;min-width:38px;place-items:center;padding:0 8px;font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      .surface{position:fixed;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}.surface.drawing{cursor:crosshair;pointer-events:auto;touch-action:none}
      .saved-shape,.draft-shape{stroke-width:2;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.saved-shape{fill-opacity:.08;pointer-events:all;cursor:pointer}.draft-shape{fill-opacity:.05;stroke-dasharray:5 4}
      .saved-shape.highlight-shape,.text-fragment{stroke:none;fill-opacity:.28}.draft-shape.highlight-shape{stroke:none;fill-opacity:.22}.text-fragment{pointer-events:all;cursor:pointer}
      .draft-vertex{fill:#fefefe;stroke-width:2;vector-effect:non-scaling-stroke}.draft-vertex.start{stroke:#fefefe;stroke-width:2}
      .marker{pointer-events:all;cursor:pointer}.marker circle{stroke:#fefefe;stroke-width:1.5}.marker text{fill:#fefefe;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-anchor:middle;dominant-baseline:central}
      .editor,.viewer{position:fixed;right:max(18px,env(safe-area-inset-right));top:max(18px,env(safe-area-inset-top));width:min(380px,calc(100vw - 36px));min-width:min(300px,calc(100vw - 36px));min-height:230px;max-width:calc(100vw - 20px);max-height:calc(100svh - 20px);overflow:auto;resize:both;padding:16px 17px 14px;background:#fffffff7;border:1px solid #9ca097;box-shadow:0 8px 22px #23251f18;pointer-events:auto}
      .editor[hidden],.viewer[hidden]{display:none}.panel-handle{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin:0 0 9px;cursor:grab;touch-action:none;user-select:none}.panel-handle:active{cursor:grabbing}.panel-handle button{border:0;min-height:0;padding:0 3px;background:transparent;color:#050505;font-size:20px;line-height:1}.editor-label,.viewer-label{display:block;margin:0;font:600 14px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.drag-mark{margin-left:auto;color:#777;font:500 13px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      .selection-quote{margin:0 0 10px;padding:8px;border-left:2px solid #050505;color:#555;font:500 11px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.selection-quote[hidden]{display:none}
      .viewer-meta{margin:0 0 10px;color:#666;font:500 10px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em}
      textarea{display:block;width:100%;min-height:112px;resize:vertical;border:0;border-radius:0;padding:0;background:transparent;color:#050505;font:500 15px/28px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.comment-actions{display:flex;gap:14px;align-items:center;margin-top:13px}.comment-actions button,.reply-compose button,.selection-controls button{border:0;min-height:0;padding:3px 0;background:transparent;color:#666;text-decoration:underline;text-underline-offset:3px}.comment-actions .keep-note{margin-left:auto;color:#050505;font-weight:700;text-underline-offset:4px}.selection-controls{display:grid;grid-template-columns:1fr auto auto;gap:7px 12px;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid #d9dbd4;color:#666;font-size:11px}.selection-count{grid-column:1/-1}.selection-controls select{min-height:30px;border:0;border-bottom:1px solid #d9dbd4;padding:3px 22px 3px 0;background:transparent;color:#050505;font-size:11px}.selection-colour{width:24px;height:24px;padding:0;border:1px solid #777;border-radius:50%;background:none;overflow:hidden}.selection-colour::-webkit-color-swatch-wrapper{padding:0}.selection-colour::-webkit-color-swatch{border:0;border-radius:50%}.selection-actions{grid-column:1/-1;display:flex;gap:14px}.reply-thread{margin-top:16px;padding-top:12px;border-top:1px solid #bfc2ba}.reply-list{margin:0 0 13px;padding:0;list-style:none;border-bottom:1px solid #d9dbd4}.reply{display:grid;grid-template-columns:58px minmax(0,1fr);gap:11px;padding:10px 0;border-top:1px solid #d9dbd4;transition:border-color 140ms ease}.reply:first-child{border-top:0}.reply:hover{border-color:#8d9188}.reply-byline{display:flex;min-width:0;flex-direction:column;gap:3px;padding-top:2px}.reply strong{color:#72766e;font:600 9px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.1em;text-transform:uppercase}.reply time{color:#a2a69e;font:500 8px/1.2 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.04em}.reply p{margin:0;color:#272923;font:500 13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap}.reply-notie strong,.reply-beab strong{color:#050505}.reply-notie p,.reply-beab p{font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.48}.reply-compose{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:end;padding:4px 0 2px;border-bottom:1px solid #d9dbd4;transition:border-color 140ms ease}.reply-compose:focus-within{border-color:#050505}.reply-compose textarea{min-height:54px;padding:5px 0 1px;background:transparent;font-size:13px;line-height:22px}.reply-compose button{align-self:end;margin-bottom:4px}.status{min-height:16px;margin:8px 0 0;color:#666;font:500 11px/1.35 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
      @media(max-width:600px){.dock{left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));display:grid;grid-template-columns:minmax(0,1fr) 40px auto 34px 28px auto 28px}.dock select{width:100%;max-width:none}.dock button{padding:0 6px}.count{min-width:0;padding:0 4px}.editor,.viewer{left:max(10px,env(safe-area-inset-left));right:max(10px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top));width:auto;min-width:0;max-height:calc(100svh - 88px);resize:vertical}}
    </style>
    <svg class="surface">
      <defs><marker id="lia-arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"></path></marker></defs>
      <g class="saved"></g><g class="draft"></g><g class="vertices"></g>
    </svg>
    <section class="editor" hidden aria-label="Selection note">
      <div class="panel-handle" title="Drag to move · double-click to reset"><label class="editor-label" for="lia-note">A little note</label><span class="drag-mark" aria-hidden="true">↕</span><button class="cancel" type="button" aria-label="Close note">×</button></div>
      <blockquote class="selection-quote" hidden></blockquote>
      <textarea id="lia-note" placeholder="What do you notice?"></textarea>
      <p class="status" role="status"></p><div class="comment-actions"><button class="cancel-bottom" type="button">Cancel</button><button class="save keep-note" type="button">Keep</button></div>
    </section>
    <section class="viewer" hidden aria-label="Saved note">
      <div class="panel-handle" title="Drag to move · double-click to reset"><strong class="viewer-label">Saved note</strong><span class="drag-mark" aria-hidden="true">↕</span><button class="viewer-close" type="button" aria-label="Close note">×</button></div>
      <p class="viewer-meta"></p><blockquote class="selection-quote viewer-quote" hidden></blockquote><textarea class="viewer-edit" aria-label="Note text"></textarea>
      <div class="selection-controls"><span class="selection-count"></span><select class="selection-tool" aria-label="Selection tool"></select><input class="selection-colour" type="color" aria-label="Selection colour"><div class="selection-actions"><button class="add-selection" type="button">Add selection</button><button class="remove-selection" type="button">Remove selection</button></div></div>
      <section class="reply-thread" aria-label="Replies"><ol class="reply-list"></ol><div class="reply-compose"><textarea class="reply-text" rows="2" maxlength="20000" placeholder="Add a reply…"></textarea><button class="reply-send" type="button">Reply</button></div></section>
      <p class="viewer-status status" role="status"></p><div class="comment-actions"><button class="delete-note" type="button">Delete</button><button class="keep-note save-edit" type="button">Keep</button></div>
    </section>
    <div class="dock" aria-label="Live annotation controls">
      <select class="tool" aria-label="Annotation tool">${Object.entries(tools).map(([value,label])=>`<option value="${value}">${label}</option>`).join('')}</select>
      <label class="colour-wrap" title="Annotation colour"><input class="colour" type="color" value="#111111" aria-label="Annotation colour"></label>
      <button class="mode" type="button" aria-pressed="false">Start</button><button class="visibility" type="button" aria-pressed="true" aria-label="Show or hide notes">◎</button><span class="count" aria-label="Saved note count">0</span><button class="clear-page" type="button" disabled>Clear</button><button class="close" type="button" aria-label="Remove annotation layer">×</button>
    </div>`;

  const surface = root.querySelector('.surface');
  const savedLayer = root.querySelector('.saved');
  const draftLayer = root.querySelector('.draft');
  const vertices = root.querySelector('.vertices');
  const editor = root.querySelector('.editor');
  const viewer = root.querySelector('.viewer');
  const selectionQuote = root.querySelector('.editor .selection-quote');
  const viewerQuote = root.querySelector('.viewer-quote');
  const viewerMeta = root.querySelector('.viewer-meta');
  const viewerEdit = root.querySelector('.viewer-edit');
  const selectionCount = root.querySelector('.selection-count');
  const selectionTool = root.querySelector('.selection-tool');
  const selectionColour = root.querySelector('.selection-colour');
  const addSelectionButton = root.querySelector('.add-selection');
  const removeSelectionButton = root.querySelector('.remove-selection');
  const replyList = root.querySelector('.reply-list');
  const replyText = root.querySelector('.reply-text');
  const viewerStatus = root.querySelector('.viewer-status');
  const textArea = root.querySelector('.editor textarea');
  const status = root.querySelector('.editor .status');
  const toolSelect = root.querySelector('.tool');
  const colourInput = root.querySelector('.colour');
  const modeButton = root.querySelector('.mode');
  const visibilityButton = root.querySelector('.visibility');
  const count = root.querySelector('.count');
  const clearPageButton = root.querySelector('.clear-page');
  let enabled = false;
  let dragging = false;
  let visible = true;
  let draft = null;
  let notes = [];
  let viewedNoteId = null;
  let viewedOriginalText = '';
  let viewedOriginalSelections = '';
  let viewedSelections = [];
  let activeSelectionIndex = 0;
  let addingSelection = false;
  let captureNoteId = null;
  let suppressNextPageClick = false;

  const pageUrl = () => `${location.origin}${location.pathname}${location.search}`;
  const eventPoint = (event) => ({ x: Math.round((event.clientX + scrollX) * 10) / 10, y: Math.round((event.clientY + scrollY) * 10) / 10 });
  const viewportPoint = (point) => ({ x: point.x - scrollX, y: point.y - scrollY });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const boxFor = (points) => { const xs=points.map(p=>p.x),ys=points.map(p=>p.y),left=Math.min(...xs),top=Math.min(...ys);return {left,top,width:Math.max(...xs)-left,height:Math.max(...ys)-top}; };
  function selectionsFor(note) { if(Array.isArray(note?.selections)&&note.selections.length)return note.selections;return note?.selection?[{...note.selection,elements:note.selection.elements||note.elements||[]}]:[]; }
  function distanceToBounds(point,bounds) { const dx=Math.max(bounds.left-point.x,0,point.x-(bounds.left+bounds.width)),dy=Math.max(bounds.top-point.y,0,point.y-(bounds.top+bounds.height));return Math.hypot(dx,dy); }
  function pointAnchors(points,elements) { const candidates=(elements||[]).filter(item=>item?.selector&&item?.bounds);return points.map(point=>{const ranked=candidates.map(item=>({item,score:distanceToBounds(point,item.bounds)+4*Math.log1p(Math.max(1,item.bounds.width*item.bounds.height))})).sort((a,b)=>a.score-b.score);const choice=ranked[0]?.item;if(!choice)return null;return{selector:choice.selector,text:choice.text||'',bounds:choice.bounds,x:(point.x-choice.bounds.left)/Math.max(1,choice.bounds.width),y:(point.y-choice.bounds.top)/Math.max(1,choice.bounds.height)};}); }
  function resolveAnchorElement(anchor) { let matches;try{matches=[...document.querySelectorAll(anchor.selector)];}catch{return null;}if(matches.length===1)return matches[0];const expected=(anchor.text||'').replace(/\s+/g,' ').trim();return matches.find(element=>(element.innerText||'').replace(/\s+/g,' ').trim()===expected)||null; }

  function clampPanel(panel) { if (!panel.dataset.moved || panel.hidden) return; const rect=panel.getBoundingClientRect(),margin=8,left=Math.min(Math.max(margin,rect.left),Math.max(margin,innerWidth-rect.width-margin)),top=Math.min(Math.max(margin,rect.top),Math.max(margin,innerHeight-rect.height-margin));panel.style.left=`${left}px`;panel.style.top=`${top}px`;panel.style.right='auto'; }
  function resetPanel(panel) { delete panel.dataset.moved;panel.style.removeProperty('left');panel.style.removeProperty('top');panel.style.removeProperty('right'); }
  function makeDraggable(panel) {
    const handle=panel.querySelector('.panel-handle');let drag=null;
    const move=(event)=>{if(!drag||event.pointerId!==drag.pointerId)return;panel.style.left=`${drag.left+event.clientX-drag.x}px`;panel.style.top=`${drag.top+event.clientY-drag.y}px`;clampPanel(panel);};
    const finish=(event)=>{if(!drag||event.pointerId!==drag.pointerId)return;drag=null;removeEventListener('pointermove',move);removeEventListener('pointerup',finish);removeEventListener('pointercancel',finish);};
    handle.addEventListener('pointerdown',(event)=>{if(event.button!==0||event.target.closest('button'))return;const rect=panel.getBoundingClientRect();panel.dataset.moved='true';panel.style.left=`${rect.left}px`;panel.style.top=`${rect.top}px`;panel.style.right='auto';drag={pointerId:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};addEventListener('pointermove',move);addEventListener('pointerup',finish);addEventListener('pointercancel',finish);event.preventDefault();event.stopPropagation();});
    handle.addEventListener('dblclick',()=>resetPanel(panel));
  }
  makeDraggable(editor);makeDraggable(viewer);

  function selectorFor(element) { if (!(element instanceof Element)) return null;if(element.id)return`#${CSS.escape(element.id)}`;const classes=[...element.classList].slice(0,3).map(name=>`.${CSS.escape(name)}`).join('');return`${element.tagName.toLowerCase()}${classes}`; }
  function elementsWithin(box) { const samples=[[box.left,box.top],[box.left+box.width/2,box.top+box.height/2],[box.left+box.width,box.top+box.height],[box.left+box.width,box.top],[box.left,box.top+box.height]],seen=new Set(),result=[];for(const [dx,dy] of samples){const x=Math.max(0,Math.min(innerWidth-1,dx-scrollX)),y=Math.max(0,Math.min(innerHeight-1,dy-scrollY));for(const element of document.elementsFromPoint(x,y)){if(element===host||seen.has(element)||element===document.documentElement||element===document.body)continue;seen.add(element);const rect=element.getBoundingClientRect();result.push({selector:selectorFor(element),tag:element.tagName.toLowerCase(),text:(element.innerText||'').trim().replace(/\s+/g,' ').slice(0,240),bounds:{left:rect.left+scrollX,top:rect.top+scrollY,width:rect.width,height:rect.height}});if(result.length>=8)return result;}}return result; }
  function nodePath(node) { const path=[];let current=node;while(current&&current!==document){const parent=current.parentNode;if(!parent)return[];path.unshift([...parent.childNodes].indexOf(current));current=parent;}return path; }
  function nodeAtPath(path) { let node=document;for(const index of path||[]){node=node?.childNodes?.[index];if(!node)return null;}return node; }
  function textCorpus() {
    const rootNode=document.body||document.documentElement,walker=document.createTreeWalker(rootNode,NodeFilter.SHOW_TEXT,{acceptNode(node){const parent=node.parentElement;if(!parent||!node.data)return NodeFilter.FILTER_REJECT;if(['SCRIPT','STYLE','NOSCRIPT','TEXTAREA','INPUT','SELECT','OPTION'].includes(parent.tagName))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}}),entries=[];let text='',node;
    while((node=walker.nextNode())){const start=text.length;text+=node.data;entries.push({node,start,end:text.length});}
    return {text,entries};
  }
  function corpusPosition(entries,node,offset) { const entry=entries.find(item=>item.node===node);return entry?entry.start+offset:null; }
  function nodePosition(entries,offset) { const entry=entries.find(item=>offset>=item.start&&offset<=item.end);return entry?{node:entry.node,offset:Math.max(0,Math.min(entry.node.data.length,offset-entry.start))}:null; }
  function rangeRects(range) { return [...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0).map(rect=>({left:rect.left+scrollX,top:rect.top+scrollY,width:rect.width,height:rect.height})); }
  function resolveTextRange(selection) {
    try { const start=nodeAtPath(selection.range?.startPath),end=nodeAtPath(selection.range?.endPath);if(start&&end){const range=document.createRange();range.setStart(start,selection.range.startOffset);range.setEnd(end,selection.range.endOffset);if(range.toString()===selection.quote)return range;} } catch {}
    const corpus=textCorpus();let index=-1;
    if(selection.range?.prefix||selection.range?.suffix){const contextual=`${selection.range.prefix||''}${selection.quote}${selection.range.suffix||''}`,contextIndex=corpus.text.indexOf(contextual);if(contextIndex>=0)index=contextIndex+(selection.range.prefix||'').length;}
    if(index<0)index=corpus.text.indexOf(selection.quote);if(index<0)return null;
    const start=nodePosition(corpus.entries,index),end=nodePosition(corpus.entries,index+selection.quote.length);if(!start||!end)return null;
    try { const range=document.createRange();range.setStart(start.node,start.offset);range.setEnd(end.node,end.offset);return range; } catch { return null; }
  }
  function textSelection(selection) { const range=resolveTextRange(selection);if(!range)return selection;const rects=rangeRects(range);if(!rects.length)return selection;const bounds=boxFor(rects.flatMap(rect=>[{x:rect.left,y:rect.top},{x:rect.left+rect.width,y:rect.top+rect.height}]));return{...selection,rects,points:[{x:bounds.left,y:bounds.top},{x:bounds.left+bounds.width,y:bounds.top+bounds.height}],bounds}; }

  function responsiveSelection(note,selection) {
    if(selection.type==='text')return textSelection(selection);
    if(!note.viewport||Math.abs(note.viewport.width-innerWidth)<2)return selection;
    const elements=selection.elements||note.elements||[],anchors=Array.isArray(selection.pointAnchors)&&selection.pointAnchors.length===selection.points.length?selection.pointAnchors:pointAnchors(selection.points,elements);
    const points=selection.points.map((point,index)=>{const anchor=anchors[index];if(!anchor)return point;const element=resolveAnchorElement(anchor);if(!element)return point;const rect=element.getBoundingClientRect();return{x:rect.left+scrollX+anchor.x*rect.width,y:rect.top+scrollY+anchor.y*rect.height};});
    return{...selection,points,pointAnchors:anchors,bounds:boxFor(points)};
  }

  function shapeFor(selection,className) {
    const type=selection.type==='lasso'?'polygon':selection.type,colour=selection.color||'#111111',points=selection.points.map(viewportPoint);let shape;
    if(type==='text'){shape=document.createElementNS(svgNS,'g');for(const rect of selection.rects||[]){const fragment=document.createElementNS(svgNS,'rect');fragment.setAttribute('class',`${className} text-fragment`);fragment.setAttribute('x',rect.left-scrollX);fragment.setAttribute('y',rect.top-scrollY);fragment.setAttribute('width',rect.width);fragment.setAttribute('height',rect.height);fragment.setAttribute('fill',colour);shape.append(fragment);}return shape;}
    if(type==='polygon'){shape=document.createElementNS(svgNS,'polygon');shape.setAttribute('points',points.map(p=>`${p.x},${p.y}`).join(' '));}
    else if(type==='rectangle'||type==='highlight'){const box=boxFor(points);shape=document.createElementNS(svgNS,'rect');shape.setAttribute('x',box.left);shape.setAttribute('y',box.top);shape.setAttribute('width',box.width);shape.setAttribute('height',box.height);}
    else if(type==='ellipse'){const box=boxFor(points);shape=document.createElementNS(svgNS,'ellipse');shape.setAttribute('cx',box.left+box.width/2);shape.setAttribute('cy',box.top+box.height/2);shape.setAttribute('rx',box.width/2);shape.setAttribute('ry',box.height/2);}
    else{shape=document.createElementNS(svgNS,'line');shape.setAttribute('x1',points[0].x);shape.setAttribute('y1',points[0].y);shape.setAttribute('x2',points[1].x);shape.setAttribute('y2',points[1].y);if(type==='arrow'||type==='double-arrow')shape.setAttribute('marker-end','url(#lia-arrowhead)');if(type==='double-arrow')shape.setAttribute('marker-start','url(#lia-arrowhead)');}
    shape.setAttribute('class',`${className}${type==='highlight'?' highlight-shape':''}`);shape.setAttribute('stroke',type==='highlight'?'none':colour);shape.setAttribute('fill',['polygon','rectangle','ellipse','highlight'].includes(type)?colour:'none');return shape;
  }
  function render() { savedLayer.replaceChildren();if(!visible)return;for(const note of notes){if(captureNoteId&&note.id!==captureNoteId)continue;const grouped=note.id===viewedNoteId&&viewedSelections.length?viewedSelections:selectionsFor(note);grouped.forEach((original,index)=>{const selection=responsiveSelection(note,original),shape=shapeFor(selection,'saved-shape');shape.dataset.noteId=note.id;shape.dataset.selectionIndex=String(index);savedLayer.append(shape);const first=viewportPoint(selection.points[0]),colour=selection.color||'#111111',marker=document.createElementNS(svgNS,'g');marker.setAttribute('class','marker');marker.setAttribute('transform',`translate(${first.x},${first.y})`);marker.dataset.noteId=note.id;marker.dataset.selectionIndex=String(index);marker.setAttribute('tabindex','0');marker.setAttribute('role','button');marker.setAttribute('aria-label',`Open note ${note.number}, selection ${index+1}`);const circle=document.createElementNS(svgNS,'circle');circle.setAttribute('r','12');circle.setAttribute('fill',colour);const label=document.createElementNS(svgNS,'text');label.textContent=String(note.number);marker.append(circle,label);savedLayer.append(marker);});} }
  function renderDraft() { draftLayer.replaceChildren();vertices.replaceChildren();if(!draft||draft.type==='text')return;const selection={type:draft.type,color:draft.color,points:draft.type==='polygon'&&draft.hover?[...draft.points,draft.hover]:draft.points};draftLayer.append(shapeFor(selection,'draft-shape'));if(draft.type==='polygon')draft.points.forEach((point,index)=>{const p=viewportPoint(point),vertex=document.createElementNS(svgNS,'circle');vertex.setAttribute('class',`draft-vertex${index===0?' start':''}`);vertex.setAttribute('cx',p.x);vertex.setAttribute('cy',p.y);vertex.setAttribute('r',index===0?'7':'5');vertex.setAttribute('stroke',draft.color);if(index===0)vertex.setAttribute('fill',draft.color);vertices.append(vertex);}); }
  function selectionFromDraft() { const selection={type:draft.type,color:draft.color,points:structuredClone(draft.points),bounds:structuredClone(draft.selectionBounds),elements:structuredClone(draft.elements||[])};selection.pointAnchors=pointAnchors(selection.points,selection.elements);if(draft.type==='text')Object.assign(selection,{quote:draft.quote,rects:structuredClone(draft.rects),range:structuredClone(draft.range)});return selection; }
  function compatibleTools(selection) { if(selection.type==='text')return['text'];if(selection.type==='polygon'||selection.type==='lasso')return['polygon'];return['rectangle','ellipse','line','arrow','double-arrow','highlight']; }
  function renderSelectionControls() { const selection=viewedSelections[activeSelectionIndex];if(!selection)return;selectionCount.textContent=`Selection ${activeSelectionIndex+1} of ${viewedSelections.length}`;selectionTool.replaceChildren();for(const type of compatibleTools(selection)){const option=document.createElement('option');option.value=type;option.textContent=tools[type];selectionTool.append(option);}selectionTool.value=selection.type==='lasso'?'polygon':selection.type;selectionColour.value=selection.color||'#111111';removeSelectionButton.disabled=viewedSelections.length===1;viewerQuote.hidden=selection.type!=='text';viewerQuote.textContent=selection.quote||'';viewerMeta.textContent=`${tools[selection.type]||selection.type}${notes.find(item=>item.id===viewedNoteId)?.updatedAt?' · Edited':''}`; }

  function syncSurfaceMode() { const blocked=!editor.hidden||!viewer.hidden;surface.classList.toggle('drawing',enabled&&!blocked&&toolSelect.value!=='text');modeButton.setAttribute('aria-pressed',String(enabled));modeButton.textContent=enabled?'Done':'Start'; }
  function setEnabled(next) { enabled=next;if(!enabled)dragging=false;syncSurfaceMode(); }
  function cancelDraft() { draft=null;draftLayer.replaceChildren();vertices.replaceChildren();editor.hidden=true;selectionQuote.hidden=true;selectionQuote.textContent='';textArea.value='';status.textContent='';syncSurfaceMode(); }
  function updateCount() { count.textContent=String(notes.length);clearPageButton.disabled=notes.length===0; }
  function hasUnsavedViewerEdit() { return !!viewedNoteId&&(viewerEdit.value.trim()!==viewedOriginalText||JSON.stringify(viewedSelections)!==viewedOriginalSelections); }
  function closeViewer(force=false) { if(!force&&hasUnsavedViewerEdit()&&!confirm('Close and discard unsaved note edits?'))return false;viewedNoteId=null;viewedOriginalText='';viewedOriginalSelections='';viewedSelections=[];activeSelectionIndex=0;addingSelection=false;viewer.hidden=true;viewerStatus.textContent='';replyText.value='';syncSurfaceMode();render();return true; }
  function replyTime(value) { if(!value)return'';try{return new Intl.DateTimeFormat(undefined,{hour:'numeric',minute:'2-digit'}).format(new Date(value));}catch{return'';} }
  function renderReplies(note) { const replies=Array.isArray(note.replies)?note.replies:[];replyList.replaceChildren();for(const reply of replies){const isNotie=reply.author==='notie'||reply.author==='beab',item=document.createElement('li');item.className=`reply ${isNotie?'reply-notie':'reply-human'}`;const byline=document.createElement('div');byline.className='reply-byline';const author=document.createElement('strong');author.textContent=isNotie?'Notie':'You';const when=document.createElement('time');when.dateTime=reply.createdAt||'';when.textContent=replyTime(reply.createdAt);const text=document.createElement('p');text.textContent=reply.text;byline.append(author,when);item.append(byline,text);replyList.append(item);}replyList.hidden=replies.length===0; }
  function showViewer(noteId,selectionIndex=0) { const note=notes.find(item=>item.id===noteId);if(!note)return;if(!viewer.hidden&&viewedNoteId!==noteId&&!closeViewer())return;cancelDraft();viewedNoteId=note.id;viewedOriginalText=note.note;viewedSelections=structuredClone(selectionsFor(note));viewedSelections.forEach((selection,index)=>{if(!selection.elements?.length)selection.elements=structuredClone(index===0?note.elements||[]:[]);if(!selection.pointAnchors?.length)selection.pointAnchors=pointAnchors(selection.points,selection.elements);});viewedOriginalSelections=JSON.stringify(viewedSelections);activeSelectionIndex=Math.max(0,Math.min(Number(selectionIndex)||0,viewedSelections.length-1));const replyCount=Array.isArray(note.replies)?note.replies.length:0;root.querySelector('.viewer-label').textContent=`Note ${note.number}${replyCount?` · ${replyCount} ${replyCount===1?'reply':'replies'}`:''}`;viewerEdit.value=note.note;viewerStatus.textContent='';replyText.value='';renderReplies(note);renderSelectionControls();viewer.hidden=false;syncSurfaceMode();render();viewerEdit.focus({preventScroll:true}); }
  async function loadNotes() { const response=await fetch(`${api}/api/notes?url=${encodeURIComponent(pageUrl())}`);if(!response.ok)throw new Error(`load_failed_${response.status}`);notes=(await response.json()).notes;updateCount();render(); }
  async function loadPreferences() { try{const response=await fetch(`${api}/api/preferences`);if(!response.ok)return;const {preferences}=await response.json();if(tools[preferences.tool])toolSelect.value=preferences.tool;if(/^#[0-9a-f]{6}$/i.test(preferences.color||''))colourInput.value=preferences.color;}catch{} }
  function persistPreferences() { fetch(`${api}/api/preferences`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:toolSelect.value,color:colourInput.value})}).catch(()=>{}); }
  function presentFinishedSelection() { if(addingSelection){viewedSelections.push(selectionFromDraft());activeSelectionIndex=viewedSelections.length-1;addingSelection=false;draft=null;draftLayer.replaceChildren();vertices.replaceChildren();viewer.hidden=false;renderSelectionControls();syncSurfaceMode();render();viewerStatus.textContent='Unsaved selection · Keep to save';return;}editor.hidden=false;syncSurfaceMode();queueMicrotask(()=>textArea.focus()); }
  function finishDraft() { if(!draft)return;const minimum=draft.type==='polygon'?3:2;if(draft.points.length<minimum){status.textContent=`Place at least ${minimum} points.`;return;}draft.hover=null;draft.selectionBounds=boxFor(draft.points);if(draft.selectionBounds.width<5&&draft.selectionBounds.height<5){cancelDraft();return;}draft.elements=elementsWithin(draft.selectionBounds);presentFinishedSelection(); }
  function cancelAddingSelection() { if(!addingSelection)return false;addingSelection=false;draft=null;draftLayer.replaceChildren();vertices.replaceChildren();viewer.hidden=false;renderSelectionControls();syncSurfaceMode();render();viewerStatus.textContent='Additional selection cancelled.';return true; }

  function captureLiveTextSelection() {
    const selection=getSelection();if(!selection||selection.isCollapsed||selection.rangeCount===0)return false;const range=selection.getRangeAt(0).cloneRange(),quote=range.toString();if(!quote.trim())return false;const rects=rangeRects(range);if(!rects.length)return false;
    const bounds=boxFor(rects.flatMap(rect=>[{x:rect.left,y:rect.top},{x:rect.left+rect.width,y:rect.top+rect.height}])),corpus=textCorpus(),start=corpusPosition(corpus.entries,range.startContainer,range.startOffset),end=corpusPosition(corpus.entries,range.endContainer,range.endOffset);
    draft={type:'text',color:colourInput.value,quote,rects,points:[{x:bounds.left,y:bounds.top},{x:bounds.left+bounds.width,y:bounds.top+bounds.height}],selectionBounds:bounds,elements:elementsWithin(bounds),range:{startPath:nodePath(range.startContainer),startOffset:range.startOffset,endPath:nodePath(range.endContainer),endOffset:range.endOffset,prefix:start===null?'':corpus.text.slice(Math.max(0,start-48),start),suffix:end===null?'':corpus.text.slice(end,end+48)}};
    selection.removeAllRanges();selectionQuote.textContent=quote;selectionQuote.hidden=false;presentFinishedSelection();return true;
  }
  function handlePagePointerUp(event) { if(!host.isConnected||!enabled||toolSelect.value!=='text'||!editor.hidden||!viewer.hidden||event.composedPath().includes(host))return;if(captureLiveTextSelection())suppressNextPageClick=true; }
  function handlePageClick(event) { if(!suppressNextPageClick)return;suppressNextPageClick=false;event.preventDefault();event.stopImmediatePropagation(); }
  document.addEventListener('pointerup',handlePagePointerUp,true);document.addEventListener('click',handlePageClick,true);

  surface.addEventListener('pointerdown',(event)=>{if(event.target.closest?.('[data-note-id]'))return;if(!enabled||!editor.hidden||!viewer.hidden||toolSelect.value==='text')return;const point=eventPoint(event),type=toolSelect.value;if(type==='polygon'){if(!draft)draft={type,color:colourInput.value,points:[point],hover:point};else if(draft.points.length>=3&&distance(point,draft.points[0])<=14){finishDraft();event.preventDefault();return;}else{draft.points.push(point);draft.hover=point;}}else{dragging=true;surface.setPointerCapture(event.pointerId);draft={type,color:colourInput.value,points:[point,point]};}renderDraft();event.preventDefault();});
  surface.addEventListener('pointermove',(event)=>{if(!enabled||!draft)return;const point=eventPoint(event);if(draft.type==='polygon')draft.hover=point;else if(dragging)draft.points[1]=point;renderDraft();});
  surface.addEventListener('pointerup',(event)=>{if(!dragging||!draft||draft.type==='polygon')return;dragging=false;surface.releasePointerCapture(event.pointerId);if(distance(draft.points[0],draft.points[1])<6){cancelDraft();return;}finishDraft();event.preventDefault();});

  root.querySelector('.save').addEventListener('click',async()=>{if(!draft||!textArea.value.trim()){status.textContent='Write a note before saving.';return;}status.textContent='Saving…';const savedSelection=selectionFromDraft();try{const response=await fetch(`${api}/api/notes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:pageUrl(),title:document.title,note:textArea.value,viewport:{width:innerWidth,height:innerHeight,devicePixelRatio,scrollX,scrollY},selection:savedSelection,selections:[savedSelection],elements:savedSelection.elements})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||`save_failed_${response.status}`);notes.push(result.note);updateCount();cancelDraft();render();}catch(error){status.textContent=`Could not save: ${error.message}`;}});
  root.querySelector('.cancel').addEventListener('click',cancelDraft);
  root.querySelector('.cancel-bottom').addEventListener('click',cancelDraft);
  root.querySelector('.viewer-close').addEventListener('click',()=>closeViewer());
  root.querySelector('.save-edit').addEventListener('click',async()=>{const note=notes.find(item=>item.id===viewedNoteId);if(!note||!viewerEdit.value.trim()){viewerStatus.textContent='Write a little note first.';viewerEdit.focus({preventScroll:true});return;}viewerStatus.textContent='Saving…';try{const response=await fetch(`${api}/api/notes/${encodeURIComponent(note.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({note:viewerEdit.value,selections:viewedSelections})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||`edit_failed_${response.status}`);notes=notes.map(item=>item.id===note.id?result.note:item);viewedOriginalText=result.note.note;viewedOriginalSelections=JSON.stringify(selectionsFor(result.note));viewerStatus.textContent='Note kept.';closeViewer(true);render();}catch(error){viewerStatus.textContent=`Could not keep note: ${error.message}`;}});
  selectionTool.addEventListener('change',()=>{const selection=viewedSelections[activeSelectionIndex];if(!selection)return;selection.type=selectionTool.value;viewerStatus.textContent='Unsaved selection change · Keep to save';renderSelectionControls();render();});
  selectionColour.addEventListener('change',()=>{const selection=viewedSelections[activeSelectionIndex];if(!selection)return;selection.color=selectionColour.value;viewerStatus.textContent='Unsaved colour change · Keep to save';render();});
  addSelectionButton.addEventListener('click',()=>{if(!viewedNoteId||viewedSelections.length>=32){viewerStatus.textContent='This note already has the maximum selections.';return;}const current=viewedSelections[activeSelectionIndex],compatible=compatibleTools(current||{type:'rectangle'});addingSelection=true;toolSelect.value=compatible.includes(current?.type)?current.type:compatible[0];colourInput.value=current?.color||colourInput.value;viewer.hidden=true;setEnabled(true);syncSurfaceMode();viewerStatus.textContent='';});
  removeSelectionButton.addEventListener('click',()=>{if(viewedSelections.length<=1)return;viewedSelections.splice(activeSelectionIndex,1);activeSelectionIndex=Math.min(activeSelectionIndex,viewedSelections.length-1);renderSelectionControls();render();viewerStatus.textContent='Unsaved selection removal · Keep to save';});
  root.querySelector('.reply-send').addEventListener('click',async()=>{const note=notes.find(item=>item.id===viewedNoteId),text=replyText.value.trim();if(!note)return;if(!text){viewerStatus.textContent='Write a little reply first.';replyText.focus({preventScroll:true});return;}if(hasUnsavedViewerEdit()){viewerStatus.textContent='Keep the note edits before replying.';viewerEdit.focus({preventScroll:true});return;}viewerStatus.textContent='Saving reply…';try{const response=await fetch(`${api}/api/notes/${encodeURIComponent(note.id)}/replies`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({author:'human',text})});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||`reply_failed_${response.status}`);notes=notes.map(item=>item.id===note.id?result.note:item);replyText.value='';viewedOriginalText=result.note.note;renderReplies(result.note);const replyCount=result.note.replies.length;root.querySelector('.viewer-label').textContent=`Note ${result.note.number} · ${replyCount} ${replyCount===1?'reply':'replies'}`;viewerStatus.textContent='Reply kept.';replyText.focus({preventScroll:true});}catch(error){viewerStatus.textContent=`Could not save reply: ${error.message}`;}});
  root.querySelector('.delete-note').addEventListener('click',async()=>{const note=notes.find(item=>item.id===viewedNoteId);if(!note)return;if(!confirm(`Permanently delete note ${note.number}?`))return;viewerStatus.textContent='Deleting…';try{const response=await fetch(`${api}/api/notes/${encodeURIComponent(note.id)}`,{method:'DELETE'});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||`delete_failed_${response.status}`);notes=notes.filter(item=>item.id!==note.id);updateCount();closeViewer(true);render();}catch(error){viewerStatus.textContent=`Could not delete: ${error.message}`;}});
  clearPageButton.addEventListener('click',async()=>{if(!notes.length)return;const total=notes.length;if(!confirm(`Permanently clear ${total} note${total===1?'':'s'} from this page?`))return;clearPageButton.disabled=true;try{const response=await fetch(`${api}/api/notes?url=${encodeURIComponent(pageUrl())}`,{method:'DELETE'});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||`clear_failed_${response.status}`);notes=[];closeViewer(true);cancelDraft();updateCount();render();}catch(error){clearPageButton.disabled=false;alert(`Could not clear page notes: ${error.message}`);}});
  root.addEventListener('pointerdown',(event)=>{if(event.target.closest?.('[data-note-id]'))event.stopPropagation();});root.addEventListener('click',(event)=>{const annotation=event.target.closest?.('[data-note-id]');if(annotation){event.preventDefault();event.stopPropagation();showViewer(annotation.dataset.noteId,annotation.dataset.selectionIndex);}});root.addEventListener('keydown',(event)=>{const marker=event.target.closest?.('.marker');if(marker&&(event.key==='Enter'||event.key===' ')){event.preventDefault();showViewer(marker.dataset.noteId,marker.dataset.selectionIndex);}});

  modeButton.addEventListener('click',()=>{if(addingSelection){cancelAddingSelection();return;}if(enabled){if(!closeViewer())return;cancelDraft();setEnabled(false);}else setEnabled(true);});
  toolSelect.addEventListener('change',()=>{if(addingSelection){draft=null;draftLayer.replaceChildren();vertices.replaceChildren();setEnabled(true);persistPreferences();return;}if(!closeViewer())return;cancelDraft();setEnabled(true);persistPreferences();});
  colourInput.addEventListener('change',persistPreferences);
  visibilityButton.addEventListener('click',()=>{visible=!visible;visibilityButton.setAttribute('aria-pressed',String(visible));render();});
  root.querySelector('.close').addEventListener('click',()=>{host.remove();document.removeEventListener('pointerup',handlePagePointerUp,true);document.removeEventListener('click',handlePageClick,true);delete window.__devNotes;delete window.__liveInterfaceAnnotationPrototype;});
  addEventListener('scroll',()=>{render();renderDraft();},{passive:true});addEventListener('resize',()=>{render();renderDraft();clampPanel(editor);clampPanel(viewer);});
  addEventListener('keydown',(event)=>{if(event.key==='Escape'){if(cancelAddingSelection())return;if(!closeViewer())return;cancelDraft();setEnabled(false);}else if(event.key==='Enter'&&event.target===replyText&&!event.shiftKey){event.preventDefault();root.querySelector('.reply-send').click();}else if(event.key==='Enter'&&enabled&&draft?.type==='polygon'&&draft.points.length>=3){event.preventDefault();finishDraft();}});

  async function initialize() { await loadPreferences();await loadNotes();syncSurfaceMode(); }
  window.__devNotes={show:()=>{host.style.display='';initialize().catch(()=>{});},hide:()=>{host.style.display='none';},remove:()=>{host.remove();document.removeEventListener('pointerup',handlePagePointerUp,true);document.removeEventListener('click',handlePageClick,true);delete window.__devNotes;delete window.__liveInterfaceAnnotationPrototype;},reload:initialize,captureOnly:(noteId)=>{captureNoteId=noteId||null;editor.hidden=true;viewer.hidden=true;root.querySelector('.dock').hidden=!!captureNoteId;render();},captureBounds:(noteId)=>{const elements=[...root.querySelectorAll(`[data-note-id="${CSS.escape(noteId)}"]`)].filter(element=>!element.classList.contains('marker'));const rects=elements.map(element=>element.getBoundingClientRect()).filter(rect=>rect.width>0&&rect.height>0);if(!rects.length)return null;const left=Math.min(...rects.map(rect=>rect.left)),top=Math.min(...rects.map(rect=>rect.top)),right=Math.max(...rects.map(rect=>rect.right)),bottom=Math.max(...rects.map(rect=>rect.bottom));return{left,top,right,bottom,width:right-left,height:bottom-top};}};
  initialize().catch(error=>{count.textContent='!';count.title=error.message;});
})();
