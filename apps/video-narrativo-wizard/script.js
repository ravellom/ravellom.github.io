const K='videoNarrativoWizardStateV1';
const STEPS=['inicio','brief','story','visual','anchor','scenes','prompts','export'];
const TITLES=['Inicio','Idea y limites','Mini-historia','Visual basico','Ancla','Escenas','Prompts','Exportar'];
const MOV=['camara fija con movimiento natural','ligero acercamiento','alejamiento suave','paneo suave a la derecha','paneo suave a la izquierda','seguimiento corto del personaje','cambio lento de encuadre','movimiento minimo de mano estable'];
const ACT=['mirar alrededor','dar un paso adelante','tomar un objeto','sentarse','levantarse','acercarse al otro personaje','sonreir','alejarse lentamente'];
const D={step:0,project:{name:'',language:'es',orientation:'16:9',duration:50,mode:'basico',provider:'gemini',apiKey:''},brief:{logline:'',message:'',audience:'infantil',tone:'inspirador',characters:2,location:'',era:'actual'},story:{text:'',moraleja:'',elements:'',flavor:'base'},visual:{style:'realista',realism:'natural',colors:'calidos',light:'dia',rhythm:'tranquilo',format:'16:9',simplicity:true,tokens:''},anchor:{characterPrompt:'',stylePrompt:'',reference:''},prompt:{detail:'alto',framing:'mixto',mood:'equilibrada',consistency:'estricta',negative:'texto en pantalla, logos'},scenes:[]};
let S=structuredClone(D),dragId=null;
const q=id=>document.getElementById(id);
const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function load(){try{const r=localStorage.getItem(K);if(!r)return;const p=JSON.parse(r);S={...structuredClone(D),...p,project:{...D.project,...(p.project||{})},brief:{...D.brief,...(p.brief||{})},story:{...D.story,...(p.story||{})},visual:{...D.visual,...(p.visual||{})},anchor:{...D.anchor,...(p.anchor||{})},prompt:{...D.prompt,...(p.prompt||{})},scenes:Array.isArray(p.scenes)?p.scenes:[]};}catch(e){console.error(e)}}
function save(){localStorage.setItem(K,JSON.stringify(S));}
function stepTpl(id){return {inicio:'stepTemplateInicio',brief:'stepTemplateBrief',story:'stepTemplateStory',visual:'stepTemplateVisual',anchor:'stepTemplateAnchor',scenes:'stepTemplateScenes',prompts:'stepTemplatePrompts',export:'stepTemplateExport'}[id]}
function panel(){const l=q('stepsList');l.innerHTML='';STEPS.forEach((s,i)=>{const li=document.createElement('li');li.className='step-pill '+(i===S.step?'active':'');li.textContent=`${i+1}. ${TITLES[i]}`;li.onclick=()=>{read();S.step=i;render()};l.appendChild(li)});q('stepCounter').textContent=`Paso ${S.step+1} de ${STEPS.length}`;}
function uiMeta(){const p=q('wizardProgressBar');if(p)p.style.width=`${((S.step+1)/STEPS.length)*100}%`;const b=q('aiStatusBadge');if(!b)return;const provider=(S.project.provider||'gemini').toUpperCase();if(S.project.apiKey){b.textContent=`IA: ${provider} activa`;b.style.background='#e8f7ef';b.style.color='#0c6f44';}else{b.textContent='IA: sin key';b.style.background='#fff4e6';b.style.color='#9a5b00';}}
function render(){panel();const id=STEPS[S.step],c=q('wizardContainer');c.innerHTML='';c.appendChild(q(stepTpl(id)).content.cloneNode(true));hydr(id);complexity();uiMeta();save();}
function hydr(id){if(id==='inicio'){q('projectName').value=S.project.name;q('projectLanguage').value=S.project.language;q('projectOrientation').value=S.project.orientation;q('projectDuration').value=S.project.duration;q('projectMode').value=S.project.mode;q('projectProvider').value=S.project.provider||'gemini';q('apiKey').value=S.project.apiKey;}
if(id==='brief'){q('briefLogline').value=S.brief.logline;q('briefMessage').value=S.brief.message;q('briefAudience').value=S.brief.audience;q('briefTone').value=S.brief.tone;q('briefCharacters').value=S.brief.characters;q('briefLocation').value=S.brief.location;q('briefEra').value=S.brief.era;q('btnAssistBrief').onclick=assistBrief;q('btnGenerateStory').onclick=async()=>{read();if(!S.brief.logline.trim())return alert('Escribe primero la idea en 1 frase.');await genStory();S.step=2;render();};}
if(id==='story'){q('storyText').value=S.story.text;q('storyMoraleja').value=S.story.moraleja;q('storyElements').value=S.story.elements;wc();q('btnStorySimple').onclick=()=>flavor('simple');q('btnStoryEmotion').onclick=()=>flavor('emocional');q('btnStoryHumor').onclick=()=>flavor('humor');q('btnStoryReduce').onclick=reduceStory;q('storyText').oninput=wc;}
if(id==='visual'){q('visualStyle').value=S.visual.style;q('visualRealism').value=S.visual.realism;q('visualColors').value=S.visual.colors;q('visualLight').value=S.visual.light;q('visualRhythm').value=S.visual.rhythm;q('visualFormat').value=S.visual.format;q('visualSimplicity').checked=!!S.visual.simplicity;q('visualTokens').value=S.visual.tokens;q('btnAssistVisual').onclick=assistVisual;q('btnBuildTokens').onclick=()=>{read();S.visual.tokens=tokens();q('visualTokens').value=S.visual.tokens;save();};}
if(id==='anchor'){q('anchorCharacters').value=S.anchor.characterPrompt;q('anchorStyle').value=S.anchor.stylePrompt;q('anchorReference').value=S.anchor.reference;q('btnAssistAnchor').onclick=assistAnchor;q('btnGenerateAnchor').onclick=()=>{read();S.anchor.characterPrompt=`Personajes principales (${S.brief.characters}), rasgos consistentes, vestuario estable, ${S.brief.era}, en ${S.brief.location||'escenario unico'}, expresiones claras, sin accion compleja.`;S.anchor.stylePrompt=`Estilo global: ${S.visual.tokens||tokens()}. Composicion limpia, continuidad de color y luz.`;render();};}
if(id==='scenes'){drawScenes();q('btnGenerateScenesAI').onclick=assistScenesAI;q('btnGenerateScenes').onclick=()=>{read();genScenes();render();};q('btnSimplifyScenes').onclick=()=>{S.scenes=S.scenes.map(simpleScene);render();};}
if(id==='prompts'){q('promptDetailLevel').value=S.prompt.detail;q('promptFraming').value=S.prompt.framing;q('promptMood').value=S.prompt.mood;q('promptConsistency').value=S.prompt.consistency;q('promptNegative').value=S.prompt.negative;if(!S.scenes.length)q('promptsList').innerHTML='<p class="microcopy">Primero genera escenas en el paso anterior.</p>';else drawPrompts();q('btnGeneratePromptsAI').onclick=assistPromptsAI;q('btnGeneratePrompts').onclick=()=>{read();genPrompts();render();};}
if(id==='export'){fillExport();q('btnExportJson').onclick=()=>{read();download();};q('btnImportJson').onclick=()=>q('importJsonFile').click();q('importJsonFile').onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{S={...structuredClone(D),...JSON.parse(String(r.result))};save();render();alert('Proyecto importado.')}catch{alert('JSON invalido.')}};r.readAsText(f);};q('btnQuickCopy').onclick=async()=>{try{await navigator.clipboard.writeText(q('exportBundle').value);alert('Bloques copiados al portapapeles.')}catch{alert('No se pudo copiar automaticamente.')}};q('btnPrint').onclick=()=>window.print();}}
function read(){const id=STEPS[S.step];if(id==='inicio'){S.project.name=q('projectName').value.trim();S.project.language=q('projectLanguage').value;S.project.orientation=q('projectOrientation').value;S.project.duration=Number(q('projectDuration').value||50);S.project.mode=q('projectMode').value;S.project.provider=q('projectProvider').value;S.project.apiKey=q('apiKey').value.trim();}
if(id==='brief'){S.brief.logline=q('briefLogline').value.trim();S.brief.message=q('briefMessage').value.trim();S.brief.audience=q('briefAudience').value;S.brief.tone=q('briefTone').value;S.brief.characters=Number(q('briefCharacters').value||2);S.brief.location=q('briefLocation').value.trim();S.brief.era=q('briefEra').value;}
if(id==='story'){S.story.text=q('storyText').value.trim();S.story.moraleja=q('storyMoraleja').value.trim();S.story.elements=q('storyElements').value.trim();}
if(id==='visual'){S.visual.style=q('visualStyle').value;S.visual.realism=q('visualRealism').value;S.visual.colors=q('visualColors').value;S.visual.light=q('visualLight').value;S.visual.rhythm=q('visualRhythm').value;S.visual.format=q('visualFormat').value;S.visual.simplicity=q('visualSimplicity').checked;S.visual.tokens=q('visualTokens').value.trim();}
if(id==='anchor'){S.anchor.characterPrompt=q('anchorCharacters').value.trim();S.anchor.stylePrompt=q('anchorStyle').value.trim();S.anchor.reference=q('anchorReference').value.trim();}
if(id==='scenes')readScenes();if(id==='prompts'){S.prompt.detail=q('promptDetailLevel').value;S.prompt.framing=q('promptFraming').value;S.prompt.mood=q('promptMood').value;S.prompt.consistency=q('promptConsistency').value;S.prompt.negative=q('promptNegative').value.trim();readPrompts();}save();}
function validate(i){if(i===0&&(S.project.duration<40||S.project.duration>60))return 'La duracion objetivo debe estar entre 40 y 60 segundos.';if(i===1){if(!S.brief.logline)return 'Escribe la logline.';const t=S.brief.logline.toLowerCase();if(!t.includes('quiere')||!t.includes('pero'))return "La logline debe seguir: '... quiere ... pero ...'.";if(S.brief.characters<1||S.brief.characters>3)return 'El numero de personajes debe estar entre 1 y 3.';}if(i===2&&!S.story.text)return 'Genera o escribe una mini-historia.';if(i===5&&(S.scenes.length<8||S.scenes.length>10))return 'Se recomiendan entre 8 y 10 escenas.';return '';}
function wc(){const w=(q('storyText').value.trim().split(/\s+/).filter(Boolean)).length;q('storyWordCount').textContent=`Palabras: ${w}`;}
async function genStory(){
if(S.project.apiKey){
  let ok=false;
  if((S.project.provider||'gemini')==='gemini') ok=await genStoryGemini();
  else ok=await genStoryOpenAI();
  if(ok) return;
}
genStoryLocal();
}
function genStoryLocal(){const tone={inspirador:'con un tono esperanzador',comico:'con humor ligero y situaciones cotidianas',serio:'de manera clara y reflexiva',ironico:'con ironia suave y respetuosa'};const loc=S.brief.location||'un lugar cercano';const msg=S.brief.message||'cada decision pequena puede cambiar el resultado';const p=[`Exposicion: En ${loc}, la historia presenta a quien protagoniza la logline: ${S.brief.logline}.`,'Incidente: Aparece un obstaculo concreto que rompe la rutina y obliga a actuar.','Tension: El personaje intenta resolver el problema, pero comete un error o duda importante.','Climax: Llega el momento de mayor decision y se enfrenta al conflicto principal.','Desenlace: Se observa la consecuencia de esa decision en una accion clara y breve.',`Moraleja: ${msg}.`];S.story.text=`${p.join(' ')} La historia avanza ${tone[S.brief.tone]}.`;S.story.moraleja=msg;S.story.elements=`${S.brief.characters} personajes principales, ${S.brief.location||'escenario principal simple'}, objeto clave para el conflicto, ${S.visual.light} con colores ${S.visual.colors}`;S.story.flavor='base';save();}
async function genStoryOpenAI(){const prompt=`Devuelve SOLO JSON valido con esta forma:\n{"historia":"150-180 palabras con Exposicion, Incidente, Tension, Climax, Desenlace, Moraleja","moraleja":"frase","elementos":["a","b"]}\nLogline:${S.brief.logline}\nTema:${S.brief.message||''}\nPublico:${S.brief.audience}\nTono:${S.brief.tone}\nPersonajes:${S.brief.characters}\nLugar:${S.brief.location||'no especificado'}\nEpoca:${S.brief.era}\nDuracion:${S.project.duration}`;try{const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${S.project.apiKey}`},body:JSON.stringify({model:'gpt-4o-mini',temperature:0.8,messages:[{role:'system',content:'Responde siempre JSON puro.'},{role:'user',content:prompt}]})});if(!r.ok)return false;const j=await r.json();const raw=j?.choices?.[0]?.message?.content||'';const o=toJson(raw);if(!o?.historia)return false;S.story.text=o.historia;S.story.moraleja=o.moraleja||'';S.story.elements=Array.isArray(o.elementos)?o.elementos.join(', '):'';S.story.flavor='api-openai';save();return true;}catch{return false;}}
async function genStoryGemini(){const prompt=`Devuelve SOLO JSON valido con esta forma:\n{"historia":"150-180 palabras con Exposicion, Incidente, Tension, Climax, Desenlace, Moraleja","moraleja":"frase","elementos":["a","b"]}\nLogline:${S.brief.logline}\nTema:${S.brief.message||''}\nPublico:${S.brief.audience}\nTono:${S.brief.tone}\nPersonajes:${S.brief.characters}\nLugar:${S.brief.location||'no especificado'}\nEpoca:${S.brief.era}\nDuracion:${S.project.duration}`;const models=['gemini-2.5-flash-lite','gemini-2.0-flash','gemini-1.5-flash'];for(const m of models){try{const url=`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(S.project.apiKey)}`;const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({generationConfig:{temperature:0.8,responseMimeType:'application/json'},contents:[{parts:[{text:prompt}]}]})});if(!r.ok)continue;const j=await r.json();const raw=j?.candidates?.[0]?.content?.parts?.[0]?.text||'';const o=toJson(raw);if(!o?.historia)continue;S.story.text=o.historia;S.story.moraleja=o.moraleja||'';S.story.elements=Array.isArray(o.elementos)?o.elementos.join(', '):'';S.story.flavor=`api-${m}`;save();return true;}catch{}}return false;}
function toJson(raw){try{return JSON.parse(raw);}catch{}const c=String(raw||'').replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/\s*```$/,'').trim();try{return JSON.parse(c);}catch{return null;}}
async function aiJson(prompt){
  if(!S.project.apiKey){alert('Falta API Key en Inicio.');return null;}
  if((S.project.provider||'gemini')==='gemini'){
    const models=['gemini-2.5-flash-lite','gemini-2.0-flash','gemini-1.5-flash'];
    for(const m of models){
      try{
        const url=`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(S.project.apiKey)}`;
        const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({generationConfig:{temperature:0.7,responseMimeType:'application/json'},contents:[{parts:[{text:prompt}]}]})});
        if(!r.ok)continue;
        const j=await r.json();
        const raw=j?.candidates?.[0]?.content?.parts?.[0]?.text||'';
        const o=toJson(raw);
        if(o)return o;
      }catch{}
    }
    return null;
  }
  try{
    const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${S.project.apiKey}`},body:JSON.stringify({model:'gpt-4o-mini',temperature:0.7,messages:[{role:'system',content:'Responde JSON puro.'},{role:'user',content:prompt}]})});
    if(!r.ok)return null;
    const j=await r.json();
    return toJson(j?.choices?.[0]?.message?.content||'');
  }catch{return null;}
}
async function assistBrief(){
  read();
  if(!S.brief.logline)return alert('Escribe primero la logline.');
  const p=`Devuelve SOLO JSON con: {"message":"","audience":"infantil|adolescente|docentes|general","tone":"comico|serio|inspirador|ironico","characters":1-3,"location":"","era":"actual|atemporal"}.
Contexto: logline=${S.brief.logline}; tema=${S.brief.message||''}; duracion=${S.project.duration}; publico actual=${S.brief.audience}.`;
  const o=await aiJson(p); if(!o) return alert('No se pudo obtener sugerencia IA.');
  S.brief.message=o.message||S.brief.message;
  if(['infantil','adolescente','docentes','general'].includes(o.audience)) S.brief.audience=o.audience;
  if(['comico','serio','inspirador','ironico'].includes(o.tone)) S.brief.tone=o.tone;
  S.brief.characters=clamp(Number(o.characters||S.brief.characters),1,3);
  S.brief.location=o.location||S.brief.location;
  if(['actual','atemporal'].includes(o.era)) S.brief.era=o.era;
  render();
}
async function assistVisual(){
  read();
  const p=`Devuelve SOLO JSON con: {"style":"realista|animacion|ilustracion","realism":"natural|estilizado","colors":"calidos|frios|neutros|vibrantes","light":"dia|tarde|noche|interior","rhythm":"tranquilo|dinamico","format":"16:9|9:16","simplicity":true|false,"tokens":""}.
Contexto narrativo: ${S.brief.logline}. Publico=${S.brief.audience}. Tono=${S.brief.tone}.`;
  const o=await aiJson(p); if(!o) return alert('No se pudo obtener sugerencia IA.');
  if(['realista','animacion','ilustracion'].includes(o.style)) S.visual.style=o.style;
  if(['natural','estilizado'].includes(o.realism)) S.visual.realism=o.realism;
  if(['calidos','frios','neutros','vibrantes'].includes(o.colors)) S.visual.colors=o.colors;
  if(['dia','tarde','noche','interior'].includes(o.light)) S.visual.light=o.light;
  if(['tranquilo','dinamico'].includes(o.rhythm)) S.visual.rhythm=o.rhythm;
  if(['16:9','9:16'].includes(o.format)) S.visual.format=o.format;
  if(typeof o.simplicity==='boolean') S.visual.simplicity=o.simplicity;
  S.visual.tokens=o.tokens||tokens();
  render();
}
async function assistAnchor(){
  read();
  const p=`Devuelve SOLO JSON con {"characterPrompt":"","stylePrompt":""}. Debe mantener consistencia para video corto.
Contexto: personajes=${S.brief.characters}, lugar=${S.brief.location||'un lugar'}, epoca=${S.brief.era}, estilo=${S.visual.tokens||tokens()}, historia=${S.story.text||S.brief.logline}.`;
  const o=await aiJson(p); if(!o) return alert('No se pudo obtener sugerencia IA.');
  S.anchor.characterPrompt=o.characterPrompt||S.anchor.characterPrompt;
  S.anchor.stylePrompt=o.stylePrompt||S.anchor.stylePrompt;
  render();
}
async function assistScenesAI(){
  read();
  if(!S.story.text) return alert('Genera primero la mini-historia.');
  const p=`Devuelve SOLO JSON con {"scenes":[{"visual":"","action":"","narration":"","duration":5-7,"movement":"","smallAction":""}]}. Deben ser 8-10 escenas, una accion principal por escena y consistentes con ancla.
Movimientos permitidos: ${MOV.join(' | ')}.
Acciones pequenas permitidas: ${ACT.join(' | ')}.
Historia: ${S.story.text}
Ancla: ${S.anchor.characterPrompt||''}
Estilo: ${S.anchor.stylePrompt||S.visual.tokens||tokens()}
Duracion objetivo: ${S.project.duration}s`;
  const o=await aiJson(p); if(!o?.scenes?.length) return alert('No se pudieron generar escenas con IA.');
  const arr=o.scenes.slice(0,10).map((x,i)=>({id:crypto.randomUUID(),visual:x.visual||`Escena ${i+1}`,action:x.action||'Una accion principal visible.',narration:x.narration||'',duration:clamp(Number(x.duration||6),5,7),movement:MOV.includes(x.movement)?x.movement:MOV[i%MOV.length],smallAction:ACT.includes(x.smallAction)?x.smallAction:ACT[i%ACT.length],locked:false,imagePrompt:'',videoPrompt:''}));
  if(arr.length<8) return alert('La IA devolvio menos de 8 escenas. Intenta de nuevo.');
  S.scenes=arr;
  render();
}
async function assistPromptsAI(){
  read();
  if(!S.scenes.length) return alert('Primero genera escenas.');
  const base=S.scenes.map((s,i)=>({i:i+1,visual:s.visual,action:s.action,duration:s.duration,movement:s.movement,smallAction:s.smallAction}));
const p=`Devuelve SOLO JSON con {"items":[{"index":1,"imagePrompt":"","videoPrompt":""}]}. Debe haber un item por cada escena.
Reglas: mantener consistencia con ancla, fondo simple, una sola accion visual, sin texto en imagen.
Escenas: ${JSON.stringify(base)}
Ancla personajes: ${S.anchor.characterPrompt||''}
Ancla estilo: ${S.anchor.stylePrompt||S.visual.tokens||tokens()}
Lugar principal: ${S.brief.location||''}
Nivel descriptivo: ${S.prompt.detail}
Encuadre preferido: ${S.prompt.framing}
Atmósfera: ${S.prompt.mood}
Consistencia visual: ${S.prompt.consistency}
Negativos: ${S.prompt.negative||''}`;
  const o=await aiJson(p); if(!o?.items?.length) return alert('No se pudieron generar prompts con IA.');
  o.items.forEach((it)=>{const idx=Number(it.index)-1; if(idx<0||idx>=S.scenes.length)return; S.scenes[idx].imagePrompt=it.imagePrompt||S.scenes[idx].imagePrompt; S.scenes[idx].videoPrompt=it.videoPrompt||S.scenes[idx].videoPrompt;});
  render();
}
function flavor(f){read();if(!S.story.text)return;const ex={simple:' Usa frases cortas, una sola idea por oracion y vocabulario escolar basico.',emocional:' Refuerza emociones visibles en los personajes y sus decisiones.',humor:' Introduce un giro de humor suave sin perder el mensaje didactico.'};S.story.text=S.story.text.replace(/\s+/g,' ').trim()+ex[f];S.story.flavor=f;render();}
function reduceStory(){read();const w=S.story.text.split(/\s+/).filter(Boolean);if(w.length<=180&&w.length>=150)return;S.story.text=w.slice(0,170).join(' ');render();}
function tokens(){const t=[`estilo ${S.visual.style}`,`acabado ${S.visual.realism}`,`paleta ${S.visual.colors}`,`luz ${S.visual.light}`,`ritmo ${S.visual.rhythm}`,`formato ${S.visual.format}`];if(S.visual.simplicity)t.push('fondos simples','sin multitudes','sin texto en imagen');return t.join(', ');}
function splitSentences(t){if(!t)return[];return t.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean).slice(0,12);}
function genScenes(){const ss=splitSentences(S.story.text),n=8+Math.floor(Math.random()*3),d=clamp(Math.round(S.project.duration/n),5,7),g=[];for(let i=0;i<n;i++)g.push({id:crypto.randomUUID(),visual:`Escena ${i+1}: ${ss[i%Math.max(ss.length,1)]||'Accion principal de la historia.'}`,action:'Una accion principal visible.',narration:i===n-1?(S.story.moraleja||'Moraleja final.'):'',duration:d,movement:MOV[i%MOV.length],smallAction:ACT[i%ACT.length],locked:false,imagePrompt:'',videoPrompt:''});S.scenes=g;save();}
function simpleText(t){const p=t.split(/[.;,:]/).map(x=>x.trim()).filter(Boolean);return p[0]||t;}
function simpleScene(s){return {...s,visual:simpleText(s.visual),action:simpleText(s.action||'Una accion clara'),narration:simpleText(s.narration||''),duration:clamp(s.duration,5,7)};}
function drawScenes(){const l=q('sceneList');if(!S.scenes.length){l.innerHTML='<p class="microcopy">Aun no hay escenas. Usa "Generar escenas".</p>';return;}l.innerHTML='';S.scenes.forEach((s,i)=>{const c=document.createElement('article');c.className='scene-card';c.draggable=true;c.dataset.sceneId=s.id;c.ondragstart=()=>{dragId=s.id;c.classList.add('dragging')};c.ondragend=()=>c.classList.remove('dragging');c.ondragover=e=>e.preventDefault();c.ondrop=e=>{e.preventDefault();reorder(dragId,s.id)};c.innerHTML=`<div class="scene-header"><strong>Escena ${i+1}</strong><div class="scene-tools"><span class="scene-tag">${s.locked?'Bloqueada':'Editable'}</span><button class="btn btn-outline btn-sm" data-a="lock">${s.locked?'Desbloquear':'Bloquear'}</button><button class="btn btn-outline btn-sm" data-a="split">Dividir</button><button class="btn btn-outline btn-sm" data-a="merge">Fusionar +1</button><button class="btn btn-ghost btn-sm" data-a="simplify">Simplificar</button></div></div><div class="grid"><label>Que se ve<textarea data-f="visual" rows="2" ${s.locked?'disabled':''}>${esc(s.visual)}</textarea></label><label>Que pasa<textarea data-f="action" rows="2" ${s.locked?'disabled':''}>${esc(s.action)}</textarea></label><div class="inline-grid"><label>Narracion / texto<input data-f="narration" type="text" value="${esc(s.narration||'')}" ${s.locked?'disabled':''} /></label><label>Duracion (5-7s)<input data-f="duration" type="number" min="3" max="9" value="${s.duration}" ${s.locked?'disabled':''} /></label></div></div><p class="foot-note">Arrastra para reordenar.</p>`;c.querySelectorAll('button[data-a]').forEach(b=>b.onclick=()=>sceneAction(s.id,b.dataset.a));l.appendChild(c);});}
function readScenes(){(q('sceneList')?.querySelectorAll('.scene-card')||[]).forEach(c=>{const s=S.scenes.find(x=>x.id===c.dataset.sceneId);if(!s||s.locked)return;s.visual=c.querySelector('[data-f="visual"]').value.trim();s.action=c.querySelector('[data-f="action"]').value.trim();s.narration=c.querySelector('[data-f="narration"]').value.trim();s.duration=Number(c.querySelector('[data-f="duration"]').value||6);});}
function reorder(a,b){if(!a||!b||a===b)return;const i=S.scenes.findIndex(x=>x.id===a),j=S.scenes.findIndex(x=>x.id===b);if(i<0||j<0)return;const [it]=S.scenes.splice(i,1);S.scenes.splice(j,0,it);render();}
function sceneAction(id,a){const i=S.scenes.findIndex(x=>x.id===id);if(i<0)return;const s=S.scenes[i];if(a==='lock')s.locked=!s.locked;if(a==='split'&&!s.locked){const f={...s,id:crypto.randomUUID(),duration:clamp(Math.ceil(s.duration/2),3,7)},g={...s,id:crypto.randomUUID(),duration:clamp(Math.floor(s.duration/2),3,7),narration:''};S.scenes.splice(i,1,f,g);}if(a==='merge'&&i<S.scenes.length-1){const n=S.scenes[i+1];if(!s.locked&&!n.locked){s.visual=`${s.visual} ${n.visual}`.trim();s.action=`${s.action} ${n.action}`.trim();s.narration=s.narration||n.narration;s.duration=clamp(s.duration+n.duration,4,9);S.scenes.splice(i+1,1);}}if(a==='simplify'&&!s.locked)S.scenes[i]=simpleScene(s);render();}
function genPrompts(){
if(!S.scenes.length)return;
const vt=S.visual.tokens||tokens();
if(!S.visual.tokens)S.visual.tokens=vt;
const detailTxt={medio:'descripcion clara y directa',alto:'descripcion rica en detalles visuales y contexto',muy_alto:'descripcion cinematica muy detallada con foco en textura y atmosfera'}[S.prompt.detail||'alto'];
const frameTxt={mixto:'encuadre mixto segun accion',cercano:'encuadre cercano de personajes y objetos clave',medio:'encuadre medio estable para claridad narrativa',abierto:'encuadre abierto para situar el espacio'}[S.prompt.framing||'mixto'];
const moodTxt={equilibrada:'tono emocional equilibrado',calida:'atmosfera calida y cercana',tensa:'atmosfera de tension suave',epica:'atmosfera de logro y amplitud',intima:'atmosfera intima y personal'}[S.prompt.mood||'equilibrada'];
const strict=(S.prompt.consistency||'estricta')==='estricta';
const negative=(S.prompt.negative||'').trim();
S.scenes=S.scenes.map((s,i)=>{const imagePrompt=[`Escena ${i+1} para storyboard de video educativo corto.`,detailTxt+'.',`Que se ve: ${s.visual}.`,`Accion principal unica: ${s.action}.`,`Encuadre sugerido: ${frameTxt}.`,`Atmósfera: ${moodTxt}.`,`Escenario principal: ${S.brief.location||'un unico lugar consistente'}.`,`Ancla de personajes/elementos: ${S.anchor.characterPrompt||'mantener identidad estable de personajes y objetos clave'}.`,`Ancla de estilo: ${S.anchor.stylePrompt||vt}.`,`Paleta, luz y acabado: ${vt}.`,strict?'Consistencia estricta entre escenas: mismo diseno de personajes, vestuario, proporciones y paleta.':'Permitir variacion ligera sin romper continuidad.',S.visual.simplicity?'Fondo simple, pocos elementos secundarios, sin multitudes.':'Fondo moderadamente detallado, sin sobrecargar la escena.','Sin texto incrustado en imagen, sin logotipos, sin marcas de agua.',negative?`Evitar: ${negative}.`:'' ].filter(Boolean).join(' ');
const videoPrompt=[`Animar la imagen base de la escena ${i+1} durante ${s.duration}s.`,`Movimiento de camara: ${s.movement||MOV[i%MOV.length]}.`,`Accion pequena visible: ${s.smallAction||ACT[i%ACT.length]}.`,`Ritmo ${S.visual.rhythm}, transicion natural y estable.`,`Mantener continuidad total de personajes, vestuario, escala y estilo visual.`,`Evitar deformaciones anatomicas, cambios bruscos de iluminacion y elementos nuevos no solicitados.`,negative?`Negativos: ${negative}.`:'' ].filter(Boolean).join(' ');
return {...s,imagePrompt,videoPrompt};});
save();
}
function drawPrompts(){const l=q('promptsList');l.innerHTML='';S.scenes.forEach((s,i)=>{const c=document.createElement('article');c.className='prompt-card';c.dataset.sceneId=s.id;const mo=MOV.map(m=>`<option value="${esc(m)}" ${s.movement===m?'selected':''}>${esc(m)}</option>`).join('');const ac=ACT.map(a=>`<option value="${esc(a)}" ${s.smallAction===a?'selected':''}>${esc(a)}</option>`).join('');c.innerHTML=`<div class="prompt-header"><strong>Escena ${i+1}</strong></div><div class="inline-grid"><label>Movimiento simple<select data-f="movement">${mo}</select></label><label>Accion pequena<select data-f="smallAction">${ac}</select></label></div><label>Prompt de IMAGEN<textarea data-f="imagePrompt" rows="4">${esc(s.imagePrompt||'')}</textarea></label><label>Prompt de VIDEO<textarea data-f="videoPrompt" rows="4">${esc(s.videoPrompt||'')}</textarea></label><div class="actions-row"><button class="btn btn-outline" data-a="regen">Regenerar escena</button><button class="btn btn-ghost" data-a="simplify">Simplificar prompt</button></div>`;c.querySelector('[data-a="regen"]').onclick=()=>{read();const x=S.scenes.find(z=>z.id===s.id);if(!x)return;x.imagePrompt=`Escena ${i+1}. ${x.visual} ${x.action}. Mantener ancla de personajes y estilo. Fondo simple y sin texto.`;x.videoPrompt=`Animar con ${x.movement}. Accion: ${x.smallAction}. Duracion ${x.duration}s. Mantener consistencia.`;render();};c.querySelector('[data-a="simplify"]').onclick=()=>{read();const x=S.scenes.find(z=>z.id===s.id);if(!x)return;x.imagePrompt=simpleText(x.imagePrompt);x.videoPrompt=simpleText(x.videoPrompt);render();};l.appendChild(c);});}
function readPrompts(){(q('promptsList')?.querySelectorAll('.prompt-card')||[]).forEach(c=>{const s=S.scenes.find(x=>x.id===c.dataset.sceneId);if(!s)return;s.movement=c.querySelector('[data-f="movement"]').value;s.smallAction=c.querySelector('[data-f="smallAction"]').value;s.imagePrompt=c.querySelector('[data-f="imagePrompt"]').value.trim();s.videoPrompt=c.querySelector('[data-f="videoPrompt"]').value.trim();});}
function checklist(){const tt=S.scenes.reduce((a,b)=>a+Number(b.duration||0),0);const loc=new Set(S.scenes.map(s=>s.visual.toLowerCase()).filter(v=>v.includes('aula')||v.includes('bosque')||v.includes('casa')||v.includes('parque')));return [`- Personajes definidos: ${S.brief.characters} (recomendado 1-2).`,`- Escenarios distintos detectados: ${Math.max(loc.size,S.brief.location?1:0)} (recomendado 1).`,`- Numero de escenas: ${S.scenes.length} (recomendado 8-10).`,`- Duracion total estimada: ${tt}s (objetivo ${S.project.duration}s).`,`- Regla de sencillez: ${S.visual.simplicity?'Activa':'Desactivada'}.`,`- Ancla de coherencia: ${S.anchor.characterPrompt?'Definida':'Pendiente'}.`,`- Prompts de video completos: ${S.scenes.filter(s=>s.videoPrompt).length}/${S.scenes.length}.`];}
function bundle(ch){const sb=S.scenes.map((s,i)=>`Escena ${i+1} (${s.duration}s)\nQue se ve: ${s.visual}\nQue pasa: ${s.action}\nNarracion: ${s.narration||'-'}`).join('\n\n');const ip=S.scenes.map((s,i)=>`Escena ${i+1}: ${s.imagePrompt||'[pendiente]'}`).join('\n\n');const vp=S.scenes.map((s,i)=>`Escena ${i+1}: ${s.videoPrompt||'[pendiente]'}`).join('\n\n');return [`PROYECTO: ${S.project.name||'Sin nombre'}`,`IDIOMA: ${S.project.language}`,`FORMATO: ${S.visual.format||S.project.orientation}`,`DURACION OBJETIVO: ${S.project.duration}s`,'','MINI-HISTORIA:',S.story.text||'[pendiente]','',`MORALEJA: ${S.story.moraleja||'[pendiente]'}`,'',`ELEMENTOS VISUALES: ${S.story.elements||'[pendiente]'}`,'','CHECKLIST DE COHERENCIA:',...ch,'','STORYBOARD TEXTUAL:',sb||'[pendiente]','','PROMPTS DE IMAGEN:',ip||'[pendiente]','','PROMPTS DE VIDEO:',vp||'[pendiente]'].join('\n');}
function fillExport(){const ch=checklist();q('exportChecklist').value=ch.join('\n');q('exportBundle').value=bundle(ch);}
function download(){const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=`${(S.project.name||'video-narrativo').replace(/[^a-z0-9-_]+/gi,'-').toLowerCase()}.json`;a.click();URL.revokeObjectURL(u);}
function complexity(){const v=q('validatorList'),b=q('complexityBadge'),t=q('complexityText');if(!v||!b||!t)return;let score=0;const ch=[];if(S.brief.characters>2){score++;ch.push('Mas de 2 personajes puede reducir consistencia.')}else ch.push('Numero de personajes adecuado para consistencia.');if(S.scenes.length>10||S.scenes.length<8){score+=2;ch.push('Escenas fuera del rango recomendado (8-10).')}else ch.push('Cantidad de escenas recomendada.');const tt=S.scenes.reduce((a,s)=>a+Number(s.duration||0),0);if(S.scenes.length&&(tt<40||tt>60)){score+=2;ch.push('La duracion total no coincide con 40-60 segundos.')}else ch.push('Duracion total alineada al objetivo.');if(S.scenes.some(s=>/ y | mientras | al mismo tiempo /i.test(s.action||''))){score++;ch.push('Detectadas acciones simultaneas en una escena.')}else ch.push('Una accion principal por escena.');v.innerHTML=ch.map(x=>`<li>${esc(x)}</li>`).join('');if(score<=1){b.className='complexity-badge green';b.textContent='Verde';t.textContent='Simple y generable.';}else if(score<=3){b.className='complexity-badge yellow';b.textContent='Amarillo';t.textContent='Puede fallar consistencia. Conviene simplificar.';}else{b.className='complexity-badge red';b.textContent='Rojo';t.textContent='Demasiado complejo para 50s. Simplifica escenas y personajes.';}}
function bind(){q('btnSave').onclick=()=>{read();save();alert('Proyecto guardado en tu navegador.');};q('btnLoad').onclick=()=>{load();render();alert('Proyecto local cargado.');};q('btnReset').onclick=()=>{if(!confirm('Se borrara el estado local de esta app. Continuar?'))return;localStorage.removeItem(K);S=structuredClone(D);save();render();};q('btnPrev').onclick=()=>{read();if(S.step>0)S.step--;render();};q('btnNext').onclick=()=>{read();const e=validate(S.step);if(e)return alert(e);if(S.step<STEPS.length-1)S.step++;render();};}
load();bind();render();
