/* ══════════════════════════════════════════
   DRIPPIE — script/jardines.js
   • Render maestro-detalle de jardines
   • Modal "Agregar jardín" con flujo:
     1. Nombre del jardín + tipo de planta
     2. Seleccionar Drippies disponibles o vincular nuevo
     3. Vincular nuevo: BT scan → WiFi creds → nombre sensor
     4. Confirmación
══════════════════════════════════════════ */

/* ── DATOS ── */
const jardines = [
    {
        id: 0, nombre: "Tomatito", tipo: "Tomate Cherry",
        ubicacion: "Maceta interior — Sala", statusKey: "warn", statusLabel: "Atención",
        salud: 68, saludColor: "#f5a623",
        proximoRiego: "Hoy, 8:00 pm",
        riegos: [
            { title: "Riego automático",  sub: "Ciclo programado completado",   time: "Hoy 7:00 am",       amount: "0.6 L", ok: true  },
            { title: "Riego manual",       sub: "Activado por Juan Pérez",       time: "Ayer 6:30 pm",      amount: "0.4 L", ok: true  },
            { title: "Riego omitido",      sub: "Humedad suficiente detectada",  time: "Ayer 7:00 am",      amount: "—",     ok: false },
        ],
        sensores: {
            humedadSuelo: { valor:78, color:"#5badea", desc:"Nivel óptimo para tomate cherry.", alerta:null },
            humedadAmb:   { valor:62, color:"#9d83ed", desc:"Humedad ambiente dentro del rango.", alerta:null },
            temperatura:  { valor:22, color:"#f5a623", min:15, max:40, desc:"Temperatura ideal.", alerta:null },
            luz:          { valor:14, max:100, bars:[20,35,55,72,85,80,60,45,30,14,8,4], color:"#f5a623", desc:"Luz baja — sensor con 14% de batería.", alerta:"warn" },
            bateria:      { valor:14, color:"#f5a623", desc:"Batería baja. Mueve el módulo a un lugar con luz directa.", alerta:"warn" },
        }
    },
    {
        id: 1, nombre: "Lechuga", tipo: "Lechuga romana",
        ubicacion: "Huerto exterior — Patio norte", statusKey: "crit", statusLabel: "Crítico",
        salud: 28, saludColor: "#f06b6b",
        proximoRiego: "Ahora — urgente",
        riegos: [
            { title: "Riego fallido",      sub: "Sin fuente de agua detectada",  time: "Hoy 7:00 am",       amount: "0 L",   ok: false },
            { title: "Riego automático",   sub: "Ciclo completado",              time: "Ayer 7:00 am",      amount: "1.2 L", ok: true  },
            { title: "Riego automático",   sub: "Ciclo completado",              time: "Hace 2 días 7am",   amount: "1.1 L", ok: true  },
        ],
        sensores: {
            humedadSuelo: { valor:12,  color:"#f06b6b", desc:"¡Humedad crítica! La planta necesita agua urgentemente.", alerta:"crit" },
            humedadAmb:   { valor:55,  color:"#9d83ed", desc:"Humedad ambiente dentro del rango.", alerta:null },
            temperatura:  { valor:19,  color:"#5badea", min:15, max:40, desc:"Temperatura fresca, ideal para lechuga.", alerta:null },
            luz:          { valor:88,  max:100, bars:[40,60,75,88,92,90,85,78,60,44,28,15], color:"#3ecf8e", desc:"Buena exposición solar.", alerta:null },
            bateria:      { valor:82,  color:"#3ecf8e", desc:"Batería en buen estado.", alerta:null },
        }
    },
    {
        id: 2, nombre: "Huerto Sur", tipo: "Chile jalapeño",
        ubicacion: "Huerto exterior — Jardín sur", statusKey: "ok", statusLabel: "Saludable",
        salud: 91, saludColor: "#3ecf8e",
        proximoRiego: "Mañana, 7:00 am",
        riegos: [
            { title: "Riego automático",   sub: "Sin incidencias",               time: "Hoy 7:00 am",       amount: "0.8 L", ok: true  },
            { title: "Riego automático",   sub: "Ciclo completado",              time: "Ayer 7:00 am",      amount: "0.8 L", ok: true  },
            { title: "Riego manual",       sub: "Activado por Juan Pérez",       time: "Hace 2 días 5pm",   amount: "0.3 L", ok: true  },
        ],
        sensores: {
            humedadSuelo: { valor:61, color:"#5badea", desc:"Nivel adecuado.", alerta:null },
            humedadAmb:   { valor:48, color:"#9d83ed", desc:"Humedad normal para exterior.", alerta:null },
            temperatura:  { valor:25, color:"#f5a623", min:15, max:40, desc:"Temperatura cálida, perfecta.", alerta:null },
            luz:          { valor:95, max:100, bars:[55,72,88,95,97,96,92,80,65,48,30,18], color:"#3ecf8e", desc:"Excelente exposición solar.", alerta:null },
            bateria:      { valor:98, color:"#3ecf8e", desc:"Batería completa.", alerta:null },
        }
    }
];

