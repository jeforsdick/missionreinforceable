/* Mission: Reinforceable — Multi-Week, Multi-Mode Script
   Modes:
   - Daily Drill (BIP steps): randomized set of Proactive → Teaching → Reinforcement → Consequence
   - Emergency Sim (Crisis): crisis rehearsal (e.g., elopement) with safe responses
   - Shuffle Quest (Random): mixed set from all pools + wildcard school curveballs

   Integration:
   - Works with your current index.html ids:
       #mode-menu, #story-text, #choices, #feedback, #nav, #next, #back-to-menu
       #scenario-title, #points (optional: if you have a points element)
   - Requires no external libraries.
*/

/* ---------------------------- DOM HOOKS ---------------------------- */
const storyText   = document.getElementById('story-text');
const choicesDiv  = document.getElementById('choices');
const feedbackEl  = document.getElementById('feedback');
const navEl       = document.getElementById('nav');
const menuEl      = document.getElementById('mode-menu');
const titleEl     = document.getElementById('scenario-title') || { innerText: '' };
const pointsEl    = document.getElementById('points') || { textContent: '' };

const btnDrill    = document.getElementById('start-drill');
const btnCrisis   = document.getElementById('start-crisis');
const btnRandom   = document.getElementById('start-random');
const btnNext     = document.getElementById('next');
const btnMenu     = document.getElementById('back-to-menu');

