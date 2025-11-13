/**********************************************************
 * Mission: Reinforceable — Classic UI + Multi-Mode Engine
 * - Classic UI + wizard pod preserved
 * - Three modes: Daily Drill / Emergency Sim / Shuffle Quest
 * - Scenario pools + daily-seeded randomness
 * - Choices shuffled every step
 * - Updated for branching multi-step scenarios with endings
 **********************************************************/

/* -------- DOM refs -------- */
const storyText       = document.getElementById('story-text');
const choicesDiv      = document.getElementById('choices');
const scenarioTitle   = document.getElementById('scenario-title');
const pointsEl        = document.getElementById('points');
const feedbackEl      = document.getElementById('feedback');
const feedbackTextEl  = document.getElementById('feedback-text');
const coachImgEl      = document.getElementById('coach-img');

/* -------- Wizard sprites (same folder as index.html) -------- */
const WIZ = {
  plus:  'mr-wizard-plus10.png',
  meh:   'mr-wizard-0.png',
  minus: 'mr-wizard-minus10.png',
  think: 'mr-wizard-think.png'   // ← NEW
};

// Always show a sprite immediately and avoid stale-cache
function setWizardSprite(state) {
  const src = WIZ[state] || WIZ.meh;  // Handles 'plus', 'minus', 'think', defaults to 'meh'
  if (coachImgEl) coachImgEl.src = `${src}?v=${Date.now()}`;
}
// default image on load
setWizardSprite('meh');

/* -------- Scoring -------- */
let points = 0;
let maxPossible = 0; // 10 per scored decision

function setPoints(v) {
  points = v;
  if (pointsEl) {
    pointsEl.textContent = points;
    pointsEl.classList.remove('flash');
    requestAnimationFrame(() => pointsEl.classList.add('flash'));
  }
}
function addPoints(delta) {
  if (typeof delta === 'number') {
    maxPossible += 10;
    setPoints(points + delta);
  }
}
function resetGame() {
  points = 0;
  maxPossible = 0;
  events = [];          
  sentThisRun = false;  
  SESSION_ID = newSessionId(); 
  setPoints(0);
  showFeedback('', null, 0);
}
function percentScore() { return maxPossible > 0 ? Math.round((points / maxPossible) * 100) : 0; }
function fidelityMessage() {
  const pct = percentScore();
  if (pct >= 80) return "Nice work! Your decisions closely matched the Behavior Intervention Plan. You consistently used proactive supports, taught/prompted replacement behaviors, and reinforced the right moves.";
  if (pct >= 50) return "Some of your moves aligned with the plan, but key supports were missed. Revisit early prompts, clear expectations, and high-frequency reinforcement, then try again.";
  return "This run drifted from the plan. Focus on: (a) proactive setup, (b) prompting & reinforcing the replacement behavior, and (c) using the crisis steps as written. Replay to tighten fidelity.";
}

/* -------- Feedback UI -------- */
function showFeedback(text, type, scoreHint) {
  if (!feedbackEl || !feedbackTextEl) return;

  let state = 'meh';
  if (typeof scoreHint === 'number') state = scoreHint > 0 ? 'plus' : scoreHint < 0 ? 'minus' : 'meh';
  else if (type === 'correct') state = 'plus';

  setWizardSprite(state);

  feedbackEl.classList.remove('state-plus','state-meh','state-minus','flash');
  feedbackEl.classList.add(`state-${state}`);
  feedbackTextEl.textContent = text || '';
  requestAnimationFrame(() => feedbackEl.classList.add('flash'));
}

/* ===== RESULTS: client → GAS webhook ===== */
const RESULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbw9bWb3oUhoIl7hRgEm1nPyr_AKbLriHpQQGwcEn94xVfHFSPEvxE09Vta8D4ZqGYuT/exec";

function getTeacherCode() {
  const u = new URL(window.location.href);
  return (u.searchParams.get("teacher")
       || document.getElementById("teacher-code")?.textContent
       || "—").trim();
}
function setTeacherBadge(code) {
  const el = document.getElementById("teacher-code");
  if (el && code && el.textContent !== code) el.textContent = code;
}

function newSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}
let SESSION_ID = newSessionId();
let events = [];
let sentThisRun = false;

