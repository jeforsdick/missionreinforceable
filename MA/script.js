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
   CONTENT POOLS
   ============================================================ */
const POOL = {
  /* ---------- PROACTIVE: set up the day / tasks / transitions ---------- */
  proactive: [
    {
      text: 'Morning arrival. Alex walks in quietly; this is when elopement usually starts later in math.',
      choices: [
        G('Greet Alex at the door, review his visual schedule, and point out when he can earn points/breaks.',
          'Warm greeting + preview + reinforcement path are core proactive BIP steps.'),
        N('Say “Good morning” and remind the class to start morning work.',
          'Friendly but not individualized to his escape-maintained behavior.'),
        B('Skip greetings and jump straight into directions so you can start on time.',
          'Skipping BIP preview increases uncertainty and later escape risk.')
      ]
    },
    {
      text: 'Five minutes before math, a known trigger. Alex shifts in his seat and glances toward the door.',
      choices: [
        G('Pause and pre-correct: review the math visual, show how to earn for staying in area, and check for questions.',
          'Pre-correction tied to earning reduces anxiety and escape motivation.'),
        N('Tell the class, “Remember, we stay in our seats during math,” and keep going.',
          'General rule reminder helps a bit but misses individualized supports.'),
        B('Start math right away with no preview because you are behind in the pacing guide.',
          'High-demand task with no preview makes escape more likely.')
      ]
    },
    {
      text: 'Transition to specials. Historically, Alex runs or veers off in the hallway.',
      choices: [
        G('Before lining up, show the hallway expectations visual and offer Alex a job (line leader or caboose) linked to earning.',
          'Pre-correction + role + reinforcement address transition-based escape.'),
        N('Tell the class, “Line up for specials,” and plan to watch Alex closely.',
          'Supervision helps but doesn’t directly reduce avoidance or teach expectations.'),
        B('Call, “Everyone line up, we’re late!” and rush out the door.',
          'Rushing without pre-correction increases stress and elopement risk.')
      ]
    },
    {
      text: 'Independent work right after recess has been a tough time; Alex often leaves the area.',
      choices: [
        G('Offer Alex a choice of which problem to start with and set a 5-minute timer with a visible earning opportunity.',
          'Choice + short work interval + clear reinforcement reduce response effort.'),
        N('Seat Alex near a quiet peer and hope the model helps.',
          'Peer model is nice, but it’s not a specific BIP step for escape.'),
        B('Tell Alex, “We’re catching up, so we have to work straight through,” with no breaks.',
          'Removing flexibility and breaks increases the value of escape.')
      ]
    },
    {
      text: 'Sub day and an assembly later. The schedule is noisy and different.',
      choices: [
        G('Create a simplified visual schedule, preview the big changes, and star a preferred block he can earn.',
          'Visuals + motivation protect against escalation during schedule changes.'),
        N('Tell the class, “Today is a little different, but we’ll be fine,” and move on.',
          'Reassuring but not concrete enough for an escape-prone student.'),
        B('Say there is no time to explain because you have a lot to cover.',
          'Ambiguity around changes fuels anxiety and escape-maintained behavior.')
      ]
    }
  ],

  /* ---------- TEACHING: explicit instruction & prompting of replacement ---------- */
  teaching: [
    {
      text: 'During writing, Alex grips his pencil, stares at the door, and whispers, “This is too hard.”',
      choices: [
        G('Model the script: “I can say, ‘This is hard. Can I use my break card or get help?’” Then prompt him to try it.',
          'Explicitly teaching and prompting the communicative replacement before escalation.'),
        N('Encourage, “Just try your best; you can do it,” and move on.',
          'Supportive, but it does not teach the function-matched communication response.'),
        B('Say, “Start now or you’ll lose recess,” in a firm tone.',
          'Punitive threat increases escape motivation and doesn’t build the replacement skill.')
      ]
    },
    {
      text: 'Math problem is above Alex’s level; he quietly pushes the worksheet away.',
      choices: [
        G('Teach a help script (“Can you show me the first one?”), practice it once, then have him use it for this problem.',
          'Role-play + in-the-moment use of “ask for help” builds the replacement behavior.'),
        N('Simplify the problem and tell him, “Try this one instead,” without teaching a script.',
          'Lowering difficulty may help now but doesn’t build a stable replacement response.'),
        B('Remove multiple problems and say, “Fine, just do these so we can move on.”',
          'Task removal can reinforce escape instead of communication.')
      ]
    },
    {
      text: 'Transition to the rug: Alex lingers at his desk, looking away and fiddling with materials.',
      choices: [
        G('Teach a short transition routine: “Stand → push in chair → walk on the line,” and practice it with a quick rehearsal.',
          'Practice-based instruction turns a high-risk moment into a taught routine.'),
        N('Remind him, “Come on, we’re going to the rug now,” from across the room.',
          'Vague reminder, not explicit skill instruction.'),
        B('Walk over, take his arm, and escort him to the rug.',
          'Physical guidance can increase resistance and doesn’t teach the independent routine.')
      ]
    },
    {
      text: 'Before small groups, Alex repeatedly asks for water to avoid starting work.',
      choices: [
        G('Teach: “You can ask for a 2-minute break after you start the first problem,” and rehearse the request.',
          'Schedules a function-matched break while still requiring task engagement.'),
        N('Let him go for water one more time and hope it helps him reset.',
          'Might reduce behavior today but easily becomes an escape pattern.'),
        B('Say sharply, “No more water. Sit down,” with no alternative offered.',
          'Hard denial without replacement teaching often escalates behavior.')
      ]
    }
  ],

  /* ---------- REINFORCEMENT: strengthening replacement / desired behavior ---------- */
  reinforcement: [
    {
      text: 'Alex uses his break card exactly as taught and returns on time, starting his name on the paper.',
      choices: [
        G('Immediately give a point/token and say specifically, “Nice job using your break card and coming back on time.”',
          'Immediate, behavior-specific reinforcement tightens the break–return contingency.'),
        N('Smile and give a thumbs up but plan to award a point later in the day.',
          'Positive, but the delayed reinforcement weakens the clear connection to the behavior.'),
        B('Wait until the whole assignment is done before acknowledging the break use.',
          'The critical replacement skill (using the card & returning) goes under-reinforced.')
      ]
    },
    {
      text: 'Alex raises his hand and asks for help instead of getting up and leaving his seat.',
      choices: [
        G('Praise the help request specifically and add a point/token while you give brief help.',
          'Reinforcing the communicative response increases future use over escape.'),
        N('Answer his question but forget to deliver points or praise.',
          'Instruction happens, but the replacement isn’t contact ing planned reinforcement.'),
        B('Say, “Just try it yourself first,” and ignore the hand-raising.',
          'Ignoring the replacement response makes escape more efficient than asking for help.')
      ]
    },
    {
      text: 'During a transition to specials, Alex stays in line and in his zone the whole way.',
      choices: [
        G('At the door, give a point/token and say, “You stayed with the class and in your spot the whole time.”',
          'Reinforcing the successful transition makes on-track hallway behavior more likely.'),
        N('Say, “Thanks everyone,” as the class arrives, with no specific callout.',
          'Group acknowledgment is nice but doesn’t highlight his BIP-targeted behavior.'),
        B('Say nothing because “that’s what he’s supposed to do.”',
          'Taking success for granted reduces motivation to keep using the replacement pattern.')
      ]
    }
  ],

  /* ---------- CONSEQUENCE: responding when problem behavior happens ---------- */
  consequence: [
    {
      text: 'Alex mutters, “This is stupid,” and swivels away from his desk but has not left the area.',
      choices: [
        G('Use planned ignore for the comment and calmly prompt, “If it feels hard, you can ask for help or a break card.”',
          'Avoids reinforcing the comment and redirects to the replacement behavior.'),
        N('Offer, “Do you want me to read the directions again?” and hope he re-engages.',
          'Supportive, but does not explicitly tie back to the BIP replacement skill.'),
        B('Respond, “That’s disrespectful. You need to fix your attitude,” in front of the class.',
          'Adds high-intensity attention and can escalate the situation.')
      ]
    },
    {
      text: 'Alex drops his pencil and says, “I’m not doing this,” while staring at the door.',
      choices: [
        G('Acknowledge and restate the plan: “Remember, start the first problem, then you can use your 2-minute break,” and prompt him to begin.',
          'Keeps the contingency intact and redirects to the function-matched plan.'),
        N('Let him sit for a few minutes and check on him later.',
          'Might avoid a power struggle, but can function as escape without skill practice.'),
        B('Say, “Fine, then you’ll make it up during recess,” and walk away.',
          'Delayed punishment can reinforce escape right now and strain the relationship.')
      ]
    },
    {
      text: 'Peer snickers when Alex sighs loudly and slumps. Alex turns toward the door.',
      choices: [
        G('Quietly redirect the peer to be supportive and reinforce Alex for staying in his area (“Thanks for staying with us even when it’s frustrating”).',
          'Manages attention while reinforcing the desired behavior (staying instead of leaving).'),
        N('Ignore both and keep teaching.',
          'Avoids escalation but leaves peer attention patterns and Alex’s coping unaddressed.'),
        B('Call out the peer loudly in front of the class.',
          'Creates a high-intensity scene that can add fuel to escape and attention-maintained patterns.')
      ]
    }
  ],

  /* ---------- CRISIS: elopement / safety-fidelity moments ---------- */
  crisis: [
    {
      text: 'Alex stands up suddenly, eyes the door, and speed-walks toward the hallway.',
      choices: [
        G('Maintain visual, activate the crisis plan by calling the office, and follow at a safe distance without chasing.',
          'Matches typical elopement plan: notify, maintain line-of-sight, and avoid chase/blocking.'),
        N('Follow behind him silently while hoping he stops before the doors.',
          'Keeps him in sight but skips the notify/support step in most crisis plans.'),
        B('Run to block the door with your body and raise your voice to stop him.',
          'Blocking and yelling can escalate to aggression and are usually off-plan.')
      ]
    },
    {
      text: 'Alex is in the hallway about 10–12 feet ahead. He slows but is still moving away.',
      choices: [
        G('From behind, use a calm, brief cue linked to the plan: “Alex, pause. Walk back with me to earn your points.”',
          'Calm, plan-based prompt tied to reinforcement encourages safe de-escalation.'),
        N('Shadow him quietly until he gets near an exit, then speak up.',
          'Maintains safety somewhat but delays the planned prompt and support.'),
        B('Hurry to grab his arm before he reaches the corner.',
          'Hands-on control without de-escalation can increase panic and risk.')
      ]
    },
    {
      text: 'Support arrives. Alex has stopped near the library door and is breathing hard.',
      choices: [
        G('Use the return script from the plan, walk back together, document the incident, and debrief later when calm.',
          'Follows the full crisis sequence: return, documentation, and learning-focused debrief.'),
        N('Walk him back to class without saying much and resume instruction.',
          'He is safe, but there is no debrief to improve future responses.'),
        B('Lecture him about the rules and how serious this was the entire walk back.',
          'Sustained, intense attention can inadvertently reinforce the elopement.')
      ]
    }
  ],

  /* ---------- WILDCARD: schedule changes, environment shifts, curveballs ---------- */
  wildcard: [
    {
      text: 'Surprise assembly is announced during a writing block where Alex often struggles.',
      choices: [
        G('Preview the change with a quick visual, review expectations, and offer Alex a special job (line spot or materials helper).',
          'Predictability + role reduce anxiety and escape during schedule shifts.'),
        N('Tell the class, “Plans changed—put your things away, we’re going to an assembly.”',
          'Gives information but lacks individualized supports for Alex.'),
        B('Announce, “We’re late, hurry up!” and rush the class out the door.',
          'Rushing without supports adds stress and dysregulation risk.')
      ]
    },
    {
      text: 'There is a substitute para who does not know Alex’s BIP.',
      choices: [
        G('Take 60 seconds to explain key BIP steps and give the sub a simple cue card or visual.',
          'Quick training increases adult consistency and BIP fidelity.'),
        N('Tell the sub, “Just keep an eye on him,” and go back to teaching.',
          'Too vague to ensure the plan is implemented.'),
        B('Assume the sub will figure it out from watching the class.',
          'High risk of drift and missed supports for Alex.')
      ]
    },
    {
      text: 'During line-up, a peer says, “Hurry up or we’ll be last,” and Alex glares and grips the desk.',
      choices: [
        G('Prompt Alex’s replacement (“You can ask for help or a short wait break”) and coach the peer on more supportive language.',
          'Addresses both the trigger and the skill, improving the classroom ecology.'),
        N('Ignore the interaction and keep lining students up.',
          'Misses a chance to coach peer support and prompt Alex’s skill.'),
        B('Scold Alex for being slow in front of the class.',
          'Punishes the wrong student and increases stress and escape motivation.')
      ]
    },
    {
      text: 'Fire drill begins during math; noise spikes. Alex covers his ears and moves toward the hooks.',
      choices: [
        G('Offer headphones or ear covers, show the drill visual, and pair him with a buddy for the route.',
          'Sensory support + predictability + social support align with many BIPs.'),
        N('Escort him quickly without much talking so you can get outside.',
          'Keeps him safe, but misses individualized sensory and predictability supports.'),
        B('Command loudly, “Stop that and move!” while pulling him along.',
          'Adds intensity and control without support, increasing panic and escape behaviors.')
      ]
    },
    {
      text: 'Indoor recess. The noise rises quickly, and Alex starts pacing by the door.',
      choices: [
        G('Offer a calm corner or quiet activity with a timer and a token for returning to the group.',
          'Provides a function-matched break with a clear path back to participation.'),
        N('Ask if he wants to pick a different game.',
          'Choice helps, but a structured break may still be needed for escape function.'),
        B('Tell him to sit down and be quiet or he will lose all recess.',
          'High control without support escalates escape-maintained behavior.')
      ]
    },
    {
      text: 'Open-ended writing prompt during the last 15 minutes of the day. Alex freezes and stares at the clock.',
      choices: [
        G('Offer sentence starters or scribe the first sentence while he says it, then reinforce his initiation.',
          'Reduces response effort and reinforces starting, which combats escape.'),
        N('Suggest, “You can brainstorm ideas now and write tomorrow,” and let him sit.',
          'Defers writing but doesn’t address the skill or escape pattern.'),
        B('Insist he writes a full paragraph right now with no supports.',
          'High effort and low support make escape highly likely.')
      ]
    }
  ]
};


/* ============================================================
   DYNAMIC MISSION BUILDER
   ============================================================ */
function renderIntroCards() {
  scenarioTitle.textContent = "Behavior Intervention Simulator - Example Game";

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