/* Drippies sin jardín asignado (disponibles) */
const drippiesDisponibles = [
    { id: "DRP-004", sn: "DRP-2024-004-B", fw: "v2.4.0", bateria: 76, señal: null, nombre: "Sin nombre" },
    { id: "DRP-005", sn: "DRP-2024-005-C", fw: "v2.4.0", bateria: 91, señal: null, nombre: "Sin nombre" },
];

/* ── TIPOS DE PLANTA ── */
const tiposPlanta = [
    "Tomate Cherry","Lechuga romana","Chile jalapeño","Albahaca","Menta",
    "Cilantro","Pepino","Zanahoria","Espinaca","Fresa","Pimiento","Otro"
];

/* ── ESTADO GLOBAL ── */
let activeIdx = 0;
let modalStep = 1;
let nuevoJardin = { nombre:"", tipo:"", drippies:[], wifi:{ ssid:"", pass:"" } };
let btScanInterval = null;
let drippiesSeleccionados = new Set();
let vincularMode = false; // si está vinculando uno nuevo por BT

/* ══════════════════════════════════════════
   RENDER DETALLE (sin cambios vs original)
══════════════════════════════════════════ */
function renderBateriaSegments(valor, color) {
    const segs = 5, filled = Math.round((valor/100)*segs);
    return Array.from({length:segs}, (_,i) =>
        `<div class="bat-seg" style="background:${i<filled?color:'var(--gb)'};opacity:${i<filled?.9:1};"></div>`
    ).join('');
}

function renderLightBars(bars, color) {
    const max = Math.max(...bars);
    return bars.map((v,i) => {
        const h = Math.round((v/max)*100);
        const isNow = i === bars.length-1;
        const bg = isNow ? color : color.replace(')',', 0.35)').replace('rgb','rgba');
        return `<div class="lb" style="height:${h}%;background:${bg};flex:1;"></div>`;
    }).join('');
}

function renderDetalle(idx) {
    const j = jardines[idx];
    const s = j.sensores;
    const tempPct = Math.round(((s.temperatura.valor - s.temperatura.min)/(s.temperatura.max - s.temperatura.min))*100);
    const detail = document.getElementById('jardinDetail');
    detail.style.animation = 'none'; detail.offsetHeight; detail.style.animation = '';

    detail.innerHTML = `
    <div class="detail-header">
        <div class="dh-top">
            <div>
                <div class="dh-title">${j.nombre}</div>
                <div class="dh-sub">${j.tipo} · ${j.ubicacion}</div>
            </div>
            <div class="dh-actions">
                <div class="dh-btn"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></div>
                <div class="dh-btn"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg></div>
            </div>
        </div>
        <div class="health-bar-wrap">
            <span class="health-label">Salud general</span>
            <div class="health-track"><div class="health-fill" style="width:${j.salud}%;background:${j.saludColor};"></div></div>
            <span class="health-pct" style="color:${j.saludColor}">${j.salud}%</span>
        </div>
    </div>

    <div class="next-riego">
        <div class="nr-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M5 12H2M22 12h-3"/></svg></div>
        <div class="nr-info">
            <div class="nr-label">Próximo riego</div>
            <div class="nr-value" style="color:${j.statusKey==='crit'?'var(--red)':'var(--blue)'}">${j.proximoRiego}</div>
            <div class="nr-sub">Automático · 0.6 L estimados</div>
        </div>
        <button class="nr-toggle"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>Regar ahora</button>
    </div>

    <div class="card-eye" style="margin:0 2px -4px;">Sensores del módulo</div>
    <div class="sensors-grid">
        <div class="sensor-card ${s.humedadSuelo.alerta==='crit'?'alert':s.humedadSuelo.alerta==='warn'?'alert-warn':''}">
            <div class="sc-head">
                <div class="sc-label" style="color:${s.humedadSuelo.color}"><svg viewBox="0 0 24 24" fill="none" stroke="${s.humedadSuelo.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M5 12H2M22 12h-3"/></svg>Humedad suelo</div>
                ${s.humedadSuelo.alerta?`<span class="sc-badge" style="background:${s.humedadSuelo.alerta==='crit'?'var(--rs)':'var(--ams)'};color:${s.humedadSuelo.alerta==='crit'?'var(--red)':'var(--amber)'};">${s.humedadSuelo.alerta==='crit'?'Crítico':'Alerta'}</span>`:''}
            </div>
            <div class="sc-value" style="color:${s.humedadSuelo.color}">${s.humedadSuelo.valor}<span class="sc-unit">%</span></div>
            <div class="sc-track"><div class="sc-fill" style="width:${s.humedadSuelo.valor}%;background:${s.humedadSuelo.color};"></div></div>
            <div class="sc-desc ${s.humedadSuelo.alerta||''}">${s.humedadSuelo.desc}</div>
        </div>
        <div class="sensor-card">
            <div class="sc-head"><div class="sc-label" style="color:#9d83ed"><svg viewBox="0 0 24 24" fill="none" stroke="#9d83ed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>Humedad ambiente</div></div>
            <div class="sc-value" style="color:#9d83ed">${s.humedadAmb.valor}<span class="sc-unit">%</span></div>
            <div class="sc-track"><div class="sc-fill" style="width:${s.humedadAmb.valor}%;background:#9d83ed;"></div></div>
            <div class="sc-desc">${s.humedadAmb.desc}</div>
        </div>
        <div class="sensor-card">
            <div class="sc-head"><div class="sc-label" style="color:${s.temperatura.color}"><svg viewBox="0 0 24 24" fill="none" stroke="${s.temperatura.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>Temperatura</div></div>
            <div class="sc-value" style="color:${s.temperatura.color}">${s.temperatura.valor}<span class="sc-unit">°C</span></div>
            <div class="sc-track"><div class="sc-fill" style="width:${tempPct}%;background:${s.temperatura.color};"></div></div>
            <div class="sc-desc">${s.temperatura.desc}</div>
        </div>
        <div class="sensor-card ${s.luz.alerta==='warn'?'alert-warn':''}">
            <div class="sc-head">
                <div class="sc-label" style="color:${s.luz.color}"><svg viewBox="0 0 24 24" fill="none" stroke="${s.luz.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>Intensidad lumínica</div>
                ${s.luz.alerta?`<span class="sc-badge" style="background:var(--ams);color:var(--amber);">Baja</span>`:''}
            </div>
            <div class="sc-value" style="color:${s.luz.color}">${s.luz.valor}<span class="sc-unit" style="font-size:12px;">klux</span></div>
            <div class="light-bars">${renderLightBars(s.luz.bars, s.luz.color)}</div>
            <div class="sc-desc ${s.luz.alerta||''}">${s.luz.desc}</div>
        </div>
        <div class="sensor-card ${s.bateria.alerta==='warn'?'alert-warn':s.bateria.alerta==='crit'?'alert':''}">
            <div class="sc-head">
                <div class="sc-label" style="color:${s.bateria.color}"><svg viewBox="0 0 24 24" fill="none" stroke="${s.bateria.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/></svg>Batería solar</div>
                ${s.bateria.alerta?`<span class="sc-badge" style="background:var(--ams);color:var(--amber);">Baja</span>`:''}
            </div>
            <div class="sc-value" style="color:${s.bateria.color}">${s.bateria.valor}<span class="sc-unit">%</span></div>
            <div class="battery-icon">${renderBateriaSegments(s.bateria.valor, s.bateria.color)}</div>
            <div class="sc-desc ${s.bateria.alerta||''}">${s.bateria.desc}</div>
        </div>
    </div>

    <div class="riego-section">
        <div class="card-eye" style="margin-bottom:10px;">Historial de riego</div>
        ${j.riegos.map(r=>`
        <div class="riego-row">
            <div class="rr-dot" style="background:${r.ok?'var(--green)':'var(--red)'};"></div>
            <div class="rr-info"><div class="rr-title">${r.title}</div><div class="rr-sub">${r.sub}</div></div>
            <div style="text-align:right;"><div class="rr-amount">${r.amount}</div><div class="rr-time">${r.time}</div></div>
        </div>`).join('')}
    </div>`;
}

