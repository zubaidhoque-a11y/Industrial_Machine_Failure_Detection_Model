(function(){
  const ICONS = {
    thermo:'<path d="M12 14.5V5a2 2 0 1 0-4 0v9.5a4 4 0 1 0 4 0z"/><path d="M12 8h2"/>',
    wave:'<path d="M2 12h3l2-7 4 14 3-10 2 6h6"/>',
    gauge:'<path d="M12 20a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/><path d="M12 12l4-3"/><path d="M12 4v1"/>',
    drop:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    spin:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    bolt:'<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    zap:'<path d="M4 12h4l2-5 4 10 2-5h4"/>',
    tank:'<path d="M6 3h12v6H6z"/><path d="M4 9h16v12H4z"/><path d="M4 15h16"/>',
    weight:'<circle cx="12" cy="7" r="3"/><path d="M5 21l2-10h10l2 10z"/>',
    volume:'<path d="M5 9v6h4l5 4V5L9 9H5z"/>',
    fan:'<circle cx="12" cy="12" r="1.6"/><path d="M12 12c0-3 1-6 4-6 2 0 2 3-1 4"/><path d="M12 12c3 0 6 1 6 4 0 2-3 2-4-1"/><path d="M12 12c0 3-1 6-4 6-2 0-2-3 1-4"/><path d="M12 12c-3 0-6-1-6-4 0-2 3-2 4 1"/>',
    plug:'<path d="M9 7V3M15 7V3M7 7h10l-1 5a4 4 0 0 1-8 0z"/><path d="M12 16v5"/>',
    power:'<path d="M12 3v9"/><path d="M6.5 6.5a8 8 0 1 0 11 0"/>'
  };

  function icon(name){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`; }

  const CATEGORIES = [
    { name:'Thermal', color:'#ffb347', fields:[
        { id:'temperature', label:'Temperature', unit:'°C', sample:68.5, icon:'thermo' },
        { id:'motor_temperature', label:'Motor temp', unit:'°C', sample:74.2, icon:'thermo' },
        { id:'gearbox_temperature', label:'Gearbox temp', unit:'°C', sample:58.6, icon:'thermo' },
    ]},
    { name:'Mechanical', color:'#8fa0b3', fields:[
        { id:'vibration', label:'Vibration', unit:'mm/s', sample:2.3, icon:'wave' },
        { id:'pressure', label:'Pressure', unit:'bar', sample:5.1, icon:'gauge' },
        { id:'rotation_speed', label:'Rotation speed', unit:'rpm', sample:1450, icon:'spin' },
        { id:'load', label:'Load', unit:'%', sample:62, icon:'weight' },
        { id:'sound_level', label:'Sound level', unit:'dB', sample:71, icon:'volume' },
        { id:'fan_speed', label:'Fan speed', unit:'rpm', sample:980, icon:'fan' },
    ]},
    { name:'Electrical', color:'#4be3cf', fields:[
        { id:'voltage', label:'Voltage', unit:'V', sample:220, icon:'bolt' },
        { id:'current', label:'Current', unit:'A', sample:12.4, icon:'zap' },
        { id:'reactive_power', label:'Reactive power', unit:'kVAR', sample:3.2, icon:'plug' },
        { id:'active_power', label:'Active power', unit:'kW', sample:14.8, icon:'power' },
    ]},
    { name:'Environmental', color:'#b09bff', fields:[
        { id:'humidity', label:'Humidity', unit:'%', sample:45, icon:'drop' },
        { id:'oil_level', label:'Oil level', unit:'%', sample:78, icon:'tank' },
    ]},
  ];

  // Change this if your FastAPI server runs somewhere else.
  let API_BASE = 'https://industrial-machine-failure-detection-zu0t.onrender.com';

  const wrap = document.getElementById('categoriesWrap');
  const predictBtn = document.getElementById('predictBtn');
  const resultCard = document.getElementById('resultCard');
  const resultIcon = document.getElementById('resultIcon');
  const resultTitle = document.getElementById('resultTitle');
  const resultSub = document.getElementById('resultSub');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const endpointToggle = document.getElementById('endpointToggle');

  const ALL_FIELDS = [];

  CATEGORIES.forEach(cat => {
    const block = document.createElement('div');
    block.className = 'category-block';
    block.innerHTML = `
      <div class="category-head">
        <span class="category-swatch" style="background:${cat.color}"></span>
        <h3>${cat.name}</h3>
        <span class="count">${cat.fields.length} channel${cat.fields.length>1?'s':''}</span>
      </div>
      <div class="field-grid"></div>
    `;
    const grid = block.querySelector('.field-grid');
    cat.fields.forEach(f => {
      ALL_FIELDS.push(f);
      const field = document.createElement('div');
      field.className = 'field';
      field.innerHTML = `
        <label for="${f.id}">${f.label} <span class="unit">${f.unit}</span></label>
        <div class="input-shell" style="--cat-color:${cat.color}">
          <span class="ic" style="color:${cat.color}">${icon(f.icon)}</span>
          <input type="number" step="any" id="${f.id}" name="${f.id}" placeholder="e.g. ${f.sample}" required />
        </div>
        <p class="field-error" id="err-${f.id}" hidden></p>
      `;
      grid.appendChild(field);
    });
    wrap.appendChild(block);
  });

  wrap.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      inp.closest('.input-shell').classList.toggle('filled', inp.value.trim() !== '');
      clearFieldError(inp.id);
    });
  });

  document.getElementById('fillSampleBtn').addEventListener('click', () => {
    ALL_FIELDS.forEach(f => {
      const inp = document.getElementById(f.id);
      inp.value = f.sample;
      inp.closest('.input-shell').classList.add('filled');
      clearFieldError(f.id);
    });
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('sensorForm').reset();
    wrap.querySelectorAll('.input-shell').forEach(s => s.classList.remove('filled', 'invalid'));
    wrap.querySelectorAll('.field-error').forEach(p => p.hidden = true);
    hideResult();
  });

  endpointToggle.addEventListener('click', () => {
    const next = prompt('Backend base URL (no trailing slash):', API_BASE);
    if (next && next.trim()) {
      API_BASE = next.trim().replace(/\/$/, '');
      endpointToggle.textContent = 'api: ' + API_BASE.replace(/^https?:\/\//, '');
      checkHealth();
    }
  });

  // Same rules as the Pydantic model: everything must be >= 0 except these two.
  const ALLOW_NEGATIVE = new Set(['temperature', 'sound_level']);

  function showFieldError(id, msg){
    const el = document.getElementById('err-' + id);
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    document.getElementById(id).closest('.input-shell').classList.add('invalid');
  }
  function clearFieldError(id){
    const el = document.getElementById('err-' + id);
    if (!el) return;
    el.hidden = true;
    document.getElementById(id).closest('.input-shell').classList.remove('invalid');
  }

  function hideResult(){ resultCard.className = 'result-card'; }

  const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_WARN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';
  const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  function showResult(kind, iconSvg, title, sub){
    resultCard.className = 'result-card show ' + kind;
    resultIcon.innerHTML = iconSvg;
    resultTitle.textContent = title;
    resultSub.textContent = sub;
  }

  async function checkHealth(){
    statusDot.className = 'dot checking';
    statusText.textContent = 'checking backend…';
    try {
      const res = await fetch(API_BASE + '/docs', { method: 'GET' });
      if (res.ok || res.status === 404) {
        statusDot.className = 'dot online';
        statusText.textContent = 'backend connected';
      } else { throw new Error('bad status'); }
    } catch (e) {
      statusDot.className = 'dot offline';
      statusText.textContent = 'backend unreachable';
    }
  }

  document.getElementById('sensorForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {};
    let firstBad = null;
    for (const f of ALL_FIELDS) {
      const raw = document.getElementById(f.id).value.trim();
      const v = parseFloat(raw);
      if (raw === '' || !Number.isFinite(v)) {
        showFieldError(f.id, 'Enter a number');
        firstBad = firstBad || f.id;
      } else if (v < 0 && !ALLOW_NEGATIVE.has(f.id)) {
        showFieldError(f.id, 'Must be 0 or higher');
        firstBad = firstBad || f.id;
      } else {
        payload[f.id] = v;
      }
    }
    if (firstBad) {
      showResult('error', ICON_WARN, 'Check your readings', 'Some values are missing or out of range. Fix the highlighted fields and run the prediction again.');
      document.getElementById(firstBad).focus();
      return;
    }

    predictBtn.disabled = true;
    predictBtn.classList.add('loading');
    hideResult();

    try {
      const res = await fetch(API_BASE + '/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let detail = 'The server returned status ' + res.status + '. Check the FastAPI terminal for details.';
        try {
          const errBody = await res.json();
          if (res.status === 422 && Array.isArray(errBody.detail)) {
            errBody.detail.forEach(d => {
              const key = d.loc && d.loc[d.loc.length - 1];
              if (key) showFieldError(key, d.msg);
            });
            detail = 'The server rejected some values. Check the highlighted fields.';
          }
        } catch(_) {}
        const e = new Error(detail);
        e.fromServer = true;
        throw e;
      }

      const data = await res.json();
      statusDot.className = 'dot online';
      statusText.textContent = 'backend connected';

      if (data.prediction === 0) {
        showResult('normal', ICON_CHECK, 'Machine operating normally', data.message || 'No failure risk detected from current sensor readings.');
      } else {
        showResult('failure', ICON_WARN, 'Failure risk detected', data.message || 'Sensor readings indicate an elevated risk of failure.');
      }
    } catch (err) {
      if (err.fromServer) {
        showResult('error', ICON_X, 'The prediction failed', err.message);
      } else {
        statusDot.className = 'dot offline';
        statusText.textContent = 'backend unreachable';
        showResult('error', ICON_X, 'Could not reach the prediction service',
          'No response from ' + API_BASE + '. Start FastAPI (uvicorn main:app --reload) and try again.');
      }
    } finally {
      predictBtn.disabled = false;
      predictBtn.classList.remove('loading');
    }
  });

  checkHealth();
})();
