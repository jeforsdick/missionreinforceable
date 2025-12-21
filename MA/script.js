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

  if (pct >= 80) {
    return "High fidelity. You stayed calm and brief, redirected without spotlighting, and reinforced the right behaviors quickly (Chart Moves). KeKu got a clear path back to success.";
  }
  if (pct >= 50) {
    return "Getting there. Try fewer words + faster reinforcement. Prompt the replacement behavior right away, keep directions to one step, and use Chart Moves the moment you see safe hands/calm body/task start.";
  }
  return "Not aligned yet. Reset your approach: one-step directive, prompt the replacement behavior, reinforce immediately (Chart Moves), and avoid public corrections or debates. If escalation builds, move straight to the reset/safety steps.";
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
const RESULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbw2X2PPiEDZ7vJhOEBqW1KLFqKAj2x6Pn-DQI6UHBVJDCwRa9ogy9q-mZ0cmSvT6qit/exec";

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

  // === GET STUDENT FROM URL (e.g. ?student=KK) ===
  const url = new URL(window.location.href);
  const student = url.searchParams.get("student") || "KK";

  const payload = {
    teacher_code: getTeacherCode(),
    session_id: SESSION_ID,
    points,
    max_possible: maxPossible,
    percent: percentScore(),
    timestamp: new Date().toISOString(),
    log: events,
    mode: mode, // NEW: Daily / Crisis / Wildcard
    student: student // NEW: KK, Sarah, etc.
  };

  try {
    fetch(RESULT_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" }, // important for GAS
  body: JSON.stringify(payload)
})
.then(() => console.log("Results sent"))
.catch(err => console.error("Send failed:", err));
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
 * DAILY SCENARIO 1 — Whole-Group Instruction (Calling Out)
 **************************************************/
/*************************************************
 * DAILY SCENARIO 1 — Whole-Group Rug Time (Escape + Disruption)
 **************************************************/