function selectJardin(idx) {
    activeIdx = idx;
    document.querySelectorAll('.jardin-row').forEach((el,i) => el.classList.toggle('active', i===idx));
    renderDetalle(idx);
    document.getElementById('jardinDetail').classList.add('mobile-show');
}

renderDetalle(0);

/* ══════════════════════════════════════════
   MODAL — AGREGAR JARDÍN
══════════════════════════════════════════ */

/* ── Inyectar HTML del modal al body ── */
document.body.insertAdjacentHTML('beforeend', `
<div class="modal-backdrop" id="modalBackdrop" onclick="handleBackdropClick(event)">
  <div class="modal-drawer" id="modalDrawer">

    <!-- HEADER MODAL -->
    <div class="modal-header">
      <div class="modal-steps" id="modalSteps">
        <div class="ms-step active" data-s="1">1</div>
        <div class="ms-line"></div>
        <div class="ms-step" data-s="2">2</div>
        <div class="ms-line"></div>
        <div class="ms-step" data-s="3">3</div>
      </div>
      <div class="modal-header-text" id="modalHeaderText">
        <div class="mh-title">Nuevo jardín</div>
        <div class="mh-sub">Paso 1 de 3 — Información básica</div>
      </div>
      <button class="modal-close" onclick="closeModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- CUERPO (se renderiza por paso) -->
    <div class="modal-body" id="modalBody"></div>

    <!-- FOOTER -->
    <div class="modal-footer">
      <button class="mf-back" id="modalBack" onclick="stepBack()">Atrás</button>
      <button class="mf-next" id="modalNext" onclick="stepNext()">Continuar</button>
    </div>
  </div>
</div>

<!-- ESTILOS DEL MODAL -->
<style>
.modal-backdrop {
    position:fixed; inset:0; z-index:500;
    background:rgba(0,0,0,0); pointer-events:none;
    display:flex; align-items:flex-end; justify-content:center;
    transition:background .3s;
}
.modal-backdrop.open {
    background:rgba(0,0,0,0.6);
    backdrop-filter:blur(6px); -webkit-backdrop-filter:blur(6px);
    pointer-events:all;
}
.modal-drawer {
    width:100%; max-width:560px; max-height:90dvh;
    background:rgba(14,14,22,0.97);
    border:1px solid rgba(255,255,255,0.1);
    border-bottom:none;
    border-radius:24px 24px 0 0;
    display:flex; flex-direction:column; overflow:hidden;
    transform:translateY(100%); transition:transform .4s cubic-bezier(.65,0,.35,1);
    position:relative;
}
.modal-drawer::before {
    content:''; position:absolute; inset:0; border-radius:24px 24px 0 0;
    background:linear-gradient(160deg,rgba(157,131,237,.06) 0%,transparent 50%);
    pointer-events:none;
}
.modal-backdrop.open .modal-drawer { transform:translateY(0); }

/* Header */
.modal-header {
    display:flex; align-items:center; gap:14px;
    padding:20px 20px 16px; border-bottom:1px solid rgba(255,255,255,.07);
    flex-shrink:0;
}
.modal-steps { display:flex; align-items:center; gap:6px; flex-shrink:0; }
.ms-step {
    width:28px; height:28px; border-radius:50%;
    background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1);
    display:flex; align-items:center; justify-content:center;
    font-size:11px; font-weight:800; color:rgba(255,255,255,.3);
    transition:all .3s;
}
.ms-step.active { background:rgba(157,131,237,.2); border-color:rgba(157,131,237,.4); color:#9d83ed; }
.ms-step.done   { background:rgba(62,207,142,.15); border-color:rgba(62,207,142,.3); color:#3ecf8e; }
.ms-line { width:20px; height:1px; background:rgba(255,255,255,.08); }
.modal-header-text { flex:1; }
.mh-title { font-size:15px; font-weight:900; letter-spacing:-.3px; }
.mh-sub   { font-size:11px; color:rgba(255,255,255,.35); font-weight:600; margin-top:2px; }
.modal-close {
    width:32px; height:32px; border-radius:50%;
    background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08);
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; flex-shrink:0;
}
.modal-close svg { width:14px; height:14px; stroke:rgba(255,255,255,.5); }
.modal-close:hover { background:rgba(255,255,255,.1); }

/* Body */
.modal-body { flex:1; overflow-y:auto; padding:20px; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.08) transparent; }

/* Footer */
.modal-footer {
    display:flex; gap:10px; padding:16px 20px;
    border-top:1px solid rgba(255,255,255,.07); flex-shrink:0;
}
.mf-back {
    flex:1; height:46px; border-radius:14px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
    color:rgba(255,255,255,.5); font-size:14px; font-weight:800;
    cursor:pointer; font-family:'Nunito',sans-serif; transition:all .18s;
}
.mf-back:hover { background:rgba(255,255,255,.09); color:rgba(255,255,255,.8); }
.mf-next {
    flex:2; height:46px; border-radius:14px;
    background:#9d83ed; border:none;
    color:#0b0b12; font-size:14px; font-weight:900;
    cursor:pointer; font-family:'Nunito',sans-serif; transition:all .18s;
}
.mf-next:hover { background:#8a70d8; }
.mf-next:disabled { background:rgba(255,255,255,.08); color:rgba(255,255,255,.2); cursor:not-allowed; }

/* ── FORM ELEMENTS ── */
.field-group { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
.field-label { font-size:11px; font-weight:800; color:rgba(255,255,255,.4); letter-spacing:.08em; text-transform:uppercase; }
.field-input {
    width:100%; height:48px; padding:0 16px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09);
    border-radius:14px; color:rgba(255,255,255,.92);
    font-size:14px; font-weight:600; font-family:'Nunito',sans-serif;
    outline:none; transition:border-color .2s, background .2s;
}
.field-input:focus { border-color:rgba(157,131,237,.5); background:rgba(157,131,237,.08); }
.field-input::placeholder { color:rgba(255,255,255,.18); font-weight:400; }

.field-select {
    width:100%; height:48px; padding:0 16px;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.09);
    border-radius:14px; color:rgba(255,255,255,.92);
    font-size:14px; font-weight:600; font-family:'Nunito',sans-serif;
    outline:none; cursor:pointer; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 14px center; background-size:16px;
}
.field-select:focus { border-color:rgba(157,131,237,.5); outline:none; }
.field-select option { background:#1a1a28; }

.field-hint { font-size:11px; color:rgba(255,255,255,.25); font-weight:600; line-height:1.5; }

/* ── DISPOSITIVO CARD ── */
.drip-card {
    display:flex; align-items:center; gap:12px;
    padding:14px; border-radius:14px;
    background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
    cursor:pointer; transition:all .2s; margin-bottom:8px;
    position:relative;
}
.drip-card:hover   { border-color:rgba(255,255,255,.14); background:rgba(255,255,255,.07); }
.drip-card.selected { border-color:rgba(157,131,237,.4); background:rgba(157,131,237,.1); }
.drip-card-icon {
    width:40px; height:40px; border-radius:12px; flex-shrink:0;
    background:rgba(157,131,237,.12); border:1px solid rgba(157,131,237,.2);
    display:flex; align-items:center; justify-content:center;
}
.drip-card-icon svg { width:18px; height:18px; stroke:#9d83ed; }
.drip-card-info { flex:1; min-width:0; }
.dci-name { font-size:13px; font-weight:800; color:rgba(255,255,255,.9); margin-bottom:2px; }
.dci-sub  { font-size:10px; color:rgba(255,255,255,.3); font-weight:700; font-family:'DM Mono',monospace; }
.drip-check {
    width:20px; height:20px; border-radius:50%;
    border:2px solid rgba(255,255,255,.15);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:all .2s;
}
.drip-card.selected .drip-check {
    background:#9d83ed; border-color:#9d83ed;
}
.drip-check svg { width:10px; height:10px; stroke:#0b0b12; opacity:0; transition:opacity .2s; }
.drip-card.selected .drip-check svg { opacity:1; }

/* Separador */
.modal-sep {
    display:flex; align-items:center; gap:10px;
    margin:16px 0; font-size:11px; color:rgba(255,255,255,.2); font-weight:700;
}
.modal-sep::before, .modal-sep::after { content:''; flex:1; height:1px; background:rgba(255,255,255,.07); }

/* Vincular nuevo botón */
.btn-vincular {
    width:100%; padding:13px 16px;
    display:flex; align-items:center; gap:12px;
    border-radius:14px; background:transparent;
    border:1px dashed rgba(157,131,237,.25);
    color:#9d83ed; font-size:13px; font-weight:800;
    cursor:pointer; font-family:'Nunito',sans-serif; transition:all .2s;
}
.btn-vincular:hover { background:rgba(157,131,237,.1); border-color:rgba(157,131,237,.4); }
.btn-vincular svg { width:16px; height:16px; stroke:#9d83ed; flex-shrink:0; }

/* ── BT SCAN ── */
.bt-scan-wrap { text-align:center; padding:24px 0; }
.bt-pulse {
    width:72px; height:72px; border-radius:50%; margin:0 auto 20px;
    background:rgba(157,131,237,.15); border:2px solid rgba(157,131,237,.3);
    display:flex; align-items:center; justify-content:center;
    animation:btPulse 1.8s ease infinite;
}
.bt-pulse svg { width:30px; height:30px; stroke:#9d83ed; }
@keyframes btPulse {
    0%,100% { box-shadow:0 0 0 0 rgba(157,131,237,.4); }
    50%      { box-shadow:0 0 0 18px rgba(157,131,237,0); }
}
.bt-scan-title { font-size:15px; font-weight:900; margin-bottom:6px; }
.bt-scan-sub   { font-size:12px; color:rgba(255,255,255,.35); font-weight:600; }
.bt-found-list { display:flex; flex-direction:column; gap:8px; margin-top:16px; }

/* ── INFO ROW ── */
.info-row { display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid rgba(255,255,255,.06); }
.info-row:last-child { border-bottom:none; }
.ir-key { font-size:11px; color:rgba(255,255,255,.35); font-weight:700; }
.ir-val { font-size:12px; font-weight:800; font-family:'DM Mono',monospace; color:rgba(255,255,255,.8); }

/* ── CONFIRMACIÓN ── */
.confirm-icon {
    width:64px; height:64px; border-radius:50%; margin:0 auto 16px;
    background:rgba(62,207,142,.12); border:2px solid rgba(62,207,142,.3);
    display:flex; align-items:center; justify-content:center;
}
.confirm-icon svg { width:28px; height:28px; stroke:#3ecf8e; }
.confirm-title { font-size:18px; font-weight:900; text-align:center; margin-bottom:6px; }
.confirm-sub   { font-size:12px; color:rgba(255,255,255,.4); text-align:center; margin-bottom:24px; font-weight:600; }

/* ── BAT MINI ── */
.bat-mini { display:flex; align-items:center; gap:4px; }
.bm-seg { width:8px; height:8px; border-radius:1px; }

/* password toggle */
.pw-wrap { position:relative; }
.pw-wrap .field-input { padding-right:44px; }
.pw-eye {
    position:absolute; right:14px; top:50%; transform:translateY(-50%);
    cursor:pointer; background:none; border:none; padding:4px;
}
.pw-eye svg { width:15px; height:15px; stroke:rgba(255,255,255,.3); }

@media(min-width:681px) {
    .modal-backdrop { align-items:center; }
    .modal-drawer { border-radius:24px; border-bottom:1px solid rgba(255,255,255,.1); max-height:85dvh; }
}
</style>
`);