function logDecision(nodeId, opt) {
  events.push({
    t: new Date().toISOString(),
    nodeId,
    delta: (typeof opt.delta === "number" ? opt.delta : null),
    choice: opt.text
  });
}

function sendResultsOnce() {
  if (sentThisRun) return;
  sentThisRun = true;

  const payload = {
    teacher_code: getTeacherCode(),
    session_id:   SESSION_ID,
    points,
    max_possible: maxPossible,
    percent:      percentScore(),
    timestamp:    new Date().toISOString(),
    log:          events
  };

  try {
    fetch(RESULT_ENDPOINT, {
      method: "POST",
      mode: "no-cors",          
      body: JSON.stringify(payload)
    });
  } catch (e) {
    // Swallow errors
  }
}

/* -------- Utilities -------- */
function shuffledOptions(options) { return (options || []).map(o => ({...o})).sort(() => Math.random() - 0.5); }
function shuffle(a, rnd=Math.random){ const x=[...a]; for(let i=x.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1)); [x[i],x[j]]=[x[j],x[i]];} return x; }
function sample(pool, k, rnd=Math.random){ return shuffle(pool, rnd).slice(0, Math.min(k, pool.length)); }
function seedFromDate(){
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  let h = 0; for(let i=0;i<key.length;i++){ h=(h<<5)-h+key.charCodeAt(i); h|=0; }
  return Math.abs(h);
}
function srandom(seed){ let x=(seed>>>0)||1234567; return function(){ x^=x<<13; x^=x>>>17; x^=x<<5; return ((x>>>0)/4294967295); }; }

/* ============================================================
   CONTENT POOLS — YOUR NEW BRANCHING SCENARIOS
   ============================================================ */

/*************************************************
 * SCENARIO DATA POOL
 * - 10 daily
 * - 5 crisis
 * - 5 wildcard
 **************************************************/
const POOL = {
  daily: [],
  crisis: [],
  wild: []
};

/*************************************************
 * DAILY SCENARIO 1 — Morning Independent Work
 * Hybrid branching: step1 → step2A/B/C → step3A/B/C → step4 endings
 **************************************************/
