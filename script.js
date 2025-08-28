/***** Error banner so problems are visible on-page (handy while editing) *****/
window.addEventListener('error', (e) => {
  const box = document.createElement('div');
  box.style.cssText = 'position:sticky;top:0;z-index:9999;background:#b00020;color:#fff;padding:8px 12px;border-radius:8px;margin-bottom:8px;font-weight:700';
  box.textContent = 'JavaScript error: ' + e.message;
  document.body.prepend(box);
});

/***** DOM *****/
const storyText = document.getElementById('story-text');
const choicesDiv = document.getElementById('choices');
const scenarioTitle = document.getElementById('scenario-title');
const teacherCodeEl = document.getElementById('teacher-code');
const pointsEl = document.getElementById('points');

/***** Teacher code from URL (?t=CODE) *****/
const params = new URLSearchParams(window.location.search);
const TEACHER_CODE = (params.get('t') || 'TEST').toUpperCase();
if (teacherCodeEl) teacherCodeEl.textContent = TEACHER_CODE;

/***** Session + event log *****/
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
let eventLog = [];

/***** Points + summary tracking *****/
let points = 0;
let maxPossible = 0;              // +10 per graded click (has correctness)
let summaryShownForNodeId = null; // prevents duplicate box
let resultsSent = false;          // email once per session end

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
function summaryMessage(pct){ return pct>=75 ? "Amazing! Now let's go put it into practice." : "You are missing some core components, please review the BIP and try again."; }

function clearSummary(){
  const el = document.getElementById('session-summary');
  if(el) el.remove();
  summaryShownForNodeId = null;
}

/***** EMAIL RESULTS (via Google Apps Script) *****/
// 1) Create a Google Apps Script web app using the snippet I gave you.
// 2) Deploy and paste its URL below:
const RESULTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxex-Oxdog4qvvITF2C-PJjrfQbptLYEUK9FlQ4ddxK1M7fqJkTGox6S82ysm7FSVOJ/exec';
// This is the email the Apps Script will send to:
const TO_EMAIL = 'jess.olson@utah.edu'; // informational only—actual send happens in your Apps Script

async function sendResultsIfNeeded() {
  if (resultsSent || !RESULTS_ENDPOINT || RESULTS_ENDPOINT.startsWith('PASTE_')) return;
  resultsSent = true;

  const payload = {
    teacher_code: TEACHER_CODE,
    session_id: SESSION_ID,
    points,
    max_possible: maxPossible,
    percent: percentScore(),
    timestamp: new Date().toISOString(),
    to_email: TO_EMAIL,   // your Apps Script can read this, or just hardcode there
    log: eventLog
  };

  try {
    await fetch(RESULTS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const s = document.getElementById('session-summary');
    if (s) {
      const p = document.createElement('div');
      p.style.marginTop = '6px'; p.style.opacity = '0.85';
      p.textContent = 'Results sent. Thank you!';
      s.appendChild(p);
    }
  } catch (err) {
    const s = document.getElementById('session-summary');
    if (s) {
      const p = document.createElement('div');
      p.style.marginTop = '6px'; p.style.opacity = '0.85';
      p.textContent = 'Could not send results (maybe offline).';
      s.appendChild(p);
    }
    resultsSent = false; // allow retry if they hit another end
  }
}

/***** Show summary *****/
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

  // Send results once per end screen
  sendResultsIfNeeded();
}

/***** Log helper *****/
function logEvent({nodeId, choiceText, nextId, correctness=null, points_awarded=0, points_total=0}){
  eventLog.push({
    ts:new Date().toISOString(),
    session_id:SESSION_ID,
    teacher_code:TEACHER_CODE,
    node_id:nodeId, choice_text:choiceText, next_id:nextId,
    correctness, points_awarded, points_total
  });
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
    id: 21,
    text: "Alex works well for 20 minutes. During transition he looks anxious again.",
    options: [
      { text: "Show the next activity on his schedule and offer another earning opportunity.", nextText: 20, correctness: 1 },
      { text: "Rush the transition to save time.", nextText: 19, correctness: 0 }
    ]
  }
];

/***** Engine *****/
function showTextNode(textNodeId) {
  const textNode = textNodes.find(n => n.id === textNodeId);
  if (!textNode) return;

  if (textNodeId === 1) clearSummary(); // clear on start

  storyText.textContent = textNode.text;

  while (choicesDiv.firstChild) choicesDiv.removeChild(choicesDiv.firstChild);

  textNode.options.forEach(option => {
    const btn = document.createElement('button');
    btn.textContent = option.text;
    btn.addEventListener('click', () => selectOption(textNode, option));
    choicesDiv.appendChild(btn);
  });

  // show summary when entering a terminal node
  if (textNode.options.some(o => /restart|play again/i.test(o.text))) {
    if (summaryShownForNodeId !== textNode.id) {
      summaryShownForNodeId = textNode.id;
      showSummary();
    }
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
    resultsSent = false; // new run can send again
  }

  showTextNode(nextTextNodeId);
}

/***** Start *****/
window.addEventListener('load', () => {
  if (scenarioTitle) scenarioTitle.textContent = "Mission: Reinforceable";
  setPoints(0);
  showTextNode(1);
});
