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
const TEACHER_CODE = (params.get('t') || 'JF').toUpperCase(); // default = JF
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

function percentScore(){ return maxPossible>0 ? Math.round((points/maxPossible)*100) : 0; }
function summaryMessage(pct){
  return pct>=75
    ? "Nice work using antecedents, replacement skills, and chart moves—try it in class!"
    : "Review Jakob’s BIP: prompt replacement skills, deliver chart moves, and stay neutral.";
}
function clearSummary(){ const el=document.getElementById('session-summary'); if(el) el.remove(); }

/***** EMAIL RESULTS (via Google Apps Script) *****/
const RESULTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw0rHoBv6deNoy6avedLj5fj4JpCqt6r8B39UJmaNMeOYhRQfH6vbWKTgmTrhnC7cIy/exec';
const TO_EMAIL = 'jess.olson@utah.edu';

/***** Robust sender *****/
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
        method:'POST', mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=UTF-8'},
        body: json
      });
    }
  } catch (err) { resultsSent = false; }
}

/***** Jakob’s Multi-Step Scenarios *****/
const SCENARIOS = [
  {
    id: "proactive_chart_moves",
    title: "Morning Setup: Chart Moves & Choice",
    steps: [
      {
        prompt: "Step 1 — Arrival: You greet Jakob at the door.",
        answers: [
          { label: "Preview the schedule, remind how to earn chart moves, and offer a choice of chart sheet.", delta:+10, quality:"best" },
          { label: "Jump right into directions to start work.", delta:-10, quality:"wrong" },
          { label: "Say hi and let Jakob find a seat.", delta:0, quality:"meh" }
        ]
      },
      {
        prompt: "Step 2 — Task setup: Jakob hesitates with his materials.",
        answers: [
          { label: "Offer a choice (notebook or folder first) and say: “Do this to earn your first chart move.”", delta:+10, quality:"best" },
          { label: "Tell him to hurry because bell work is late.", delta:-10, quality:"wrong" },
          { label: "Place materials on the desk and walk away.", delta:0, quality:"meh" }
        ]
      },
      {
        prompt: "Step 3 — Reinforcement: Jakob starts working.",
        answers: [
          { label: "Give behavior-specific praise and mark a chart move.", delta:+10, quality:"best" },
          { label: "Say 'good job' without marking a chart move.", delta:0, quality:"meh" },
          { label: "Wait to praise until later.", delta:-10, quality:"wrong" }
        ]
      }
    ]
  },
  {
    id: "attention_hand_raise",
    title: "Attention Seeking: Vocalizations vs. Hand-Raise",
    steps: [
      {
        prompt: "Step 1 — During instruction, Jakob begins loud vocalizations to gain attention.",
        answers: [
          { label: "Prompt hand-raise/request attention and attend immediately when done correctly.", delta:+10, quality:"best" },
          { label: "Scold from across the room.", delta:-10, quality:"wrong" },
          { label: "Ignore without teaching the replacement.", delta:0, quality:"meh" }
        ]
      },
      {
        prompt: "Step 2 — Jakob tries to raise his hand but calls out again.",
        answers: [
          { label: "Shape the attempt—reinforce the partial hand-raise with praise + a chart move.", delta:+10, quality:"best" },
          { label: "Attend only after a perfect hand-raise.", delta:0, quality:"meh" },
          { label: "Ignore completely until behavior stops.", delta:-10, quality:"wrong" }
        ]
      },
      {
        prompt: "Step 3 — Jakob calls out during a peer comment.",
        answers: [
          { label: "Pre-correct: 'Next comment, show me hand-raise to earn another chart move.'", delta:+10, quality:"best" },
          { label: "Remind him to be quiet; continue teaching.", delta:0, quality:"meh" },
          { label: "Reprimand again for earlier calling out.", delta:-10, quality:"wrong" }
        ]
      }
    ]
  },
  {
    id: "escape_help_request",
    title: "Work Refusal: Requesting Help",
    steps: [
      {
        prompt: "Step 1 — Jakob is given an academic task and begins to refuse or say 'no'.",
        answers: [
          { label: "Offer a choice where to start and prompt 'ask for help' to earn a chart move.", delta:+10, quality:"best" },
          { label: "Firmly tell him to 'just do it'.", delta:-10, quality:"wrong" },
          { label: "Let him sit quietly without interaction.", delta:0, quality:"meh" }
        ]
      },
      {
        prompt: "Step 2 — Jakob quietly asks for help.",
        answers: [
          { label: "Provide quick scaffolded help, praise the request, and mark a chart move.", delta:+10, quality:"best" },
          { label: "Say 'later, finish first.'", delta:-10, quality:"wrong" },
          { label: "Give help but no praise/earn.", delta:0, quality:"meh" }
        ]
      },
      {
        prompt: "Step 3 — Momentum building.",
        answers: [
          { label: "Set a small goal ('Two lines, then check-in') and reinforce completion with chart move.", delta:+10, quality:"best" },
          { label: "Warn about losing recess for slow work.", delta:-10, quality:"wrong" },
          { label: "Ignore slow pace.", delta:0, quality:"meh" }
        ]
      }
    ]
  },
  {
    id: "within_class_elopement",
    title: "Within-Class Elopement",
    steps: [
      {
        prompt: "Step 1 — Jakob leaves the instructional area (>3ft away).",
        answers: [
          { label: "Use a calm, neutral prompt: 'Back to your spot to earn a chart move.'", delta:+10, quality:"best" },
          { label: "Physically block his path.", delta:-10, quality:"wrong" },
          { label: "Lecture about rules.", delta:0, quality:"meh" }
        ]
      },
      {
        prompt: "Step 2 — Jakob pauses near the boundary.",
        answers: [
          { label: "Offer a choice (chair or floor spot) + quick countdown to earn.", delta:+10, quality:"best" },
          { label: "Repeat the rule more firmly.", delta:0, quality:"meh" },
          { label: "Threaten loss of all rewards.", delta:-10, quality:"wrong" }
        ]
      },
      {
        prompt: "Step 3 — Jakob steps back toward his area.",
        answers: [
          { label: "Reinforce immediately—praise and mark a chart move.", delta:+10, quality:"best" },
          { label: "Say nothing and continue.", delta:0, quality:"meh" },
          { label: "Scold for leaving earlier.", delta:-10, quality:"wrong" }
        ]
      }
    ]
  }
];

