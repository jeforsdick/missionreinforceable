/***** DOM *****/
const storyText = document.getElementById('story-text');
const choicesDiv = document.getElementById('choices');
const scenarioTitle = document.getElementById('scenario-title');
const teacherCodeEl = document.getElementById('teacher-code');
const downloadBtn = document.getElementById('download-csv');
const pointsEl = document.getElementById('points');

/***** Teacher code from URL (?t=CODE) *****/
const params = new URLSearchParams(window.location.search);
const TEACHER_CODE = (params.get('t') || 'TEST').toUpperCase();
if (teacherCodeEl) teacherCodeEl.textContent = TEACHER_CODE;

/***** Session + CSV log *****/
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
let eventLog = [];
function logEvent({nodeId, choiceText, nextId, correctness=null, points_awarded=0, points_total=0}){
  eventLog.push({
    ts:new Date().toISOString(),
    session_id:SESSION_ID,
    teacher_code:TEACHER_CODE,
    node_id:nodeId, choice_text:choiceText, next_id:nextId,
    correctness, points_awarded, points_total
  });
}
function toCSV(rows){
  if(!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}
function downloadCSV(){
  if(!eventLog.length){ alert('No events yet—make a choice first!'); return; }
  const blob = new Blob([toCSV(eventLog)], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `bip_game_${TEACHER_CODE}_${SESSION_ID}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
if(downloadBtn) downloadBtn.addEventListener('click', downloadCSV);

/***** Points + summary *****/
let points = 0;
let maxPossible = 0;              // +10 per graded click (has correctness)
let summaryShownForNodeId = null; // prevent duplicate box

function setPoints(v){
  points = v;
  if(pointsEl){
    pointsEl.textContent = points;
    pointsEl.classList.remove('flash');
    requestAnimationFrame(()=>pointsEl.classList.add('flash'));
  }
}
function addPoints(n){ setPoints(points + n); }

function percentScore(){ return maxPossible>0 ? Math.round((points/maxPossible)*100) : 0; }
function summaryMessage(pct){ return pct>=75 ? "Amazing! Now let's go put it into practice." : "You are missing some important components. Please review the BIP and try again."; }

function clearSummary(){
  const el = document.getElementById('session-summary');
  if(el) el.remove();
  summaryShownForNodeId = null;
}
function showSummary(){
  clearSummary();
  const pct = percentScore();
  const wrap = document.createElement('div');
  wrap.id = 'session-summary';
  wrap.innerHTML = `
    <div style="font-weight:700; margin-bottom:6px;">Session Summary</div>
    <div>Score: <strong>${points}</strong> / ${maxPossible} (${pct}%)</div>
    <div style="margin-top:6px;">${summaryMessage(pct)}</div>
  `;
  choicesDiv.parentNode.insertBefore(wrap, choicesDiv);
}

/***** Content *****/
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
    text: "You're in your classroom when a student bolts out the door. It's Alex, a child with autism known to elope when overstimulated. What do you do?",
    options: [
      { text: "Run after Alex immediately.", nextText: 3, correctness: 0 },
      { text: "Call the office for backup first.", nextText: 4, correctness: 1 }
    ]
  },
  {
    id: 3,
    text: "You sprint after Alex, but they're fast. They reach the exit doors before you. What now?",
    options: [
      { text: "Use Alex's name and a calming voice.", nextText: 5, correctness: 1 },
      { text: "Physically block the door.", nextText: 6, correctness: 0 }
    ]
  },
  {
    id: 4,
    text: "You radio for help. While waiting, Alex gets farther. You exit your room to see where they are.",
    options: [
      { text: "Split up with another teacher to search.", nextText: 7, correctness: 1 },
      { text: "Check the playground area alone.", nextText: 8, correctness: 0 }
    ]
  },
  {
    id: 5,
    text: "Alex slows down slightly and looks at you. You recall his favorite song and hum it.",
    options: [
      { text: "Approach slowly while singing.", nextText: 9, correctness: 1 },
      { text: "Try to grab him now.", nextText: 10, correctness: 0 }
    ]
  },
  { id: 6, text: "You block the door. Alex panics, pushes you hard, and runs. The situation escalates. Game over.",
    options: [ { text: "Restart", nextText: 1 } ] },
  {
    id: 7,
    text: "You find Alex near the parking lot. He's crying and seems overwhelmed.",
    options: [
      { text: "Sit at a distance and wait.", nextText: 9, correctness: 1 },
      { text: "Approach quickly and grab him.", nextText: 10, correctness: 0 }
    ]
  },
  { id: 8, text: "No sign of Alex. You get a call — he's out the front gate. The elopement wasn't contained in time. Game over.",
    options: [ { text: "Restart", nextText: 1 } ] },
  { id: 9, text: "Alex calms down and lets you near him. You gently guide him back inside using his visual schedule. Crisis averted. You win!",
    options: [ { text: "Play again", nextText: 1 } ] },
  { id: 10, text: "Alex panics at your sudden approach and runs away. The situation worsens. Game over.",
    options: [ { text: "Restart", nextText: 1 } ] },

  /* Proactive path */
  {
    id: 11,
    text: "Before class, you prepare a chart move system for Alex and place visual boundaries in the classroom. How do you start the day?",
    options: [
      { text: "Give Alex a clear visual schedule for the day.", nextText: 12, correctness: 1 },
      { text: "Jump straight into the lesson without preparation.", nextText: 13, correctness: 0 }
    ]
  },
  {
    id: 12,
    text: "Alex smiles when he sees his schedule. 'I know what's happening today!' he says with relief.",
    options: [
      { text: "Remind him about earning chart moves for staying in designated areas.", nextText: 14, correctness: 1 },
      { text: "Start the first activity without mentioning the reward system.", nextText: 15, correctness: 0 }
    ]
  },
  {
    id: 13,
    text: "Alex looks confused and anxious. He starts rocking and looking at the door.",
    options: [
      { text: "Stop and provide his visual schedule now.", nextText: 12, correctness: 1 },
      { text: "Ignore the warning signs and continue teaching.", nextText: 16, correctness: 0 }
    ]
  },
  {
    id: 14,
    text: "Alex points to his chair. 'If I stay here during math, I get a chart move, right?' He seems engaged with the system.",
    options: [
      { text: "Enthusiastically confirm and praise his understanding.", nextText: 17, correctness: 1 },
      { text: "Simply nod and begin teaching without emphasis.", nextText: 15, correctness: 0 }
    ]
  },
  {
    id: 15,
    text: "Alex stays in his seat but looks frequently at the door. He's not fully engaged in the lesson.",
    options: [
      { text: "Give specific praise and a chart move for staying in his area.", nextText: 17, correctness: 1 },
      { text: "Continue teaching without acknowledging his appropriate behavior.", nextText: 16, correctness: 0 }
    ]
  },
  {
    id: 16,
    text: "Alex stands up suddenly and walks toward the door. This is a precursor to elopement.",
    options: [
      { text: "Calmly remind him about earning chart moves and redirect.", nextText: 18, correctness: 1 },
      { text: "Tell him firmly to sit down immediately.", nextText: 19, correctness: 0 }
    ]
  },
  {
    id: 17,
    text: "'Alex, great job staying in your learning space! That's a chart move!' He smiles and continues working.",
    options: [
      { text: "Let him spin the reward wheel since he reached a special symbol.", nextText: 20, correctness: 1 },
      { text: "Continue with the lesson, maintaining the positive momentum.", nextText: 21, correctness: 1 }
    ]
  },
  {
    id: 18,
    text: "Alex hesitates, then returns to his seat. 'Can I get a chart move for coming back?' he asks.",
    options: [
      { text: "Yes! Immediately reinforce this replacement behavior.", nextText: 20, correctness: 1 },
      { text: "No, only rewards for never leaving.", nextText: 19, correctness: 0 }
    ]
  },
  { id: 19, text: "Alex becomes upset and runs out of the classroom. Your proactive plan failed. Game over.",
    options: [ { text: "Restart", nextText: 1 } ] },
  { id: 20, text: "Alex is thrilled with his chart move and reward. He completes the lesson without elopement. You win!",
    options: [ { text: "Play again", nextText: 1 } ] },
  {
    id:
