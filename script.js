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
const homeBtn = document.getElementById('home-btn');

/***** Teacher code from URL (?t=CODE) *****/
const params = new URLSearchParams(window.location.search);
const TEACHER_CODE = (params.get('t') || 'TEST').toUpperCase();
if (teacherCodeEl) teacherCodeEl.textContent = TEACHER_CODE;

/***** Session + event log *****/
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
let eventLog = [];

/***** Points + summary tracking *****/
let points = 0;
let maxPossible = 0;              // +10 per step (best answers are +10)
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
}

/***** EMAIL RESULTS (via Google Apps Script) *****/
// Paste your deployed Web App /exec URL here:
const RESULTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw0rHoBv6deNoy6avedLj5fj4JpCqt6r8B39UJmaNMeOYhRQfH6vbWKTgmTrhnC7cIy/exec';
const TO_EMAIL = 'jess.olson@utah.edu'; // informational (Apps Script uses its own TO)

/***** Robust sender: beacon first, then fetch(no-cors) *****/
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
    to_email: TO_EMAIL,
    log: eventLog
  };

  // ensure a status line in the summary
  let statusLine = document.getElementById('send-status');
  if (!statusLine) {
    const s = document.getElementById('session-summary');
    statusLine = document.createElement('div');
    statusLine.id = 'send-status';
    statusLine.style.marginTop = '6px';
    statusLine.style.opacity = '0.85';
    s && s.appendChild(statusLine);
  }
  const setStatus = (t) => { if (statusLine) statusLine.textContent = t; };

  try {
    const json = JSON.stringify(payload);

    // Try sendBeacon (very CORS-friendly)
    let queued = false;
    if (navigator.sendBeacon) {
      const blob = new Blob([json], { type: 'text/plain;charset=UTF-8' });
      queued = navigator.sendBeacon(RESULTS_ENDPOINT, blob);
      if (queued) setStatus('Results sent.');
    }

    // Fallback to fetch + no-cors (simple request with text/plain)
    if (!queued) {
      await fetch(RESULTS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: json
      });
      setStatus('Thank you');
    }
  } catch (err) {
    setStatus('Could not send results: ' + (err?.message || String(err)));
    resultsSent = false; // allow retry on another end screen
    return;
  }

  // show completion note (we can't read response in no-cors; this confirms we fired)
  const s = document.getElementById('session-summary');
  if (s) {
    const p = document.createElement('div');
    p.style.marginTop = '6px'; p.style.opacity = '0.85';
    p.textContent = 'Thank You.';
    s.appendChild(p);
  }
}

/***** Multi‑step scenarios *****/