/* ── ABRIR / CERRAR ── */
function openModal() {
    modalStep = 1;
    nuevoJardin = { nombre:"", tipo:"", drippies:[], wifi:{ ssid:"", pass:"" } };
    drippiesSeleccionados = new Set();
    vincularMode = false;
    document.getElementById('modalBackdrop').classList.add('open');
    renderModalStep();
}

function closeModal() {
    if (btScanInterval) { clearInterval(btScanInterval); btScanInterval = null; }
    document.getElementById('modalBackdrop').classList.remove('open');
}

function handleBackdropClick(e) {
    if (e.target === document.getElementById('modalBackdrop')) closeModal();
}

/* ── BOTÓN AGREGAR desde el header ── */
document.querySelector('.btn-add').addEventListener('click', openModal);
document.querySelector('.add-row').addEventListener('click', openModal);

/* ── PASOS ── */
function updateStepUI() {
    const steps = document.querySelectorAll('.ms-step');
    const totalSteps = vincularMode ? 4 : 3;
    const subTexts = vincularMode
        ? ['Información básica','Seleccionar Drippies','Configurar WiFi','Confirmar']
        : ['Información básica','Seleccionar Drippies','Confirmar'];

    steps.forEach((s, i) => {
        const n = i + 1;
        s.classList.toggle('done',   n < modalStep);
        s.classList.toggle('active', n === modalStep);
        s.textContent = n < modalStep ? '✓' : n;
    });

    document.querySelector('.mh-title').textContent = 'Nuevo jardín';
    document.querySelector('.mh-sub').textContent = `Paso ${modalStep} de ${totalSteps} — ${subTexts[modalStep-1]||''}`;
    document.getElementById('modalBack').style.visibility = modalStep === 1 ? 'hidden' : 'visible';
}

