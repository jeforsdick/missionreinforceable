/***** DOM handles *****/
const storyText = document.getElementById('story-text');
const choicesDiv = document.getElementById('choices');
const scenarioTitle = document.getElementById('scenario-title');
const teacherCodeEl = document.getElementById('teacher-code');
const downloadBtn = document.getElementById('download-csv');
const pointsEl = document.getElementById('points');

/***** Teacher code from URL (?t=JESS01) *****/
const params = new URLSearchParams(window.location.search);
const TEACHER_CODE = (params.get('t') || 'TEST').toUpperCase();
if (teacherCodeEl) teacherCodeEl.textContent = TEACHER_CODE;

/***** Session + logging *****/
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
let eventLog = [];

/***** Points (UI + helpers) *****/
let points = 0;
function setPoints(v){
  points = v;
  if (pointsEl){
    pointsEl.textContent = points;
    pointsEl.classList.remove('flash');
    requestAnimationFrame(() => pointsEl.classList.add('flash'));
  }
}
function addPoints(n){ setPoints(points + n); }

/***** Summary tracking *****/
let maxPossible = 0;   // +10 per graded step
let summaryShownForNodeId = null;

/***** CSV helpers *****/
function logEvent({nodeId, choiceText, nextId, correctness=null, points_awarded=0, points_total=points}) {
  eventLog.push({
    ts: new Date().toISOString(),
    session_id: SESSION_ID,
    teacher_code: TEACHER_CODE,
    node_id: nodeId,
    choice_text: choiceText,
    next_id: nextId,
    correctness,
    points_awarded,
    points_total
  });
}
function toCSV(rows){
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))];
  return lines.join('\n');
}
function downloadCSV(){
  if (!eventLog.length){ alert('No events yet—make a choice first!'); return; }
  const blob = new Blob([toCSV(eventLog)], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `bip_game_${TEACHER_CODE}_${SESSION_ID}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
if (downloadBtn) downloadBtn.addEventListener('click', downloadCSV);

/***** Helpers for summary *****/
function isTerminalNode(node) {
  return node && node.options && node.options.some(o => /restart|play again/i.test(o.text));
}
function percentScore() {
  return maxPossible > 0 ? Math.round((points / maxPossible) * 100) : 0;
}
function summaryMessage(pct) {
  return pct >= 75
    ? "Good job! Your plan is strong—keep it up."
    : "Review the BIP and try again.";
}
function clearSummary() {
  const el = document.getElementById('session-summary');
  if (el) el.remove();
  summaryShownForNodeId = null;
}
function showSummary() {
  clearSummary();
  const pct = percentScore();
  const wrap = document.createElement('div');
  wrap.id = 'session-summary';
  wrap.style.margin = '14px 0 0';
  wrap.style.padding = '12px 14px';
  wrap.style.border = '1px solid #444';
  wrap.style.borderRadius = '10px';
  wrap.style.background = '#2a2a2a';
  wrap.innerHTML = `
    <div style="font-weight:700; margin-bottom:6px;">Session Summary</div>
    <div>Score: <strong>${points}</strong> / ${maxPossible} (${pct}%)</div>
    <div style="margin-top:6px;">${summaryMessage(pct)}</div>
  `;
  choicesDiv.parentNode.insertBefore(wrap, choicesDiv);
}

/***** Game content (abbreviated for clarity) *****/
const textNodes = [
  {
    id: 1,
    text: "Welcome to your classroom. Today, you'll face real-time decisions with Alex. Choose a path to begin:",
    options: [
      { text: "Start the day with proactive strategies.", nextText: 11 },
      { text: "Crisis mode: Alex bolts from the room.", nextText: 2 }
    ]
  },
  {
    id: 2,
    text: "Alex bolts out the door. What do you do?",
    options: [
      { text: "Run after Alex immediately.", nextText: 3, correctness: 0 },
      { text: "Call the office for backup first.", nextText: 4, correctness: 1 }
    ]
  },
  // … keep your other nodes here with correctness: 1 or 0 …
  { id: 6, text: "Game over.", options: [ { text: "Restart", nextText: 1 } ] },
  { id: 9, text: "Crisis averted. You win!", options: [ { text: "Play again", nextText: 1 } ] },
  // etc.
];

/***** Engine *****/
function showTextNode(textNodeId) {
  const textNode = textNodes.find(n => n.id === textNodeId);
  if (!textNode) return;

  if (textNodeId === 1) clearSummary();  // remove summary on restart

  storyText.textContent = textNode.text;
  while (choicesDiv.firstChild) choicesDiv.removeChild(choicesDiv.firstChild);

  textNode.options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option.text;
    btn.addEventListener('click', () => selectOption(textNode, option));
    choicesDiv.appendChild(btn);
  });

  if (isTerminalNode(textNode) && summaryShownForNodeId !== textNode.id) {
    summaryShownForNodeId = textNode.id;
    showSummary();
  }
}

function selectOption(currentNode, option) {
  const nextTextNodeId = option.nextText;
  const correctness = typeof option.correctness !== 'undefined' ? option.correctness : null;

  let award = 0;
  if (correctness === 1) award = 10;
  else if (correctness === 0.5) award = 5;

  if (correctness !== null) maxPossible += 10;
  addPoints(award);

  logEvent({
    nodeId: currentNode.id,
    choiceText: option.text,
    nextId: nextTextNodeId,
    correctness,
    points_awarded: award,
    points_total: points
  });

  if (nextTextNodeId === 1) {
    setPoints(0);
    maxPossible = 0;
    clearSummary();
  }

  showTextNode(nextTextNodeId);
}

/***** Start *****/
window.addEventListener('load', () => {
  if (scenarioTitle) scenarioTitle.textContent = "Mission: Reinforceable";
  setPoints(0);
  showTextNode(1);
});