// Welcome to Mission: Reinforceable — a quick simulation to practice your BIP in action. In each short scenario, select the teacher move that keeps the plan on track. Some options earn full fidelity, others are partial or off-plan. See how your choices add up by the end!.
const SCENARIOS = [
  {
    id: "elope_crisis",
    title: "Elopement During Math",
    steps: [
      {
        prompt: "Step 1 — Early signs: Alex fidgets and glances at the door as math begins.",
        answers: [
          { label: "Briefly review expectations and offer first chance to earn.", delta: +10, quality: "best" },
          { label: "Ignore and start the lesson quickly.", delta: -10, quality: "wrong" },
          { label: "Ask the class to settle while you observe.", delta: 0, quality: "meh" },
        ]
      },
      {
        prompt: "Step 2 — Escalation: Alex stands and moves toward the door.",
        answers: [
          { label: "Use calm voice + visual: “Let’s earn a move—sit with me, then break.”", delta: +10, quality: "best" },
          { label: "Block the door and raise your voice.", delta: -10, quality: "wrong" },
          { label: "Stand nearby and wait him out.", delta: 0, quality: "meh" },
        ]
      },
      {
        prompt: "Step 3 — Recovery: He pauses and looks back at you.",
        answers: [
          { label: "Praise the pause, guide to seat, deliver the earned move.", delta: +10, quality: "best" },
          { label: "Lecture about safety for a minute.", delta: -10, quality: "wrong" },
          { label: "Quietly resume class without comment.", delta: 0, quality: "meh" },
        ]
      }
    ]
  },
  {
    id: "proactive_start",
    title: "Proactive Morning Setup",
    steps: [
      {
        prompt: "Step 1 — Arrival: You greet Alex at the door.",
        answers: [
          { label: "Connect, preview schedule, and cue first earning opportunity.", delta: +10, quality: "best" },
          { label: "Jump right into instructions to save time.", delta: -10, quality: "wrong" },
          { label: "Say hi and let him find his desk.", delta: 0, quality: "meh" },
        ]
      },
      {
        prompt: "Step 2 — Materials: Alex hesitates to get out his notebook.",
        answers: [
          { label: "Offer choice + prompt: “Notebook or folder first to earn.”", delta: +10, quality: "best" },
          { label: "Tell him to hurry because bell work is late.", delta: -10, quality: "wrong" },
          { label: "Place materials on desk and walk away.", delta: 0, quality: "meh" },
        ]
      },
      {
        prompt: "Step 3 — Momentum: He begins, then slows as peers chat.",
        answers: [
          { label: "Reinforce early starts, add brief goal: “Two lines, then check‑in.”", delta: +10, quality: "best" },
          { label: "Remind the class sternly to be quiet.", delta: -10, quality: "wrong" },
          { label: "Ignore the chatter; he’ll re‑engage.", delta: 0, quality: "meh" },
        ]
      }
    ]
  },
  {
    id: "transition_jitters",
    title: "Transition Jitters",
    steps: [
      {
        prompt: "Step 1 — Pre‑transition: The next activity is P.E.; Alex tenses up.",
        answers: [
          { label: "Preview the plan + coping option + earning chance.", delta: +10, quality: "best" },
          { label: "Announce the transition and line up now.", delta: -10, quality: "wrong" },
          { label: "Ask a peer to lead him to the line.", delta: 0, quality: "meh" },
        ]
      },
      {
        prompt: "Step 2 — Lining up: He lags behind and looks toward the hallway.",
        answers: [
          { label: "Give a brief prompt with choice + count of steps to earn.", delta: +10, quality: "best" },
          { label: "Warn that he’ll lose recess if he doesn’t hurry.", delta: -10, quality: "wrong" },
          { label: "Move the class forward and let him catch up.", delta: 0, quality: "meh" },
        ]
      },
      {
        prompt: "Step 3 — At the door: He takes a deep breath.",
        answers: [
          { label: "Reinforce the coping, then deliver the promised earn item.", delta: +10, quality: "best" },
          { label: "Remind him how hard this is and to be brave.", delta: -10, quality: "wrong" },
          { label: "Give a thumbs up and proceed.", delta: 0, quality: "meh" },
        ]
      }
    ]
  }
];

// Random Mix will select scenarios; each scenario has 3 steps.
const DEFAULT_ROUNDS = 3;

let rounds = [];     // array of scenarios
let roundIndex = 0;  // which scenario
let stepIndex = 0;   // which step within current scenario

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/***** Home Screen *****/
function showHome(){
  clearSummary();
  setPoints(0);
  maxPossible = 0;
  eventLog = [];
  resultsSent = false;

  scenarioTitle && (scenarioTitle.textContent = "Choose a Scenario");
  storyText.innerHTML = `<p>Each scenario now has <strong>3 steps</strong>. Pick one to practice, or try a <em>Random Mix</em>.</p>`;

  // Clear choices and render home buttons
  while (choicesDiv.firstChild) choicesDiv.removeChild(choicesDiv.firstChild);

  // Single-scenario buttons
  SCENARIOS.forEach(sc => {
    const btn = document.createElement('button');
    btn.classList.add('home-card');
    btn.innerHTML = `<div class="home-title">${sc.title}</div>`;
    btn.addEventListener('click', () => startGame({ mode:'single', scenarioId: sc.id }));
    choicesDiv.appendChild(btn);
  });

  // Random mix option
  const mix = document.createElement('button');
  mix.classList.add('home-card','accent');
  mix.innerHTML = `<div class="home-title">Random Mix</div>`;
  mix.addEventListener('click', () => startGame({ mode:'mix' }));
  choicesDiv.appendChild(mix);
}

