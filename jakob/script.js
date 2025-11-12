/**********************************************************
 * Mission: Reinforceable — Multi-Mode (keeps your UI + Wizard)
 * Modes:
 *  - Daily Drill (BIP steps): Proactive → Teaching → Reinforcement → Consequence (randomized)
 *  - Emergency Sim (Crisis): 3-step crisis rehearsal (randomized)
 *  - Shuffle Quest (Random): 5–7 mixed scenes from all pools (randomized)
 * Notes:
 *  - Uses your existing IDs, wizard images, HUD, and feedback styles.
 *  - Adds large content pools + daily-seeded rotation for variety across weeks.
 **********************************************************/

/* -------- DOM refs (unchanged) -------- */
const storyText       = document.getElementById('story-text');
const choicesDiv      = document.getElementById('choices');
const scenarioTitle   = document.getElementById('scenario-title');
const pointsEl        = document.getElementById('points');
const feedbackEl      = document.getElementById('feedback');
const feedbackTextEl  = document.getElementById('feedback-text');
const coachImgEl      = document.getElementById('coach-img');

/* -------- Wizard sprites (unchanged) -------- */
const WIZ = {
  plus:  'mr-wizard-plus10.png',
  meh:   'mr-wizard-0.png',
  minus: 'mr-wizard-minus10.png'
};
// preload
['plus','meh','minus'].forEach(k => { const i = new Image(); i.src = WIZ[k]; });

/* -------- Scoring (unchanged) -------- */
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
  setPoints(0);
  showFeedback('', null, 0);
}
function percentScore() {
  return maxPossible > 0 ? Math.round((points / maxPossible) * 100) : 0;
}
function fidelityMessage() {
  const pct = percentScore();
  if (pct >= 80) {
    return "Nice work! Your decisions closely matched the Behavior Intervention Plan. You consistently used proactive supports, taught/prompted replacement behaviors, and reinforced the right moves.";
  } else if (pct >= 50) {
    return "Some of your moves aligned with the plan, but key supports were missed. Revisit early prompts, clear expectations, and high-frequency reinforcement, then try again.";
  }
  return "This run drifted from the plan. Focus on: (a) proactive setup, (b) prompting & reinforcing the replacement behavior, and (c) using the crisis steps as written. Replay to tighten fidelity.";
}

/* -------- Feedback UI (unchanged) -------- */
function showFeedback(text, type, scoreHint) {
  if (!feedbackEl || !feedbackTextEl) return;

  let state = 'meh';
  if (typeof scoreHint === 'number') {
    state = scoreHint > 0 ? 'plus' : scoreHint < 0 ? 'minus' : 'meh';
  } else if (type === 'correct') {
    state = 'plus';
  }

  if (coachImgEl) {
    coachImgEl.src = state === 'plus' ? WIZ.plus : state === 'minus' ? WIZ.minus : WIZ.meh;
  }

  feedbackEl.classList.remove('state-plus','state-meh','state-minus','flash');
  feedbackEl.classList.add(`state-${state}`);
  feedbackTextEl.textContent = text || '';
  requestAnimationFrame(() => feedbackEl.classList.add('flash'));
}

