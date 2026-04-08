(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))t(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&t(o)}).observe(document,{childList:!0,subtree:!0});function i(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(a){if(a.ep)return;a.ep=!0;const r=i(a);fetch(a.href,r)}})();class Ft{constructor(){this.handlers={}}on(n,i){let t=this.handlers[n];return t||(t=new Set,this.handlers[n]=t),t.add(i),()=>{var a;(a=this.handlers[n])==null||a.delete(i)}}emit(n,i){var t;(t=this.handlers[n])==null||t.forEach(a=>{a(i)})}}const ce=new Ft,At={global:{language:"es",activeDatasetId:null,theme:"light",autosave:!0},sharedChart:{paletteId:"blue_orange",fontFamily:"Segoe UI, sans-serif",titleFontSize:20,labelFontSize:12,canvasBackground:"#ffffff",canvasTransparent:!1,showGrid:!0,gridColor:"#e2e8f0",axisColor:"#64748b",lineWidth:2,chartWidth:1200,chartMinHeight:420,marginTop:60,marginRight:80,marginBottom:70,marginLeft:220,showTitle:!0,chartTitle:"",showAxisLabels:!0,axisWidth:2,gridDashed:!0,gridVertical:!0,gridHorizontal:!1,showGridBorder:!0},sharedExport:{format:"png",scale:2,dpi:300,includeTransparentBg:!1,fileNamePattern:"{module}-{chart}-{timestamp}",allowClipboard:!0,allowBatchExport:!0},sharedAnnotations:{showMeanLine:!1,meanLineColor:"#0f172a",meanLineWidth:1.6,meanLineDash:8,meanLineGap:6,showMeanLabel:!0,showStatsPanel:!1,statsFields:{n:!0,mean:!0,median:!0,sd:!0,iqr:!0},statsPosition:"top_right",annotationText:"",annotationX:80,annotationY:12,annotationColor:"#111827",annotationSize:13},processor:{csvDelimiterMode:"auto",sourceType:"auto",defaultFillValue:"",previewRows:25,defaultLikertRange:{min:1,max:5},autoDetectLikertColumns:!0,storageAutoActivateOnSave:!0},likert:{analysisMode:"standard",chartType:"stacked",comparisonPreDatasetId:null,comparisonPostDatasetId:null,valueMode:"percentage",itemOrder:"original",showValues:!0,showLegend:!0,legendPosition:"right",decimalPlaces:1,selectedItems:[],scalePresetId:"agreement_5",scalePoints:5,scaleStart:1,scaleLabels:["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"],zoomLevel:1,fullscreenEnabled:!1,watermark:"",labelMaxLines:2,fontSizeValues:11,fontSizeLegend:10,fontSizeTitle:18},likertChartType:{stacked:{barHeight:40,barSpacing:10,showBarBorders:!1,barBorderColor:"#ffffff",barBorderWidth:1},diverging:{neutralIndex:3,centerLineColor:"#334155",centerLineWidth:1}},distribution:{chartType:"boxplot",numericColumns:[],categoryColumn:null,groupOrder:"original",topNGroups:15,zoomLevel:1,fullscreenEnabled:!1,labelMaxLines:2,showSampleSizeLabel:!0,showOutliers:!0,showJitter:!1,jitterSize:1.6,jitterAlpha:.4,outlierSize:2.2,outlierColor:"#ef4444",orientation:"horizontal",groupThickness:34,groupGap:16,showHypothesisPanel:!1,hypothesisMode:"auto",showGroupMarker:!1,groupMetric:"median",groupMarkerStyle:"point",groupMarkerColor:"#7c3aed",groupMarkerSize:5},distributionChartType:{boxplot:{whiskerMultiplier:1.5},violin:{kdeBandwidthFactor:1,kdeSteps:70,violinOpacity:.55},boxviolin:{whiskerMultiplier:1.5,kdeBandwidthFactor:1,kdeSteps:70,violinOpacity:.55},raincloud:{cloudOffset:4,boxHeightRatio:.35},errorbar:{errorMetric:"sd",errorCiLevel:95}}},st=1,lt="surveySuiteV2.state";function Pt(){return JSON.parse(JSON.stringify(At))}function Ce(){return{appSchemaVersion:st,language:"es",activeModule:"processor",activeDatasetId:null,datasets:{},ui:{processor:{view:"table",panel:"import"},likert:{zoom:1,panel:"style",styleTab:"layout-colors"},distribution:{selectedNumeric:[],selectedCategory:null,panel:"data",styleTab:"layout-colors"}},config:Pt()}}function Dt(){var e,n,i,t,a,r,o,s,l,d,u;try{const f=localStorage.getItem(lt);if(!f)return Ce();const h=JSON.parse(f);if(h.appSchemaVersion!==st)return Ce();const p=Ce();return{...p,...h,ui:{...p.ui,...h.ui??{},processor:{...p.ui.processor,...((e=h.ui)==null?void 0:e.processor)??{}},likert:{...p.ui.likert,...((n=h.ui)==null?void 0:n.likert)??{}},distribution:{...p.ui.distribution,...((i=h.ui)==null?void 0:i.distribution)??{}}},config:{...p.config,...h.config??{},sharedChart:{...p.config.sharedChart,...((t=h.config)==null?void 0:t.sharedChart)??{}},sharedExport:{...p.config.sharedExport,...((a=h.config)==null?void 0:a.sharedExport)??{}},sharedAnnotations:{...p.config.sharedAnnotations,...((r=h.config)==null?void 0:r.sharedAnnotations)??{}},processor:{...p.config.processor,...((o=h.config)==null?void 0:o.processor)??{}},likert:{...p.config.likert,...((s=h.config)==null?void 0:s.likert)??{}},likertChartType:{...p.config.likertChartType,...((l=h.config)==null?void 0:l.likertChartType)??{}},distribution:{...p.config.distribution,...((d=h.config)==null?void 0:d.distribution)??{}},distributionChartType:{...p.config.distributionChartType,...((u=h.config)==null?void 0:u.distributionChartType)??{}}}}}catch{return Ce()}}function dt(e){localStorage.setItem(lt,JSON.stringify(e))}function Wt(){const e=Ce();return dt(e),e}class Gt{constructor(){this.state=Dt(),this.listeners=new Set}getState(){return this.state}subscribe(n){return this.listeners.add(n),()=>this.listeners.delete(n)}publish(){dt(this.state),this.listeners.forEach(n=>n(this.state))}setLanguage(n){this.state={...this.state,language:n,config:{...this.state.config,global:{...this.state.config.global,language:n}}},this.publish(),ce.emit("language:changed",{lang:n})}setActiveModule(n){this.state={...this.state,activeModule:n},this.publish()}setModulePanel(n,i){const t=this.state.ui[n];this.state={...this.state,ui:{...this.state.ui,[n]:{...t,panel:i}}},this.publish()}setProcessorView(n){this.state={...this.state,ui:{...this.state.ui,processor:{...this.state.ui.processor,view:n}}},this.publish()}setLikertStyleTab(n){this.state={...this.state,ui:{...this.state.ui,likert:{...this.state.ui.likert,styleTab:n}}},this.publish()}setDistributionStyleTab(n){this.state={...this.state,ui:{...this.state.ui,distribution:{...this.state.ui.distribution,styleTab:n}}},this.publish()}setActiveDataset(n){this.state={...this.state,activeDatasetId:n,config:{...this.state.config,global:{...this.state.config.global,activeDatasetId:n}}},this.publish(),ce.emit("dataset:activated",{datasetId:n})}updateConfigSection(n,i){this.state={...this.state,config:{...this.state.config,[n]:{...this.state.config[n],...i}}},this.publish()}addDataset(n,i){const t=`ds_${Date.now()}`,a=new Date().toISOString(),r={id:t,name:n,records:i,createdAt:a,updatedAt:a};return this.state={...this.state,datasets:{...this.state.datasets,[t]:r},activeDatasetId:t,config:{...this.state.config,global:{...this.state.config.global,activeDatasetId:t}}},this.publish(),ce.emit("dataset:created",{datasetId:t,name:n}),ce.emit("dataset:activated",{datasetId:t}),t}updateDatasetRecords(n,i,t){const a=this.state.datasets[n];if(!a)return;const r={...a,name:t??a.name,records:i,updatedAt:new Date().toISOString()};this.state={...this.state,datasets:{...this.state.datasets,[n]:r}},this.publish()}deleteDataset(n){const i={...this.state.datasets};delete i[n];const t=this.state.activeDatasetId===n?null:this.state.activeDatasetId;this.state={...this.state,datasets:i,activeDatasetId:t,config:{...this.state.config,global:{...this.state.config.global,activeDatasetId:t}}},this.publish(),ce.emit("dataset:deleted",{datasetId:n}),ce.emit("dataset:activated",{datasetId:t})}hardReset(){this.state=Wt(),this.publish()}}const c=new Gt,Rt={es:{appTitle:"Survey Suite V2",subtitle:"Suite integrada para procesar y visualizar encuestas",processor:"Procesador",likert:"Likert",distribution:"Distribucion",activeDataset:"Dataset activo",noDataset:"Ninguno",createSample:"Crear dataset de muestra",clearData:"Reset local data",visualization:"Visualizacion",zoom:"Zoom",format:"Formato",scale:"Escala",export:"Export",sharedPalette:"Paleta compartida",background:"Fondo",transparentBackground:"Fondo transparente",gridColor:"Color grid",axisColor:"Color ejes",fontFamily:"Familia fuente",labelSize:"Tamano etiquetas",labelMaxLines:"Max lineas etiqueta",marginTop:"Margen superior",marginBottom:"Margen inferior",marginLeft:"Margen izquierdo",marginRight:"Margen derecho",chartWidth:"Ancho grafico",chartMinHeight:"Alto minimo",showGrid:"Mostrar grid",gridDashed:"Grid dashed",gridVertical:"Grid vertical",gridHorizontal:"Grid horizontal",showGridBorder:"Mostrar borde grid",gridWidth:"Grosor grid",showAxisLabels:"Mostrar etiquetas ejes",axisWidth:"Grosor ejes"},en:{appTitle:"Survey Suite V2",subtitle:"Integrated suite to process and visualize surveys",processor:"Processor",likert:"Likert",distribution:"Distribution",activeDataset:"Active dataset",noDataset:"None",createSample:"Create sample dataset",clearData:"Reset local data",visualization:"Visualization",zoom:"Zoom",format:"Format",scale:"Scale",export:"Export",sharedPalette:"Shared palette",background:"Background",transparentBackground:"Transparent background",gridColor:"Grid color",axisColor:"Axis color",fontFamily:"Font family",labelSize:"Label size",labelMaxLines:"Label max lines",marginTop:"Top margin",marginBottom:"Bottom margin",marginLeft:"Left margin",marginRight:"Right margin",chartWidth:"Chart width",chartMinHeight:"Min height",showGrid:"Show grid",gridDashed:"Dashed grid",gridVertical:"Vertical grid",gridHorizontal:"Horizontal grid",showGridBorder:"Show grid border",gridWidth:"Grid width",showAxisLabels:"Show axis labels",axisWidth:"Axis width"}};function F(e,n){return Rt[e][n]??n}function Ot(e,n){return`<option value="">--</option>${Object.values(e).map(t=>`<option value="${t.id}" ${t.id===n?"selected":""}>${t.name}</option>`).join("")}`}function jt(e){return e==="likert"?"Likert Charts":e==="distribution"?"Distribution Lab":"Data Processor"}function Vt(e){return e==="likert"?"ph-chart-bar":e==="distribution"?"ph-chart-scatter":"ph-database"}function _t(){const e=document.getElementById("app");if(!e)return;const n=c.getState(),i=n.activeDatasetId?n.datasets[n.activeDatasetId]:null;e.innerHTML=`
    <div class="shell module-${n.activeModule}">
      <header class="suite-topbar">
        <div class="suite-brand">
          <i class="ph ph-circles-three-plus suite-brand-dot"></i>
          <strong>Survey Suite</strong>
          <span class="suite-badge">BETA</span>
        </div>

        <nav class="suite-modules-nav nav nav-horizontal">
          <button data-module="processor" class="${n.activeModule==="processor"?"active":""}">
            <i class="ph ph-database"></i>
            <span>${F(n.language,"processor")}</span>
          </button>
          <button data-module="likert" class="${n.activeModule==="likert"?"active":""}">
            <i class="ph ph-chart-bar"></i>
            <span>${F(n.language,"likert")}</span>
          </button>
          <button data-module="distribution" class="${n.activeModule==="distribution"?"active":""}">
            <i class="ph ph-chart-scatter"></i>
            <span>${F(n.language,"distribution")}</span>
          </button>
        </nav>

        <div class="suite-topbar-actions">
          <button id="btn-create-sample">
            <i class="ph ph-flask"></i>
            <span>${F(n.language,"createSample")}</span>
          </button>
          <button id="btn-reset">
            <i class="ph ph-arrow-counter-clockwise"></i>
            <span>${F(n.language,"clearData")}</span>
          </button>
        </div>
      </header>

      <section class="suite-ribbon">
        <div class="suite-ribbon-main">
          <i class="ph ${Vt(n.activeModule)}"></i>
          <strong class="suite-ribbon-title">${jt(n.activeModule)}</strong>
          <span class="suite-ribbon-dataset">Dataset activo: <strong>${(i==null?void 0:i.name)??F(n.language,"noDataset")}</strong></span>
        </div>

        <div class="suite-ribbon-controls">
          <label>
            Dataset en storage
            <select id="dataset-select">${Ot(n.datasets,n.activeDatasetId)}</select>
          </label>

          <label>
            Idioma
            <select id="lang-select">
              <option value="es" ${n.language==="es"?"selected":""}>Español</option>
              <option value="en" ${n.language==="en"?"selected":""}>English</option>
            </select>
          </label>
        </div>
      </section>

      <main id="module-root" class="module-root"></main>
    </div>
  `}function Ht(){document.querySelectorAll("[data-module]").forEach(n=>{n.addEventListener("click",()=>{const i=n.dataset.module;i&&c.setActiveModule(i)})})}function qt(e,n){return Object.values(e.datasets).map(i=>`<option value="${i.id}" ${i.id===n?"selected":""}>${i.name} (${i.records.length})</option>`).join("")}function Ae(e){return e.map(n=>`<option value="${n}">${n}</option>`).join("")}function Jt(e){if(!e.length)return'<p style="margin:0; color:#5a6475;">Sin filas para vista previa.</p>';const n=Object.keys(e[0]),i=n.map(a=>`<th>${a}</th>`).join(""),t=e.map(a=>`<tr>${n.map(r=>`<td>${String(a[r]??"")}</td>`).join("")}</tr>`).join("");return`
    <div style="overflow:auto; border:1px solid #d7dbe3; border-radius:8px;">
      <table style="width:100%; border-collapse:collapse; font-size:0.9rem;">
        <thead style="background:#f8fafc;">
          <tr>${i}</tr>
        </thead>
        <tbody>${t}</tbody>
      </table>
    </div>
  `}function Xt(e){const n=new Date(e);return Number.isNaN(n.getTime())?"-":new Intl.DateTimeFormat("es-ES",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}).format(n)}function Pe(e){const n=e.filter(t=>t!=null&&String(t).trim()!=="");if(!n.length)return"empty";let i=0;return n.forEach(t=>{const a=Number(typeof t=="string"?t.trim():t);Number.isFinite(a)&&(i+=1)}),i===n.length?"numeric":i===0?"text":"mixed"}function Ut(e){if(!e.length)return'<p style="margin:0; color:#5a6475;">Sin informacion de dataset disponible.</p>';const n=Object.keys(e[0]),i=e.reduce((o,s)=>o+n.reduce((l,d)=>{const u=s[d];return l+(u==null||String(u).trim()===""?1:0)},0),0),t=n.filter(o=>Pe(e.map(s=>s[o]))==="numeric").length,a=n.filter(o=>Pe(e.map(s=>s[o]))==="text").length,r=n.map(o=>{const s=e.map(g=>g[o]),l=Pe(s),d=s.filter(g=>g!=null&&String(g).trim()!==""),u=s.length-d.length,f=new Set(d.map(g=>String(g))).size,h=d[0]??"(vacio)";return`
      <article class="processor-column-card">
        <h4>${o}</h4>
        <p><strong>Tipo:</strong> ${l==="numeric"?"Numerica":l==="text"?"Texto":l==="mixed"?"Mixta":"Vacia"}</p>
        <p><strong>Unicos:</strong> ${f}</p>
        <p><strong>Vacios:</strong> ${u}</p>
        <p><strong>Ejemplo:</strong> ${String(h)}</p>
      </article>
    `}).join("");return`
    <section class="processor-inspector">
      <div class="processor-stats-grid">
        <article class="processor-stat-card">
          <span>Registros</span>
          <strong>${e.length}</strong>
        </article>
        <article class="processor-stat-card">
          <span>Columnas</span>
          <strong>${n.length}</strong>
        </article>
        <article class="processor-stat-card">
          <span>Numericas</span>
          <strong>${t}</strong>
        </article>
        <article class="processor-stat-card">
          <span>Texto</span>
          <strong>${a}</strong>
        </article>
        <article class="processor-stat-card">
          <span>Celdas vacias</span>
          <strong>${i}</strong>
        </article>
      </div>

      <div class="processor-columns-grid">
        ${r}
      </div>
    </section>
  `}function Yt(e){const n=Object.values(e.datasets).sort((i,t)=>new Date(t.updatedAt).getTime()-new Date(i.updatedAt).getTime());return n.length?`
    <section class="processor-storage-list">
      ${n.map(i=>`
        <article class="processor-storage-card ${i.id===e.activeDatasetId?"active":""}">
          <div class="processor-storage-card-head">
            <h4>${i.name}</h4>
            ${i.id===e.activeDatasetId?'<span class="processor-storage-badge">Activo</span>':""}
          </div>
          <p><strong>Registros:</strong> ${i.records.length}</p>
          <p><strong>Columnas:</strong> ${i.records[0]?Object.keys(i.records[0]).length:0}</p>
          <p><strong>Actualizado:</strong> ${Xt(i.updatedAt)}</p>
          <div class="processor-storage-actions">
            <button type="button" data-storage-activate="${i.id}"><i class="ph ph-play"></i> Activar</button>
            <button type="button" data-storage-delete="${i.id}"><i class="ph ph-trash"></i> Eliminar</button>
          </div>
        </article>
      `).join("")}
    </section>
  `:'<p style="margin:0; color:#5a6475;">No hay datasets guardados todavia.</p>'}function Kt(e,n){var f;const i=n.activeDatasetId?n.datasets[n.activeDatasetId]:null,t=Math.max(1,n.config.processor.previewRows||8),a=(i==null?void 0:i.records.slice(0,t))??[],r=n.ui.processor.panel,o=(f=i==null?void 0:i.records)!=null&&f[0]?Object.keys(i.records[0]):[],s=r==="import",l=r==="transform",d=r==="clean",u=r==="storage";e.innerHTML=`
    <section class="workspace-layout">
      <aside class="workspace-rail">
        <h4>WORKSPACE</h4>
        <button data-module-panel="import" class="${r==="import"?"active":""}"><i class="ph ph-upload"></i><span>Import</span></button>
        <button data-module-panel="transform" class="${r==="transform"?"active":""}"><i class="ph ph-magic-wand"></i><span>Transform</span></button>
        <button data-module-panel="clean" class="${r==="clean"?"active":""}"><i class="ph ph-broom"></i><span>Clean</span></button>
        <button data-module-panel="storage" class="${r==="storage"?"active":""}"><i class="ph ph-cloud"></i><span>Storage</span></button>
      </aside>

      <aside class="workspace-config-panel">
        <h3 style="margin:0;">Processor · ${r}</h3>

        ${s?`
          <div class="config-block">
            <p style="margin:0; color:#5a6475; font-size:0.9rem;">
              Importa <strong>CSV</strong>, <strong>TSV</strong> o <strong>JSON</strong>. Para <strong>Excel (.xlsx/.xls)</strong>, la referencia completa sigue estando en la v1 por ahora.
            </p>

            <label>
              Nombre del dataset
              <input id="processor-dataset-name" type="text" placeholder="encuesta-marzo-2026" />
            </label>

            <label>
              Tipo de fuente
              <select id="processor-source-type">
                <option value="auto" ${n.config.processor.sourceType==="auto"?"selected":""}>Auto</option>
                <option value="google_forms" ${n.config.processor.sourceType==="google_forms"?"selected":""}>Google Forms</option>
                <option value="ms_forms" ${n.config.processor.sourceType==="ms_forms"?"selected":""}>MS Forms</option>
                <option value="generic" ${n.config.processor.sourceType==="generic"?"selected":""}>CSV generico</option>
                <option value="json" ${n.config.processor.sourceType==="json"?"selected":""}>JSON</option>
              </select>
            </label>

            <label>
              Formato
              <select id="processor-format">
                <option value="csv" selected>CSV</option>
                <option value="json">JSON</option>
              </select>
            </label>

            <label>
              Delimitador CSV
              <select id="processor-delimiter">
                <option value="auto" ${n.config.processor.csvDelimiterMode==="auto"?"selected":""}>Auto</option>
                <option value="," ${n.config.processor.csvDelimiterMode===","?"selected":""}>Coma (,)</option>
                <option value=";" ${n.config.processor.csvDelimiterMode===";"?"selected":""}>Punto y coma (;)</option>
                <option value="	" ${n.config.processor.csvDelimiterMode==="	"?"selected":""}>Tab</option>
                <option value="|" ${n.config.processor.csvDelimiterMode==="|"?"selected":""}>Barra (|)</option>
              </select>
            </label>

            <label>
              Archivo local (.csv/.tsv/.txt/.json)
              <input id="processor-file" type="file" accept=".csv,.tsv,.txt,.json,application/json,text/csv,text/plain" />
            </label>

            <label>
              O pega contenido aquí
              <textarea id="processor-input" rows="8" placeholder='respondent,q1,q2
1,5,4
2,3,4'></textarea>
            </label>

            <p style="margin:0; color:#5a6475; font-size:0.85rem;">
              Consejo: usa <strong>Auto</strong> para detectar delimitador y formato rapido. Si vienes de Forms o de un export poco limpio, especifica fuente y delimitador.
            </p>

            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="processor-import-btn" type="button"><i class="ph ph-check"></i> Importar y activar</button>
              <button id="processor-clear-btn" type="button"><i class="ph ph-eraser"></i> Limpiar</button>
            </div>
          </div>
        `:""}

        ${l?`
          <div class="config-block">
            <h3>Likert texto -> numero</h3>
            <label>
              Columnas
              <select id="processor-text-cols" multiple size="6">${Ae(o)}</select>
            </label>
            <button id="processor-text-likert-btn" type="button"><i class="ph ph-text-aa"></i> Convertir texto</button>
          </div>

          <div class="config-block">
            <h3>Normalizar escala</h3>
            <label>
              Columnas numericas
              <select id="processor-normalize-cols" multiple size="6">${Ae(o)}</select>
            </label>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:8px;">
              <label>Min<input id="processor-normalize-min" type="number" value="1" /></label>
              <label>Max<input id="processor-normalize-max" type="number" value="5" /></label>
            </div>
            <button id="processor-normalize-btn" type="button"><i class="ph ph-scales"></i> Normalizar</button>
          </div>

          <div class="config-block">
            <h3>Promedio de columnas</h3>
            <label>
              Columnas
              <select id="processor-avg-cols" multiple size="6">${Ae(o)}</select>
            </label>
            <label>
              Nombre nueva columna
              <input id="processor-avg-name" type="text" placeholder="avg_score" />
            </label>
            <button id="processor-avg-btn" type="button"><i class="ph ph-calculator"></i> Calcular promedio</button>
          </div>
        `:""}

        ${d?`
          <div class="config-block">
            <h3>Clean</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="processor-trim-btn" type="button"><i class="ph ph-scissors"></i> Trim</button>
              <button id="processor-remove-nulls-btn" type="button"><i class="ph ph-trash"></i> Remove nulls</button>
              <button id="processor-remove-dup-btn" type="button"><i class="ph ph-copy"></i> Remove duplicates</button>
            </div>
          </div>

          <div class="config-block">
            <h3>Fill missing values</h3>
            <label>
              Valor para completar
              <input id="processor-fill-value" type="text" value="${n.config.processor.defaultFillValue}" placeholder="N/A" />
            </label>
            <button id="processor-fill-btn" type="button"><i class="ph ph-drop-half-bottom"></i> Aplicar fill missing</button>
          </div>
        `:""}

        ${u?`
          <div class="config-block">
            <h3>Datasets</h3>
            <p style="margin:0; color:#5a6475; font-size:0.9rem;">
              Gestiona datasets guardados y revisa rapidamente cual esta activo.
            </p>
            <label>
              Guardar dataset activo como
              <input
                id="processor-storage-name"
                type="text"
                placeholder="${i!=null&&i.name?`${i.name}-copy`:"dataset-guardado"}"
                value="${i!=null&&i.name?`${i.name}-copy`:""}"
              />
            </label>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:8px;">
              <button id="processor-storage-save-btn" type="button"><i class="ph ph-floppy-disk"></i> Guardar en storage</button>
            </div>
            <label>
              Seleccion
              <select id="processor-storage-select">
                <option value="">(selecciona dataset)</option>
                ${qt(n,n.activeDatasetId)}
              </select>
            </label>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="processor-storage-load-btn" type="button"><i class="ph ph-download-simple"></i> Activar</button>
              <button id="processor-storage-delete-btn" type="button"><i class="ph ph-trash"></i> Eliminar</button>
            </div>
            ${Yt(n)}
          </div>

          <div class="config-block">
            <h3>Export</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button id="processor-export-csv-btn" type="button"><i class="ph ph-file-csv"></i> Export CSV</button>
              <button id="processor-export-json-btn" type="button"><i class="ph ph-file-json"></i> Export JSON</button>
            </div>
          </div>
        `:""}

        <p id="processor-status" style="margin:8px 0 0; font-size:0.9rem;"></p>
      </aside>

      <section class="workspace-canvas-area">
        <div class="workspace-canvas-header">
          <h2>Data Preview</h2>
          <div class="chart-toolbar" style="width:auto;">
            <button id="processor-view-table" title="Table" class="${n.ui.processor.view==="table"?"active":""}"><i class="ph ph-table"></i></button>
            <button id="processor-view-json" title="JSON" class="${n.ui.processor.view==="json"?"active":""}"><i class="ph ph-code"></i></button>
          </div>
        </div>

        <div class="chart-stage">
          <p style="margin-top:0;">Nombre: <strong>${(i==null?void 0:i.name)??"Ninguno"}</strong></p>
          <p style="margin-top:0;">Registros: <strong>${(i==null?void 0:i.records.length)??0}</strong></p>
          <label style="display:grid; gap:6px; max-width:220px; margin:0 0 12px; font-size:0.9rem;">
            Filas de preview
            <input id="processor-preview-rows" type="number" min="1" max="200" value="${t}" />
          </label>

          ${i?Ut(i.records):'<p style="margin:0 0 12px; color:#5a6475;">Carga un dataset para ver columnas, tipos y calidad basica.</p>'}

          ${n.ui.processor.view==="table"?Jt(a):`<pre>${JSON.stringify(a,null,2)}</pre>`}
        </div>
      </section>
    </section>
  `}const ct=[{id:"agreement_5",label:{es:"Acuerdo 5 puntos",en:"Agreement 5-point"},points:5,start:1,labels:{es:["Muy en desacuerdo","En desacuerdo","Neutral","De acuerdo","Muy de acuerdo"],en:["Strongly disagree","Disagree","Neutral","Agree","Strongly agree"]}},{id:"agreement_7",label:{es:"Acuerdo 7 puntos",en:"Agreement 7-point"},points:7,start:1,labels:{es:["Muy en desacuerdo","En desacuerdo","Algo en desacuerdo","Neutral","Algo de acuerdo","De acuerdo","Muy de acuerdo"],en:["Strongly disagree","Disagree","Somewhat disagree","Neutral","Somewhat agree","Agree","Strongly agree"]}},{id:"frequency_5",label:{es:"Frecuencia 5 puntos",en:"Frequency 5-point"},points:5,start:1,labels:{es:["Nunca","Raramente","A veces","A menudo","Siempre"],en:["Never","Rarely","Sometimes","Often","Always"]}},{id:"satisfaction_5",label:{es:"Satisfacción 5 puntos",en:"Satisfaction 5-point"},points:5,start:1,labels:{es:["Muy insatisfecho","Insatisfecho","Neutral","Satisfecho","Muy satisfecho"],en:["Very dissatisfied","Dissatisfied","Neutral","Satisfied","Very satisfied"]}},{id:"importance_5",label:{es:"Importancia 5 puntos",en:"Importance 5-point"},points:5,start:1,labels:{es:["No importante","Poco importante","Moderadamente importante","Importante","Muy importante"],en:["Not important","Slightly important","Moderately important","Important","Very important"]}},{id:"quality_5",label:{es:"Calidad 5 puntos",en:"Quality 5-point"},points:5,start:1,labels:{es:["Muy mala","Mala","Regular","Buena","Excelente"],en:["Very poor","Poor","Fair","Good","Excellent"]}},{id:"likelihood_5",label:{es:"Probabilidad 5 puntos",en:"Likelihood 5-point"},points:5,start:1,labels:{es:["Muy improbable","Improbable","Neutral","Probable","Muy probable"],en:["Very unlikely","Unlikely","Neutral","Likely","Very likely"]}},{id:"numeric_0_9",label:{es:"Numérica 10 puntos (0-9)",en:"Numeric 10-point (0-9)"},points:10,start:0,labels:{es:["0","1","2","3","4","5","6","7","8","9"],en:["0","1","2","3","4","5","6","7","8","9"]}},{id:"numeric_1_10",label:{es:"Numérica 10 puntos (1-10)",en:"Numeric 10-point (1-10)"},points:10,start:1,labels:{es:["1","2","3","4","5","6","7","8","9","10"],en:["1","2","3","4","5","6","7","8","9","10"]}}];function Oe(e){return ct.find(n=>n.id===e)??null}function ut(e,n){const i=Oe(e);return i?i.labels[n]:null}function ke(e,n,i){const t={"zoom-in":"ph ph-magnifying-glass-plus","zoom-out":"ph ph-magnifying-glass-minus","zoom-reset":"ph ph-arrow-counter-clockwise",fullscreen:"ph ph-arrows-out-simple",export:"ph ph-download-simple"},a={"zoom-in":"Zoom in","zoom-out":"Zoom out","zoom-reset":"Reset",fullscreen:"Fullscreen",export:F(i,"export")};return`<button id="${n}-${e}" class="chart-toolbar-button" type="button" title="${a[e]}" aria-label="${a[e]}"><i class="${t[e]}"></i></button>`}function ht({lang:e,moduleId:n,stageId:i,canvasId:t,datasetName:a,zoomLevel:r,includeExportButton:o=!1}){const s=[ke("zoom-in",n,e),ke("zoom-out",n,e),ke("zoom-reset",n,e),ke("fullscreen",n,e),o?ke("export",n,e):""].join("");return`
    <section class="workspace-canvas-area">
      <div class="workspace-canvas-header">
        <h2>${F(e,"visualization")}</h2>
        <div class="chart-toolbar">${s}</div>
      </div>

      <div class="chart-stage" id="${i}">
        <p style="margin-top:0;">${F(e,"activeDataset")}: <strong>${a??F(e,"noDataset")}</strong></p>
        <p style="margin-top:0; color:#5a6475;">${F(e,"zoom")}: ${(r*100).toFixed(0)}%</p>
        <canvas
          id="${t}"
          style="width:100%; max-width:100%; display:block; transform:scale(${r}); transform-origin: top left;"
        ></canvas>
      </div>
    </section>
  `.trim()}function pt({lang:e,formatSelectId:n,scaleSelectId:i,buttonId:t,format:a,scale:r,buttonLabel:o="Export"}){return`
    <div class="config-block">
      <label>
        ${F(e,"format")}
        <select id="${n}">
          <option value="png" ${a==="png"?"selected":""}>PNG</option>
          <option value="svg" ${a==="svg"?"selected":""}>SVG</option>
          <option value="pdf" ${a==="pdf"?"selected":""}>PDF</option>
        </select>
      </label>
      <label>
        ${F(e,"scale")}
        <select id="${i}">
          <option value="1" ${r===1?"selected":""}>1x</option>
          <option value="2" ${r===2?"selected":""}>2x</option>
          <option value="3" ${r===3?"selected":""}>3x</option>
          <option value="4" ${r===4?"selected":""}>4x</option>
        </select>
      </label>
      <button id="${t}" type="button"><i class="ph ph-file-arrow-down"></i> ${o}</button>
    </div>
  `.trim()}function mt({lang:e,fontFamilyId:n,fontLabelsId:i,labelMaxLinesId:t,fontFamily:a,labelFontSize:r,labelMaxLines:o,labelFontMax:s=32,labelMaxLinesMax:l=4,extraControls:d=""}){return`
    <label>
      ${F(e,"fontFamily")}
      <select id="${n}">
        <option value="Segoe UI, sans-serif" ${a==="Segoe UI, sans-serif"?"selected":""}>Segoe UI</option>
        <option value="Arial, sans-serif" ${a==="Arial, sans-serif"?"selected":""}>Arial</option>
        <option value="Verdana, sans-serif" ${a==="Verdana, sans-serif"?"selected":""}>Verdana</option>
        <option value="Georgia, serif" ${a==="Georgia, serif"?"selected":""}>Georgia</option>
      </select>
    </label>
    <label>
      ${F(e,"labelSize")}
      <input id="${i}" type="number" min="8" max="${s}" value="${r}">
    </label>
    <label>
      ${F(e,"labelMaxLines")}
      <input id="${t}" type="number" min="1" max="${l}" value="${o}">
    </label>
    ${d}
  `.trim()}function gt({lang:e,marginTopId:n,marginRightId:i,marginBottomId:t,marginLeftId:a,chartWidthId:r,marginTop:o,marginRight:s,marginBottom:l,marginLeft:d,chartWidth:u,includeChartMinHeight:f=!1,chartMinHeightId:h="",chartMinHeight:p=0,extraControls:g=""}){return`
    <label>
      ${F(e,"marginTop")}
      <input id="${n}" type="number" min="20" max="240" value="${o}">
    </label>
    <label>
      ${F(e,"marginBottom")}
      <input id="${t}" type="number" min="20" max="260" value="${l}">
    </label>
    <label>
      ${F(e,"marginLeft")}
      <input id="${a}" type="number" min="80" max="480" value="${d}">
    </label>
    <label>
      ${F(e,"marginRight")}
      <input id="${i}" type="number" min="20" max="320" value="${s}">
    </label>
    <label>
      ${F(e,"chartWidth")}
      <input id="${r}" type="number" min="700" max="2200" value="${u}">
    </label>
    ${f?`
      <label>
        ${F(e,"chartMinHeight")}
        <input id="${h}" type="number" min="320" max="2400" value="${p}">
      </label>
    `:""}
    ${g}
  `.trim()}function bt({lang:e,paletteIdId:n,bgColorId:i,transparentBgId:t,gridColorId:a,axisColorId:r,paletteId:o,canvasBackground:s,canvasTransparent:l,gridColor:d,axisColor:u,extraControls:f=""}){return`
    <label>
      ${F(e,"sharedPalette")}
      <select id="${n}">
        <option value="blue_orange" ${o==="blue_orange"?"selected":""}>Blue/Orange</option>
        <option value="red_green" ${o==="red_green"?"selected":""}>Red/Green</option>
        <option value="purple_yellow" ${o==="purple_yellow"?"selected":""}>Purple/Yellow</option>
        <option value="spectral" ${o==="spectral"?"selected":""}>Spectral</option>
        <option value="viridis" ${o==="viridis"?"selected":""}>Viridis</option>
        <option value="cool" ${o==="cool"?"selected":""}>Cool</option>
        <option value="warm" ${o==="warm"?"selected":""}>Warm</option>
        <option value="earth" ${o==="earth"?"selected":""}>Earth</option>
      </select>
    </label>
    <label>
      ${F(e,"background")}
      <input id="${i}" type="color" value="${s}">
    </label>
    <label class="config-check">
      <input id="${t}" type="checkbox" ${l?"checked":""}>
      <span>${F(e,"transparentBackground")}</span>
    </label>
    <label>
      ${F(e,"gridColor")}
      <input id="${a}" type="color" value="${d}">
    </label>
    <label>
      ${F(e,"axisColor")}
      <input id="${r}" type="color" value="${u}">
    </label>
    ${f}
  `.trim()}function ft({lang:e,showGridId:n,gridDashedId:i,gridVerticalId:t,gridHorizontalId:a,showGridBorderId:r,gridWidthId:o,showAxisLabelsId:s,axisWidthId:l,showGrid:d,gridDashed:u,gridVertical:f,gridHorizontal:h,showGridBorder:p,gridWidth:g,showAxisLabels:b,axisWidth:k,extraControls:M=""}){return`
    <label class="config-check">
      <input id="${n}" type="checkbox" ${d?"checked":""}>
      <span>${F(e,"showGrid")}</span>
    </label>
    <label class="config-check">
      <input id="${i}" type="checkbox" ${u?"checked":""}>
      <span>${F(e,"gridDashed")}</span>
    </label>
    <label class="config-check">
      <input id="${t}" type="checkbox" ${f?"checked":""}>
      <span>${F(e,"gridVertical")}</span>
    </label>
    <label class="config-check">
      <input id="${a}" type="checkbox" ${h?"checked":""}>
      <span>${F(e,"gridHorizontal")}</span>
    </label>
    <label class="config-check">
      <input id="${r}" type="checkbox" ${p?"checked":""}>
      <span>${F(e,"showGridBorder")}</span>
    </label>
    <label>
      ${F(e,"gridWidth")}
      <input id="${o}" type="number" min="1" max="5" value="${g}">
    </label>
    <label class="config-check">
      <input id="${s}" type="checkbox" ${b?"checked":""}>
      <span>${F(e,"showAxisLabels")}</span>
    </label>
    <label>
      ${F(e,"axisWidth")}
      <input id="${l}" type="number" min="1" max="5" value="${k}">
    </label>
    ${M}
  `.trim()}function Qt(e){var i;return(i=e==null?void 0:e.records)!=null&&i.length?Object.keys(e.records[0]).filter(t=>{let a=0;return e.records.forEach(r=>{const o=r[t],s=Number(typeof o=="string"?o.trim():o);Number.isFinite(s)&&(a+=1)}),a>0}):[]}function Zt(e){var s,l;const n=e.config.likert.comparisonPreDatasetId,i=e.config.likert.comparisonPostDatasetId;if(!n||!i)return[];const t=e.datasets[n],a=e.datasets[i];if(!((s=t==null?void 0:t.records)!=null&&s.length)||!((l=a==null?void 0:a.records)!=null&&l.length))return[];const r=Object.keys(t.records[0]),o=new Set(Object.keys(a.records[0]));return r.filter(d=>o.has(d)).flatMap(d=>[`${d} [Pre]`,`${d} [Post]`])}function ei(e,n){const i=n.activeDatasetId?n.datasets[n.activeDatasetId]:null,t=n.config,a=n.ui.likert.panel,r=n.ui.likert.styleTab,o=t.likert.analysisMode==="comparison"?Zt(n):Qt(i),s=Object.values(n.datasets).map(u=>`<option value="${u.id}">${u.name}</option>`).join(""),l=Oe(t.likert.scalePresetId),d=l?ut(l.id,n.language)??t.likert.scaleLabels:t.likert.scaleLabels;e.innerHTML=`
    <section class="workspace-layout">
      <aside class="workspace-rail">
        <h4>WORKSPACE</h4>
        <button data-module-panel="scale" class="${a==="scale"?"active":""}"><i class="ph ph-scales"></i><span>Scale</span></button>
        <button data-module-panel="chart" class="${a==="chart"?"active":""}"><i class="ph ph-chart-line-up"></i><span>Chart</span></button>
        <button data-module-panel="style" class="${a==="style"?"active":""}"><i class="ph ph-palette"></i><span>Style</span></button>
        <button data-module-panel="export" class="${a==="export"?"active":""}"><i class="ph ph-download-simple"></i><span>Export</span></button>
      </aside>

      <aside class="workspace-config-panel">
        <h3 style="margin:0;">Likert - ${a}</h3>

        ${a==="scale"?`
          <div class="config-block">
            <label>
              Preset de escala
              <select id="likert-scale-preset">
                ${ct.map(u=>`
                  <option value="${u.id}" ${t.likert.scalePresetId===u.id?"selected":""}>${u.label[n.language]}</option>
                `).join("")}
                <option value="custom" ${l?"":"selected"}>Custom</option>
              </select>
            </label>
            <label>
              Puntos de escala
              <input id="likert-scale-points" type="number" min="2" max="10" value="${t.likert.scalePoints}">
            </label>
            <label>
              Inicio escala
              <input id="likert-scale-start" type="number" min="0" max="10" value="${t.likert.scaleStart}">
            </label>
            <label>
              Labels de escala
              <textarea id="likert-scale-labels" rows="6" placeholder="Una etiqueta por linea">${d.join(`
`)}</textarea>
            </label>
            <label>
              Decimales
              <input id="likert-decimals" type="number" min="0" max="3" value="${t.likert.decimalPlaces}">
            </label>
          </div>
        `:""}

        ${a==="chart"?`
          <div class="config-block">
            <p style="margin:0; color:#5a6475; font-size:0.9rem;">
              La v2 ya recupera los tipos base de la v1 y una primera capa de comparacion usando datasets guardados.
            </p>
            <label>
              Modo analisis
              <select id="likert-analysis-mode">
                <option value="standard" ${t.likert.analysisMode==="standard"?"selected":""}>Standard</option>
                <option value="comparison" ${t.likert.analysisMode==="comparison"?"selected":""}>Comparacion Pre/Post</option>
              </select>
            </label>
            ${t.likert.analysisMode==="comparison"?`
              <label>
                Dataset pre
                <select id="likert-comparison-pre">
                  <option value="">(select)</option>
                  ${s.replace(`value="${t.likert.comparisonPreDatasetId??""}"`,`value="${t.likert.comparisonPreDatasetId??""}" selected`)}
                </select>
              </label>
              <label>
                Dataset post
                <select id="likert-comparison-post">
                  <option value="">(select)</option>
                  ${s.replace(`value="${t.likert.comparisonPostDatasetId??""}"`,`value="${t.likert.comparisonPostDatasetId??""}" selected`)}
                </select>
              </label>
            `:""}
            <label>
              Tipo de grafico
              <select id="likert-chart-type">
                <option value="stacked" ${t.likert.chartType==="stacked"?"selected":""}>Stacked</option>
                <option value="diverging" ${t.likert.chartType==="diverging"?"selected":""}>Diverging</option>
                <option value="split" ${t.likert.chartType==="split"?"selected":""}>Split</option>
                <option value="distribution" ${t.likert.chartType==="distribution"?"selected":""}>Distribution</option>
              </select>
            </label>
            ${t.likert.chartType==="diverging"||t.likert.chartType==="split"?`
              <label>
                Indice neutral
                <input id="likert-neutral-index" type="number" min="1" max="${t.likert.scalePoints}" value="${t.likertChartType.diverging.neutralIndex}">
              </label>
            `:""}
            <label>
              Modo de valor
              <select id="likert-value-mode">
                <option value="percentage" ${t.likert.valueMode==="percentage"?"selected":""}>Percentage</option>
                <option value="count" ${t.likert.valueMode==="count"?"selected":""}>Count</option>
              </select>
            </label>
            <label>
              Orden de items
              <select id="likert-item-order">
                <option value="original" ${t.likert.itemOrder==="original"?"selected":""}>Original</option>
                <option value="mean_desc" ${t.likert.itemOrder==="mean_desc"?"selected":""}>Mean desc</option>
                <option value="mean_asc" ${t.likert.itemOrder==="mean_asc"?"selected":""}>Mean asc</option>
                <option value="label_asc" ${t.likert.itemOrder==="label_asc"?"selected":""}>Label asc</option>
              </select>
            </label>
            <label class="config-check">
              <input id="likert-show-values" type="checkbox" ${t.likert.showValues?"checked":""}>
              <span>Mostrar valores</span>
            </label>
            <label class="config-check">
              <input id="likert-show-legend" type="checkbox" ${t.likert.showLegend?"checked":""}>
              <span>Mostrar leyenda</span>
            </label>
            <label>
              Items seleccionados (vacio = todos)
              <div style="display:flex; gap:8px; margin:4px 0; flex-wrap:wrap;">
                <button id="likert-select-all-items" type="button">Select all</button>
                <button id="likert-deselect-all-items" type="button">Deselect all</button>
              </div>
              <select id="likert-selected-items" multiple size="8">
                ${o.map(u=>`<option value="${u}" ${t.likert.selectedItems.includes(u)?"selected":""}>${u}</option>`).join("")}
              </select>
            </label>
          </div>
        `:""}

        ${a==="style"?`
          <div class="layout-subnav" role="tablist" aria-label="Style groups">
            <button type="button" class="layout-tab ${r==="layout-colors"?"active":""}" data-likert-layout-tab="layout-colors">Colors</button>
            <button type="button" class="layout-tab ${r==="layout-typography"?"active":""}" data-likert-layout-tab="layout-typography">Typography</button>
            <button type="button" class="layout-tab ${r==="layout-bars"?"active":""}" data-likert-layout-tab="layout-bars">Bars</button>
            <button type="button" class="layout-tab ${r==="layout-legend"?"active":""}" data-likert-layout-tab="layout-legend">Legend</button>
            <button type="button" class="layout-tab ${r==="layout-axes-grid"?"active":""}" data-likert-layout-tab="layout-axes-grid">Axes & Grid</button>
            <button type="button" class="layout-tab ${r==="layout-canvas"?"active":""}" data-likert-layout-tab="layout-canvas">Canvas</button>
          </div>

          <div class="layout-section ${r==="layout-colors"?"active":""}" id="layout-colors">
            <div class="config-block">
              ${bt({lang:n.language,paletteIdId:"shared-palette",bgColorId:"likert-bg-color",transparentBgId:"likert-transparent-bg",gridColorId:"likert-grid-color",axisColorId:"likert-axis-color",paletteId:t.sharedChart.paletteId,canvasBackground:t.sharedChart.canvasBackground,canvasTransparent:t.sharedChart.canvasTransparent,gridColor:t.sharedChart.gridColor,axisColor:t.sharedChart.axisColor,extraControls:`
                  <label>
                    Color borde barras
                    <input id="likert-bar-border-color" type="color" value="${t.likertChartType.stacked.barBorderColor}">
                  </label>
                `})}
            </div>
          </div>

          <div class="layout-section ${r==="layout-typography"?"active":""}" id="layout-typography">
            <div class="config-block">
              ${mt({lang:n.language,fontFamilyId:"likert-font-family",fontLabelsId:"likert-font-labels",labelMaxLinesId:"likert-label-max-lines",fontFamily:t.sharedChart.fontFamily,labelFontSize:t.sharedChart.labelFontSize,labelMaxLines:t.likert.labelMaxLines,labelMaxLinesMax:3,extraControls:`
                  <label>
                    Tamano valores
                    <input id="likert-font-values" type="number" min="8" max="32" value="${t.likert.fontSizeValues}">
                  </label>
                  <label>
                    Tamano leyenda
                    <input id="likert-font-legend" type="number" min="8" max="32" value="${t.likert.fontSizeLegend}">
                  </label>
                  <label>
                    Tamano titulo
                    <input id="likert-font-title" type="number" min="12" max="48" value="${t.likert.fontSizeTitle}">
                  </label>
                `})}
            </div>
          </div>

          <div class="layout-section ${r==="layout-bars"?"active":""}" id="layout-bars">
            <div class="config-block">
              <label>
                Alto barras
                <input id="likert-bar-height" type="number" min="20" max="100" value="${t.likertChartType.stacked.barHeight}">
              </label>
              <label>
                Espaciado barras
                <input id="likert-bar-spacing" type="number" min="0" max="50" value="${t.likertChartType.stacked.barSpacing}">
              </label>
              <label class="config-check">
                <input id="likert-show-bar-borders" type="checkbox" ${t.likertChartType.stacked.showBarBorders?"checked":""}>
                <span>Mostrar bordes</span>
              </label>
              <label>
                Grosor bordes
                <input id="likert-bar-border-width" type="number" min="1" max="5" value="${t.likertChartType.stacked.barBorderWidth}">
              </label>
            </div>
          </div>

          <div class="layout-section ${r==="layout-legend"?"active":""}" id="layout-legend">
            <div class="config-block">
              <label class="config-check">
                <input id="likert-show-legend-style" type="checkbox" ${t.likert.showLegend?"checked":""}>
                <span>Mostrar leyenda</span>
              </label>
              <label>
                Posicion leyenda
                <select id="likert-legend-position">
                  <option value="top" ${t.likert.legendPosition==="top"?"selected":""}>Top</option>
                  <option value="left" ${t.likert.legendPosition==="left"?"selected":""}>Left</option>
                  <option value="right" ${t.likert.legendPosition==="right"?"selected":""}>Right</option>
                  <option value="bottom" ${t.likert.legendPosition==="bottom"?"selected":""}>Bottom</option>
                </select>
              </label>
            </div>
          </div>

          <div class="layout-section ${r==="layout-axes-grid"?"active":""}" id="layout-axes-grid">
            <div class="config-block">
              ${ft({lang:n.language,showGridId:"likert-show-grid",gridDashedId:"likert-grid-dashed",gridVerticalId:"likert-grid-vertical",gridHorizontalId:"likert-grid-horizontal",showGridBorderId:"likert-show-grid-border",gridWidthId:"likert-grid-width",showAxisLabelsId:"likert-show-axis-labels",axisWidthId:"likert-axis-width",showGrid:t.sharedChart.showGrid,gridDashed:t.sharedChart.gridDashed,gridVertical:t.sharedChart.gridVertical,gridHorizontal:t.sharedChart.gridHorizontal,showGridBorder:t.sharedChart.showGridBorder,gridWidth:t.sharedChart.lineWidth,showAxisLabels:t.sharedChart.showAxisLabels,axisWidth:t.sharedChart.axisWidth})}
              ${t.likert.chartType==="diverging"||t.likert.chartType==="split"?`
                <label>
                  Color linea central
                  <input id="likert-center-line-color" type="color" value="${t.likertChartType.diverging.centerLineColor}">
                </label>
                <label>
                  Grosor linea central
                  <input id="likert-center-line-width" type="number" min="1" max="6" value="${t.likertChartType.diverging.centerLineWidth}">
                </label>
              `:""}
            </div>
          </div>

          <div class="layout-section ${r==="layout-canvas"?"active":""}" id="layout-canvas">
            <div class="config-block">
              ${gt({lang:n.language,marginTopId:"likert-margin-top",marginRightId:"likert-margin-right",marginBottomId:"likert-margin-bottom",marginLeftId:"likert-margin-left",chartWidthId:"likert-chart-width",marginTop:t.sharedChart.marginTop,marginRight:t.sharedChart.marginRight,marginBottom:t.sharedChart.marginBottom,marginLeft:t.sharedChart.marginLeft,chartWidth:t.sharedChart.chartWidth,extraControls:`
                  <label>
                    Titulo
                    <input id="shared-chart-title" type="text" value="${t.sharedChart.chartTitle}">
                  </label>
                  <label class="config-check">
                    <input id="shared-show-title" type="checkbox" ${t.sharedChart.showTitle?"checked":""}>
                    <span>Mostrar titulo</span>
                  </label>
                  <label>
                    Watermark
                    <input id="likert-watermark" type="text" value="${t.likert.watermark}">
                  </label>
                `})}
            </div>
          </div>
        `:""}

        ${a==="export"?`
          ${pt({lang:n.language,formatSelectId:"likert-export-format",scaleSelectId:"likert-export-scale",buttonId:"likert-export-png-btn",format:t.sharedExport.format,scale:t.sharedExport.scale})}
        `:""}
      </aside>

      ${ht({lang:n.language,moduleId:"likert",stageId:"likert-stage",canvasId:"likert-canvas",datasetName:i==null?void 0:i.name,zoomLevel:t.likert.zoomLevel})}
    </section>
  `}function ti(e){if(e==null)return null;if(typeof e=="string"){const i=e.trim();if(!i)return null;const t=Number(i);return Number.isFinite(t)?t:null}const n=Number(e);return Number.isFinite(n)?n:null}function De(e,n){if(!e.length)return NaN;const i=(e.length-1)*n,t=Math.floor(i),a=i-t;return e[t+1]!==void 0?e[t]+a*(e[t+1]-e[t]):e[t]}function vt(e,n){const i=e.filter(Number.isFinite).sort((p,g)=>p-g);if(!i.length)return{n:0,min:NaN,q1:NaN,median:NaN,q3:NaN,max:NaN,mean:NaN,sd:NaN,iqr:NaN,outliers:[]};const t=i.reduce((p,g)=>p+g,0)/i.length,a=i.length>1?i.reduce((p,g)=>p+(g-t)**2,0)/(i.length-1):0,r=De(i,.25),o=De(i,.5),s=De(i,.75),l=s-r,d=r-n*l,u=s+n*l,f=i.filter(p=>p>=d&&p<=u),h=i.filter(p=>p<d||p>u);return{n:i.length,min:f[0]??i[0],q1:r,median:o,q3:s,max:f[f.length-1]??i[i.length-1],mean:t,sd:Math.sqrt(a),iqr:l,outliers:h}}function yt(e,n,i,t,a,r){var l;if(!((l=e==null?void 0:e.records)!=null&&l.length)||!n)return[];const o=new Map;e.records.forEach(d=>{var h;const u=ti(d[n]);if(u===null)return;const f=i?String(d[i]??"(empty)").trim()||"(empty)":n;o.has(f)||o.set(f,[]),(h=o.get(f))==null||h.push(u)});const s=Array.from(o.entries()).map(([d,u])=>({label:d,values:u,summary:vt(u,r)})).filter(d=>d.summary.n>0);return t==="alphabetical"&&s.sort((d,u)=>d.label.localeCompare(u.label)),t==="median_desc"&&s.sort((d,u)=>u.summary.median-d.summary.median),t==="median_asc"&&s.sort((d,u)=>d.summary.median-u.summary.median),s.slice(0,Math.max(1,a))}function kt(e){return vt(e.flatMap(n=>n.values),1.5)}function we(e){return e.reduce((n,i)=>n+i,0)/e.length}function _e(e){if(e.length<2)return 0;const n=we(e);return e.reduce((i,t)=>i+(t-n)**2,0)/(e.length-1)}function ii(e){const n=e<0?-1:1,i=Math.abs(e),t=1/(1+.3275911*i),a=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-.284496736)*t+.254829592)*t*Math.exp(-i*i);return n*a}function ni(e){return .5*(1+ii(e/Math.SQRT2))}function Me(e){const n=[76.18009172947146,-86.50532032941678,24.01409824083091,-1.231739572450155,.001208650973866179,-5395239384953e-18];let i=e,t=e,a=i+5.5;a-=(i+.5)*Math.log(a);let r=1.000000000190015;for(let o=0;o<n.length;o+=1)t+=1,r+=n[o]/t;return-a+Math.log(2.5066282746310007*r/i)}function He(e,n,i){let o=e+n,s=e+1,l=e-1,d=1,u=1-o*i/s;Math.abs(u)<1e-30&&(u=1e-30),u=1/u;let f=u;for(let h=1;h<=100;h+=1){const p=2*h;let g=h*(n-h)*i/((l+p)*(e+p));u=1+g*u,Math.abs(u)<1e-30&&(u=1e-30),d=1+g/d,Math.abs(d)<1e-30&&(d=1e-30),u=1/u,f*=u*d,g=-(e+h)*(o+h)*i/((e+p)*(s+p)),u=1+g*u,Math.abs(u)<1e-30&&(u=1e-30),d=1+g/d,Math.abs(d)<1e-30&&(d=1e-30),u=1/u;const b=u*d;if(f*=b,Math.abs(b-1)<3e-7)break}return f}function St(e,n,i){if(i<=0)return 0;if(i>=1)return 1;const t=Math.exp(Me(e+n)-Me(e)-Me(n)+e*Math.log(i)+n*Math.log(1-i));return i<(e+1)/(e+n+2)?t*He(e,n,i)/e:1-t*He(n,e,1-i)/n}function ai(e,n){if(n<0||e<=0)return NaN;if(n===0)return 0;if(n<e+1){let o=e,s=1/e,l=s;for(let d=1;d<=100&&(o+=1,l*=n/o,s+=l,!(Math.abs(l)<Math.abs(s)*1e-7));d+=1);return s*Math.exp(-n+e*Math.log(n)-Me(e))}let i=n+1-e,t=1/1e-30,a=1/i,r=a;for(let o=1;o<=100;o+=1){const s=-o*(o-e);i+=2,a=s*a+i,Math.abs(a)<1e-30&&(a=1e-30),t=i+s/t,Math.abs(t)<1e-30&&(t=1e-30),a=1/a;const l=a*t;if(r*=l,Math.abs(l-1)<1e-7)break}return 1-Math.exp(-n+e*Math.log(n)-Me(e))*r}function oi(e,n){if(!Number.isFinite(e)||!Number.isFinite(n)||n<=0)return NaN;const i=n/(n+e*e),t=St(n/2,.5,i);return e>=0?1-.5*t:.5*t}function ri(e,n,i){if(e<=0)return 0;const t=n*e/(n*e+i);return St(n/2,i/2,t)}function si(e,n){return ai(n/2,e/2)}function Ct(e){const n=e.map((a,r)=>({value:a,index:r})).sort((a,r)=>a.value-r.value),i=new Array(e.length);let t=0;for(;t<n.length;){let a=t+1;for(;a<n.length&&n[a].value===n[t].value;)a+=1;const r=(t+1+a)/2;for(let o=t;o<a;o+=1)i[n[o].index]=r;t=a}return i}function qe(e,n){const i=e.length,t=n.length;if(i<2||t<2)return null;const a=we(e),r=we(n),o=_e(e),s=_e(n),l=Math.sqrt(o/i+s/t);if(!Number.isFinite(l)||l<=0)return null;const d=(a-r)/l,u=(o/i+s/t)**2/((o/i)**2/(i-1)+(s/t)**2/(t-1)),f=oi(Math.abs(d),u),h=Math.max(0,Math.min(1,2*(1-f))),p=Math.sqrt(((i-1)*o+(t-1)*s)/(i+t-2)),g=p>0?(a-r)/p:0;return{test:"welch_t",statLabel:"t",stat:d,df:u,p:h,effectLabel:"Cohen's d",effect:g}}function li(e,n){const i=e.length,t=n.length;if(i<2||t<2)return null;const a=[...e,...n],s=Ct(a).slice(0,i).reduce((b,k)=>b+k,0)-i*(i+1)/2,l=i*t-s,d=Math.min(s,l),u=i*t/2,f=Math.sqrt(i*t*(i+t+1)/12);if(f===0)return null;const h=(d-u+.5)/f,p=Math.max(0,Math.min(1,2*(1-ni(Math.abs(h))))),g=1-2*d/(i*t);return{test:"mann_whitney",statLabel:"U",stat:d,p,effectLabel:"Rank-biserial r",effect:g}}function Je(e){const n=e.map(g=>g.values.filter(Number.isFinite)),i=n.reduce((g,b)=>g+b.length,0),t=n.length;if(t<2||i<=t)return null;const a=we(n.flat());let r=0,o=0;n.forEach(g=>{const b=we(g);r+=g.length*(b-a)**2,o+=g.reduce((k,M)=>k+(M-b)**2,0)});const s=t-1,l=i-t,d=r/s,u=o/l,f=u>0?d/u:0,h=Math.max(0,Math.min(1,1-ri(f,s,l))),p=r+o>0?r/(r+o):0;return{test:"anova",statLabel:"F",stat:f,df1:s,df2:l,p:h,effectLabel:"eta^2",effect:p}}function di(e){const n=e.map(h=>h.values.filter(Number.isFinite)),i=n.length,t=n.reduce((h,p)=>h+p.length,0);if(i<2||t<=i)return null;const a=n.flat(),r=Ct(a);let o=0,s=0;n.forEach(h=>{const p=r.slice(o,o+h.length).reduce((g,b)=>g+b,0);s+=p**2/h.length,o+=h.length});const l=12/(t*(t+1))*s-3*(t+1),d=i-1,u=Math.max(0,Math.min(1,1-si(l,d))),f=t-i>0?(l-i+1)/(t-i):0;return{test:"kruskal_wallis",statLabel:"H",stat:l,df:d,p:u,effectLabel:"epsilon^2",effect:f}}function $t(e,n){const i=e.filter(t=>t.values.filter(Number.isFinite).length>=2);return i.length<2?null:n==="nonparametric"?i.length===2?li(i[0].values,i[1].values):di(i):i.length===2?qe(i[0].values,i[1].values):Je(i)}function ci(e){var n;return(n=e==null?void 0:e.records)!=null&&n.length?Object.keys(e.records[0]):[]}function ui(e){var i;return(i=e==null?void 0:e.records)!=null&&i.length?Object.keys(e.records[0]).filter(t=>{let a=0;return e.records.forEach(r=>{const o=r[t],s=Number(typeof o=="string"?o.trim():o);Number.isFinite(s)&&(a+=1)}),a>0}):[]}function hi(e,n){const i=n.activeDatasetId?n.datasets[n.activeDatasetId]:null,t=n.config,a=n.ui.distribution.panel,r=n.ui.distribution.styleTab,o=n.language==="en"?{workspace:"WORKSPACE",data:"Data",chart:"Chart",style:"Style",export:"Export",moduleTitle:"Distribution",numericVariable:"Numeric variable",categoryVariable:"Category variable (optional)",none:"(none)",chartType:"Chart type",groupOrder:"Group order",topNGroups:"Top N groups",orientation:"Orientation",hypothesisMode:"Hypothesis mode",showOutliers:"Show outliers",showJitter:"Show jitter",showSampleSize:"Show N per group",showHypothesis:"Show hypothesis test",horizontal:"Horizontal",vertical:"Vertical",original:"Original",alphabetical:"Alphabetical",medianDesc:"Median desc",medianAsc:"Median asc",parametric:"Parametric",nonparametric:"Non-parametric",groupThickness:"Group thickness",groupGap:"Group gap",whiskerMultiplier:"Whisker multiplier (IQR)",outlierColor:"Outlier color",outlierSize:"Outlier size",jitterSize:"Jitter size",jitterAlpha:"Jitter opacity",showMarker:"Show group marker",markerMetric:"Marker metric",markerStyle:"Marker style",markerColor:"Marker color",markerSize:"Marker size",annotations:"Annotations",showMeanLine:"Show overall mean line",meanLineColor:"Mean line color",meanLineWidth:"Mean line width",meanLineDash:"Mean line dash",meanLineGap:"Mean line gap",showMeanLabel:"Show mean label",showStatsPanel:"Show stats panel",statsPosition:"Stats position",annotationText:"Annotation text",annotationX:"Annotation X (%)",annotationY:"Annotation Y (%)",annotationColor:"Annotation color",annotationSize:"Annotation size",analysis:"Analysis",noHypothesis:"Not enough groups with data to run the selected test.",enableAnalysis:"Enable stats panel or hypothesis test to see additional analysis, like in v1."}:{workspace:"WORKSPACE",data:"Data",chart:"Chart",style:"Style",export:"Export",moduleTitle:"Distribution",numericVariable:"Variable numerica",categoryVariable:"Variable categoria (opcional)",none:"(none)",chartType:"Tipo grafico",groupOrder:"Orden de grupos",topNGroups:"Top N grupos",orientation:"Orientacion",hypothesisMode:"Modo hipotesis",showOutliers:"Mostrar outliers",showJitter:"Mostrar jitter",showSampleSize:"Mostrar N por grupo",showHypothesis:"Mostrar prueba de hipotesis",horizontal:"Horizontal",vertical:"Vertical",original:"Original",alphabetical:"Alfabetico",medianDesc:"Mediana desc",medianAsc:"Mediana asc",parametric:"Parametrico",nonparametric:"No parametrico",groupThickness:"Grosor de grupo",groupGap:"Separacion grupos",whiskerMultiplier:"Multiplicador whisker (IQR)",outlierColor:"Color outlier",outlierSize:"Tamano outlier",jitterSize:"Tamano jitter",jitterAlpha:"Opacidad jitter",showMarker:"Mostrar marcador de grupo",markerMetric:"Metrica marcador",markerStyle:"Estilo marcador",markerColor:"Color marcador",markerSize:"Tamano marcador",annotations:"Annotations",showMeanLine:"Mostrar linea de media global",meanLineColor:"Color linea media",meanLineWidth:"Grosor linea media",meanLineDash:"Dash linea media",meanLineGap:"Gap linea media",showMeanLabel:"Mostrar etiqueta media",showStatsPanel:"Mostrar panel de stats",statsPosition:"Posicion stats",annotationText:"Texto anotacion",annotationX:"X anotacion (%)",annotationY:"Y anotacion (%)",annotationColor:"Color anotacion",annotationSize:"Tamano anotacion",analysis:"Analysis",noHypothesis:"No hay suficientes grupos con datos para ejecutar la prueba seleccionada.",enableAnalysis:"Activa panel de stats o prueba de hipotesis para ver analisis adicionales, igual que en la v1."},s=ci(i),l=ui(i),d=t.distribution.numericColumns[0]||l[0]||"",u=t.distribution.categoryColumn||"",f=yt(i,d,u,t.distribution.groupOrder,t.distribution.topNGroups,t.distributionChartType.boxplot.whiskerMultiplier),h=f.map(b=>({label:b.label,n:b.summary.n,mean:b.summary.mean,median:b.summary.median,sd:b.summary.sd,iqr:b.summary.iqr})),p=kt(f),g=t.distribution.showHypothesisPanel?$t(f,t.distribution.hypothesisMode):null;e.innerHTML=`
    <section class="workspace-layout">
      <aside class="workspace-rail">
        <h4>${o.workspace}</h4>
        <button data-module-panel="data" class="${a==="data"?"active":""}"><i class="ph ph-folder-simple"></i><span>${o.data}</span></button>
        <button data-module-panel="chart" class="${a==="chart"?"active":""}"><i class="ph ph-chart-line"></i><span>${o.chart}</span></button>
        <button data-module-panel="style" class="${a==="style"?"active":""}"><i class="ph ph-palette"></i><span>${o.style}</span></button>
        <button data-module-panel="export" class="${a==="export"?"active":""}"><i class="ph ph-download-simple"></i><span>${o.export}</span></button>
      </aside>

      <aside class="workspace-config-panel">
        <h3 style="margin:0;">${o.moduleTitle} - ${a}</h3>

        ${a==="data"?`
          <div class="config-block">
            <label>
              ${o.numericVariable}
              <select id="dist-numeric-column">
                ${l.map(b=>`<option value="${b}" ${b===d?"selected":""}>${b}</option>`).join("")}
              </select>
            </label>

            <label>
              ${o.categoryVariable}
              <select id="dist-category-column">
                <option value="">${o.none}</option>
                ${s.map(b=>`<option value="${b}" ${b===u?"selected":""}>${b}</option>`).join("")}
              </select>
            </label>
          </div>
        `:""}

        ${a==="chart"?`
          <div class="config-block">
            <label>
              ${o.chartType}
              <select id="dist-chart-type">
                <option value="boxplot" ${t.distribution.chartType==="boxplot"?"selected":""}>Boxplot</option>
                <option value="violin" ${t.distribution.chartType==="violin"?"selected":""}>Violin</option>
                <option value="boxviolin" ${t.distribution.chartType==="boxviolin"?"selected":""}>Box + Violin</option>
                <option value="raincloud" ${t.distribution.chartType==="raincloud"?"selected":""}>Raincloud</option>
                <option value="errorbar" ${t.distribution.chartType==="errorbar"?"selected":""}>Error Bar</option>
              </select>
            </label>
            <label>
              ${o.groupOrder}
              <select id="dist-group-order">
                <option value="original" ${t.distribution.groupOrder==="original"?"selected":""}>${o.original}</option>
                <option value="alphabetical" ${t.distribution.groupOrder==="alphabetical"?"selected":""}>${o.alphabetical}</option>
                <option value="median_desc" ${t.distribution.groupOrder==="median_desc"?"selected":""}>${o.medianDesc}</option>
                <option value="median_asc" ${t.distribution.groupOrder==="median_asc"?"selected":""}>${o.medianAsc}</option>
              </select>
            </label>

            <label>
              ${o.topNGroups}
              <input id="dist-top-n" type="number" min="1" max="100" value="${t.distribution.topNGroups}">
            </label>

            <label>
              ${o.orientation}
              <select id="dist-orientation">
                <option value="horizontal" ${t.distribution.orientation==="horizontal"?"selected":""}>${o.horizontal}</option>
                <option value="vertical" ${t.distribution.orientation==="vertical"?"selected":""}>${o.vertical}</option>
              </select>
            </label>

            <label>
              ${o.hypothesisMode}
              <select id="dist-hypothesis-mode">
                <option value="auto" ${t.distribution.hypothesisMode==="auto"?"selected":""}>Auto</option>
                <option value="parametric" ${t.distribution.hypothesisMode==="parametric"?"selected":""}>${o.parametric}</option>
                <option value="nonparametric" ${t.distribution.hypothesisMode==="nonparametric"?"selected":""}>${o.nonparametric}</option>
              </select>
            </label>

            <label class="config-check">
              <input id="dist-show-outliers" type="checkbox" ${t.distribution.showOutliers?"checked":""}>
              <span>${o.showOutliers}</span>
            </label>

            <label class="config-check">
              <input id="dist-show-jitter" type="checkbox" ${t.distribution.showJitter?"checked":""}>
              <span>${o.showJitter}</span>
            </label>

            <label class="config-check">
              <input id="dist-show-sample-size" type="checkbox" ${t.distribution.showSampleSizeLabel?"checked":""}>
              <span>${o.showSampleSize}</span>
            </label>

            <label class="config-check">
              <input id="dist-show-hypothesis-panel" type="checkbox" ${t.distribution.showHypothesisPanel?"checked":""}>
              <span>${o.showHypothesis}</span>
            </label>
          </div>
        `:""}

        ${a==="style"?`
          <div class="layout-subnav" role="tablist" aria-label="Distribution style groups">
            <button type="button" class="layout-tab ${r==="layout-colors"?"active":""}" data-distribution-layout-tab="layout-colors">Colors</button>
            <button type="button" class="layout-tab ${r==="layout-typography"?"active":""}" data-distribution-layout-tab="layout-typography">Typography</button>
            <button type="button" class="layout-tab ${r==="layout-marks"?"active":""}" data-distribution-layout-tab="layout-marks">Marks</button>
            <button type="button" class="layout-tab ${r==="layout-annotations"?"active":""}" data-distribution-layout-tab="layout-annotations">Analysis</button>
            <button type="button" class="layout-tab ${r==="layout-axes-grid"?"active":""}" data-distribution-layout-tab="layout-axes-grid">Axes & Grid</button>
            <button type="button" class="layout-tab ${r==="layout-canvas"?"active":""}" data-distribution-layout-tab="layout-canvas">Canvas</button>
          </div>

          <div class="layout-section ${r==="layout-colors"?"active":""}" id="dist-layout-colors">
            <div class="config-block">
              ${bt({lang:n.language,paletteIdId:"dist-shared-palette",bgColorId:"dist-bg-color",transparentBgId:"dist-transparent-bg",gridColorId:"dist-grid-color",axisColorId:"dist-axis-color",paletteId:t.sharedChart.paletteId,canvasBackground:t.sharedChart.canvasBackground,canvasTransparent:t.sharedChart.canvasTransparent,gridColor:t.sharedChart.gridColor,axisColor:t.sharedChart.axisColor})}
            </div>
          </div>

          <div class="layout-section ${r==="layout-typography"?"active":""}" id="dist-layout-typography">
            <div class="config-block">
              ${mt({lang:n.language,fontFamilyId:"dist-font-family",fontLabelsId:"dist-font-labels",labelMaxLinesId:"dist-label-max-lines",fontFamily:t.sharedChart.fontFamily,labelFontSize:t.sharedChart.labelFontSize,labelMaxLines:t.distribution.labelMaxLines,labelFontMax:28,labelMaxLinesMax:4})}
            </div>
          </div>

          <div class="layout-section ${r==="layout-marks"?"active":""}" id="dist-layout-marks">
            <div class="config-block">
              <label>
                ${o.groupThickness}
                <input id="dist-group-thickness" type="number" min="16" max="80" value="${t.distribution.groupThickness}">
              </label>
              <label>
                ${o.groupGap}
                <input id="dist-group-gap" type="number" min="4" max="80" value="${t.distribution.groupGap}">
              </label>
              <label>
                ${o.whiskerMultiplier}
                <input id="dist-whisker-mult" type="number" min="0.5" max="5" step="0.1" value="${t.distributionChartType.boxplot.whiskerMultiplier}">
              </label>
              ${t.distribution.chartType==="violin"||t.distribution.chartType==="boxviolin"?`
                <label>
                  Bandwidth KDE
                  <input
                    id="dist-kde-bandwidth"
                    type="number"
                    min="0.2"
                    max="4"
                    step="0.1"
                    value="${t.distribution.chartType==="boxviolin"?t.distributionChartType.boxviolin.kdeBandwidthFactor:t.distributionChartType.violin.kdeBandwidthFactor}"
                  >
                </label>
                <label>
                  Pasos KDE
                  <input
                    id="dist-kde-steps"
                    type="number"
                    min="30"
                    max="260"
                    step="5"
                    value="${t.distribution.chartType==="boxviolin"?t.distributionChartType.boxviolin.kdeSteps:t.distributionChartType.violin.kdeSteps}"
                  >
                </label>
                <label>
                  Opacidad violin
                  <input
                    id="dist-violin-opacity"
                    type="number"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value="${t.distribution.chartType==="boxviolin"?t.distributionChartType.boxviolin.violinOpacity:t.distributionChartType.violin.violinOpacity}"
                  >
                </label>
              `:""}
              ${t.distribution.chartType==="raincloud"?`
                <label>
                  Cloud offset
                  <input id="dist-raincloud-offset" type="number" min="2" max="30" step="1" value="${t.distributionChartType.raincloud.cloudOffset}">
                </label>
                <label>
                  Ratio caja
                  <input id="dist-raincloud-box-ratio" type="number" min="0.2" max="0.8" step="0.05" value="${t.distributionChartType.raincloud.boxHeightRatio}">
                </label>
              `:""}
              ${t.distribution.chartType==="errorbar"?`
                <label>
                  Metrica error
                  <select id="dist-error-metric">
                    <option value="sd" ${t.distributionChartType.errorbar.errorMetric==="sd"?"selected":""}>SD</option>
                    <option value="se" ${t.distributionChartType.errorbar.errorMetric==="se"?"selected":""}>SE</option>
                    <option value="ci95" ${t.distributionChartType.errorbar.errorMetric==="ci95"?"selected":""}>CI 95</option>
                    <option value="minmax" ${t.distributionChartType.errorbar.errorMetric==="minmax"?"selected":""}>Min/Max</option>
                  </select>
                </label>
                <label>
                  Nivel CI
                  <input id="dist-error-ci-level" type="number" min="80" max="99" step="1" value="${t.distributionChartType.errorbar.errorCiLevel}">
                </label>
              `:""}
              <label>
                ${o.outlierColor}
                <input id="dist-outlier-color" type="color" value="${t.distribution.outlierColor}">
              </label>
              <label>
                ${o.outlierSize}
                <input id="dist-outlier-size" type="number" min="1" max="12" step="0.2" value="${t.distribution.outlierSize}">
              </label>
              <label>
                ${o.jitterSize}
                <input id="dist-jitter-size" type="number" min="0.6" max="10" step="0.2" value="${t.distribution.jitterSize}">
              </label>
              <label>
                ${o.jitterAlpha}
                <input id="dist-jitter-alpha" type="number" min="0.05" max="1" step="0.05" value="${t.distribution.jitterAlpha}">
              </label>
              <label class="config-check">
                <input id="dist-show-marker" type="checkbox" ${t.distribution.showGroupMarker?"checked":""}>
                <span>${o.showMarker}</span>
              </label>
              <label>
                ${o.markerMetric}
                <select id="dist-group-metric">
                  <option value="median" ${t.distribution.groupMetric==="median"?"selected":""}>Mediana</option>
                  <option value="mean" ${t.distribution.groupMetric==="mean"?"selected":""}>Media</option>
                </select>
              </label>
              <label>
                ${o.markerStyle}
                <select id="dist-marker-style">
                  <option value="point" ${t.distribution.groupMarkerStyle==="point"?"selected":""}>Punto</option>
                  <option value="square" ${t.distribution.groupMarkerStyle==="square"?"selected":""}>Cuadrado</option>
                  <option value="line" ${t.distribution.groupMarkerStyle==="line"?"selected":""}>Linea</option>
                </select>
              </label>
              <label>
                ${o.markerColor}
                <input id="dist-marker-color" type="color" value="${t.distribution.groupMarkerColor}">
              </label>
              <label>
                ${o.markerSize}
                <input id="dist-marker-size" type="number" min="2" max="18" step="0.5" value="${t.distribution.groupMarkerSize}">
              </label>
            </div>
          </div>

          <div class="layout-section ${r==="layout-annotations"?"active":""}" id="dist-layout-annotations">
            <div class="config-block">
              <div class="config-subgroup">
                <h4 style="margin:8px 0 4px;">${o.annotations}</h4>
              </div>
              <label class="config-check">
                <input id="dist-show-mean-line" type="checkbox" ${t.sharedAnnotations.showMeanLine?"checked":""}>
                <span>${o.showMeanLine}</span>
              </label>
              <label>
                ${o.meanLineColor}
                <input id="dist-mean-line-color" type="color" value="${t.sharedAnnotations.meanLineColor}">
              </label>
              <label>
                ${o.meanLineWidth}
                <input id="dist-mean-line-width" type="number" min="1" max="8" step="0.2" value="${t.sharedAnnotations.meanLineWidth}">
              </label>
              <label>
                ${o.meanLineDash}
                <input id="dist-mean-line-dash" type="number" min="2" max="40" step="1" value="${t.sharedAnnotations.meanLineDash}">
              </label>
              <label>
                ${o.meanLineGap}
                <input id="dist-mean-line-gap" type="number" min="2" max="40" step="1" value="${t.sharedAnnotations.meanLineGap}">
              </label>
              <label class="config-check">
                <input id="dist-show-mean-label" type="checkbox" ${t.sharedAnnotations.showMeanLabel?"checked":""}>
                <span>${o.showMeanLabel}</span>
              </label>
              <label class="config-check">
                <input id="dist-show-stats-panel" type="checkbox" ${t.sharedAnnotations.showStatsPanel?"checked":""}>
                <span>${o.showStatsPanel}</span>
              </label>
              <label>
                ${o.statsPosition}
                <select id="dist-stats-position">
                  <option value="top_left" ${t.sharedAnnotations.statsPosition==="top_left"?"selected":""}>Top left</option>
                  <option value="top_right" ${t.sharedAnnotations.statsPosition==="top_right"?"selected":""}>Top right</option>
                  <option value="bottom_left" ${t.sharedAnnotations.statsPosition==="bottom_left"?"selected":""}>Bottom left</option>
                  <option value="bottom_right" ${t.sharedAnnotations.statsPosition==="bottom_right"?"selected":""}>Bottom right</option>
                </select>
              </label>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:8px 12px;">
                <label class="config-check"><input id="dist-stats-show-n" type="checkbox" ${t.sharedAnnotations.statsFields.n?"checked":""}><span>N</span></label>
                <label class="config-check"><input id="dist-stats-show-mean" type="checkbox" ${t.sharedAnnotations.statsFields.mean?"checked":""}><span>Mean</span></label>
                <label class="config-check"><input id="dist-stats-show-median" type="checkbox" ${t.sharedAnnotations.statsFields.median?"checked":""}><span>Median</span></label>
                <label class="config-check"><input id="dist-stats-show-sd" type="checkbox" ${t.sharedAnnotations.statsFields.sd?"checked":""}><span>SD</span></label>
                <label class="config-check"><input id="dist-stats-show-iqr" type="checkbox" ${t.sharedAnnotations.statsFields.iqr?"checked":""}><span>IQR</span></label>
              </div>
              <label>
                ${o.annotationText}
                <input id="dist-annotation-text" type="text" value="${t.sharedAnnotations.annotationText}">
              </label>
              <label>
                ${o.annotationX}
                <input id="dist-annotation-x" type="number" min="0" max="100" step="1" value="${t.sharedAnnotations.annotationX}">
              </label>
              <label>
                ${o.annotationY}
                <input id="dist-annotation-y" type="number" min="0" max="100" step="1" value="${t.sharedAnnotations.annotationY}">
              </label>
              <label>
                ${o.annotationColor}
                <input id="dist-annotation-color" type="color" value="${t.sharedAnnotations.annotationColor}">
              </label>
              <label>
                ${o.annotationSize}
                <input id="dist-annotation-size" type="number" min="10" max="40" step="1" value="${t.sharedAnnotations.annotationSize}">
              </label>
            </div>
          </div>

          <div class="layout-section ${r==="layout-axes-grid"?"active":""}" id="dist-layout-axes-grid">
            <div class="config-block">
              ${ft({lang:n.language,showGridId:"dist-show-grid",gridDashedId:"dist-grid-dashed",gridVerticalId:"dist-grid-vertical",gridHorizontalId:"dist-grid-horizontal",showGridBorderId:"dist-show-grid-border",gridWidthId:"dist-grid-width",showAxisLabelsId:"dist-show-axis-labels",axisWidthId:"dist-axis-width",showGrid:t.sharedChart.showGrid,gridDashed:t.sharedChart.gridDashed,gridVertical:t.sharedChart.gridVertical,gridHorizontal:t.sharedChart.gridHorizontal,showGridBorder:t.sharedChart.showGridBorder,gridWidth:t.sharedChart.lineWidth,showAxisLabels:t.sharedChart.showAxisLabels,axisWidth:t.sharedChart.axisWidth})}
            </div>
          </div>

          <div class="layout-section ${r==="layout-canvas"?"active":""}" id="dist-layout-canvas">
            <div class="config-block">
              ${gt({lang:n.language,marginTopId:"dist-margin-top",marginRightId:"dist-margin-right",marginBottomId:"dist-margin-bottom",marginLeftId:"dist-margin-left",chartWidthId:"dist-chart-width",marginTop:t.sharedChart.marginTop,marginRight:t.sharedChart.marginRight,marginBottom:t.sharedChart.marginBottom,marginLeft:t.sharedChart.marginLeft,chartWidth:t.sharedChart.chartWidth,includeChartMinHeight:!0,chartMinHeightId:"dist-chart-min-height",chartMinHeight:t.sharedChart.chartMinHeight})}
            </div>
          </div>
        `:""}

        ${a==="export"?`
          ${pt({lang:n.language,formatSelectId:"dist-export-format",scaleSelectId:"dist-export-scale",buttonId:"dist-export-btn",format:t.sharedExport.format,scale:t.sharedExport.scale})}
        `:""}
      </aside>

      <section class="distribution-main-column">
        ${ht({lang:n.language,moduleId:"dist",stageId:"distribution-stage",canvasId:"distribution-canvas",datasetName:i==null?void 0:i.name,zoomLevel:t.distribution.zoomLevel,includeExportButton:!0})}

        <section class="workspace-canvas-area distribution-analysis-area" style="padding-top:0;">
          <div class="workspace-canvas-header">
            <h2>${o.analysis}</h2>
          </div>
          <div class="chart-stage distribution-analysis-stage">
            ${t.sharedAnnotations.showStatsPanel&&h.length?`
              <div class="distribution-analysis-grid">
                ${h.map(b=>`
                  <div class="distribution-analysis-card">
                    <div class="distribution-analysis-card-title">${b.label}</div>
                    <div class="distribution-analysis-metrics">
                      <div><strong>N</strong><br>${b.n}</div>
                      <div><strong>Mean</strong><br>${b.mean.toFixed(2)}</div>
                      <div><strong>Median</strong><br>${b.median.toFixed(2)}</div>
                      <div><strong>SD</strong><br>${b.sd.toFixed(2)}</div>
                      <div><strong>IQR</strong><br>${b.iqr.toFixed(2)}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            `:""}
            ${t.sharedAnnotations.showStatsPanel&&Number.isFinite(p.n)&&p.n>0?`
              <div class="distribution-analysis-card distribution-analysis-card-overall">
                <div class="distribution-analysis-card-title">Overall</div>
                <div class="distribution-analysis-metrics">
                  <div><strong>N</strong><br>${p.n}</div>
                  <div><strong>Mean</strong><br>${p.mean.toFixed(2)}</div>
                  <div><strong>Median</strong><br>${p.median.toFixed(2)}</div>
                  <div><strong>SD</strong><br>${p.sd.toFixed(2)}</div>
                  <div><strong>IQR</strong><br>${p.iqr.toFixed(2)}</div>
                </div>
              </div>
            `:""}
            ${t.distribution.showHypothesisPanel?`
              <div class="distribution-analysis-card">
                <div class="distribution-analysis-card-title">Hypothesis test</div>
                ${g?`
                  <div class="distribution-analysis-metrics distribution-analysis-metrics-wide">
                    <div><strong>Test</strong><br>${g.test}</div>
                    <div><strong>${g.statLabel}</strong><br>${g.stat.toFixed(3)}</div>
                    ${Number.isFinite(g.df??NaN)?`<div><strong>df</strong><br>${g.df.toFixed(1)}</div>`:""}
                    ${Number.isFinite(g.df1??NaN)&&Number.isFinite(g.df2??NaN)?`<div><strong>df</strong><br>${g.df1.toFixed(0)}, ${g.df2.toFixed(0)}</div>`:""}
                    <div><strong>p</strong><br>${g.p<.001?"&lt; 0.001":g.p.toFixed(4)}</div>
                    <div><strong>${g.effectLabel}</strong><br>${g.effect.toFixed(3)}</div>
                  </div>
                `:`
                  <p style="margin:0; color:#64748b;">${o.noHypothesis}</p>
                `}
              </div>
            `:""}
            ${!t.sharedAnnotations.showStatsPanel&&!t.distribution.showHypothesisPanel?`
              <p style="margin:0; color:#64748b;">${o.enableAnalysis}</p>
            `:""}
          </div>
        </section>
      </section>
    </section>
  `}function pi(e){const n=[",",";","	","|"];let i=",",t=-1;return n.forEach(a=>{const r=(e.match(new RegExp(a==="	"?"\\t":`\\${a}`,"g"))||[]).length;r>t&&(t=r,i=a)}),i}function Xe(e,n){const i=[];let t="",a=!1;for(let r=0;r<e.length;r+=1){const o=e[r],s=e[r+1];if(o==='"'&&a&&s==='"'){t+='"',r+=1;continue}if(o==='"'){a=!a;continue}if(o===n&&!a){i.push(t.trim()),t="";continue}t+=o}return i.push(t.trim()),i}function mi(e){const n=e.trim();if(!n)return null;const i=Number(n);return Number.isFinite(i)&&/^-?\d+(\.\d+)?$/.test(n)?i:n}function gi(e,n){const i=e.split(/\r?\n/).map(o=>o.trim()).filter(o=>o.length>0);if(i.length<2)throw new Error("CSV inválido: se requieren cabecera y al menos una fila.");const t=n==="auto"?pi(i[0]):n,a=Xe(i[0],t);if(!a.length)throw new Error("CSV inválido: cabecera vacía.");const r=[];for(let o=1;o<i.length;o+=1){const s=Xe(i[o],t),l={};a.forEach((d,u)=>{l[d||`col_${u+1}`]=mi(s[u]??"")}),r.push(l)}return r}function bi(e){let n;try{n=JSON.parse(e)}catch{throw new Error("JSON inválido: no se pudo parsear.")}if(!Array.isArray(n))throw new Error("JSON inválido: se espera un array de objetos.");const t=n.map((a,r)=>{if(!a||typeof a!="object"||Array.isArray(a))throw new Error(`JSON inválido en fila ${r+1}: cada elemento debe ser objeto.`);const o={};return Object.entries(a).forEach(([s,l])=>{l===null||typeof l=="string"||typeof l=="number"?o[s]=l:o[s]=String(l)}),o});if(!t.length)throw new Error("JSON inválido: array vacío.");return t}function je(e,n,i){return Math.min(i,Math.max(n,e))}function Ue(e){const n=e.replace("#",""),i=n.length===3?n.split("").map(a=>a+a).join(""):n,t=Number.parseInt(i,16);return{r:t>>16&255,g:t>>8&255,b:t&255}}function fi({r:e,g:n,b:i}){return`#${[e,n,i].map(t=>je(Math.round(t),0,255).toString(16).padStart(2,"0")).join("")}`}function vi(e,n){if(n<=e.length)return e.slice(0,n);if(n<=1)return[e[0]];const i=[],t=(e.length-1)/(n-1);for(let a=0;a<n;a+=1){const r=a*t,o=Math.floor(r),s=Math.min(o+1,e.length-1),l=r-o;if(o===s){i.push(e[o]);continue}const d=Ue(e[o]),u=Ue(e[s]);i.push(fi({r:d.r+(u.r-d.r)*l,g:d.g+(u.g-d.g)*l,b:d.b+(u.b-d.b)*l}))}return i}function yi(e,n){const i={blue_orange:["#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4"],red_green:["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],purple_yellow:["#7b3294","#c2a5cf","#f7f7f7","#a6dba0","#008837"],spectral:["#d53e4f","#fc8d59","#fee08b","#e6f598","#99d594","#3288bd"],viridis:["#440154","#31688e","#35b779","#fde724"],warm:["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"],cool:["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"],earth:["#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e"]},t=i[e??"blue_orange"]??i.blue_orange,a=Math.max(2,n);return vi(t,a)}function Ye(e,n,i){if(!n)return"";if(e.measureText(n).width<=i)return n;const t="...";let a=n.trim();for(;a.length>1&&e.measureText(`${a}${t}`).width>i;)a=a.slice(0,-1).trimEnd();return`${a}${t}`}function Mt(e,n,i,t){const a=Math.max(1,t),r=String(n??"").trim();if(!r)return[""];const o=r.split(/\s+/),s=[];let l="";if(o.forEach(u=>{const f=l?`${l} ${u}`:u;if(e.measureText(f).width<=i){l=f;return}if(l){s.push(l),l=u;return}s.push(Ye(e,u,i)),l=""}),l&&s.push(l),s.length<=a)return s;const d=s.slice(0,a);return d[a-1]=Ye(e,d[a-1],i),d}function ki(e,n,i){if(!e.records.length)return[];const t=Object.keys(e.records[0]),a=[];return t.forEach(r=>{const o=new Array(n).fill(0);let s=0,l=0;e.records.forEach(d=>{const u=d[r],f=Number(typeof u=="string"?u.trim():u);if(!Number.isFinite(f))return;const h=je(Math.round(f)-i,0,n-1);o[h]+=1,s+=1,l+=h+i}),s>0&&a.push({item:r,counts:o,total:s,mean:l/s})}),a}function Si(e,n){const i=[...e];return n==="mean_desc"&&i.sort((t,a)=>a.mean-t.mean),n==="mean_asc"&&i.sort((t,a)=>t.mean-a.mean),n==="label_asc"&&i.sort((t,a)=>t.item.localeCompare(a.item)),i}function Ci(e,n){if(!n.length)return e;const i=new Set(n);return e.filter(t=>i.has(t.item))}function Se(e,n,i){return i.valueMode==="count"?String(e):`${(e/n*100).toFixed(i.decimalPlaces)}%`}function Ke(e,n,i,t,a,r){if(!a.showLegend)return;const o=14,s=10,l=6,d=14,u=Math.max(16,Math.round(a.fontSizeLegend*1.8));e.font=`${a.fontSizeLegend}px ${a.fontFamily}`,e.textBaseline="middle";const f=(b,k,M,$)=>{e.fillStyle=M,e.fillRect(b,k-s/2,o,s),e.strokeStyle="#cbd5e1",e.lineWidth=1,e.strokeRect(b,k-s/2,o,s),e.fillStyle="#334155",e.fillText($,b+o+l,k)},h=Array.from({length:Math.max(2,a.scalePoints)},(b,k)=>a.scaleLabels[k]??String(k+1));if(a.legendPosition==="top"){let b=t.left,k=Math.max(22,t.top-u+2);const M=n-t.right;h.forEach(($,w)=>{const S=o+l+e.measureText($).width+d;b+S>M&&b>t.left&&(b=t.left,k+=u),f(b,k,r[w%r.length],$),b+=S});return}if(a.legendPosition==="bottom"){let b=t.left,k=i-Math.max(20,t.bottom-u);const M=n-t.right;h.forEach(($,w)=>{const S=o+l+e.measureText($).width+d;b+S>M&&b>t.left&&(b=t.left,k+=u),f(b,k,r[w%r.length],$),b+=S});return}if(a.legendPosition==="left"){let b=t.top+10;const k=12;h.forEach((M,$)=>{f(k,b,r[$%r.length],M),b+=u});return}let p=t.top+10;const g=n-t.right+10;h.forEach((b,k)=>{f(g,p,r[k%r.length],b),p+=u})}function $i(e,n,i,t){if(!t.showLegend)return{top:0,right:0,bottom:0,left:0};e.save(),e.font=`${t.fontSizeLegend}px ${t.fontFamily}`;const a=Array.from({length:Math.max(2,t.scalePoints)},(b,k)=>t.scaleLabels[k]??String(k+1)),r=14,o=6,s=14,l=Math.max(16,Math.round(t.fontSizeLegend*1.8)),d=a.map(b=>r+o+e.measureText(b).width+s);let u={top:0,right:0,bottom:0,left:0};if(t.legendPosition==="left"||t.legendPosition==="right"){const b=Math.max(...d,90);return t.legendPosition==="left"&&(u.left=Math.ceil(b+14)),t.legendPosition==="right"&&(u.right=Math.ceil(b+14)),e.restore(),u}const f=Math.max(180,n-i.left-i.right);let h=1,p=0;d.forEach(b=>{if(p>0&&p+b>f){h+=1,p=b;return}p+=b});const g=h*l+12;return t.legendPosition==="top"&&(u.top=g),t.legendPosition==="bottom"&&(u.bottom=g),e.restore(),u}function Qe(e,n,i,t,a,r){if(!n.showAxisLabels)return;if(e.fillStyle=n.axisColor,e.font=`11px ${n.fontFamily}`,n.chartType==="split"){const s=Math.max(44,Math.min(96,Math.round(r*.08))),l=10,d=Math.max(120,r-s-l),u=i.left,f=i.left+d+l,h=a-i.bottom+16;e.fillText("100%",u-18,h),e.fillText("50%",u+d*.25-10,h),e.fillText("0%",u+d*.5-6,h),e.fillText("50%",u+d*.75-10,h),e.fillText("100%",u+d-16,h),e.fillText("100%",f+s/2-10,h);return}if(n.chartType==="distribution"){e.fillText("0%",i.left-8,a-i.bottom+16),e.fillText("50%",i.left+r/2-10,a-i.bottom+16),e.fillText("100%",i.left+r-16,a-i.bottom+16);return}if(n.chartType==="stacked"){e.fillText("0%",i.left-8,a-i.bottom+16),e.fillText("50%",i.left+r/2-10,a-i.bottom+16),e.fillText("100%",i.left+r-16,a-i.bottom+16);return}const o=i.left+r/2;e.fillText("100%",i.left-18,a-i.bottom+16),e.fillText("50%",i.left+r/4-10,a-i.bottom+16),e.fillText("0%",o-6,a-i.bottom+16),e.fillText("50%",i.left+r*3/4-10,a-i.bottom+16),e.fillText("100%",t-i.right-20,a-i.bottom+16)}function Mi(e,n,i,t,a,r){const o=a-i.bottom;if(n.chartType==="split"){const s=Math.max(44,Math.min(96,Math.round(r*.08))),l=10,d=Math.max(120,r-s-l),u=i.left,f=u+d,h=u+d/2,p=f+l;if(n.showGrid){if(e.strokeStyle=n.gridColor,e.lineWidth=n.gridWidth,e.setLineDash(n.gridDashed?[5,5]:[]),n.gridVertical)for(let g=0;g<=4;g+=1){const b=u+d/4*g;e.beginPath(),e.moveTo(b,i.top),e.lineTo(b,o),e.stroke()}if(n.gridHorizontal)for(let g=0;g<=4;g+=1){const b=i.top+(o-i.top)/4*g;e.beginPath(),e.moveTo(u,b),e.lineTo(f,b),e.stroke(),e.beginPath(),e.moveTo(p,b),e.lineTo(p+s,b),e.stroke()}e.setLineDash([]),n.showGridBorder&&(e.strokeStyle=n.gridColor,e.strokeRect(u,i.top,d,o-i.top),e.strokeRect(p,i.top,s,o-i.top))}e.strokeStyle=n.axisColor,e.lineWidth=n.axisWidth,e.beginPath(),e.moveTo(u,o+2),e.lineTo(f,o+2),e.moveTo(p,o+2),e.lineTo(p+s,o+2),e.stroke(),e.strokeStyle=n.centerLineColor,e.lineWidth=n.centerLineWidth,e.beginPath(),e.moveTo(h,i.top),e.lineTo(h,o),e.stroke();return}if(n.showGrid){e.strokeStyle=n.gridColor,e.lineWidth=n.gridWidth,e.setLineDash(n.gridDashed?[5,5]:[]);const s=(n.chartType==="stacked",4);for(let l=0;l<=s;l+=1){const d=i.left+r/s*l;n.gridVertical&&(e.beginPath(),e.moveTo(d,i.top),e.lineTo(d,o),e.stroke())}if(n.gridHorizontal)for(let l=0;l<=4;l+=1){const d=i.top+(o-i.top)/4*l;e.beginPath(),e.moveTo(i.left,d),e.lineTo(t-i.right,d),e.stroke()}e.setLineDash([]),n.showGridBorder&&(e.strokeStyle=n.gridColor,e.strokeRect(i.left,i.top,r,o-i.top))}if(e.strokeStyle=n.axisColor,e.lineWidth=n.axisWidth,e.beginPath(),e.moveTo(i.left,o+2),e.lineTo(t-i.right,o+2),e.stroke(),n.chartType==="diverging"){const s=i.left+r/2;e.strokeStyle=n.centerLineColor,e.lineWidth=n.centerLineWidth,e.beginPath(),e.moveTo(s,i.top),e.lineTo(s,o),e.stroke()}}function wi(e,n,i,t,a,r,o){const s=r-a.left-a.right,l=o-a.top-a.bottom,d=new Array(Math.max(2,i.scalePoints)).fill(0);let u=0;n.forEach(g=>{g.counts.forEach((b,k)=>{d[k]+=b,u+=b})});const f=d.map(g=>u>0?g/u*100:0),h=Math.max(1,...f),p=s/Math.max(1,d.length);d.forEach((g,b)=>{const k=f[b],M=Math.max(18,p*.68),$=k/h*l,w=a.left+p*b+(p-M)/2,S=a.top+l-$;if(e.fillStyle=t[b%t.length],e.fillRect(w,S,M,$),i.showBarBorders&&(e.strokeStyle=i.barBorderColor,e.lineWidth=i.barBorderWidth,e.strokeRect(w,S,M,$)),i.showValues){e.fillStyle="#0f172a",e.font=`600 ${i.fontSizeValues}px ${i.fontFamily}`,e.textAlign="center";const x=i.valueMode==="count"?String(g):`${k.toFixed(i.decimalPlaces)}%`;e.fillText(x,w+M/2,S-8)}e.fillStyle="#334155",e.font=`${i.fontSizeLabels}px ${i.fontFamily}`,e.textAlign="center";const z=i.scaleLabels[b]??String(b+1);Mt(e,z,p-8,3).forEach((x,B)=>{e.fillText(x,w+M/2,o-a.bottom+20+B*Math.round(i.fontSizeLabels*1.2))})})}function xi(e,n,i){const t=e.getContext("2d");if(!t)return;const a={chartType:i.chartType??"stacked",decimalPlaces:i.decimalPlaces??1,showLegend:i.showLegend??!0,showValues:i.showValues??!0,legendPosition:i.legendPosition??"bottom",scalePoints:i.scalePoints??5,scaleLabels:i.scaleLabels??[],scaleStart:i.scaleStart??1,valueMode:i.valueMode??"percentage",itemOrder:i.itemOrder??"original",paletteId:i.paletteId??"blue_orange",selectedItems:i.selectedItems??[],showTitle:i.showTitle??!0,chartTitle:i.chartTitle??"",fontFamily:i.fontFamily??"Segoe UI, sans-serif",fontSizeLabels:i.fontSizeLabels??12,fontSizeTitle:i.fontSizeTitle??18,fontSizeValues:i.fontSizeValues??11,fontSizeLegend:i.fontSizeLegend??10,labelMaxLines:i.labelMaxLines??2,watermark:i.watermark??"",chartWidth:i.chartWidth??1200,marginTop:i.marginTop??60,marginRight:i.marginRight??80,marginBottom:i.marginBottom??70,marginLeft:i.marginLeft??220,backgroundColor:i.backgroundColor??"#ffffff",transparentBackground:i.transparentBackground??!1,showGrid:i.showGrid??!0,gridDashed:i.gridDashed??!0,gridVertical:i.gridVertical??!0,gridHorizontal:i.gridHorizontal??!1,showGridBorder:i.showGridBorder??!0,gridColor:i.gridColor??"#e2e8f0",gridWidth:i.gridWidth??1,axisColor:i.axisColor??"#64748b",axisWidth:i.axisWidth??2,showAxisLabels:i.showAxisLabels??!0,neutralIndex:i.neutralIndex??Math.ceil((i.scalePoints??5)/2),centerLineColor:i.centerLineColor??"#334155",centerLineWidth:i.centerLineWidth??2,barHeight:i.barHeight??40,barSpacing:i.barSpacing??10,showBarBorders:i.showBarBorders??!1,barBorderColor:i.barBorderColor??"#ffffff",barBorderWidth:i.barBorderWidth??1},r=Math.max(700,a.chartWidth),o=Math.max(20,a.barHeight),s=Math.max(0,a.barSpacing),l=$i(t,r,{top:a.marginTop,right:a.marginRight,bottom:a.marginBottom,left:a.marginLeft},a),d={top:Math.max(20,a.marginTop+l.top),right:Math.max(20,a.marginRight+l.right),bottom:Math.max(20,a.marginBottom+l.bottom),left:Math.max(60,a.marginLeft+l.left)},u=n?ki(n,Math.max(2,a.scalePoints),a.scaleStart):[],f=Ci(u,a.selectedItems),h=Si(f,a.itemOrder);t.font=`${a.fontSizeLabels}px ${a.fontFamily}`;const p=Math.round(a.fontSizeLabels*1.2),g=Math.max(80,d.left-22),b=h.map(C=>({...C,labelLines:Mt(t,C.item,g,a.labelMaxLines)})),M=b.map(C=>Math.max(o,C.labelLines.length*p)).reduce((C,x)=>C+x,0)+Math.max(0,b.length-1)*s,$=Math.max(320,d.top+d.bottom+M);e.width=r,e.height=$,t.clearRect(0,0,r,$),a.transparentBackground||(t.fillStyle=a.backgroundColor,t.fillRect(0,0,r,$));const w=r-d.left-d.right;if(Mi(t,a,d,r,$,w),a.showTitle&&(t.fillStyle="#0f172a",t.font=`600 ${a.fontSizeTitle}px ${a.fontFamily}`,t.fillText(a.chartTitle.trim()||"Likert Chart",16,28)),!h.length){t.fillStyle="#64748b",t.font=`13px ${a.fontFamily}`,t.fillText("No hay datos numericos para renderizar Likert.",16,58);return}const S=yi(a.paletteId,a.scalePoints);if(a.chartType==="distribution"){wi(t,b,{...a},S,d,r,$),Qe(t,a,d,r,$,w),Ke(t,r,$,d,a,S),a.watermark.trim()&&(t.fillStyle="rgba(30, 41, 59, 0.45)",t.font=`11px ${a.fontFamily}`,t.fillText(a.watermark.trim(),r-180,$-8));return}let z=d.top;b.forEach(C=>{const x=Math.max(o,C.labelLines.length*p),B=z+(x-o)/2;t.fillStyle="#334155",t.font=`${a.fontSizeLabels}px ${a.fontFamily}`;const R=z+x/2-(C.labelLines.length-1)*p/2;if(C.labelLines.forEach((E,T)=>{t.fillText(E,12,R+T*p)}),a.chartType==="stacked"){let E=d.left;C.counts.forEach((T,P)=>{const W=T/C.total,y=w*W;t.fillStyle=S[P%S.length],t.fillRect(E,B,y,o),a.showBarBorders&&(t.strokeStyle=a.barBorderColor,t.lineWidth=a.barBorderWidth,t.strokeRect(E,B,y,o)),a.showValues&&y>36&&(t.fillStyle="#ffffff",t.font=`600 ${a.fontSizeValues}px ${a.fontFamily}`,t.fillText(Se(T,C.total,a),E+8,B+o*.62)),E+=y})}else{const E=je(Math.round(a.neutralIndex)-1,0,C.counts.length-1),T=C.counts[E]??0,P=a.chartType==="split"?Math.max(44,Math.min(96,Math.round(w*.08))):0,W=a.chartType==="split"?10:0,y=a.chartType==="split"?Math.max(120,w-P-W):w,L=d.left+y/2,N=y/2,I=a.chartType==="split"?Math.max(0,T/C.total*P):N*(T/C.total),A=a.chartType==="split"?d.left+y+W:L-I/2;let _=L;for(let j=E-1;j>=0;j-=1){const q=C.counts[j]??0,O=N*(q/C.total);_-=O,t.fillStyle=S[j%S.length],t.fillRect(_,B,O,o),a.showBarBorders&&(t.strokeStyle=a.barBorderColor,t.lineWidth=a.barBorderWidth,t.strokeRect(_,B,O,o)),a.showValues&&O>36&&(t.fillStyle="#ffffff",t.font=`600 ${a.fontSizeValues}px ${a.fontFamily}`,t.fillText(Se(q,C.total,a),_+8,B+o*.62))}a.chartType==="split"?(t.fillStyle="#e5e7eb",t.fillRect(A,B,P,o),I>0&&(t.fillStyle=S[E%S.length],t.fillRect(A,B,I,o)),a.showBarBorders&&(t.strokeStyle=a.barBorderColor,t.lineWidth=a.barBorderWidth,t.strokeRect(A,B,P,o)),a.showValues&&I>36&&(t.fillStyle="#0f172a",t.font=`600 ${a.fontSizeValues}px ${a.fontFamily}`,t.fillText(Se(T,C.total,a),A+P/2,B+o*.62))):I>0&&(t.fillStyle=S[E%S.length],t.fillRect(L-I/2,B,I,o),a.showBarBorders&&(t.strokeStyle=a.barBorderColor,t.lineWidth=a.barBorderWidth,t.strokeRect(L-I/2,B,I,o)),a.showValues&&I>36&&(t.fillStyle="#0f172a",t.font=`600 ${a.fontSizeValues}px ${a.fontFamily}`,t.fillText(Se(T,C.total,a),L-I/2+8,B+o*.62)));let H=L;for(let j=E+1;j<C.counts.length;j+=1){const q=C.counts[j]??0,O=N*(q/C.total);t.fillStyle=S[j%S.length],t.fillRect(H,B,O,o),a.showBarBorders&&(t.strokeStyle=a.barBorderColor,t.lineWidth=a.barBorderWidth,t.strokeRect(H,B,O,o)),a.showValues&&O>36&&(t.fillStyle="#ffffff",t.font=`600 ${a.fontSizeValues}px ${a.fontFamily}`,t.fillText(Se(q,C.total,a),H+8,B+o*.62)),H+=O}}z+=x+s}),Qe(t,a,d,r,$,w),Ke(t,r,$,d,a,S),a.watermark.trim()&&(t.fillStyle="rgba(30, 41, 59, 0.45)",t.font=`11px ${a.fontFamily}`,t.fillText(a.watermark.trim(),r-180,$-8))}function Ze(e){const n=e.replace("#",""),i=n.length===3?n.split("").map(a=>a+a).join(""):n,t=Number.parseInt(i,16);return{r:t>>16&255,g:t>>8&255,b:t&255}}function ze(e,n,i){const t=Ze(e),a=Ze(n),r=se(i,0,1,.5),o=s=>Math.round(s).toString(16).padStart(2,"0");return`#${o(t.r+(a.r-t.r)*r)}${o(t.g+(a.g-t.g)*r)}${o(t.b+(a.b-t.b)*r)}`}function Ei(e,n){const i={blue_orange:["#d73027","#f46d43","#fdae61","#fee090","#e0f3f8","#abd9e9","#74add1","#4575b4"],red_green:["#d7191c","#fdae61","#ffffbf","#a6d96a","#1a9641"],purple_yellow:["#7b3294","#c2a5cf","#f7f7f7","#a6dba0","#008837"],spectral:["#d53e4f","#fc8d59","#fee08b","#e6f598","#99d594","#3288bd"],viridis:["#440154","#31688e","#35b779","#fde724"],warm:["#fff5eb","#fee6ce","#fdd0a2","#fdae6b","#fd8d3c","#f16913","#d94801","#8c2d04"],cool:["#f7fbff","#deebf7","#c6dbef","#9ecae1","#6baed6","#4292c6","#2171b5","#084594"],earth:["#8c510a","#bf812d","#dfc27d","#f6e8c3","#c7eae5","#80cdc1","#35978f","#01665e"]},t=i[e??"blue_orange"]??i.blue_orange;return n<=t.length?t.slice(0,Math.max(1,n)):Array.from({length:n},(a,r)=>t[r%t.length])}function wt(e,n,i){const t=Ei(e.paletteId,Math.max(3,i)),a=t[n%t.length];return{fill:ze(a,"#ffffff",.35),fillSoft:ze(a,"#ffffff",.55),stroke:ze(a,"#0f172a",.22),accent:ze(a,"#0f172a",.12)}}function se(e,n,i,t){return Number.isFinite(e)?Math.min(i,Math.max(n,e)):t}function et(e,n,i,t,a,r){if(!n.showStatsPanel||!n.overallStats||!Number.isFinite(n.overallStats.n)||n.overallStats.n<=0)return;const o=n.statsFields||{},s=[];if(o.n!==!1&&s.push(`n = ${n.overallStats.n}`),o.mean!==!1&&Number.isFinite(n.overallStats.mean)&&s.push(`mean = ${n.overallStats.mean.toFixed(3)}`),o.median!==!1&&Number.isFinite(n.overallStats.median)&&s.push(`median = ${n.overallStats.median.toFixed(3)}`),o.sd!==!1&&Number.isFinite(n.overallStats.sd)&&s.push(`sd = ${n.overallStats.sd.toFixed(3)}`),o.iqr!==!1&&Number.isFinite(n.overallStats.iqr)&&s.push(`iqr = ${n.overallStats.iqr.toFixed(3)}`),!s.length)return;const l=8,d=Math.max(14,n.fontSizeLabels+2);e.save(),e.font=`${n.fontSizeLabels}px ${n.fontFamily}`;const f=Math.max(...s.map(k=>e.measureText(k).width))+l*2,h=s.length*d+l*2,p=10;let g=t-f-p,b=a+p;n.statsPosition==="top_left"?g=i+p:n.statsPosition==="bottom_left"?(g=i+p,b=r-h-p):n.statsPosition==="bottom_right"&&(b=r-h-p),g=se(g,i,t-f,i+p),b=se(b,a,r-h,a+p),e.fillStyle="rgba(255,255,255,0.88)",e.strokeStyle="#94a3b8",e.lineWidth=1,e.fillRect(g,b,f,h),e.strokeRect(g,b,f,h),e.fillStyle="#0f172a",e.textAlign="left",e.textBaseline="top",s.forEach((k,M)=>{e.fillText(k,g+l,b+l+M*d)}),e.restore()}function tt(e,n,i,t,a,r){if(!n.showHypothesisPanel||!n.hypothesisResult)return;const o={welch_t:"Welch t-test",mann_whitney:"Mann-Whitney U",anova:"ANOVA",kruskal_wallis:"Kruskal-Wallis"},s=n.hypothesisResult,l=[];if(s.test&&l.push(`test = ${o[s.test]||s.test}`),s.statLabel&&Number.isFinite(s.stat)&&l.push(`${s.statLabel} = ${s.stat.toFixed(3)}`),Number.isFinite(s.df??NaN)&&!Number.isFinite(s.df1??NaN)&&l.push(`df = ${s.df.toFixed(1)}`),Number.isFinite(s.df1??NaN)&&Number.isFinite(s.df2??NaN)&&l.push(`df = ${s.df1.toFixed(0)}, ${s.df2.toFixed(0)}`),Number.isFinite(s.p)&&l.push(`p = ${s.p<.001?"< 0.001":s.p.toFixed(4)}`),s.effectLabel&&Number.isFinite(s.effect)&&l.push(`${s.effectLabel} = ${s.effect.toFixed(3)}`),!l.length)return;const d=8,u=Math.max(14,n.fontSizeLabels+2);e.save(),e.font=`${n.fontSizeLabels}px ${n.fontFamily}`;const h=Math.max(...l.map(M=>e.measureText(M).width))+d*2,p=l.length*u+d*2,g=10;let b=i+g,k=a+g;n.statsPosition==="top_left"?b=t-h-g:n.statsPosition==="bottom_left"?(b=t-h-g,k=r-p-g):n.statsPosition==="bottom_right"&&(k=r-p-g),e.fillStyle="rgba(255,255,255,0.88)",e.strokeStyle="#94a3b8",e.lineWidth=1,e.fillRect(b,k,h,p),e.strokeRect(b,k,h,p),e.fillStyle="#0f172a",e.textAlign="left",e.textBaseline="top",l.forEach((M,$)=>{e.fillText(M,b+d,k+d+$*u)}),e.restore()}function it(e,n,i,t,a,r){const o=String(n.annotationText||"").trim();if(!o)return;const s=se(n.annotationX,0,100,80),l=se(n.annotationY,0,100,12),d=i+(t-i)*s/100,u=a+(r-a)*l/100;e.save(),e.fillStyle=n.annotationColor||"#111827",e.font=`${Math.round(se(n.annotationSize,10,40,13))}px ${n.fontFamily}`,e.textAlign="left",e.textBaseline="middle",e.fillText(o,d,u),e.restore()}function nt(e,n,i,t,a,r,o,s,l){if(!n.showMeanLine||!Number.isFinite(i))return;const d=se(n.meanLineDash,2,40,8),u=se(n.meanLineGap,2,40,6),f=se(n.meanLineWidth,1,8,1.6),h=n.meanLineColor||"#0f172a";if(e.save(),e.setLineDash([d,u]),e.strokeStyle=h,e.lineWidth=f,e.beginPath(),n.orientation==="vertical"){const g=l(i);e.moveTo(t,g),e.lineTo(a,g),e.stroke(),n.showMeanLabel&&(e.setLineDash([]),e.fillStyle=h,e.font=`${n.fontSizeLabels}px ${n.fontFamily}`,e.textAlign="left",e.textBaseline="bottom",e.fillText(`mean = ${i.toFixed(3)}`,t+6,g-4)),e.restore();return}const p=s(i);e.moveTo(p,r),e.lineTo(p,o),e.stroke(),n.showMeanLabel&&(e.setLineDash([]),e.fillStyle=h,e.font=`${n.fontSizeLabels}px ${n.fontFamily}`,e.textAlign="left",e.textBaseline="top",e.fillText(`mean = ${i.toFixed(3)}`,p+6,r+6)),e.restore()}function Li(e,n,i,t,a,r,o,s){if(!s.showGrid&&!s.showGridBorder&&!s.showAxisLabels)return;const l=5;if(e.save(),s.showGrid){e.strokeStyle=s.gridColor,e.lineWidth=Math.max(1,s.gridWidth),e.setLineDash(s.gridDashed?[4,4]:[]);for(let d=0;d<=l;d+=1){const u=d/l,f=n+(i-n)*u,h=a-(a-t)*u;s.gridVertical&&(e.beginPath(),e.moveTo(f,t),e.lineTo(f,a),e.stroke()),s.gridHorizontal&&(e.beginPath(),e.moveTo(n,h),e.lineTo(i,h),e.stroke())}e.setLineDash([])}if(s.showGridBorder&&(e.strokeStyle=s.axisColor,e.lineWidth=Math.max(1,s.axisWidth),e.strokeRect(n,t,i-n,a-t)),s.showAxisLabels){e.fillStyle=s.axisColor,e.font=`${Math.max(10,s.fontSizeLabels-1)}px ${s.fontFamily}`,e.textAlign="center";for(let d=0;d<=l;d+=1){const u=d/l,f=r+(o-r)*u,h=n+(i-n)*u;e.fillText(f.toFixed(1),h,a+18)}e.textAlign="start"}e.restore()}function at(e,n,i){if(!n)return"";if(e.measureText(n).width<=i)return n;const t="...";let a=n.trim();for(;a.length>1&&e.measureText(`${a}${t}`).width>i;)a=a.slice(0,-1).trimEnd();return`${a}${t}`}function Fe(e,n,i,t){const a=Math.max(1,t),r=String(n??"").trim();if(!r)return[""];const o=r.split(/\s+/),s=[];let l="";if(o.forEach(u=>{const f=l?`${l} ${u}`:u;if(e.measureText(f).width<=i){l=f;return}if(l){s.push(l),l=u;return}s.push(at(e,u,i)),l=""}),l&&s.push(l),s.length<=a)return s;const d=s.slice(0,a);return d[a-1]=at(e,d[a-1],i),d}function We(e,n){if(!e.length)return NaN;const i=(e.length-1)*n,t=Math.floor(i),a=i-t;return e[t+1]!==void 0?e[t]+a*(e[t+1]-e[t]):e[t]}function $e(e,n){const i=[...e].sort((h,p)=>h-p),t=We(i,.25),a=We(i,.5),r=We(i,.75),o=i.reduce((h,p)=>h+p,0)/i.length,s=r-t,l=t-n*s,d=r+n*s,u=i.filter(h=>h>=l&&h<=d),f=i.filter(h=>h<l||h>d);return{min:u[0]??i[0],q1:t,median:a,mean:o,q3:r,max:u[u.length-1]??i[i.length-1],outliers:f,n:i.length}}function xt(e,n,i,t=95){const a=n.n,r=n.mean,o=e.length>1?Math.sqrt(e.reduce((d,u)=>d+(u-r)**2,0)/(e.length-1)):0,s=a>0?o/Math.sqrt(a):0,l=t>=99?2.576:1.96;return i==="se"?{lower:r-s,upper:r+s,mean:r}:i==="ci95"?{lower:r-l*s,upper:r+l*s,mean:r}:i==="minmax"?{lower:n.min,upper:n.max,mean:r}:{lower:r-o,upper:r+o,mean:r}}function Ti(e,n,i,t){const a=e.filter(([,r])=>r.length>1);return n==="alphabetical"&&a.sort((r,o)=>r[0].localeCompare(o[0])),n==="median_desc"&&a.sort((r,o)=>$e(o[1],t).median-$e(r[1],t).median),n==="median_asc"&&a.sort((r,o)=>$e(r[1],t).median-$e(o[1],t).median),a.slice(0,Math.max(1,i))}function Et(e,n){const i=e.length;if(i<2)return Math.max(n/25,.1);const t=e.reduce((o,s)=>o+s,0)/i,a=e.reduce((o,s)=>o+(s-t)**2,0)/Math.max(1,i-1),r=Math.sqrt(a);return!Number.isFinite(r)||r<=0?Math.max(n/25,.1):1.06*r*Math.pow(i,-.2)}function Lt(e,n,i){const t=1/(e.length*i*Math.sqrt(2*Math.PI));return n.map(a=>{let r=0;return e.forEach(o=>{const s=(a-o)/i;r+=Math.exp(-.5*s*s)}),[a,t*r]})}function Tt(e,n,i,t,a,r,o){if(e.strokeStyle=o.groupMarkerColor,e.fillStyle=o.groupMarkerColor,e.lineWidth=1.6,o.orientation==="horizontal"){const l=a(t);if(o.groupMarkerStyle==="line"){e.beginPath(),e.moveTo(l,i-o.groupMarkerSize),e.lineTo(l,i+o.groupMarkerSize),e.stroke();return}if(o.groupMarkerStyle==="square"){const d=o.groupMarkerSize;e.fillRect(l-d/2,i-d/2,d,d);return}e.beginPath(),e.arc(l,i,o.groupMarkerSize/2,0,Math.PI*2),e.fill();return}const s=r(t);if(o.groupMarkerStyle==="line"){e.beginPath(),e.moveTo(n-o.groupMarkerSize,s),e.lineTo(n+o.groupMarkerSize,s),e.stroke();return}if(o.groupMarkerStyle==="square"){const l=o.groupMarkerSize;e.fillRect(n-l/2,s-l/2,l,l);return}e.beginPath(),e.arc(n,s,o.groupMarkerSize/2,0,Math.PI*2),e.fill()}function Ii(e,n){const i=new Map;return e&&e.records.forEach(t=>{var s;const a=t[n.numericColumn],r=Number(typeof a=="string"?a.trim():a);if(!Number.isFinite(r))return;const o=n.categoryColumn?String(t[n.categoryColumn]??"(empty)").trim()||"(empty)":n.numericColumn;i.has(o)||i.set(o,[]),(s=i.get(o))==null||s.push(r)}),Ti(Array.from(i.entries()),n.groupOrder,n.topNGroups,Math.max(.5,n.whiskerMultiplier)).map(([t,a])=>({label:t,values:a,summary:$e(a,Math.max(.5,n.whiskerMultiplier))}))}function Ni(e,n,i,t,a,r,o,s,l){const d=Math.max(96,a-28),u=new Map;return n.forEach((f,h)=>{const p=r+h*(i+t),g=Fe(e,f.label,d,l.labelMaxLines),b=g.length*s,k=p+i/2,M=k-b/2+o*.85;e.fillStyle="#334155",e.font=`${o}px ${l.fontFamily}`,g.forEach((w,S)=>e.fillText(w,12,M+S*s)),l.showSampleSizeLabel&&(e.fillStyle="#64748b",e.fillText(`n=${f.summary.n}`,12,M+b+s*.85));const $=p+(i-l.groupThickness)/2;u.set(f.label,{y:k,boxTop:$,lines:g})}),u}function Bi(e,n,i){var E;const t=e.getContext("2d");if(!t)return;const a=Math.max(760,i.chartWidth),r={top:Math.max(24,i.marginTop),right:Math.max(24,i.marginRight),bottom:Math.max(48,i.marginBottom),left:Math.max(160,i.marginLeft)},o=Math.max(10,i.fontSizeLabels),s=Math.round(o*1.2);t.font=`${o}px ${i.fontFamily}`;const l=Ii(n,i),d=Math.max(1,...l.map(T=>Fe(t,T.label,Math.max(96,r.left-28),i.labelMaxLines).length)),u=Math.max(16,i.groupThickness),f=Math.max(4,i.groupGap),h=i.showSampleSizeLabel?s:0,p=Math.max(u,d*s+h),g=Math.max(i.chartMinHeight,r.top+r.bottom+l.length*p+Math.max(0,l.length-1)*f);if(e.width=a,e.height=g,t.clearRect(0,0,a,g),i.transparentBackground||(t.fillStyle=i.backgroundColor,t.fillRect(0,0,a,g)),t.fillStyle="#0f172a",t.font=`600 16px ${i.fontFamily}`,t.fillText(`Distribution (${i.chartType})`,16,22),!l.length){t.fillStyle="#64748b",t.font=`13px ${i.fontFamily}`,t.fillText("No hay suficientes datos numericos para renderizar.",16,52);return}const b=l.flatMap(T=>T.values),k=Math.min(...b),M=Math.max(...b),$=M-k||1,w=((E=i.overallStats)==null?void 0:E.mean)??b.reduce((T,P)=>T+P,0)/b.length,S=r.left,z=a-r.right,C=r.top,x=g-r.bottom,B=z-S;if(Li(t,S,z,C,x,k,M,i),i.orientation==="horizontal"){const T=W=>S+(W-k)/$*B,P=Ni(t,l,p,f,r.left,r.top,o,s,i);l.forEach((W,y)=>{const L=P.get(W.label);if(!L)return;const N=L.y,I=L.boxTop;zi(t,W,T,N,I,u,i,y,l.length)}),nt(t,i,w,S,z,C,x,T,()=>x),et(t,i,S,z,C,x),tt(t,i,S,z,C,x),it(t,i,S,z,C,x);return}Fi(t,l,a,g,r,o,s,u,i,k,$),nt(t,i,w,S,z,C,x,()=>S,T=>C+(x-C)-(T-k)/$*(x-C)),et(t,i,S,z,C,x),tt(t,i,S,z,C,x),it(t,i,S,z,C,x)}function zi(e,n,i,t,a,r,o,s,l){const d=n.summary,u=wt(o,s,l),f=i(d.min),h=i(d.q1),p=i(d.median),g=i(d.q3),b=i(d.max);if(o.chartType==="violin"||o.chartType==="boxviolin"||o.chartType==="raincloud"){const k=Math.max(40,o.violinSteps??70),M=Et(n.values,d.max-d.min||1)*Math.max(.4,o.violinBandwidthFactor??1),$=Array.from({length:k},(E,T)=>d.min+(d.max-d.min||1)*T/Math.max(1,k-1)),w=Lt(n.values,$,M),S=Math.max(...w.map(E=>E[1]),1e-4),z=Math.max(8,r/2-2),C=o.chartType==="raincloud"?Math.max(4,o.raincloudOffset??6):0,x=o.chartType==="raincloud"?t-z*.55-C:t,B=w.map(([E,T])=>({x:i(E),y:x-T/S*z})),R=w.slice().reverse().map(([E,T])=>({x:i(E),y:x+T/S*z}));e.beginPath(),e.moveTo(B[0].x,B[0].y),B.slice(1).forEach(E=>e.lineTo(E.x,E.y)),R.forEach(E=>e.lineTo(E.x,E.y)),e.closePath(),e.fillStyle=u.fill,e.globalAlpha=Math.min(.9,Math.max(.15,o.violinOpacity??.55)),e.fill(),e.globalAlpha=1,e.strokeStyle=u.stroke,e.lineWidth=1.4,e.stroke()}if(o.chartType==="boxplot"||o.chartType==="boxviolin"||o.chartType==="raincloud"){const k=o.chartType==="raincloud"?Math.max(10,r*Math.max(.2,Math.min(.8,o.raincloudBoxHeightRatio??.35))):r,M=o.chartType==="raincloud"?t+Math.max(3,r*.1):a;e.strokeStyle="#334155",e.lineWidth=1.6,e.beginPath(),e.moveTo(f,t),e.lineTo(h,t),e.moveTo(g,t),e.lineTo(b,t),e.stroke(),e.fillStyle=u.fillSoft,e.fillRect(h,M+4,Math.max(1,g-h),Math.max(4,k-8)),e.strokeStyle=u.stroke,e.strokeRect(h,M+4,Math.max(1,g-h),Math.max(4,k-8)),e.strokeStyle="#0f172a",e.beginPath(),e.moveTo(p,M+4),e.lineTo(p,M+Math.max(4,k-4)),e.stroke()}if(o.chartType==="errorbar"){const k=xt(n.values,d,o.errorMetric??"sd",o.errorCiLevel??95),M=i(k.mean),$=i(k.lower),w=i(k.upper);e.strokeStyle="#334155",e.lineWidth=1.8,e.beginPath(),e.moveTo($,t),e.lineTo(w,t),e.stroke(),e.beginPath(),e.moveTo($,t-8),e.lineTo($,t+8),e.moveTo(w,t-8),e.lineTo(w,t+8),e.stroke(),e.fillStyle=u.accent,e.beginPath(),e.arc(M,t,Math.max(4,r*.14),0,Math.PI*2),e.fill()}if(o.showOutliers&&(o.chartType==="boxplot"||o.chartType==="boxviolin"||o.chartType==="violin"||o.chartType==="raincloud")&&(e.fillStyle=u.stroke,d.outliers.forEach(k=>{e.beginPath(),e.arc(i(k),t,o.outlierSize,0,Math.PI*2),e.fill()})),o.showJitter&&(o.chartType==="violin"||o.chartType==="boxviolin"||o.chartType==="raincloud")){e.fillStyle=o.outlierColor,e.globalAlpha=Math.min(1,Math.max(.05,o.jitterAlpha));const k=o.chartType==="raincloud"?t+r*.28:t;n.values.forEach(M=>{const $=(Math.random()-.5)*(r-8);e.beginPath(),e.arc(i(M),k+$,o.jitterSize,0,Math.PI*2),e.fill()}),e.globalAlpha=1}if(o.showGroupMarker&&o.chartType!=="errorbar"){const k=o.groupMetric==="mean"?d.mean:d.median;Tt(e,p,t,k,i,()=>t,o)}}function Fi(e,n,i,t,a,r,o,s,l,d,u){const f=a.left,h=i-a.right,p=Math.max(24,(h-f)/n.length),g=Math.max(48,p-10),k=Math.max(1,...n.map(S=>Fe(e,S.label,g,l.labelMaxLines).length))*o+(l.showSampleSizeLabel?o:0)+16,M=t-Math.max(a.bottom,k),$=M-a.top,w=S=>a.top+$-(S-d)/u*$;n.forEach((S,z)=>{const C=wt(l,z,n.length),x=f+p*z+p/2,B=Fe(e,S.label,g,l.labelMaxLines);e.fillStyle="#334155",e.font=`${r}px ${l.fontFamily}`,e.textAlign="center",B.forEach((T,P)=>e.fillText(T,x,M+r+P*o)),l.showSampleSizeLabel&&(e.fillStyle="#64748b",e.fillText(`n=${S.summary.n}`,x,M+r+B.length*o+r*.8));const R=Math.min(p*.56,s),E=S.summary;if(l.chartType==="errorbar"){const T=xt(S.values,E,l.errorMetric??"sd",l.errorCiLevel??95),P=w(T.mean),W=w(T.lower),y=w(T.upper);e.strokeStyle="#334155",e.lineWidth=1.8,e.beginPath(),e.moveTo(x,W),e.lineTo(x,y),e.stroke(),e.beginPath(),e.moveTo(x-8,W),e.lineTo(x+8,W),e.moveTo(x-8,y),e.lineTo(x+8,y),e.stroke(),e.fillStyle=C.accent,e.beginPath(),e.arc(x,P,Math.max(4,R*.14),0,Math.PI*2),e.fill()}else{const T=w(E.min),P=w(E.q1),W=w(E.median),y=w(E.q3),L=w(E.max);if(l.chartType==="violin"||l.chartType==="boxviolin"||l.chartType==="raincloud"){const N=Math.max(40,l.violinSteps??70),I=Et(S.values,E.max-E.min||1)*Math.max(.4,l.violinBandwidthFactor??1),A=Array.from({length:N},(V,U)=>E.min+(E.max-E.min||1)*U/Math.max(1,N-1)),_=Lt(S.values,A,I),H=Math.max(..._.map(V=>V[1]),1e-4),j=Math.max(8,R/2),q=l.chartType==="raincloud"?Math.max(6,l.raincloudOffset??8):0,O=l.chartType==="raincloud"?x-j*.55-q:x,Y=_.map(([V,U])=>({x:O-U/H*j,y:w(V)})),X=_.slice().reverse().map(([V,U])=>({x:O+U/H*j,y:w(V)}));e.beginPath(),e.moveTo(Y[0].x,Y[0].y),Y.slice(1).forEach(V=>e.lineTo(V.x,V.y)),X.forEach(V=>e.lineTo(V.x,V.y)),e.closePath(),e.fillStyle=C.fill,e.globalAlpha=Math.min(.9,Math.max(.15,l.violinOpacity??.55)),e.fill(),e.globalAlpha=1,e.strokeStyle=C.stroke,e.lineWidth=1.4,e.stroke()}if(l.chartType==="boxplot"||l.chartType==="boxviolin"||l.chartType==="raincloud"){const N=l.chartType==="raincloud"?Math.max(8,R*.65):0,I=l.chartType==="raincloud"?x+N:x,A=l.chartType==="raincloud"?Math.max(10,R*Math.max(.2,Math.min(.8,l.raincloudBoxHeightRatio??.35))):R;e.strokeStyle="#334155",e.lineWidth=1.6,e.beginPath(),e.moveTo(I,T),e.lineTo(I,y),e.moveTo(I,P),e.lineTo(I,L),e.stroke(),e.fillStyle=C.fillSoft,e.fillRect(I-A/2,y,A,Math.max(1,P-y)),e.strokeStyle=C.stroke,e.strokeRect(I-A/2,y,A,Math.max(1,P-y)),e.strokeStyle="#0f172a",e.beginPath(),e.moveTo(I-A/2,W),e.lineTo(I+A/2,W),e.stroke()}if(l.showOutliers&&(l.chartType==="boxplot"||l.chartType==="boxviolin"||l.chartType==="violin"||l.chartType==="raincloud")&&(e.fillStyle=l.outlierColor,E.outliers.forEach(N=>{e.beginPath(),e.arc(x,w(N),l.outlierSize,0,Math.PI*2),e.fill()})),l.showJitter&&(l.chartType==="violin"||l.chartType==="boxviolin"||l.chartType==="raincloud")){e.fillStyle=C.stroke,e.globalAlpha=Math.min(1,Math.max(.05,l.jitterAlpha));const N=l.chartType==="raincloud"?x+R*.32:x;S.values.forEach(I=>{const A=(Math.random()-.5)*Math.max(8,R-6);e.beginPath(),e.arc(N+A,w(I),l.jitterSize,0,Math.PI*2),e.fill()}),e.globalAlpha=1}if(l.showGroupMarker){const N=l.groupMetric==="mean"?E.mean:E.median;Tt(e,x,W,N,()=>x,w,l)}}}),e.textAlign="start"}function Re(e,n,i){const t=new Blob([e],{type:i}),a=URL.createObjectURL(t),r=document.createElement("a");r.href=a,r.download=n,r.click(),URL.revokeObjectURL(a)}function Ve(e,n){const i=Math.max(1,Math.min(4,n));if(i===1)return e;const t=document.createElement("canvas");t.width=Math.max(1,Math.round(e.width*i)),t.height=Math.max(1,Math.round(e.height*i));const a=t.getContext("2d");return a?(a.imageSmoothingEnabled=!0,a.imageSmoothingQuality="high",a.drawImage(e,0,0,t.width,t.height),t):e}function Ai(e,n,i){const a=Ve(e,i).toDataURL("image/png"),r=document.createElement("a");r.href=a,r.download=n,r.click()}function Pi(e,n,i){const t=Ve(e,i),a=t.toDataURL("image/png"),r=`
    <svg xmlns="http://www.w3.org/2000/svg" width="${t.width}" height="${t.height}" viewBox="0 0 ${t.width} ${t.height}">
      <image href="${a}" width="${t.width}" height="${t.height}" />
    </svg>
  `.trim();Re(r,n,"image/svg+xml;charset=utf-8")}function Di(e,n,i){const a=Ve(e,i).toDataURL("image/png"),r=window.open("","_blank","noopener,noreferrer,width=1200,height=900");r&&(r.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${n}</title>
        <style>
          html, body { margin: 0; padding: 0; background: #ffffff; }
          body { display: grid; place-items: center; min-height: 100vh; }
          img { max-width: 100vw; max-height: 100vh; display: block; }
          @page { size: auto; margin: 12mm; }
        </style>
      </head>
      <body>
        <img src="${a}" alt="${n}">
        <script>
          window.onload = () => {
            setTimeout(() => window.print(), 60);
          };
          window.onafterprint = () => window.close();
        <\/script>
      </body>
    </html>
  `),r.document.close())}function ot(e){return e==="png"||e==="svg"||e==="pdf"}function rt(e){return e===1||e===2||e===3||e===4}function It({canvasId:e,triggerButtonId:n,filenamePrefix:i,formatSelectId:t,scaleSelectId:a,toolbarExportButtonId:r,getFallbackFormat:o,getFallbackScale:s,setFormat:l,setScale:d}){const u=document.getElementById(n),f=r?document.getElementById(r):null,h=t?document.getElementById(t):null,p=a?document.getElementById(a):null;h==null||h.addEventListener("change",()=>{ot(h.value)&&l(h.value)}),p==null||p.addEventListener("change",()=>{const g=Number(p.value);rt(g)&&d(g)}),u==null||u.addEventListener("click",()=>{const g=document.getElementById(e);if(!g)return;const b=(h==null?void 0:h.value)??o(),k=Number((p==null?void 0:p.value)??s()),M=ot(b)?b:o(),$=rt(k)?k:s(),w=Date.now();if(M==="svg"){Pi(g,`${i}-${w}.svg`,$);return}if(M==="pdf"){Di(g,`${i}-${w}.pdf`,$);return}Ai(g,`${i}-${w}.png`,$)}),f==null||f.addEventListener("click",()=>{u==null||u.click()})}function Nt({stageId:e,zoomInButtonId:n,zoomOutButtonId:i,zoomResetButtonId:t,fullscreenButtonId:a,getZoom:r,setZoom:o,setFullscreenEnabled:s}){const l=document.getElementById(n),d=document.getElementById(i),u=document.getElementById(t),f=document.getElementById(a);l==null||l.addEventListener("click",()=>{const h=r();o(Math.min(2.4,Number((h+.1).toFixed(2))))}),d==null||d.addEventListener("click",()=>{const h=r();o(Math.max(.5,Number((h-.1).toFixed(2))))}),u==null||u.addEventListener("click",()=>{o(1)}),f==null||f.addEventListener("click",async()=>{const h=document.getElementById(e);if(h){if(document.fullscreenElement){await document.exitFullscreen(),s==null||s(!1);return}await h.requestFullscreen(),s==null||s(!0)}})}function Wi(){return[{respondent:"1",q1:5,q2:4,q3:5},{respondent:"2",q1:4,q2:4,q3:3},{respondent:"3",q1:3,q2:5,q3:4}]}function K(){const e=c.getState();return e.activeDatasetId?e.datasets[e.activeDatasetId]:null}function Gi(){const e=c.getState(),n=e.config.likert.comparisonPreDatasetId,i=e.config.likert.comparisonPostDatasetId;if(!n||!i)return null;const t=e.datasets[n],a=e.datasets[i];if(!t||!a)return null;const r=t.records[0]?Object.keys(t.records[0]):[],o=a.records[0]?Object.keys(a.records[0]):[],s=r.filter(u=>o.includes(u)).filter(u=>{const f=h=>h.some(p=>{const g=p[u],b=Number(typeof g=="string"?g.trim():g);return Number.isFinite(b)});return f(t.records)||f(a.records)});if(!s.length)return null;const l=Math.max(t.records.length,a.records.length),d=[];for(let u=0;u<l;u+=1){const f={};s.forEach(h=>{var p,g;f[`${h} [Pre]`]=((p=t.records[u])==null?void 0:p[h])??null,f[`${h} [Post]`]=((g=a.records[u])==null?void 0:g[h])??null}),d.push(f)}return{id:`cmp_${t.id}_${a.id}`,name:`${t.name} vs ${a.name}`,records:d,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}function Ri(){const e=c.getState(),n=document.getElementById("module-root");if(n)switch(e.activeModule){case"likert":ei(n,e);break;case"distribution":hi(n,e);break;case"processor":default:Kt(n,e);break}}function Oi(){const e=document.getElementById("lang-select"),n=document.getElementById("dataset-select"),i=document.getElementById("btn-create-sample"),t=document.getElementById("btn-reset");e==null||e.addEventListener("change",a=>{const r=a.target;(r.value==="es"||r.value==="en")&&c.setLanguage(r.value)}),n==null||n.addEventListener("change",a=>{const r=a.target;c.setActiveDataset(r.value||null)}),i==null||i.addEventListener("click",()=>{c.addDataset(`sample-${Date.now()}`,Wi())}),t==null||t.addEventListener("click",()=>{c.hardReset()})}function D(e,n=!1){const i=document.getElementById("processor-status");i&&(i.textContent=e,i.style.color=n?"#b91c1c":"#0f766e")}function ji(e,n,i){return e.toLowerCase().endsWith(".json")||i==="json"||n==="json"?"json":"csv"}function Vi(e){return e==="google_forms"?"Google Forms":e==="ms_forms"?"MS Forms":e==="generic"?"CSV generico":e==="json"?"JSON":"Auto"}function _i(e){return e===","?"coma":e===";"?"punto y coma":e==="	"?"tab":e==="|"?"barra":"auto"}async function Hi(e){var i;const n=(i=e.files)==null?void 0:i[0];return n?await n.text():""}function Ge(e){return e?Array.from(e.selectedOptions).map(n=>n.value).filter(Boolean):[]}function Bt(e){return e==="blue_orange"||e==="red_green"||e==="purple_yellow"||e==="spectral"||e==="viridis"||e==="warm"||e==="cool"||e==="earth"}function qi(e){return e.map(n=>{const i={};return Object.entries(n).forEach(([t,a])=>{if(typeof a=="string"){const r=a.trim();i[t]=r===""?null:r}else i[t]=a}),i})}function Ji(e){return e.filter(n=>Object.values(n).every(i=>i!==null&&i!==""))}function Xi(e){const n=new Set;return e.filter(i=>{const t=JSON.stringify(i);return n.has(t)?!1:(n.add(t),!0)})}function Ui(e,n){const i={"strongly disagree":1,disagree:2,neutral:3,agree:4,"strongly agree":5,"muy en desacuerdo":1,"en desacuerdo":2,"de acuerdo":4,"muy de acuerdo":5};return e.map(t=>{const a={...t};return n.forEach(r=>{const o=t[r];if(typeof o!="string")return;const s=o.trim().toLowerCase();s in i&&(a[r]=i[s])}),a})}function Yi(e,n,i,t){return e.map(a=>{const r={...a};return n.forEach(o=>{const s=a[o],l=Number(typeof s=="string"?s.trim():s);if(!Number.isFinite(l))return;const d=e.map(p=>typeof p[o]=="string"?Number(p[o].trim()):Number(p[o])).filter(p=>Number.isFinite(p)),u=Math.min(...d),f=Math.max(...d);if(f===u)return;const h=i+(l-u)/(f-u)*(t-i);r[o]=Number(h.toFixed(3))}),r})}function Ki(e,n,i){return i.trim()?e.map(t=>{const a=n.map(o=>{const s=t[o];return Number(typeof s=="string"?s.trim():s)}).filter(o=>Number.isFinite(o)),r={...t};return r[i]=a.length?Number((a.reduce((o,s)=>o+s,0)/a.length).toFixed(3)):null,r}):e}function Qi(e){if(!e.length)return"";const n=Object.keys(e[0]),i=a=>{const r=a==null?"":String(a);return/[",\n;]/.test(r)?`"${r.replace(/"/g,'""')}"`:r},t=[n.join(",")];return e.forEach(a=>{t.push(n.map(r=>i(a[r])).join(","))}),t.join(`
`)}function Zi(e){return e.map(n=>({...n}))}function en(){const e=document.getElementById("processor-dataset-name"),n=document.getElementById("processor-source-type"),i=document.getElementById("processor-format"),t=document.getElementById("processor-delimiter"),a=document.getElementById("processor-file"),r=document.getElementById("processor-input"),o=document.getElementById("processor-import-btn"),s=document.getElementById("processor-clear-btn"),l=document.getElementById("processor-trim-btn"),d=document.getElementById("processor-remove-nulls-btn"),u=document.getElementById("processor-remove-dup-btn");document.getElementById("processor-fill-btn"),document.getElementById("processor-fill-value");const f=document.getElementById("processor-text-cols"),h=document.getElementById("processor-text-likert-btn"),p=document.getElementById("processor-normalize-cols"),g=document.getElementById("processor-normalize-min"),b=document.getElementById("processor-normalize-max"),k=document.getElementById("processor-normalize-btn"),M=document.getElementById("processor-avg-cols"),$=document.getElementById("processor-avg-name"),w=document.getElementById("processor-avg-btn"),S=document.getElementById("processor-storage-name"),z=document.getElementById("processor-storage-save-btn"),C=document.getElementById("processor-storage-select"),x=document.getElementById("processor-storage-load-btn"),B=document.getElementById("processor-storage-delete-btn"),R=document.getElementById("processor-export-csv-btn"),E=document.getElementById("processor-export-json-btn"),T=document.getElementById("processor-preview-rows"),P=document.getElementById("processor-view-table"),W=document.getElementById("processor-view-json");n==null||n.addEventListener("change",()=>{const y=n.value;(y==="auto"||y==="google_forms"||y==="ms_forms"||y==="generic"||y==="json")&&(c.updateConfigSection("processor",{sourceType:y}),y==="json"&&i&&(i.value="json"))}),i==null||i.addEventListener("change",()=>{if(t){if(i.value==="json"){t.disabled=!0;return}t.disabled=!1}}),t==null||t.addEventListener("change",()=>{const y=t.value;(y==="auto"||y===","||y===";"||y==="	"||y==="|")&&c.updateConfigSection("processor",{csvDelimiterMode:y})}),i&&t&&i.value==="json"&&(t.disabled=!0),o==null||o.addEventListener("click",async()=>{var y,L;if(!(!e||!i||!t||!a||!r))try{const N=e.value.trim()||`dataset-${Date.now()}`,I=r.value.trim(),A=await Hi(a),_=((L=(y=a.files)==null?void 0:y[0])==null?void 0:L.name)??"",H=I||A;if(!H){D("No hay contenido para importar.",!0);return}const j=(n==null?void 0:n.value)??c.getState().config.processor.sourceType,q=ji(_,i.value,j);let O;if(q==="json")O=bi(H);else{let X=t.value;const V=_.toLowerCase();X==="auto"&&(V.endsWith(".tsv")||V.endsWith(".txt"))&&(X="	"),O=gi(H,X)}const Y=c.addDataset(N,O);c.updateConfigSection("global",{activeDatasetId:Y}),D(`Dataset "${N}" importado con ${O.length} filas. Fuente: ${Vi(j)}. Formato: ${q.toUpperCase()}${q==="csv"?` (${_i(t.value)})`:""}.`)}catch(N){const I=N instanceof Error?N.message:"Error desconocido al importar.";D(I,!0)}}),s==null||s.addEventListener("click",()=>{e&&(e.value=""),r&&(r.value=""),a&&(a.value=""),n&&(n.value=c.getState().config.processor.sourceType),t&&(t.value=c.getState().config.processor.csvDelimiterMode,t.disabled=(i==null?void 0:i.value)==="json"),D("Formulario limpio.")}),l==null||l.addEventListener("click",()=>{const y=K();if(!y)return D("No hay dataset activo.",!0);const L=qi(y.records);c.updateDatasetRecords(y.id,L),D("Trim aplicado al dataset activo.")}),d==null||d.addEventListener("click",()=>{const y=K();if(!y)return D("No hay dataset activo.",!0);const L=Ji(y.records);c.updateDatasetRecords(y.id,L),D(`Filas con null removidas. ${y.records.length} -> ${L.length}`)}),u==null||u.addEventListener("click",()=>{const y=K();if(!y)return D("No hay dataset activo.",!0);const L=Xi(y.records);c.updateDatasetRecords(y.id,L),D(`Duplicados removidos. ${y.records.length} -> ${L.length}`)}),h==null||h.addEventListener("click",()=>{const y=K();if(!y)return D("No hay dataset activo.",!0);const L=Ge(f);if(!L.length)return D("Selecciona columnas para conversión Likert.",!0);const N=Ui(y.records,L);c.updateDatasetRecords(y.id,N),D("Conversión texto Likert aplicada.")}),k==null||k.addEventListener("click",()=>{const y=K();if(!y)return D("No hay dataset activo.",!0);const L=Ge(p);if(!L.length)return D("Selecciona columnas para normalizar.",!0);const N=Number((g==null?void 0:g.value)??1),I=Number((b==null?void 0:b.value)??5);if(!Number.isFinite(N)||!Number.isFinite(I)||I<=N)return D("Rango inválido para normalización.",!0);const A=Yi(y.records,L,N,I);c.updateDatasetRecords(y.id,A),D(`Normalización aplicada (${N}-${I}).`)}),w==null||w.addEventListener("click",()=>{var A;const y=K();if(!y)return D("No hay dataset activo.",!0);const L=Ge(M);if(!L.length)return D("Selecciona columnas para promedio.",!0);const N=((A=$==null?void 0:$.value)==null?void 0:A.trim())||"avg_score",I=Ki(y.records,L,N);c.updateDatasetRecords(y.id,I),D(`Promedio calculado en columna '${N}'.`)}),z==null||z.addEventListener("click",()=>{const y=K();if(!y)return D("No hay dataset activo para guardar.",!0);const L=(S==null?void 0:S.value.trim())||`${y.name}-copy`,N=y.id,I=c.addDataset(L,Zi(y.records));c.getState().config.processor.storageAutoActivateOnSave||c.setActiveDataset(N),S&&(S.value=`${L}-copy`);const A=c.getState().activeDatasetId===I;D(`Dataset guardado en storage como "${L}"${A?" y activado.":"."}`)}),x==null||x.addEventListener("click",()=>{if(!(C!=null&&C.value))return D("Selecciona un dataset.",!0);c.setActiveDataset(C.value),D("Dataset activado desde storage.")}),B==null||B.addEventListener("click",()=>{if(!(C!=null&&C.value))return D("Selecciona un dataset.",!0);c.deleteDataset(C.value),D("Dataset eliminado de storage.")}),document.querySelectorAll("[data-storage-activate]").forEach(y=>{y.addEventListener("click",()=>{const L=y.dataset.storageActivate;L&&(c.setActiveDataset(L),D("Dataset activado desde storage."))})}),document.querySelectorAll("[data-storage-delete]").forEach(y=>{y.addEventListener("click",()=>{const L=y.dataset.storageDelete;L&&(c.deleteDataset(L),D("Dataset eliminado de storage."))})}),R==null||R.addEventListener("click",()=>{const y=K();if(!y)return D("No hay dataset activo.",!0);const L=Qi(y.records);Re(L,`${y.name}.csv`,"text/csv;charset=utf-8"),D("CSV exportado.")}),E==null||E.addEventListener("click",()=>{const y=K();if(!y)return D("No hay dataset activo.",!0);const L=JSON.stringify(y.records,null,2);Re(L,`${y.name}.json`,"application/json;charset=utf-8"),D("JSON exportado.")}),P==null||P.addEventListener("click",()=>{c.setProcessorView("table")}),W==null||W.addEventListener("click",()=>{c.setProcessorView("json")}),T==null||T.addEventListener("change",()=>{const y=Number(T.value);Number.isFinite(y)&&c.updateConfigSection("processor",{previewRows:Math.max(1,Math.min(200,Math.round(y)))})})}function tn(){const e=c.getState();if(e.activeModule!=="likert")return;const n=document.getElementById("likert-canvas");if(!n)return;const i=e.config.likert.analysisMode==="comparison"?Gi():K();xi(n,i,{chartType:e.config.likert.chartType,decimalPlaces:e.config.likert.decimalPlaces,showLegend:e.config.likert.showLegend,showValues:e.config.likert.showValues,scalePoints:e.config.likert.scalePoints,scaleLabels:e.config.likert.scalePresetId!=="custom"?ut(e.config.likert.scalePresetId,e.language)??e.config.likert.scaleLabels:e.config.likert.scaleLabels,scaleStart:e.config.likert.scaleStart,valueMode:e.config.likert.valueMode,itemOrder:e.config.likert.itemOrder,paletteId:e.config.sharedChart.paletteId,selectedItems:e.config.likert.selectedItems,showTitle:e.config.sharedChart.showTitle,chartTitle:e.config.sharedChart.chartTitle,fontSizeTitle:e.config.likert.fontSizeTitle,fontSizeValues:e.config.likert.fontSizeValues,watermark:e.config.likert.watermark,legendPosition:e.config.likert.legendPosition,fontFamily:e.config.sharedChart.fontFamily,fontSizeLabels:e.config.sharedChart.labelFontSize,fontSizeLegend:e.config.likert.fontSizeLegend,labelMaxLines:e.config.likert.labelMaxLines,chartWidth:e.config.sharedChart.chartWidth,marginTop:e.config.sharedChart.marginTop,marginBottom:e.config.sharedChart.marginBottom,marginLeft:e.config.sharedChart.marginLeft,marginRight:e.config.sharedChart.marginRight,backgroundColor:e.config.sharedChart.canvasBackground,transparentBackground:e.config.sharedChart.canvasTransparent,showGrid:e.config.sharedChart.showGrid,gridDashed:e.config.sharedChart.gridDashed,gridVertical:e.config.sharedChart.gridVertical,gridHorizontal:e.config.sharedChart.gridHorizontal,showGridBorder:e.config.sharedChart.showGridBorder,gridColor:e.config.sharedChart.gridColor,gridWidth:e.config.sharedChart.lineWidth,axisColor:e.config.sharedChart.axisColor,axisWidth:e.config.sharedChart.axisWidth,showAxisLabels:e.config.sharedChart.showAxisLabels,neutralIndex:e.config.likertChartType.diverging.neutralIndex,centerLineColor:e.config.likertChartType.diverging.centerLineColor,centerLineWidth:e.config.likertChartType.diverging.centerLineWidth,barHeight:e.config.likertChartType.stacked.barHeight,barSpacing:e.config.likertChartType.stacked.barSpacing,showBarBorders:e.config.likertChartType.stacked.showBarBorders,barBorderColor:e.config.likertChartType.stacked.barBorderColor,barBorderWidth:e.config.likertChartType.stacked.barBorderWidth})}function nn(){const e=document.getElementById("likert-show-legend"),n=document.getElementById("likert-show-values"),i=document.getElementById("likert-decimals"),t=document.getElementById("shared-palette"),a=document.getElementById("likert-scale-preset"),r=document.getElementById("likert-scale-points"),o=document.getElementById("likert-scale-start"),s=document.getElementById("likert-scale-labels"),l=document.getElementById("likert-analysis-mode"),d=document.getElementById("likert-chart-type"),u=document.getElementById("likert-comparison-pre"),f=document.getElementById("likert-comparison-post"),h=document.getElementById("likert-neutral-index"),p=document.getElementById("likert-value-mode"),g=document.getElementById("likert-item-order"),b=document.getElementById("likert-selected-items"),k=document.getElementById("shared-chart-title"),M=document.getElementById("shared-show-title"),$=document.getElementById("likert-watermark"),w=document.getElementById("likert-font-title"),S=document.getElementById("likert-font-values");document.getElementById("likert-export-format"),document.getElementById("likert-export-scale");const z=document.getElementById("likert-select-all-items"),C=document.getElementById("likert-deselect-all-items"),x=document.getElementById("likert-grid-dashed"),B=document.getElementById("likert-grid-vertical"),R=document.getElementById("likert-grid-horizontal"),E=document.getElementById("likert-show-grid-border"),T=document.getElementById("likert-legend-position"),P=document.getElementById("likert-show-legend-style"),W=document.getElementById("likert-bg-color"),y=document.getElementById("likert-transparent-bg"),L=document.getElementById("likert-grid-color"),N=document.getElementById("likert-axis-color"),I=document.getElementById("likert-center-line-color"),A=document.getElementById("likert-font-family"),_=document.getElementById("likert-font-labels"),H=document.getElementById("likert-font-legend"),j=document.getElementById("likert-label-max-lines"),q=document.getElementById("likert-bar-height"),O=document.getElementById("likert-bar-spacing"),Y=document.getElementById("likert-show-bar-borders"),X=document.getElementById("likert-bar-border-width"),V=document.getElementById("likert-bar-border-color"),U=document.getElementById("likert-show-grid"),Q=document.getElementById("likert-grid-width"),Z=document.getElementById("likert-show-axis-labels"),ee=document.getElementById("likert-axis-width"),te=document.getElementById("likert-center-line-width"),ie=document.getElementById("likert-margin-top"),ne=document.getElementById("likert-margin-bottom"),ae=document.getElementById("likert-margin-left"),oe=document.getElementById("likert-margin-right"),re=document.getElementById("likert-chart-width");document.querySelectorAll("[data-likert-layout-tab]").forEach(v=>{v.addEventListener("click",()=>{const G=v.dataset.likertLayoutTab;G&&(G==="layout-colors"||G==="layout-typography"||G==="layout-bars"||G==="layout-legend"||G==="layout-axes-grid"||G==="layout-canvas")&&c.setLikertStyleTab(G)})}),e==null||e.addEventListener("change",()=>{c.updateConfigSection("likert",{showLegend:e.checked})}),n==null||n.addEventListener("change",()=>{c.updateConfigSection("likert",{showValues:n.checked})}),i==null||i.addEventListener("change",()=>{const v=Number(i.value);if(!Number.isFinite(v))return;const G=Math.max(0,Math.min(3,v));c.updateConfigSection("likert",{decimalPlaces:G})}),a==null||a.addEventListener("change",()=>{if(a.value==="custom"){c.updateConfigSection("likert",{scalePresetId:"custom"});return}const v=Oe(a.value);v&&(c.updateConfigSection("likert",{scalePresetId:v.id,scalePoints:v.points,scaleStart:v.start,scaleLabels:v.labels[c.getState().language],selectedItems:[]}),c.updateConfigSection("likertChartType",{diverging:{...c.getState().config.likertChartType.diverging,neutralIndex:Math.ceil(v.points/2)}}))}),r==null||r.addEventListener("change",()=>{const v=Number(r.value);if(!Number.isFinite(v))return;const G=Math.max(2,Math.min(10,Math.round(v))),le=Array.from({length:G},(ue,de)=>String(c.getState().config.likert.scaleStart+de));c.updateConfigSection("likert",{scalePresetId:"custom",scalePoints:G,scaleLabels:le})}),o==null||o.addEventListener("change",()=>{const v=Number(o.value);if(!Number.isFinite(v))return;const G=Math.max(0,Math.min(10,Math.round(v))),le=Array.from({length:c.getState().config.likert.scalePoints},(ue,de)=>String(G+de));c.updateConfigSection("likert",{scalePresetId:"custom",scaleStart:G,scaleLabels:le})}),s==null||s.addEventListener("change",()=>{const v=s.value.split(/\r?\n/).map(G=>G.trim()).filter(Boolean);v.length&&c.updateConfigSection("likert",{scalePresetId:"custom",scaleLabels:v,scalePoints:v.length})}),l==null||l.addEventListener("change",()=>{const v=l.value;(v==="standard"||v==="comparison")&&c.updateConfigSection("likert",{analysisMode:v,selectedItems:[]})}),d==null||d.addEventListener("change",()=>{const v=d.value;(v==="stacked"||v==="diverging"||v==="split"||v==="distribution")&&c.updateConfigSection("likert",{chartType:v})}),h==null||h.addEventListener("change",()=>{const v=Number(h.value);Number.isFinite(v)&&c.updateConfigSection("likertChartType",{diverging:{...c.getState().config.likertChartType.diverging,neutralIndex:Math.max(1,Math.min(c.getState().config.likert.scalePoints,Math.round(v)))}})}),u==null||u.addEventListener("change",()=>{c.updateConfigSection("likert",{comparisonPreDatasetId:u.value||null,selectedItems:[]})}),f==null||f.addEventListener("change",()=>{c.updateConfigSection("likert",{comparisonPostDatasetId:f.value||null,selectedItems:[]})}),p==null||p.addEventListener("change",()=>{(p.value==="percentage"||p.value==="count")&&c.updateConfigSection("likert",{valueMode:p.value})}),g==null||g.addEventListener("change",()=>{["original","mean_desc","mean_asc","label_asc"].includes(g.value)&&c.updateConfigSection("likert",{itemOrder:g.value})}),t==null||t.addEventListener("change",()=>{const v=t.value;Bt(v)&&c.updateConfigSection("sharedChart",{paletteId:v})}),b==null||b.addEventListener("change",()=>{const v=Array.from(b.selectedOptions).map(G=>G.value);c.updateConfigSection("likert",{selectedItems:v})}),z==null||z.addEventListener("click",()=>{if(!b)return;Array.from(b.options).forEach(G=>{G.selected=!0});const v=Array.from(b.selectedOptions).map(G=>G.value);c.updateConfigSection("likert",{selectedItems:v})}),C==null||C.addEventListener("click",()=>{b&&(Array.from(b.options).forEach(v=>{v.selected=!1}),c.updateConfigSection("likert",{selectedItems:[]}))}),k==null||k.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{chartTitle:k.value.trim()})}),M==null||M.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{showTitle:M.checked})}),$==null||$.addEventListener("change",()=>{c.updateConfigSection("likert",{watermark:$.value.trim()})}),w==null||w.addEventListener("change",()=>{const v=Number(w.value);Number.isFinite(v)&&c.updateConfigSection("likert",{fontSizeTitle:Math.max(10,Math.min(42,Math.round(v)))})}),S==null||S.addEventListener("change",()=>{const v=Number(S.value);Number.isFinite(v)&&c.updateConfigSection("likert",{fontSizeValues:Math.max(8,Math.min(24,Math.round(v)))})}),A==null||A.addEventListener("change",()=>{const v=A.value;(v==="Segoe UI, sans-serif"||v==="Arial, sans-serif"||v==="Verdana, sans-serif"||v==="Georgia, serif")&&c.updateConfigSection("sharedChart",{fontFamily:v})}),_==null||_.addEventListener("change",()=>{const v=Number(_.value);Number.isFinite(v)&&c.updateConfigSection("sharedChart",{labelFontSize:Math.max(8,Math.min(32,Math.round(v)))})}),H==null||H.addEventListener("change",()=>{const v=Number(H.value);Number.isFinite(v)&&c.updateConfigSection("likert",{fontSizeLegend:Math.max(8,Math.min(32,Math.round(v)))})}),j==null||j.addEventListener("change",()=>{const v=Number(j.value);Number.isFinite(v)&&c.updateConfigSection("likert",{labelMaxLines:Math.max(1,Math.min(3,Math.round(v)))})}),T==null||T.addEventListener("change",()=>{(T.value==="right"||T.value==="bottom"||T.value==="top"||T.value==="left")&&c.updateConfigSection("likert",{legendPosition:T.value})}),P==null||P.addEventListener("change",()=>{c.updateConfigSection("likert",{showLegend:P.checked})}),W==null||W.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{canvasBackground:W.value})}),y==null||y.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{canvasTransparent:y.checked})}),L==null||L.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{gridColor:L.value})}),N==null||N.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{axisColor:N.value})}),I==null||I.addEventListener("change",()=>{c.updateConfigSection("likertChartType",{diverging:{...c.getState().config.likertChartType.diverging,centerLineColor:I.value}})}),x==null||x.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{gridDashed:x.checked})}),B==null||B.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{gridVertical:B.checked,showGrid:B.checked||c.getState().config.sharedChart.showGrid})}),R==null||R.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{gridHorizontal:R.checked,showGrid:R.checked||c.getState().config.sharedChart.showGrid})}),E==null||E.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{showGridBorder:E.checked})}),q==null||q.addEventListener("change",()=>{const v=Number(q.value);Number.isFinite(v)&&c.updateConfigSection("likertChartType",{stacked:{...c.getState().config.likertChartType.stacked,barHeight:Math.max(20,Math.min(100,Math.round(v)))}})}),O==null||O.addEventListener("change",()=>{const v=Number(O.value);Number.isFinite(v)&&c.updateConfigSection("likertChartType",{stacked:{...c.getState().config.likertChartType.stacked,barSpacing:Math.max(0,Math.min(50,Math.round(v)))}})}),Y==null||Y.addEventListener("change",()=>{c.updateConfigSection("likertChartType",{stacked:{...c.getState().config.likertChartType.stacked,showBarBorders:Y.checked}})}),X==null||X.addEventListener("change",()=>{const v=Number(X.value);Number.isFinite(v)&&c.updateConfigSection("likertChartType",{stacked:{...c.getState().config.likertChartType.stacked,barBorderWidth:Math.max(1,Math.min(5,Math.round(v)))}})}),V==null||V.addEventListener("change",()=>{c.updateConfigSection("likertChartType",{stacked:{...c.getState().config.likertChartType.stacked,barBorderColor:V.value}})}),U==null||U.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{showGrid:U.checked})}),Q==null||Q.addEventListener("change",()=>{const v=Number(Q.value);Number.isFinite(v)&&c.updateConfigSection("sharedChart",{lineWidth:Math.max(1,Math.min(5,Math.round(v)))})}),Z==null||Z.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{showAxisLabels:Z.checked})}),ee==null||ee.addEventListener("change",()=>{const v=Number(ee.value);Number.isFinite(v)&&c.updateConfigSection("sharedChart",{axisWidth:Math.max(1,Math.min(5,Math.round(v)))})}),te==null||te.addEventListener("change",()=>{const v=Number(te.value);Number.isFinite(v)&&c.updateConfigSection("likertChartType",{diverging:{...c.getState().config.likertChartType.diverging,centerLineWidth:Math.max(1,Math.min(6,Math.round(v)))}})}),ie==null||ie.addEventListener("change",()=>{const v=Number(ie.value);Number.isFinite(v)&&c.updateConfigSection("sharedChart",{marginTop:Math.max(20,Math.min(240,Math.round(v)))})}),ne==null||ne.addEventListener("change",()=>{const v=Number(ne.value);Number.isFinite(v)&&c.updateConfigSection("sharedChart",{marginBottom:Math.max(20,Math.min(260,Math.round(v)))})}),ae==null||ae.addEventListener("change",()=>{const v=Number(ae.value);Number.isFinite(v)&&c.updateConfigSection("sharedChart",{marginLeft:Math.max(80,Math.min(480,Math.round(v)))})}),oe==null||oe.addEventListener("change",()=>{const v=Number(oe.value);Number.isFinite(v)&&c.updateConfigSection("sharedChart",{marginRight:Math.max(20,Math.min(320,Math.round(v)))})}),re==null||re.addEventListener("change",()=>{const v=Number(re.value);Number.isFinite(v)&&c.updateConfigSection("sharedChart",{chartWidth:Math.max(700,Math.min(2200,Math.round(v)))})}),Nt({stageId:"likert-stage",zoomInButtonId:"likert-zoom-in",zoomOutButtonId:"likert-zoom-out",zoomResetButtonId:"likert-zoom-reset",fullscreenButtonId:"likert-fullscreen",getZoom:()=>c.getState().config.likert.zoomLevel,setZoom:v=>c.updateConfigSection("likert",{zoomLevel:v})}),It({canvasId:"likert-canvas",triggerButtonId:"likert-export-png-btn",filenamePrefix:"likert",formatSelectId:"likert-export-format",scaleSelectId:"likert-export-scale",getFallbackFormat:()=>c.getState().config.sharedExport.format,getFallbackScale:()=>c.getState().config.sharedExport.scale,setFormat:v=>c.updateConfigSection("sharedExport",{format:v}),setScale:v=>c.updateConfigSection("sharedExport",{scale:v})}),tn()}function an(e){var i;if(!((i=e==null?void 0:e.records)!=null&&i.length))return"";const n=Object.keys(e.records[0]);for(const t of n)for(const a of e.records){const r=a[t],o=Number(typeof r=="string"?r.trim():r);if(Number.isFinite(o))return t}return""}function on(){const e=c.getState();if(e.activeModule!=="distribution")return;const n=document.getElementById("distribution-canvas");if(!n)return;const i=K(),t=an(i),r=e.config.distribution.chartType==="boxviolin"?e.config.distributionChartType.boxviolin:e.config.distributionChartType.violin,o=e.config.distribution.numericColumns[0]||t,s=yt(i,o,e.config.distribution.categoryColumn||"",e.config.distribution.groupOrder,e.config.distribution.topNGroups,e.config.distributionChartType.boxplot.whiskerMultiplier),l=kt(s),d=e.config.distribution.showHypothesisPanel?$t(s,e.config.distribution.hypothesisMode):null;Bi(n,i,{chartType:e.config.distribution.chartType,paletteId:e.config.sharedChart.paletteId,numericColumn:o,categoryColumn:e.config.distribution.categoryColumn||"",chartWidth:e.config.sharedChart.chartWidth,chartMinHeight:e.config.sharedChart.chartMinHeight,marginTop:e.config.sharedChart.marginTop,marginRight:e.config.sharedChart.marginRight,marginLeft:e.config.sharedChart.marginLeft,marginBottom:e.config.sharedChart.marginBottom,fontFamily:e.config.sharedChart.fontFamily,fontSizeLabels:e.config.sharedChart.labelFontSize,backgroundColor:e.config.sharedChart.canvasBackground,transparentBackground:e.config.sharedChart.canvasTransparent,showGrid:e.config.sharedChart.showGrid,gridDashed:e.config.sharedChart.gridDashed,gridVertical:e.config.sharedChart.gridVertical,gridHorizontal:e.config.sharedChart.gridHorizontal,showGridBorder:e.config.sharedChart.showGridBorder,gridColor:e.config.sharedChart.gridColor,gridWidth:e.config.sharedChart.lineWidth,axisColor:e.config.sharedChart.axisColor,axisWidth:e.config.sharedChart.axisWidth,showAxisLabels:e.config.sharedChart.showAxisLabels,labelMaxLines:e.config.distribution.labelMaxLines,showOutliers:e.config.distribution.showOutliers,topNGroups:e.config.distribution.topNGroups,groupOrder:e.config.distribution.groupOrder,orientation:e.config.distribution.orientation,groupThickness:e.config.distribution.groupThickness,groupGap:e.config.distribution.groupGap,whiskerMultiplier:e.config.distributionChartType.boxplot.whiskerMultiplier,showSampleSizeLabel:e.config.distribution.showSampleSizeLabel,showJitter:e.config.distribution.showJitter,jitterSize:e.config.distribution.jitterSize,jitterAlpha:e.config.distribution.jitterAlpha,outlierSize:e.config.distribution.outlierSize,outlierColor:e.config.distribution.outlierColor,showGroupMarker:e.config.distribution.showGroupMarker,groupMetric:e.config.distribution.groupMetric,groupMarkerStyle:e.config.distribution.groupMarkerStyle,groupMarkerColor:e.config.distribution.groupMarkerColor,groupMarkerSize:e.config.distribution.groupMarkerSize,violinBandwidthFactor:r.kdeBandwidthFactor,violinSteps:r.kdeSteps,violinOpacity:r.violinOpacity,raincloudOffset:e.config.distributionChartType.raincloud.cloudOffset,raincloudBoxHeightRatio:e.config.distributionChartType.raincloud.boxHeightRatio,errorMetric:e.config.distributionChartType.errorbar.errorMetric,errorCiLevel:e.config.distributionChartType.errorbar.errorCiLevel,showMeanLine:e.config.sharedAnnotations.showMeanLine,meanLineColor:e.config.sharedAnnotations.meanLineColor,meanLineWidth:e.config.sharedAnnotations.meanLineWidth,meanLineDash:e.config.sharedAnnotations.meanLineDash,meanLineGap:e.config.sharedAnnotations.meanLineGap,showMeanLabel:e.config.sharedAnnotations.showMeanLabel,showStatsPanel:e.config.sharedAnnotations.showStatsPanel,statsFields:e.config.sharedAnnotations.statsFields,statsPosition:e.config.sharedAnnotations.statsPosition,annotationText:e.config.sharedAnnotations.annotationText,annotationX:e.config.sharedAnnotations.annotationX,annotationY:e.config.sharedAnnotations.annotationY,annotationColor:e.config.sharedAnnotations.annotationColor,annotationSize:e.config.sharedAnnotations.annotationSize,showHypothesisPanel:e.config.distribution.showHypothesisPanel,hypothesisResult:d,overallStats:l})}function rn(){const e=document.getElementById("dist-chart-type"),n=document.getElementById("dist-show-outliers"),i=document.getElementById("dist-show-jitter"),t=document.getElementById("dist-show-sample-size"),a=document.getElementById("dist-top-n"),r=document.getElementById("dist-group-order"),o=document.getElementById("dist-orientation"),s=document.getElementById("dist-hypothesis-mode"),l=document.getElementById("dist-numeric-column"),d=document.getElementById("dist-category-column"),u=document.getElementById("dist-shared-palette"),f=document.getElementById("dist-bg-color"),h=document.getElementById("dist-transparent-bg"),p=document.getElementById("dist-grid-color"),g=document.getElementById("dist-axis-color"),b=document.getElementById("dist-show-grid"),k=document.getElementById("dist-grid-dashed"),M=document.getElementById("dist-grid-vertical"),$=document.getElementById("dist-grid-horizontal"),w=document.getElementById("dist-show-grid-border"),S=document.getElementById("dist-grid-width"),z=document.getElementById("dist-show-axis-labels"),C=document.getElementById("dist-axis-width"),x=document.getElementById("dist-font-family"),B=document.getElementById("dist-font-labels"),R=document.getElementById("dist-label-max-lines"),E=document.getElementById("dist-chart-width"),T=document.getElementById("dist-chart-min-height"),P=document.getElementById("dist-margin-top"),W=document.getElementById("dist-margin-right"),y=document.getElementById("dist-margin-bottom"),L=document.getElementById("dist-margin-left"),N=document.getElementById("dist-group-thickness"),I=document.getElementById("dist-group-gap"),A=document.getElementById("dist-whisker-mult"),_=document.getElementById("dist-kde-bandwidth"),H=document.getElementById("dist-kde-steps"),j=document.getElementById("dist-violin-opacity"),q=document.getElementById("dist-raincloud-offset"),O=document.getElementById("dist-raincloud-box-ratio"),Y=document.querySelectorAll("[data-distribution-layout-tab]"),X=document.getElementById("dist-error-metric"),V=document.getElementById("dist-error-ci-level"),U=document.getElementById("dist-outlier-color"),Q=document.getElementById("dist-outlier-size"),Z=document.getElementById("dist-jitter-size"),ee=document.getElementById("dist-jitter-alpha"),te=document.getElementById("dist-show-marker"),ie=document.getElementById("dist-group-metric"),ne=document.getElementById("dist-marker-style"),ae=document.getElementById("dist-marker-color"),oe=document.getElementById("dist-marker-size"),re=document.getElementById("dist-show-hypothesis-panel"),fe=document.getElementById("dist-show-mean-line"),v=document.getElementById("dist-mean-line-color"),G=document.getElementById("dist-mean-line-width"),le=document.getElementById("dist-mean-line-dash"),ue=document.getElementById("dist-mean-line-gap"),de=document.getElementById("dist-show-mean-label"),xe=document.getElementById("dist-show-stats-panel"),Ee=document.getElementById("dist-stats-position"),he=document.getElementById("dist-stats-show-n"),pe=document.getElementById("dist-stats-show-mean"),me=document.getElementById("dist-stats-show-median"),ge=document.getElementById("dist-stats-show-sd"),be=document.getElementById("dist-stats-show-iqr"),Le=document.getElementById("dist-annotation-text"),Te=document.getElementById("dist-annotation-x"),Ie=document.getElementById("dist-annotation-y"),Ne=document.getElementById("dist-annotation-color"),Be=document.getElementById("dist-annotation-size");document.getElementById("dist-export-format"),document.getElementById("dist-export-scale"),Y.forEach(m=>{m.addEventListener("click",()=>{const J=m.dataset.distributionLayoutTab;J&&(J==="layout-colors"||J==="layout-typography"||J==="layout-marks"||J==="layout-annotations"||J==="layout-axes-grid"||J==="layout-canvas")&&c.setDistributionStyleTab(J)})}),l&&l.value&&c.getState().config.distribution.numericColumns.length===0&&c.updateConfigSection("distribution",{numericColumns:[l.value]}),e==null||e.addEventListener("change",()=>{const m=e.value;(m==="boxplot"||m==="violin"||m==="boxviolin"||m==="raincloud"||m==="errorbar")&&c.updateConfigSection("distribution",{chartType:m})}),n==null||n.addEventListener("change",()=>{c.updateConfigSection("distribution",{showOutliers:n.checked})}),i==null||i.addEventListener("change",()=>{c.updateConfigSection("distribution",{showJitter:i.checked})}),t==null||t.addEventListener("change",()=>{c.updateConfigSection("distribution",{showSampleSizeLabel:t.checked})}),a==null||a.addEventListener("change",()=>{const m=Number(a.value);if(!Number.isFinite(m))return;const J=Math.max(1,Math.min(100,Math.round(m)));c.updateConfigSection("distribution",{topNGroups:J})}),r==null||r.addEventListener("change",()=>{const m=r.value;(m==="original"||m==="alphabetical"||m==="median_desc"||m==="median_asc")&&c.updateConfigSection("distribution",{groupOrder:m})}),o==null||o.addEventListener("change",()=>{(o.value==="horizontal"||o.value==="vertical")&&c.updateConfigSection("distribution",{orientation:o.value})}),s==null||s.addEventListener("change",()=>{const m=s.value;(m==="auto"||m==="parametric"||m==="nonparametric")&&c.updateConfigSection("distribution",{hypothesisMode:m})}),re==null||re.addEventListener("change",()=>{c.updateConfigSection("distribution",{showHypothesisPanel:re.checked})}),l==null||l.addEventListener("change",()=>{c.updateConfigSection("distribution",{numericColumns:l.value?[l.value]:[]})}),d==null||d.addEventListener("change",()=>{c.updateConfigSection("distribution",{categoryColumn:d.value||null})}),u==null||u.addEventListener("change",()=>{const m=u.value;Bt(m)&&c.updateConfigSection("sharedChart",{paletteId:m})}),f==null||f.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{canvasBackground:f.value})}),h==null||h.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{canvasTransparent:h.checked})}),p==null||p.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{gridColor:p.value})}),g==null||g.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{axisColor:g.value})}),b==null||b.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{showGrid:b.checked})}),k==null||k.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{gridDashed:k.checked})}),M==null||M.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{gridVertical:M.checked,showGrid:M.checked||c.getState().config.sharedChart.showGrid})}),$==null||$.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{gridHorizontal:$.checked,showGrid:$.checked||c.getState().config.sharedChart.showGrid})}),w==null||w.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{showGridBorder:w.checked})}),S==null||S.addEventListener("change",()=>{const m=Number(S.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{lineWidth:Math.max(1,Math.min(5,Math.round(m)))})}),z==null||z.addEventListener("change",()=>{c.updateConfigSection("sharedChart",{showAxisLabels:z.checked})}),C==null||C.addEventListener("change",()=>{const m=Number(C.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{axisWidth:Math.max(1,Math.min(5,Math.round(m)))})}),x==null||x.addEventListener("change",()=>{const m=x.value;(m==="Segoe UI, sans-serif"||m==="Arial, sans-serif"||m==="Verdana, sans-serif"||m==="Georgia, serif")&&c.updateConfigSection("sharedChart",{fontFamily:m})}),B==null||B.addEventListener("change",()=>{const m=Number(B.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{labelFontSize:Math.max(8,Math.min(28,Math.round(m)))})}),R==null||R.addEventListener("change",()=>{const m=Number(R.value);Number.isFinite(m)&&c.updateConfigSection("distribution",{labelMaxLines:Math.max(1,Math.min(4,Math.round(m)))})}),E==null||E.addEventListener("change",()=>{const m=Number(E.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{chartWidth:Math.max(700,Math.min(2200,Math.round(m)))})}),T==null||T.addEventListener("change",()=>{const m=Number(T.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{chartMinHeight:Math.max(320,Math.min(2400,Math.round(m)))})}),P==null||P.addEventListener("change",()=>{const m=Number(P.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{marginTop:Math.max(20,Math.min(240,Math.round(m)))})}),W==null||W.addEventListener("change",()=>{const m=Number(W.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{marginRight:Math.max(20,Math.min(260,Math.round(m)))})}),y==null||y.addEventListener("change",()=>{const m=Number(y.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{marginBottom:Math.max(20,Math.min(260,Math.round(m)))})}),L==null||L.addEventListener("change",()=>{const m=Number(L.value);Number.isFinite(m)&&c.updateConfigSection("sharedChart",{marginLeft:Math.max(120,Math.min(480,Math.round(m)))})}),N==null||N.addEventListener("change",()=>{const m=Number(N.value);Number.isFinite(m)&&c.updateConfigSection("distribution",{groupThickness:Math.max(16,Math.min(80,Math.round(m)))})}),I==null||I.addEventListener("change",()=>{const m=Number(I.value);Number.isFinite(m)&&c.updateConfigSection("distribution",{groupGap:Math.max(4,Math.min(80,Math.round(m)))})}),A==null||A.addEventListener("change",()=>{const m=Number(A.value);Number.isFinite(m)&&c.updateConfigSection("distributionChartType",{boxplot:{...c.getState().config.distributionChartType.boxplot,whiskerMultiplier:Math.max(.5,Math.min(5,Number(m.toFixed(1))))}})}),_==null||_.addEventListener("change",()=>{const m=Number(_.value);if(!Number.isFinite(m))return;const J=c.getState().config.distribution.chartType==="boxviolin"?"boxviolin":"violin",ye=c.getState().config.distributionChartType[J];c.updateConfigSection("distributionChartType",{[J]:{...ye,kdeBandwidthFactor:Math.max(.2,Math.min(4,Number(m.toFixed(1))))}})}),H==null||H.addEventListener("change",()=>{const m=Number(H.value);if(!Number.isFinite(m))return;const J=c.getState().config.distribution.chartType==="boxviolin"?"boxviolin":"violin",ye=c.getState().config.distributionChartType[J];c.updateConfigSection("distributionChartType",{[J]:{...ye,kdeSteps:Math.max(30,Math.min(260,Math.round(m)))}})}),j==null||j.addEventListener("change",()=>{const m=Number(j.value);if(!Number.isFinite(m))return;const J=c.getState().config.distribution.chartType==="boxviolin"?"boxviolin":"violin",ye=c.getState().config.distributionChartType[J];c.updateConfigSection("distributionChartType",{[J]:{...ye,violinOpacity:Math.max(.1,Math.min(1,Number(m.toFixed(2))))}})}),q==null||q.addEventListener("change",()=>{const m=Number(q.value);Number.isFinite(m)&&c.updateConfigSection("distributionChartType",{raincloud:{...c.getState().config.distributionChartType.raincloud,cloudOffset:Math.max(2,Math.min(30,Math.round(m)))}})}),O==null||O.addEventListener("change",()=>{const m=Number(O.value);Number.isFinite(m)&&c.updateConfigSection("distributionChartType",{raincloud:{...c.getState().config.distributionChartType.raincloud,boxHeightRatio:Math.max(.2,Math.min(.8,Number(m.toFixed(2))))}})}),X==null||X.addEventListener("change",()=>{const m=X.value;(m==="sd"||m==="se"||m==="ci95"||m==="minmax")&&c.updateConfigSection("distributionChartType",{errorbar:{...c.getState().config.distributionChartType.errorbar,errorMetric:m}})}),V==null||V.addEventListener("change",()=>{const m=Number(V.value);Number.isFinite(m)&&c.updateConfigSection("distributionChartType",{errorbar:{...c.getState().config.distributionChartType.errorbar,errorCiLevel:Math.max(80,Math.min(99,Math.round(m)))}})}),U==null||U.addEventListener("change",()=>{c.updateConfigSection("distribution",{outlierColor:U.value})}),Q==null||Q.addEventListener("change",()=>{const m=Number(Q.value);Number.isFinite(m)&&c.updateConfigSection("distribution",{outlierSize:Math.max(1,Math.min(12,Number(m.toFixed(1))))})}),Z==null||Z.addEventListener("change",()=>{const m=Number(Z.value);Number.isFinite(m)&&c.updateConfigSection("distribution",{jitterSize:Math.max(.6,Math.min(10,Number(m.toFixed(1))))})}),ee==null||ee.addEventListener("change",()=>{const m=Number(ee.value);Number.isFinite(m)&&c.updateConfigSection("distribution",{jitterAlpha:Math.max(.05,Math.min(1,Number(m.toFixed(2))))})}),te==null||te.addEventListener("change",()=>{c.updateConfigSection("distribution",{showGroupMarker:te.checked})}),ie==null||ie.addEventListener("change",()=>{const m=ie.value;(m==="median"||m==="mean")&&c.updateConfigSection("distribution",{groupMetric:m})}),ne==null||ne.addEventListener("change",()=>{const m=ne.value;(m==="point"||m==="square"||m==="line")&&c.updateConfigSection("distribution",{groupMarkerStyle:m})}),ae==null||ae.addEventListener("change",()=>{c.updateConfigSection("distribution",{groupMarkerColor:ae.value})}),oe==null||oe.addEventListener("change",()=>{const m=Number(oe.value);Number.isFinite(m)&&c.updateConfigSection("distribution",{groupMarkerSize:Math.max(2,Math.min(18,Number(m.toFixed(1))))})}),fe==null||fe.addEventListener("change",()=>{c.updateConfigSection("sharedAnnotations",{showMeanLine:fe.checked})}),v==null||v.addEventListener("change",()=>{c.updateConfigSection("sharedAnnotations",{meanLineColor:v.value})}),G==null||G.addEventListener("change",()=>{const m=Number(G.value);Number.isFinite(m)&&c.updateConfigSection("sharedAnnotations",{meanLineWidth:Math.max(1,Math.min(8,Number(m.toFixed(1))))})}),le==null||le.addEventListener("change",()=>{const m=Number(le.value);Number.isFinite(m)&&c.updateConfigSection("sharedAnnotations",{meanLineDash:Math.max(2,Math.min(40,Math.round(m)))})}),ue==null||ue.addEventListener("change",()=>{const m=Number(ue.value);Number.isFinite(m)&&c.updateConfigSection("sharedAnnotations",{meanLineGap:Math.max(2,Math.min(40,Math.round(m)))})}),de==null||de.addEventListener("change",()=>{c.updateConfigSection("sharedAnnotations",{showMeanLabel:de.checked})}),xe==null||xe.addEventListener("change",()=>{c.updateConfigSection("sharedAnnotations",{showStatsPanel:xe.checked})}),Ee==null||Ee.addEventListener("change",()=>{const m=Ee.value;(m==="top_left"||m==="top_right"||m==="bottom_left"||m==="bottom_right")&&c.updateConfigSection("sharedAnnotations",{statsPosition:m})});const ve=()=>{c.updateConfigSection("sharedAnnotations",{statsFields:{n:(he==null?void 0:he.checked)!==!1,mean:(pe==null?void 0:pe.checked)!==!1,median:(me==null?void 0:me.checked)!==!1,sd:(ge==null?void 0:ge.checked)!==!1,iqr:(be==null?void 0:be.checked)!==!1}})};he==null||he.addEventListener("change",ve),pe==null||pe.addEventListener("change",ve),me==null||me.addEventListener("change",ve),ge==null||ge.addEventListener("change",ve),be==null||be.addEventListener("change",ve),Le==null||Le.addEventListener("change",()=>{c.updateConfigSection("sharedAnnotations",{annotationText:Le.value.trim()})}),Te==null||Te.addEventListener("change",()=>{const m=Number(Te.value);Number.isFinite(m)&&c.updateConfigSection("sharedAnnotations",{annotationX:Math.max(0,Math.min(100,Math.round(m)))})}),Ie==null||Ie.addEventListener("change",()=>{const m=Number(Ie.value);Number.isFinite(m)&&c.updateConfigSection("sharedAnnotations",{annotationY:Math.max(0,Math.min(100,Math.round(m)))})}),Ne==null||Ne.addEventListener("change",()=>{c.updateConfigSection("sharedAnnotations",{annotationColor:Ne.value})}),Be==null||Be.addEventListener("change",()=>{const m=Number(Be.value);Number.isFinite(m)&&c.updateConfigSection("sharedAnnotations",{annotationSize:Math.max(10,Math.min(40,Math.round(m)))})}),It({canvasId:"distribution-canvas",triggerButtonId:"dist-export-btn",toolbarExportButtonId:"dist-export",filenamePrefix:"distribution",formatSelectId:"dist-export-format",scaleSelectId:"dist-export-scale",getFallbackFormat:()=>c.getState().config.sharedExport.format,getFallbackScale:()=>c.getState().config.sharedExport.scale,setFormat:m=>c.updateConfigSection("sharedExport",{format:m}),setScale:m=>c.updateConfigSection("sharedExport",{scale:m})}),Nt({stageId:"distribution-stage",zoomInButtonId:"dist-zoom-in",zoomOutButtonId:"dist-zoom-out",zoomResetButtonId:"dist-zoom-reset",fullscreenButtonId:"dist-fullscreen",getZoom:()=>c.getState().config.distribution.zoomLevel,setZoom:m=>c.updateConfigSection("distribution",{zoomLevel:m}),setFullscreenEnabled:m=>c.updateConfigSection("distribution",{fullscreenEnabled:m})}),on()}function sn(){const{activeModule:e}=c.getState();document.querySelectorAll(".workspace-rail [data-module-panel]").forEach(i=>{i.addEventListener("click",()=>{const t=i.dataset.modulePanel;t&&c.setModulePanel(e,t)})})}function ln(){const{activeModule:e}=c.getState();if(sn(),e==="processor"){en();return}if(e==="likert"){nn();return}e==="distribution"&&rn()}function zt(){_t(),Ht(),Oi(),Ri(),ln()}c.subscribe(()=>{zt()});ce.on("app:init",()=>{zt()});ce.emit("app:init",{});
