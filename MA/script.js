/**********************************************************
 * Mission: Reinforceable — Classic UI + Multi-Mode Engine
 * - Classic UI + wizard pod preserved
 * - Three modes: Daily Drill / Emergency Sim / Shuffle Quest
 * - Scenario pools + daily-seeded randomness
 * - Choices shuffled every step
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
  minus: 'mr-wizard-minus10.png'
};

// Always show a sprite immediately and avoid stale-cache
function setWizardSprite(state) {
  const src = (state === 'plus') ? WIZ.plus : (state === 'minus') ? WIZ.minus : WIZ.meh;
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
  events = [];          // NEW
  sentThisRun = false;  // NEW
  SESSION_ID = newSessionId(); // NEW: fresh session per run
  setPoints(0);
  showFeedback('', null, 0);
}
function percentScore() {
  return maxPossible > 0 ? Math.round((points / maxPossible) * 100) : 0;
}

function fidelityMessage() {
  const pct = percentScore();

  if (pct >= 80) {
    return "Nice work! Your choices closely matched KeKu’s plan. You used options instead of “no,” set him up proactively (seat/jobs/snack/rest), prompted replacement requests early (break/alt seating/help), and reinforced quickly with chart moves—without calling out earning to the class.";
  }

  if (pct >= 50) {
    return "You had some plan-aligned moves, but missed a few key supports. Tighten up: (1) offer two safe choices (avoid “no”), (2) pre-correct before group time/line/centers, and (3) prompt the replacement request early and reinforce it immediately with chart moves (keep earning talk private).";
  }

  return "This run drifted from KeKu’s plan. Refocus on: (a) proactive setup (assigned seat, jobs, snack/rest option, clear earning path), (b) early prompting of replacement requests (break/alt seating/help) + immediate chart moves, and (c) safe response to unexpected location/aggression—prioritize space, calm prompts, and get support (no power struggles or public call-outs).";
}

/* -------- Feedback UI -------- */
function showFeedback(text, type, scoreHint) {
  if (!feedbackEl || !feedbackTextEl) return;

  let state = 'meh';
  if (typeof scoreHint === 'number') state = scoreHint > 0 ? 'plus' : scoreHint < 0 ? 'minus' : 'meh';
  else if (type === 'correct') state = 'plus';

  // use cache-busting sprite setter
  setWizardSprite(state);

  feedbackEl.classList.remove('state-plus','state-meh','state-minus','flash');
  feedbackEl.classList.add(`state-${state}`);
  feedbackTextEl.textContent = text || '';
  requestAnimationFrame(() => feedbackEl.classList.add('flash'));
}

/* ===== RESULTS: client → GAS webhook ===== */
const RESULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbw9bWb3oUhoIl7hRgEm1nPyr_AKbLriHpQQGwcEn94xVfHFSPEvxE09Vta8D4ZqGYuT/exec";

/* teacher code from ?teacher=XX or badge */
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

/* session + decision log */
function newSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
}
let SESSION_ID = newSessionId();
let events = [];
let sentThisRun = false;

/* log each decision */
function logDecision(nodeId, opt) {
  events.push({
    t: new Date().toISOString(),
    nodeId,
    delta: (typeof opt.delta === "number" ? opt.delta : null),
    choice: opt.text
  });
}