/***** Start Game *****/
function startGame({mode='mix', scenarioId=null} = {}){
  clearSummary();
  resultsSent = false;
  setPoints(0);
  maxPossible = 0;
  eventLog = [];

  if (mode === 'single' && scenarioId){
    const sc = SCENARIOS.find(s => s.id === scenarioId);
    rounds = sc ? [sc] : [SCENARIOS[0]];
  } else {
    // choose up to DEFAULT_ROUNDS unique scenarios at random
    rounds = shuffle([...SCENARIOS]).slice(0, DEFAULT_ROUNDS);
  }
  roundIndex = 0;
  stepIndex = 0;
  updateTitle();
  showCurrentStep();
}

function updateTitle(){
  const totalRounds = rounds.length;
  const currentScenario = rounds[roundIndex];
  const totalSteps = currentScenario?.steps?.length || 1;
  scenarioTitle && (scenarioTitle.textContent =
    `Round ${Math.min(roundIndex+1,totalRounds)} of ${totalRounds} — Step ${Math.min(stepIndex+1,totalSteps)} of ${totalSteps}`);
}

function showCurrentStep(){
  const scenario = rounds[roundIndex];
  if (!scenario) return showEnd();

  const step = scenario.steps[stepIndex];
  storyText.textContent = step.prompt;

  while (choicesDiv.firstChild) choicesDiv.removeChild(choicesDiv.firstChild);

  const shuffledAnswers = shuffle(step.answers.map(a => ({...a})));

  shuffledAnswers.forEach(ans => {
    const btn = document.createElement('button');
    btn.textContent = ans.label;
    btn.addEventListener('click', () => handleAnswer(scenario, step, ans));
    choicesDiv.appendChild(btn);
  });
}

function handleAnswer(scenario, step, answer){
  // Scoring: each step has a best worth +10.
  maxPossible += 10;
  addPoints(answer.delta);

  logEvent({
    nodeId: `${scenario.id}:step${stepIndex+1}`,
    choiceText: answer.label,
    nextId: null,
    correctness: answer.quality, // 'best','meh','wrong'
    points_awarded: answer.delta,
    points_total: points
  });

  // Advance to next step or next round
  const totalSteps = scenario.steps.length;
  if (stepIndex + 1 < totalSteps){
    stepIndex += 1;
    updateTitle();
    showCurrentStep();
  } else {
    // next scenario
    if (roundIndex + 1 < rounds.length){
      roundIndex += 1;
      stepIndex = 0;
      updateTitle();
      showCurrentStep();
    } else {
      showEnd();
    }
  }
}

function showEnd(){
  // End screen with summary + restart
  while (choicesDiv.firstChild) choicesDiv.removeChild(choicesDiv.firstChild);
  storyText.textContent = "Session complete! Thanks for playing.";
  const restart = document.createElement('button');
  restart.textContent = "Play Random Mix Again";
  restart.addEventListener('click', () => startGame({mode:'mix'}));
  choicesDiv.appendChild(restart);

  const backHome = document.createElement('button');
  backHome.classList.add('ghost');
  backHome.textContent = "Back to Home";
  backHome.addEventListener('click', showHome);
  choicesDiv.appendChild(backHome);

  // Summary box
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

/***** Start *****/
window.addEventListener('load', () => {
  showHome();
});

// Home button
homeBtn?.addEventListener('click', showHome);
