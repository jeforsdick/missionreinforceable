// --- Setup handles ---
const storyText = document.getElementById('story-text');
const choicesDiv = document.getElementById('choices');
const scenarioTitle = document.getElementById('scenario-title');
const downloadBtn = document.getElementById('download-csv');
const teacherCodeEl = document.getElementById('teacher-code');

// --- Teacher code from URL (?t=JESS01) ---
const params = new URLSearchParams(window.location.search);
const TEACHER_CODE = (params.get('t') || 'TEST').toUpperCase();
teacherCodeEl.textContent = TEACHER_CODE;

// --- Session + logging ---
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
let eventLog = []; // each entry: {ts, session_id, teacher_code, node_id, choice_text, next_id, correctness}

// Helper: push an event row
function logEvent({nodeId, choiceText, nextId, correctness=null}){
  eventLog.push({
    ts: new Date().toISOString(),
    session_id: SESSION_ID,
    teacher_code: TEACHER_CODE,
    node_id: nodeId,
    choice_text: choiceText,
    next_id: nextId,
    correctness // leave null for now; we can tag correct choices later
  });
}

// --- CSV download ---
function toCSV(rows){
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))];
  return lines.join('\n');
}
function downloadCSV(){
  if (eventLog.length === 0){
    alert('No events logged yet. Make some choices first!');
    return;
  }
  const csv = toCSV(eventLog);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bip_game_${TEACHER_CODE}_${SESSION_ID}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
downloadBtn.addEventListener('click', downloadCSV);

// --- Your existing code continues below ---
let state = {};
let currentScenario = 'reinforcement'; // Start with a fixed scenario
