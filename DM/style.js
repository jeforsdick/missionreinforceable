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
  minus: 'mr-wizard-minus10.png'
};

// Always show a sprite immediately and avoid stale-cache
function setWizardSprite(state) {
  const src = (state === 'plus') ? WIZ.plus : (state === 'minus') ? WIZ.minus : WIZ.meh;
  if (coachImgEl) coachImgEl.src = `${src}?v=${Date.now()}`;
}
// default image on load
setWizardSprite('meh');

let currentScenario = null; // will be set when starting a mission
let currentMode = null; // "Daily" | "Crisis" | "Wildcard"


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

  // === CLEAR FEEDBACK & SUMMARY PANEL ON RESTART ===
  showFeedback('', null, 0);
  if (scenarioTitle) {
    scenarioTitle.textContent = "Behavior Intervention Simulator";
  }
  const oldSummary = document.getElementById('summary-panel');
  if (oldSummary) oldSummary.remove();
}
function percentScore() {
  if (maxPossible === 0) return 0;
  const raw = (points / maxPossible) * 100;
  return Math.max(0, raw); // CAP AT 0%
}
function fidelityMessage() {
  const pct = percentScore();

  // PJ (Kinder) — wandering/elopement + silly noises (attention) — updated summary statement

if (pct >= 80) {
  return "High fidelity. You used calm, close one-step prompts (“in your area/seat/spot”), pointed to the sticker chart, and reinforced fast and quietly. PJ had a clear path to success (stickers toward a positive call home) and you reduced the audience when peers reacted.";
}
if (pct >= 50) {
  return "Getting there. Use fewer words and move faster into the routine: prompt “in your area/seat/spot,” point to the sticker chart, and give the sticker right when he returns. If silly noises start, redirect peers first and keep your support private. Use warning → clip down quietly if it repeats, then reinforce recovery.";
}
return "Not aligned yet. Reset your approach: minimal language, no public corrections or long talks, and go straight to the predictable steps (close prompt to area/seat/spot, point to the chart, immediate sticker for returning). Reduce the audience first. If he heads toward the door or you cannot respond fully, activate support early (aide/tech/office chat) and prioritize safety and line-of-sight.";

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
const RESULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbyZ4Z7Axzzb0hwMSJ2wQ1127sjNeeK3P9T-sOSr9P2teZpKyogHPOUAkZllVK13-XeR/exec";

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

  // === DETERMINE MODE ===
  let mode = "Wildcard"; // default
  if (currentScenario && currentScenario.title) {
    if (currentScenario.title.includes("Daily")) mode = "Daily";
    else if (currentScenario.title.includes("Crisis") || currentScenario.title.includes("Emergency")) mode = "Crisis";
  }

  // === GET STUDENT FROM URL (e.g. ?student=PJ) ===
  const url = new URL(window.location.href);
  const student = url.searchParams.get("student") || "PJ";

  const payload = {
    teacher_code: getTeacherCode(),
    session_id: SESSION_ID,
    points,
    max_possible: maxPossible,
    percent: percentScore(),
    timestamp: new Date().toISOString(),
    log: events,
    mode: mode,
    student: student
  };

  try {
    fetch(RESULT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    })
    .then(() => console.log("Results sent"))
    .catch(err => console.error("Send failed:", err));
  } catch (e) {
    console.error("Fetch threw:", e);
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
 * DAILY SCENARIO 1 — Afternoon Rotations (Wandering + Silly Noises)
 **************************************************/
POOL.daily.push({
  id: "daily_1_afternoon_rotations_wandering_noises",
  title: "Daily Mission: Afternoon Rotations",
  start: "step1",
  steps: {

    step1: {
      text: "During afternoon rotations, PJ leaves his station and starts wandering between groups making loud silly noises to make peers laugh.",
      choices: {
        A: {
          text: "Pre-correct and prompt the chart: “PJ, in your area.” Point to the if-then/sticker chart and say, “Stay here, earn a sticker.”",
          score: 10,
          feedback: "Great fidelity. One clear direction plus the visual earn path reduces wandering and attention-seeking.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Please stop,” and explain why it is distracting.",
          score: 0,
          feedback: "Neutral. Explanation can add attention and keep the behavior going.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “PJ, stop it!” so the class hears.",
          score: -10,
          feedback: "Public correction increases peer attention and can escalate the silly behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ returns to his spot but keeps making small noises while looking at peers.",
      choices: {
        A: {
          text: "Reinforce fast and quiet: give a sticker and whisper, “Nice staying in your area.” Then redirect to the first step of the task.",
          score: 10,
          feedback: "Excellent. Immediate reinforcement strengthens staying in area without feeding the audience.",
          next: "step3A"
        },
        B: {
          text: "Wait to give a sticker until he is perfect for a long time.",
          score: 0,
          feedback: "Neutral. Waiting can weaken motivation for staying in area in Kinder.",
          next: "step3B"
        },
        C: {
          text: "Take away choice time because he made noises.",
          score: -10,
          feedback: "Delayed punishment without teaching the replacement can increase attention bids next rotation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs and makes an even louder noise. Two students giggle and watch him.",
      choices: {
        A: {
          text: "Reduce the audience: redirect peers back to work and quietly prompt PJ, “In your area.” Point to the sticker chart.",
          score: 10,
          feedback: "Great repair. You remove peer reinforcement and return to the visual plan.",
          next: "step3A"
        },
        B: {
          text: "Tell the class, “Ignore PJ,” and keep talking about it.",
          score: 0,
          feedback: "Neutral. It can still create a spotlight moment.",
          next: "step3B"
        },
        C: {
          text: "Have a longer conference with PJ in the moment.",
          score: -10,
          feedback: "Long attention can reinforce the behavior and delay learning time.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ runs a quick loop around the room and tries to pull another student into it.",
      choices: {
        A: {
          text: "Give one calm direction close to him: “Stop. In your area.” Point to the sticker chart and reset the task start.",
          score: 10,
          feedback: "Excellent repair. Short language, clear boundary, and immediate earn path.",
          next: "step3A"
        },
        B: {
          text: "Repeat directions from across the room while managing the class.",
          score: 0,
          feedback: "Neutral. Distance prompts may not work and can increase attention.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and lecture about running.",
          score: -10,
          feedback: "Big attention moment increases peer laughter and escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in his area and begins the first step of the rotation task.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He is engaged and in area. Keep reinforcement tight.", next: "step4" }
      }
    },

    step3B: {
      text: "PJ stays in his area but continues small attention bids with noises.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stable, but he may need faster reinforcement and a clearer next step.", next: "step4" }
      }
    },

    step3C: {
      text: "PJ wanders again and the group gets distracted.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining wandering and noises.", next: "step4" }
      }
    },

    step4: {
      text: "How do you wrap up support for this rotation?",
      choices: {
        A: {
          text: "Give a sticker for staying in area and praise quietly. Mention the goal: “Two more stickers, then you are closer to your call home.”",
          score: 10,
          feedback: "Perfect. Reinforces the plan and keeps motivation high without spotlighting.",
          ending: "success"
        },
        B: {
          text: "Let him continue without giving a sticker even though he stayed in area.",
          score: 0,
          feedback: "Neutral. It weakens the sticker system and makes wandering more likely next time.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier running in front of the group.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Stayed in Area Reinforced", text: "PJ stayed in his area and earned a sticker, strengthening the replacement routine." },
    mixed: { title: "Mixed – Routine Not Strengthened", text: "PJ stayed in area briefly, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Attention Cycle Increased", text: "Public attention increased peer reinforcement and made wandering and noises more likely." }
  }
});


/*************************************************
 * DAILY SCENARIO 2 — Choice Time After Recess (High Energy + Peer Attention)
 **************************************************/
POOL.daily.push({
  id: "daily_2_choice_time_after_recess",
  title: "Daily Mission: Choice Time After Recess",
  start: "step1",
  steps: {

    step1: {
      text: "After recess, choice time begins. PJ is high energy and starts yelling and running between centers to get peers to laugh.",
      choices: {
        A: {
          text: "Front-load supports: “PJ, choose one center.” Point to the sticker chart: “Stay in that area, earn a sticker.”",
          score: 10,
          feedback: "Great. Clear expectation plus an immediate earn path during a known trigger time.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Be safe,” without a specific next step.",
          score: 0,
          feedback: "Neutral. It is a reminder, but it does not give a clear behavior to do.",
          next: "step2B"
        },
        C: {
          text: "Correct him publicly for running and yelling.",
          score: -10,
          feedback: "Public attention can increase the performance behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ chooses a center and stands near it but keeps making loud noises to draw attention.",
      choices: {
        A: {
          text: "Reduce peer reinforcement and reinforce the right thing: praise quietly when he uses an inside voice and give a sticker for staying in area.",
          score: 10,
          feedback: "Excellent. You reinforce the desired behavior quickly and keep attention low-key.",
          next: "step3A"
        },
        B: {
          text: "Wait until the end of choice time to reinforce.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement is less effective for this moment.",
          next: "step3B"
        },
        C: {
          text: "Clip him down immediately for the noises.",
          score: -10,
          feedback: "Immediate punishment without pairing the replacement routine can increase attention-seeking.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs, yells louder, and another student copies him.",
      choices: {
        A: {
          text: "Reset quickly: redirect peers to their centers and quietly cue PJ, “Inside voice. Stay in your area.” Point to the sticker chart.",
          score: 10,
          feedback: "Great repair. Reduces the audience and returns to clear, visual expectations.",
          next: "step3A"
        },
        B: {
          text: "Tell the whole class to stop being loud.",
          score: 0,
          feedback: "Neutral. It can turn into a group attention moment.",
          next: "step3B"
        },
        C: {
          text: "Argue with PJ about why he needs to stop.",
          score: -10,
          feedback: "Back-and-forth attention fuels the behavior.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells, “NO!” and runs toward the classroom door like he might leave the room.",
      choices: {
        A: {
          text: "Use one calm prompt close to him: “Stop. Stay in the room.” Signal for aide or tech support if needed, and point him back to his area.",
          score: 10,
          feedback: "Excellent. Safety-focused, minimal language, and you use support appropriately.",
          next: "step3A"
        },
        B: {
          text: "Call his name loudly from across the room.",
          score: 0,
          feedback: "Neutral. It may work, but it can increase attention and does not guide him to an alternative.",
          next: "step3B"
        },
        C: {
          text: "Chase him quickly while talking loudly.",
          score: -10,
          feedback: "High intensity creates a big attention moment and can escalate elopement attempts.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his center and stays in the area with a calmer voice for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is back in the routine. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays in the room but continues attention bids with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but he needs quicker reinforcement for calm voice and staying put.", next: "step4" } }
    },

    step3C: {
      text: "PJ escalates and peers keep watching him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention increased escalation risk.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up choice time support?",
      choices: {
        A: {
          text: "Give a sticker for staying in area and praise quietly. Add a pom pom to the jar or classroom point if used in your room.",
          score: 10,
          feedback: "Perfect. Reinforcement stays immediate and connected to your systems.",
          ending: "success"
        },
        B: {
          text: "Do not give a sticker even though he stayed in area.",
          score: 0,
          feedback: "Neutral. It weakens the reinforcement routine.",
          ending: "mixed"
        },
        C: {
          text: "Call him out in front of peers about what went wrong.",
          score: -10,
          feedback: "Public attention can trigger a new round of attention-seeking.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Choice Time Routine Strengthened", text: "PJ stayed in area and used a calmer voice, earning reinforcement through the sticker system." },
    mixed: { title: "Mixed – Some Structure, Weak Reinforcement", text: "PJ stabilized, but the earn path was not consistently reinforced." },
    fail: { title: "Fail – Audience Fueled Escalation", text: "Public attention increased yelling and movement, making future choice time harder." }
  }
});


/*************************************************
 * DAILY SCENARIO 3 — Small Group Rotation (Not Doing Work)
 **************************************************/
POOL.daily.push({
  id: "daily_3_small_group_not_doing_work",
  title: "Daily Mission: Small Group Work",
  start: "step1",
  steps: {

    step1: {
      text: "During a rotation, PJ avoids the task by wandering away and making silly noises instead of doing the activity.",
      choices: {
        A: {
          text: "Use a one-step prompt and visual: “PJ, sit here.” Point to the sticker chart: “Sit and work, earn a sticker.”",
          score: 10,
          feedback: "Great. Clear direction plus the visual earn path supports engagement without a long interaction.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “You need to do your work,” and keep explaining the directions.",
          score: 0,
          feedback: "Neutral. More talking can become attention and does not give a simple next action.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “PJ is not working,” so the group hears.",
          score: -10,
          feedback: "Public attention can increase avoidance and silly behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ sits but immediately tries to make peers laugh with a loud noise.",
      choices: {
        A: {
          text: "Reduce the audience and reinforce: give a sticker as soon as he is quiet and starts the first step. Whisper, “Nice working.”",
          score: 10,
          feedback: "Excellent. Immediate reinforcement for task start builds the routine.",
          next: "step3A"
        },
        B: {
          text: "Ignore him and hope he starts working eventually.",
          score: 0,
          feedback: "Neutral. It avoids attention, but he may keep avoiding the task.",
          next: "step3B"
        },
        C: {
          text: "Clip him down right away for the noise.",
          score: -10,
          feedback: "Punishment without clear replacement prompting can increase attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ runs around the table and another student giggles.",
      choices: {
        A: {
          text: "Repair: redirect peers back to work, then cue PJ quietly: “Sit.” Point to the sticker chart and restart the first task step.",
          score: 10,
          feedback: "Great repair. Removes the peer reinforcement and returns to a simple direction.",
          next: "step3A"
        },
        B: {
          text: "Tell the whole group to stop laughing and pay attention.",
          score: 0,
          feedback: "Neutral. It can become a bigger audience moment.",
          next: "step3B"
        },
        C: {
          text: "Talk for a long time about why running is not okay.",
          score: -10,
          feedback: "Long attention increases the payoff and delays learning.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ shouts “NO!” and tries to slip away from the table again.",
      choices: {
        A: {
          text: "Use one calm prompt: “PJ, sit.” If he escalates, signal aide or tech for support while you keep the group moving.",
          score: 10,
          feedback: "Excellent. Minimal language, maintains instruction, and uses support as planned.",
          next: "step3A"
        },
        B: {
          text: "Follow him around while giving repeated directions.",
          score: 0,
          feedback: "Neutral. It can become attention-heavy and reduce group instruction.",
          next: "step3B"
        },
        C: {
          text: "Publicly argue with him about needing to work.",
          score: -10,
          feedback: "Public attention and debate increases avoidance and escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ sits and completes the first part of the activity with a calmer voice.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Task start happened. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but continues small attention bids and does little work.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be quicker and more frequent.", next: "step4" } }
    },

    step3C: {
      text: "PJ avoids the task again and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining avoidance and movement.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up small group work?",
      choices: {
        A: {
          text: "Give a sticker for staying in area and starting work. Quietly remind him he is working toward a positive call home.",
          score: 10,
          feedback: "Perfect. Reinforces the replacement routine and long-term goal.",
          ending: "success"
        },
        B: {
          text: "Let the group move on without giving a sticker.",
          score: 0,
          feedback: "Neutral. It weakens the routine and reduces motivation.",
          ending: "mixed"
        },
        C: {
          text: "Call him out in front of the group about not working earlier.",
          score: -10,
          feedback: "Public attention can trigger another round of attention-seeking.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Task Start Reinforced", text: "PJ stayed in the area and started work, earning reinforcement through the sticker system." },
    mixed: { title: "Mixed – Some Engagement, Weak Reinforcement", text: "PJ engaged briefly, but reinforcement was unclear." },
    fail: { title: "Fail – Avoidance and Attention Increased", text: "Public attention increased the payoff for avoidance and noisy behavior." }
  }
});


/*************************************************
 * DAILY SCENARIO 4 — Whole Group Lesson (Loud Noises to Get Laughs)
 **************************************************/
POOL.daily.push({
  id: "daily_4_whole_group_loud_noises",
  title: "Daily Mission: Whole Group Calm Body",
  start: "step1",
  steps: {

    step1: {
      text: "During whole group, PJ makes a very loud silly noise and looks around to see who laughs.",
      choices: {
        A: {
          text: "Keep instruction moving and cue quietly near him: “Quiet voice.” Point to the sticker chart: “Quiet and in area earns a sticker.”",
          score: 10,
          feedback: "Great. You reduce the audience and pair the cue with the visual earn path.",
          next: "step2A"
        },
        B: {
          text: "Stop and say, “Please stop making noises,” from the front.",
          score: 0,
          feedback: "Neutral. It may work, but it can also provide attention in the moment.",
          next: "step2B"
        },
        C: {
          text: "Correct him loudly in front of the class.",
          score: -10,
          feedback: "Public correction increases attention and peer laughter.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ quiets but starts to wiggle and scoot out of his spot.",
      choices: {
        A: {
          text: "One-step prompt: “Stay in your spot.” Reinforce immediately when he does with a sticker and quiet praise.",
          score: 10,
          feedback: "Excellent. Quick prompt and immediate reinforcement strengthens staying in area.",
          next: "step3A"
        },
        B: {
          text: "Wait and see if he stops moving.",
          score: 0,
          feedback: "Neutral. Waiting can allow wandering to start.",
          next: "step3B"
        },
        C: {
          text: "Clip him down immediately.",
          score: -10,
          feedback: "Punishment alone can increase attention bids without teaching what to do instead.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ makes the noise again, louder, and two students laugh.",
      choices: {
        A: {
          text: "Repair: redirect peers back to the lesson and quietly cue PJ: “Quiet voice.” Point to the sticker chart and reset his spot.",
          score: 10,
          feedback: "Great repair. You remove peer reinforcement and return to the plan quickly.",
          next: "step3A"
        },
        B: {
          text: "Tell the class to stop laughing and be respectful.",
          score: 0,
          feedback: "Neutral. It can still keep attention on PJ.",
          next: "step3B"
        },
        C: {
          text: "Stop the lesson to discuss why PJ should not do this.",
          score: -10,
          feedback: "Long attention turns it into a performance moment.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ shouts “NO!” and stands up to move away from the group.",
      choices: {
        A: {
          text: "Use one calm prompt near him: “Sit.” Point to his spot and the sticker chart. Signal aide or tech if escalation continues.",
          score: 10,
          feedback: "Excellent. Minimal language and support plan use without creating a spotlight.",
          next: "step3A"
        },
        B: {
          text: "Call his name repeatedly from across the room.",
          score: 0,
          feedback: "Neutral. It can become attention and may not guide him back to a spot.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and argue in front of peers.",
          score: -10,
          feedback: "Public intensity increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ sits back in his spot and stays quieter for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is back in routine. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but keeps testing with small noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but he may need quicker reinforcement to maintain calm.", next: "step4" } }
    },

    step3C: {
      text: "PJ escalates and peers keep watching him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is increasing and disruption is more likely.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up whole group support?",
      choices: {
        A: {
          text: "Give a sticker for staying in spot and using a quiet voice. Quietly praise and keep instruction moving.",
          score: 10,
          feedback: "Perfect. Reinforces the desired behavior without spotlighting.",
          ending: "success"
        },
        B: {
          text: "Keep going with no sticker even though he calmed.",
          score: 0,
          feedback: "Neutral. It weakens the earn system.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the noises publicly after he calms.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Quiet Voice Reinforced", text: "PJ used a quieter voice and stayed in his spot, earning reinforcement." },
    mixed: { title: "Mixed – Calmed, Weak Reinforcement", text: "PJ stabilized, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Spotlight Increased", text: "Public attention increased peer reinforcement and disruption." }
  }
});


/*************************************************
 * DAILY SCENARIO 5 — Near the Door (Early Elopement Attempt)
 **************************************************/
POOL.daily.push({
  id: "daily_5_near_door_elopement_attempt",
  title: "Daily Mission: Stay in the Room",
  start: "step1",
  steps: {

    step1: {
      text: "During a less structured rotation, PJ walks quickly toward the classroom door and yells “NO!” when you redirect him.",
      choices: {
        A: {
          text: "Use one calm prompt close to him: “Stop.” Then: “Back to your area.” Point to the sticker chart: “Stay in area, earn a sticker.”",
          score: 10,
          feedback: "Great fidelity. Minimal language, clear boundary, and the visual earn path.",
          next: "step2A"
        },
        B: {
          text: "Call him from across the room, “Come back!” while continuing to manage others.",
          score: 0,
          feedback: "Neutral. It may work, but it can become attention and does not guide him to a specific spot.",
          next: "step2B"
        },
        C: {
          text: "Run toward him and talk loudly as the class watches.",
          score: -10,
          feedback: "High intensity can escalate and create a big attention moment.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ pauses near the door and looks back, checking your reaction and peers’ reactions.",
      choices: {
        A: {
          text: "Offer a simple choice: “Walk back or hold my hand back.” Reinforce the first step back immediately with praise.",
          score: 10,
          feedback: "Excellent. Choice supports compliance and you reinforce quickly.",
          next: "step3A"
        },
        B: {
          text: "Explain why he cannot leave and talk through the rules.",
          score: 0,
          feedback: "Neutral. Longer talking can increase attention and delay return.",
          next: "step3B"
        },
        C: {
          text: "Tell him he will lose recess or choice time if he does not come back.",
          score: -10,
          feedback: "Threats can escalate yelling and running.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ keeps walking slowly and looks back again, like he is testing whether you will chase.",
      choices: {
        A: {
          text: "Repair: signal aide or tech for support and move closer calmly. Use one prompt: “Stop.” Then point back to his area and sticker chart.",
          score: 10,
          feedback: "Great repair. You use support and keep the response calm and predictable.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Come back” several times.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and maintain the pattern.",
          next: "step3B"
        },
        C: {
          text: "Call attention to it: “Everyone stop, PJ is leaving.”",
          score: -10,
          feedback: "Creates a big audience moment and can escalate the behavior.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ speeds up, yells louder, and peers start watching closely.",
      choices: {
        A: {
          text: "Repair: stop escalating your approach, create space, and use minimal prompts. Signal for support if needed and guide him back to area with the chart.",
          score: 10,
          feedback: "Excellent repair. Safety first, minimal language, and support plan used.",
          next: "step3A"
        },
        B: {
          text: "Keep chasing and repeating demands.",
          score: 0,
          feedback: "Neutral. It may stop him, but it can increase attention and intensity.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in the moment.",
          score: -10,
          feedback: "Back-and-forth attention can increase running and yelling.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and stops moving toward the door.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He stayed in the room and returned to area. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ returns but continues loud noises to get peers to look.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. He may need quick reinforcement for returning to area.", next: "step4" } }
    },

    step3C: {
      text: "PJ keeps trying to leave and the room’s attention stays on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention increased elopement risk.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after he returns to area?",
      choices: {
        A: {
          text: "Reinforce immediately: give a sticker for returning and staying in area. Quietly praise and move on.",
          score: 10,
          feedback: "Perfect. Reinforces staying in the room and returning to area quickly.",
          ending: "success"
        },
        B: {
          text: "Do not reinforce because he almost left.",
          score: 0,
          feedback: "Neutral. Safety matters, but reinforcement strengthens the return behavior.",
          ending: "mixed"
        },
        C: {
          text: "Call home immediately while peers listen to describe what went wrong.",
          score: -10,
          feedback: "Public attention and delayed consequences can escalate future attention-seeking.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Stayed in Room Reinforced", text: "PJ returned to his area and earned reinforcement for staying in the room and following directions." },
    mixed: { title: "Mixed – Returned, Weak Reinforcement", text: "PJ returned safely, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Attention Increased Risk", text: "Public attention increased the payoff and raised future elopement attempts." }
  }
});

/*************************************************
 * DAILY SCENARIO 6 — Group Rotations With Tech Pull-Out (Wandering)
 **************************************************/
POOL.daily.push({
  id: "daily_6_rotations_tech_pullout_wandering",
  title: "Daily Mission: Rotations With Tech Support",
  start: "step1",
  steps: {

    step1: {
      text: "During group rotations, the tech is doing a 1:1 lesson nearby. PJ leaves his rotation spot and wanders toward the tech area, making silly noises to get attention.",
      choices: {
        A: {
          text: "One-step prompt + visual: “PJ, in your area.” Point to the sticker chart: “Stay here, earn a sticker.”",
          score: 10,
          feedback: "Great fidelity. Clear boundary plus the earn path gets him back without a long interaction.",
          next: "step2A"
        },
        B: {
          text: "Explain to PJ why the tech is working with someone else and he needs to wait.",
          score: 0,
          feedback: "Neutral. Explanation can turn into attention and keep the wandering going.",
          next: "step2B"
        },
        C: {
          text: "Call out across the room: “PJ, stop wandering!”",
          score: -10,
          feedback: "Public correction can increase attention and peer reactions.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ steps back to his area but keeps looking over and making small noises to pull attention.",
      choices: {
        A: {
          text: "Reinforce the return immediately: give a sticker and whisper, “Nice staying in your area.” Then give one simple task step: “Start here.”",
          score: 10,
          feedback: "Excellent. Immediate reinforcement strengthens the replacement behavior and keeps the momentum.",
          next: "step3A"
        },
        B: {
          text: "Wait to give a sticker until the end of rotations.",
          score: 0,
          feedback: "Neutral. For Kinder, delayed reinforcement is often too late to shape the moment.",
          next: "step3B"
        },
        C: {
          text: "Clip him down right away for the noises.",
          score: -10,
          feedback: "Punishment without prompting the replacement can increase attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs and wanders closer, trying to get the tech’s attention and peer laughs.",
      choices: {
        A: {
          text: "Repair: redirect peers back to work, then quietly cue PJ: “In your area.” Point to the sticker chart and block off attention by turning back to instruction.",
          score: 10,
          feedback: "Great repair. Reduces the audience and returns to the plan quickly.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to PJ about waiting and being respectful.",
          score: 0,
          feedback: "Neutral. Longer attention can keep the behavior going.",
          next: "step3B"
        },
        C: {
          text: "Stop rotations and address PJ in front of the class.",
          score: -10,
          feedback: "Creates a big spotlight moment and can escalate wandering/noises.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ runs a loop around the room and giggles, checking peer reactions.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop. In your area.” Point to the sticker chart and immediately reset him into the first task step.",
          score: 10,
          feedback: "Excellent. Minimal language plus a clear earn path and quick re-entry to instruction.",
          next: "step3A"
        },
        B: {
          text: "Repeat directions from across the room while teaching.",
          score: 0,
          feedback: "Neutral. Distance prompts may not be effective when he is performing for peers.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and lecture about running.",
          score: -10,
          feedback: "High attention can reinforce the performance and increase peer laughs.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in his area and starts the rotation activity.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is back in routine. Keep reinforcement tight.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays in his area but keeps making small noises and looking around.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but he may need faster reinforcement for quiet voice and staying put.", next: "step4" } }
    },

    step3C: {
      text: "PJ wanders again toward the tech and peers start watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining wandering and noises.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up this rotation block?",
      choices: {
        A: {
          text: "Give a sticker for staying in area and add a pom pom/class point for the group if the rotation stayed on track.",
          score: 10,
          feedback: "Perfect. Reinforces PJ’s replacement and supports the class systems too.",
          ending: "success"
        },
        B: {
          text: "Move on with no sticker even though he stayed in area.",
          score: 0,
          feedback: "Neutral. Weakens the sticker system and makes wandering more likely next time.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the wandering in front of the class before switching groups.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Rotations Stayed On Track", text: "PJ stayed in his area, started work, and earned reinforcement through the sticker system." },
    mixed: { title: "Mixed – Routine Not Strengthened", text: "PJ stabilized, but reinforcement timing was unclear." },
    fail: { title: "Fail – Audience Increased", text: "Public attention increased peer reinforcement and made wandering/noises more likely." }
  }
});


/*************************************************
 * DAILY SCENARIO 7 — Transition to Carpet (Wandering + “No!”)
 **************************************************/
POOL.daily.push({
  id: "daily_7_transition_to_carpet_no_wandering",
  title: "Daily Mission: Carpet Transition",
  start: "step1",
  steps: {

    step1: {
      text: "You say it is time to come to the carpet. PJ says, “NO!” and walks away from the carpet spot, smiling at peers.",
      choices: {
        A: {
          text: "Ignore the “no,” give one calm direction: “Carpet spot.” Point to the sticker chart: “Come to spot, earn a sticker.”",
          score: 10,
          feedback: "Great fidelity. Minimal language, clear next step, and a visible earn path.",
          next: "step2A"
        },
        B: {
          text: "Ask why he said no and try to talk him into it.",
          score: 0,
          feedback: "Neutral. It can become attention and delay the transition.",
          next: "step2B"
        },
        C: {
          text: "Correct him loudly so everyone hears, “PJ, stop saying no!”",
          score: -10,
          feedback: "Public attention can increase refusal and wandering.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ steps toward his carpet spot but makes a loud silly noise to get laughs.",
      choices: {
        A: {
          text: "Keep instruction moving and reinforce quietly once he is in his spot: sticker + whisper, “Nice carpet spot.”",
          score: 10,
          feedback: "Excellent. Reinforces the right behavior and avoids giving the noise a stage.",
          next: "step3A"
        },
        B: {
          text: "Wait to reinforce until the entire lesson is over.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement is less effective for shaping the moment.",
          next: "step3B"
        },
        C: {
          text: "Clip him down immediately for the noise.",
          score: -10,
          feedback: "Punishment without prompting the replacement routine can increase attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ runs behind a table and makes another noise. A couple students giggle.",
      choices: {
        A: {
          text: "Repair: redirect peers to the carpet, then quietly cue PJ: “Carpet spot.” Point to the sticker chart.",
          score: 10,
          feedback: "Great repair. Reduces peer reinforcement and returns to one clear step.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to PJ while the class waits.",
          score: 0,
          feedback: "Neutral. The waiting becomes attention for PJ.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and announce PJ is not following directions.",
          score: -10,
          feedback: "Big attention moment increases the payoff for refusal.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells “NO!” again and tries to leave the carpet area completely.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop. Carpet spot.” Signal aide/tech if needed and keep peers focused on the lesson start.",
          score: 10,
          feedback: "Excellent. Minimal language, safety-focused, and you use support without spotlighting.",
          next: "step3A"
        },
        B: {
          text: "Call him from across the room repeatedly.",
          score: 0,
          feedback: "Neutral. It may not guide him to a specific spot and can add attention.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and argue in front of peers.",
          score: -10,
          feedback: "Public intensity increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ sits in his carpet spot and stays in the area.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Transition success. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but keeps small noises going to test for laughs.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but he may need quicker reinforcement for quiet voice.", next: "step4" } }
    },

    step3C: {
      text: "PJ keeps wandering and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining refusal and wandering.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up the carpet transition?",
      choices: {
        A: {
          text: "Give a sticker for getting to his carpet spot and praise quietly. Then start instruction immediately.",
          score: 10,
          feedback: "Perfect. Reinforces the transition routine and reduces attention for disruptions.",
          ending: "success"
        },
        B: {
          text: "Start the lesson without giving a sticker even though he complied.",
          score: 0,
          feedback: "Neutral. Weakens the earn system.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier “no” in front of the group as a warning.",
          score: -10,
          feedback: "Public attention can restart the cycle during the lesson.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Carpet Transition Reinforced", text: "PJ followed the prompt to get to his spot and earned reinforcement for staying in area." },
    mixed: { title: "Mixed – Transition Happened, Weak Reinforcement", text: "PJ transitioned, but reinforcement timing was unclear." },
    fail: { title: "Fail – Attention Maintained Refusal", text: "Public attention increased peer reinforcement and refusal patterns." }
  }
});


/*************************************************
 * DAILY SCENARIO 8 — Snack Time (Wandering for Peer Attention)
 **************************************************/
POOL.daily.push({
  id: "daily_8_snack_time_wandering_attention",
  title: "Daily Mission: Snack Time Expectations",
  start: "step1",
  steps: {

    step1: {
      text: "During snack, PJ gets up from his seat and wanders to different tables making noises to get laughs.",
      choices: {
        A: {
          text: "One-step prompt + earn path: “PJ, in your seat.” Point to the sticker chart: “Stay in your seat, earn a sticker.”",
          score: 10,
          feedback: "Great. Clear expectation and a visual earn path during a less structured time.",
          next: "step2A"
        },
        B: {
          text: "Say, “Sit down please,” and explain that snack is not for wandering.",
          score: 0,
          feedback: "Neutral. More talking can become attention and keep the behavior going.",
          next: "step2B"
        },
        C: {
          text: "Correct him loudly so the room hears.",
          score: -10,
          feedback: "Public correction can increase peer attention and escalate.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ sits but keeps making small noises while watching peers.",
      choices: {
        A: {
          text: "Reinforce the seat fast: sticker + whisper, “Nice staying in your seat.” Then redirect: “Snack in your seat.”",
          score: 10,
          feedback: "Excellent. Immediate reinforcement strengthens the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Wait for full silence before reinforcing.",
          score: 0,
          feedback: "Neutral. Waiting too long can reduce motivation and increase wandering again.",
          next: "step3B"
        },
        C: {
          text: "Clip him down for the noises even though he sat.",
          score: -10,
          feedback: "This may discourage returning to seat and increase attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs and wanders again, a peer says, “He’s being funny!”",
      choices: {
        A: {
          text: "Repair: redirect peers back to snack, then quietly cue PJ: “In your seat.” Point to the sticker chart.",
          score: 10,
          feedback: "Great repair. Reduces peer reinforcement and returns to the plan quickly.",
          next: "step3A"
        },
        B: {
          text: "Tell the whole class to stop reacting to PJ.",
          score: 0,
          feedback: "Neutral. It can still create a spotlight moment.",
          next: "step3B"
        },
        C: {
          text: "Have a long talk with PJ about being funny vs safe.",
          score: -10,
          feedback: "Long attention reinforces the behavior and delays instruction.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells “NO!” and moves toward the classroom door area.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop. In your seat.” Signal aide/tech if needed and keep the class moving.",
          score: 10,
          feedback: "Excellent. Minimal language, safety-focused, uses support plan.",
          next: "step3A"
        },
        B: {
          text: "Call his name repeatedly from across the room.",
          score: 0,
          feedback: "Neutral. It can become attention and may not guide him to the target behavior.",
          next: "step3B"
        },
        C: {
          text: "Chase him and talk loudly.",
          score: -10,
          feedback: "High intensity increases attention and escalates elopement risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays seated and snack continues smoothly.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is in the expected area. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but continues low-level noises and attention bids.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be quicker and more frequent.", next: "step4" } }
    },

    step3C: {
      text: "PJ wanders again and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining wandering and noises.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up snack time support?",
      choices: {
        A: {
          text: "Give a sticker for staying in seat/area and add a pom pom/class point for a smooth snack routine.",
          score: 10,
          feedback: "Perfect. Reinforces PJ and supports the class system.",
          ending: "success"
        },
        B: {
          text: "Move on without giving a sticker even though he stayed seated.",
          score: 0,
          feedback: "Neutral. Weakens the earn path and increases future wandering.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his wandering in front of peers after snack ends.",
          score: -10,
          feedback: "Public attention can trigger another round of attention-seeking.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Snack Routine Reinforced", text: "PJ stayed in his seat/area and earned reinforcement for following the routine." },
    mixed: { title: "Mixed – Stable, Weak Reinforcement", text: "PJ stabilized, but reinforcement was unclear." },
    fail: { title: "Fail – Audience Increased", text: "Public attention increased the payoff for wandering and noises." }
  }
});


/*************************************************
 * DAILY SCENARIO 9 — Work Avoidance (Not Doing Work + Wandering)
 **************************************************/
POOL.daily.push({
  id: "daily_9_work_avoidance_wandering",
  title: "Daily Mission: Start the Work",
  start: "step1",
  steps: {

    step1: {
      text: "PJ avoids a task by wandering away and making noises instead of starting his work.",
      choices: {
        A: {
          text: "One-step prompt + first-step support: “PJ, sit here.” Then: “Do this first.” Point to the sticker chart: “Start work and stay here, earn a sticker.”",
          score: 10,
          feedback: "Great. Clear direction, reduced response effort, and an immediate earn path.",
          next: "step2A"
        },
        B: {
          text: "Tell him to do his work and explain the directions again.",
          score: 0,
          feedback: "Neutral. More talking can become attention and delay task start.",
          next: "step2B"
        },
        C: {
          text: "Publicly say, “PJ is not working,” so others hear.",
          score: -10,
          feedback: "Public attention increases avoidance and peer reinforcement.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ sits and touches the paper but tries to get a laugh with a silly noise.",
      choices: {
        A: {
          text: "Reinforce task start quickly and quietly: sticker + whisper, “Nice start.” Then continue with the next tiny step.",
          score: 10,
          feedback: "Excellent. Reinforces the desired behavior and keeps the momentum going.",
          next: "step3A"
        },
        B: {
          text: "Ignore everything and hope he keeps working.",
          score: 0,
          feedback: "Neutral. Avoids attention but misses a key reinforcement moment.",
          next: "step3B"
        },
        C: {
          text: "Clip him down for the noise even though he started.",
          score: -10,
          feedback: "May reduce motivation to start work next time.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ runs around the table and peers start watching.",
      choices: {
        A: {
          text: "Repair: redirect peers back to work, then calmly cue PJ: “Sit.” Point to the sticker chart and restart the first tiny step.",
          score: 10,
          feedback: "Great repair. Removes the audience and returns to a clear next action.",
          next: "step3A"
        },
        B: {
          text: "Tell the whole group to ignore PJ.",
          score: 0,
          feedback: "Neutral. It can still turn into a spotlight moment.",
          next: "step3B"
        },
        C: {
          text: "Have a long conference with PJ about why he needs to work.",
          score: -10,
          feedback: "Long attention can reinforce avoidance and delay learning time.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ shouts “NO!” and tries to get away from the table again.",
      choices: {
        A: {
          text: "Calm close prompt: “Sit.” Signal aide/tech if needed while you keep the group instruction moving.",
          score: 10,
          feedback: "Excellent. Minimal language, uses support plan, and reduces group disruption.",
          next: "step3A"
        },
        B: {
          text: "Follow him around giving repeated directions.",
          score: 0,
          feedback: "Neutral. Can become attention-heavy and reduce instruction.",
          next: "step3B"
        },
        C: {
          text: "Argue with him in front of peers about saying no.",
          score: -10,
          feedback: "Public attention and debate increase avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ sits and completes a small part of the task.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Task start and staying in area happened. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but completes very little and keeps testing with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be faster and more frequent.", next: "step4" } }
    },

    step3C: {
      text: "PJ avoids again and peers keep reacting.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining avoidance and movement.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after he starts working?",
      choices: {
        A: {
          text: "Give a sticker for staying in area and starting work. Quiet praise and move on.",
          score: 10,
          feedback: "Perfect. Reinforces task start and staying in area.",
          ending: "success"
        },
        B: {
          text: "Move on with no sticker even though he started.",
          score: 0,
          feedback: "Neutral. Weakens the earn path and future task start.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier wandering in front of peers.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Task Start Reinforced", text: "PJ stayed in the area and started work, earning reinforcement through the sticker system." },
    mixed: { title: "Mixed – Started, Weak Reinforcement", text: "PJ started, but reinforcement timing was unclear." },
    fail: { title: "Fail – Avoidance Maintained", text: "Public attention increased peer reinforcement and made avoidance more likely." }
  }
});


/*************************************************
 * DAILY SCENARIO 10 — Error Correction Routine (Warning → Clip Down)
 **************************************************/
POOL.daily.push({
  id: "daily_10_error_correction_warning_clip",
  title: "Daily Mission: Error Correction Routine",
  start: "step1",
  steps: {

    step1: {
      text: "PJ leaves his area again during a less structured time and makes loud noises. You need to use your error correction routine.",
      choices: {
        A: {
          text: "Give a brief warning with a clear next step: “Warning. In your area.” Point to the sticker chart: “Stay here, earn a sticker.”",
          score: 10,
          feedback: "Great fidelity. Matches your system and keeps the response short and clear.",
          next: "step2A"
        },
        B: {
          text: "Give multiple reminders and explain why he is distracting others.",
          score: 0,
          feedback: "Neutral. More talking can become attention and prolong the episode.",
          next: "step2B"
        },
        C: {
          text: "Clip him down immediately with a public statement about it.",
          score: -10,
          feedback: "Public correction increases attention and can escalate the behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ returns to his area but quickly tests again with a silly noise to see who laughs.",
      choices: {
        A: {
          text: "If he repeats, clip down quietly and reset: “Clip. In your area.” Then reinforce the moment he stays put with a sticker.",
          score: 10,
          feedback: "Excellent. Quiet follow-through plus immediate reinforcement for the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Give another warning and keep talking about it.",
          score: 0,
          feedback: "Neutral. Repeated warnings can become attention without follow-through.",
          next: "step3B"
        },
        C: {
          text: "Argue with PJ about why he should not make noises.",
          score: -10,
          feedback: "Debate increases attention and reinforces the behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs and keeps wandering because the conversation is giving him attention.",
      choices: {
        A: {
          text: "Repair: stop talking, give one step: “In your area.” Use the warning/clip system quietly and immediately reinforce the return with a sticker.",
          score: 10,
          feedback: "Great repair. Minimal language plus consistent system use reduces attention payoff.",
          next: "step3A"
        },
        B: {
          text: "Continue talking until he stops.",
          score: 0,
          feedback: "Neutral. Sustained attention can maintain the behavior.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and announce he is getting clipped down.",
          score: -10,
          feedback: "Public attention increases peer reinforcement and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ escalates with louder noises because peers heard the clip and are watching.",
      choices: {
        A: {
          text: "Repair: reduce the audience and handle the clip quietly. Give one calm prompt: “In your area.” Then reinforce the return with a sticker.",
          score: 10,
          feedback: "Excellent repair. Removes the stage and returns to consistent follow-through.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating directions loudly until he stops.",
          score: 0,
          feedback: "Neutral. Repetition can increase attention and escalation.",
          next: "step3B"
        },
        C: {
          text: "Lecture about consequences in front of peers.",
          score: -10,
          feedback: "Extended public attention increases the payoff.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in his area and begins doing what the group is doing.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Routine restored. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays briefly but keeps testing for attention with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement timing may need to be tighter.", next: "step4" } }
    },

    step3C: {
      text: "PJ continues wandering and pulling peers in.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining the behavior.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up once he is back in routine?",
      choices: {
        A: {
          text: "Reinforce the recovery: sticker + quiet praise. Save any “what went wrong” talk for a private moment later.",
          score: 10,
          feedback: "Perfect. Strengthens the replacement behavior and avoids spotlighting.",
          ending: "success"
        },
        B: {
          text: "Do not give a sticker even after he returned.",
          score: 0,
          feedback: "Neutral. Weakens the motivation to return to area quickly next time.",
          ending: "mixed"
        },
        C: {
          text: "Talk about what went wrong in front of peers right now.",
          score: -10,
          feedback: "Public attention can restart the cycle and increase peer reactions.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Error Correction Worked", text: "PJ returned to his area with calm prompts and earned reinforcement for recovery." },
    mixed: { title: "Mixed – Returned, Weak Reinforcement", text: "PJ returned, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Spotlight Increased", text: "Public correction increased peer reinforcement and made wandering/noises more likely." }
  }
});


/*************************************************
 * CRISIS SCENARIO 1 — Bolting Toward the Door (Support Needed)
 **************************************************/
POOL.crisis.push({
  id: "crisis_1_bolting_toward_door_support",
  title: "Crisis Drill: Bolting Toward the Door",
  start: "step1",
  steps: {

    step1: {
      text: "PJ yells “NO!” and moves quickly toward the classroom door during a less structured moment.",
      choices: {
        A: {
          text: "Use a calm close prompt: “Stop.” Then: “Back to your area.” Signal aide/tech or use office chat for support if needed.",
          score: 10,
          feedback: "Great fidelity. Minimal language, safety-focused, and you use the support plan appropriately.",
          next: "step2A"
        },
        B: {
          text: "Call from across the room, “Come back!” while managing the class.",
          score: 0,
          feedback: "Neutral. It may work, but it can become attention and may not stop the door attempt.",
          next: "step2B"
        },
        C: {
          text: "Run after PJ while talking loudly.",
          score: -10,
          feedback: "High intensity can escalate and create a big attention moment.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ pauses near the door and looks back, checking your reaction.",
      choices: {
        A: {
          text: "Offer a simple choice: “Walk back or hold my hand back.” Reinforce the first step back with quiet praise and a sticker once in area.",
          score: 10,
          feedback: "Excellent. Choice supports compliance and reinforcement strengthens returning behavior.",
          next: "step3A"
        },
        B: {
          text: "Explain the rules about leaving and talk through it.",
          score: 0,
          feedback: "Neutral. More talking can become attention and delay return.",
          next: "step3B"
        },
        C: {
          text: "Threaten loss of recess or choice time loudly.",
          score: -10,
          feedback: "Public threats can escalate yelling and running.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ continues toward the door slowly and glances back like he is testing if you will chase.",
      choices: {
        A: {
          text: "Repair: move closer calmly, use one prompt: “Stop.” Then point back to his area and signal support (aide/tech/office chat).",
          score: 10,
          feedback: "Great repair. Safety-focused and minimal language, with support activated.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Come back” several times.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and maintain the pattern.",
          next: "step3B"
        },
        C: {
          text: "Announce to the class that PJ is trying to leave.",
          score: -10,
          feedback: "Creates a big audience moment and increases attention payoff.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ speeds up and yells louder as you rush toward him. Peers start watching.",
      choices: {
        A: {
          text: "Repair: lower your intensity, create space, use one calm prompt close to him, and call for support if needed.",
          score: 10,
          feedback: "Excellent repair. De-escalates the adult response and prioritizes safety.",
          next: "step3A"
        },
        B: {
          text: "Keep chasing and repeating demands.",
          score: 0,
          feedback: "Neutral. It may stop him, but it increases attention and intensity.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences while he is escalated.",
          score: -10,
          feedback: "Back-and-forth attention can escalate and prolong the episode.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and stops moving toward the door.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safety restored. Reinforce the return quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ returns but keeps yelling/noises to pull attention.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. He may need quick reinforcement for returning and staying put.", next: "step4" } }
    },

    step3C: {
      text: "PJ keeps trying to move away and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention payoff increased risk and continued escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize after PJ returns?",
      choices: {
        A: {
          text: "Reinforce the return: quiet praise + sticker for staying in area. Then reset into the next simple task step.",
          score: 10,
          feedback: "Perfect. Strengthens returning behavior and reduces future door attempts.",
          ending: "success"
        },
        B: {
          text: "Move on with no reinforcement since it was unsafe.",
          score: 0,
          feedback: "Neutral. Safety matters, but reinforcement strengthens the return-to-area behavior.",
          ending: "mixed"
        },
        C: {
          text: "Call out what happened in front of peers.",
          score: -10,
          feedback: "Public attention can restart the cycle quickly.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Door Attempt Resolved", text: "PJ returned to his area and earned reinforcement for recovery and staying in the room." },
    mixed: { title: "Mixed – Returned, Weak Reinforcement", text: "PJ returned safely, but reinforcement was unclear." },
    fail: { title: "Fail – Audience Increased", text: "Public attention increased the payoff and raised future elopement attempts." }
  }
});


/*************************************************
 * CRISIS SCENARIO 2 — Running the Room (High Peer Attention)
 **************************************************/
POOL.crisis.push({
  id: "crisis_2_running_room_peer_attention",
  title: "Crisis Drill: Running the Room",
  start: "step1",
  steps: {

    step1: {
      text: "PJ runs around the room making loud noises. Several students laugh and watch him.",
      choices: {
        A: {
          text: "Reduce the audience: redirect peers to their tasks, then use one calm prompt close to PJ: “Stop. In your area.”",
          score: 10,
          feedback: "Great fidelity. Removes peer reinforcement and gives one clear safety direction.",
          next: "step2A"
        },
        B: {
          text: "Tell PJ to stop running from across the room while teaching.",
          score: 0,
          feedback: "Neutral. Distance prompts can become attention and may not stop running quickly.",
          next: "step2B"
        },
        C: {
          text: "Yell and lecture about running so everyone hears.",
          score: -10,
          feedback: "Public attention can increase the performance behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ stops briefly but makes a loud noise to get laughs again.",
      choices: {
        A: {
          text: "Keep it minimal: “Quiet.” Point to his area and the sticker chart. Reinforce as soon as he is in area.",
          score: 10,
          feedback: "Excellent. Predictable and quick reinforcement strengthens calming and returning.",
          next: "step3A"
        },
        B: {
          text: "Explain why he should not run and why it is unsafe.",
          score: 0,
          feedback: "Neutral. Explanation can become attention during escalation.",
          next: "step3B"
        },
        C: {
          text: "Stop instruction and correct PJ publicly.",
          score: -10,
          feedback: "Creates a stage and increases peer reactions.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ keeps running because peers are laughing and the direction is coming from far away.",
      choices: {
        A: {
          text: "Repair: move closer calmly, give one prompt: “Stop.” Signal aide/tech if you need immediate support.",
          score: 10,
          feedback: "Great repair. Calm proximity plus support plan reduces risk.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Stop running” multiple times.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and maintain the behavior.",
          next: "step3B"
        },
        C: {
          text: "Announce to the class that PJ is losing recess.",
          score: -10,
          feedback: "Public consequence talk increases audience attention.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ escalates and tries to pull another student into running with him.",
      choices: {
        A: {
          text: "Repair: reduce attention, keep peers focused elsewhere, use one calm prompt close to PJ and guide him back to area.",
          score: 10,
          feedback: "Excellent. Removes peer reinforcement and restores the routine.",
          next: "step3A"
        },
        B: {
          text: "Keep calling out to stop while the class watches.",
          score: 0,
          feedback: "Neutral. Still attention-heavy.",
          next: "step3B"
        },
        C: {
          text: "Argue with PJ in front of peers.",
          score: -10,
          feedback: "Back-and-forth attention escalates and prolongs the episode.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and stays in place briefly.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safety restored. Reinforce quickly for staying in area.", next: "step4" } }
    },

    step3B: {
      text: "PJ returns but keeps small noises and attention bids going.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement may need to be immediate.", next: "step4" } }
    },

    step3C: {
      text: "PJ continues running and peers continue reacting.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize after the running stops?",
      choices: {
        A: {
          text: "Reinforce recovery: sticker for returning to area, quiet praise, then give the next simple task step.",
          score: 10,
          feedback: "Perfect. Reinforces the replacement routine and prevents a new cycle.",
          ending: "success"
        },
        B: {
          text: "Move on with no reinforcement.",
          score: 0,
          feedback: "Neutral. Weakens the return-to-area behavior.",
          ending: "mixed"
        },
        C: {
          text: "Talk about it publicly to the class.",
          score: -10,
          feedback: "Public attention increases future running for laughs.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Running Stopped and Routine Restored", text: "PJ returned to his area and earned reinforcement for recovery and staying put." },
    mixed: { title: "Mixed – Stopped, Weak Reinforcement", text: "PJ stopped, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Audience Maintained Running", text: "Public attention increased the payoff and prolonged escalation." }
  }
});


/*************************************************
 * CRISIS SCENARIO 3 — Loud “NO!” and Refusal (Clip System)
 **************************************************/
POOL.crisis.push({
  id: "crisis_3_loud_no_refusal_clip_system",
  title: "Crisis Drill: Loud Refusal",
  start: "step1",
  steps: {

    step1: {
      text: "You give a direction and PJ yells, “NO!” then tries to move away while peers watch.",
      choices: {
        A: {
          text: "Ignore the refusal. Give one calm direction again and point to his area/sticker chart. Use warning → clip quietly if it repeats.",
          score: 10,
          feedback: "Great fidelity. Minimal language, consistent system, and no public spotlight.",
          next: "step2A"
        },
        B: {
          text: "Ask why he is saying no and keep talking.",
          score: 0,
          feedback: "Neutral. It can become attention and increase refusal.",
          next: "step2B"
        },
        C: {
          text: "Correct him publicly and threaten consequences loudly.",
          score: -10,
          feedback: "Public attention increases the payoff for yelling no.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ complies for a second but makes a loud noise to pull attention back.",
      choices: {
        A: {
          text: "Keep it minimal: “Quiet.” Point to sticker chart. Reinforce as soon as he is quiet and in area with a sticker.",
          score: 10,
          feedback: "Excellent. Quick reinforcement strengthens calm compliance.",
          next: "step3A"
        },
        B: {
          text: "Lecture about using a nice voice.",
          score: 0,
          feedback: "Neutral. Longer attention can restart the cycle.",
          next: "step3B"
        },
        C: {
          text: "Clip down publicly so peers notice.",
          score: -10,
          feedback: "Public clip increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ gets louder and tries to run away from the direction.",
      choices: {
        A: {
          text: "Repair: stop talking, give one calm prompt close to him, and signal aide/tech if needed.",
          score: 10,
          feedback: "Great repair. Minimal language and support plan use reduces escalation.",
          next: "step3A"
        },
        B: {
          text: "Keep talking and negotiating.",
          score: 0,
          feedback: "Neutral. Negotiation can reinforce refusal.",
          next: "step3B"
        },
        C: {
          text: "Announce consequences to the class.",
          score: -10,
          feedback: "Public attention increases the payoff and escalates.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells louder because the class is watching.",
      choices: {
        A: {
          text: "Repair: reduce audience, go back to one calm prompt, and apply warning/clip quietly while keeping peers engaged elsewhere.",
          score: 10,
          feedback: "Excellent repair. Removes spotlight and restores the routine.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating demands loudly.",
          score: 0,
          feedback: "Neutral. Repetition can add attention and maintain escalation.",
          next: "step3B"
        },
        C: {
          text: "Argue about who is in charge.",
          score: -10,
          feedback: "Power struggle increases attention and refusal.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and follows the direction with a calmer body.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Routine restored. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ complies but stays attention-seeking with small noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement may need to be more immediate.", next: "step4" } }
    },

    step3C: {
      text: "PJ escalates and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize after PJ complies?",
      choices: {
        A: {
          text: "Reinforce immediately for being in area and following directions: sticker + quiet praise. Save any debrief for private later.",
          score: 10,
          feedback: "Perfect. Reinforces replacement behavior and avoids spotlighting.",
          ending: "success"
        },
        B: {
          text: "Do not reinforce because he yelled first.",
          score: 0,
          feedback: "Neutral. Weakens motivation for returning quickly next time.",
          ending: "mixed"
        },
        C: {
          text: "Debrief publicly in front of peers.",
          score: -10,
          feedback: "Public attention increases future yelling and refusal.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Refusal Cycle Interrupted", text: "PJ returned to area and earned reinforcement for calm compliance and following directions." },
    mixed: { title: "Mixed – Complied, Weak Reinforcement", text: "PJ complied, but reinforcement was unclear." },
    fail: { title: "Fail – Refusal Reinforced", text: "Public attention increased the payoff for yelling and refusal." }
  }
});


/*************************************************
 * CRISIS SCENARIO 4 — Classroom Disruption Spreads (Peers Copy)
 **************************************************/
POOL.crisis.push({
  id: "crisis_4_peers_copying_disruption",
  title: "Crisis Drill: Peers Start Copying",
  start: "step1",
  steps: {

    step1: {
      text: "PJ makes loud noises and now a couple peers start copying. The whole room begins to get noisy.",
      choices: {
        A: {
          text: "Reset the group quickly (class point/pom pom goal), then quietly cue PJ: “Quiet voice. In your area.” Point to sticker chart.",
          score: 10,
          feedback: "Great. Addresses the group and PJ without spotlighting him.",
          next: "step2A"
        },
        B: {
          text: "Keep correcting everyone verbally for a long time.",
          score: 0,
          feedback: "Neutral. It may add attention and keep the noise going.",
          next: "step2B"
        },
        C: {
          text: "Call PJ out as the reason the class is loud.",
          score: -10,
          feedback: "Public blame increases attention and escalation risk.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "The class quiets a bit. PJ is watching to see if people are still paying attention to him.",
      choices: {
        A: {
          text: "Reinforce quickly when PJ is quiet in area: give a sticker and whisper praise, then continue instruction.",
          score: 10,
          feedback: "Excellent. Reinforces the exact replacement behavior and keeps the group moving.",
          next: "step3A"
        },
        B: {
          text: "Wait a long time before reinforcing.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement weakens the replacement routine.",
          next: "step3B"
        },
        C: {
          text: "Lecture PJ about being a leader for the class.",
          score: -10,
          feedback: "Extended attention can restart the performance behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "The room stays noisy and PJ keeps making noises because the attention is staying on him.",
      choices: {
        A: {
          text: "Repair: stop talking, use a short group reset, then cue PJ quietly with one step and the sticker chart.",
          score: 10,
          feedback: "Great repair. Removes extra attention and returns to clear expectations.",
          next: "step3A"
        },
        B: {
          text: "Keep correcting loudly until it stops.",
          score: 0,
          feedback: "Neutral. Can keep attention on the disruption.",
          next: "step3B"
        },
        C: {
          text: "Send PJ out of the room as the first response.",
          score: -10,
          feedback: "High attention outcome and can create a predictable escape routine.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ escalates quickly because he is now in a spotlight moment.",
      choices: {
        A: {
          text: "Repair: remove the spotlight, redirect peers, and cue PJ quietly. Call for aide/tech support if needed.",
          score: 10,
          feedback: "Excellent. Removes audience reinforcement and uses support plan.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to the class about PJ’s behavior.",
          score: 0,
          feedback: "Neutral. Still attention-heavy.",
          next: "step3B"
        },
        C: {
          text: "Argue with PJ in front of the class.",
          score: -10,
          feedback: "Power struggle increases attention and escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in his area with a quieter voice and peers return to work.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Class is back on track. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "The class quiets somewhat, but PJ continues testing with small noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement may need to be faster.", next: "step4" } }
    },

    step3C: {
      text: "The disruption continues and attention stays on PJ.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining escalation and spread.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize after the group reset works?",
      choices: {
        A: {
          text: "Reinforce PJ quietly for quiet voice and staying in area with a sticker. Add a pom pom/class point for the class reset.",
          score: 10,
          feedback: "Perfect. Reinforces PJ and the class system without spotlighting.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcing anyone.",
          score: 0,
          feedback: "Neutral. Weakens both routines.",
          ending: "mixed"
        },
        C: {
          text: "Revisit the disruption publicly to teach a lesson.",
          score: -10,
          feedback: "Public attention increases future performances.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Class Reset Held", text: "The class returned to calm, and PJ earned reinforcement for quiet voice and staying in area." },
    mixed: { title: "Mixed – Reset Worked, Weak Reinforcement", text: "Behavior improved, but reinforcement was unclear." },
    fail: { title: "Fail – Spotlight Increased Spread", text: "Public attention increased the payoff and spread the disruption." }
  }
});


/*************************************************
 * CRISIS SCENARIO 5 — Escalation When Teacher Can’t Respond (Call Support)
 **************************************************/
POOL.crisis.push({
  id: "crisis_5_teacher_cannot_respond_call_support",
  title: "Crisis Drill: Call for Support",
  start: "step1",
  steps: {

    step1: {
      text: "PJ escalates during a busy moment (you are managing another student). He wanders, yells “NO,” and heads toward the door area.",
      choices: {
        A: {
          text: "Use the support plan immediately: signal aide/tech or use office chat to request help. Use minimal prompt: “Stop. In your area.”",
          score: 10,
          feedback: "Great fidelity. You use the team support plan when you cannot respond fully and keep language minimal.",
          next: "step2A"
        },
        B: {
          text: "Try to handle it alone while also managing the rest of the class.",
          score: 0,
          feedback: "Neutral. You are trying, but delayed support can increase risk and disruption.",
          next: "step2B"
        },
        C: {
          text: "Shout instructions from across the room while you stay with the other student.",
          score: -10,
          feedback: "Public attention plus distance prompts can escalate and maintain the behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "Support arrives or is on the way. PJ pauses and watches for reactions.",
      choices: {
        A: {
          text: "Keep it calm and consistent: “In your area.” Point to sticker chart. Reinforce once he returns and stays put.",
          score: 10,
          feedback: "Excellent. Predictable routine plus reinforcement strengthens recovery.",
          next: "step3A"
        },
        B: {
          text: "Use the moment to explain everything PJ did wrong.",
          score: 0,
          feedback: "Neutral. Extended attention can restart escalation.",
          next: "step3B"
        },
        C: {
          text: "Call out PJ publicly to show you are serious.",
          score: -10,
          feedback: "Public attention increases the payoff and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ escalates more because the response is delayed and peers begin watching.",
      choices: {
        A: {
          text: "Repair: request support now (aide/tech/office chat). Use minimal prompt close to PJ and move peers back to tasks.",
          score: 10,
          feedback: "Great repair. Uses the plan and reduces the audience effect.",
          next: "step3A"
        },
        B: {
          text: "Keep trying to do both tasks at once without support.",
          score: 0,
          feedback: "Neutral. This can prolong the episode and disrupt learning.",
          next: "step3B"
        },
        C: {
          text: "Announce consequences loudly to stop it fast.",
          score: -10,
          feedback: "Public attention can escalate and make it a performance.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells louder because the room hears the correction, and he tests the door again.",
      choices: {
        A: {
          text: "Repair: stop the public correction, request support immediately, and return to one calm prompt close to him.",
          score: 10,
          feedback: "Excellent repair. Removes spotlight and follows the support plan.",
          next: "step3A"
        },
        B: {
          text: "Keep shouting directions from afar.",
          score: 0,
          feedback: "Neutral. Still attention-heavy and less effective.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences while he is escalated.",
          score: -10,
          feedback: "Back-and-forth attention prolongs escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and stays in the room while support helps stabilize.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Recovery and safety improved. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays in the room but keeps attention bids going with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement and clear next step may help.", next: "step4" } }
    },

    step3C: {
      text: "PJ escalates and peers remain focused on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after support helped stabilize?",
      choices: {
        A: {
          text: "Reinforce the recovery: sticker for staying in area and following directions. Keep any debrief private later.",
          score: 10,
          feedback: "Perfect. Strengthens the return-to-area routine and avoids spotlighting.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement since support had to be called.",
          score: 0,
          feedback: "Neutral. Weakens the recovery routine.",
          ending: "mixed"
        },
        C: {
          text: "Talk about it publicly so the class sees consequences.",
          score: -10,
          feedback: "Public attention increases future performances and escalations.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Support Plan Used", text: "Support was requested appropriately and PJ earned reinforcement for returning to area and staying in the room." },
    mixed: { title: "Mixed – Stabilized, Weak Reinforcement", text: "Safety improved, but reinforcement was unclear." },
    fail: { title: "Fail – Spotlight Increased", text: "Public attention increased escalation and prolonged disruption." }
  }
});

/*************************************************
 * DAILY SCENARIO 6 — Group Rotations With Tech Pull-Out (Wandering)
 **************************************************/
POOL.daily.push({
  id: "daily_6_rotations_tech_pullout_wandering",
  title: "Daily Mission: Rotations With Tech Support",
  start: "step1",
  steps: {

    step1: {
      text: "During group rotations, the tech is doing a 1:1 lesson nearby. PJ leaves his rotation spot and wanders toward the tech area, making silly noises to get attention.",
      choices: {
        A: {
          text: "One-step prompt + visual: “PJ, in your area.” Point to the sticker chart: “Stay here, earn a sticker.”",
          score: 10,
          feedback: "Great fidelity. Clear boundary plus the earn path gets him back without a long interaction.",
          next: "step2A"
        },
        B: {
          text: "Explain to PJ why the tech is working with someone else and he needs to wait.",
          score: 0,
          feedback: "Neutral. Explanation can turn into attention and keep the wandering going.",
          next: "step2B"
        },
        C: {
          text: "Call out across the room: “PJ, stop wandering!”",
          score: -10,
          feedback: "Public correction can increase attention and peer reactions.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ steps back to his area but keeps looking over and making small noises to pull attention.",
      choices: {
        A: {
          text: "Reinforce the return immediately: give a sticker and whisper, “Nice staying in your area.” Then give one simple task step: “Start here.”",
          score: 10,
          feedback: "Excellent. Immediate reinforcement strengthens the replacement behavior and keeps the momentum.",
          next: "step3A"
        },
        B: {
          text: "Wait to give a sticker until the end of rotations.",
          score: 0,
          feedback: "Neutral. For Kinder, delayed reinforcement is often too late to shape the moment.",
          next: "step3B"
        },
        C: {
          text: "Clip him down right away for the noises.",
          score: -10,
          feedback: "Punishment without prompting the replacement can increase attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs and wanders closer, trying to get the tech’s attention and peer laughs.",
      choices: {
        A: {
          text: "Repair: redirect peers back to work, then quietly cue PJ: “In your area.” Point to the sticker chart and block off attention by turning back to instruction.",
          score: 10,
          feedback: "Great repair. Reduces the audience and returns to the plan quickly.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to PJ about waiting and being respectful.",
          score: 0,
          feedback: "Neutral. Longer attention can keep the behavior going.",
          next: "step3B"
        },
        C: {
          text: "Stop rotations and address PJ in front of the class.",
          score: -10,
          feedback: "Creates a big spotlight moment and can escalate wandering/noises.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ runs a loop around the room and giggles, checking peer reactions.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop. In your area.” Point to the sticker chart and immediately reset him into the first task step.",
          score: 10,
          feedback: "Excellent. Minimal language plus a clear earn path and quick re-entry to instruction.",
          next: "step3A"
        },
        B: {
          text: "Repeat directions from across the room while teaching.",
          score: 0,
          feedback: "Neutral. Distance prompts may not be effective when he is performing for peers.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and lecture about running.",
          score: -10,
          feedback: "High attention can reinforce the performance and increase peer laughs.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in his area and starts the rotation activity.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is back in routine. Keep reinforcement tight.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays in his area but keeps making small noises and looking around.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but he may need faster reinforcement for quiet voice and staying put.", next: "step4" } }
    },

    step3C: {
      text: "PJ wanders again toward the tech and peers start watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining wandering and noises.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up this rotation block?",
      choices: {
        A: {
          text: "Give a sticker for staying in area and add a pom pom/class point for the group if the rotation stayed on track.",
          score: 10,
          feedback: "Perfect. Reinforces PJ’s replacement and supports the class systems too.",
          ending: "success"
        },
        B: {
          text: "Move on with no sticker even though he stayed in area.",
          score: 0,
          feedback: "Neutral. Weakens the sticker system and makes wandering more likely next time.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the wandering in front of the class before switching groups.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Rotations Stayed On Track", text: "PJ stayed in his area, started work, and earned reinforcement through the sticker system." },
    mixed: { title: "Mixed – Routine Not Strengthened", text: "PJ stabilized, but reinforcement timing was unclear." },
    fail: { title: "Fail – Audience Increased", text: "Public attention increased peer reinforcement and made wandering/noises more likely." }
  }
});


/*************************************************
 * DAILY SCENARIO 7 — Transition to Carpet (Wandering + “No!”)
 **************************************************/
POOL.daily.push({
  id: "daily_7_transition_to_carpet_no_wandering",
  title: "Daily Mission: Carpet Transition",
  start: "step1",
  steps: {

    step1: {
      text: "You say it is time to come to the carpet. PJ says, “NO!” and walks away from the carpet spot, smiling at peers.",
      choices: {
        A: {
          text: "Ignore the “no,” give one calm direction: “Carpet spot.” Point to the sticker chart: “Come to spot, earn a sticker.”",
          score: 10,
          feedback: "Great fidelity. Minimal language, clear next step, and a visible earn path.",
          next: "step2A"
        },
        B: {
          text: "Ask why he said no and try to talk him into it.",
          score: 0,
          feedback: "Neutral. It can become attention and delay the transition.",
          next: "step2B"
        },
        C: {
          text: "Correct him loudly so everyone hears, “PJ, stop saying no!”",
          score: -10,
          feedback: "Public attention can increase refusal and wandering.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ steps toward his carpet spot but makes a loud silly noise to get laughs.",
      choices: {
        A: {
          text: "Keep instruction moving and reinforce quietly once he is in his spot: sticker + whisper, “Nice carpet spot.”",
          score: 10,
          feedback: "Excellent. Reinforces the right behavior and avoids giving the noise a stage.",
          next: "step3A"
        },
        B: {
          text: "Wait to reinforce until the entire lesson is over.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement is less effective for shaping the moment.",
          next: "step3B"
        },
        C: {
          text: "Clip him down immediately for the noise.",
          score: -10,
          feedback: "Punishment without prompting the replacement routine can increase attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ runs behind a table and makes another noise. A couple students giggle.",
      choices: {
        A: {
          text: "Repair: redirect peers to the carpet, then quietly cue PJ: “Carpet spot.” Point to the sticker chart.",
          score: 10,
          feedback: "Great repair. Reduces peer reinforcement and returns to one clear step.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to PJ while the class waits.",
          score: 0,
          feedback: "Neutral. The waiting becomes attention for PJ.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and announce PJ is not following directions.",
          score: -10,
          feedback: "Big attention moment increases the payoff for refusal.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells “NO!” again and tries to leave the carpet area completely.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop. Carpet spot.” Signal aide/tech if needed and keep peers focused on the lesson start.",
          score: 10,
          feedback: "Excellent. Minimal language, safety-focused, and you use support without spotlighting.",
          next: "step3A"
        },
        B: {
          text: "Call him from across the room repeatedly.",
          score: 0,
          feedback: "Neutral. It may not guide him to a specific spot and can add attention.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and argue in front of peers.",
          score: -10,
          feedback: "Public intensity increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ sits in his carpet spot and stays in the area.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Transition success. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but keeps small noises going to test for laughs.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but he may need quicker reinforcement for quiet voice.", next: "step4" } }
    },

    step3C: {
      text: "PJ keeps wandering and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining refusal and wandering.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up the carpet transition?",
      choices: {
        A: {
          text: "Give a sticker for getting to his carpet spot and praise quietly. Then start instruction immediately.",
          score: 10,
          feedback: "Perfect. Reinforces the transition routine and reduces attention for disruptions.",
          ending: "success"
        },
        B: {
          text: "Start the lesson without giving a sticker even though he complied.",
          score: 0,
          feedback: "Neutral. Weakens the earn system.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier “no” in front of the group as a warning.",
          score: -10,
          feedback: "Public attention can restart the cycle during the lesson.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Carpet Transition Reinforced", text: "PJ followed the prompt to get to his spot and earned reinforcement for staying in area." },
    mixed: { title: "Mixed – Transition Happened, Weak Reinforcement", text: "PJ transitioned, but reinforcement timing was unclear." },
    fail: { title: "Fail – Attention Maintained Refusal", text: "Public attention increased peer reinforcement and refusal patterns." }
  }
});


/*************************************************
 * DAILY SCENARIO 8 — Snack Time (Wandering for Peer Attention)
 **************************************************/
POOL.daily.push({
  id: "daily_8_snack_time_wandering_attention",
  title: "Daily Mission: Snack Time Expectations",
  start: "step1",
  steps: {

    step1: {
      text: "During snack, PJ gets up from his seat and wanders to different tables making noises to get laughs.",
      choices: {
        A: {
          text: "One-step prompt + earn path: “PJ, in your seat.” Point to the sticker chart: “Stay in your seat, earn a sticker.”",
          score: 10,
          feedback: "Great. Clear expectation and a visual earn path during a less structured time.",
          next: "step2A"
        },
        B: {
          text: "Say, “Sit down please,” and explain that snack is not for wandering.",
          score: 0,
          feedback: "Neutral. More talking can become attention and keep the behavior going.",
          next: "step2B"
        },
        C: {
          text: "Correct him loudly so the room hears.",
          score: -10,
          feedback: "Public correction can increase peer attention and escalate.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ sits but keeps making small noises while watching peers.",
      choices: {
        A: {
          text: "Reinforce the seat fast: sticker + whisper, “Nice staying in your seat.” Then redirect: “Snack in your seat.”",
          score: 10,
          feedback: "Excellent. Immediate reinforcement strengthens the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Wait for full silence before reinforcing.",
          score: 0,
          feedback: "Neutral. Waiting too long can reduce motivation and increase wandering again.",
          next: "step3B"
        },
        C: {
          text: "Clip him down for the noises even though he sat.",
          score: -10,
          feedback: "This may discourage returning to seat and increase attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs and wanders again, a peer says, “He’s being funny!”",
      choices: {
        A: {
          text: "Repair: redirect peers back to snack, then quietly cue PJ: “In your seat.” Point to the sticker chart.",
          score: 10,
          feedback: "Great repair. Reduces peer reinforcement and returns to the plan quickly.",
          next: "step3A"
        },
        B: {
          text: "Tell the whole class to stop reacting to PJ.",
          score: 0,
          feedback: "Neutral. It can still create a spotlight moment.",
          next: "step3B"
        },
        C: {
          text: "Have a long talk with PJ about being funny vs safe.",
          score: -10,
          feedback: "Long attention reinforces the behavior and delays instruction.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells “NO!” and moves toward the classroom door area.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop. In your seat.” Signal aide/tech if needed and keep the class moving.",
          score: 10,
          feedback: "Excellent. Minimal language, safety-focused, uses support plan.",
          next: "step3A"
        },
        B: {
          text: "Call his name repeatedly from across the room.",
          score: 0,
          feedback: "Neutral. It can become attention and may not guide him to the target behavior.",
          next: "step3B"
        },
        C: {
          text: "Chase him and talk loudly.",
          score: -10,
          feedback: "High intensity increases attention and escalates elopement risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays seated and snack continues smoothly.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is in the expected area. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but continues low-level noises and attention bids.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be quicker and more frequent.", next: "step4" } }
    },

    step3C: {
      text: "PJ wanders again and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining wandering and noises.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up snack time support?",
      choices: {
        A: {
          text: "Give a sticker for staying in seat/area and add a pom pom/class point for a smooth snack routine.",
          score: 10,
          feedback: "Perfect. Reinforces PJ and supports the class system.",
          ending: "success"
        },
        B: {
          text: "Move on without giving a sticker even though he stayed seated.",
          score: 0,
          feedback: "Neutral. Weakens the earn path and increases future wandering.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his wandering in front of peers after snack ends.",
          score: -10,
          feedback: "Public attention can trigger another round of attention-seeking.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Snack Routine Reinforced", text: "PJ stayed in his seat/area and earned reinforcement for following the routine." },
    mixed: { title: "Mixed – Stable, Weak Reinforcement", text: "PJ stabilized, but reinforcement was unclear." },
    fail: { title: "Fail – Audience Increased", text: "Public attention increased the payoff for wandering and noises." }
  }
});


/*************************************************
 * DAILY SCENARIO 9 — Work Avoidance (Not Doing Work + Wandering)
 **************************************************/
POOL.daily.push({
  id: "daily_9_work_avoidance_wandering",
  title: "Daily Mission: Start the Work",
  start: "step1",
  steps: {

    step1: {
      text: "PJ avoids a task by wandering away and making noises instead of starting his work.",
      choices: {
        A: {
          text: "One-step prompt + first-step support: “PJ, sit here.” Then: “Do this first.” Point to the sticker chart: “Start work and stay here, earn a sticker.”",
          score: 10,
          feedback: "Great. Clear direction, reduced response effort, and an immediate earn path.",
          next: "step2A"
        },
        B: {
          text: "Tell him to do his work and explain the directions again.",
          score: 0,
          feedback: "Neutral. More talking can become attention and delay task start.",
          next: "step2B"
        },
        C: {
          text: "Publicly say, “PJ is not working,” so others hear.",
          score: -10,
          feedback: "Public attention increases avoidance and peer reinforcement.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ sits and touches the paper but tries to get a laugh with a silly noise.",
      choices: {
        A: {
          text: "Reinforce task start quickly and quietly: sticker + whisper, “Nice start.” Then continue with the next tiny step.",
          score: 10,
          feedback: "Excellent. Reinforces the desired behavior and keeps the momentum going.",
          next: "step3A"
        },
        B: {
          text: "Ignore everything and hope he keeps working.",
          score: 0,
          feedback: "Neutral. Avoids attention but misses a key reinforcement moment.",
          next: "step3B"
        },
        C: {
          text: "Clip him down for the noise even though he started.",
          score: -10,
          feedback: "May reduce motivation to start work next time.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ runs around the table and peers start watching.",
      choices: {
        A: {
          text: "Repair: redirect peers back to work, then calmly cue PJ: “Sit.” Point to the sticker chart and restart the first tiny step.",
          score: 10,
          feedback: "Great repair. Removes the audience and returns to a clear next action.",
          next: "step3A"
        },
        B: {
          text: "Tell the whole group to ignore PJ.",
          score: 0,
          feedback: "Neutral. It can still turn into a spotlight moment.",
          next: "step3B"
        },
        C: {
          text: "Have a long conference with PJ about why he needs to work.",
          score: -10,
          feedback: "Long attention can reinforce avoidance and delay learning time.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ shouts “NO!” and tries to get away from the table again.",
      choices: {
        A: {
          text: "Calm close prompt: “Sit.” Signal aide/tech if needed while you keep the group instruction moving.",
          score: 10,
          feedback: "Excellent. Minimal language, uses support plan, and reduces group disruption.",
          next: "step3A"
        },
        B: {
          text: "Follow him around giving repeated directions.",
          score: 0,
          feedback: "Neutral. Can become attention-heavy and reduce instruction.",
          next: "step3B"
        },
        C: {
          text: "Argue with him in front of peers about saying no.",
          score: -10,
          feedback: "Public attention and debate increase avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ sits and completes a small part of the task.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Task start and staying in area happened. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but completes very little and keeps testing with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be faster and more frequent.", next: "step4" } }
    },

    step3C: {
      text: "PJ avoids again and peers keep reacting.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining avoidance and movement.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after he starts working?",
      choices: {
        A: {
          text: "Give a sticker for staying in area and starting work. Quiet praise and move on.",
          score: 10,
          feedback: "Perfect. Reinforces task start and staying in area.",
          ending: "success"
        },
        B: {
          text: "Move on with no sticker even though he started.",
          score: 0,
          feedback: "Neutral. Weakens the earn path and future task start.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier wandering in front of peers.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Task Start Reinforced", text: "PJ stayed in the area and started work, earning reinforcement through the sticker system." },
    mixed: { title: "Mixed – Started, Weak Reinforcement", text: "PJ started, but reinforcement timing was unclear." },
    fail: { title: "Fail – Avoidance Maintained", text: "Public attention increased peer reinforcement and made avoidance more likely." }
  }
});


/*************************************************
 * DAILY SCENARIO 10 — Error Correction Routine (Warning → Clip Down)
 **************************************************/
POOL.daily.push({
  id: "daily_10_error_correction_warning_clip",
  title: "Daily Mission: Error Correction Routine",
  start: "step1",
  steps: {

    step1: {
      text: "PJ leaves his area again during a less structured time and makes loud noises. You need to use your error correction routine.",
      choices: {
        A: {
          text: "Give a brief warning with a clear next step: “Warning. In your area.” Point to the sticker chart: “Stay here, earn a sticker.”",
          score: 10,
          feedback: "Great fidelity. Matches your system and keeps the response short and clear.",
          next: "step2A"
        },
        B: {
          text: "Give multiple reminders and explain why he is distracting others.",
          score: 0,
          feedback: "Neutral. More talking can become attention and prolong the episode.",
          next: "step2B"
        },
        C: {
          text: "Clip him down immediately with a public statement about it.",
          score: -10,
          feedback: "Public correction increases attention and can escalate the behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ returns to his area but quickly tests again with a silly noise to see who laughs.",
      choices: {
        A: {
          text: "If he repeats, clip down quietly and reset: “Clip. In your area.” Then reinforce the moment he stays put with a sticker.",
          score: 10,
          feedback: "Excellent. Quiet follow-through plus immediate reinforcement for the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Give another warning and keep talking about it.",
          score: 0,
          feedback: "Neutral. Repeated warnings can become attention without follow-through.",
          next: "step3B"
        },
        C: {
          text: "Argue with PJ about why he should not make noises.",
          score: -10,
          feedback: "Debate increases attention and reinforces the behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs and keeps wandering because the conversation is giving him attention.",
      choices: {
        A: {
          text: "Repair: stop talking, give one step: “In your area.” Use the warning/clip system quietly and immediately reinforce the return with a sticker.",
          score: 10,
          feedback: "Great repair. Minimal language plus consistent system use reduces attention payoff.",
          next: "step3A"
        },
        B: {
          text: "Continue talking until he stops.",
          score: 0,
          feedback: "Neutral. Sustained attention can maintain the behavior.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and announce he is getting clipped down.",
          score: -10,
          feedback: "Public attention increases peer reinforcement and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ escalates with louder noises because peers heard the clip and are watching.",
      choices: {
        A: {
          text: "Repair: reduce the audience and handle the clip quietly. Give one calm prompt: “In your area.” Then reinforce the return with a sticker.",
          score: 10,
          feedback: "Excellent repair. Removes the stage and returns to consistent follow-through.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating directions loudly until he stops.",
          score: 0,
          feedback: "Neutral. Repetition can increase attention and escalation.",
          next: "step3B"
        },
        C: {
          text: "Lecture about consequences in front of peers.",
          score: -10,
          feedback: "Extended public attention increases the payoff.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in his area and begins doing what the group is doing.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Routine restored. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays briefly but keeps testing for attention with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement timing may need to be tighter.", next: "step4" } }
    },

    step3C: {
      text: "PJ continues wandering and pulling peers in.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining the behavior.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up once he is back in routine?",
      choices: {
        A: {
          text: "Reinforce the recovery: sticker + quiet praise. Save any “what went wrong” talk for a private moment later.",
          score: 10,
          feedback: "Perfect. Strengthens the replacement behavior and avoids spotlighting.",
          ending: "success"
        },
        B: {
          text: "Do not give a sticker even after he returned.",
          score: 0,
          feedback: "Neutral. Weakens the motivation to return to area quickly next time.",
          ending: "mixed"
        },
        C: {
          text: "Talk about what went wrong in front of peers right now.",
          score: -10,
          feedback: "Public attention can restart the cycle and increase peer reactions.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Error Correction Worked", text: "PJ returned to his area with calm prompts and earned reinforcement for recovery." },
    mixed: { title: "Mixed – Returned, Weak Reinforcement", text: "PJ returned, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Spotlight Increased", text: "Public correction increased peer reinforcement and made wandering/noises more likely." }
  }
});


/*************************************************
 * CRISIS SCENARIO 1 — Bolting Toward the Door (Support Needed)
 **************************************************/
POOL.crisis.push({
  id: "crisis_1_bolting_toward_door_support",
  title: "Crisis Drill: Bolting Toward the Door",
  start: "step1",
  steps: {

    step1: {
      text: "PJ yells “NO!” and moves quickly toward the classroom door during a less structured moment.",
      choices: {
        A: {
          text: "Use a calm close prompt: “Stop.” Then: “Back to your area.” Signal aide/tech or use office chat for support if needed.",
          score: 10,
          feedback: "Great fidelity. Minimal language, safety-focused, and you use the support plan appropriately.",
          next: "step2A"
        },
        B: {
          text: "Call from across the room, “Come back!” while managing the class.",
          score: 0,
          feedback: "Neutral. It may work, but it can become attention and may not stop the door attempt.",
          next: "step2B"
        },
        C: {
          text: "Run after PJ while talking loudly.",
          score: -10,
          feedback: "High intensity can escalate and create a big attention moment.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ pauses near the door and looks back, checking your reaction.",
      choices: {
        A: {
          text: "Offer a simple choice: “Walk back or hold my hand back.” Reinforce the first step back with quiet praise and a sticker once in area.",
          score: 10,
          feedback: "Excellent. Choice supports compliance and reinforcement strengthens returning behavior.",
          next: "step3A"
        },
        B: {
          text: "Explain the rules about leaving and talk through it.",
          score: 0,
          feedback: "Neutral. More talking can become attention and delay return.",
          next: "step3B"
        },
        C: {
          text: "Threaten loss of recess or choice time loudly.",
          score: -10,
          feedback: "Public threats can escalate yelling and running.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ continues toward the door slowly and glances back like he is testing if you will chase.",
      choices: {
        A: {
          text: "Repair: move closer calmly, use one prompt: “Stop.” Then point back to his area and signal support (aide/tech/office chat).",
          score: 10,
          feedback: "Great repair. Safety-focused and minimal language, with support activated.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Come back” several times.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and maintain the pattern.",
          next: "step3B"
        },
        C: {
          text: "Announce to the class that PJ is trying to leave.",
          score: -10,
          feedback: "Creates a big audience moment and increases attention payoff.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ speeds up and yells louder as you rush toward him. Peers start watching.",
      choices: {
        A: {
          text: "Repair: lower your intensity, create space, use one calm prompt close to him, and call for support if needed.",
          score: 10,
          feedback: "Excellent repair. De-escalates the adult response and prioritizes safety.",
          next: "step3A"
        },
        B: {
          text: "Keep chasing and repeating demands.",
          score: 0,
          feedback: "Neutral. It may stop him, but it increases attention and intensity.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences while he is escalated.",
          score: -10,
          feedback: "Back-and-forth attention can escalate and prolong the episode.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and stops moving toward the door.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safety restored. Reinforce the return quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ returns but keeps yelling/noises to pull attention.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. He may need quick reinforcement for returning and staying put.", next: "step4" } }
    },

    step3C: {
      text: "PJ keeps trying to move away and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention payoff increased risk and continued escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize after PJ returns?",
      choices: {
        A: {
          text: "Reinforce the return: quiet praise + sticker for staying in area. Then reset into the next simple task step.",
          score: 10,
          feedback: "Perfect. Strengthens returning behavior and reduces future door attempts.",
          ending: "success"
        },
        B: {
          text: "Move on with no reinforcement since it was unsafe.",
          score: 0,
          feedback: "Neutral. Safety matters, but reinforcement strengthens the return-to-area behavior.",
          ending: "mixed"
        },
        C: {
          text: "Call out what happened in front of peers.",
          score: -10,
          feedback: "Public attention can restart the cycle quickly.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Door Attempt Resolved", text: "PJ returned to his area and earned reinforcement for recovery and staying in the room." },
    mixed: { title: "Mixed – Returned, Weak Reinforcement", text: "PJ returned safely, but reinforcement was unclear." },
    fail: { title: "Fail – Audience Increased", text: "Public attention increased the payoff and raised future elopement attempts." }
  }
});


/*************************************************
 * CRISIS SCENARIO 2 — Running the Room (High Peer Attention)
 **************************************************/
POOL.crisis.push({
  id: "crisis_2_running_room_peer_attention",
  title: "Crisis Drill: Running the Room",
  start: "step1",
  steps: {

    step1: {
      text: "PJ runs around the room making loud noises. Several students laugh and watch him.",
      choices: {
        A: {
          text: "Reduce the audience: redirect peers to their tasks, then use one calm prompt close to PJ: “Stop. In your area.”",
          score: 10,
          feedback: "Great fidelity. Removes peer reinforcement and gives one clear safety direction.",
          next: "step2A"
        },
        B: {
          text: "Tell PJ to stop running from across the room while teaching.",
          score: 0,
          feedback: "Neutral. Distance prompts can become attention and may not stop running quickly.",
          next: "step2B"
        },
        C: {
          text: "Yell and lecture about running so everyone hears.",
          score: -10,
          feedback: "Public attention can increase the performance behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ stops briefly but makes a loud noise to get laughs again.",
      choices: {
        A: {
          text: "Keep it minimal: “Quiet.” Point to his area and the sticker chart. Reinforce as soon as he is in area.",
          score: 10,
          feedback: "Excellent. Predictable and quick reinforcement strengthens calming and returning.",
          next: "step3A"
        },
        B: {
          text: "Explain why he should not run and why it is unsafe.",
          score: 0,
          feedback: "Neutral. Explanation can become attention during escalation.",
          next: "step3B"
        },
        C: {
          text: "Stop instruction and correct PJ publicly.",
          score: -10,
          feedback: "Creates a stage and increases peer reactions.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ keeps running because peers are laughing and the direction is coming from far away.",
      choices: {
        A: {
          text: "Repair: move closer calmly, give one prompt: “Stop.” Signal aide/tech if you need immediate support.",
          score: 10,
          feedback: "Great repair. Calm proximity plus support plan reduces risk.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Stop running” multiple times.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and maintain the behavior.",
          next: "step3B"
        },
        C: {
          text: "Announce to the class that PJ is losing recess.",
          score: -10,
          feedback: "Public consequence talk increases audience attention.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ escalates and tries to pull another student into running with him.",
      choices: {
        A: {
          text: "Repair: reduce attention, keep peers focused elsewhere, use one calm prompt close to PJ and guide him back to area.",
          score: 10,
          feedback: "Excellent. Removes peer reinforcement and restores the routine.",
          next: "step3A"
        },
        B: {
          text: "Keep calling out to stop while the class watches.",
          score: 0,
          feedback: "Neutral. Still attention-heavy.",
          next: "step3B"
        },
        C: {
          text: "Argue with PJ in front of peers.",
          score: -10,
          feedback: "Back-and-forth attention escalates and prolongs the episode.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and stays in place briefly.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safety restored. Reinforce quickly for staying in area.", next: "step4" } }
    },

    step3B: {
      text: "PJ returns but keeps small noises and attention bids going.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement may need to be immediate.", next: "step4" } }
    },

    step3C: {
      text: "PJ continues running and peers continue reacting.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize after the running stops?",
      choices: {
        A: {
          text: "Reinforce recovery: sticker for returning to area, quiet praise, then give the next simple task step.",
          score: 10,
          feedback: "Perfect. Reinforces the replacement routine and prevents a new cycle.",
          ending: "success"
        },
        B: {
          text: "Move on with no reinforcement.",
          score: 0,
          feedback: "Neutral. Weakens the return-to-area behavior.",
          ending: "mixed"
        },
        C: {
          text: "Talk about it publicly to the class.",
          score: -10,
          feedback: "Public attention increases future running for laughs.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Running Stopped and Routine Restored", text: "PJ returned to his area and earned reinforcement for recovery and staying put." },
    mixed: { title: "Mixed – Stopped, Weak Reinforcement", text: "PJ stopped, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Audience Maintained Running", text: "Public attention increased the payoff and prolonged escalation." }
  }
});


/*************************************************
 * CRISIS SCENARIO 3 — Loud “NO!” and Refusal (Clip System)
 **************************************************/
POOL.crisis.push({
  id: "crisis_3_loud_no_refusal_clip_system",
  title: "Crisis Drill: Loud Refusal",
  start: "step1",
  steps: {

    step1: {
      text: "You give a direction and PJ yells, “NO!” then tries to move away while peers watch.",
      choices: {
        A: {
          text: "Ignore the refusal. Give one calm direction again and point to his area/sticker chart. Use warning → clip quietly if it repeats.",
          score: 10,
          feedback: "Great fidelity. Minimal language, consistent system, and no public spotlight.",
          next: "step2A"
        },
        B: {
          text: "Ask why he is saying no and keep talking.",
          score: 0,
          feedback: "Neutral. It can become attention and increase refusal.",
          next: "step2B"
        },
        C: {
          text: "Correct him publicly and threaten consequences loudly.",
          score: -10,
          feedback: "Public attention increases the payoff for yelling no.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ complies for a second but makes a loud noise to pull attention back.",
      choices: {
        A: {
          text: "Keep it minimal: “Quiet.” Point to sticker chart. Reinforce as soon as he is quiet and in area with a sticker.",
          score: 10,
          feedback: "Excellent. Quick reinforcement strengthens calm compliance.",
          next: "step3A"
        },
        B: {
          text: "Lecture about using a nice voice.",
          score: 0,
          feedback: "Neutral. Longer attention can restart the cycle.",
          next: "step3B"
        },
        C: {
          text: "Clip down publicly so peers notice.",
          score: -10,
          feedback: "Public clip increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ gets louder and tries to run away from the direction.",
      choices: {
        A: {
          text: "Repair: stop talking, give one calm prompt close to him, and signal aide/tech if needed.",
          score: 10,
          feedback: "Great repair. Minimal language and support plan use reduces escalation.",
          next: "step3A"
        },
        B: {
          text: "Keep talking and negotiating.",
          score: 0,
          feedback: "Neutral. Negotiation can reinforce refusal.",
          next: "step3B"
        },
        C: {
          text: "Announce consequences to the class.",
          score: -10,
          feedback: "Public attention increases the payoff and escalates.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells louder because the class is watching.",
      choices: {
        A: {
          text: "Repair: reduce audience, go back to one calm prompt, and apply warning/clip quietly while keeping peers engaged elsewhere.",
          score: 10,
          feedback: "Excellent repair. Removes spotlight and restores the routine.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating demands loudly.",
          score: 0,
          feedback: "Neutral. Repetition can add attention and maintain escalation.",
          next: "step3B"
        },
        C: {
          text: "Argue about who is in charge.",
          score: -10,
          feedback: "Power struggle increases attention and refusal.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and follows the direction with a calmer body.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Routine restored. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ complies but stays attention-seeking with small noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement may need to be more immediate.", next: "step4" } }
    },

    step3C: {
      text: "PJ escalates and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize after PJ complies?",
      choices: {
        A: {
          text: "Reinforce immediately for being in area and following directions: sticker + quiet praise. Save any debrief for private later.",
          score: 10,
          feedback: "Perfect. Reinforces replacement behavior and avoids spotlighting.",
          ending: "success"
        },
        B: {
          text: "Do not reinforce because he yelled first.",
          score: 0,
          feedback: "Neutral. Weakens motivation for returning quickly next time.",
          ending: "mixed"
        },
        C: {
          text: "Debrief publicly in front of peers.",
          score: -10,
          feedback: "Public attention increases future yelling and refusal.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Refusal Cycle Interrupted", text: "PJ returned to area and earned reinforcement for calm compliance and following directions." },
    mixed: { title: "Mixed – Complied, Weak Reinforcement", text: "PJ complied, but reinforcement was unclear." },
    fail: { title: "Fail – Refusal Reinforced", text: "Public attention increased the payoff for yelling and refusal." }
  }
});


/*************************************************
 * CRISIS SCENARIO 4 — Classroom Disruption Spreads (Peers Copy)
 **************************************************/
POOL.crisis.push({
  id: "crisis_4_peers_copying_disruption",
  title: "Crisis Drill: Peers Start Copying",
  start: "step1",
  steps: {

    step1: {
      text: "PJ makes loud noises and now a couple peers start copying. The whole room begins to get noisy.",
      choices: {
        A: {
          text: "Reset the group quickly (class point/pom pom goal), then quietly cue PJ: “Quiet voice. In your area.” Point to sticker chart.",
          score: 10,
          feedback: "Great. Addresses the group and PJ without spotlighting him.",
          next: "step2A"
        },
        B: {
          text: "Keep correcting everyone verbally for a long time.",
          score: 0,
          feedback: "Neutral. It may add attention and keep the noise going.",
          next: "step2B"
        },
        C: {
          text: "Call PJ out as the reason the class is loud.",
          score: -10,
          feedback: "Public blame increases attention and escalation risk.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "The class quiets a bit. PJ is watching to see if people are still paying attention to him.",
      choices: {
        A: {
          text: "Reinforce quickly when PJ is quiet in area: give a sticker and whisper praise, then continue instruction.",
          score: 10,
          feedback: "Excellent. Reinforces the exact replacement behavior and keeps the group moving.",
          next: "step3A"
        },
        B: {
          text: "Wait a long time before reinforcing.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement weakens the replacement routine.",
          next: "step3B"
        },
        C: {
          text: "Lecture PJ about being a leader for the class.",
          score: -10,
          feedback: "Extended attention can restart the performance behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "The room stays noisy and PJ keeps making noises because the attention is staying on him.",
      choices: {
        A: {
          text: "Repair: stop talking, use a short group reset, then cue PJ quietly with one step and the sticker chart.",
          score: 10,
          feedback: "Great repair. Removes extra attention and returns to clear expectations.",
          next: "step3A"
        },
        B: {
          text: "Keep correcting loudly until it stops.",
          score: 0,
          feedback: "Neutral. Can keep attention on the disruption.",
          next: "step3B"
        },
        C: {
          text: "Send PJ out of the room as the first response.",
          score: -10,
          feedback: "High attention outcome and can create a predictable escape routine.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ escalates quickly because he is now in a spotlight moment.",
      choices: {
        A: {
          text: "Repair: remove the spotlight, redirect peers, and cue PJ quietly. Call for aide/tech support if needed.",
          score: 10,
          feedback: "Excellent. Removes audience reinforcement and uses support plan.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to the class about PJ’s behavior.",
          score: 0,
          feedback: "Neutral. Still attention-heavy.",
          next: "step3B"
        },
        C: {
          text: "Argue with PJ in front of the class.",
          score: -10,
          feedback: "Power struggle increases attention and escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in his area with a quieter voice and peers return to work.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Class is back on track. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "The class quiets somewhat, but PJ continues testing with small noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement may need to be faster.", next: "step4" } }
    },

    step3C: {
      text: "The disruption continues and attention stays on PJ.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining escalation and spread.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize after the group reset works?",
      choices: {
        A: {
          text: "Reinforce PJ quietly for quiet voice and staying in area with a sticker. Add a pom pom/class point for the class reset.",
          score: 10,
          feedback: "Perfect. Reinforces PJ and the class system without spotlighting.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcing anyone.",
          score: 0,
          feedback: "Neutral. Weakens both routines.",
          ending: "mixed"
        },
        C: {
          text: "Revisit the disruption publicly to teach a lesson.",
          score: -10,
          feedback: "Public attention increases future performances.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Class Reset Held", text: "The class returned to calm, and PJ earned reinforcement for quiet voice and staying in area." },
    mixed: { title: "Mixed – Reset Worked, Weak Reinforcement", text: "Behavior improved, but reinforcement was unclear." },
    fail: { title: "Fail – Spotlight Increased Spread", text: "Public attention increased the payoff and spread the disruption." }
  }
});


/*************************************************
 * CRISIS SCENARIO 5 — Escalation When Teacher Can’t Respond (Call Support)
 **************************************************/
POOL.crisis.push({
  id: "crisis_5_teacher_cannot_respond_call_support",
  title: "Crisis Drill: Call for Support",
  start: "step1",
  steps: {

    step1: {
      text: "PJ escalates during a busy moment (you are managing another student). He wanders, yells “NO,” and heads toward the door area.",
      choices: {
        A: {
          text: "Use the support plan immediately: signal aide/tech or use office chat to request help. Use minimal prompt: “Stop. In your area.”",
          score: 10,
          feedback: "Great fidelity. You use the team support plan when you cannot respond fully and keep language minimal.",
          next: "step2A"
        },
        B: {
          text: "Try to handle it alone while also managing the rest of the class.",
          score: 0,
          feedback: "Neutral. You are trying, but delayed support can increase risk and disruption.",
          next: "step2B"
        },
        C: {
          text: "Shout instructions from across the room while you stay with the other student.",
          score: -10,
          feedback: "Public attention plus distance prompts can escalate and maintain the behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "Support arrives or is on the way. PJ pauses and watches for reactions.",
      choices: {
        A: {
          text: "Keep it calm and consistent: “In your area.” Point to sticker chart. Reinforce once he returns and stays put.",
          score: 10,
          feedback: "Excellent. Predictable routine plus reinforcement strengthens recovery.",
          next: "step3A"
        },
        B: {
          text: "Use the moment to explain everything PJ did wrong.",
          score: 0,
          feedback: "Neutral. Extended attention can restart escalation.",
          next: "step3B"
        },
        C: {
          text: "Call out PJ publicly to show you are serious.",
          score: -10,
          feedback: "Public attention increases the payoff and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ escalates more because the response is delayed and peers begin watching.",
      choices: {
        A: {
          text: "Repair: request support now (aide/tech/office chat). Use minimal prompt close to PJ and move peers back to tasks.",
          score: 10,
          feedback: "Great repair. Uses the plan and reduces the audience effect.",
          next: "step3A"
        },
        B: {
          text: "Keep trying to do both tasks at once without support.",
          score: 0,
          feedback: "Neutral. This can prolong the episode and disrupt learning.",
          next: "step3B"
        },
        C: {
          text: "Announce consequences loudly to stop it fast.",
          score: -10,
          feedback: "Public attention can escalate and make it a performance.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells louder because the room hears the correction, and he tests the door again.",
      choices: {
        A: {
          text: "Repair: stop the public correction, request support immediately, and return to one calm prompt close to him.",
          score: 10,
          feedback: "Excellent repair. Removes spotlight and follows the support plan.",
          next: "step3A"
        },
        B: {
          text: "Keep shouting directions from afar.",
          score: 0,
          feedback: "Neutral. Still attention-heavy and less effective.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences while he is escalated.",
          score: -10,
          feedback: "Back-and-forth attention prolongs escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ returns to his area and stays in the room while support helps stabilize.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Recovery and safety improved. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays in the room but keeps attention bids going with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement and clear next step may help.", next: "step4" } }
    },

    step3C: {
      text: "PJ escalates and peers remain focused on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after support helped stabilize?",
      choices: {
        A: {
          text: "Reinforce the recovery: sticker for staying in area and following directions. Keep any debrief private later.",
          score: 10,
          feedback: "Perfect. Strengthens the return-to-area routine and avoids spotlighting.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement since support had to be called.",
          score: 0,
          feedback: "Neutral. Weakens the recovery routine.",
          ending: "mixed"
        },
        C: {
          text: "Talk about it publicly so the class sees consequences.",
          score: -10,
          feedback: "Public attention increases future performances and escalations.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Support Plan Used", text: "Support was requested appropriately and PJ earned reinforcement for returning to area and staying in the room." },
    mixed: { title: "Mixed – Stabilized, Weak Reinforcement", text: "Safety improved, but reinforcement was unclear." },
    fail: { title: "Fail – Spotlight Increased", text: "Public attention increased escalation and prolonged disruption." }
  }
});

/*************************************************
 * WILDCARD SCENARIO 1 — Surprise Fire Drill (High Noise + Movement)
 **************************************************/
POOL.wild.push({
  id: "wild_1_surprise_fire_drill_pj",
  title: "Wildcard Mission: Surprise Fire Drill",
  start: "step1",
  steps: {

    step1: {
      text: "The fire alarm blares unexpectedly during a transition. PJ startles, yells “NO!”, and starts moving quickly away from the line.",
      choices: {
        A: {
          text: "Use calm close prompts: “With me.” Then: “In line.” Keep language minimal and keep the class moving.",
          score: 10,
          feedback: "Great fidelity. Short prompts and proximity support safety during a high-noise event.",
          next: "step2A"
        },
        B: {
          text: "Say, “It’s just a drill,” and try to hurry everyone out.",
          score: 0,
          feedback: "Neutral. Reassurance can help, but PJ still needs a clear one-step direction.",
          next: "step2B"
        },
        C: {
          text: "Yell, “Stop yelling!” over the alarm where peers hear.",
          score: -10,
          feedback: "Public intensity during overwhelm can escalate quickly.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ stays close but tries to pull attention by making loud noises as students watch.",
      choices: {
        A: {
          text: "Quiet cue near him: “Quiet.” Point forward and keep moving. Reinforce once outside with a sticker for staying with you/in line.",
          score: 10,
          feedback: "Excellent. Keeps safety first and delays reinforcement until the safe moment, then delivers it quickly.",
          next: "step3A"
        },
        B: {
          text: "Keep watching him closely and reminding him repeatedly.",
          score: 0,
          feedback: "Neutral. Monitoring helps, but repeated attention can maintain the noise.",
          next: "step3B"
        },
        C: {
          text: "Stop the line and correct PJ while everyone waits.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk during a safety event.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ drifts away from the line and looks toward the door area, testing if he can break away.",
      choices: {
        A: {
          text: "Repair: move close calmly and give one prompt: “In line.” Offer a simple choice: “By me or behind ___.”",
          score: 10,
          feedback: "Great repair. Minimal language, clear expectation, and choice supports compliance quickly.",
          next: "step3A"
        },
        B: {
          text: "Call his name from ahead of the line repeatedly.",
          score: 0,
          feedback: "Neutral. Distance prompts can become attention and may not stop drifting.",
          next: "step3B"
        },
        C: {
          text: "Announce to the group that PJ is not listening.",
          score: -10,
          feedback: "Public attention increases the payoff and escalates during drills.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells louder and tries to bolt toward the classroom doorway area as peers watch.",
      choices: {
        A: {
          text: "Repair: reduce your intensity, create space, and use one calm prompt close to him. Signal aide/tech/office chat if needed.",
          score: 10,
          feedback: "Excellent repair. Safety-focused, minimal language, uses the support plan.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating demands loudly.",
          score: 0,
          feedback: "Neutral. Repetition can add attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences during the drill.",
          score: -10,
          feedback: "Back-and-forth attention increases escalation and risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "Outside, PJ stays near you and is quieter, still tense but safe.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safe transition completed. Reinforce quickly now.", next: "step4" } }
    },

    step3B: {
      text: "Outside, PJ stays with the group but continues small attention bids with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but he may need quick reinforcement for staying with the line.", next: "step4" } }
    },

    step3C: {
      text: "Outside, PJ continues yelling and peers react.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining the behavior.", next: "step4" } }
    },

    step4: {
      text: "How do you support PJ once you are safe outside?",
      choices: {
        A: {
          text: "Give a sticker for staying with you/in line and praise quietly. Then reset expectations for going back inside.",
          score: 10,
          feedback: "Perfect. Reinforces coping and safe transition behavior.",
          ending: "success"
        },
        B: {
          text: "Let him settle without reinforcement since it was stressful.",
          score: 0,
          feedback: "Neutral. Calm, but coping behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Discuss his yelling in front of the group while waiting outside.",
          score: -10,
          feedback: "Public attention increases future escalation during drills.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Drill Coping Reinforced", text: "PJ stayed with the line and earned reinforcement for safe behavior during a drill." },
    mixed: { title: "Mixed – Safe, Weak Reinforcement", text: "PJ stayed safe, but reinforcement for coping was unclear." },
    fail: { title: "Fail – Public Attention Increased", text: "Public attention increased peer reinforcement and future drill escalation risk." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 2 — New Seating Chart (Loss of Preferred Spot)
 **************************************************/
POOL.wild.push({
  id: "wild_2_new_seating_chart_preferred_spot",
  title: "Wildcard Mission: New Seating Chart",
  start: "step1",
  steps: {

    step1: {
      text: "You introduce a new seating chart. PJ realizes he is not in his usual spot and says “NO!” while standing up and looking around for attention.",
      choices: {
        A: {
          text: "One-step prompt + choice: “Sit in your spot.” Then: “Do you want the blue cushion or the regular chair?”",
          score: 10,
          feedback: "Great. Clear next step plus a small choice reduces refusal and wandering.",
          next: "step2A"
        },
        B: {
          text: "Explain why the seating chart changed and why he needs to accept it.",
          score: 0,
          feedback: "Neutral. Explanation can become attention and prolong escalation.",
          next: "step2B"
        },
        C: {
          text: "Correct him publicly for not accepting the new seat.",
          score: -10,
          feedback: "Public attention increases refusal and performance behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ sits but scoots his chair and makes noises, trying to get peers to laugh.",
      choices: {
        A: {
          text: "Reinforce the sit fast: give a sticker and whisper, “Nice sitting in your spot.” Then start the first task step.",
          score: 10,
          feedback: "Excellent. Immediate reinforcement strengthens compliance and reduces attention bids.",
          next: "step3A"
        },
        B: {
          text: "Wait until he sits perfectly still to reinforce.",
          score: 0,
          feedback: "Neutral. Waiting can increase wiggles/noises again.",
          next: "step3B"
        },
        C: {
          text: "Clip him down for noises even though he sat.",
          score: -10,
          feedback: "May reduce motivation to comply with the seat change next time.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ gets louder while you talk and starts to wander toward another seat.",
      choices: {
        A: {
          text: "Repair: stop talking and give one calm prompt close to him: “Sit.” Point to the sticker chart: “Sit and stay, earn a sticker.”",
          score: 10,
          feedback: "Great repair. Minimal language plus the earn path restores structure.",
          next: "step3A"
        },
        B: {
          text: "Keep negotiating and explaining the seating change.",
          score: 0,
          feedback: "Neutral. Attention and delay can reinforce refusal.",
          next: "step3B"
        },
        C: {
          text: "Announce to the class that PJ is refusing the new seat.",
          score: -10,
          feedback: "Creates a stage and escalates attention bids.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ stands up and heads toward the door area to escape the seat change.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop.” Then: “Back to your spot.” Signal aide/tech if needed and keep peers focused on starting work.",
          score: 10,
          feedback: "Excellent. Safety-focused, minimal language, uses support plan.",
          next: "step3A"
        },
        B: {
          text: "Call from across the room and keep repeating “sit down.”",
          score: 0,
          feedback: "Neutral. Distance prompts can become attention and may not stop door drifting.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and argue about being flexible.",
          score: -10,
          feedback: "Public intensity increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ sits in the new spot and stays in the area.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Seating change success. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but keeps testing with noises and small movements.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be more immediate.", next: "step4" } }
    },

    step3C: {
      text: "PJ keeps wandering and peers keep watching him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining refusal and movement.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up the seating change moment?",
      choices: {
        A: {
          text: "Give a sticker for sitting and staying in the new spot. Quiet praise and move on quickly.",
          score: 10,
          feedback: "Perfect. Reinforces flexibility and staying in area.",
          ending: "success"
        },
        B: {
          text: "Move on with no sticker even though he sat.",
          score: 0,
          feedback: "Neutral. Weakens the earn path for flexibility.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his refusal publicly after he sits.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Flexibility Reinforced", text: "PJ sat in the new spot and earned reinforcement for staying in area and adapting." },
    mixed: { title: "Mixed – Sat, Weak Reinforcement", text: "PJ complied, but reinforcement was unclear, reducing future flexibility." },
    fail: { title: "Fail – Attention Maintained Refusal", text: "Public attention increased refusal and wandering after changes." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 3 — Indoor Recess (High Energy)
 **************************************************/
POOL.wild.push({
  id: "wild_3_indoor_recess_high_energy_pj",
  title: "Wildcard Mission: Indoor Recess",
  start: "step1",
  steps: {

    step1: {
      text: "It is indoor recess. PJ gets excited and starts running and making loud noises to get peers to laugh.",
      choices: {
        A: {
          text: "Pre-correct with a clear boundary: “PJ, choose one game in one area.” Point to sticker chart: “Stay there, earn a sticker.”",
          score: 10,
          feedback: "Great. Clear expectation and earn path during high-energy time.",
          next: "step2A"
        },
        B: {
          text: "Say, “No running,” without giving a replacement option.",
          score: 0,
          feedback: "Neutral. It states a rule but does not give a clear behavior to do.",
          next: "step2B"
        },
        C: {
          text: "Correct him loudly in front of the group.",
          score: -10,
          feedback: "Public attention increases performance behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ chooses a game but keeps making noises and trying to pull peers in.",
      choices: {
        A: {
          text: "Reinforce the area choice: sticker + quiet praise when he stays in the area and uses a calmer voice.",
          score: 10,
          feedback: "Excellent. Reinforces the replacement behavior quickly and quietly.",
          next: "step3A"
        },
        B: {
          text: "Wait until recess ends to reinforce.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement is weaker in this moment.",
          next: "step3B"
        },
        C: {
          text: "Clip him down immediately for the noises.",
          score: -10,
          feedback: "May increase attention bids and reduce motivation to stay in the area.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ laughs and runs again. Another student starts copying him.",
      choices: {
        A: {
          text: "Repair: reset the group with a class point/pom pom goal, then quietly cue PJ: “One area.” Point to sticker chart.",
          score: 10,
          feedback: "Great repair. Addresses group behavior and returns PJ to a clear boundary.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating “no running” louder and louder.",
          score: 0,
          feedback: "Neutral. Repetition can turn into attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Call PJ out as the reason everyone is running.",
          score: -10,
          feedback: "Public blame increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells “NO!” and heads toward the door area to escape the boundary.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop.” Then: “Back to your area.” Signal aide/tech if needed.",
          score: 10,
          feedback: "Excellent. Safety-focused, minimal language, support plan ready.",
          next: "step3A"
        },
        B: {
          text: "Call from across the room repeatedly.",
          score: 0,
          feedback: "Neutral. Distance prompts can become attention and be less effective.",
          next: "step3B"
        },
        C: {
          text: "Chase him while talking loudly.",
          score: -10,
          feedback: "High intensity increases attention and escalates.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in one area and uses a calmer body for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Boundary held. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays near an area but keeps attention bids going with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be immediate and frequent.", next: "step4" } }
    },

    step3C: {
      text: "PJ escalates and peers keep reacting.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining high-energy escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up indoor recess?",
      choices: {
        A: {
          text: "Give a sticker for staying in one area and using a quieter voice. Add a pom pom/class point if indoor recess stayed calm.",
          score: 10,
          feedback: "Perfect. Reinforces PJ and supports class systems.",
          ending: "success"
        },
        B: {
          text: "End recess with no sticker even though he stayed in area.",
          score: 0,
          feedback: "Neutral. Weakens the earn path for this high-energy time.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the earlier running publicly after recess.",
          score: -10,
          feedback: "Public attention can trigger another cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Indoor Recess Managed", text: "PJ stayed in one area and earned reinforcement for calm behavior during a high-energy time." },
    mixed: { title: "Mixed – Managed, Weak Reinforcement", text: "PJ stabilized, but reinforcement was unclear." },
    fail: { title: "Fail – Attention Increased Escalation", text: "Public attention increased peer reinforcement and escalated behavior." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 4 — Surprise Reward Announcement (Over-Excitement)
 **************************************************/
POOL.wild.push({
  id: "wild_4_surprise_reward_overexcitement_pj",
  title: "Wildcard Mission: Surprise Reward Announcement",
  start: "step1",
  steps: {

    step1: {
      text: "You announce a surprise class reward (extra recess or a treat). PJ screams excitedly and jumps up, running around to get attention.",
      choices: {
        A: {
          text: "Pre-correct instantly: “PJ, in your spot.” Point to sticker chart: “Quiet body earns a sticker.”",
          score: 10,
          feedback: "Great. Immediate boundary plus earn path prevents the reward from turning into a performance.",
          next: "step2A"
        },
        B: {
          text: "Say, “Calm down,” without giving a specific action.",
          score: 0,
          feedback: "Neutral. It is a reminder but not a clear next step.",
          next: "step2B"
        },
        C: {
          text: "Correct him loudly in front of everyone.",
          score: -10,
          feedback: "Public attention can increase the excitement behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ returns to his spot but starts making silly noises to keep peers laughing.",
      choices: {
        A: {
          text: "Reinforce the return quickly: sticker + whisper, “Nice quiet body.” Then give the next simple instruction.",
          score: 10,
          feedback: "Excellent. Immediate reinforcement strengthens the return-to-spot routine.",
          next: "step3A"
        },
        B: {
          text: "Wait to reinforce later since the class is excited anyway.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement makes it harder to shape calm responses to rewards.",
          next: "step3B"
        },
        C: {
          text: "Clip him down for noises even though he came back.",
          score: -10,
          feedback: "May reduce motivation to return quickly next time.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ keeps running and another student starts yelling too.",
      choices: {
        A: {
          text: "Repair: do a quick whole-class reset (pom pom/class point goal), then cue PJ quietly: “In your spot.” Point to sticker chart.",
          score: 10,
          feedback: "Great repair. Resets the group and returns PJ to a clear boundary.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating “calm down” louder.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Call PJ out as the reason the class is loud.",
          score: -10,
          feedback: "Public blame increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ yells “NO!” and heads toward the door area to escape the expectation.",
      choices: {
        A: {
          text: "Calm close prompt: “Stop.” Then: “Back to your spot.” Signal aide/tech if needed.",
          score: 10,
          feedback: "Excellent. Safety-focused, minimal language, support plan ready.",
          next: "step3A"
        },
        B: {
          text: "Call from across the room repeatedly.",
          score: 0,
          feedback: "Neutral. Distance prompts can become attention and be less effective.",
          next: "step3B"
        },
        C: {
          text: "Chase and talk loudly.",
          score: -10,
          feedback: "High intensity increases attention and escalates.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ sits in his spot and stays calmer for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Calm behavior is happening. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ sits but keeps small noises going to test for laughs.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be faster.", next: "step4" } }
    },

    step3C: {
      text: "PJ escalates and peers keep reacting.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining the performance behavior.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after the reward announcement?",
      choices: {
        A: {
          text: "Give a sticker for returning to spot and calm body, then continue with the reward instructions.",
          score: 10,
          feedback: "Perfect. Reinforces calm responses and keeps the reward positive.",
          ending: "success"
        },
        B: {
          text: "Move on with no sticker even though he calmed.",
          score: 0,
          feedback: "Neutral. Weakens the earn path for calm behavior.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his behavior publicly after he calms.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Calm Response Reinforced", text: "PJ returned to his spot and earned reinforcement for a calm body after a high-excitement moment." },
    mixed: { title: "Mixed – Calmed, Weak Reinforcement", text: "PJ stabilized, but reinforcement was unclear." },
    fail: { title: "Fail – Reward Turned Into a Stage", text: "Public attention increased the payoff and escalated excitement behavior." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 5 — Substitute Teacher Day (Low Structure)
 **************************************************/
POOL.wild.push({
  id: "wild_5_substitute_day_low_structure_pj",
  title: "Wildcard Mission: Substitute Day",
  start: "step1",
  steps: {

    step1: {
      text: "A substitute is leading the class. PJ senses lower structure and starts wandering and making loud noises to get peers to laugh.",
      choices: {
        A: {
          text: "Pre-correct privately: “PJ, in your area.” Point to sticker chart: “Stay here, earn a sticker.”",
          score: 10,
          feedback: "Great. Preserves expectations and the earn path without spotlighting.",
          next: "step2A"
        },
        B: {
          text: "Tell the sub, “He needs reminders,” in front of PJ.",
          score: 0,
          feedback: "Neutral, but it can increase attention and make behavior more reinforcing.",
          next: "step2B"
        },
        C: {
          text: "Publicly reprimand PJ to show the sub you have control.",
          score: -10,
          feedback: "Public attention increases the audience effect and escalation risk.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "PJ stays in his area briefly, then tests again with a silly noise to get laughs.",
      choices: {
        A: {
          text: "Use warning → clip quietly if needed, then reinforce the moment he stays in area with a sticker.",
          score: 10,
          feedback: "Excellent. Quiet follow-through plus immediate reinforcement for recovery.",
          next: "step3A"
        },
        B: {
          text: "Give repeated warnings and talk more about it.",
          score: 0,
          feedback: "Neutral. Repeated talk can become attention without follow-through.",
          next: "step3B"
        },
        C: {
          text: "Lecture PJ about respecting the substitute.",
          score: -10,
          feedback: "Extended attention can reinforce the performance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "PJ smirks and makes louder noises because adults are talking about him.",
      choices: {
        A: {
          text: "Repair: handle it privately. Cue: “In your area.” Point to sticker chart. Reinforce return with a sticker.",
          score: 10,
          feedback: "Great repair. Removes the stage and returns to the plan.",
          next: "step3A"
        },
        B: {
          text: "Keep discussing PJ with the substitute.",
          score: 0,
          feedback: "Neutral. It keeps attention on PJ.",
          next: "step3B"
        },
        C: {
          text: "Tell the class to ignore PJ and stop laughing.",
          score: -10,
          feedback: "Creates a spotlight moment.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "PJ escalates, runs around, and peers watch closely.",
      choices: {
        A: {
          text: "Repair: reduce the audience, cue PJ with one calm prompt close to him, and signal aide/tech/office chat if needed.",
          score: 10,
          feedback: "Excellent. Safety-focused, minimal language, support plan ready.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating demands loudly until he stops.",
          score: 0,
          feedback: "Neutral. Repetition can add attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue publicly about who is in charge.",
          score: -10,
          feedback: "Power struggle increases attention and escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "PJ stays in his area and uses a calmer body for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Routine restored. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "PJ stays in the room but keeps attention bids going with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. Reinforcement may need to be faster.", next: "step4" } }
    },

    step3C: {
      text: "PJ keeps wandering and peers keep reacting.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is maintaining behavior.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up substitute-day support?",
      choices: {
        A: {
          text: "Reinforce recovery: sticker for staying in area and quiet praise. Give the substitute a one-line note about the sticker earn path.",
          score: 10,
          feedback: "Perfect. Reinforces the routine and supports consistency with a sub.",
          ending: "success"
        },
        B: {
          text: "Let him settle without reinforcement because it is a sub day.",
          score: 0,
          feedback: "Neutral. Weakens the routine when structure is already low.",
          ending: "mixed"
        },
        C: {
          text: "Bring up PJ’s behavior publicly to the substitute and class.",
          score: -10,
          feedback: "Public attention increases the payoff and future escalation risk.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Substitute Day Routine Held", text: "PJ stayed in area and earned reinforcement, supporting consistency even with lower structure." },
    mixed: { title: "Mixed – Managed, Weak Reinforcement", text: "PJ stabilized, but reinforcement was unclear, reducing future success on sub days." },
    fail: { title: "Fail – Audience Fueled Behavior", text: "Public attention increased peer reinforcement and wandering/noises." }
  }
});

/* ============================================================
   DYNAMIC MISSION BUILDER — ADAPTED FOR BRANCHING
   ============================================================ */
function pickScenario(pool, rnd) {
  return sample(pool, 1, rnd)[0];
}

function renderIntroCards() {
  if (storyText) storyText.style.display = 'block';

  const oldSummary = document.getElementById('summary-panel');
  if (oldSummary) oldSummary.remove();

  if (scenarioTitle) scenarioTitle.textContent = "Behavior Intervention Simulator";

  if (storyText) {
    storyText.innerHTML = `Welcome to Mission: Reinforceable.
You’ll step through short scenarios based on your student's Behavior Plan.

<strong>Choose your mission below.</strong>`;
  }

  const menu = document.createElement('div');
  menu.className = 'mission-grid';
  menu.innerHTML = `
    <div class="mission-card">
      <h3>Daily Mission</h3>
      <div class="action"><button id="btn-drill">Start Behavior Skill Practice ▶</button></div>
    </div>
    <div class="mission-card">
      <h3>Red Alert</h3>
      <div class="action"><button id="btn-crisis">Start Crisis Drill ▶</button></div>
    </div>
    <div class="mission-card">
      <h3>Wildcard</h3>
      <div class="action"><button id="btn-random">Start Mystery Mission ▶</button></div>
    </div>
  `;

  const container = document.createElement('div');
  container.className = 'mission-intro';
  container.appendChild(menu);

  if (choicesDiv) {
    choicesDiv.innerHTML = '';
    choicesDiv.appendChild(container);
  }

  showFeedback("The Wizard will chime in after every move.", "correct", 10);

  const rnd = srandom(seedFromDate());

  const drillBtn  = document.getElementById('btn-drill');
  const crisisBtn = document.getElementById('btn-crisis');
  const randomBtn = document.getElementById('btn-random');

  if (drillBtn) {
    drillBtn.onclick = () => {
      resetGame();
      currentMode = "Daily";
      startDynamicMission('Daily Drill', pickScenario(POOL.daily, rnd));
    };
  }

  if (crisisBtn) {
    crisisBtn.onclick = () => {
      resetGame();
      currentMode = "Crisis";
      startDynamicMission('Emergency Sim', pickScenario(POOL.crisis, rnd));
    };
  }

  if (randomBtn) {
    randomBtn.onclick = () => {
      resetGame();
      currentMode = "Wildcard";
      startDynamicMission('Shuffle Quest', pickScenario(POOL.wild, rnd));
    };
  }
}


function pickScenario(pool, rnd) {
  return sample(pool, 1, rnd)[0];
}

let DYN = { nodes: [], ids: [] };
let NEXT_ID = 1000;
function newId(){ return NEXT_ID++; }

function startDynamicMission(modeLabel, scn) {
  if (!scn) return;
  currentScenario = scn; // ← RIGHT HERE
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
      options: [{ text: "Play again", nextId: 'home' }]
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
    options: [{ text: "Play again", nextId: 'home' }] }
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

// PJ (Kinder) — wandering/elopement + silly noises (attention) with sticker chart (10 stickers = positive call home)
// also: pom pom jar / classroom points, and support plan (aide/tech/office chat)

if (pct >= 80) {
  actionSteps = `
    <ul>
      <li>Keep front-loading supports before known triggers (afternoon rotations, after recess/choice time, snack, carpet transitions, and any “less structured” time).</li>
      <li>Stay consistent with short, neutral one-step directions paired with the visual: “In your area/seat/spot.” Point to the sticker chart and name the earn path: “Stay here, earn a sticker.”</li>
      <li>Reinforce fast and quietly the moment he returns to the area (sticker + whisper praise). Do not wait for “perfect,” especially in Kinder.</li>
      <li>When peers start reacting, reduce the audience first (redirect peers back to work, keep instruction moving) and handle PJ privately with the same one-step prompt.</li>
      <li>Use the class systems as bonus support: add a pom pom/class point for smooth transitions and calm routines while keeping PJ’s reinforcement individualized.</li>
      <li>When early signs show up (wandering, loud noises, drifting toward the door), your quick proximity prompt + sticker earn path is working. Keep that timing.</li>
    </ul>`;
}
else if (pct >= 50) {
  actionSteps = `
    <ul>
      <li>Add pre-corrections earlier, especially right before transitions (carpet, rotations, lining up) and right after high-energy times (recess, indoor recess).</li>
      <li>Prompt the replacement behavior sooner: “In your area/seat/spot” plus pointing to the sticker chart. Then immediately cue the first tiny step of the task so he has something to do.</li>
      <li>Shorten your language to one clear step at a time and avoid repeated reminders from across the room. Move in close, prompt once, then reinforce the moment he returns.</li>
      <li>If attention-seeking starts (silly noises, running for laughs), reduce the audience first instead of explaining. Redirect peers and keep the routine moving.</li>
      <li>Use your error correction consistently: warning → clip down quietly if it repeats, then reinforce recovery right away with a sticker when he is back in the area.</li>
      <li>If he drifts toward the door or you cannot respond fully, activate support early (aide/tech/office chat) while keeping your prompts minimal and calm.</li>
    </ul>`;
}
else {
  actionSteps = `
    <ul>
      <li>Rebuild the proactive setup: clearly define PJ’s area/seat/spot, keep the sticker chart visible, and make the earn path explicit and frequent (10 stickers = positive call home).</li>
      <li>Practice the routine outside tough moments: “In your area” → point to chart → immediate sticker for returning. Repeat as a quick rehearsal so it is automatic during escalation.</li>
      <li>During escalation, use minimal language and predictable steps only. Avoid public correction, long explanations, or power struggles that create a stage.</li>
      <li>Use the support plan early when safety risk rises (door/bolting): signal aide/tech or use office chat. Prioritize line-of-sight and calm proximity prompts.</li>
      <li>Once calm and back in area, reinforce recovery immediately with a sticker and reset into a simple first task step. Keep any debrief private and short.</li>
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

/* -------- INIT: DOM Ready -------- */
document.addEventListener('DOMContentLoaded', () => {
  console.log("GAME INIT — DOM READY");

  // Home button
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      resetGame();
      renderIntroCards();
    });
  }

  // Start fresh
  setTeacherBadge(getTeacherCode());
  resetGame();
  renderIntroCards();

  // Initial feedback
  showFeedback("The Wizard will chime in after every move.", "correct", +10);
});