POOL.daily.push({
  id: "daily_1_rug_time_task_start",
  title: "Daily Mission: Rug Time Start-Up",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During whole-group instruction on the rug, KeKu starts sliding backward and lightly pokes the student next to him (KYHFOOTY risk). When you begin the directions, he says, “I’m not doing this,” and looks for reactions.",
      choices: {
        A: {
          text: `Avoid “no” + give 2 choices: “Sit on your spot on the rug or sit in your chair spot.”`,
          score: 10,
          feedback: "Great fidelity. You avoided a power struggle and used a safe two-choice prompt.",
          next: "step2A"
        },
        B: {
          text: "Say, “Come on, be good and listen.”",
          score: 0,
          feedback: "Neutral. It’s a prompt, but not specific and may increase negotiation.",
          next: "step2B"
        },
        C: {
          text: "Say, “No. Stop it right now,” in front of the group.",
          score: -10,
          feedback: "Public correction + ‘no’ can escalate and pull peer attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "KeKu hesitates, then moves toward the chair spot and quiets his hands.",
      choices: {
        A: {
          text: `Give an incompatible direction + quick start: “Put both hands on your knees and point to the first picture.”`,
          score: 10,
          feedback: "Excellent. Clear action that competes with KYHFOOTY and gets him started.",
          next: "step3A"
        },
        B: {
          text: "Let it go and continue teaching without checking in.",
          score: 0,
          feedback: "Neutral. Might work, but you missed a chance to lock in the routine.",
          next: "step3B"
        },
        C: {
          text: "Remind him about consequences if he pokes again.",
          score: -10,
          feedback: "Threat talk often increases escape/attention cycles.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "KeKu smirks and lightly bumps the peer again while watching you.",
      choices: {
        A: {
          text: `Precision request for incompatible behavior: “Scoot to your chair spot and put your hands on your lap.”`,
          score: 10,
          feedback: "Great. Specific, fast, and incompatible with poking.",
          next: "step3A"
        },
        B: {
          text: "Give him ‘the look’ and keep talking.",
          score: 0,
          feedback: "Neutral. Nonverbal cues can help, but may not interrupt the pattern.",
          next: "step3B"
        },
        C: {
          text: "Call him out to the group: “KeKu is not following directions.”",
          score: -10,
          feedback: "This gives peer attention and can escalate refusal.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "KeKu kicks the rug edge and says loudly, “This is boring!” A few kids look over.",
      choices: {
        A: {
          text: `Repair with calm choices: “Chair spot or end-of-row rug spot—then we start.”`,
          score: 10,
          feedback: "Nice repair. You re-established structure without arguing.",
          next: "step3A"
        },
        B: {
          text: "Tell him to calm down.",
          score: 0,
          feedback: "Neutral, but not a clear action to follow.",
          next: "step3B"
        },
        C: {
          text: "Lecture about respect and listening.",
          score: -10,
          feedback: "Long attention moment can reinforce the behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "KeKu is in his assigned spot and starts the first direction.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Great start—mark a Chart Move for joining and following the direction.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "KeKu is quieter but still wiggly and scanning peers.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stable but not fully engaged yet.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "KeKu shifts back toward peers and reaches toward another student’s materials (Property Misuse risk).",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Risk is increasing—redirect quickly with an incompatible direction.", next: "step4" }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you finalize support in this moment?",
      choices: {
        A: {
          text: "Brief praise + mark a Chart Move, then give the next clear direction.",
          score: 10,
          feedback: "Perfect: reinforcement stays private and the lesson keeps moving.",
          ending: "success"
        },
        B: {
          text: "Move on without marking anything.",
          score: 0,
          feedback: "Okay, but missed a key reinforcement moment.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier behavior in front of peers.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Routine + Compliance Strengthened",
      text: "KeKu started whole-group successfully using choices, incompatible directions, and reinforcement through Chart Moves."
    },
    mixed: {
      title: "Mixed Outcome – Stable but Under-Reinforced",
      text: "KeKu complied, but the team missed a chance to strengthen the routine with a Chart Move."
    },
    fail: {
      title: "Escalation – Peer Attention Maintained",
      text: "Public attention and unclear structure increased the chance of KYHFOOTY/property issues continuing."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 2 — Independent Work Start
 **************************************************/
POOL.daily.push({
  id: "daily_2_independent_work_start",
  title: "Daily Mission: Independent Work Start",
  start: "step1",
  steps: {

    step1: {
      text: "Independent work begins. KeKu looks at the worksheet, sighs loudly, and starts folding the corner of the paper while watching nearby peers (Property Misuse risk).",
      choices: {
        A: {
          text: "Offer two choices tied to starting: “Would you like to start with the top problem or the bottom problem?”",
          score: 10,
          feedback: "Great. Choices reduce escape behavior and get him started without pressure.",
          next: "step2A"
        },
        B: {
          text: "Say, “Let’s get started, buddy.”",
          score: 0,
          feedback: "Neutral encouragement, but not specific enough to reduce avoidance.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop messing with your paper and do your work.”",
          score: -10,
          feedback: "Public correction + ‘stop’ language may escalate escape behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu pauses, then flattens the paper and looks at the bottom problem.",
      choices: {
        A: {
          text: "Say: “Write your name and circle the first problem.”",
          score: 10,
          feedback: "Excellent. Clear action that competes with property misuse.",
          next: "step3A"
        },
        B: {
          text: "Walk away to give him space.",
          score: 0,
          feedback: "Neutral. May work, but misses a chance to lock in momentum.",
          next: "step3B"
        },
        C: {
          text: "Warn him not to crumple the paper.",
          score: -10,
          feedback: "Threat-based reminders can increase avoidance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu slowly slides the paper away and taps his pencil loudly.",
      choices: {
        A: {
          text: "Precision request: “Slide the paper back and put your pencil on number one.”",
          score: 10,
          feedback: "Specific and fast — reduces avoidance.",
          next: "step3A"
        },
        B: {
          text: "Give a quiet look and wait.",
          score: 0,
          feedback: "Neutral, but may allow avoidance to continue.",
          next: "step3B"
        },
        C: {
          text: "Tell him you’ll take the paper if he keeps touching it.",
          score: -10,
          feedback: "Escalates control struggles and escape behavior.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "KeKu smirks and begins tearing the paper edge while glancing at peers.",
      choices: {
        A: {
          text: "Repair calmly: “New paper or write on the whiteboard — you choose.”",
          score: 10,
          feedback: "Nice repair using choice instead of confrontation.",
          next: "step3A"
        },
        B: {
          text: "Tell him he’s wasting time.",
          score: 0,
          feedback: "Neutral but attention-heavy.",
          next: "step3B"
        },
        C: {
          text: "Lecture about respecting materials.",
          score: -10,
          feedback: "Long attention moment reinforces escape.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu begins writing and keeps his hands to himself.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Good task engagement.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu sits quietly but does not start yet.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stable, but momentum is weak.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu drops the paper and looks toward peers for reactions.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Avoidance + attention cycle active.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce this moment?",
      choices: {
        A: {
          text: "Brief praise and mark a Chart Move for starting work.",
          score: 10,
          feedback: "Perfect reinforcement for task initiation.",
          ending: "success"
        },
        B: {
          text: "Move on without feedback.",
          score: 0,
          feedback: "Missed reinforcement opportunity.",
          ending: "mixed"
        },
        C: {
          text: "Mention earlier behavior in front of peers.",
          score: -10,
          feedback: "Public attention risks re-escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Work Started",
      text: "KeKu initiated independent work using structured choices and clear directions."
    },
    mixed: {
      title: "Mixed – Partial Engagement",
      text: "KeKu stayed regulated but did not fully engage with the task."
    },
    fail: {
      title: "Fail – Avoidance Maintained",
      text: "Escape and attention behaviors reduced work engagement."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 3 — Transition to Partner Work
 **************************************************/
POOL.daily.push({
  id: "daily_3_partner_transition",
  title: "Daily Mission: Partner Work Transition",
  start: "step1",
  steps: {

    step1: {
      text: "You announce a transition from independent work to partner work. KeKu immediately says loudly, “I don’t want a partner!” and looks around for reactions.",
      choices: {
        A: {
          text: "Pre-correct with choice: “Would you like to be partner A or partner B?”",
          score: 10,
          feedback: "Great — gives control within the routine.",
          next: "step2A"
        },
        B: {
          text: "Say, “Everyone needs a partner.”",
          score: 0,
          feedback: "Neutral, but may invite negotiation.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop complaining and pick a partner.”",
          score: -10,
          feedback: "Public correction increases attention-seeking.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu hesitates, then points to partner B.",
      choices: {
        A: {
          text: "Say: “Sit next to partner B and open to page one.”",
          score: 10,
          feedback: "Excellent — clear and task-focused.",
          next: "step3A"
        },
        B: {
          text: "Let him move on his own.",
          score: 0,
          feedback: "Neutral; may slow the transition.",
          next: "step3B"
        },
        C: {
          text: "Remind him to use a nicer tone.",
          score: -10,
          feedback: "Tone policing adds attention without progress.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu sighs dramatically and mutters, “This is dumb.”",
      choices: {
        A: {
          text: "Precision request: “Stand up and walk to your partner.”",
          score: 10,
          feedback: "Direct and clear — reduces delay.",
          next: "step3A"
        },
        B: {
          text: "Ignore and continue instructions.",
          score: 0,
          feedback: "Neutral but may leave him stuck.",
          next: "step3B"
        },
        C: {
          text: "Respond with, “That’s not appropriate.”",
          score: -10,
          feedback: "Verbal attention may escalate.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "KeKu repeats loudly, “I SAID I don’t want a partner!” Peers stare.",
      choices: {
        A: {
          text: "Repair calmly: “Sit with me first, then join your partner.”",
          score: 10,
          feedback: "Nice repair — reduces pressure and attention.",
          next: "step3A"
        },
        B: {
          text: "Tell him he’s holding everyone up.",
          score: 0,
          feedback: "Peer pressure increases escalation risk.",
          next: "step3B"
        },
        C: {
          text: "Lecture about cooperation.",
          score: -10,
          feedback: "Long attention moment fuels the behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu sits with his partner and opens the materials.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Successful transition.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu stands near his partner but doesn’t start yet.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Transition incomplete.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu turns away from the partner and scans the room.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Attention cycle persists.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce the transition?",
      choices: {
        A: {
          text: "Quiet praise and mark a Chart Move for joining partner work.",
          score: 10,
          feedback: "Strong reinforcement for flexibility.",
          ending: "success"
        },
        B: {
          text: "Move on without feedback.",
          score: 0,
          feedback: "Routine not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his refusal in front of peers.",
          score: -10,
          feedback: "Public attention undermines transition success.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Partner Transition Completed",
      text: "KeKu transitioned to partner work using choices and clear structure."
    },
    mixed: {
      title: "Mixed – Partial Transition",
      text: "KeKu transitioned but without reinforcement for flexibility."
    },
    fail: {
      title: "Fail – Transition Escalation",
      text: "Peer attention reinforced refusal behaviors."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 4 — Return From Specials
 **************************************************/
POOL.daily.push({
  id: "daily_4_return_from_specials",
  title: "Daily Mission: Return From Specials",
  start: "step1",
  steps: {

    step1: {
      text: "The class returns from PE. KeKu is energized and begins wandering past his desk, bumping into chairs and drifting toward the door (Unexpected Location risk).",
      choices: {
        A: {
          text: "Pre-correct with choice: “Desk spot or end-of-row seat — you choose.”",
          score: 10,
          feedback: "Great — proactive structure reduces wandering.",
          next: "step2A"
        },
        B: {
          text: "Say, “Everyone find your seat.”",
          score: 0,
          feedback: "Neutral, but not specific enough for him.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “KeKu, get back to your seat!”",
          score: -10,
          feedback: "Public call-out may escalate movement.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu walks toward the end-of-row seat and pauses.",
      choices: {
        A: {
          text: "Say: “Sit down and put your feet flat on the floor.”",
          score: 10,
          feedback: "Clear physical direction competing with elopement.",
          next: "step3A"
        },
        B: {
          text: "Wait quietly.",
          score: 0,
          feedback: "Neutral — may work but less support.",
          next: "step3B"
        },
        C: {
          text: "Remind him about expectations after PE.",
          score: -10,
          feedback: "Extra verbal attention may escalate.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu circles his desk and taps another student’s chair.",
      choices: {
        A: {
          text: "Precision request: “Sit in your seat and hands on desk.”",
          score: 10,
          feedback: "Direct and grounding.",
          next: "step3A"
        },
        B: {
          text: "Give a nonverbal signal.",
          score: 0,
          feedback: "Neutral; may not interrupt movement.",
          next: "step3B"
        },
        C: {
          text: "Tell him he’s being unsafe.",
          score: -10,
          feedback: "Vague correction increases attention.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "KeKu laughs and moves faster between desks.",
      choices: {
        A: {
          text: "Repair calmly: “Walk with me to your seat.”",
          score: 10,
          feedback: "Nice repair — removes audience and anchors movement.",
          next: "step3A"
        },
        B: {
          text: "Repeat the directive louder.",
          score: 0,
          feedback: "Neutral but risky.",
          next: "step3B"
        },
        C: {
          text: "Lecture about safety in front of the class.",
          score: -10,
          feedback: "Public attention fuels the behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu sits down and stays in his seat.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Successful re-entry.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu sits but swivels and scans peers.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partially regulated.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu stands again and looks toward the hallway.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Elopement risk remains.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce the return from specials?",
      choices: {
        A: {
          text: "Quiet praise and mark a Chart Move for sitting safely.",
          score: 10,
          feedback: "Reinforces regulation and safety.",
          ending: "success"
        },
        B: {
          text: "Start the lesson without feedback.",
          score: 0,
          feedback: "Routine not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Mention his movement issues to the class.",
          score: -10,
          feedback: "Public attention increases future risk.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Calm Re-Entry",
      text: "KeKu returned from specials safely with structured support."
    },
    mixed: {
      title: "Mixed – Partial Regulation",
      text: "KeKu re-entered but without reinforcement for safety."
    },
    fail: {
      title: "Fail – Movement Escalation",
      text: "Attention and unclear structure increased elopement risk."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 5 — Writing Task
 **************************************************/
POOL.daily.push({
  id: "daily_5_writing_task",
  title: "Daily Mission: Writing Task",
  start: "step1",
  steps: {

    step1: {
      text: "KeKu is given a writing prompt. He sighs loudly, pushes the paper slightly away, and says, “This is too hard,” while glancing at nearby peers.",
      choices: {
        A: {
          text: "Chunk the task with choice: “Would you like to write one sentence or draw the first picture?”",
          score: 10,
          feedback: "Great. Reduces escape and gives a supported entry point.",
          next: "step2A"
        },
        B: {
          text: "Say, “Just try your best.”",
          score: 0,
          feedback: "Neutral encouragement but not specific enough.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop complaining and start writing.”",
          score: -10,
          feedback: "Public correction increases escape and attention-seeking.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu pulls the paper back toward him but keeps watching peers.",
      choices: {
        A: {
          text: "Say: “Write your name and underline it.”",
          score: 10,
          feedback: "Excellent — clear motor action that starts the task.",
          next: "step3A"
        },
        B: {
          text: "Give him space and walk away.",
          score: 0,
          feedback: "Neutral; momentum may stall.",
          next: "step3B"
        },
        C: {
          text: "Remind him the assignment is graded.",
          score: -10,
          feedback: "Pressure-based attention may escalate avoidance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu taps his pencil and mutters, “I hate writing.”",
      choices: {
        A: {
          text: "Precision request: “Circle the first line and start there.”",
          score: 10,
          feedback: "Specific and task-focused.",
          next: "step3A"
        },
        B: {
          text: "Ignore the comment and continue teaching.",
          score: 0,
          feedback: "Neutral but may allow avoidance to continue.",
          next: "step3B"
        },
        C: {
          text: "Tell him that attitude is not acceptable.",
          score: -10,
          feedback: "Verbal attention increases disruption.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "KeKu says louder, “I’m NOT doing this,” and looks for peer reactions.",
      choices: {
        A: {
          text: "Repair calmly: “Sentence or picture first — you choose.”",
          score: 10,
          feedback: "Nice repair using choice instead of control.",
          next: "step3A"
        },
        B: {
          text: "Tell him to lower his voice.",
          score: 0,
          feedback: "Neutral but not task-oriented.",
          next: "step3B"
        },
        C: {
          text: "Lecture about effort and responsibility.",
          score: -10,
          feedback: "Long attention moment reinforces escape.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu begins writing or drawing quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Task initiation achieved.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu sits quietly but does not start yet.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Regulated but not engaged.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu pushes the paper farther away and looks toward peers.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Escape + attention cycle active.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce this moment?",
      choices: {
        A: {
          text: "Quiet praise and mark a Chart Move for starting writing.",
          score: 10,
          feedback: "Strong reinforcement for effort and engagement.",
          ending: "success"
        },
        B: {
          text: "Move on without feedback.",
          score: 0,
          feedback: "Missed opportunity to strengthen the routine.",
          ending: "mixed"
        },
        C: {
          text: "Bring up earlier refusal publicly.",
          score: -10,
          feedback: "Public attention risks re-escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Writing Started",
      text: "KeKu engaged in writing using structured choices and clear directions."
    },
    mixed: {
      title: "Mixed – Partial Engagement",
      text: "KeKu stayed regulated but did not fully engage with the task."
    },
    fail: {
      title: "Fail – Writing Avoidance",
      text: "Escape-maintained behavior reduced writing engagement."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 6 — Math Block
 **************************************************/
POOL.daily.push({
  id: "daily_6_math_block",
  title: "Daily Mission: Math Block",
  start: "step1",
  steps: {

    step1: {
      text: "As you explain a math problem, KeKu blurts out, “This is easy!” and looks around to see who noticed.",
      choices: {
        A: {
          text: "Use neutral ignoring, then prompt: “Hand up if you want to share.”",
          score: 10,
          feedback: "Great. No attention to the call-out, clear replacement cue.",
          next: "step2A"
        },
        B: {
          text: "Say, “Wait your turn.”",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop interrupting.”",
          score: -10,
          feedback: "Public correction fuels attention-seeking.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu quiets and raises his hand, watching you closely.",
      choices: {
        A: {
          text: "Acknowledge briefly: “Thanks — I’ll call on you soon.”",
          score: 10,
          feedback: "Reinforces the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Ignore the raised hand and continue.",
          score: 0,
          feedback: "Neutral but missed reinforcement.",
          next: "step3B"
        },
        C: {
          text: "Tell him to keep his hand down.",
          score: -10,
          feedback: "Punishes appropriate behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu whispers, “I already know it,” to a nearby peer.",
      choices: {
        A: {
          text: "Point silently to the raised-hand expectation.",
          score: 10,
          feedback: "Nonverbal cue keeps attention low.",
          next: "step3A"
        },
        B: {
          text: "Give him a look to stop.",
          score: 0,
          feedback: "Neutral attention.",
          next: "step3B"
        },
        C: {
          text: "Address the class about blurting.",
          score: -10,
          feedback: "Turns behavior into a spotlight.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "Peers laugh softly. KeKu grins.",
      choices: {
        A: {
          text: "Repair quietly: “Reset — hand up if you want to share.”",
          score: 10,
          feedback: "Nice repair without feeding attention.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture about classroom rules.",
          score: -10,
          feedback: "Long attention moment reinforces behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu waits quietly with his hand raised.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Strong self-regulation.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu quiets but watches peers closely.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Regulated but attention-seeking lingers.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu blurts again, louder than before.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Attention cycle continues.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce math participation?",
      choices: {
        A: {
          text: "Call on him appropriately and mark a Chart Move for hand-raising.",
          score: 10,
          feedback: "Perfect reinforcement of replacement behavior.",
          ending: "success"
        },
        B: {
          text: "Call on him without praise.",
          score: 0,
          feedback: "Partial reinforcement.",
          ending: "mixed"
        },
        C: {
          text: "Skip him because of earlier call-outs.",
          score: -10,
          feedback: "Punishes appropriate behavior.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Hand-Raising Reinforced",
      text: "KeKu earned attention by using the correct participation routine."
    },
    mixed: {
      title: "Mixed – Inconsistent Reinforcement",
      text: "KeKu participated but without clear reinforcement."
    },
    fail: {
      title: "Fail – Call-Out Cycle Continues",
      text: "Attention-seeking through blurting was reinforced."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 7 — Morning Entry
 **************************************************/
POOL.daily.push({
  id: "daily_7_morning_entry",
  title: "Daily Mission: Morning Entry",
  start: "step1",
  steps: {

    step1: {
      text: "KeKu enters the classroom with high energy, weaving between desks and calling out to peers instead of going to his seat (Unexpected Location risk).",
      choices: {
        A: {
          text: "Greet briefly and offer choice: “Backpack hook or desk first?”",
          score: 10,
          feedback: "Great proactive structure for a high-energy moment.",
          next: "step2A"
        },
        B: {
          text: "Say, “Good morning — go sit down.”",
          score: 0,
          feedback: "Neutral but not grounding enough.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “KeKu, stop running around.”",
          score: -10,
          feedback: "Public attention may escalate movement.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu heads to the backpack hook and slows slightly.",
      choices: {
        A: {
          text: "Say: “Hang it up and walk to your seat.”",
          score: 10,
          feedback: "Clear physical direction supports regulation.",
          next: "step3A"
        },
        B: {
          text: "Let him move independently.",
          score: 0,
          feedback: "Neutral; may drift again.",
          next: "step3B"
        },
        C: {
          text: "Remind him of morning expectations verbally.",
          score: -10,
          feedback: "Extra verbal attention can escalate.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu stops briefly, then veers toward another student’s desk.",
      choices: {
        A: {
          text: "Precision request: “Walk to your seat and sit down.”",
          score: 10,
          feedback: "Direct and grounding.",
          next: "step3A"
        },
        B: {
          text: "Give a nonverbal cue.",
          score: 0,
          feedback: "Neutral but may not interrupt movement.",
          next: "step3B"
        },
        C: {
          text: "Say, “You’re not making a good choice.”",
          score: -10,
          feedback: "Vague correction adds attention.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "KeKu laughs and speeds up as peers watch.",
      choices: {
        A: {
          text: "Repair calmly: “Walk with me to your seat.”",
          score: 10,
          feedback: "Removes audience and anchors movement.",
          next: "step3A"
        },
        B: {
          text: "Repeat the directive louder.",
          score: 0,
          feedback: "Neutral but risky.",
          next: "step3B"
        },
        C: {
          text: "Address the class about expectations.",
          score: -10,
          feedback: "Creates a peer audience.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu sits at his desk and stays seated.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Morning routine established.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu sits but fidgets and looks around.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partially regulated.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu stands again and moves toward peers.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Movement risk persists.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce morning entry?",
      choices: {
        A: {
          text: "Quiet praise and mark a Chart Move for entering safely.",
          score: 10,
          feedback: "Reinforces a strong start to the day.",
          ending: "success"
        },
        B: {
          text: "Begin morning work without feedback.",
          score: 0,
          feedback: "Routine not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Mention earlier behavior publicly.",
          score: -10,
          feedback: "Public attention undermines regulation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Calm Morning Entry",
      text: "KeKu entered the classroom safely with structured support."
    },
    mixed: {
      title: "Mixed – Partial Regulation",
      text: "KeKu entered the room but needed more reinforcement."
    },
    fail: {
      title: "Fail – Morning Escalation",
      text: "Attention and unclear structure increased movement behavior."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 8 — Whole-Class Discussion
 **************************************************/
POOL.daily.push({
  id: "daily_8_whole_class_discussion",
  title: "Daily Mission: Whole-Class Discussion",
  start: "step1",
  steps: {

    step1: {
      text: "During a whole-class discussion, you ask a question. Several students raise their hands. KeKu blurts out the answer loudly and looks around to see who noticed.",
      choices: {
        A: {
          text: "Use neutral ignoring, then prompt quietly: “Hand up if you want to share.”",
          score: 10,
          feedback: "Great. No reinforcement for blurting, clear replacement cue.",
          next: "step2A"
        },
        B: {
          text: "Say, “Wait your turn.”",
          score: 0,
          feedback: "Neutral but still provides attention for the call-out.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop interrupting!”",
          score: -10,
          feedback: "Public attention can increase future blurting.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu quiets and raises his hand, watching you closely.",
      choices: {
        A: {
          text: "Acknowledge briefly: “Thanks — I’ll call on you soon.”",
          score: 10,
          feedback: "Reinforces the replacement behavior immediately.",
          next: "step3A"
        },
        B: {
          text: "Continue the discussion without acknowledging him.",
          score: 0,
          feedback: "Neutral, but missed reinforcement for hand-raising.",
          next: "step3B"
        },
        C: {
          text: "Tell him to put his hand down because he blurted earlier.",
          score: -10,
          feedback: "Punishes appropriate behavior and can increase future blurting.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu mutters, “I knew it already,” and leans toward a peer.",
      choices: {
        A: {
          text: "Nonverbal cue: gesture to the raised-hand expectation (model hand up).",
          score: 10,
          feedback: "Nice low-attention cue back to the routine.",
          next: "step3A"
        },
        B: {
          text: "Give a brief “shh” gesture.",
          score: 0,
          feedback: "Neutral; still attention.",
          next: "step3B"
        },
        C: {
          text: "Address the class about blurting and respect.",
          score: -10,
          feedback: "Creates a spotlight moment.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "A few students giggle. KeKu smirks and repeats the answer louder.",
      choices: {
        A: {
          text: "Repair quietly: “Reset — hand up if you want to share.”",
          score: 10,
          feedback: "Good repair; reduces peer audience and re-teaches the routine.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look.",
          score: 0,
          feedback: "Neutral attention; may not change behavior.",
          next: "step3B"
        },
        C: {
          text: "Lecture about expectations in front of the class.",
          score: -10,
          feedback: "Long attention moment reinforces attention-seeking.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu holds his hand up and stays quiet.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Strong replacement behavior.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu quiets but continues scanning peers for reactions.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Regulated but attention-seeking lingers.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu calls out again and begins talking over others.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Blurting cycle continues with attention payoff.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce appropriate participation?",
      choices: {
        A: {
          text: "Call on him soon and mark a Chart Move for hand-raising/quiet voice.",
          score: 10,
          feedback: "Perfect reinforcement of the replacement behavior.",
          ending: "success"
        },
        B: {
          text: "Call on him without praise or Chart Move.",
          score: 0,
          feedback: "Partial reinforcement; less likely to stick.",
          ending: "mixed"
        },
        C: {
          text: "Skip him because of earlier blurting.",
          score: -10,
          feedback: "Punishes appropriate participation and increases blurting next time.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Participation Routine Strengthened",
      text: "KeKu earned attention by raising his hand and using a quiet voice."
    },
    mixed: {
      title: "Mixed – Participation Happened Without Reinforcement",
      text: "KeKu participated, but reinforcement was not clearly tied to replacement behavior."
    },
    fail: {
      title: "Fail – Blurting Maintained",
      text: "Public attention and inconsistent reinforcement increased blurting behavior."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 9 — Help-Seeking During Work Time
 **************************************************/
POOL.daily.push({
  id: "daily_9_help_seeking_work_time",
  title: "Daily Mission: Help-Seeking During Work Time",
  start: "step1",
  steps: {

    step1: {
      text: "During independent work, KeKu gets stuck. Instead of using the expected help routine, he calls out loudly across the room, “I DON’T GET THIS!” and looks around for reactions.",
      choices: {
        A: {
          text: "Prompt the replacement: “Use your help signal / help card.” (quietly, from close by).",
          score: 10,
          feedback: "Great. Teaches the replacement behavior with minimal attention.",
          next: "step2A"
        },
        B: {
          text: "Say, “Just keep trying.”",
          score: 0,
          feedback: "Neutral but doesn’t teach what to do instead.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop yelling and figure it out.”",
          score: -10,
          feedback: "Public correction increases frustration and attention-seeking.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu hesitates, then uses the help signal / help card (or raises his hand quietly).",
      choices: {
        A: {
          text: "Acknowledge quietly: “Thanks — I’ll be right there.”",
          score: 10,
          feedback: "Excellent. Reinforces the exact replacement routine.",
          next: "step3A"
        },
        B: {
          text: "Give a thumbs up but continue helping another student without acknowledgement.",
          score: 0,
          feedback: "Neutral; may not reinforce the routine enough.",
          next: "step3B"
        },
        C: {
          text: "Tell him he should know this already.",
          score: -10,
          feedback: "Critical attention undermines help-seeking and may escalate refusal.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu taps his pencil loudly and says, “This is stupid,” while glancing at peers.",
      choices: {
        A: {
          text: "Precision direction: “Circle the part you don’t understand and use your help signal.”",
          score: 10,
          feedback: "Strong — gives a concrete action and reinforces the help routine.",
          next: "step3A"
        },
        B: {
          text: "Ignore and continue teaching.",
          score: 0,
          feedback: "Neutral; could de-escalate or could allow disruption to grow.",
          next: "step3B"
        },
        C: {
          text: "Respond with a lecture about attitude.",
          score: -10,
          feedback: "Long verbal attention increases disruption.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "Peers look over. KeKu repeats, “I don’t get it!” louder and pushes his paper slightly away.",
      choices: {
        A: {
          text: "Repair calmly: “Help signal.” (gesture to the visual) and reduce audience attention.",
          score: 10,
          feedback: "Good repair — minimal verbal attention + clear cue.",
          next: "step3A"
        },
        B: {
          text: "Tell him to calm down.",
          score: 0,
          feedback: "Neutral but not skill-focused.",
          next: "step3B"
        },
        C: {
          text: "Publicly call out that he is disrupting others.",
          score: -10,
          feedback: "Public attention escalates the pattern.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu stays seated and waits using the help routine.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Replacement behavior maintained.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu quiets but continues fidgeting and watching peers.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stabilized, but help routine is inconsistent.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu pushes his work away and starts talking to peers to avoid the task.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Escape + attention is active.", next: "step4" }
      }
    },

    step4: {
      text: "How do you finalize support once he uses the help routine?",
      choices: {
        A: {
          text: "Provide quick help, then mark a Chart Move for appropriate help-seeking.",
          score: 10,
          feedback: "Perfect — help + reinforcement tied to replacement behavior.",
          ending: "success"
        },
        B: {
          text: "Help him but do not provide praise/Chart Move.",
          score: 0,
          feedback: "Support provided, but replacement behavior not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Delay help and bring up earlier yelling.",
          score: -10,
          feedback: "Risks re-escalation and weakens help routine.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Help Routine Strengthened",
      text: "KeKu learned that using the help routine results in quick support and reinforcement."
    },
    mixed: {
      title: "Mixed – Help Given Without Reinforcement",
      text: "KeKu received support, but the help routine may not maintain without reinforcement."
    },
    fail: {
      title: "Fail – Disruption Replaced Help-Seeking",
      text: "Calling out and avoidance behaviors were unintentionally reinforced."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 10 — End-of-Day Cleanup / Dismissal
 **************************************************/
POOL.daily.push({
  id: "daily_10_end_of_day_cleanup",
  title: "Daily Mission: End-of-Day Cleanup",
  start: "step1",
  steps: {

    step1: {
      text: "During end-of-day cleanup, KeKu leaves his area and drifts toward peers, touching items on other desks and joking around instead of packing up (Unexpected Location).",
      choices: {
        A: {
          text: "Calm, specific directive: “Pack up first — backpack, folder, then line.”",
          score: 10,
          feedback: "Great. Clear sequence reduces wandering and keeps attention low.",
          next: "step2A"
        },
        B: {
          text: "Say, “Please pack up.”",
          score: 0,
          feedback: "Neutral but not structured enough.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop touching other people’s stuff!”",
          score: -10,
          feedback: "Public attention can increase the behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu pauses and returns toward his desk, still looking at peers.",
      choices: {
        A: {
          text: "Say: “Sit and zip your backpack.”",
          score: 10,
          feedback: "Excellent. Clear motor action anchors him in place.",
          next: "step3A"
        },
        B: {
          text: "Give him space and hope he follows through.",
          score: 0,
          feedback: "Neutral; may drift again.",
          next: "step3B"
        },
        C: {
          text: "Tell him, “You’re being disruptive right now.”",
          score: -10,
          feedback: "Vague correction adds attention.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu picks up one item, then wanders again toward a peer.",
      choices: {
        A: {
          text: "Precision prompt: “Backpack first.” (gesture to his spot).",
          score: 10,
          feedback: "Strong — quick, clear, low attention.",
          next: "step3A"
        },
        B: {
          text: "Repeat, “Go pack up.”",
          score: 0,
          feedback: "Neutral but repeated attention.",
          next: "step3B"
        },
        C: {
          text: "Tell the peer to stop engaging with him.",
          score: -10,
          feedback: "Creates a peer audience moment.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "Peers laugh. KeKu grins and moves faster between desks.",
      choices: {
        A: {
          text: "Repair calmly: move closer, reduce audience, and direct: “Back to your desk.”",
          score: 10,
          feedback: "Good repair — reduces peer reinforcement and redirects safely.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look from across the room.",
          score: 0,
          feedback: "Neutral but may not interrupt movement.",
          next: "step3B"
        },
        C: {
          text: "Lecture him about respect and property.",
          score: -10,
          feedback: "Long attention moment reinforces the pattern.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu packs up at his desk and stays there.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Routine back on track.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu packs slowly but keeps looking around.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial compliance; needs reinforcement.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu continues wandering and talking to peers to avoid packing.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Attention + movement cycle continues.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce the end-of-day routine?",
      choices: {
        A: {
          text: "Quiet praise and mark a Chart Move for packing up in his space.",
          score: 10,
          feedback: "Perfect reinforcement for staying in location and completing routine.",
          ending: "success"
        },
        B: {
          text: "Line the class up without feedback.",
          score: 0,
          feedback: "Routine completed, but not strengthened for tomorrow.",
          ending: "mixed"
        },
        C: {
          text: "Mention earlier wandering in front of the class as you dismiss.",
          score: -10,
          feedback: "Public attention can restart the behavior.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – End-of-Day Routine Completed",
      text: "KeKu stayed in his space, packed up, and earned reinforcement for following the routine."
    },
    mixed: {
      title: "Mixed – Routine Completed Without Reinforcement",
      text: "KeKu packed up, but reinforcement wasn’t tied to the expected behaviors."
    },
    fail: {
      title: "Fail – Wandering Reinforced",
      text: "Public attention and inconsistent reinforcement maintained wandering and peer-seeking."
    }
  }
});

/*************************************************
 * CRISIS SCENARIO 1 — KYHFOOTY Toward Peers
 **************************************************/
POOL.crisis.push({
  id: "crisis_1_kyhfooty_peer",
  title: "Crisis Drill: Peer Safety",
  start: "step1",
  steps: {

    step1: {
      text: "During line-up, KeKu suddenly kicks toward a peer and swings his arm when they get too close (KYHFOOTY). Several students react.",
      choices: {
        A: {
          text: "Immediately create space: calmly block peers away, give a brief incompatible direction (“Hands down. Walk with me.”), and signal for support.",
          score: 10,
          feedback: "Correct. Safety first: space, calm direction, and support activation.",
          next: "step2A"
        },
        B: {
          text: "Talk him through feelings and ask why he’s upset.",
          score: 0,
          feedback: "Supportive, but too slow for immediate peer safety.",
          next: "step2B"
        },
        C: {
          text: "Yell and physically restrain him in front of peers.",
          score: -10,
          feedback: "High risk escalation and unsafe practice.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "Peers move away. KeKu slows slightly but is still tense.",
      choices: {
        A: {
          text: "Repeat a brief incompatible direction and guide to the calm/reset spot.",
          score: 10,
          feedback: "Good — predictable, low-language guidance supports de-escalation.",
          next: "step3A"
        },
        B: {
          text: "Begin explaining consequences.",
          score: 0,
          feedback: "Neutral, but adds verbal load during crisis.",
          next: "step3B"
        },
        C: {
          text: "Threaten loss of rewards.",
          score: -10,
          feedback: "Escalates power struggle during crisis.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu continues to swing his arms as you talk.",
      choices: {
        A: {
          text: "Shift to safety mode: create space, brief direction, call for support.",
          score: 10,
          feedback: "Good recovery — prioritize safety immediately.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to calm him down.",
          score: 0,
          feedback: "Neutral but ineffective in this moment.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice to regain control.",
          score: -10,
          feedback: "Escalation risk increases.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "Peers cry and the situation escalates quickly.",
      choices: {
        A: {
          text: "Reset: release pressure, create space, and get immediate support.",
          score: 10,
          feedback: "Correct recovery move after escalation.",
          next: "step3A"
        },
        B: {
          text: "Continue restraining and lecturing.",
          score: 0,
          feedback: "Neutral but unsafe.",
          next: "step3B"
        },
        C: {
          text: "Remove all rewards and argue.",
          score: -10,
          feedback: "Escalation continues.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu is separated from peers and begins to calm.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Crisis stabilized.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu remains dysregulated but no longer aggressive.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stabilization.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu continues aggressive movements.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Safety still at risk.", next: "step4" }
      }
    },

    step4: {
      text: "Once KeKu is calm and safe, how do you support recovery?",
      choices: {
        A: {
          text: "Allow a brief reset/break, then reinforce calm re-entry with a Chart Move.",
          score: 10,
          feedback: "Excellent — reinforces recovery, not aggression.",
          ending: "success"
        },
        B: {
          text: "Return him to class without comment.",
          score: 0,
          feedback: "Neutral; recovery not reinforced.",
          ending: "mixed"
        },
        C: {
          text: "Lecture about what he did wrong.",
          score: -10,
          feedback: "Teaching during recovery can restart escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed Safely",
      text: "Peer safety was prioritized and calm re-entry was reinforced."
    },
    mixed: {
      title: "Crisis Stabilized Without Reinforcement",
      text: "Safety was restored, but recovery behavior was not strengthened."
    },
    fail: {
      title: "Crisis Escalation",
      text: "Escalation increased due to attention, threats, or unsafe responses."
    }
  }
});

/*************************************************
 * CRISIS SCENARIO 2 — Work Refusal Escalation
 **************************************************/
POOL.crisis.push({
  id: "crisis_2_work_refusal",
  title: "Crisis Drill: Escalating Refusal",
  start: "step1",
  steps: {

    step1: {
      text: "During a challenging task, KeKu refuses, pushes materials away, and begins yelling, “I’m not doing this!”",
      choices: {
        A: {
          text: "Reduce language: offer break/reset option and step back.",
          score: 10,
          feedback: "Correct — reduces pressure and supports de-escalation.",
          next: "step2A"
        },
        B: {
          text: "Explain why the work is important.",
          score: 0,
          feedback: "Neutral but adds verbal demand.",
          next: "step2B"
        },
        C: {
          text: "Insist he comply immediately.",
          score: -10,
          feedback: "Escalates escape-maintained behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu pauses and lowers his voice slightly.",
      choices: {
        A: {
          text: "Maintain calm presence and allow space.",
          score: 10,
          feedback: "Good — keeps escalation from reigniting.",
          next: "step3A"
        },
        B: {
          text: "Start re-teaching expectations.",
          score: 0,
          feedback: "Neutral but premature.",
          next: "step3B"
        },
        C: {
          text: "Remind him of consequences.",
          score: -10,
          feedback: "Power struggle risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu yells louder and knocks materials onto the floor.",
      choices: {
        A: {
          text: "Shift to crisis mode: clear materials, offer reset/break, get support if needed.",
          score: 10,
          feedback: "Correct safety-focused response.",
          next: "step3A"
        },
        B: {
          text: "Continue explaining.",
          score: 0,
          feedback: "Neutral but ineffective.",
          next: "step3B"
        },
        C: {
          text: "Threaten loss of privileges.",
          score: -10,
          feedback: "Escalation increases.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "KeKu screams and kicks his chair.",
      choices: {
        A: {
          text: "Back off, create space, and allow reset with support.",
          score: 10,
          feedback: "Correct — safety and de-escalation first.",
          next: "step3A"
        },
        B: {
          text: "Continue demanding compliance.",
          score: 0,
          feedback: "Neutral but unsafe.",
          next: "step3B"
        },
        C: {
          text: "Argue about behavior.",
          score: -10,
          feedback: "Escalation continues.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu calms and stops yelling.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Escalation resolved.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu quiets but remains tense.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial recovery.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu remains escalated.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Crisis persists.", next: "step4" }
      }
    },

    step4: {
      text: "How do you support recovery after the refusal?",
      choices: {
        A: {
          text: "Allow a brief break, then reinforce calm re-engagement with a Chart Move.",
          score: 10,
          feedback: "Excellent — reinforces recovery and flexibility.",
          ending: "success"
        },
        B: {
          text: "Return to work without comment.",
          score: 0,
          feedback: "Neutral but recovery not reinforced.",
          ending: "mixed"
        },
        C: {
          text: "Discuss the refusal in detail.",
          score: -10,
          feedback: "Risk of restarting escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis De-Escalated",
      text: "KeKu calmed with reduced demands and recovery was reinforced."
    },
    mixed: {
      title: "Crisis Ended Without Reinforcement",
      text: "Behavior stabilized, but recovery was not strengthened."
    },
    fail: {
      title: "Crisis Maintained",
      text: "Escalation continued due to pressure and attention."
    }
  }
});

/*************************************************
 * CRISIS SCENARIO 3 — Unexpected Location
 **************************************************/
POOL.crisis.push({
  id: "crisis_3_unexpected_location",
  title: "Crisis Drill: Unexpected Location",
  start: "step1",
  steps: {

    step1: {
      text: "During work time, KeKu suddenly leaves his area and walks quickly toward the hallway.",
      choices: {
        A: {
          text: "Maintain line-of-sight, notify support immediately, and use calm, brief prompts.",
          score: 10,
          feedback: "Correct — safety, support, and minimal language.",
          next: "step2A"
        },
        B: {
          text: "Follow him quietly without notifying anyone.",
          score: 0,
          feedback: "Neutral; support delayed.",
          next: "step2B"
        },
        C: {
          text: "Chase and physically block him.",
          score: -10,
          feedback: "Chasing increases risk.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "KeKu slows near the doorway but looks unsure.",
      choices: {
        A: {
          text: "Offer a brief choice: “Walk with me back or wait here with support.”",
          score: 10,
          feedback: "Excellent — predictable options reduce flight.",
          next: "step3A"
        },
        B: {
          text: "Tell him to explain why he left.",
          score: 0,
          feedback: "Neutral but adds verbal load.",
          next: "step3B"
        },
        C: {
          text: "Threaten consequences for leaving.",
          score: -10,
          feedback: "Escalation risk increases.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "KeKu continues walking farther from the room.",
      choices: {
        A: {
          text: "Notify support now and switch to safety protocol.",
          score: 10,
          feedback: "Good recovery — prioritize safety.",
          next: "step3A"
        },
        B: {
          text: "Keep following quietly.",
          score: 0,
          feedback: "Neutral but unsafe.",
          next: "step3B"
        },
        C: {
          text: "Call out loudly for him to stop.",
          score: -10,
          feedback: "Attention may escalate flight.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "KeKu runs faster as you block him.",
      choices: {
        A: {
          text: "Back off, create space, and get immediate support.",
          score: 10,
          feedback: "Correct recovery move.",
          next: "step3A"
        },
        B: {
          text: "Continue blocking.",
          score: 0,
          feedback: "Neutral but risky.",
          next: "step3B"
        },
        C: {
          text: "Yell for compliance.",
          score: -10,
          feedback: "Escalation continues.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "KeKu stops and waits with support nearby.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Safety restored.", next: "step4" }
      }
    },

    step3B: {
      text: "KeKu slows but remains outside the area.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial safety.", next: "step4" }
      }
    },

    step3C: {
      text: "KeKu continues moving away.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Safety risk persists.", next: "step4" }
      }
    },

    step4: {
      text: "Once KeKu is calm and safe, how do you support recovery?",
      choices: {
        A: {
          text: "Reinforce safe return and calm behavior with a Chart Move.",
          score: 10,
          feedback: "Excellent — reinforces recovery and safety.",
          ending: "success"
        },
        B: {
          text: "Return to class without feedback.",
          score: 0,
          feedback: "Neutral but recovery not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Discuss the danger in detail.",
          score: -10,
          feedback: "Teaching during recovery may re-escalate.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed – Safe Return",
      text: "Unexpected location was handled with safety and reinforcement of recovery."
    },
    mixed: {
      title: "Crisis Ended Without Reinforcement",
      text: "Safety restored, but recovery behavior not strengthened."
    },
    fail: {
      title: "Crisis Escalated",
      text: "Escalation increased due to chasing, threats, or attention."
    }
  }
});

/*************************************************
 * CRISIS SCENARIO 4 — Property Misuse (Throwing/Breaking)
 **************************************************/
POOL.crisis.push({
  id: "crisis_4_property_misuse",
  title: "Crisis Drill: Property Misuse",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During a demanding task, KeKu grabs a classroom item (pencil bin / paper stack) and begins throwing materials onto the floor. Peers turn to watch.",
      choices: {
        A: {
          text: "Reduce audience + secure environment: calmly move peers back, remove other throwable items, and use a brief directive (“Hands down. Step back.”). Signal for support.",
          score: 10,
          feedback: "Correct. You reduce risk, reduce attention, and keep language minimal.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop and explain why it’s not okay.",
          score: 0,
          feedback: "Neutral, but too much language for an active crisis.",
          next: "step2B"
        },
        C: {
          text: "Scold him loudly in front of the class.",
          score: -10,
          feedback: "Public attention + intensity can escalate property misuse.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "With peers moved away and items reduced, KeKu pauses, breathing hard.",
      choices: {
        A: {
          text: "Offer reset/break space with a calm gesture and minimal words (“Reset.”).",
          score: 10,
          feedback: "Excellent. Low language + predictable option supports de-escalation.",
          next: "step3A"
        },
        B: {
          text: "Ask him to explain what happened.",
          score: 0,
          feedback: "Neutral, but increases verbal load while still activated.",
          next: "step3B"
        },
        C: {
          text: "Tell him he has to clean up immediately.",
          score: -10,
          feedback: "Demand during peak escalation can restart or intensify behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "As you explain, KeKu throws another item and looks toward peers to see reactions.",
      choices: {
        A: {
          text: "Shift to crisis steps: reduce audience, remove items, brief directive, signal support.",
          score: 10,
          feedback: "Good recovery. You moved from talking to safety-focused responding.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining and asking questions.",
          score: 0,
          feedback: "Neutral but likely maintains behavior.",
          next: "step3B"
        },
        C: {
          text: "Threaten loss of privileges.",
          score: -10,
          feedback: "Threats often escalate and prolong the episode.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "KeKu escalates, tossing items faster while peers react.",
      choices: {
        A: {
          text: "Reset: lower intensity, move peers back, reduce items, and call for support.",
          score: 10,
          feedback: "Correct recovery — safety and de-escalation first.",
          next: "step3A"
        },
        B: {
          text: "Continue scolding and arguing.",
          score: 0,
          feedback: "Neutral but likely maintains escalation.",
          next: "step3B"
        },
        C: {
          text: "Physically grab items from his hands without support.",
          score: -10,
          feedback: "Risky and may escalate aggression.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "KeKu moves toward reset space and stops throwing. Breathing slows.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Crisis is de-escalating safely.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "KeKu stops throwing but stays tense and mutters.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial stabilization; keep language low.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "KeKu keeps throwing or begins moving toward others.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Safety risk continues — support needed.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "Once KeKu is calm and safe, what is the best recovery step?",
      choices: {
        A: {
          text: "Reinforce calm recovery with a Chart Move, then do cleanup later when fully regulated (with support if needed).",
          score: 10,
          feedback: "Excellent. Reinforces recovery first and avoids re-triggering escalation.",
          ending: "success"
        },
        B: {
          text: "Have him clean immediately without reinforcement.",
          score: 0,
          feedback: "Neutral; may work sometimes but risks re-escalation if too soon.",
          ending: "mixed"
        },
        C: {
          text: "Lecture about respect and make him apologize publicly.",
          score: -10,
          feedback: "Public attention and demands can restart escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed – Recovery Reinforced",
      text: "Safety was restored, attention was reduced, and KeKu’s calm recovery was reinforced before demands resumed."
    },
    mixed: {
      title: "Stabilized – Recovery Not Strengthened",
      text: "Behavior stopped, but recovery behaviors were not reinforced and demands may have returned too quickly."
    },
    fail: {
      title: "Escalation Maintained",
      text: "High attention, threats, or premature demands prolonged the episode or increased risk."
    }
  }
});

/*************************************************
 * CRISIS SCENARIO 5 — KYHFOOTY + Attempt to Leave
 **************************************************/
POOL.crisis.push({
  id: "crisis_5_kyhfooty_leave_combo",
  title: "Crisis Drill: Aggression + Leaving Area",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "KeKu becomes escalated, kicks toward a peer (KYHFOOTY), then immediately turns and moves quickly toward the door.",
      choices: {
        A: {
          text: "Prioritize safety: move peers back, maintain line-of-sight, use brief directive (“Stop. With me.”), and signal for immediate support.",
          score: 10,
          feedback: "Correct. This is a high-risk combo — safety + support activation is essential.",
          next: "step2A"
        },
        B: {
          text: "Follow him into the hall without notifying anyone.",
          score: 0,
          feedback: "Neutral but unsafe — support is delayed.",
          next: "step2B"
        },
        C: {
          text: "Chase him and grab his arm to stop him.",
          score: -10,
          feedback: "High risk escalation and injury.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "With peers separated and support signaled, KeKu pauses at the doorway, breathing hard.",
      choices: {
        A: {
          text: "Offer a brief, safe choice: “Reset here” (gesture) or “Walk with me back.” Keep voice calm and minimal.",
          score: 10,
          feedback: "Excellent — predictable options reduce flight and aggression.",
          next: "step3A"
        },
        B: {
          text: "Ask him to explain what he was thinking.",
          score: 0,
          feedback: "Neutral but too much language during high activation.",
          next: "step3B"
        },
        C: {
          text: "Tell him he’s in big trouble and can’t leave.",
          score: -10,
          feedback: "Threats often increase fleeing and aggression.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "KeKu keeps moving down the hall. You are alone with him and the class is unattended.",
      choices: {
        A: {
          text: "Recover: notify support immediately and re-engage safety protocol while maintaining line-of-sight.",
          score: 10,
          feedback: "Correct recovery — support and supervision are required.",
          next: "step3A"
        },
        B: {
          text: "Keep following without contacting anyone.",
          score: 0,
          feedback: "Neutral but unsafe.",
          next: "step3B"
        },
        C: {
          text: "Yell his name repeatedly to make him stop.",
          score: -10,
          feedback: "Increases attention and can speed up flight.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "KeKu pulls away and escalates, kicking again while trying to move forward.",
      choices: {
        A: {
          text: "Back off to reduce intensity, keep line-of-sight, clear peers, and get immediate support.",
          score: 10,
          feedback: "Correct recovery — safety, space, and support.",
          next: "step3A"
        },
        B: {
          text: "Hold tighter to stop him.",
          score: 0,
          feedback: "Neutral but risky and may escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue and threaten consequences.",
          score: -10,
          feedback: "Escalation continues.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "KeKu slows, stays within supervision range, and begins to calm with support present.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Safety restored; continue low language.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "KeKu stops moving but remains tense and reactive.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial stabilization; keep demands low.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "KeKu continues trying to leave and/or engages in more KYHFOOTY behaviors.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "High risk persists — follow crisis plan and support procedures.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS)ucker) ----------
    step4: {
      text: "Once KeKu is calm and safely back under supervision, what is the best next step?",
      choices: {
        A: {
          text: "Reinforce calm recovery with a Chart Move, then re-enter with a low-demand task before returning to full demands.",
          score: 10,
          feedback: "Excellent. Reinforces recovery and prevents immediate re-triggering.",
          ending: "success"
        },
        B: {
          text: "Return to the original task without reinforcement.",
          score: 0,
          feedback: "Neutral; recovery isn’t strengthened and demands may be too fast.",
          ending: "mixed"
        },
        C: {
          text: "Have him explain the behavior and apologize to peers immediately.",
          score: -10,
          feedback: "High-language social demands can restart escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed – Safe Recovery",
      text: "Peers were protected, flight risk was contained, support was activated, and calm recovery was reinforced."
    },
    mixed: {
      title: "Stabilized – Risk of Repeat",
      text: "Safety was restored, but recovery wasn’t reinforced and demands may have returned too quickly."
    },
    fail: {
      title: "Escalation Continued",
      text: "Chasing, threats, or high-language demands maintained or increased crisis behavior."
    }
  }
});

/*************************************************
 * WILDCARD SCENARIO 1 — Unexpected Location Change (Assembly/Room Switch)
 **************************************************/
POOL.wild.push({
  id: "wild_1_unexpected_location_change",
  title: "Wildcard Mission: Unexpected Location Change",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "An announcement comes over the intercom: your class must move to a different room right away (assembly/room swap). KeKu tenses, looks around, and says loudly, “No—why are we going THERE?!” while stepping away from the line.",
      choices: {
        A: {
          text: "Use brief, calm directive + predictability: “We go together. Stay with me.” and gesture where to stand.",
          score: 10,
          feedback: "Great fidelity. Low language, clear anchor, reduces escalation during unexpected transitions.",
          next: "step2A"
        },
        B: {
          text: "Explain the reason for the change and reassure him it will be fine.",
          score: 0,
          feedback: "Neutral, but extra talking can increase activation during uncertainty.",
          next: "step2B"
        },
        C: {
          text: "Say sharply, “Stop arguing and get in line.”",
          score: -10,
          feedback: "High-intensity correction during a change can escalate behavior and increase risk of leaving area.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "KeKu steps closer but keeps scanning the hallway and peers.",
      choices: {
        A: {
          text: "Offer a simple choice: “Walk next to me” OR “Walk behind me” (gesture both).",
          score: 10,
          feedback: "Excellent. Choices increase compliance without a debate and reduce flight risk.",
          next: "step3A"
        },
        B: {
          text: "Tell him, “You’re okay,” repeatedly while walking.",
          score: 0,
          feedback: "Neutral; repeated verbal attention may not help regulation.",
          next: "step3B"
        },
        C: {
          text: "Warn him he’ll lose a privilege if he doesn’t comply.",
          score: -10,
          feedback: "Threats during high uncertainty can increase escalation and attempts to leave.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "As you explain, KeKu interrupts, “I’m NOT going!” and backs up further, drawing peer attention.",
      choices: {
        A: {
          text: "Cut the debate: “With me.” (gesture) and begin moving the class attention forward.",
          score: 10,
          feedback: "Nice recovery. Minimal language + removing audience attention supports de-escalation.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining and negotiating.",
          score: 0,
          feedback: "Neutral but may maintain refusal through attention.",
          next: "step3B"
        },
        C: {
          text: "Publicly call him out for refusing.",
          score: -10,
          feedback: "Public attention can reinforce escalation and increase risk behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "KeKu’s voice gets louder. He steps toward the door and looks ready to bolt.",
      choices: {
        A: {
          text: "Safety-first: reduce audience, keep line-of-sight, signal support if needed, and use a brief directive: “Stop. With me.”",
          score: 10,
          feedback: "Correct. You shift to safety and support procedures without escalating verbal intensity.",
          next: "step3A"
        },
        B: {
          text: "Follow him while telling him to calm down.",
          score: 0,
          feedback: "Neutral; support activation may be delayed.",
          next: "step3B"
        },
        C: {
          text: "Chase him and grab him to stop him.",
          score: -10,
          feedback: "High risk. Physical intervention can escalate aggression and flight.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "KeKu stays close enough to move with you and begins to settle as the group walks.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Regulation is improving with structure and low attention.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "KeKu walks but mutters and keeps looking for an escape route.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stabilization; keep directives brief and proximity steady.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "KeKu escalates further—refuses to move or tries to pull away.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Risk remains high; follow safety/support procedures.", next: "step4" }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "Once you arrive at the new location and KeKu is calm enough to participate, what’s the best next step?",
      choices: {
        A: {
          text: "Reinforce coping + compliance with a Chart Move and start with a low-demand entry task.",
          score: 10,
          feedback: "Perfect. Reinforces flexibility and prevents immediate re-triggering.",
          ending: "success"
        },
        B: {
          text: "Proceed immediately with full expectations without reinforcement.",
          score: 0,
          feedback: "Neutral; participation may occur, but flexibility coping isn’t strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Process the refusal publicly and require an apology before he can join.",
          score: -10,
          feedback: "High language + public attention can restart escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Flexibility Reinforced",
      text: "KeKu tolerated an unexpected location change with predictable structure, and coping was reinforced with a Chart Move."
    },
    mixed: {
      title: "Mixed – Moved, But Not Strengthened",
      text: "KeKu complied, but flexibility and coping weren’t clearly reinforced, increasing risk of future refusal."
    },
    fail: {
      title: "Fail – Escalation Maintained",
      text: "Public attention, threats, or high demands increased escalation and risk of leaving area."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 2 — Unstructured/Free Time (Peer Attention + KYHFOOTY Risk)
 **************************************************/
POOL.wild.push({
  id: "wild_2_unstructured_free_time",
  title: "Wildcard Mission: Unstructured Time Surge",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "A planned activity ends early and you suddenly have 10 minutes of open time. KeKu seeks a peer, gets too close, and begins bumping bodies while trying to get a reaction. A peer says, “Stop,” and KeKu’s posture stiffens.",
      choices: {
        A: {
          text: "Pre-correct and structure immediately: assign a clear option (“Choose: drawing or puzzle”) and set a boundary (“Hands to self”).",
          score: 10,
          feedback: "Excellent. You remove ambiguity that fuels behavior and set expectations before escalation.",
          next: "step2A"
        },
        B: {
          text: "Say, “Be nice,” and hope it settles.",
          score: 0,
          feedback: "Neutral; not enough structure for a known risk time.",
          next: "step2B"
        },
        C: {
          text: "Call him out loudly in front of peers for being unsafe.",
          score: -10,
          feedback: "Public attention can increase peer-maintained behavior and intensify KYHFOOTY risk.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "KeKu hesitates, then looks at the options, still buzzing with energy.",
      choices: {
        A: {
          text: "Offer a small choice + proximity: “Pick your spot—table or rug.” Stay nearby without hovering.",
          score: 10,
          feedback: "Great. Structured choice + calm proximity reduces peer-driven escalation.",
          next: "step3A"
        },
        B: {
          text: "Let him roam as long as he’s not hurting anyone.",
          score: 0,
          feedback: "Neutral; roaming can quickly trigger peer conflict.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is on a ‘last warning’ and watch him closely.",
          score: -10,
          feedback: "Threat-based attention can intensify performance behaviors for peers.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "KeKu moves closer to the peer again and the peer pulls away. KeKu raises his voice: “I didn’t DO anything!”",
      choices: {
        A: {
          text: "Repair with structure: “Option time. Choose drawing or puzzle. Hands to self.” (gesture toward materials).",
          score: 10,
          feedback: "Good recovery. You replace ambiguity with clear, doable actions.",
          next: "step3A"
        },
        B: {
          text: "Try to talk through what happened in the moment.",
          score: 0,
          feedback: "Neutral; extended talking during activation can escalate.",
          next: "step3B"
        },
        C: {
          text: "Make the peer explain what KeKu did wrong in front of others.",
          score: -10,
          feedback: "Creates a social spotlight and can trigger aggression.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers stare. KeKu steps toward the peer and lifts a foot like he might kick.",
      choices: {
        A: {
          text: "Safety-first: move peers back, give a brief directive (“Back.”), and redirect KeKu to a defined space with minimal language.",
          score: 10,
          feedback: "Correct. You reduce risk and prevent reinforcement through peer attention.",
          next: "step3A"
        },
        B: {
          text: "Tell him to calm down and stop acting that way.",
          score: 0,
          feedback: "Neutral; may not reduce danger quickly.",
          next: "step3B"
        },
        C: {
          text: "Yell at him to stop and threaten office referral.",
          score: -10,
          feedback: "High intensity + attention can escalate KYHFOOTY behaviors.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "KeKu moves to a chosen activity spot and begins engaging with materials.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Strong regulation and safe participation.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "KeKu engages briefly but keeps scanning peers for reactions.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stability; keep structure and proximity.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "KeKu escalates—more body contact, louder voice, or attempts to kick toward a peer.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Risk is increasing; shift to safety and support procedures.", next: "step4" }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you finish this unstructured block successfully?",
      choices: {
        A: {
          text: "Reinforce safe participation with a Chart Move and preview the next structured activity with a simple cue.",
          score: 10,
          feedback: "Excellent. Reinforces the right behavior and bridges to the next transition.",
          ending: "success"
        },
        B: {
          text: "Let time run out and move on without reinforcement or preview.",
          score: 0,
          feedback: "Neutral; doesn’t strengthen safe unstructured behavior.",
          ending: "mixed"
        },
        C: {
          text: "Publicly remind everyone about KeKu’s behavior before transitioning.",
          score: -10,
          feedback: "Public attention can re-trigger peer-maintained behavior.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Unstructured Time Stabilized",
      text: "KeKu stayed safe during an unstructured block because structure was added quickly and safe behavior was reinforced."
    },
    mixed: {
      title: "Mixed – Safe Enough, But Weak Support",
      text: "The moment passed without a major incident, but structure and reinforcement weren’t strong enough to reduce future risk."
    },
    fail: {
      title: "Fail – Peer Attention Fueled Escalation",
      text: "Public attention and weak structure allowed peer conflict to grow, increasing KYHFOOTY risk."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 3 — Substitute / New Adult (Test of Limits)
 **************************************************/
POOL.wild.push({
  id: "wild_3_new_adult_substitute",
  title: "Wildcard Mission: New Adult / Substitute Day",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "A substitute (or a new adult) is in the room. KeKu notices immediately and begins testing limits: refusing a direction and looking at peers with a grin like he’s performing.",
      choices: {
        A: {
          text: "Keep routine predictable: give the sub a quick script and use a brief directive to KeKu (“Same routine. Start now.”).",
          score: 10,
          feedback: "Excellent. Predictability reduces attention-seeking and prevents limit-testing from escalating.",
          next: "step2A"
        },
        B: {
          text: "Tell the sub, “He can be difficult,” within earshot of peers.",
          score: 0,
          feedback: "Neutral but risks reinforcing behavior by giving him a public identity/spotlight.",
          next: "step2B"
        },
        C: {
          text: "Publicly confront him: “Don’t try that today.”",
          score: -10,
          feedback: "Public challenge can escalate and increase peer attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "KeKu hesitates, then starts moving but watches peers to see if they’re impressed.",
      choices: {
        A: {
          text: "Reinforce quickly and quietly: a brief specific praise + Chart Move once he initiates.",
          score: 10,
          feedback: "Perfect. You reinforce task initiation under new-adult conditions.",
          next: "step3A"
        },
        B: {
          text: "Let him start without any reinforcement.",
          score: 0,
          feedback: "Neutral; initiation isn’t strengthened and testing may return.",
          next: "step3B"
        },
        C: {
          text: "Add extra rules and reminders because it’s a sub day.",
          score: -10,
          feedback: "More talk and more rules can increase activation and resistance.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "KeKu smirks and says loudly, “See? They said I’m hard. I don’t have to listen.” Peers laugh.",
      choices: {
        A: {
          text: "Repair fast: remove audience attention and restate routine briefly (“Same routine. Start with #1.”).",
          score: 10,
          feedback: "Good recovery. You cut off the spotlight and reset expectations without debate.",
          next: "step3A"
        },
        B: {
          text: "Explain to the class what you meant and clarify.",
          score: 0,
          feedback: "Neutral, but more public talking keeps the attention on him.",
          next: "step3B"
        },
        C: {
          text: "Argue with KeKu and tell him he’s wrong in front of peers.",
          score: -10,
          feedback: "Public arguing increases attention and escalates the performance.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "KeKu refuses harder, raises his voice, and postures near peers like he’s building an audience.",
      choices: {
        A: {
          text: "Safety + de-escalation: reduce audience, brief directive, and redirect to a defined spot; signal support if needed.",
          score: 10,
          feedback: "Correct. You prevent peer reinforcement and reduce risk of escalation.",
          next: "step3A"
        },
        B: {
          text: "Tell him to calm down repeatedly.",
          score: 0,
          feedback: "Neutral but may not change behavior quickly.",
          next: "step3B"
        },
        C: {
          text: "Threaten consequences loudly.",
          score: -10,
          feedback: "Threats + public attention can trigger aggression or leaving area.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "KeKu begins participating in the routine with the substitute present and stays within expectations.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Strong task initiation with predictability.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "KeKu participates but continues to glance at peers and push boundaries.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stability; keep reinforcement tight.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "KeKu escalates: louder refusal, moves toward peers, or hints at unsafe behavior.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "High risk; shift fully to safety and support procedures.", next: "step4" }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you conclude the substitute/new adult period successfully?",
      choices: {
        A: {
          text: "Reinforce participation and coping with a Chart Move, and briefly preview that the same routine will stay in place next time too.",
          score: 10,
          feedback: "Excellent. Reinforces stability across adult changes and builds generalization.",
          ending: "success"
        },
        B: {
          text: "Let the period end without reinforcement or preview.",
          score: 0,
          feedback: "Neutral; doesn’t strengthen generalization.",
          ending: "mixed"
        },
        C: {
          text: "Debrief publicly about how he acted with the substitute.",
          score: -10,
          feedback: "Public attention can reinforce the performance and increase future testing.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Routine Generalized",
      text: "KeKu followed the routine with a new adult present and earned reinforcement for task initiation and coping."
    },
    mixed: {
      title: "Mixed – Participated, But Testing May Return",
      text: "KeKu participated, but generalization wasn’t clearly reinforced."
    },
    fail: {
      title: "Fail – Spotlight Increased Escalation",
      text: "Public attention, threats, or labeling increased peer reinforcement and escalated behavior."
    }
  }
});

/*************************************************
 * WILDCARD SCENARIO 4 — Technology Glitch / “Not Working!” (Frustration Spike)
 **************************************************/
POOL.wild.push({
  id: "wild_4_technology_glitch",
  title: "Wildcard Mission: Technology Glitch",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "KeKu is using a Chromebook/tablet for an activity. The screen freezes. He jabs the keys, then raises his voice: “It’s NOT WORKING!” and looks around to see who is watching.",
      choices: {
        A: {
          text: "Use calm, brief directive + support: “Hands down. Show me.” (move closer, low voice).",
          score: 10,
          feedback: "Great fidelity. You reduce intensity, cue safe hands, and offer help without a big attention moment.",
          next: "step2A"
        },
        B: {
          text: "Say, “Just be patient,” from across the room.",
          score: 0,
          feedback: "Neutral; it doesn’t give him a clear action or coping step.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop yelling! You’re fine.”",
          score: -10,
          feedback: "Public correction + invalidation can escalate frustration and increase peer attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "KeKu lowers his hands but keeps breathing fast and glancing at peers.",
      choices: {
        A: {
          text: "Offer a simple choice: “Reset chair for 1 minute OR swap to paper version.”",
          score: 10,
          feedback: "Excellent—gives control, reduces frustration, and prevents escalation.",
          next: "step3A"
        },
        B: {
          text: "Keep troubleshooting while talking him through every step.",
          score: 0,
          feedback: "Neutral—helpful, but lots of talk can prolong attention and activation.",
          next: "step3B"
        },
        C: {
          text: "Tell him he’s losing tech time because of his attitude.",
          score: -10,
          feedback: "Threats during frustration can trigger aggression or refusal.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "KeKu slaps the trackpad and says louder, “See?! It’s BROKEN!” A peer giggles.",
      choices: {
        A: {
          text: "Repair quickly: move in, low voice: “Hands down. Reset or paper.”",
          score: 10,
          feedback: "Strong recovery—reduces audience attention and gives two clear coping options.",
          next: "step3A"
        },
        B: {
          text: "Explain that glitches happen and he needs to calm down.",
          score: 0,
          feedback: "Neutral, but can turn into a debate during activation.",
          next: "step3B"
        },
        C: {
          text: "Publicly warn the class about respecting technology.",
          score: -10,
          feedback: "Creates a stage and reinforces the performance.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "KeKu shoves the device away and starts to stand up quickly, body tight, looking like he might bolt or lash out.",
      choices: {
        A: {
          text: "Safety-first: reduce peer audience, brief directive: “Stop. With me.” and guide him to a defined space; signal support if needed.",
          score: 10,
          feedback: "Correct—prioritizes safety, minimal language, and prevents escalation through attention.",
          next: "step3A"
        },
        B: {
          text: "Tell him to sit down and calm down repeatedly.",
          score: 0,
          feedback: "Neutral; may not reduce risk quickly enough.",
          next: "step3B"
        },
        C: {
          text: "Threaten office referral and take the device away in front of peers.",
          score: -10,
          feedback: "Public removal + threat can intensify escalation and peer-maintained behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "KeKu chooses an option (reset or paper) and his breathing slows. He’s able to re-engage.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Coping and task re-entry are happening.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "KeKu stays in his spot but continues muttering and scanning for reactions.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stability; keep language brief and reduce audience attention.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "KeKu escalates—louder voice, unsafe hands, or moves toward peers for a reaction.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Risk is increasing; shift fully to safety/support procedures.", next: "step4" }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "Once KeKu is calm and participating again, what’s the best wrap-up?",
      choices: {
        A: {
          text: "Reinforce coping + re-entry with a Chart Move and a brief praise (“Nice reset / nice switch to paper”).",
          score: 10,
          feedback: "Perfect. Reinforces the skill you want when frustration hits.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement to avoid making it a big deal.",
          score: 0,
          feedback: "Neutral; coping happened, but it won’t be strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Rehash what he did wrong and require an apology before continuing.",
          score: -10,
          feedback: "High language + attention can restart escalation and make tech a trigger.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Frustration Coping Strengthened",
      text: "KeKu used a coping option (reset or alternative task) and rejoined successfully; coping was reinforced with a Chart Move."
    },
    mixed: {
      title: "Mixed – Re-Engaged, But Not Strengthened",
      text: "KeKu returned to task, but without reinforcement the coping routine may not generalize."
    },
    fail: {
      title: "Fail – Escalation Reinforced",
      text: "Public attention, threats, or shame increased escalation and made future tech glitches more likely to trigger unsafe behavior."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 5 — Guest / Observation Day (Performance + Peer Attention)
 **************************************************/
POOL.wild.push({
  id: "wild_5_guest_observation_day",
  title: "Wildcard Mission: Guest in the Room",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "A visitor (admin/counselor/observer) enters and sits in the back of the room. KeKu notices instantly. He starts narrating loudly, making jokes, and watching peers to see if they laugh.",
      choices: {
        A: {
          text: "Pre-correct quietly and keep routine: “Same expectations. Start with #1.” Then give the visitor a quick, neutral update out of earshot if needed.",
          score: 10,
          feedback: "Excellent. You avoid spotlighting KeKu and keep structure predictable.",
          next: "step2A"
        },
        B: {
          text: "Tell the visitor, in front of KeKu, “He sometimes struggles with behavior.”",
          score: 0,
          feedback: "Neutral, but it can create a performance stage and reinforce peer attention behavior.",
          next: "step2B"
        },
        C: {
          text: "Publicly correct KeKu: “Stop trying to show off because someone is here.”",
          score: -10,
          feedback: "Public calling-out increases attention and can escalate into KYHFOOTY behaviors.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "KeKu quiets slightly and starts the task, but keeps glancing at the visitor.",
      choices: {
        A: {
          text: "Tighten reinforcement: provide a quick, low-key Chart Move when he initiates and stays on-task for a short interval.",
          score: 10,
          feedback: "Perfect. Reinforces task initiation under ‘audience’ conditions.",
          next: "step3A"
        },
        B: {
          text: "Ignore all of it so it doesn’t become a big deal.",
          score: 0,
          feedback: "Neutral; could work, but you might miss a key reinforcement opportunity.",
          next: "step3B"
        },
        C: {
          text: "Give him lots of reminders about the visitor watching.",
          score: -10,
          feedback: "Too much attention and talk can maintain the performance.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "KeKu smirks and announces, “See? They’re talking about me!” Peers look over and laugh.",
      choices: {
        A: {
          text: "Repair fast: shift peer attention back to work, then quietly cue KeKu: “Start with #1.”",
          score: 10,
          feedback: "Good recovery—cuts off audience reinforcement and resets expectations.",
          next: "step3A"
        },
        B: {
          text: "Explain to KeKu and the visitor what you meant.",
          score: 0,
          feedback: "Neutral, but it keeps the attention on him.",
          next: "step3B"
        },
        C: {
          text: "Argue with him or correct him publicly.",
          score: -10,
          feedback: "Public interaction escalates the performance and increases risk behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "KeKu escalates—louder jokes, moving toward peers, body language stiffening like he might bump/kick for laughs.",
      choices: {
        A: {
          text: "Safety + de-escalation: reduce the peer audience, use minimal language (“Back.” “With me.”), and redirect to a defined spot; signal support if needed.",
          score: 10,
          feedback: "Correct. You prevent reinforcement and prioritize safety without adding intensity.",
          next: "step3A"
        },
        B: {
          text: "Tell him to calm down and behave because a guest is here.",
          score: 0,
          feedback: "Neutral; may not reduce risk quickly.",
          next: "step3B"
        },
        C: {
          text: "Threaten consequences loudly so the guest sees you’re in control.",
          score: -10,
          feedback: "Public threats + audience often escalate behavior and increase peer attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "KeKu stabilizes and works within expectations even with the visitor present.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Great regulation under attention pressure.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "KeKu works intermittently but keeps trying to pull attention toward himself.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stability; keep reinforcement tight and avoid public attention.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "KeKu escalates further—unsafe proximity, louder voice, or attempts to provoke peers.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Risk rising; follow safety/support procedures.", next: "step4" }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you end the observation period to support future success?",
      choices: {
        A: {
          text: "Reinforce regulation and on-task behavior with a Chart Move and a short, private praise (“You handled the guest day well”).",
          score: 10,
          feedback: "Excellent. Reinforces coping under ‘audience’ conditions without spotlighting.",
          ending: "success"
        },
        B: {
          text: "End class as normal without reinforcement.",
          score: 0,
          feedback: "Neutral; does not strengthen future guest-day coping.",
          ending: "mixed"
        },
        C: {
          text: "Discuss his attention-seeking in front of the visitor and peers.",
          score: -10,
          feedback: "Public processing can reinforce performance behavior and increase future risk.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Guest Day Coping Reinforced",
      text: "KeKu stayed regulated and engaged with routines even with a visitor present, and coping was reinforced privately."
    },
    mixed: {
      title: "Mixed – Got Through It",
      text: "KeKu managed, but without reinforcement guest days may still trigger attention-seeking."
    },
    fail: {
      title: "Fail – Audience Reinforced Escalation",
      text: "Public attention and threats turned the guest into a performance trigger, increasing risk of unsafe behavior."
    }
  }
});

/* ============================================================
   DYNAMIC MISSION BUILDER — ADAPTED FOR BRANCHING
   ============================================================ */
function renderIntroCards() {
  scenarioTitle.textContent = "Behavior Intervention Simulator";

  storyText.innerHTML = `Welcome to Mission: Reinforceable.
You’ll step through short scenarios based on your student's Behavior Plan.

<strong>Choose your mission below.</strong>`;

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
      <div class="action"><button id="btn-random">Start Mystery Mission▶</button></div>
    </div>
  `;

  const container = document.createElement('div');
  container.className = 'mission-intro';
  container.appendChild(menu);

  choicesDiv.innerHTML = '';
  choicesDiv.appendChild(container);

  showFeedback("The Wizard will chime in after every move.", "correct", +10);

  const rnd = srandom(seedFromDate());
  document.getElementById('btn-drill').onclick  = () => { resetGame(); startDynamicMission('Daily Drill',   pickScenario(POOL.daily, rnd)); };
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

if (pct >= 80) {
  actionSteps = `
    <ul>
      <li>Keep front-loading supports before known triggers (whole group, transitions, downtime).</li>
      <li>Stay consistent with short, neutral directions and two-choice prompts instead of “no.”</li>
      <li>Continue reinforcing quickly with Chart Moves for safe hands/body, task start, and appropriate requests (keep it private).</li>
      <li>When early signs show up, your quick reset + redirection is working—keep that timing.</li>
    </ul>`;
} 
else if (pct >= 50) {
  actionSteps = `
    <ul>
      <li>Add pre-corrections earlier—especially before line, unstructured time, and new activities.</li>
      <li>Prompt the replacement behavior sooner (hand raise → request break/help/alternative) before peers become the audience.</li>
      <li>Shorten your language to one clear step and reinforce immediately with a Chart Move when he responds.</li>
      <li>If attention-seeking starts, shift to reducing the audience rather than explaining.</li>
    </ul>`;
} 
else {
  actionSteps = `
    <ul>
      <li>Rebuild the proactive setup: clear expectations, defined space, and a visible “how to earn” path.</li>
      <li>Practice the replacement script outside of tough moments so it’s ready during escalation.</li>
      <li>During escalation, use minimal language and predictable reset options—avoid public correction or debates.</li>
      <li>If there’s KYHFOOTY or leaving-area risk, follow the safety steps exactly: create space, maintain line-of-sight, get support (no chasing or blocking).</li>
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
