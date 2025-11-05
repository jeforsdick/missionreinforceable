/* ============================================================
   Mission: Reinforceable  —  Shared Game Engine (engine.js)
   ============================================================ */

/***** DOM references *****/
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
let maxPossible = 0;
let resultsSent = false;

function setPoints(v){
  points = v;
  if(pointsEl){
    pointsEl.textContent = points;
    pointsEl.classList.remove('flash');
    requestAnimationFrame(()=>pointsEl.classList.add('flash'));
  }
}
function addPoints(n){ setPoints(points + n); }

function percentScore(){ 
  return maxPossible>0 ? Math.round((points/maxPossible)*100) : 0; 
}
function summaryMessage(pct){ 
  return pct>=75 
    ? "Amazing! Now let's go put it into practice." 
    : "You are missing some core components, please review the BIP and try again."; 
}
function clearSummary(){
  const el = document.getElementById('session-summary');
  if(el) el.remove();
}

/***** EMAIL RESULTS (via Google Apps Script) *****/
const RESULTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw0rHoBv6deNoy6avedLj5fj4JpCqt6r8B39UJmaNMeOYhRQfH6vbWKTgmTrhnC7cIy/exec';
const TO_EMAIL = 'jess.olson@utah.edu';

async function sendResultsIfNeeded() {
  if (resultsSent || !RESULTS_ENDPOINT) return;
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

  try {
    const json = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([json], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon(RESULTS_ENDPOINT, blob);
    } else {
      await fetch(RESULTS_ENDPOINT, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: json
      });
    }
  } catch (err) { resultsSent = false; }
}

/***** Game Engine (shared across teachers) *****/
const DEFAULT_ROUNDS = 3;
let rounds = [], roundIndex = 0, stepIndex = 0;

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/***** Boot function — called by each teacher’s script *****/
window.bootGame = function bootGame(){
  if (!window.SCENARIOS || !Array.isArray(window.SCENARIOS)){
    storyText.textContent = "Error: No scenarios loaded.";
    return;
  }
  window.STUDENT = window.STUDENT || 'the student';
  window.addEventListener('load', showHome);
  homeBtn?.addEventListener('click', showHome);
};

/***** Home Screen *****/
function showHome(){
  clearSummary();
  setPoints(0);
  maxPossible = 0;
  eventLog = [];
  resultsSent = false;

  scenarioTitle.textContent = "Choose a Scenario";
  storyText.innerHTML = `<p>Each scenario now has <strong>3 steps</strong>. Pick one to practice, or try a <em>Random Mix</em> (${DEFAULT_ROUNDS} scenarios × 3 steps each).</p>`;

  choicesDiv.innerHTML = "";

  window.SCENARIOS.forEach(sc => {
    const btn = document.createElement('button');
    btn.classList.add('home-card');
    btn.innerHTML = `<div class="home-title">${sc.title}</div>
                     <div class="home-sub">3 steps • +10/0/−10</div>`;
    btn.addEventListener('click', () => startGame({ mode:'single', scenarioId: sc.id }));
    choicesDiv.appendChild(btn);
  });

  const mix = document.createElement('button');
  mix.classList.add('home-card','accent');
  mix.innerHTML = `<div class="home-title">Random Mix</div>
                   <div class="home-sub">${DEFAULT_ROUNDS} scenarios • 3 steps each</div>`;
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
    const sc = window.SCENARIOS.find(s => s.id === scenarioId);
    rounds = sc ? [sc] : [window.SCENARIOS[0]];
  } else {
    rounds = shuffle([...window.SCENARIOS]).slice(0, DEFAULT_ROUNDS);
  }
  roundIndex = 0;
  stepIndex = 0;
  updateTitle();
  showCurrentStep();
}

/***** Step Navigation *****/
function updateTitle(){
  const totalRounds = rounds.length;
  const currentScenario = rounds[roundIndex];
  const totalSteps = currentScenario?.steps?.length || 1;
  scenarioTitle.textContent = 
    `Round ${Math.min(roundIndex+1,totalRounds)} of ${totalRounds} — Step ${Math.min(stepIndex+1,totalSteps)} of ${totalSteps}`;
}

function showCurrentStep(){
  const scenario = rounds[roundIndex];
  if (!scenario) return showEnd();

  const step = scenario.steps[stepIndex];
  const prompt = (step.prompt || '').replaceAll('${STUDENT}', window.STUDENT);
  storyText.textContent = prompt;

  choicesDiv.innerHTML = "";
  const shuffledAnswers = shuffle(step.answers.map(a => ({...a})));

  shuffledAnswers.forEach(ans => {
    const btn = document.createElement('button');
    btn.textContent = ans.label;
    btn.addEventListener('click', () => handleAnswer(scenario, step, ans));
    choicesDiv.appendChild(btn);
  });
}

/***** Handle Answers *****/
function handleAnswer(scenario, step, answer){
  maxPossible += 10;
  addPoints(answer.delta);

  logEvent({
    nodeId: `${scenario.id}:step${stepIndex+1}`,
    choiceText: answer.label,
    correctness: answer.quality,
    points_awarded: answer.delta,
    points_total: points
  });

  const totalSteps = scenario.steps.length;
  if (stepIndex + 1 < totalSteps){
    stepIndex += 1;
    updateTitle();
    showCurrentStep();
  } else if (roundIndex + 1 < rounds.length){
    roundIndex += 1;
    stepIndex = 0;
    updateTitle();
    showCurrentStep();
  } else {
    showEnd();
  }
}

/***** End Screen *****/
function showEnd(){
  choicesDiv.innerHTML = "";
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
    node_id:nodeId,
    choice_text:choiceText,
    next_id:nextId,
    correctness,
    points_awarded,
    points_total
  });
}