POOL.daily.push({
  id: "daily_1_morning_independent",
  title: "Daily Mission: Morning Independent Work",
  start: "step1",
  steps: {
    // ---------- STEP 1 ----------
    step1: {
      text: "JM enters the classroom and sees his morning work on his desk. He looks overwhelmed, shifts in his seat, and glances toward the door.",
      choices: {
        A: {
          text: "Remind him he only needs to complete 50% and review how he earns Mario coins.",
          score: 10,
          feedback: "Great job! You reduced the task demand and made expectations clear. This supports JM's replacement behavior and lowers the chance of escape. He takes a deep breath and slows his movements.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Try your best,” without reviewing expectations.",
          score: 0,
          feedback: "This is a neutral choice. JM hears that he should try, but he still doesn't know what is expected. He keeps tapping his pencil and looks unsure.",
          next: "step2B"
        },
        C: {
          text: "Tell him he needs to complete all of the work today.",
          score: -10,
          feedback: "This increases the demand and makes escape more likely. JM pushes his chair back and looks toward the door, showing signs of avoidance.",
          next: "step2C"
        }
      }
    },
    // ---------- STEP 2A (improving path) ----------
    step2A: {
      text: "JM slows his movement and looks at you for reassurance.",
      choices: {
        A: {
          text: "Prompt him to request a break before starting work.",
          score: 10,
          feedback: "Excellent! Prompting a break keeps JM in the replacement behavior pathway. He considers the option calmly and prepares to ask.",
          next: "step3A"
        },
        B: {
          text: "Wait quietly to see if he begins working on his own.",
          score: 0,
          feedback: "Neutral choice. Giving space is not harmful, but JM still seems unsure about what to do. He hesitates over the paper.",
          next: "step3B"
        },
        C: {
          text: "Say, “No breaks yet—let's get going.”",
          score: -10,
          feedback: "Denying breaks removes access to his replacement behavior. This increases anxiety and escape motivation. JM stiffens and looks away.",
          next: "step3C"
        }
      }
    },
    // ---------- STEP 2B (neutral path) ----------
    step2B: {
      text: "JM taps his pencil and glances toward the calm-down corner.",
      choices: {
        A: {
          text: "Prompt a break request before he escalates.",
          score: 10,
          feedback: "Nice move. You offer an appropriate escape option that matches his BIP. JM starts to calm and look more regulated.",
          next: "step3A"
        },
        B: {
          text: "Give him space to see if he settles.",
          score: 0,
          feedback: "Neutral. This might help, but JM still looks uncertain and hasn't engaged with the work yet.",
          next: "step3B"
        },
        C: {
          text: "Tell him he needs to stay in his seat.",
          score: -10,
          feedback: "Redirecting without offering the replacement behavior increases the chance of avoidance. JM's tapping becomes more intense.",
          next: "step3C"
        }
      }
    },
    // ---------- STEP 2C (escalation path) ----------
    step2C: {
      text: "JM pushes his chair and starts pacing across the room.",
      choices: {
        A: {
          text: "Offer a prompt to request a break calmly.",
          score: 10,
          feedback: "Great repair strategy. You give JM a safe way to escape the task without eloping. He slows slightly and listens.",
          next: "step3A"
        },
        B: {
          text: "Tell him you'll help him in a moment.",
          score: 0,
          feedback: "Neutral. This may or may not help him calm down, but it doesn't teach or reinforce his replacement behavior.",
          next: "step3B"
        },
        C: {
          text: "Redirect him back to his desk.",
          score: -10,
          feedback: "Redirecting during escalation can increase running or aggression. JM pulls away and speeds up his pacing.",
          next: "step3C"
        }
      }
    },
    // ---------- STEP 3A (positive path, merge) ----------
    step3A: {
      text: "JM uses his replacement behavior and requests a break appropriately.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice work. JM accessed his replacement behavior and is ready to regulate with a break.",
          next: "step4"
        }
      }
    },
    // ---------- STEP 3B (neutral path, merge) ----------
    step3B: {
      text: "JM stays near his desk but doesn't start working. He looks stuck.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He has not escalated, but he also hasn't engaged. He may need a clear, supportive next step.",
          next: "step4"
        }
      }
    },
    // ---------- STEP 3C (escalated path, merge) ----------
    step3C: {
      text: "JM begins jogging in small circles or moving toward the classroom door.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "JM is escalating. A supportive response is needed quickly to prevent elopement or aggression.",
          next: "step4"
        }
      }
    },
    // ---------- STEP 4 (final decision & endings) ----------
    step4: {
      text: "You now decide how to respond to JM's current behavior and his need for a break.",
      choices: {
        A: {
          text: "Honor his break immediately, start the 5-minute timer, and reinforce his return.",
          score: 10,
          feedback: "Excellent fidelity to the BIP. You reinforce JM's replacement behavior, support regulation, and keep him engaged in the routine.",
          ending: "success"
        },
        B: {
          text: "Allow a break after a short delay and offer help when you can.",
          score: 0,
          feedback: "Partial implementation. JM eventually gets a break and some support, but the delay may increase stress and reduce instructional time.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to return to work independently without a break.",
          score: -10,
          feedback: "This removes access to his replacement behavior and increases the chance of escape-maintained behavior. JM is more likely to escalate or leave his area, and additional staff support may be needed.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – High-Fidelity Morning Routine",
      text: "You followed JM's BIP closely. He accessed his break through the replacement behavior, regulated in the calm-down corner, and returned to finish part of his work. The class routine stayed mostly on track."
    },
    mixed: {
      title: "Mixed Outcome – Some Support, Some Escalation Risk",
      text: "You used pieces of the BIP, but delays and unclear expectations made the routine less smooth. JM eventually worked with support, but stress and lost instructional time were higher than they needed to be."
    },
    fail: {
      title: "Escalation – Low-Fidelity Implementation",
      text: "JM did not have consistent access to his replacement behavior or break. His behavior escalated, increasing the likelihood of elopement or aggression. Reviewing proactive strategies, reduced demands, and timely breaks could improve outcomes next time."
    }
  }
});

/* Add all other scenarios here - DAILY 2 to 10, CRISIS 1 to 5, WILD 1 to 5 */
/* (Full content from your original - paste here to complete) */