function stepNext() {
    if (modalStep === 1) {
        const nombre = document.getElementById('inp-nombre')?.value.trim();
        const tipo   = document.getElementById('inp-tipo')?.value;
        if (!nombre) { shakeInput('inp-nombre'); return; }
        nuevoJardin.nombre = nombre;
        nuevoJardin.tipo   = tipo;
        modalStep = 2;
    } else if (modalStep === 2) {
        if (!vincularMode) {
            // Paso 2 normal → confirmar
            nuevoJardin.drippies = [...drippiesSeleccionados];
            modalStep = 3;
        } else {
            // Paso 2 de vincular → WiFi
            const ssid = document.getElementById('inp-ssid')?.value.trim();
            const pass = document.getElementById('inp-pass')?.value.trim();
            if (!ssid) { shakeInput('inp-ssid'); return; }
            nuevoJardin.wifi = { ssid, pass };
            modalStep = 3;
        }
    } else if (modalStep === 3) {
        if (vincularMode) {
            // Paso 3 vincular → nombre sensor → confirmar
            const nom = document.getElementById('inp-devnom')?.value.trim();
            if (!nom) { shakeInput('inp-devnom'); return; }
            nuevoJardin.nuevoDevNombre = nom;
            modalStep = 4;
        } else {
            // Paso 3 normal = confirmación final
            finalizarJardin();
            return;
        }
    } else if (modalStep === 4) {
        finalizarJardin();
        return;
    }
    renderModalStep();
}