/* ---------------------------- UTILITIES ---------------------------- */
function show(el){ if(el) el.hidden = false; }
function hide(el){ if(el) el.hidden = true; }
function clear(el){ if(!el) return; while(el.firstChild) el.removeChild(el.firstChild); }
function shuffle(arr, rnd=Math.random){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function sample(pool, k, rnd=Math.random){
  const bag = shuffle(pool, rnd);
  return bag.slice(0, Math.min(k, bag.length));
}

/* Seeded RNG so the set rotates each day (stable within a day) */
function seedFromDate(){
  const d = new Date();
  const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  let h = 0;
  for(let i=0;i<key.length;i++){ h = (h<<5)-h + key.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}
function srandom(seed){
  let x = seed>>>0;
  return function(){
    x ^= x<<13; x ^= x>>>17; x ^= x<<5;
    return ((x>>>0) / 4294967295);
  }
}

/* ---------------------------- META (PER TEACHER) ----------------------------
   Swap these values for each teacher when you build their game.
----------------------------------------------------------------------------- */
const META = {
  student:    'JM',
  grade:      '1st',
  function:   'Escape',
  replacement:['Request a 5‑min break', 'Ask for help'],
  desired:    'Stays in area and completes work ~80% of lesson',
  reinforcement: 'Mario coin token board → Break/Spin with Mr. Jakob',
  crisis:     'If leaves room: maintain visual; call office; do not chase; follow ESI',
};

/* ---------------------------- CHOICE HELPERS ---------------------------- */
const G=(label, why)=>({label, tag:'good',    delta:+10, why});
const N=(label, why)=>({label, tag:'neutral', delta:  0, why});
const B=(label, why)=>({label, tag:'bad',     delta:-10, why});

/* ---------------------------- SCENE POOLS ----------------------------
   You can keep adding items to these arrays. The builders will create
   fresh combinations every session for three weeks or more.
---------------------------------------------------------------------------*/

const poolProactive = [
  { text: 'Five minutes to specials. JM tenses at “line up.” What do you do first?',
    choices: [
      G('Show visual schedule + pre‑correct; offer line job/choice.', 'Pre‑correction + choice reduces escape by clarifying expectations.'),
      N('Ask the para to stand near JM.', 'Proximity helps but does not teach or address function.'),
      B('Skip preview to stay on time; “Everyone line up now!”', 'Skipping proactive supports increases escape risk.')
    ]
  },
  { text: 'Centers about to rotate. JM glances at the door.',
    choices: [
      G('Pre‑correct and point to his next center on the map.', 'Predictability lowers avoidance.'),
      N('Tell class to rotate; no individual cue.', 'Generic cues miss JM’s need for predictability.'),
      B('Rush rotation because the timer already went off.', 'Rushing raises transition stress.')
    ]
  },
  { text: 'Sub day: schedule slightly shifted and noisier than usual.',
    choices: [
      G('Preview a simplified visual schedule; star a preferred block.', 'Visuals + motivation buffer change stress.'),
      N('Say “We’ll figure it out” and begin.', 'Ambiguity fuels escape‑maintained behavior.'),
      B('Tell students there is no time to explain; get started.', 'Abrupt change without preview increases risk.')
    ]
  },
  { text: 'Independent work after recess — historically tough for JM.',
    choices: [
      G('Offer choice of task order + set a visible 5‑min timer.', 'Choice + predictability reduces response effort.'),
      N('Place JM near a quiet peer.', 'Helpful but not a BIP step; less targeted.'),
      B('Start with the hardest task to “get it over with.”', 'High effort first likely triggers escape.')
    ]
  },
  { text: 'Morning arrival; backpacks everywhere; class energy is high.',
    choices: [
      G('Greet JM; review first‑then visual (First: Morning Work → Then: Coins).', 'Pairs routine with reinforcement to prevent drift.'),
      N('Give a general class reminder to start work.', 'Not individualized to function.'),
      B('Hold back coins until the end of the day only.', 'Removes immediate reinforcement; weakens contingency.')
    ]
  }
];

const poolTeaching = [
  { text: 'During writing, JM stares at the door and grips his pencil—early signs of avoidance.',
    choices: [
      G('Prompt: “If you need it, use your break card for 5 minutes.”', 'Prompt replacement before escalation; function‑matched.'),
      N('State the rule: “We stay in our seats during work time.”', 'Rule reminder is not teaching the replacement skill.'),
      B('“Start now or lose recess.”', 'Punitive threats increase escape and don’t teach the skill.')
    ]
  },
  { text: 'Math problem seems too hard. JM whispers “too hard.”',
    choices: [
      G('Model asking for help; brief role‑play then try the first step.', 'Teaches the communicative alternative to escape.'),
      N('Encourage: “Try your best.”', 'Kind but not instructional in the target skill.'),
      B('Remove multiple problems to speed him up.', 'May reinforce escape (task removal) rather than communication.')
    ]
  },
  { text: 'Transition to rug. JM lingers at desk, looking away.',
    choices: [
      G('Teach & prompt a short transition script with choice of seat.', 'Combines skill and motivation; reduces avoidance.'),
      N('Tell him to move quickly; “We’re late.”', 'Adds pressure without a skill cue.'),
      B('Pick up his materials and escort him by the arm.', 'Physical guidance risks escalation.')
    ]
  },
  { text: 'Before small groups, JM asks to get water repeatedly.',
    choices: [
      G('Teach & prompt: “Ask for a 2‑min break after first problem.”', 'Schedules a function‑matched break, reducing escape.'),
      N('Let him go once and hope it helps.', 'May become avoidance without a limit/schedule.'),
      B('Refuse abruptly: “No more water.”', 'Hard denial can escalate behavior.')
    ]
  }
];

const poolReinforcement = [
  { text: 'JM uses the break card and returns on time, starting his name.',
    choices: [
      G('Give a Mario coin + behavior‑specific praise immediately.', 'Immediate reinforcement strengthens the alternative.'),
      N('Smile and award later.', 'Delay weakens the contingency.'),
      B('Wait until the whole page is done.', 'Raises effort; weakens replacement–reinforcer link.')
    ]
  },
  { text: 'JM is on‑task for 5 minutes at centers.',
    choices: [
      G('Deliver coin on schedule with specific praise.', 'Consistency builds momentum and clarity.'),
      N('Give praise only; skip the coin this round.', 'Half the plan; weaker than planned reinforcement.'),
      B('Save coins to give in bulk at the end.', 'Bulk delivery reduces contingency clarity.')
    ]
  },
  { text: 'After asking for help, JM completes the first problem.',
    choices: [
      G('Praise the help‑request + give coin for initiation.', 'Pairs communication with reinforcement.'),
      N('Thank him and move to another student.', 'Missed opportunity to strengthen the skill.'),
      B('Ignore and only praise quiet sitting later.', 'Reinforces an unrelated behavior.')
    ]
  }
];

const poolConsequence = [
  { text: 'JM mutters “This is dumb” and swivels away from the desk.',
    choices: [
      G('Planned ignore the comment; prompt “Ask for help or a break.”', 'Avoid reinforcing refusal; prompt alternative.'),
      N('Offer to write the first sentence for him.', 'May help once but risks reinforcing escape.'),
      B('Argue about respect/compliance.', 'Provides attention and escalates.')
    ]
  },
  { text: 'Peer snickers after JM sighs dramatically.',
    choices: [
      G('Quietly redirect peer; reinforce JM for coping appropriately.', 'Manages attention pathways; reinforces desired response.'),
      N('Ignore both and continue.', 'Allows attention reinforcement to linger.'),
      B('Publicly reprimand the peer loudly.', 'Adds high‑intensity attention to the scene.')
    ]
  },
  { text: 'JM drops pencil and says “I’m done,” crossing arms.',
    choices: [
      G('Prompt replacement; offer 2 choices to re‑engage; reinforce initiation.', 'Balances consequence with function‑matched prompt.'),
      N('Let him sit out until he’s ready.', 'Could become escape without skill practice.'),
      B('Remove preferred time later as punishment.', 'Delayed punishment rarely builds the target skill.')
    ]
  }
];

const poolCrisis = [
  { text: 'JM stands, eyes the door, and speed‑walks toward it.',
    choices: [
      G('Maintain visual; call office; do not chase; calmly prompt return plan.', 'Matches plan: notify + safety + no chase/block.'),
      B('Block the door with your body.', 'Can escalate to aggression; not in plan.'),
      B('Raise voice: “Get back here now!”', 'High‑intensity attention escalates.')
    ]
  },
  { text: 'He is in the hallway; you are 12 feet behind with line‑of‑sight.',
    choices: [
      G('Use calm, brief cue linked to reinforcement upon return.', 'Non‑escalatory cue + reinforcement for de‑escalation.'),
      N('Shadow silently without calling.', 'Safer than chasing, but notify team per plan.'),
      B('Hurry to grab his arm before he turns the corner.', 'Physical contact can escalate; violates no‑chase guidance.')
    ]
  },
  { text: 'Support arrives. JM slows and stops near the library door.',
    choices: [
      G('Prompt return script; walk back together; document; debrief later.', 'Closure with fidelity + documentation + debrief.'),
      N('Return immediately without debrief.', 'Misses learning from incident; still okay for safety.'),
      B('Lecture about rules the whole walk back.', 'Sustained attention during return reinforces behavior.')
    ]
  }
];

const poolWildcard = [
  { text: 'Surprise assembly announced during writing block.',
    choices: [
      G('Preview change with a quick visual; offer role (door holder/time checker).', 'Predictability + meaningful role reduce escape.'),
      N('Tell the class “Plans changed—let’s go.”', 'Neutral announcement lacks supports.'),
      B('Rush students without explanation.', 'Increases uncertainty and dysregulation.')
    ]
  },
  { text: 'Sub para today who doesn’t know the plan.',
    choices: [
      G('Do a 60‑second plan briefing + cue cards.', 'Sets up consistent adult behavior.'),
      N('Ask the sub to “watch JM closely.”', 'Too vague to ensure fidelity.'),
      B('Assume the sub will figure it out.', 'High risk of drift and escalation.')
    ]
  },
  { text: 'Peer: “Hurry up or we’ll be last.” JM glares and grips desk.',
    choices: [
      G('Prompt replacement (help/break) + coach peer on supportive language.', 'Addresses function and peer ecology.'),
      N('Ignore and move on.', 'Misses an antecedent to coach.'),
      B('Scold JM for being slow.', 'Punishes the wrong student; increases escape.')
    ]
  },
  { text: 'Fire drill during math. JM covers ears and heads toward coat hooks.',
    choices: [
      G('Provide headphones/cover + visual route + buddy role.', 'Accommodations + role reduce distress.'),
      N('Escort quietly with minimal talk.', 'OK, but lacks individualized supports.'),
      B('Command loudly: “Stop that and move!”', 'Adds intensity; increases avoidance.')
    ]
  },
  { text: 'Indoor recess. Noise rises quickly; JM paces.', 
    choices: [
      G('Offer calm‑corner option + timer + token for returning.', 'Function‑matched break + reinforcement.'),
      N('Ask him to choose a game.', 'Choice helps; add break option for escape function.'),
      B('Tell him to sit and be quiet.', 'High control without support increases escape.')
    ]
  },
  { text: 'Open‑ended writing prompt assigned; JM freezes.',
    choices: [
      G('Offer sentence starters or scribe first line; reinforce initiation.', 'Reduces response effort; builds momentum.'),
      N('Suggest brainstorming later.', 'Defers support; may not prevent escape now.'),
      B('Insist on full paragraph without supports.', 'High effort triggers escape.')
    ]
  }
];

/* ---------------------------- MISSION BUILDERS ---------------------------- */
function buildDailyDrill(rnd){ // 4‑step BIP fidelity
  // Randomly select one from each fidelity area
  const steps = [
    sample(poolProactive,   1, rnd)[0],
    sample(poolTeaching,    1, rnd)[0],
    sample(poolReinforcement,1, rnd)[0],
    sample(poolConsequence, 1, rnd)[0]
  ].filter(Boolean);
  return steps;
}

function buildEmergencySim(rnd){ // 3‑step crisis
  return sample(poolCrisis, 3, rnd);
}

function buildShuffleQuest(rnd){ // 5‑7 mixed
  const base = [
    ...sample(poolProactive,    1, rnd),
    ...sample(poolTeaching,     1, rnd),
    ...sample(poolReinforcement,1, rnd),
    ...sample(poolConsequence,  1, rnd),
    ...sample(poolCrisis,       1, rnd),
    ...sample(poolWildcard,     2, rnd)
  ];
  // Cap length to keep sessions short; randomize 5–7
  const desiredLength = 5 + Math.floor(rnd()*3); // 5,6,7
  return shuffle(base, rnd).slice(0, desiredLength);
}

/* ---------------------------- STATE ---------------------------- */
let mission = [];
let stepIndex = 0;
let points = 0;
let currentMode = null;

/* Persist last mode played for quick start */
function saveLastMode(mode){ try{ localStorage.setItem('mr_last_mode', mode); }catch(e){} }
function loadLastMode(){ try{ return localStorage.getItem('mr_last_mode'); }catch(e){ return null; } }

/* ---------------------------- RENDERERS ---------------------------- */
function renderStep(){
  const step = mission[stepIndex];
  storyText.textContent = step.text;
  clear(choicesDiv);
  const rnd = srandom(seedFromDate() + stepIndex);
  const shuffled = shuffle(step.choices, rnd);
  shuffled.forEach(choice => {
    const b = document.createElement('button');
    b.textContent = choice.label;
    b.classList.add(choice.tag === 'good' ? 'choice-good' : choice.tag === 'neutral' ? 'choice-neutral' : 'choice-bad');
    b.addEventListener('click', () => selectChoice(choice));
    choicesDiv.appendChild(b);
  });
  hide(feedbackEl);
}

function selectChoice(choice){
  points += (choice.delta || 0);
  pointsEl.textContent = String(points);
  feedbackEl.innerHTML = `<strong>${
      choice.tag === 'good' ? '✔ Why this works:' :
      choice.tag === 'neutral' ? '• Consider:' : '✖ Risk:'
    }</strong>${choice.why}`;
  show(feedbackEl);
}

function nextStep(){
  if(stepIndex < mission.length - 1){
    stepIndex++;
    renderStep();
  }else{
    storyText.textContent =
`Mission complete.

Desired outcome: ${META.desired}
Crisis reminder: ${META.crisis}

Final Score: ${points} / ${mission.length * 10}`;
    clear(choicesDiv);
    hide(feedbackEl);
    // keep nav so user can go back
    if(btnNext) btnNext.disabled = true;
  }
}

function backToMenu(){
  if(btnNext) btnNext.disabled = false;
  titleEl.innerText = 'Mission: Reinforceable';
  show(menuEl);
  hide(storyText);
  hide(choicesDiv);
  hide(feedbackEl);
  hide(navEl);
  points = 0; pointsEl.textContent = '0';
}

/* ---------------------------- STARTERS ---------------------------- */
function startMission(mode){
  currentMode = mode;
  saveLastMode(mode);
  const rnd = srandom(seedFromDate());
  points = 0; pointsEl.textContent = '0';
  stepIndex = 0;
  if (mode === 'drill'){
    titleEl.innerText = 'Mission: Daily Drill';
    mission = buildDailyDrill(rnd);
  } else if (mode === 'crisis'){
    titleEl.innerText = 'Mission: Emergency Sim';
    mission = buildEmergencySim(rnd);
  } else {
    titleEl.innerText = 'Mission: Shuffle Quest';
    mission = buildShuffleQuest(rnd);
  }
  hide(menuEl);
  show(storyText);
  show(choicesDiv);
  show(navEl);
  renderStep();
}

/* ---------------------------- EVENTS ---------------------------- */
if(btnDrill)  btnDrill.addEventListener('click', ()=> startMission('drill'));
if(btnCrisis) btnCrisis.addEventListener('click', ()=> startMission('crisis'));
if(btnRandom) btnRandom.addEventListener('click', ()=> startMission('random'));
if(btnNext)   btnNext.addEventListener('click', nextStep);
if(btnMenu)   btnMenu.addEventListener('click', backToMenu);

/* ---------------------------- BOOT ---------------------------- */
backToMenu();
// Optional: auto-suggest last mode
// const last = loadLastMode(); if(last) startMission(last);