const DEFAULT_ROUNDS = 3;
let rounds = [], roundIndex = 0, stepIndex = 0;

function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]];} return arr; }

/***** Home Screen *****/
function showHome(){
  clearSummary(); setPoints(0); maxPossible=0; eventLog=[]; resultsSent=false;
  scenarioTitle.textContent="Choose a Scenario";
  storyText.innerHTML="<p>Welcome to Mission: Reinforceable — a quick simulation to practice your BIP in action. In each short scenario, select the teacher move that keeps the plan on track. Some options earn full points, others are partial or off-plan. See how your choices add up by the end! Select a scenairio to start!.</p>";
  choicesDiv.innerHTML="";
  SCENARIOS.forEach(sc=>{
    const btn=document.createElement('button');
    btn.classList.add('home-card');
    btn.innerHTML=`<div class='home-title'>${sc.title}</div>`;
    btn.addEventListener('click',()=>startGame({mode:'single',scenarioId:sc.id}));
    choicesDiv.appendChild(btn);
  });
  const mix=document.createElement('button');
  mix.classList.add('home-card','accent');
  mix.innerHTML="<div class='home-title'>Random Mix</div>";
  mix.addEventListener('click',()=>startGame({mode:'mix'}));
  choicesDiv.appendChild(mix);
}

/***** Start Game *****/
function startGame({mode='mix',scenarioId=null}={}){
  clearSummary(); resultsSent=false; setPoints(0); maxPossible=0; eventLog=[];
  if(mode==='single'&&scenarioId){const sc=SCENARIOS.find(s=>s.id===scenarioId);rounds=sc?[sc]:[SCENARIOS[0]];}
  else{rounds=shuffle([...SCENARIOS]).slice(0,DEFAULT_ROUNDS);}
  roundIndex=0; stepIndex=0; updateTitle(); showCurrentStep();
}

function updateTitle(){
  const totalRounds=rounds.length;
  const currentScenario=rounds[roundIndex];
  const totalSteps=currentScenario?.steps?.length||1;
  scenarioTitle.textContent=`Round ${Math.min(roundIndex+1,totalRounds)} of ${totalRounds} — Step ${Math.min(stepIndex+1,totalSteps)} of ${totalSteps}`;
}

function showCurrentStep(){
  const scenario=rounds[roundIndex]; if(!scenario)return showEnd();
  const step=scenario.steps[stepIndex];
  storyText.textContent=step.prompt;
  choicesDiv.innerHTML='';
  shuffle(step.answers.map(a=>({...a}))).forEach(ans=>{
    const btn=document.createElement('button');
    btn.textContent=ans.label; // no (+10/0/-10)
    btn.addEventListener('click',()=>handleAnswer(scenario,step,ans));
    choicesDiv.appendChild(btn);
  });
}

function handleAnswer(scenario,step,answer){
  maxPossible+=10; addPoints(answer.delta);
  logEvent({
    nodeId:`${scenario.id}:step${stepIndex+1}`,
    choiceText:answer.label,
    nextId:null,
    correctness:answer.quality,
    points_awarded:answer.delta,
    points_total:points
  });
  const totalSteps=scenario.steps.length;
  if(stepIndex+1<totalSteps){stepIndex++;updateTitle();showCurrentStep();}
  else if(roundIndex+1<rounds.length){roundIndex++;stepIndex=0;updateTitle();showCurrentStep();}
  else showEnd();
}

function showEnd(){
  choicesDiv.innerHTML=''; storyText.textContent="Session complete! Thanks for playing.";
  const restart=document.createElement('button'); restart.textContent="Play Random Mix Again"; restart.addEventListener('click',()=>startGame({mode:'mix'})); choicesDiv.appendChild(restart);
  const backHome=document.createElement('button'); backHome.classList.add('ghost'); backHome.textContent="Back to Home"; backHome.addEventListener('click',showHome); choicesDiv.appendChild(backHome);
  clearSummary(); const pct=percentScore();
  const wrap=document.createElement('div');
  wrap.id='session-summary';
  wrap.innerHTML=`<div style="font-weight:700;margin-bottom:6px;">Session Summary</div>
  <div>Score: <strong>${points}</strong> / ${maxPossible} (${pct}%)</div>
  <div style="margin-top:6px;">${summaryMessage(pct)}</div>`;
  choicesDiv.parentNode.insertBefore(wrap,choicesDiv);
  sendResultsIfNeeded();
}

function logEvent({nodeId,choiceText,nextId,correctness=null,points_awarded=0,points_total=0}){
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

window.addEventListener('load',showHome);
homeBtn?.addEventListener('click',showHome);