/* send once at summary — FIRE & FORGET */
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

  // Important: no await, no reading response, no headers.
  // This avoids ALL CORS and auth errors.
  try {
    fetch(RESULT_ENDPOINT, {
      method: "POST",
      mode: "no-cors",          // ← this is what fixes the "offline" issue
      body: JSON.stringify(payload)
    });
    // OPTIONAL:
    // showFeedback("Results sent.", "correct", +10);
  } catch (e) {
    // We intentionally swallow errors so the game never shows "offline."
    // Apps Script will still get the POST whenever network is available.
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

/* -------- Choice helpers -------- */
const G=(text,why)=>({ text, why, tag:'good',    delta:+10 });
const N=(text,why)=>({ text, why, tag:'neutral', delta:0   });
const B=(text,why)=>({ text, why, tag:'bad',     delta:-10 });

/* ============================================================
   CONTENT POOLS — MA / KeKu (Kinder) 12-2025
   ============================================================ */

const POOL = {

  /* ---------- PROACTIVE: set up the day / tasks / transitions ---------- */
  proactive: [

    {
      text: 'Morning arrival. KeKu looks tired and puts his head down at his table.',
      choices: [
        G('Use the plan’s rest option: quietly guide him to the agreed rest spot, then plan a check-in + snack when he wakes.',
          'Matches the plan: rest option + regulation/snack check-in after waking.'),
        N('Let him rest at his seat and keep the class moving.',
          'May be fine short-term, but misses the planned rest routine and wake-up check-in.'),
        B('Tell him, “No sleeping—sit up and start work,” in front of peers.',
          'Direct “no” + public correction can trigger escalation and doesn’t follow the plan.')
      ]
    },

    {
      text: 'Whole-group instruction begins. KeKu starts wiggling and scanning the room—this is a hard part of the day for him.',
      choices: [
        G('Pre-correct with a choice + job: “Rug or chair? Also, can you be our pointer/helper if you follow directions?”',
          'Plan-aligned: offer two safe choices + class jobs as proactive supports.'),
        N('Give a general reminder: “Hands to self and eyes on me,” and continue teaching.',
          'Helpful, but not individualized (choice/job support is missing).'),
        B('Increase demands: “Everyone must sit perfectly or we’re restarting,” with no supports.',
          'Raises response effort and can increase escape/behavior.')
      ]
    },

    {
      text: 'Transition to centers. KeKu has about a 15–20 minute attention span and often struggles later in the rotation.',
      choices: [
        G('Set him up early: assign his center seat (end of row / not surrounded), show the chart moves, and preview how to earn during centers.',
          'Plan-aligned: assigned seating + clear earning path with chart moves.'),
        N('Send students to centers and plan to “watch him closely.”',
          'Supervision helps, but it’s not the proactive setup described in the plan.'),
        B('Skip the preview because you’re behind, and start correcting him as issues pop up.',
          'No proactive structure increases the chance of escalation during centers.')
      ]
    },

    {
      text: 'Line-up for a hallway transition. KeKu is close to peers and starts bumping/using feet near others.',
      choices: [
        G('Pre-correct without “no”: “We keep KYHFOOTY in school. Front of line or walk to the side?”',
          'Directly matches the plan’s “avoid no + pair with choice” example.'),
        N('Move him behind a calm peer and hope it settles.',
          'May reduce issues, but doesn’t teach/prime the plan’s line-up strategy.'),
        B('Say, “Stop it. No kicking,” and keep him in the middle of peers.',
          'Uses “no” without choice and increases risk of escalation/peer conflict.')
      ]
    },

    {
      text: 'Afternoon slump. KeKu starts getting dysregulated and fixates on his chart/prize.',
      choices: [
        G('Increase structure: offer a quick snack, give a simple job, and show exactly what earns the next chart move.',
          'Plan-aligned: snacks + class jobs + clear reinforcement criteria.'),
        N('Tell him, “Just calm down,” and continue the lesson.',
          'Supportive tone but not a concrete plan step.'),
        B('Remove access to the chart/prize conversation entirely and threaten loss.',
          'Power struggle around reinforcement is a known escalation path for him.')
      ]
    }

  ],

  /* ---------- TEACHING: explicit instruction & prompting of replacement ---------- */
  teaching: [

    {
      text: 'During a tough task, KeKu starts to refuse and pushes materials away.',
      choices: [
        G('Teach/prompt the replacement: “Raise your hand and ask: ‘Can I have a break or different work?’” Then have him practice once.',
          'Matches plan replacement behavior: request break/alternative work.'),
        N('Offer help and shorten the work without teaching a request.',
          'May help now, but doesn’t build the replacement skill.'),
        B('Say, “Do it now,” with no alternative and no taught request.',
          'High demand with no replacement behavior increases escalation risk.')
      ]
    },

    {
      text: 'Rug time. KeKu starts to slide into peers’ space and gets grabby.',
      choices: [
        G('Teach “alternative seating” as a skill: prompt him to raise his hand and request a safe spot (chair / end of row), then reinforce the request.',
          'Matches plan replacement: request alternative seating appropriately.'),
        N('Move him to the edge without any teaching and continue instruction.',
          'May work today but doesn’t build independent requesting.'),
        B('Call him out loudly in front of the class for being unsafe.',
          'Public attention can escalate and does not teach the replacement.')
      ]
    },

    {
      text: 'Downtime appears (waiting for specials / finishing early). KeKu starts roaming and touching others’ materials.',
      choices: [
        G('Teach “constant tasks”: prompt him to choose a preferred downtime task (job sheet / helper task) and show how it earns chart moves.',
          'Plan-aligned: constant tasks reduce downtime risk + link to reinforcement.'),
        N('Tell him to “wait quietly” until everyone is ready.',
          'Vague direction; doesn’t give the plan’s preferred alternative.'),
        B('Remove materials and scold him for touching things.',
          'Escalates without teaching what to do instead.')
      ]
    },

    {
      text: 'In line, KeKu is starting KYHFOOTY (feet/hands near peers).',
      choices: [
        G('Use precision requesting + incompatible direction: “Hands in pockets. Pick up the two papers by your feet.”',
          'Matches the plan: precision requests + incompatible actions.'),
        N('Say, “Be safe,” and keep walking.',
          'Too general to reliably shift behavior.'),
        B('Say, “No. Stop,” repeatedly with a stern tone.',
          'Plan says avoid “no” when possible; repeated “stop” can escalate.')
      ]
    }

  ],

  /* ---------- REINFORCEMENT: strengthening replacement / desired behavior ---------- */
  reinforcement: [

    {
      text: 'KeKu follows a direction during centers and stays in his assigned seat for a short stretch.',
      choices: [
        G('Immediately mark a chart move and give specific praise: “You followed directions and stayed in your spot—chart move!”',
          'Plan-aligned: frequent chart moves + behavior-specific praise.'),
        N('Smile and say “good job” but forget to mark the chart move.',
          'Positive, but weakens the reinforcement system consistency.'),
        B('Wait to reinforce until the entire center block is over.',
          'Delayed reinforcement reduces motivation, especially with short attention spans.')
      ]
    },

    {
      text: 'KeKu raises his hand and asks for a break instead of escalating.',
      choices: [
        G('Honor the request within the plan: give a brief break option and reinforce the appropriate request with a chart move.',
          'Reinforces the replacement behavior and keeps access consistent.'),
        N('Let him take a break but do not pair it with reinforcement/praise.',
          'Break happens, but the replacement request isn’t strengthened.'),
        B('Deny the break and tell him to “deal with it.”',
          'Often triggers escalation; replacement requesting stops being efficient.')
      ]
    },

    {
      text: 'Transition clean-up goes well. KeKu puts materials away and lines up safely.',
      choices: [
        G('Reinforce immediately: chart move + quick “helper” job (line leader / caboose / sanitizer helper).',
          'Plan-aligned: reinforce transitions + jobs as preferred rewards.'),
        N('Thank the whole class and move on.',
          'Nice, but doesn’t highlight his plan-targeted success.'),
        B('Say nothing because “that’s expected.”',
          'Missed reinforcement opportunity reduces future buy-in.')
      ]
    }

  ],

  /* ---------- CONSEQUENCE: responding when problem behavior starts ---------- */
  consequence: [

    {
      text: 'KeKu starts to refuse (“No/I’m not doing it”) and knocks a pencil off the table.',
      choices: [
        G('Use precision requesting + incompatible action: “Pick up the pencil and put it in the cup.” Then praise even partial compliance and return to the plan.',
          'Matches plan: incompatible directions + praise direction-following even if behavior is mild.'),
        N('Offer help and quietly restate expectations.',
          'Supportive, but may miss the plan’s precision-request structure.'),
        B('Lecture about respect and consequences in front of peers.',
          'High-intensity attention can escalate and disrupt rapport.')
      ]
    },

    {
      text: 'KeKu fixates on his chart and starts escalating because he thinks he “didn’t earn it.”',
      choices: [
        G('Stay neutral and concrete: show what earns the next move, offer two choices to earn it, and avoid public commentary about “not earning.”',
          'Plan-aligned: never call out failure to earn; use clear earning steps + choice.'),
        N('Say, “We’ll talk later,” and try to move on.',
          'May reduce conflict, but doesn’t re-anchor him to the earning pathway.'),
        B('Announce to the class that he “didn’t earn it” and remove access.',
          'Plan explicitly says not to call out poor behavior/failure to earn to the class; high escalation risk.')
      ]
    },

    {
      text: 'Property misuse starts: KeKu crumples paper and pushes a chair (not at anyone).',
      choices: [
        G('Give an incompatible direction + quick reset: “Put the chair back. Then choose: rip your own scrap paper at the calm spot or hand me the paper for help.”',
          'Keeps it safe, gives a doable alternative, and uses choice rather than “no.”'),
        N('Remove the materials and continue teaching.',
          'May stop the moment but doesn’t teach an alternative response.'),
        B('Threaten loss of recess and argue about it.',
          'Escalates power struggle and can increase escape behavior.')
      ]
    },

    {
      text: 'KeKu begins moving toward the door during work time (unexpected location risk).',
      choices: [
        G('Prompt the replacement early: “Raise your hand—ask for a break or different work.” Then reinforce the request if he uses it.',
          'Early prompt of replacement can prevent escalation into leaving.'),
        N('Follow him closely and hope he stops.',
          'Safety-minded, but misses the replacement prompt pathway.'),
        B('Block the doorway and raise your voice to stop him.',
          'High intensity can escalate; blocking can increase agitation.')
      ]
    }

  ],

  /* ---------- CRISIS: safety-fidelity moments ---------- */
  crisis: [

    {
      text: 'Crisis: KeKu becomes aggressive toward a peer (KYHFOOTY) during line-up.',
      choices: [
        G('Prioritize safety: create space between students, give a calm incompatible direction (“Hands down, walk to the calm spot”), and get support per school procedure.',
          'Safety first + incompatible direction aligns with plan principles; involve support early.'),
        N('Try to handle it alone by talking him through feelings in the moment.',
          'Supportive, but may not be fast enough for immediate peer safety.'),
        B('Yell and physically control him in front of peers.',
          'High risk escalation and unsafe dynamics in a kindergarten setting.')
      ]
    },

    {
      text: 'Crisis: KeKu refuses to come back from a break and starts escalating when prompted.',
      choices: [
        G('Keep it neutral and predictable: offer two safe return options (walk with you vs. walk with helper), restate the return expectation briefly, and get support if escalation increases.',
          'Maintains structure and avoids a power struggle while supporting re-entry.'),
        N('Wait a long time and hope he returns on his own.',
          'May inadvertently reinforce avoiding return demands.'),
        B('Threaten loss of all rewards and argue about it.',
          'Often intensifies escalation around reinforcement and control.')
      ]
    },

    {
      text: 'Crisis: KeKu leaves the approved area (unexpected location).',
      choices: [
        G('Maintain line-of-sight, notify support immediately, and use calm, brief prompts linked to earning/return—no chasing.',
          'Safety + support activation + calm prompting are the safest, most consistent moves.'),
        N('Follow him quietly but do not notify anyone.',
          'Maintains some safety, but delays needed support.'),
        B('Chase and corner him to force a return.',
          'Chasing increases risk and can intensify flight/aggression.')
      ]
    }

  ],

  /* ---------- WILDCARD: schedule changes, curveballs ---------- */
  wildcard: [

    {
      text: 'A substitute adult is in the room and does not know KeKu’s plan.',
      choices: [
        G('Give a 60-second “cheat sheet”: avoid “no,” offer two choices, use chart moves frequently, and prompt break/alt seating requests.',
          'Quick coaching increases plan consistency across adults.'),
        N('Tell the sub, “He can be tricky—just watch him.”',
          'Too vague to ensure fidelity.'),
        B('Assume they’ll figure it out without any guidance.',
          'High risk for drift and escalation.')
      ]
    },

    {
      text: 'The class is waiting (downtime before specials). KeKu starts touching others’ items.',
      choices: [
        G('Switch to a constant task + job: “Choose: pencil-counting job or activity sheet,” then reinforce quickly with a chart move.',
          'Plan-aligned downtime support reduces roaming/property issues.'),
        N('Say, “Just wait,” and keep him close to you.',
          'Might help, but doesn’t provide the plan’s alternative task.'),
        B('Scold and remove him from the area with no alternative offered.',
          'Escalation risk; misses replacement/alternative engagement.')
      ]
    },

    {
      text: 'A peer says, “You’re making us late,” and KeKu looks ready to lash out.',
      choices: [
        G('Coach the peer briefly and prompt KeKu’s replacement: “Raise your hand and ask for help/space,” then reinforce any safe response.',
          'Improves classroom ecology + prompts replacement behavior.'),
        N('Ignore it and keep moving.',
          'May miss a preventable escalation.'),
        B('Correct KeKu publicly for “attitude.”',
          'Public correction can trigger verbal/physical escalation.')
      ]
    },

    {
      text: 'KeKu is doing well and wants a “helping teacher” reward.',
      choices: [
        G('Turn it into earned reinforcement: “Earn one more chart move, then you can be the sanitizer helper.”',
          'Links preferred job to the reinforcement system.'),
        N('Let him help immediately, even if he’s off-task.',
          'Helping is great, but can accidentally reinforce avoidance/off-task behavior.'),
        B('Say “No, not right now” with no alternative.',
          'Plan recommends avoiding “no” when possible; provide a choice/earning path.')
      ]
    },

    {
      text: 'End of day is approaching. KeKu asks repeatedly about the “big” reinforcer (Best Room break with friends).',
      choices: [
        G('Be concrete: show progress on the chart, remind him how to earn, and keep it private (no class call-outs).',
          'Plan-aligned: clear criteria + avoid public commentary about earning.'),
        N('Say, “We’ll see,” and move on.',
          'Ambiguous; can increase anxiety/fixation.'),
        B('Announce to the class whether he did/didn’t earn it.',
          'Plan says never call out poor behavior or failure to earn to the class.')
      ]
    }

  ]

};


/* ============================================================
   DYNAMIC MISSION BUILDER
   ============================================================ */
function renderIntroCards() {
  scenarioTitle.textContent = "Behavior Intervention Simulator - KeKu";

  // Intro text pod (keeps your style)
  storyText.innerHTML =
`Welcome to Mission: Reinforceable.
You’ll step through short, branching scenarios based on you Behavior Plan.
Choose your mission below.`;

  // Card deck below the intro pod
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

  // Put the cards right after the story pod
  const container = document.createElement('div');
  container.className = 'mission-intro';
  container.appendChild(menu);

  // Replace choices area with the card menu
  choicesDiv.innerHTML = '';
  choicesDiv.appendChild(container);

  // Wizard hint
  showFeedback("At each step, you’ll see immediate feedback on how closely your choice matches the BIP.", "correct", +10);

  // Button hooks
  const rnd = srandom(seedFromDate());
  document.getElementById('btn-drill').onclick  = () => { resetGame(); startDynamicMission('Daily Drill',   buildDailyDrill(rnd)); };
  document.getElementById('btn-crisis').onclick = () => { resetGame(); startDynamicMission('Emergency Sim', buildEmergencySim(rnd)); };
  document.getElementById('btn-random').onclick = () => { resetGame(); startDynamicMission('Shuffle Quest', buildShuffleQuest(rnd)); };
}

let DYN = { nodes: [], ids: [] };
let NEXT_ID = 1000; // dynamic ids won’t collide with your static ones
function newId(){ return NEXT_ID++; }

function buildDailyDrill(rnd){
  // 4 steps: Proactive → Teaching → Reinforcement → Consequence
  return [
    sample(POOL.proactive,     1, rnd)[0],
    sample(POOL.teaching,      1, rnd)[0],
    sample(POOL.reinforcement, 1, rnd)[0],
    sample(POOL.consequence,   1, rnd)[0],
  ].filter(Boolean);
}
function buildEmergencySim(rnd){ return sample(POOL.crisis, 3, rnd); }
function buildShuffleQuest(rnd){
  const base = [
    ...sample(POOL.proactive,     1, rnd),
    ...sample(POOL.teaching,      1, rnd),
    ...sample(POOL.reinforcement, 1, rnd),
    ...sample(POOL.consequence,   1, rnd),
    ...sample(POOL.crisis,        1, rnd),
    ...sample(POOL.wildcard,      2, rnd),
  ];
  const desired = 5 + Math.floor(rnd()*3); // 5,6,7
  return shuffle(base, rnd).slice(0, desired);
}

function startDynamicMission(modeLabel, scenes){
  DYN = { nodes: [], ids: [] };
  const ids = scenes.map(() => newId());
  scenes.forEach((sc, i) => {
    const nextId = (i < scenes.length - 1) ? ids[i+1] : 901; // summary node id
    const node = {
      id: ids[i],
      scenario: modeLabel,
      text: sc.text,
      options: sc.choices.map(ch => ({
        text: ch.text,
        delta: ch.delta,
        feedback: ch.why,
        feedbackType: ch.tag === 'good' ? 'correct' : 'coach',
        nextId
      }))
    };
    DYN.nodes.push(node);
  });
  DYN.ids = ids;
    showNode(ids[0]);
  // ⭐ Add this line:
  showFeedback("Mission launched! Good Luck. 🚀", "correct", +10);
}

/* -------- Static summary node -------- */
const NODES = [
  { id: 901, feedback: true, text: "Session Summary",
    options: [{ text: "Play again (choose a mode)", nextId: 'home' }] }
];


/* -------- Engine (classic, with dynamic support) -------- */
function getNode(id){
  return (DYN.nodes.find(n => n.id === id)) || (NODES.find(n => n.id === id)) || null;
}

function showNode(id) {
  const node = getNode(id);
  if (!node) return;

  // ----- Title -----
  if (scenarioTitle) {
    scenarioTitle.textContent =
      node.feedback ? "Fidelity Feedback" :
      node.scenario || "Choose Your Next Move";
  }

  // ----- Summary node (end of mission) -----
  if (node.feedback) {
    const pct = percentScore();
    const msg = fidelityMessage();

    // Hide the normal gray story box
    if (storyText) {
      storyText.style.display = 'none';
    }

    // Teacher-facing action steps
let actionSteps = "";

if (pct >= 80) {
  actionSteps = `
    <ul>
      <li>Keep using choices instead of “no” (e.g., “front of line or side?” “rug or chair?”).</li>
      <li>Stay consistent with the proactive supports: assigned seating, class jobs, snacks, and the rest option when tired.</li>
      <li>Maintain high-frequency reinforcement: behavior-specific praise + quick chart moves (keep earning private).</li>
      <li>When early signs show up, use precision requests + incompatible directions to keep it safe and moving.</li>
    </ul>`;
} else if (pct >= 50) {
  actionSteps = `
    <ul>
      <li>Add more pre-corrections before predictable triggers (whole group, centers rotations, hallway/line).</li>
      <li>Swap “stop/no” language for two safe choices paired with clear expectations.</li>
      <li>Prompt the replacement request earlier: “raise your hand and ask for a break / different work / alternative seat.”</li>
      <li>Reinforce immediately when he requests appropriately (chart move + specific praise); avoid announcing earning/not earning to the class.</li>
    </ul>`;
} else {
  actionSteps = `
    <ul>
      <li>Revisit proactive setup first: assigned seat (end of row/not surrounded), constant tasks for downtime, job options, snack/rest option, and a clear “how to earn” path.</li>
      <li>Practice the replacement scripts outside of tough moments so they’re ready during escalation (break / help / alternative seating).</li>
      <li>During escalation, use calm, brief precision requests and incompatible directions (what to do), not lectures or public corrections.</li>
      <li>If there’s aggression or unexpected location, prioritize safety: create space, maintain line-of-sight, get support per procedure, and avoid power struggles or public call-outs.</li>
    </ul>`;
}

    // Remove any old summary panel
    const old = document.getElementById('summary-panel');
    if (old) old.remove();

    // Build new summary panel
    const panel = document.createElement('div');
    panel.id = "summary-panel";
    panel.className = "summary-panel";
    panel.innerHTML = `
      <div class="summary-score">
        Score: <strong>${points}</strong> / ${maxPossible} (${pct}%)
      </div>

      <div class="summary-section">
        <strong>Overall feedback:</strong><br>${msg}
      </div>

      <div class="summary-section">
        <strong>Action steps for teachers:</strong>
        ${actionSteps}
      </div>
    `;

    // Insert the panel where the story box normally lives
    if (storyText && storyText.parentNode) {
      storyText.insertAdjacentElement('afterend', panel);
    }

    // Wizard message
    let scoreHint, coachLine;
    if (pct >= 80) {
      scoreHint = +10;
      coachLine =
        "Mission complete. Results have been sent to the team. Review your overall feedback below.";
    } else if (pct >= 50) {
      scoreHint = 0;
      coachLine =
        "Mission incomplete. Results have been sent to the team. Review your overall feedback below.";
    } else {
      scoreHint = -10;
      coachLine =
        "Mission failed. Results have been sent to the team. Review your overall feedback below.";
    }
    showFeedback(coachLine, null, scoreHint);

  } else {
    // ----- Normal game nodes -----
    // Make sure the gray story box is visible again
    if (storyText) {
      storyText.style.display = 'block';
      storyText.textContent = node.text;
    }

    // Remove any leftover summary panel
    const old = document.getElementById('summary-panel');
    if (old) old.remove();
  }

  // ----- Choices -----
  choicesDiv.innerHTML = '';
  const options = shuffledOptions(node.options);

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    ["scenario-btn","primary","big","option-btn"].forEach(c => btn.classList.add(c));

    btn.addEventListener('click', () => {
      // Summary "play again" → go home
      if (node.feedback && opt.nextId === 'home') {
        resetGame();
        renderIntroCards();
        return;
      }

      // Add points for scored nodes
      if (!node.feedback && typeof opt.delta === 'number') {
        addPoints(opt.delta);
      }

      // Log decisions (only game nodes)
      if (!node.feedback) logDecision(node.id, opt);

      // Per-step feedback
      if (opt.feedback) {
        showFeedback(opt.feedback, opt.feedbackType || "coach", opt.delta);
      } else if (!node.feedback) {
        showFeedback('', null, 0);
      }

      // Legacy reset behavior if nextId === 1
      if (opt.nextId === 1) resetGame();

      // Move to next node
      showNode(opt.nextId);

      // End-of-run: send results once when we hit the summary node
      if (opt.nextId === 901) sendResultsOnce();
    });

    choicesDiv.appendChild(btn);
  });
}

/* -------- Single INIT -------- */
window.addEventListener('load', () => {
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      resetGame();
      renderIntroCards();   // go back to mission menu
    });
  }
  setTeacherBadge(getTeacherCode()); // fill in teacher from ?teacher=JF
  resetGame();
  renderIntroCards();                // show mission cards on first load
});