function stepBack() {
    if (modalStep === 1) return;
    if (vincularMode && modalStep === 2) {
        // volver a selección de drippies
        vincularMode = false;
        modalStep = 2;
    } else {
        modalStep--;
    }
    renderModalStep();
}

function shakeInput(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = 'rgba(240,107,107,.6)';
    el.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:300});
    setTimeout(()=>el.style.borderColor='', 1000);
}

/* ── RENDER POR PASO ── */
function renderModalStep() {
    updateStepUI();
    const body = document.getElementById('modalBody');
    const next = document.getElementById('modalNext');

    if (modalStep === 1) {
        next.textContent = 'Continuar';
        next.disabled = false;
        body.innerHTML = `
        <div class="field-group">
            <label class="field-label">Nombre del jardín</label>
            <input class="field-input" id="inp-nombre" placeholder="Ej. Maceta del balcón" maxlength="30" value="${nuevoJardin.nombre}">
        </div>
        <div class="field-group">
            <label class="field-label">Tipo de planta principal</label>
            <select class="field-select" id="inp-tipo">
                ${tiposPlanta.map(t=>`<option value="${t}" ${nuevoJardin.tipo===t?'selected':''}>${t}</option>`).join('')}
            </select>
        </div>
        <div class="field-group">
            <label class="field-label">Descripción / ubicación (opcional)</label>
            <input class="field-input" id="inp-ubic" placeholder="Ej. Terraza sur, junto a la ventana" value="${nuevoJardin.ubicacion||''}">
            <span class="field-hint">Un dato que te ayude a identificarlo físicamente.</span>
        </div>`;
        document.getElementById('inp-nombre').focus();

    } else if (modalStep === 2 && !vincularMode) {
        // Selección de Drippies disponibles
        next.textContent = 'Continuar';
        next.disabled = false;

        const disponibles = drippiesDisponibles;
        body.innerHTML = `
        <p style="font-size:12px;color:rgba(255,255,255,.4);font-weight:600;margin-bottom:14px;line-height:1.6">
            Selecciona los módulos Drippie que formarán este jardín. Cada módulo monitorea una planta individual dentro del mismo espacio.
        </p>
        <div class="bt-found-list" id="drippiesList">
            ${disponibles.length === 0
                ? `<p style="text-align:center;color:rgba(255,255,255,.25);font-size:12px;padding:20px 0">No hay módulos disponibles sin jardín asignado.</p>`
                : disponibles.map(d => `
                <div class="drip-card ${drippiesSeleccionados.has(d.id)?'selected':''}" onclick="toggleDrippie('${d.id}',this)" id="dc-${d.id}">
                    <div class="drip-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3l-4 4-4-4"/></svg>
                    </div>
                    <div class="drip-card-info">
                        <div class="dci-name">${d.id} <span style="color:rgba(255,255,255,.3);font-weight:600;font-size:11px">· Sin asignar</span></div>
                        <div class="dci-sub">${d.sn} · FW ${d.fw}</div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:5px;">
                            ${batMini(d.bateria)}
                            <span style="font-size:10px;color:rgba(255,255,255,.3);font-weight:700">${d.bateria}% batería</span>
                        </div>
                    </div>
                    <div class="drip-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                </div>`).join('')}
        </div>
        <div class="modal-sep">o</div>
        <button class="btn-vincular" onclick="iniciarVincular()">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            Vincular nuevo dispositivo Drippie
        </button>`;

    } else if (vincularMode && modalStep === 2) {
        // Flujo vincular: BT scan
        next.textContent = 'Continuar';
        next.disabled = true;
        body.innerHTML = `
        <div class="bt-scan-wrap">
            <div class="bt-pulse">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 6.5l11 11M6.5 17.5L12 12l5.5-5.5M12 2v20"/></svg>
            </div>
            <div class="bt-scan-title">Buscando dispositivos…</div>
            <div class="bt-scan-sub">Asegúrate de que el Drippie esté encendido y cerca.<br>El LED azul debe parpadear.</div>
            <div class="bt-found-list" id="btFoundList"></div>
        </div>`;
        simularBTScan();

    } else if (vincularMode && modalStep === 3) {
        // WiFi credentials
        next.textContent = 'Configurar';
        next.disabled = false;
        body.innerHTML = `
        <p style="font-size:12px;color:rgba(255,255,255,.4);font-weight:600;margin-bottom:18px;line-height:1.6">
            El Drippie necesita tu red WiFi para sincronizar datos con la nube. La contraseña se transmite de forma segura por Bluetooth y no se almacena en nuestros servidores.
        </p>
        <div class="field-group">
            <label class="field-label">Red WiFi (SSID)</label>
            <input class="field-input" id="inp-ssid" placeholder="Nombre de tu red" value="${nuevoJardin.wifi.ssid}" autocomplete="off" autocapitalize="none">
        </div>
        <div class="field-group">
            <label class="field-label">Contraseña WiFi</label>
            <div class="pw-wrap">
                <input class="field-input" id="inp-pass" type="password" placeholder="Contraseña" value="${nuevoJardin.wifi.pass}" autocomplete="new-password">
                <button class="pw-eye" onclick="togglePw()" type="button">
                    <svg id="pw-icon" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
            </div>
            <span class="field-hint">Tu contraseña solo se usa para configurar el dispositivo. No la guardamos.</span>
        </div>
        <div style="background:rgba(91,173,234,.08);border:1px solid rgba(91,173,234,.15);border-radius:12px;padding:12px 14px;margin-top:4px;">
            <div style="font-size:11px;font-weight:800;color:#5badea;margin-bottom:4px;">Solo 2.4 GHz</div>
            <div style="font-size:11px;color:rgba(255,255,255,.35);font-weight:600;line-height:1.5">El módulo Drippie solo es compatible con redes WiFi de 2.4 GHz. Las redes de 5 GHz no son detectadas.</div>
        </div>`;
        document.getElementById('inp-ssid').focus();

    } else if (vincularMode && modalStep === 4) {
        // Nombre del nuevo sensor + confirmación de vinculación
        next.textContent = 'Crear jardín';
        next.disabled = false;
        body.innerHTML = `
        <div class="field-group">
            <label class="field-label">Nombre del módulo Drippie</label>
            <input class="field-input" id="inp-devnom" placeholder="Ej. Sensor balcón norte" value="${nuevoJardin.nuevoDevNombre||''}">
            <span class="field-hint">Así identificarás este sensor dentro del jardín.</span>
        </div>
        <div class="modal-sep">resumen de configuración</div>
        <div class="info-row"><span class="ir-key">Jardín</span><span class="ir-val">${nuevoJardin.nombre}</span></div>
        <div class="info-row"><span class="ir-key">Planta</span><span class="ir-val">${nuevoJardin.tipo}</span></div>
        <div class="info-row"><span class="ir-key">Red WiFi</span><span class="ir-val">${nuevoJardin.wifi.ssid}</span></div>
        <div class="info-row"><span class="ir-key">Dispositivo encontrado</span><span class="ir-val">${nuevoJardin.btDevice||'DRP-NEW-001'}</span></div>`;

    } else if (!vincularMode && modalStep === 3) {
        // Confirmación final sin vincular nuevo
        next.textContent = 'Crear jardín';
        next.disabled = false;
        const count = drippiesSeleccionados.size;
        body.innerHTML = `
        <div style="text-align:center;padding:12px 0 20px">
            <div class="confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="confirm-title">Todo listo</div>
            <div class="confirm-sub">Revisa los datos antes de crear el jardín.</div>
        </div>
        <div class="info-row"><span class="ir-key">Nombre</span><span class="ir-val">${nuevoJardin.nombre}</span></div>
        <div class="info-row"><span class="ir-key">Planta</span><span class="ir-val">${nuevoJardin.tipo}</span></div>
        <div class="info-row"><span class="ir-key">Módulos asignados</span><span class="ir-val">${count > 0 ? [...drippiesSeleccionados].join(', ') : '— ninguno por ahora'}</span></div>
        <div class="info-row"><span class="ir-key">Estado</span><span class="ir-val" style="color:#3ecf8e">Listo para activar</span></div>`;
    }
}

/* ── HELPERS ── */
function batMini(pct) {
    const segs = 4, filled = Math.round((pct/100)*segs);
    const c = pct > 50 ? '#3ecf8e' : pct > 20 ? '#f5a623' : '#f06b6b';
    return `<div class="bat-mini">${Array.from({length:segs},(_,i)=>`<div class="bm-seg" style="background:${i<filled?c:'rgba(255,255,255,.1)'}"></div>`).join('')}</div>`;
}

function toggleDrippie(id, el) {
    if (drippiesSeleccionados.has(id)) {
        drippiesSeleccionados.delete(id);
        el.classList.remove('selected');
    } else {
        drippiesSeleccionados.add(id);
        el.classList.add('selected');
    }
}

function iniciarVincular() {
    vincularMode = true;
    modalStep = 2;
    renderModalStep();
}

function togglePw() {
    const inp = document.getElementById('inp-pass');
    inp.type = inp.type === 'password' ? 'text' : 'password';
}

/* ── BT SCAN SIMULADO ── */
function simularBTScan() {
    const encontrados = [];
    const candidatos = [
        { id:'DRP-NEW-001', rssi:-62 },
        { id:'DRP-NEW-002', rssi:-74 },
    ];
    let idx = 0;
    btScanInterval = setInterval(()=>{
        if (idx < candidatos.length) {
            encontrados.push(candidatos[idx++]);
            renderBTFound(encontrados);
        } else {
            clearInterval(btScanInterval); btScanInterval = null;
        }
    }, 1400);
}

function renderBTFound(lista) {
    const el = document.getElementById('btFoundList');
    if (!el) return;
    const next = document.getElementById('modalNext');
    el.innerHTML = lista.map(d => `
    <div class="drip-card selected" style="cursor:default;margin-top:0">
        <div class="drip-card-icon" style="background:rgba(62,207,142,.1);border-color:rgba(62,207,142,.2)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#3ecf8e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        </div>
        <div class="drip-card-info">
            <div class="dci-name" style="color:#3ecf8e">${d.id} <span style="font-size:10px;font-weight:600;color:rgba(255,255,255,.3)">· Encontrado</span></div>
            <div class="dci-sub">RSSI: ${d.rssi} dBm · Listo para vincular</div>
        </div>
        <div class="drip-check" style="background:#3ecf8e;border-color:#3ecf8e">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="opacity:1;width:10px;height:10px;stroke:#0b0b12"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
    </div>`).join('');

    if (lista.length > 0) {
        nuevoJardin.btDevice = lista[0].id;
        next.disabled = false;
        document.querySelector('.bt-scan-title').textContent = `${lista.length} dispositivo${lista.length>1?'s':''} encontrado${lista.length>1?'s':''}`;
        document.querySelector('.bt-scan-sub').textContent = 'Selecciona el módulo que deseas vincular.';
    }
}

/* ── FINALIZAR ── */
function finalizarJardin() {
    const body = document.getElementById('modalBody');
    const next = document.getElementById('modalNext');
    const back = document.getElementById('modalBack');
    next.disabled = true; back.style.visibility = 'hidden';
    body.innerHTML = `
    <div style="text-align:center;padding:32px 0">
        <div style="width:64px;height:64px;border-radius:50%;margin:0 auto 20px;background:rgba(157,131,237,.12);border:2px solid rgba(157,131,237,.3);display:flex;align-items:center;justify-content:center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#9d83ed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:28px;height:28px;animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        </div>
        <div style="font-size:15px;font-weight:900;margin-bottom:6px">Creando jardín…</div>
        <div style="font-size:12px;color:rgba(255,255,255,.35);font-weight:600">Configurando los módulos Drippie</div>
    </div>
    <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>`;

    setTimeout(()=>{
        body.innerHTML = `
        <div style="text-align:center;padding:32px 0">
            <div class="confirm-icon" style="margin-bottom:20px"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
            <div class="confirm-title">¡Jardín creado!</div>
            <div class="confirm-sub">${nuevoJardin.nombre} está listo.<br>Ya puedes monitorear tus plantas.</div>
        </div>`;
        next.textContent = 'Ir al jardín';
        next.disabled = false;
        next.onclick = ()=>closeModal();
        updateStepUI();
        document.querySelectorAll('.ms-step').forEach(s=>{ s.classList.remove('active'); s.classList.add('done'); s.textContent='✓'; });
    }, 2000);
}