/* -------- Utils (unchanged + seeded RNG) -------- */
function shuffledOptions(options) {
  return (options || []).map(o => ({ ...o })).sort(() => Math.random() - 0.5);
}
function shuffle(arr, rnd=Math.random){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]] }
  return a;
}
function sample(pool, k, rnd=Math.random){
  const bag = shuffle(pool, rnd);
  return bag.slice(0, Math.min(k, bag.length));
}
function seedFromDate(){
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  let h = 0;
  for(let i=0;i<key.length;i++){ h = (h<<5)-h + key.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function srandom(seed){
  let x = (seed>>>0) || 123456789;
  return function(){
    x ^= x<<13; x ^= x>>>17; x ^= x<<5;
    return ((x>>>0)/4294967295);
  }
}

/* -------- Choice helpers (reuse) -------- */
const G=(text,why)=>({ text, why, tag:'good',    delta:+10 });
const N=(text,why)=>({ text, why, tag:'neutral', delta:0  });
const B=(text,why)=>({ text, why, tag:'bad',     delta:-10 });

/* ============================================================
   BIG CONTENT POOLS (add as many as you like)
   These mirror your BIP steps + crisis + wildcard curveballs.
   ============================================================ */
const POOL = {
  proactive: [
    { text:'Five minutes to specials. Student tenses at “line up.” What do you do first?',
      choices:[ G('Show visual schedule + pre-correct; offer line job/choice.', 'Pre-correction + choice reduces escape.'),
                N('Ask the para to stand near the student.', 'Proximity helps but does not teach or address function.'),
                B('Skip preview to stay on time; “Everyone line up now!”', 'Skipping proactive supports increases escape risk.') ] },
    { text:'Centers about to rotate. Student glances at the door.',
      choices:[ G('Pre-correct and point to next center on the map.', 'Predictability lowers avoidance.'),
                N('Tell class to rotate; no individual cue.', 'Generic cues miss the student’s need for predictability.'),
                B('Rush rotation because the timer already went off.', 'Rushing raises transition stress.') ] },
    { text:'Sub day: schedule is slightly shifted and noisier than usual.',
      choices:[ G('Preview a simplified visual schedule and star a preferred block.', 'Visuals + motivation buffer change.'),
                N('Say “We’ll figure it out” and begin.', 'Ambiguity fuels escape-maintained behavior.'),
                B('Tell students there is no time to explain; just get started.', 'Abrupt change increases risk.') ] },
    { text:'Independent work after recess — historically tough.',
      choices:[ G('Offer choice of task order + set a visible 5-min timer.', 'Choice + predictability reduces response effort.'),
                N('Place student near a quiet peer.', 'Helpful but not a BIP step; less targeted.'),
                B('Start with the hardest task to “get it over with.”', 'High effort first likely triggers escape.') ] }
  ],
  teaching: [
    { text:'During writing, student stares at the door and grips pencil—early signs of avoidance.',
      choices:[ G('Prompt: “If you need it, use your break card for 5 minutes.”', 'Prompt replacement before escalation; function-matched.'),
                N('State the rule: “We stay in our seats during work time.”', 'Rule reminder is not skill instruction.'),
                B('“Start now or lose recess.”', 'Punitive threats increase escape and don’t teach the skill.') ] },
    { text:'Math problem seems too hard. Student whispers “too hard.”',
      choices:[ G('Model asking for help; brief role-play; try first step.', 'Teaches the communicative alternative.'),
                N('Encourage: “Try your best.”', 'Kind but not instructional in the target skill.'),
                B('Remove multiple problems to speed things up.', 'May reinforce escape (task removal) rather than communication.') ] },
    { text:'Transition to rug. Student lingers at desk, looking away.',
      choices:[ G('Teach & prompt a short transition script with seat choice.', 'Combines skill + motivation; reduces avoidance.'),
                N('Tell them to move quickly; “We’re late.”', 'Adds pressure without a skill cue.'),
                B('Pick up materials and escort by the arm.', 'Physical guidance risks escalation.') ] }
  ],
  reinforcement: [
    { text:'Student uses break card and returns on time, starting name.',
      choices:[ G('Give a token + behavior-specific praise immediately.', 'Immediate reinforcement strengthens the alternative.'),
                N('Smile and award later.', 'Delay weakens the contingency.'),
                B('Wait until the whole page is done.', 'Raises effort; weakens replacement–reinforcer link.') ] },
    { text:'On-task for 5 minutes at centers.',
      choices:[ G('Deliver token on schedule with specific praise.', 'Consistency builds momentum.'),
                N('Give praise only; skip the token this round.', 'Half the plan; weaker than planned reinforcement.'),
                B('Save tokens to give in bulk at the end.', 'Bulk delivery reduces contingency clarity.') ] }
  ],
  consequence: [
    { text:'Student mutters “This is dumb” and swivels away from desk.',
      choices:[ G('Planned ignore the comment; prompt “Ask for help or a break.”', 'Avoid reinforcing refusal; prompt alternative.'),
                N('Offer to write the first sentence for them.', 'May help once but risks reinforcing escape.'),
                B('Argue about respect/compliance.', 'Provides attention and escalates.') ] },
    { text:'Peer snickers after a dramatic sigh.',
      choices:[ G('Quietly redirect peer; reinforce student for coping.', 'Manages attention pathways and reinforces desired response.'),
                N('Ignore both and continue.', 'Allows attention reinforcement to linger.'),
                B('Publicly reprimand the peer loudly.', 'Adds high-intensity attention to the scene.') ] }
  ],
  crisis: [
    { text:'Student stands, eyes the door, and speed-walks toward it.',
      choices:[ G('Maintain visual; call office; do not chase; calmly prompt return plan.', 'Matches plan: notify + safety + no chase/block.'),
                B('Block the door with your body.', 'Can escalate to aggression; not in plan.'),
                B('Raise voice: “Get back here now!”', 'High-intensity attention escalates.') ] },
    { text:'They’re in the hallway; you’re 12 feet behind with line-of-sight.',
      choices:[ G('Use calm, brief cue linked to reinforcement upon return.', 'Non-escalatory cue + reinforcement for de-escalation.'),
                N('Shadow silently without calling.', 'Safer than chasing, but notify team per plan.'),
                B('Hurry to grab an arm before the corner.', 'Physical contact can escalate; violates no-chase.') ] },
    { text:'Support arrives. Student slows near the library door.',
      choices:[ G('Prompt return script; walk back; document; debrief later.', 'Closure with fidelity + documentation + debrief.'),
                N('Return immediately without debrief.', 'Misses learning from incident; still okay for safety.'),
                B('Lecture about rules the whole walk back.', 'Sustained attention may reinforce behavior.') ] }
  ],
  wildcard: [
    { text:'Surprise assembly announced during writing block.',
      choices:[ G('Preview change with a quick visual; offer role (door holder/time checker).', 'Predictability + role reduce escape.'),
                N('“Plans changed—let’s go.”', 'Neutral announcement lacks supports.'),
                B('Rush without explanation.', 'Increases uncertainty and dysregulation.') ] },
    { text:'Sub para today who doesn’t know the plan.',
      choices:[ G('Do a 60-second plan briefing + cue cards.', 'Sets up consistent adult behavior.'),
                N('Ask the sub to “watch closely.”', 'Too vague to ensure fidelity.'),
                B('Assume they’ll figure it out.', 'High risk of drift and escalation.') ] },
    { text:'Indoor recess; noise rises quickly; pacing begins.',
      choices:[ G('Offer calm-corner + timer + token for returning.', 'Function-matched break + reinforcement.'),
                N('Ask to choose a game.', 'Choice helps; add a break option for escape function.'),
                B('Tell them to sit and be quiet.', 'High control without support increases escape.') ] },
    { text:'Open-ended writing prompt assigned; student freezes.',
      choices:[ G('Offer sentence starters / scribe first line; reinforce initiation.', 'Reduces effort; builds momentum.'),
                N('Suggest brainstorming later.', 'Defers support; may not prevent escape now.'),
                B('Insist on full paragraph without supports.', 'High effort triggers escape.') ] }
  ]
};

/* ============================================================
   DYNAMIC MISSION BUILDER (plugs into your node engine)
   ============================================================ */
let DYN = { nodes: [], order: [], cursor: 0 };
let NEXT_ID = 1000; // dynamic node id space
function newId(){ return NEXT_ID++; }

function buildDailyDrill(rnd){
  // 4-step: Proactive → Teaching → Reinforcement → Consequence
  return [
    sample(POOL.proactive,     1, rnd)[0],
    sample(POOL.teaching,      1, rnd)[0],
    sample(POOL.reinforcement, 1, rnd)[0],
    sample(POOL.consequence,   1, rnd)[0]
  ].filter(Boolean);
}
function buildEmergencySim(rnd){
  return sample(POOL.crisis, 3, rnd);
}
function buildShuffleQuest(rnd){
  // 5–7 mixed scenes
  const base = [
    ...sample(POOL.proactive,     1, rnd),
    ...sample(POOL.teaching,      1, rnd),
    ...sample(POOL.reinforcement, 1, rnd),
    ...sample(POOL.consequence,   1, rnd),
    ...sample(POOL.crisis,        1, rnd),
    ...sample(POOL.wildcard,      2, rnd)
  ];
  const desired = 5 + Math.floor(rnd()*3); // 5,6,7
  return shuffle(base, rnd).slice(0, desired);
}

function startDynamicMission(modeLabel, scenes){
  // Convert pooled scenes to temporary nodes that your engine can render
  DYN = { nodes: [], order: [], cursor: 0 };
  const ids = scenes.map(() => newId());
  scenes.forEach((sc, i) => {
    const nextId = (i < scenes.length - 1) ? ids[i+1] : 901; // summary node is 901 in your script
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
  // Jump to first dynamic node
  scenarioTitle.textContent = `Mission: ${modeLabel}`;
  showNode(ids[0]);
}

/* ============================================================
   YOUR ORIGINAL NODES — INTRO + SUMMARY KEPT
   Only change: the INTRO now offers the 3 modes.
   (Your previous static scenarios are still present below if you want them;
   but the 3 buttons feed the dynamic builder above.)
   ============================================================ */
const NODES = [
  { // INTRO (updated choices)
    id: 1, intro: true,
    text:
      "Welcome to Mission: Reinforceable.\n\n" +
      "Choose a training mode:\n" +
      "• Daily Drill (BIP fidelity practice)\n" +
      "• Emergency Sim (crisis rehearsal)\n" +
      "• Shuffle Quest (mixed curveballs)\n",
    options: [
      { text: "Daily Drill — Practice BIP Steps",   mode: 'drill'   },
      { text: "Emergency Sim — Support a Crisis",   mode: 'crisis'  },
      { text: "Shuffle Quest — Random Mission",     mode: 'random'  }
    ]
  },

  /* ---- You can keep your original static scenario nodes below if you want ---- */
  /* (omitted here for brevity; dynamic modes now cover multi-week variety) */

  /* SUMMARY (unchanged id = 901) */
  {
    id: 901, feedback: true, text: "Session Summary",
    options: [
      { text: "Play again (choose a mode)", nextId: 1 }
    ]
  }
];

/* -------- Node engine (kept, with a tiny hook to start modes) -------- */
function showNode(id) {
  // Dynamic nodes take precedence if id belongs to the dynamic set
  const dyn = DYN.nodes.find(n => n.id === id);
  const node = dyn || NODES.find(n => n.id === id);
  if (!node) return;

  // Title
  if (scenarioTitle) {
    scenarioTitle.textContent =
      node.intro ? "Behavior Intervention Simulator - Example Game" :
      node.feedback ? "Fidelity Feedback" :
      node.scenario || "Choose Your Next Move";
  }

  // Main text
  if (node.feedback) {
    const pct = percentScore();
    const msg = fidelityMessage();
    storyText.textContent = `Your score: ${points} / ${maxPossible} (${pct}%)`;
    showFeedback(msg, pct >= 80 ? "correct" : "coach", 0);
  } else {
    storyText.textContent = node.text;
  }

  // Choices
  choicesDiv.innerHTML = '';
  const options = shuffledOptions(node.options);
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      // If this is a MODE choice from the intro, start a dynamic mission
      if (node.intro && opt.mode) {
        resetGame();
        const rnd = srandom(seedFromDate());
        if (opt.mode === 'drill')   startDynamicMission('Daily Drill',   buildDailyDrill(rnd));
        if (opt.mode === 'crisis')  startDynamicMission('Emergency Sim', buildEmergencySim(rnd));
        if (opt.mode === 'random')  startDynamicMission('Shuffle Quest', buildShuffleQuest(rnd));
        return;
      }

      // Normal scored option
      if (!node.feedback && typeof opt.delta === 'number') addPoints(opt.delta);

      // Immediate feedback via wizard pod
      if (opt.feedback) {
        showFeedback(opt.feedback, opt.feedbackType || "coach", opt.delta);
      } else if (!node.feedback) {
        showFeedback('', null, 0);
      }

      if (opt.nextId === 1) resetGame();
      showNode(opt.nextId);
    });
    choicesDiv.appendChild(btn);
  });

  // Intro hint: show +10 wizard glow on home screen
  if (node.intro) {
    showFeedback(
      "Pick a mode to start. You’ll get immediate wizard feedback on each decision.",
      "correct",
      +10
    );
  }
}

/* -------- INIT (kept) -------- */
window.addEventListener('load', () => {
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => { resetGame(); showNode(1); });
  }
  resetGame();
  showNode(1);
});
