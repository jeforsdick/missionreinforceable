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
  setPoints(0);
  showFeedback('', null, 0); // neutral
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
  proactive: [
    { text:'Five minutes to specials. Student tenses at “line up.” What do you do first?',
      choices:[ G('Show visual schedule + pre-correct; offer line job/choice.', 'Pre-correction + choice reduces escape.'),
                N('Ask the para to stand near the student.', 'Proximity helps but does not teach or address function.'),
                B('Skip preview to stay on time; “Everyone line up now!”', 'Skipping proactive supports increases escape risk.') ] },
    { text:'Centers about to rotate. Student glances at the door.',
      choices:[ G('Pre-correct and point to next center on the map.', 'Predictability lowers avoidance.'),
                N('Tell class to rotate; no individual cue.', 'Generic cues miss the student’s need for predictability.'),
                B('Rush rotation because the timer already went off.', 'Rushing raises transition stress.') ] },
    { text:'Sub day: schedule slightly shifted and noisy.',
      choices:[ G('Preview a simplified visual schedule and star a preferred block.', 'Visuals + motivation buffer change.'),
                N('Say “We’ll figure it out” and begin.', 'Ambiguity fuels escape-maintained behavior.'),
                B('Tell students there is no time to explain; just get started.', 'Abrupt change increases risk.') ] },
    { text:'Independent work after recess — historically tough.',
      choices:[ G('Offer choice of task order + set a visible 5-min timer.', 'Choice + predictability reduces response effort.'),
                N('Place student near a quiet peer.', 'Helpful but not a BIP step.'),
                B('Start with the hardest task to “get it over with.”', 'High effort first likely triggers escape.') ] },
    { text:'Morning arrival; backpacks everywhere; energy is high.',
      choices:[ G('Greet; review first-then visual (First: Morning Work → Then: Token).', 'Pairs routine with reinforcement to prevent drift.'),
                N('General reminder to start work.', 'Not individualized to function.'),
                B('Hold back tokens until day’s end only.', 'Removes immediate reinforcement; weakens contingency.') ] }
  ],
  teaching: [
    { text:'During writing, student stares at the door and grips pencil—early signs of avoidance.',
      choices:[ G('Prompt: “If you need it, use your break card for 5 minutes.”', 'Prompt replacement before escalation; function-matched.'),
                N('State the rule: “We stay in our seats during work time.”', 'Rule reminder is not skill instruction.'),
                B('“Start now or lose recess.”', 'Punitive threats increase escape and don’t teach the skill.') ] },
    { text:'Math problem seems too hard. Student whispers “too hard.”',
      choices:[ G('Model asking for help; brief role-play; try first step.', 'Teaches the communicative alternative.'),
                N('Encourage: “Try your best.”', 'Kind but not instructional.'),
                B('Remove multiple problems to speed things up.', 'May reinforce escape (task removal) rather than communication.') ] },
    { text:'Transition to rug. Student lingers at desk, looking away.',
      choices:[ G('Teach & prompt a short transition script with seat choice.', 'Combines skill + motivation; reduces avoidance.'),
                N('Tell them to move quickly; “We’re late.”', 'Adds pressure without a skill cue.'),
                B('Pick up materials and escort by the arm.', 'Physical guidance risks escalation.') ] },
    { text:'Before small groups, student asks to get water repeatedly.',
      choices:[ G('Teach: “Ask for a 2-min break after first problem.”', 'Schedules a function-matched break.'),
                N('Let them go once and hope it helps.', 'May become avoidance without a limit.'),
                B('Refuse abruptly: “No more water.”', 'Hard denial can escalate behavior.') ] }
  ],
  reinforcement: [
    { text:'Student uses the break card and returns on time, starting name.',
      choices:[ G('Give a token + behavior-specific praise immediately.', 'Immediate reinforcement strengthens the alternative.'),
                N('Smile and award later.', 'Delay weakens the contingency.'),
                B('Wait until the whole page is done.', 'Raises effort; weakens replacement–reinforcer link.') ] },
    { text:'On-task for 5 minutes at centers.',
      choices:[ G('Deliver token on schedule with specific praise.', 'Consistency builds momentum and clarity.'),
                N('Give praise only; skip the token this round.', 'Half the plan; weaker than planned reinforcement.'),
                B('Save tokens to give in bulk at the end.', 'Bulk delivery reduces contingency clarity.') ] },
    { text:'After asking for help, student completes the first problem.',
      choices:[ G('Praise the help-request + give token for initiation.', 'Pairs communication with reinforcement.'),
                N('Thank them and move to another student.', 'Missed opportunity to strengthen the skill.'),
                B('Ignore and only praise quiet sitting later.', 'Reinforces an unrelated behavior.') ] }
  ],
  consequence: [
    { text:'Student mutters “This is dumb” and swivels away from desk.',
      choices:[ G('Planned ignore the comment; prompt “Ask for help or a break.”', 'Avoid reinforcing refusal; prompt alternative.'),
                N('Offer to write the first sentence for them.', 'May help once but risks reinforcing escape.'),
                B('Argue about respect/compliance.', 'Provides attention and escalates.') ] },
    { text:'Peer snickers after a dramatic sigh.',
      choices:[ G('Quietly redirect peer; reinforce student for coping.', 'Manages attention pathways and reinforces desired response.'),
                N('Ignore both and continue.', 'Allows attention reinforcement to linger.'),
                B('Publicly reprimand the peer loudly.', 'Adds high-intensity attention to the scene.') ] },
    { text:'Student drops pencil and says “I’m done,” crossing arms.',
      choices:[ G('Prompt replacement; offer 2 choices to re-engage; reinforce initiation.', 'Balances consequence with function-matched prompt.'),
                N('Let them sit out until ready.', 'Could become escape without skill practice.'),
                B('Remove preferred time later as punishment.', 'Delayed punishment rarely builds the target skill.') ] }
  ],
  crisis: [
    { text:'Student stands, eyes the door, and speed-walks toward it.',
      choices:[ G('Maintain visual; call office; do not chase; calmly prompt return plan.', 'Matches plan: notify + safety + no chase/block.'),
                B('Block the door with your body.', 'Can escalate to aggression; not in plan.'),
                B('Raise voice: “Get back here now!”', 'High-intensity attention escalates.') ] },
    { text:'They are in the hallway; you are 12 feet behind with line-of-sight.',
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
    { text:'Peer: “Hurry up or we’ll be last.” Student glares and grips desk.',
      choices:[ G('Prompt replacement (help/break) + coach peer on supportive language.', 'Addresses function and peer ecology.'),
                N('Ignore and move on.', 'Misses an antecedent to coach.'),
                B('Scold the student for being slow.', 'Punishes the wrong student; increases escape.') ] },
    { text:'Fire drill during math. Student covers ears and heads toward hooks.',
      choices:[ G('Provide headphones/cover + visual route + buddy role.', 'Accommodations + role reduce distress.'),
                N('Escort quietly with minimal talk.', 'OK, but lacks individualized supports.'),
                B('Command loudly: “Stop that and move!”', 'Adds intensity; increases avoidance.') ] },
    { text:'Indoor recess. Noise rises quickly; pacing begins.',
      choices:[ G('Offer calm-corner option + timer + token for returning.', 'Function-matched break + reinforcement.'),
                N('Ask to choose a game.', 'Choice helps; add a break option for escape function.'),
                B('Tell them to sit and be quiet.', 'High control without support increases escape.') ] },
    { text:'Open-ended writing prompt assigned; student freezes.',
      choices:[ G('Offer sentence starters or scribe first line; reinforce initiation.', 'Reduces effort; builds momentum.'),
                N('Suggest brainstorming later.', 'Defers support; may not prevent escape now.'),
                B('Insist on full paragraph without supports.', 'High effort triggers escape.') ] }
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

You’ll step through short, branching scenarios based on a Behavior Intervention Plan (BIP).
At each decision point, choose the teacher move that best aligns with:
• Proactive supports
• Teaching and prompting replacement behaviors
• Reinforcing the right responses

Choose Your Mission
Select a training mode. New combos rotate daily for three weeks.`;

  // Card deck below the intro pod
  const menu = document.createElement('div');
  menu.className = 'mission-grid';

  menu.innerHTML = `
    <div class="mission-card">
      <h3>Launch Sequence</h3>
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
}

/* -------- Static summary node -------- */
const NODES = [
  { id: 901, feedback: true, text: "Session Summary",
    options: [{ text: "Play again (choose a mode)", nextId: 1 }] }
];

/* -------- Engine (classic, with dynamic support) -------- */
function getNode(id){
  return (DYN.nodes.find(n => n.id === id)) || (NODES.find(n => n.id === id)) || null;
}

function showNode(id) {
  const node = getNode(id);
  if (!node) return;

  // Title
  if (scenarioTitle) {
    scenarioTitle.textContent =
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
    ["scenario-btn","primary","big","option-btn"].forEach(c => btn.classList.add(c)); // keep your styling

    btn.addEventListener('click', () => {
      // Mode choices aren’t here anymore (cards start missions), but keep generic flow
      if (!node.feedback && typeof opt.delta === 'number') addPoints(opt.delta);

      // Immediate wizard feedback
      if (opt.feedback) showFeedback(opt.feedback, opt.feedbackType || "coach", opt.delta);
      else if (!node.feedback) showFeedback('', null, 0);

      if (opt.nextId === 1) { resetGame(); renderIntroCards(); return; }
      showNode(opt.nextId);
    });
    choicesDiv.appendChild(btn);
  });
}

/* -------- Single INIT (no duplicates) -------- */
window.addEventListener('load', () => {
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) homeBtn.addEventListener('click', () => { resetGame(); renderIntroCards(); });
  resetGame();
  renderIntroCards();  // show the card menu intro
});