/* ============================================================
   DYNAMIC MISSION BUILDER — ADAPTED FOR BRANCHING
   ============================================================ */
function renderIntroCards() {
  scenarioTitle.textContent = "Behavior Intervention Simulator - Example Game";

  storyText.innerHTML = `
Welcome to Mission: Reinforceable.
You'll step through short, branching scenarios based on your Behavior Plan.
Choose your mission below.`;

  const menu = document.createElement('div');
  menu.className = 'mission-grid';

  menu.innerHTML = `
    <div class="mission-card">
      <h3>Daily Mission</h3>
      <p>BIP Skill Run — practice proactive, teaching, reinforcement, and consequence steps.</p>
      <div class="action"><button id="btn-drill">Start BIP Practice ▶</button></div>
    </div>
    <div class="mission-card">
      <h3>Red Alert</h3>
      <p>Crisis Drill — rehearse safe elopement support and recovery steps.</p>
      <div class="action"><button id="btn-crisis">Start Crisis Drill ▶</button></div>
    </div>
    <div class="mission-card">
      <h3>Wildcard</h3>
      <p>Mystery Mission — a mixed set, including curveballs and schedule changes.</p>
      <div class="action"><button id="btn-random">Start Wildcard ▶</button></div>
    </div>
  `;

  const container = document.createElement('div');
  container.className = 'mission-intro';
  container.appendChild(menu);

  choicesDiv.innerHTML = '';
  choicesDiv.appendChild(container);

  showFeedback("At each step, you'll see immediate feedback on how closely your choice matches the BIP.", "correct", +10);

  const rnd = srandom(seedFromDate());
  document.getElementById('btn-drill').onclick = () => { resetGame(); startDynamicMission('Daily Drill', pickScenario(POOL.daily, rnd)); };
  document.getElementById('btn-crisis').onclick = () => { resetGame(); startDynamicMission('Emergency Sim', pickScenario(POOL.crisis, rnd)); };
  document.getElementById('btn-random').onclick = () => { resetGame(); startDynamicMission('Shuffle Quest', pickScenario(POOL.wild, rnd)); };
}
function pickScenario(pool, rnd) {
  return sample(pool, 1, rnd)[0];
}
let DYN = { nodes: [], ids: [] };
let NEXT_ID = 1000;
function newId(){ return NEXT_ID++; }
function startDynamicMission(modeLabel, scn) {
  if (!scn) return;
  DYN = { nodes: [], ids: [] };
  // Assign unique IDs to all steps and endings
  let stepIds = {};
  for (let stepKey in scn.steps) {
    stepIds[stepKey] = newId();
  }
  let endingIds = {};
  for (let endKey in scn.endings) {
    endingIds[endKey] = newId();
  }
  // Build nodes from steps
  for (let stepKey in scn.steps) {
    let step = scn.steps[stepKey];
    let node = {
      id: stepIds[stepKey],
      scenario: modeLabel,
      text: step.text,
      options: []
    };
    for (let chKey in step.choices) {
      let ch = step.choices[chKey];
      let opt = {
        text: ch.text,
        delta: ch.score,
        feedback: ch.feedback,
        feedbackType: ch.score > 0 ? 'correct' : 'coach',
        nextId: ch.next ? stepIds[ch.next] : (ch.ending ? endingIds[ch.ending] : 901)
      };
      node.options.push(opt);
    }
    DYN.nodes.push(node);
  }
  // Build nodes from endings (treat as custom feedback nodes)
  for (let endKey in scn.endings) {
    let end = scn.endings[endKey];
    let node = {
      id: endingIds[endKey],
      feedback: true,
      customTitle: end.title,
      customMsg: end.text,
      text: end.text, // For story-text fallback
      options: [{ text: "Play again (choose a mode)", nextId: 'home' }]
    };
    DYN.nodes.push(node);
  }
  // Start at the beginning
  showNode(stepIds[scn.start]);
  showFeedback("Mission launched! Good Luck. 🚀", "correct", +10);
}
/* -------- Static summary node (fallback if no ending) -------- */
const NODES = [
  { id: 901, feedback: true, text: "Session Summary",
    options: [{ text: "Play again (choose a mode)", nextId: 'home' }] }
];

