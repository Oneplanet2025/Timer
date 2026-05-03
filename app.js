// ---- Tab switching ----
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.mode).classList.add('active');
  });
});

// ---- Stopwatch ----
const swMin   = document.getElementById('sw-min');
const swSec   = document.getElementById('sw-sec');
const swMs    = document.getElementById('sw-ms');
const swStart = document.getElementById('sw-start');
const swLap   = document.getElementById('sw-lap');
const swReset = document.getElementById('sw-reset');
const swLaps  = document.getElementById('sw-laps');

let swElapsed  = 0;
let swBegin    = null;
let swRafId    = null;
let swRunning  = false;
let lapTimes   = [];

function swRender(ms) {
  const total = Math.floor(ms);
  const m  = Math.floor(total / 60000);
  const s  = Math.floor((total % 60000) / 1000);
  const cs = Math.floor((total % 1000) / 10);
  swMin.textContent = pad(m);
  swSec.textContent = pad(s);
  swMs.textContent  = pad(cs);
}

function swTick(now) {
  swElapsed = now - swBegin;
  swRender(swElapsed);
  swRafId = requestAnimationFrame(swTick);
}

swStart.addEventListener('click', () => {
  if (!swRunning) {
    swBegin = performance.now() - swElapsed;
    swRafId = requestAnimationFrame(swTick);
    swRunning = true;
    swStart.textContent = '一時停止';
    swStart.classList.add('running');
    swLap.disabled   = false;
    swReset.disabled  = true;
  } else {
    cancelAnimationFrame(swRafId);
    swRunning = false;
    swStart.textContent = 'スタート';
    swStart.classList.remove('running');
    swLap.disabled   = true;
    swReset.disabled  = false;
  }
});

swLap.addEventListener('click', () => {
  if (!swRunning) return;
  const lapMs = swElapsed - lapTimes.reduce((a, b) => a + b, 0);
  lapTimes.push(lapMs);
  renderLaps();
});

swReset.addEventListener('click', () => {
  swElapsed = 0;
  lapTimes  = [];
  swRender(0);
  swLaps.innerHTML = '';
  swReset.disabled = true;
  swStart.textContent = 'スタート';
});

function renderLaps() {
  const min = lapTimes.length > 1 ? Math.min(...lapTimes) : -1;
  const max = lapTimes.length > 1 ? Math.max(...lapTimes) : -1;
  swLaps.innerHTML = '';
  [...lapTimes].reverse().forEach((ms, i) => {
    const num = lapTimes.length - i;
    const li  = document.createElement('li');
    if (ms === min) li.classList.add('fastest');
    if (ms === max) li.classList.add('slowest');
    li.innerHTML = `<span class="lap-num">ラップ ${pad(num)}</span><span>${fmtLap(ms)}</span>`;
    swLaps.appendChild(li);
  });
}

function fmtLap(ms) {
  const m  = Math.floor(ms / 60000);
  const s  = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

// ---- Timer ----
const tHour  = document.getElementById('t-hour');
const tMin   = document.getElementById('t-min');
const tSec   = document.getElementById('t-sec');
const tStart = document.getElementById('t-start');
const tReset = document.getElementById('t-reset');
const tMsg   = document.getElementById('timer-message');

let tRemaining  = 0;
let tBeginStamp = null;
let tRafId      = null;
let tRunning    = false;
let tInitial    = 0;

// Adjustment buttons
document.querySelectorAll('.adj').forEach(btn => {
  btn.addEventListener('click', () => {
    if (tRunning) return;
    const el    = document.getElementById(btn.dataset.target);
    const delta = parseInt(btn.dataset.delta, 10);
    const max   = el.id === 't-hour' ? 99 : 59;
    let val = parseInt(el.textContent, 10) + delta;
    val = Math.max(0, Math.min(max, val));
    el.textContent = pad(val);
    tRemaining = tInitial = getTimerMs();
    tMsg.classList.add('hidden');
    tReset.disabled = (tRemaining === 0);
  });
});

function getTimerMs() {
  return (parseInt(tHour.textContent) * 3600
        + parseInt(tMin.textContent)  * 60
        + parseInt(tSec.textContent)) * 1000;
}

function tRender(ms) {
  const total = Math.max(0, Math.ceil(ms));
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  tHour.textContent = pad(h);
  tMin.textContent  = pad(m);
  tSec.textContent  = pad(s);
}

function tTick(now) {
  const elapsed = now - tBeginStamp;
  tRemaining    = tInitial - elapsed;
  if (tRemaining <= 0) {
    tRemaining = 0;
    tRender(0);
    stopTimer(true);
    return;
  }
  tRender(tRemaining);
  tRafId = requestAnimationFrame(tTick);
}

tStart.addEventListener('click', () => {
  if (tRemaining <= 0 && !tRunning) return;
  if (!tRunning) {
    tInitial    = tRemaining;
    tBeginStamp = performance.now();
    tRafId      = requestAnimationFrame(tTick);
    tRunning    = true;
    tStart.textContent = '一時停止';
    tStart.classList.add('running');
    tReset.disabled = false;
    tMsg.classList.add('hidden');
    setAdjDisabled(true);
  } else {
    cancelAnimationFrame(tRafId);
    tRunning = false;
    tStart.textContent = 'スタート';
    tStart.classList.remove('running');
    setAdjDisabled(false);
  }
});

tReset.addEventListener('click', () => {
  stopTimer(false);
  tRemaining = tInitial = getTimerMs() || 0;
  tRender(tRemaining);
  tMsg.classList.add('hidden');
  setAdjDisabled(false);
});

function stopTimer(finished) {
  cancelAnimationFrame(tRafId);
  tRunning = false;
  tStart.textContent = 'スタート';
  tStart.classList.remove('running');
  if (finished) {
    tMsg.classList.remove('hidden');
    tReset.disabled = false;
    beep();
  }
}

function setAdjDisabled(disabled) {
  document.querySelectorAll('.adj').forEach(b => b.disabled = disabled);
}

function beep() {
  try {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type      = 'sine';
    osc.frequency.value  = 880;
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch (_) {}
}

// ---- Utility ----
function pad(n) { return String(n).padStart(2, '0'); }