/* -------- Engine -------- */
function getNode(id){
  return DYN.nodes.find(n => n.id === id) || NODES.find(n => n.id === id) || null;
}

function showNode(id) {
  const node = getNode(id);
  if (!node) return;

  if (scenarioTitle) {
    scenarioTitle.textContent =
      node.feedback ? "Fidelity Feedback" :
      node.scenario || "Choose Your Next Move";
  }

  if (node.feedback) {
    // Hide story box
    if (storyText) storyText.style.display = 'none';

    const pct = percentScore();
    const msg = fidelityMessage();

    let actionSteps = "";
    if (pct >= 80) {
      actionSteps = `
        <ul>
          <li>Continue using strong proactive cues before transitions.</li>
          <li>Maintain clear reinforcement for replacement behaviors.</li>
          <li>Keep prompting early signs—your timing is working!</li>
        </ul>`;
    } else if (pct >= 50) {
      actionSteps = `
        <ul>
          <li>Increase pre-corrections before predictable triggers.</li>
          <li>Prompt the replacement behavior earlier in the escalation cycle.</li>
          <li>Deliver reinforcement immediately when the replacement occurs.</li>
        </ul>`;
    } else {
      actionSteps = `
        <ul>
          <li>Revisit the proactive setup steps—these prevent most escape attempts.</li>
          <li>Practice the replacement behavior script outside of crises.</li>
          <li>Follow the crisis plan exactly (no blocking, no chasing).</li>
        </ul>`;
    }

    const old = document.getElementById('summary-panel');
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = "summary-panel";
    panel.innerHTML = `
      <div class="summary-score">
        Score: <strong>${points}</strong> / ${maxPossible} (${pct}%)
      </div>

      <div class="summary-section">
        <strong>Overall feedback:</strong><br>${msg}${node.customMsg ? '<br><br>' + node.customMsg : ''}
      </div>

      <div class="summary-section">
        <strong>Action steps for teachers:</strong>
        ${actionSteps}
      </div>
    `;

    if (storyText && storyText.parentNode) {
      storyText.insertAdjacentElement('afterend', panel);
    }

    let scoreHint, coachLine;
    if (pct >= 80) {
      scoreHint = +10;
      coachLine = "Mission complete. Results have been sent to the team. Review your overall feedback below.";
    } else if (pct >= 50) {
      scoreHint = 0;
      coachLine = "Mission incomplete. Results have been sent to the team. Review your overall feedback below.";
    } else {
      scoreHint = -10;
      coachLine = "Mission failed. Results have been sent to the team. Review your overall feedback below.";
    }
    showFeedback(coachLine, null, scoreHint);

  } else {
    if (storyText) {
      storyText.style.display = 'block';
      storyText.textContent = node.text;
    }

    const old = document.getElementById('summary-panel');
    if (old) old.remove();

    // Show thinking wizard when question loads
    setWizardSprite('think');
    showFeedback('Thinking...', null, 0);
  }

  choicesDiv.innerHTML = '';
  const options = shuffledOptions(node.options);

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    ["scenario-btn","primary","big","option-btn"].forEach(c => btn.classList.add(c));

    btn.addEventListener('click', () => {
      if (node.feedback && opt.nextId === 'home') {
        resetGame();
        renderIntroCards();
        return;
      }

      if (!node.feedback && typeof opt.delta === 'number') {
        addPoints(opt.delta);
      }

      if (!node.feedback) logDecision(node.id, opt);

      if (opt.feedback) {
        showFeedback(opt.feedback, opt.feedbackType || "coach", opt.delta);
      } else if (!node.feedback) {
        showFeedback('', null, 0);
      }

      if (opt.nextId === 1) resetGame();

      showNode(opt.nextId);

      if (opt.nextId === 901 || getNode(opt.nextId)?.feedback) sendResultsOnce();
    });

    choicesDiv.appendChild(btn);
  });
}

/* -------- Single INIT -------- */
document.addEventListener('DOMContentLoaded', () => {
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      resetGame();
      renderIntroCards();
    });
  }
  setTeacherBadge(getTeacherCode());
  resetGame();
  renderIntroCards();
  showFeedback("At each step, you'll see immediate feedback on how closely your choice matches the BIP.", "correct", +10);
});
