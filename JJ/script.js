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

  // CB (attention-maintained yelling/destruction/elopement) — updated summary statement

if (pct >= 80) {
  return "High fidelity. You stayed calm and brief, reduced the audience, and used one-step prompts plus choices. CB had a clear earn path (calm minute or 3 prompts) and you reinforced quickly with the break or full-size pencil.";
}
if (pct >= 50) {
  return "Getting there. Use fewer words and move faster into the plan: one-step prompt, quick choice, and the earn path right away (one calm minute or 3 prompts). Reinforce immediately when CB uses safe hands, stays in space, lowers voice, or follows the prompt.";
}
return "Not aligned yet. Reset your approach: minimal language, avoid public corrections or debates, and go straight to predictable steps (hands safe, in your space, calm minute or prompt count). Reduce the audience first. If elopement or unsafe behavior starts, follow the safety steps exactly (notify the teams group, create space, maintain line-of-sight, get support. Do not chase or block).";
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

  // === GET STUDENT FROM URL (e.g. ?student=CB) ===
  const url = new URL(window.location.href);
  const student = url.searchParams.get("student") || "CB";

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
 * DAILY SCENARIO 6 — Independent Work Start (Refusal + Attention Bids)
 **************************************************/
POOL.daily.push({
  id: "daily_6_independent_work_start_refusal",
  title: "Daily Mission: Start Independent Work",
  start: "step1",
  steps: {

    step1: {
      text: "You pass out a short independent task. CB looks at the paper, says, “No,” and starts tapping the desk and looking around for reactions.",
      choices: {
        A: {
          text: "Ignore the refusal and give one 1-step prompt: “Write your name.” Then offer a choice: “Pencil or marker?”",
          score: 10,
          feedback: "Great fidelity. One-step direction plus choice reduces arguing and gets him started without spotlighting.",
          next: "step2A"
        },
        B: {
          text: "Explain why he needs to do the work and remind him it is easy.",
          score: 0,
          feedback: "Neutral. Longer talking can become attention and increase refusal.",
          next: "step2B"
        },
        C: {
          text: "Publicly correct: “CB, stop refusing and do it now.”",
          score: -10,
          feedback: "Public correction can increase attention and escalate yelling or destruction.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB writes his name, but he huffs and starts to crumple the corner of the paper.",
      choices: {
        A: {
          text: "Calm 1-step prompt: “Hands safe.” Then: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. Clear expectation plus DRL minute path to reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Ignore the crumpling and keep circulating.",
          score: 0,
          feedback: "Neutral. Avoids attention, but destruction can increase without a prompt.",
          next: "step3B"
        },
        C: {
          text: "Take the paper and lecture him about ruining materials.",
          score: -10,
          feedback: "Long attention can reinforce the behavior and increase escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB raises his voice: “I’m NOT doing it!” and peers glance over.",
      choices: {
        A: {
          text: "Reduce the audience and return to the plan: one calm prompt near him, “Write your name.” Then offer the break path: “Three followed prompts earns a break.”",
          score: 10,
          feedback: "Great repair. Short, neutral, and restores the earn path quickly.",
          next: "step3A"
        },
        B: {
          text: "Repeat the explanation and negotiate.",
          score: 0,
          feedback: "Neutral. Negotiation can keep attention on refusal.",
          next: "step3B"
        },
        C: {
          text: "Threaten loss of Chromebook or crayons immediately.",
          score: -10,
          feedback: "Threats often escalate attention-maintained behavior during refusal.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB yells louder and pushes the paper away so others can see.",
      choices: {
        A: {
          text: "Shift class attention away, then quietly cue: “In your space.” Offer: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. Removes the spotlight and returns to the DRL routine.",
          next: "step3A"
        },
        B: {
          text: "Stand over him and repeat demands several times.",
          score: 0,
          feedback: "Neutral. Repeated commands can become attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and address CB publicly.",
          score: -10,
          feedback: "Creates a stage and increases yelling and disruption.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB settles in his space and follows the next prompt with a calmer body.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is back in the plan. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB is quieter but still testing with small loud comments and paper fiddling.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Some stabilization, but he may need faster reinforcement for calm behavior.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates, and peers remain focused on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention is increasing and escalation is more likely.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up this start-of-work moment?",
      choices: {
        A: {
          text: "Reinforce immediately when he follows the prompt and keeps hands safe: praise + earned break (full-size pencil or 1-minute break).",
          score: 10,
          feedback: "Perfect. Immediate reinforcement strengthens prompt-following and safe hands.",
          ending: "success"
        },
        B: {
          text: "Wait until later to reinforce even though he complied now.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement is weaker for building routines.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the refusal publicly after he complies.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Work Start Reinforced", text: "CB started the task and earned reinforcement for prompt-following and safe hands." },
    mixed: { title: "Mixed – Started, Weak Reinforcement", text: "CB started, but reinforcement timing was unclear, reducing future consistency." },
    fail: { title: "Fail – Spotlight Increased", text: "Public attention and conflict increased escalation risk and disrupted independent work." }
  }
});


/*************************************************
 * DAILY SCENARIO 7 — Throwing a Small Item (Attention Escalation)
 **************************************************/
POOL.daily.push({
  id: "daily_7_throwing_small_item_attention",
  title: "Daily Mission: Keep Materials Safe",
  start: "step1",
  steps: {

    step1: {
      text: "During whole group, CB tosses a small item (eraser/pencil) onto the floor and looks around to see who noticed.",
      choices: {
        A: {
          text: "Use a calm 1-step prompt near him: “Hands safe.” Then offer an alternative: “Hold your pencil or put it in the tray.”",
          score: 10,
          feedback: "Great fidelity. Minimal attention and a clear replacement action for materials.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “Please don’t throw,” from the front of the room.",
          score: 0,
          feedback: "Neutral. It addresses the behavior, but can still give attention and does not provide a clear replacement.",
          next: "step2B"
        },
        C: {
          text: "Stop the lesson and publicly scold CB for throwing.",
          score: -10,
          feedback: "Public correction turns it into a spotlight moment and can increase behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB stops, but he starts whisper-yelling to pull peer attention back.",
      choices: {
        A: {
          text: "Planned ignore the attention bid and start the DRL earn path: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. You avoid spotlighting and return to a clear earn routine.",
          next: "step3A"
        },
        B: {
          text: "Tell him to be quiet and explain why throwing is unsafe.",
          score: 0,
          feedback: "Neutral. Explanation can become attention and increase escalation.",
          next: "step3B"
        },
        C: {
          text: "Threaten immediate loss of a preferred item.",
          score: -10,
          feedback: "Threats can escalate yelling and destruction in attention-maintained patterns.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB tosses another item and smiles because peers are now watching.",
      choices: {
        A: {
          text: "Reduce the audience: continue reading to the group, move close, and quietly cue: “Hands safe. In space.”",
          score: 10,
          feedback: "Great repair. Removes the stage and gives a simple, consistent direction.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Don’t throw” again and monitor him closely.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and maintain the behavior.",
          next: "step3B"
        },
        C: {
          text: "Make him pick up the item immediately in front of peers while everyone waits.",
          score: -10,
          feedback: "Public correction can become an attention event and escalate.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB yells, “I DON’T CARE!” and pushes his chair loudly while looking at classmates.",
      choices: {
        A: {
          text: "Shift attention back to the lesson, then quietly cue: “In your space.” Offer: “Three followed prompts earns a break.”",
          score: 10,
          feedback: "Excellent repair. You remove the spotlight and restore the predictable earn path.",
          next: "step3A"
        },
        B: {
          text: "Tell him to stop yelling and keep repeating demands.",
          score: 0,
          feedback: "Neutral. Repeated attention can escalate the cycle.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in front of the class.",
          score: -10,
          feedback: "Debate is extended attention and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB sits in his space and keeps hands safe for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Desired behavior is happening. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB is quieter but still testing with small noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. He may need faster reinforcement for calm.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates again and peers are fully engaged.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience reinforcement increased escalation likelihood.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize support after materials are safe?",
      choices: {
        A: {
          text: "Reinforce immediately when he keeps hands safe and follows the prompt: praise + earned break.",
          score: 10,
          feedback: "Perfect. Reinforces safe materials and compliance.",
          ending: "success"
        },
        B: {
          text: "Wait until later to reinforce because the behavior was unsafe.",
          score: 0,
          feedback: "Neutral. Safety matters, but delayed reinforcement weakens the return-to-calm routine.",
          ending: "mixed"
        },
        C: {
          text: "Process the throwing publicly after he calms.",
          score: -10,
          feedback: "Public attention can restart the cycle next time.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Safe Materials Reinforced", text: "CB kept hands safe and earned reinforcement for calm behavior and compliance." },
    mixed: { title: "Mixed – Calmed, Weak Reinforcement", text: "CB stabilized, but reinforcement timing was unclear." },
    fail: { title: "Fail – Spotlight Increased Escalation", text: "Public attention increased the payoff for throwing and yelling." }
  }
});


/*************************************************
 * DAILY SCENARIO 8 — Restoration After Tearing (Teach When Calm)
 **************************************************/
POOL.daily.push({
  id: "daily_8_restoration_after_tearing",
  title: "Daily Mission: Restore and Re-Teach",
  start: "step1",
  steps: {

    step1: {
      text: "CB tore a paper earlier and is now calm. The class is working quietly. You need to follow through with restoration and re-teaching.",
      choices: {
        A: {
          text: "Keep it private and brief: “Fix it.” Then model: “Hands safe.” Have him tape/replace the paper and immediately praise completion.",
          score: 10,
          feedback: "Great fidelity. Restoration is calm, private, and paired with a quick re-teach.",
          next: "step2A"
        },
        B: {
          text: "Talk through the whole incident with him for several minutes to make sure he understands.",
          score: 0,
          feedback: "Neutral. Reflection can help, but extended attention can make the incident more reinforcing.",
          next: "step2B"
        },
        C: {
          text: "Address the class about what CB did so everyone learns a lesson.",
          score: -10,
          feedback: "Public attention turns restoration into a spotlight and can increase future behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB tapes the paper and stays calm, watching to see what happens next.",
      choices: {
        A: {
          text: "Reinforce immediately: “Nice fixing it.” Offer the earn path back to break: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. Reinforces restoration and reconnects him to the positive routine.",
          next: "step3A"
        },
        B: {
          text: "Say “Okay” and move on with no reinforcement.",
          score: 0,
          feedback: "Neutral. He complied, but the replacement behavior is not strengthened.",
          next: "step3B"
        },
        C: {
          text: "Bring up the tearing again as a warning even though he fixed it.",
          score: -10,
          feedback: "Reintroduces attention to problem behavior and can restart escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB starts getting wiggly and louder as the conversation goes on and peers start to notice.",
      choices: {
        A: {
          text: "Cut it short and return to one step: “Tape it.” Then praise when done.",
          score: 10,
          feedback: "Great repair. Short language reduces attention and restores calm completion.",
          next: "step3A"
        },
        B: {
          text: "Keep talking until he says he understands.",
          score: 0,
          feedback: "Neutral. Continued attention can increase the payoff.",
          next: "step3B"
        },
        C: {
          text: "Correct him publicly for getting loud during the conversation.",
          score: -10,
          feedback: "Public correction increases attention and can escalate behavior.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB smiles because peers are watching and he starts to get louder again.",
      choices: {
        A: {
          text: "Shift class attention away and handle restoration privately: “Fix it.” Reinforce when completed.",
          score: 10,
          feedback: "Excellent repair. Removes the stage and keeps restoration calm and brief.",
          next: "step3A"
        },
        B: {
          text: "Ask the class to wait while CB fixes it.",
          score: 0,
          feedback: "Neutral. It may work, but it increases audience attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture the class about respect for materials.",
          score: -10,
          feedback: "Big attention moment tied to CB’s behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB completes restoration and stays calm for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Restoration + calm behavior occurred. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB completes it but stays attention-seeking with small noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement timing may need to be tighter.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates again and peers refocus on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Public attention increased escalation risk.", next: "step4" } }
    },

    step4: {
      text: "How do you conclude restoration and re-teaching?",
      choices: {
        A: {
          text: "Give specific praise and reconnect to reinforcement: “Nice fixing it and keeping hands safe.” Then deliver earned break after the calm minute.",
          score: 10,
          feedback: "Perfect. Reinforces restoration and calm behavior without spotlighting.",
          ending: "success"
        },
        B: {
          text: "Let him return with no reinforcement since he had to restore.",
          score: 0,
          feedback: "Neutral. He complied, but the routine is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the behavior publicly as he returns to work.",
          score: -10,
          feedback: "Public attention can restart the cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Restoration Strengthened", text: "CB restored materials calmly and earned reinforcement for safe hands and calm behavior." },
    mixed: { title: "Mixed – Restored, Weak Reinforcement", text: "CB restored, but reinforcement was unclear, reducing future buy-in." },
    fail: { title: "Fail – Restoration Became a Stage", text: "Public attention increased the payoff and raised escalation risk." }
  }
});


/*************************************************
 * DAILY SCENARIO 9 — Choice + Limited Task (Prevent Escalation)
 **************************************************/
POOL.daily.push({
  id: "daily_9_choice_limited_task_prevent_escalation",
  title: "Daily Mission: Choice and Limited Task",
  start: "step1",
  steps: {

    step1: {
      text: "CB starts to get loud when you introduce a longer reading response. He says, “That’s too much!” and looks around to see if anyone reacts.",
      choices: {
        A: {
          text: "Limit the task + choice: “Do two sentences.” Then: “Do you want to write or dictate to me?”",
          score: 10,
          feedback: "Great fidelity. Task is limited and choice supports compliance without a power struggle.",
          next: "step2A"
        },
        B: {
          text: "Say, “It’s not too much, just try,” and keep explaining the assignment.",
          score: 0,
          feedback: "Neutral. It may not reduce the trigger and can increase attention to complaining.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop whining,” in front of peers.",
          score: -10,
          feedback: "Public correction increases attention and can escalate yelling and destruction.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB chooses to dictate, but he starts tapping and trying to pull your attention away from the task.",
      choices: {
        A: {
          text: "Keep it one step: “Say sentence one.” Reinforce after completion: “Nice work.” Start the 1-minute calm goal for a break.",
          score: 10,
          feedback: "Excellent. One-step prompts keep momentum and reinforcement stays immediate.",
          next: "step3A"
        },
        B: {
          text: "Give multiple directions at once to hurry him along.",
          score: 0,
          feedback: "Neutral. Too many directions can increase refusal and attention bids.",
          next: "step3B"
        },
        C: {
          text: "Correct the tapping and lecture about staying focused.",
          score: -10,
          feedback: "Extended attention can reinforce the attention bid and slow task completion.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB gets louder and starts ripping the corner of his paper while peers watch.",
      choices: {
        A: {
          text: "Reduce audience and return to plan: quiet 1-step prompt near him, “Hands safe.” Then offer the limited task choice again.",
          score: 10,
          feedback: "Great repair. Minimal attention, safe hands prompt, and a clear path back.",
          next: "step3A"
        },
        B: {
          text: "Tell him to stop and keep explaining the assignment.",
          score: 0,
          feedback: "Neutral. The attention cycle may continue without task-limiting and choice.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and address CB’s behavior publicly.",
          score: -10,
          feedback: "Public attention increases escalation and disrupts learning.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB yells louder and knocks a paper off the desk to get attention.",
      choices: {
        A: {
          text: "Shift class attention away, then quietly cue: “In your space.” Offer: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. Removes the stage and returns to the DRL reinforcement path.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands and tell him to stop yelling.",
          score: 0,
          feedback: "Neutral. Repeated attention can escalate behavior.",
          next: "step3B"
        },
        C: {
          text: "Threaten immediate removal of items in front of peers.",
          score: -10,
          feedback: "Threats can increase yelling and destruction in attention patterns.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB completes the limited task and stays calmer.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Task completion occurred with appropriate supports. Reinforce now.", next: "step4" } }
    },

    step3B: {
      text: "CB completes part of it but keeps seeking attention with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Some progress, but reinforcement may need to be quicker and clearer.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates and stops working entirely.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention and conflict increased escalation risk.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize this task moment?",
      choices: {
        A: {
          text: "Reinforce immediately: praise + earned break (full-size pencil or 1-minute break) after the calm minute.",
          score: 10,
          feedback: "Perfect. Reinforcement is immediate and tied to compliance and calm behavior.",
          ending: "success"
        },
        B: {
          text: "Praise later but skip the earned break.",
          score: 0,
          feedback: "Neutral. Praise helps, but it weakens the reinforcement routine.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the earlier escalation publicly as a warning.",
          score: -10,
          feedback: "Public attention can restart yelling and destruction.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Choice and Limits Worked", text: "CB completed a limited task with choices and earned reinforcement for calm compliance." },
    mixed: { title: "Mixed – Partial Success", text: "CB completed some work, but reinforcement was weaker than planned." },
    fail: { title: "Fail – Escalation Increased", text: "Public attention and conflict increased yelling, destruction, and refusal." }
  }
});


/*************************************************
 * DAILY SCENARIO 10 — Using the Prompt Count (3 Prompts or 5 Prompts)
 **************************************************/
POOL.daily.push({
  id: "daily_10_prompt_count_break_system",
  title: "Daily Mission: Prompt Count Routine",
  start: "step1",
  steps: {

    step1: {
      text: "CB is starting to escalate during whole group. You need him to follow directions without turning it into a long interaction.",
      choices: {
        A: {
          text: "Use one-step prompts and count silently. After he follows 3 prompts, deliver the break immediately with praise.",
          score: 10,
          feedback: "Great fidelity. This matches the plan: brief prompts, no debate, reinforce quickly once compliant.",
          next: "step2A"
        },
        B: {
          text: "Give multiple-step directions to speed things up.",
          score: 0,
          feedback: "Neutral. Too much language can increase refusal and attention bids.",
          next: "step2B"
        },
        C: {
          text: "Keep correcting loudly until he complies.",
          score: -10,
          feedback: "Public attention can escalate yelling and increase disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB follows three one-step prompts in a row, but he is still tense and watching peers.",
      choices: {
        A: {
          text: "Deliver the break immediately and keep it low-key: “Nice following directions.” Then reset the calm minute goal.",
          score: 10,
          feedback: "Excellent. Immediate reinforcement strengthens compliance and reduces escalation.",
          next: "step3A"
        },
        B: {
          text: "Delay the break to make sure he really means it.",
          score: 0,
          feedback: "Neutral. Delayed reinforcement weakens the system and can increase future refusal.",
          next: "step3B"
        },
        C: {
          text: "Use the moment to lecture about how he should behave all the time.",
          score: -10,
          feedback: "Extended attention can reignite escalation and attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB looks confused and starts yelling, “I don’t know what you want!” Peers look over.",
      choices: {
        A: {
          text: "Repair: go back to one clear 1-step prompt and reduce audience attention. Offer the 3-prompts-to-break path.",
          score: 10,
          feedback: "Great repair. Simpler directions restore compliance and reduce escalation.",
          next: "step3A"
        },
        B: {
          text: "Repeat the multiple steps again, slower.",
          score: 0,
          feedback: "Neutral. Still heavy language that can maintain attention bids.",
          next: "step3B"
        },
        C: {
          text: "Publicly tell him he is being difficult.",
          score: -10,
          feedback: "Public attention increases yelling and disruption.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB escalates and starts slamming materials while peers watch.",
      choices: {
        A: {
          text: "Shift class attention away, give a quiet 1-step prompt: “Hands safe.” Then cue: “In your space.” Return to the calm minute earn path.",
          score: 10,
          feedback: "Excellent repair. Removes the stage and returns to predictable steps.",
          next: "step3A"
        },
        B: {
          text: "Stand over him and keep repeating demands.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Send him out immediately as the primary response.",
          score: -10,
          feedback: "Removal can become a predictable escape and attention outcome and breaks the reinforcement routine.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB follows the next prompt and settles back into his space with a calmer body.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Compliance and recovery occurred. Keep reinforcement immediate.", next: "step4" } }
    },

    step3B: {
      text: "CB complies inconsistently and keeps attention-seeking with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement may need to be faster and clearer.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates and the audience effect grows.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention payoff increased escalation risk.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up this prompt-count routine?",
      choices: {
        A: {
          text: "Deliver the break immediately after the prompt goal is met, plus specific praise, then return to instruction.",
          score: 10,
          feedback: "Perfect. Strengthens following one-step prompts and reduces future refusal.",
          ending: "success"
        },
        B: {
          text: "Praise him but skip the break even though he met the goal.",
          score: 0,
          feedback: "Neutral. Praise helps, but the system becomes less predictable.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier behavior publicly as the class watches.",
          score: -10,
          feedback: "Public attention can restart yelling, slamming, and elopement attempts.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Prompt Count Reinforced", text: "CB followed one-step prompts and earned immediate reinforcement, strengthening compliance routines." },
    mixed: { title: "Mixed – Routine Was Inconsistent", text: "CB complied some, but reinforcement timing was weaker than planned." },
    fail: { title: "Fail – Audience Increased Escalation", text: "Public attention and conflict increased yelling, destruction, and refusal." }
  }
});

/*************************************************
 * CRISIS SCENARIO 1 — Elopement Attempt (Follow With Line-of-Sight)
 **************************************************/
POOL.crisis.push({
  id: "crisis_1_elopement_attempt_line_of_sight",
  title: "Crisis Drill: Elopement Attempt",
  start: "step1",
  steps: {

    step1: {
      text: "CB bolts up during the afternoon block and heads toward the door yelling, “I’M DONE!” A few students stare.",
      choices: {
        A: {
          text: "Notify the teams group immediately and follow with line-of-sight. Use one calm 1-step prompt: “Stop.” Then: “Back to your space.”",
          score: 10,
          feedback: "Great fidelity. You follow the crisis plan and keep language minimal while maintaining safety.",
          next: "step2A"
        },
        B: {
          text: "Call after him, “Come back right now!” while staying with the class.",
          score: 0,
          feedback: "Neutral. You are trying to keep instruction going, but it may not match the crisis plan to follow with line-of-sight.",
          next: "step2B"
        },
        C: {
          text: "Run after him quickly and raise your voice in the hallway.",
          score: -10,
          feedback: "High intensity can escalate attention-maintained behavior and increase risk during elopement.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB slows near the doorway and looks back to see what you will do.",
      choices: {
        A: {
          text: "Offer a simple choice: “Walk back to your space or sit in your space.” Reinforce the first step back immediately.",
          score: 10,
          feedback: "Excellent. Choice supports compliance and you reinforce recovery quickly.",
          next: "step3A"
        },
        B: {
          text: "Explain why he cannot leave and list rules.",
          score: 0,
          feedback: "Neutral. Longer talking can become attention and extend the episode.",
          next: "step3B"
        },
        C: {
          text: "Talk about how he embarrassed himself in front of peers.",
          score: -10,
          feedback: "Public attention and shame can increase escalation and refusal.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB keeps moving slowly while glancing back, clearly watching for a bigger reaction.",
      choices: {
        A: {
          text: "Switch to the crisis plan: notify teams group now and follow with line-of-sight. Use one calm prompt: “Back to your space.”",
          score: 10,
          feedback: "Great repair. You get back to the plan quickly and reduce attention.",
          next: "step3A"
        },
        B: {
          text: "Keep calling his name repeatedly from the classroom.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and may not support safe return.",
          next: "step3B"
        },
        C: {
          text: "Tell the class to watch him so he stops.",
          score: -10,
          feedback: "Creates an audience and increases attention payoff.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB speeds up and yells louder as you rush toward him. More students look up.",
      choices: {
        A: {
          text: "Repair: reduce intensity, follow with line-of-sight, and use one calm prompt: “Stop.” Then: “Back to your space.”",
          score: 10,
          feedback: "Excellent repair. You de-escalate your approach and return to predictable steps.",
          next: "step3A"
        },
        B: {
          text: "Keep rushing after him and repeating demands.",
          score: 0,
          feedback: "Neutral. It may stop him, but it increases attention and intensity.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences while walking after him.",
          score: -10,
          feedback: "Debate increases attention and extends the episode.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB turns back toward the room and starts moving to his space.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Return-to-space is happening. Reinforce quickly.", next: "step4" }
      }
    },

    step3B: {
      text: "CB returns but continues loud comments, trying to keep attention on him.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial recovery. He may need immediate reinforcement for returning.", next: "step4" }
      }
    },

    step3C: {
      text: "CB continues toward the hall, louder and more attention-driven.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Audience effect is increasing and elopement risk is higher.", next: "step4" }
      }
    },

    step4: {
      text: "How do you finalize support once he returns to space?",
      choices: {
        A: {
          text: "Reinforce immediately: “Nice coming back.” Start the 1-minute calm goal and deliver the earned break (full-size pencil).",
          score: 10,
          feedback: "Perfect. Reinforces recovery and staying in space with the planned system.",
          ending: "success"
        },
        B: {
          text: "Let him return without reinforcement since it was unsafe.",
          score: 0,
          feedback: "Neutral. Safety matters, but reinforcement strengthens the return-to-space behavior.",
          ending: "mixed"
        },
        C: {
          text: "Review the incident publicly in front of the class.",
          score: -10,
          feedback: "Public attention can increase future elopement attempts.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Safe Return Reinforced", text: "CB returned to space and earned reinforcement for recovery and calm behavior." },
    mixed: { title: "Mixed – Returned, Weak Reinforcement", text: "CB returned safely, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Audience Increased Risk", text: "Public attention increased the payoff and raised future elopement risk." }
  }
});


/*************************************************
 * CRISIS SCENARIO 2 — Escalating Yelling (Reduce Audience + Earn Path)
 **************************************************/
POOL.crisis.push({
  id: "crisis_2_escalating_yelling_reduce_audience",
  title: "Crisis Drill: Escalating Yelling",
  start: "step1",
  steps: {

    step1: {
      text: "CB begins yelling loudly during instruction. Peers stare and the room’s attention shifts toward him.",
      choices: {
        A: {
          text: "Keep class attention moving, then cue CB quietly: “Voice low.” Offer the earn path: “One calm minute earns a break.”",
          score: 10,
          feedback: "Great fidelity. You reduce the audience and give a clear reinforcement path without debating.",
          next: "step2A"
        },
        B: {
          text: "Tell him from the front, “Stop yelling,” and pause instruction.",
          score: 0,
          feedback: "Neutral. It addresses the behavior but can increase attention during attention-maintained yelling.",
          next: "step2B"
        },
        C: {
          text: "Correct him publicly and lecture about respect.",
          score: -10,
          feedback: "Public attention can intensify yelling and keep the cycle going.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB lowers volume briefly but starts trying to pull attention back with louder comments.",
      choices: {
        A: {
          text: "Use one calm prompt: “In your space.” Then restart the 1-minute calm goal to earn the break.",
          score: 10,
          feedback: "Excellent. One step plus the DRL routine keeps the response predictable.",
          next: "step3A"
        },
        B: {
          text: "Explain again why yelling is not okay.",
          score: 0,
          feedback: "Neutral. Explanation can become attention and extend the episode.",
          next: "step3B"
        },
        C: {
          text: "Threaten immediate loss of items to make it stop.",
          score: -10,
          feedback: "Threats can increase escalation and attention bids.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB gets louder because the class is watching. He starts yelling over you again.",
      choices: {
        A: {
          text: "Repair: shift your attention back to instruction, then quietly cue: “Voice low.” Offer: “3 followed prompts earns a break.”",
          score: 10,
          feedback: "Great repair. You cut the spotlight and return to the plan’s reinforcement structure.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating “Stop yelling” until he stops.",
          score: 0,
          feedback: "Neutral. Repetition can become a reliable attention routine.",
          next: "step3B"
        },
        C: {
          text: "Stop the lesson and address CB in front of everyone.",
          score: -10,
          feedback: "Creates a stage and increases the payoff for yelling.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB escalates further and peers are fully engaged with him.",
      choices: {
        A: {
          text: "Notify the teams group and stay close while keeping class attention away. Use one calm prompt: “In your space.”",
          score: 10,
          feedback: "Excellent. You follow the crisis plan and reduce audience attention while maintaining safety.",
          next: "step3A"
        },
        B: {
          text: "Tell him to apologize to the class right now.",
          score: 0,
          feedback: "Neutral. It may be appropriate later, but in the moment it can add attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences and keep correcting publicly.",
          score: -10,
          feedback: "Extended public attention increases escalation and disruption.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB lowers his voice and stays in his space for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is back in the routine. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB is quieter but keeps testing with loud comments.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. He may need faster reinforcement for calm behavior.", next: "step4" } }
    },

    step3C: {
      text: "CB continues yelling and peers keep watching.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention payoff increased escalation risk.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize once he calms?",
      choices: {
        A: {
          text: "Deliver the earned break immediately once he meets the calm minute or prompt goal and give specific praise.",
          score: 10,
          feedback: "Perfect. Immediate reinforcement strengthens calm behavior and participation.",
          ending: "success"
        },
        B: {
          text: "Let things move on without reinforcement since it was disruptive.",
          score: 0,
          feedback: "Neutral. Calm, but it weakens the motivation to return to calm next time.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the yelling publicly after he calms.",
          score: -10,
          feedback: "Public attention can restart the cycle in the next trigger moment.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Yelling De-escalated", text: "CB returned to calm behavior and earned reinforcement through the planned DRL and prompt system." },
    mixed: { title: "Mixed – Calmed, Weak Reinforcement", text: "CB stabilized, but reinforcement was unclear, reducing future buy-in." },
    fail: { title: "Fail – Spotlight Maintained", text: "Public attention increased the payoff and raised escalation risk." }
  }
});


/*************************************************
 * CRISIS SCENARIO 3 — Destruction Escalation (Hands Safe + Teams Group)
 **************************************************/
POOL.crisis.push({
  id: "crisis_3_destruction_escalation_hands_safe",
  title: "Crisis Drill: Destruction Escalation",
  start: "step1",
  steps: {

    step1: {
      text: "CB begins ripping and crumpling materials while yelling. Students nearby are watching closely.",
      choices: {
        A: {
          text: "Notify the teams group. Use one calm prompt near him: “Hands safe.” Then cue: “In your space.”",
          score: 10,
          feedback: "Great fidelity. You follow the crisis plan and keep directions brief and safety-focused.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Stop destroying that,” and take the material away.",
          score: 0,
          feedback: "Neutral. Removing materials may help, but it can become attention-heavy if paired with talking.",
          next: "step2B"
        },
        C: {
          text: "Publicly scold him and make him explain why he is doing it.",
          score: -10,
          feedback: "Public attention and conflict often increase attention-maintained destruction.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB pauses ripping but keeps yelling to keep eyes on him.",
      choices: {
        A: {
          text: "Shift attention away and restart the earn path: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. You remove the spotlight and return to predictable reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Explain calmly why destroying is not okay.",
          score: 0,
          feedback: "Neutral. Explanation can become attention during escalation.",
          next: "step3B"
        },
        C: {
          text: "Threaten consequences immediately.",
          score: -10,
          feedback: "Threats can intensify yelling and destruction.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB escalates when you take the item and yells louder, now watching peers for reactions.",
      choices: {
        A: {
          text: "Repair: reduce interaction, notify teams group if not done, then use one calm prompt: “Hands safe.” Cue: “In your space.”",
          score: 10,
          feedback: "Great repair. Minimal language and consistent steps reduce attention payoff.",
          next: "step3A"
        },
        B: {
          text: "Keep trying to talk him through it to calm him down.",
          score: 0,
          feedback: "Neutral. Longer talking can keep the attention cycle active.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and address the behavior publicly.",
          score: -10,
          feedback: "Creates a stage and increases escalation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB yells, “I DON’T CARE!” and crumples more materials as the room watches.",
      choices: {
        A: {
          text: "Shift class attention away, stay close, and follow the crisis plan until support staff arrive. Keep prompts to one step only.",
          score: 10,
          feedback: "Excellent. You reduce audience reinforcement and maintain safety while waiting for support.",
          next: "step3A"
        },
        B: {
          text: "Demand an apology now.",
          score: 0,
          feedback: "Neutral. It may be appropriate later, but in the moment it can add attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in front of the class.",
          score: -10,
          feedback: "Extended public attention increases escalation and disruption.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB lowers volume and stops destroying materials for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safety improved. Reinforce quickly once calm.", next: "step4" } }
    },

    step3B: {
      text: "CB pauses but keeps attention bids going with loud comments.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. He may need the earn path stated again.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates again and peers stay focused on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention payoff remains high and escalation risk continues.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after the episode ends?",
      choices: {
        A: {
          text: "Once calm, do brief private restoration (replace/tape) and immediately reinforce safe hands and staying in space with the earned break.",
          score: 10,
          feedback: "Perfect. Restoration is calm and private, and reinforcement is immediate and plan-aligned.",
          ending: "success"
        },
        B: {
          text: "Restore later but do not reinforce since it was a big behavior.",
          score: 0,
          feedback: "Neutral. Restoration helps, but reinforcement strengthens the return-to-calm routine.",
          ending: "mixed"
        },
        C: {
          text: "Discuss the destruction publicly so everyone learns a lesson.",
          score: -10,
          feedback: "Public attention can increase future episodes.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Safety and Recovery Reinforced", text: "CB returned to safe hands and space, completed private restoration, and earned reinforcement for recovery." },
    mixed: { title: "Mixed – Restored, Weak Reinforcement", text: "Restoration occurred, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Attention Reignited", text: "Public processing increased attention payoff and raised future escalation risk." }
  }
});


/*************************************************
 * CRISIS SCENARIO 4 — Rapid Escalation After “No” (Ignore Refusal, Reinforce Compliance)
 **************************************************/
POOL.crisis.push({
  id: "crisis_4_rapid_escalation_after_no",
  title: "Crisis Drill: Rapid Escalation After Refusal",
  start: "step1",
  steps: {

    step1: {
      text: "You give a direction and CB says “No,” then immediately raises his voice to get attention. Peers begin watching.",
      choices: {
        A: {
          text: "Ignore the refusal. Give one calm 1-step prompt again. The moment he complies, reinforce immediately with the break routine.",
          score: 10,
          feedback: "Great fidelity. You avoid feeding refusal and reinforce compliance right away.",
          next: "step2A"
        },
        B: {
          text: "Ask why he said no and try to talk him into it.",
          score: 0,
          feedback: "Neutral. It can become a debate and increase attention to refusal.",
          next: "step2B"
        },
        C: {
          text: "Correct him publicly for refusing and yelling.",
          score: -10,
          feedback: "Public attention can intensify yelling and accelerate escalation.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB complies but stays tense, huffing and trying to draw attention with louder comments.",
      choices: {
        A: {
          text: "Restart the DRL routine: “One calm minute earns a break.” Keep your attention low and neutral.",
          score: 10,
          feedback: "Excellent. You strengthen calm behavior and reduce attention payoff.",
          next: "step3A"
        },
        B: {
          text: "Tell him he needs to stop huffing or he will lose the break.",
          score: 0,
          feedback: "Neutral. It may deter, but it can also increase attention and escalation.",
          next: "step3B"
        },
        C: {
          text: "Lecture about attitude now that he is listening.",
          score: -10,
          feedback: "Extended attention can reignite yelling and refusal.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB argues louder and more students look over.",
      choices: {
        A: {
          text: "Cut debate. Notify teams group if escalation is rising. Use one calm prompt: “In your space.”",
          score: 10,
          feedback: "Great repair. Minimal language and crisis support if needed reduces risk.",
          next: "step3A"
        },
        B: {
          text: "Keep negotiating until he agrees.",
          score: 0,
          feedback: "Neutral. Negotiation can reinforce arguing for attention.",
          next: "step3B"
        },
        C: {
          text: "Threaten consequences in front of peers.",
          score: -10,
          feedback: "Threats plus audience can escalate yelling and destruction.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB yells louder and starts pushing items on his desk.",
      choices: {
        A: {
          text: "Shift class attention away, stay close, and give one-step prompts focused on safety: “Hands safe.” “In space.”",
          score: 10,
          feedback: "Excellent. Reduces spotlight and keeps prompts safety-focused and brief.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands several times while standing over him.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Stop instruction and address CB publicly.",
          score: -10,
          feedback: "Public attention increases escalation risk and disrupts the class.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB lowers volume and stays in his space for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is stabilizing. Reinforce calm behavior quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB stabilizes but keeps small attention bids going.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. He may need the earn path stated again.", next: "step4" } }
    },

    step3C: {
      text: "CB continues yelling and pushing materials, keeping eyes on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention payoff remains high. Escalation may continue.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize once he complies and calms?",
      choices: {
        A: {
          text: "Reinforce immediately for compliance and calm behavior with the earned break (prompt goal or calm minute).",
          score: 10,
          feedback: "Perfect. Keeps the reinforcement system predictable and effective.",
          ending: "success"
        },
        B: {
          text: "Praise him later, but do not deliver the break even though he met the goal.",
          score: 0,
          feedback: "Neutral. Praise helps, but the system becomes less reliable.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the refusal and yelling publicly after he calms.",
          score: -10,
          feedback: "Public attention can restart the cycle next time.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Refusal Cycle Interrupted", text: "CB complied after brief prompts and earned reinforcement for calm behavior and recovery." },
    mixed: { title: "Mixed – Complied, Weak Reinforcement", text: "CB complied, but reinforcement timing was weaker than planned." },
    fail: { title: "Fail – Attention Maintained Escalation", text: "Public attention increased the payoff for refusal and yelling." }
  }
});


/*************************************************
 * CRISIS SCENARIO 5 — Multiple Behaviors (Yelling + Destruction + Elopement Risk)
 **************************************************/
POOL.crisis.push({
  id: "crisis_5_combo_episode_yell_destroy_elopement",
  title: "Crisis Drill: Combo Episode (Yell + Destroy + Elopement)",
  start: "step1",
  steps: {

    step1: {
      text: "CB yells, swipes materials off the desk, and starts moving toward the door. Several students freeze and watch.",
      choices: {
        A: {
          text: "Notify the teams group immediately. Maintain line-of-sight and keep prompts to one step: “Hands safe.” Then: “In your space.”",
          score: 10,
          feedback: "Great fidelity. You follow the crisis plan, prioritize safety, and avoid escalating with extra language.",
          next: "step2A"
        },
        B: {
          text: "Try to reason with him: “We can talk about this, just calm down,” while he moves.",
          score: 0,
          feedback: "Neutral. It is supportive, but it can add attention and may not match the crisis plan steps.",
          next: "step2B"
        },
        C: {
          text: "Raise your voice and focus on consequences in front of the class.",
          score: -10,
          feedback: "Public attention and intensity can accelerate escalation and elopement risk.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB pauses, still loud, and looks around for reactions. He is not destroying materials at this moment.",
      choices: {
        A: {
          text: "Reduce audience: keep the class moving with instruction, stay close, and repeat one prompt only if needed. When he re-enters space, offer “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. Removes spotlight and returns to the DRL reinforcement path once safe.",
          next: "step3A"
        },
        B: {
          text: "Explain the whole plan and how he can earn breaks.",
          score: 0,
          feedback: "Neutral. Too much language can keep the attention cycle active.",
          next: "step3B"
        },
        C: {
          text: "Demand he apologize right now to everyone.",
          score: -10,
          feedback: "Public processing can escalate and keeps the class focused on him.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB gets louder as you talk. He tries to pull you into a back-and-forth and takes another step toward the door.",
      choices: {
        A: {
          text: "Repair: stop talking, follow with line-of-sight, and use one calm prompt: “In your space.”",
          score: 10,
          feedback: "Great repair. Minimal interaction reduces attention payoff and supports safe return.",
          next: "step3A"
        },
        B: {
          text: "Keep talking and negotiating to calm him down.",
          score: 0,
          feedback: "Neutral. Negotiation can reinforce the behavior with attention and delay.",
          next: "step3B"
        },
        C: {
          text: "Call out his behavior so the whole class hears.",
          score: -10,
          feedback: "Creates a big audience moment and escalates risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB escalates further, yelling louder and knocking another item to the floor as peers watch.",
      choices: {
        A: {
          text: "Shift class attention away, stay with CB per crisis plan until support staff arrive, and keep prompts to safety only: “Hands safe.” “In space.”",
          score: 10,
          feedback: "Excellent. Safety first, minimal language, reduced audience, and crisis plan followed.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands multiple times while staying close.",
          score: 0,
          feedback: "Neutral. Repetition may add attention and intensity.",
          next: "step3B"
        },
        C: {
          text: "Lecture about consequences while students watch.",
          score: -10,
          feedback: "Extended public attention can lock in the behavior pattern.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB returns to his space and begins to lower his voice. He is no longer destroying materials.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Recovery is occurring. Reinforce quickly once calm.", next: "step4" } }
    },

    step3B: {
      text: "CB returns but continues loud comments, trying to keep attention on him.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial recovery. Earn path and immediate reinforcement may be needed.", next: "step4" } }
    },

    step3C: {
      text: "CB stays escalated and peers remain focused on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention payoff remains high and escalation may persist.", next: "step4" } }
    },

    step4: {
      text: "How do you finish support after the combo episode ends?",
      choices: {
        A: {
          text: "Once calm, do brief private restoration if needed and immediately reinforce staying in space and hands safe with the earned break.",
          score: 10,
          feedback: "Perfect. Calm restoration plus immediate reinforcement strengthens recovery routines.",
          ending: "success"
        },
        B: {
          text: "Let him return with no reinforcement since it was a big episode.",
          score: 0,
          feedback: "Neutral. Calm return is good, but reinforcement strengthens future recovery.",
          ending: "mixed"
        },
        C: {
          text: "Discuss the episode publicly so everyone understands.",
          score: -10,
          feedback: "Public attention increases the payoff and raises future escalation risk.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Crisis Plan Followed", text: "CB recovered with safety-focused prompts, support was notified, and reinforcement strengthened return-to-calm behavior." },
    mixed: { title: "Mixed – Safe, Weak Reinforcement", text: "CB recovered, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Audience Increased Escalation", text: "Public attention and extended interaction increased the payoff and raised future crisis risk." }
  }
});

/*************************************************
 * WILDCARD SCENARIO 1 — Surprise Assembly (High Attention Moment)
 **************************************************/
POOL.wild.push({
  id: "wild_1_surprise_assembly_cb",
  title: "Wildcard Mission: Surprise Assembly",
  start: "step1",
  steps: {

    step1: {
      text: "An unexpected announcement: the class must go to an assembly now. The room shifts quickly. CB gets excited, starts yelling, and tries to grab peers’ attention.",
      choices: {
        A: {
          text: "Pre-correct with one step and choice: “Line up.” Then: “Front of line or back of line?”",
          score: 10,
          feedback: "Great. One-step direction plus a simple choice keeps structure during a high-attention moment.",
          next: "step2A"
        },
        B: {
          text: "Say, “It’s okay, let’s go,” and rush the class out.",
          score: 0,
          feedback: "Neutral. It may move things along, but it does not proactively reduce yelling.",
          next: "step2B"
        },
        C: {
          text: "Publicly correct: “CB, stop yelling,” in front of everyone.",
          score: -10,
          feedback: "Public attention can increase yelling and escalation.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB lines up but continues loud comments to pull peers in.",
      choices: {
        A: {
          text: "Reduce the audience: keep the line moving and cue quietly near him: “Voice low.” Offer: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. You keep structure and return to the DRL earn path without spotlighting.",
          next: "step3A"
        },
        B: {
          text: "Keep watching him closely and remind him again and again.",
          score: 0,
          feedback: "Neutral. Monitoring helps, but repeated attention can maintain the behavior.",
          next: "step3B"
        },
        C: {
          text: "Stop the line and address CB in front of everyone.",
          score: -10,
          feedback: "Creates an audience event and can escalate yelling or elopement.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB drifts out of line to talk to peers and starts to yell louder as students look over.",
      choices: {
        A: {
          text: "Repair with one calm prompt near him: “In line.” Then offer a choice: “Stand by me or stand behind ___.”",
          score: 10,
          feedback: "Great repair. Minimal language, clear expectation, and choice to regain structure.",
          next: "step3A"
        },
        B: {
          text: "Repeat, “Get in line,” from across the room.",
          score: 0,
          feedback: "Neutral. It may work, but it can become attention from a distance.",
          next: "step3B"
        },
        C: {
          text: "Threaten a consequence loudly so he complies fast.",
          score: -10,
          feedback: "Public threats can escalate and increase attention bids.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB yells louder and knocks into a desk as classmates watch.",
      choices: {
        A: {
          text: "Shift class attention away, keep moving the group, and cue CB quietly: “In your space.” Offer the calm minute earn path.",
          score: 10,
          feedback: "Excellent. Removes the spotlight and returns to predictable steps.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating “Stop” and “Hurry” while standing over him.",
          score: 0,
          feedback: "Neutral. Repeated commands can add attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Stop and lecture him about behavior while the class waits.",
          score: -10,
          feedback: "Large attention event increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB stays with the line and lowers his voice for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is back in structure. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB is quieter but still testing with loud comments.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. Reinforcement may need to be faster.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates and peers remain focused on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience attention increased escalation.", next: "step4" } }
    },

    step4: {
      text: "At the assembly location, how do you support CB?",
      choices: {
        A: {
          text: "Reinforce immediately for staying with the line and using a low voice: praise + earned break (1 minute or full-size pencil).",
          score: 10,
          feedback: "Perfect. Reinforcement strengthens coping during high-attention transitions.",
          ending: "success"
        },
        B: {
          text: "Let him settle without reinforcement since it was hectic.",
          score: 0,
          feedback: "Neutral. Calm, but the coping behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Discuss his yelling publicly while others listen.",
          score: -10,
          feedback: "Public attention increases future yelling in assemblies.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Assembly Transition Managed", text: "CB followed structure and earned reinforcement for calm behavior during a high-attention event." },
    mixed: { title: "Mixed – Managed, Weak Reinforcement", text: "CB made it through, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Attention Fueled Escalation", text: "Public attention increased yelling and disrupted transitions." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 2 — Fire Drill (Noise + Movement Trigger)
 **************************************************/
POOL.wild.push({
  id: "wild_2_fire_drill_noise_cb",
  title: "Wildcard Mission: Fire Drill",
  start: "step1",
  steps: {

    step1: {
      text: "The fire alarm blares. Students jump up to line up. CB yells loudly and starts moving fast toward the door, pulling attention.",
      choices: {
        A: {
          text: "Use one calm prompt: “With me.” Then: “In line.” Keep language minimal and keep moving.",
          score: 10,
          feedback: "Great. Short prompts and close proximity reduce escalation and keep the transition safe.",
          next: "step2A"
        },
        B: {
          text: "Say, “It’s just a drill,” while directing the whole class.",
          score: 0,
          feedback: "Neutral. It may help some students, but CB may still escalate without a clear 1-step prompt.",
          next: "step2B"
        },
        C: {
          text: "Yell over the alarm: “CB, stop yelling!”",
          score: -10,
          feedback: "Public intensity during overwhelm can escalate quickly.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB stays close but keeps trying to yell comments to peers as the class moves.",
      choices: {
        A: {
          text: "Quiet cue near him: “Voice low.” Then set a calm goal: “One calm minute earns a break when we’re outside.”",
          score: 10,
          feedback: "Excellent. Private cue plus predictable reinforcement after safety is met.",
          next: "step3A"
        },
        B: {
          text: "Keep watching him closely the entire time.",
          score: 0,
          feedback: "Neutral. Monitoring helps, but it can become attention-heavy.",
          next: "step3B"
        },
        C: {
          text: "Stop the line and correct CB while everyone waits.",
          score: -10,
          feedback: "Creates an audience event and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB speeds up and drifts from the line to look at peers while yelling.",
      choices: {
        A: {
          text: "Repair with one calm prompt near him: “In line.” Offer a quick choice: “By me or behind ___.”",
          score: 10,
          feedback: "Great repair. Minimal language, quick structure, and choice reduces escalation.",
          next: "step3A"
        },
        B: {
          text: "Repeat, “Get back in line,” from ahead.",
          score: 0,
          feedback: "Neutral. It may work, but distance prompts can become attention.",
          next: "step3B"
        },
        C: {
          text: "Publicly tell him he’s unsafe and everyone is watching.",
          score: -10,
          feedback: "Public attention increases escalation and shame.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB yells louder and pushes into the front of the line. Peers watch.",
      choices: {
        A: {
          text: "Shift attention away and keep moving. Cue quietly: “With me.” Keep prompts to one step.",
          score: 10,
          feedback: "Excellent. You reduce the audience and maintain safety with minimal language.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating demands and telling him to stop.",
          score: 0,
          feedback: "Neutral. Repetition can add attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue with him about rules during the drill.",
          score: -10,
          feedback: "Debate adds attention and increases risk during a safety event.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "Outside, CB is still excited but quieter and staying near you.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He stayed safe and regulated enough for the transition.", next: "step4" } }
    },

    step3B: {
      text: "Outside, CB is quieter but keeps attention bids going.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may need to be immediate.", next: "step4" } }
    },

    step3C: {
      text: "Outside, CB continues yelling and peers keep reacting.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Attention payoff remains high.", next: "step4" } }
    },

    step4: {
      text: "How do you support CB after the drill transition?",
      choices: {
        A: {
          text: "Reinforce immediately for staying with you and using a low voice: praise + earned break once safe.",
          score: 10,
          feedback: "Perfect. Reinforces coping and safe transitions.",
          ending: "success"
        },
        B: {
          text: "Let him calm down without reinforcement.",
          score: 0,
          feedback: "Neutral. Calm, but coping behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Talk about his yelling in front of peers while waiting outside.",
          score: -10,
          feedback: "Public attention increases future drill escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Drill Coping Reinforced", text: "CB stayed with structure during the drill and earned reinforcement for coping safely." },
    mixed: { title: "Mixed – Safe, Weak Reinforcement", text: "CB completed the drill, but reinforcement for coping was unclear." },
    fail: { title: "Fail – Overwhelm + Attention", text: "Public attention increased the payoff and raised future escalation risk." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 3 — Guest/Observer in the Room (Big Audience)
 **************************************************/
POOL.wild.push({
  id: "wild_3_guest_observer_big_audience_cb",
  title: "Wildcard Mission: Guest in the Room",
  start: "step1",
  steps: {

    step1: {
      text: "A counselor and another adult enter to observe. CB notices immediately and begins yelling and showing off to get attention from the new audience.",
      choices: {
        A: {
          text: "Pre-correct privately: “Voice low.” Then offer a choice: “Hold the book or hold the pencil.”",
          score: 10,
          feedback: "Great. One-step prompt plus a choice prevents a show without spotlighting.",
          next: "step2A"
        },
        B: {
          text: "Tell the guest, “He does this sometimes,” in front of CB.",
          score: 0,
          feedback: "Neutral, but it can increase attention and make the behavior more reinforcing.",
          next: "step2B"
        },
        C: {
          text: "Correct CB publicly since adults are watching.",
          score: -10,
          feedback: "Public correction increases the audience effect and can escalate yelling.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB lowers his voice briefly but starts ripping a paper corner while glancing at the visitors.",
      choices: {
        A: {
          text: "Calm 1-step prompt: “Hands safe.” Then cue: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. Short prompts and a clear earn path reduce the audience payoff.",
          next: "step3A"
        },
        B: {
          text: "Ignore the ripping and keep instruction moving.",
          score: 0,
          feedback: "Neutral. Avoids attention, but destruction can increase without redirection.",
          next: "step3B"
        },
        C: {
          text: "Grab the paper and lecture him about embarrassing behavior.",
          score: -10,
          feedback: "Public attention and shame can escalate and intensify the show.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB smirks and yells louder, clearly enjoying the adult attention.",
      choices: {
        A: {
          text: "Repair: reduce interaction, keep class attention moving, then cue quietly: “In your space.” Offer the calm minute earn path.",
          score: 10,
          feedback: "Great repair. Removes the stage and returns to predictable steps.",
          next: "step3A"
        },
        B: {
          text: "Ask the guest to wait while you handle CB.",
          score: 0,
          feedback: "Neutral. It may help, but it increases audience attention on CB.",
          next: "step3B"
        },
        C: {
          text: "Correct him publicly to show you are in charge.",
          score: -10,
          feedback: "Public correction increases escalation and the audience effect.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB escalates, yelling and knocking materials, checking the visitor’s reaction.",
      choices: {
        A: {
          text: "Shift attention away, stay close, and keep prompts to one step: “Hands safe.” “In space.” Notify teams group if needed.",
          score: 10,
          feedback: "Excellent. Safety-first, minimal language, and reduced audience effect.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands and keep trying to stop him quickly.",
          score: 0,
          feedback: "Neutral. Repetition can add attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Debate consequences in front of the visitors and class.",
          score: -10,
          feedback: "Extended attention increases the payoff and escalates behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB lowers volume and stays in his space, calmer for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is back in routine. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB is quieter but still attention-seeking with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. Reinforcement may need to be faster.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates and keeps the new audience focused on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience payoff increased escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up support with visitors present?",
      choices: {
        A: {
          text: "Reinforce immediately when he meets the calm goal: low-key praise + earned break.",
          score: 10,
          feedback: "Perfect. Reinforces coping while keeping attention minimal.",
          ending: "success"
        },
        B: {
          text: "Let him settle without reinforcement since others are watching.",
          score: 0,
          feedback: "Neutral. Calm, but coping behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Process his behavior publicly in front of the visitors.",
          score: -10,
          feedback: "Public attention increases the payoff and future escalation risk.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Audience Managed", text: "CB used calmer behavior with a new audience and earned reinforcement for coping." },
    mixed: { title: "Mixed – Managed, Weak Reinforcement", text: "CB stabilized, but reinforcement was unclear, reducing future consistency." },
    fail: { title: "Fail – Show Became the Reinforcer", text: "Public attention increased yelling and disruption with visitors present." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 4 — Recess Ends Early (Disrupted Routine)
 **************************************************/
POOL.wild.push({
  id: "wild_4_recess_ends_early_cb",
  title: "Wildcard Mission: Recess Ends Early",
  start: "step1",
  steps: {

    step1: {
      text: "Recess ends early due to weather. CB comes in dysregulated, yelling and refusing to transition back to learning.",
      choices: {
        A: {
          text: "Use one calm prompt: “In your space.” Then offer a choice: “Break first or calm minute first?”",
          score: 10,
          feedback: "Great. One-step prompt plus a choice supports regulation and reduces refusal.",
          next: "step2A"
        },
        B: {
          text: "Tell him to calm down and explain the schedule change.",
          score: 0,
          feedback: "Neutral. Explanation can become attention during escalation.",
          next: "step2B"
        },
        C: {
          text: "Publicly correct him for yelling as the class watches.",
          score: -10,
          feedback: "Public attention increases yelling and escalation.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB moves to his space but keeps yelling comments to pull peers in.",
      choices: {
        A: {
          text: "Reduce the audience and restart the earn path: “One calm minute earns a break.” Keep your attention low and neutral.",
          score: 10,
          feedback: "Excellent. Predictable DRL routine strengthens coping during disruption.",
          next: "step3A"
        },
        B: {
          text: "Keep reminding him to be quiet with repeated prompts.",
          score: 0,
          feedback: "Neutral. Repeated attention can maintain the yelling.",
          next: "step3B"
        },
        C: {
          text: "Lecture him about how recess is over and he needs to deal with it.",
          score: -10,
          feedback: "Public emotional language increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB yells louder while you talk and starts ripping a paper corner.",
      choices: {
        A: {
          text: "Repair: stop explaining, use one prompt: “Hands safe.” Then: “In your space.” Offer the calm minute earn path.",
          score: 10,
          feedback: "Great repair. Minimal language plus the earn path reduces escalation.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining and trying to reason with him.",
          score: 0,
          feedback: "Neutral. Attention and delay can reinforce the episode.",
          next: "step3B"
        },
        C: {
          text: "Stop class and address CB publicly.",
          score: -10,
          feedback: "Creates a stage and escalates attention-maintained behavior.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB escalates with louder yelling and peers are watching closely.",
      choices: {
        A: {
          text: "Shift class attention away and follow the plan: one-step prompts only, notify teams group if safety risk rises.",
          score: 10,
          feedback: "Excellent. Removes audience and follows crisis-ready steps during disruption.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating demands in a louder voice.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in front of peers.",
          score: -10,
          feedback: "Debate is extended attention and increases escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB lowers volume and stays in his space for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is stabilizing. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB quiets briefly but continues small attention bids.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. Reinforcement may need to be tighter.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates again and peers remain engaged.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience payoff increased escalation.", next: "step4" } }
    },

    step4: {
      text: "How do you finish the disrupted routine moment?",
      choices: {
        A: {
          text: "Reinforce immediately once he meets the calm minute or prompt goal: low-key praise + earned break.",
          score: 10,
          feedback: "Perfect. Strengthens coping during disrupted routines.",
          ending: "success"
        },
        B: {
          text: "Let him calm without reinforcement because it was a big reaction.",
          score: 0,
          feedback: "Neutral. Calm return is good, but reinforcement strengthens future recovery.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his yelling publicly after he calms.",
          score: -10,
          feedback: "Public attention can restart the cycle next time routines change.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Disruption Managed", text: "CB returned to calm behavior during a disrupted routine and earned reinforcement for coping." },
    mixed: { title: "Mixed – Stabilized, Weak Reinforcement", text: "CB stabilized, but reinforcement was unclear, reducing future buy-in." },
    fail: { title: "Fail – Attention Maintained Escalation", text: "Public attention increased yelling and disruption during schedule changes." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 5 — Chromebook Removed (Preferred Item Change)
 **************************************************/
POOL.wild.push({
  id: "wild_5_preferred_item_removed_chromebook_cb",
  title: "Wildcard Mission: Preferred Item Removed",
  start: "step1",
  steps: {

    step1: {
      text: "CB expects to use the Chromebook, but it is not available today. He yells, pushes his chair, and looks at classmates to see their reactions.",
      choices: {
        A: {
          text: "Use one calm prompt + choice: “In your space.” Then: “Paper task or partner read?”",
          score: 10,
          feedback: "Great. One-step prompt plus a choice reduces yelling and supports transition to an alternative.",
          next: "step2A"
        },
        B: {
          text: "Explain why the Chromebook is not available and why he needs to accept it.",
          score: 0,
          feedback: "Neutral. Explanation can become attention during escalation.",
          next: "step2B"
        },
        C: {
          text: "Publicly correct him for yelling about the Chromebook.",
          score: -10,
          feedback: "Public attention increases the payoff and can escalate.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "CB chooses the paper task but starts ripping the edge and trying to pull attention away from instruction.",
      choices: {
        A: {
          text: "Prompt safety + earn path: “Hands safe.” Then: “One calm minute earns a break.”",
          score: 10,
          feedback: "Excellent. Predictable steps and reinforcement keep coping skills in place.",
          next: "step3A"
        },
        B: {
          text: "Ignore the ripping and push forward with the lesson.",
          score: 0,
          feedback: "Neutral. Avoids attention, but destruction may increase without a prompt.",
          next: "step3B"
        },
        C: {
          text: "Take the paper and lecture about ruining materials.",
          score: -10,
          feedback: "Extended attention can escalate and reinforce the behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "CB yells louder and tries to argue while classmates watch.",
      choices: {
        A: {
          text: "Repair: stop explaining, reduce the audience, and use one calm prompt: “In your space.” Offer the choice again.",
          score: 10,
          feedback: "Great repair. Minimal language and choice restore structure quickly.",
          next: "step3A"
        },
        B: {
          text: "Keep negotiating and talking through it.",
          score: 0,
          feedback: "Neutral. Negotiation can reinforce yelling for attention.",
          next: "step3B"
        },
        C: {
          text: "Threaten a bigger consequence loudly.",
          score: -10,
          feedback: "Public threats can escalate yelling and elopement attempts.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "CB yells, sweeps a pencil off the desk, and peers react.",
      choices: {
        A: {
          text: "Shift class attention away and use one-step safety prompts: “Hands safe.” “In space.” Notify teams group if escalation rises.",
          score: 10,
          feedback: "Excellent. Removes spotlight, prioritizes safety, and follows the plan.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating demands and telling him to stop.",
          score: 0,
          feedback: "Neutral. Repetition can become attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Stop instruction and address him publicly until he stops.",
          score: -10,
          feedback: "Public attention increases the payoff and disrupts class.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "CB lowers his voice and stays in his space for a short stretch.",
      choices: { A: { text: "Continue.", score: 10, feedback: "He is stabilizing. Reinforce quickly.", next: "step4" } }
    },

    step3B: {
      text: "CB stabilizes but continues small attention bids with noises.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Partial stabilization. Reinforcement may need to be faster.", next: "step4" } }
    },

    step3C: {
      text: "CB escalates and tries to pull the whole room into it.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Audience payoff increased escalation and disruption.", next: "step4" } }
    },

    step4: {
      text: "How do you finalize once he is calmer?",
      choices: {
        A: {
          text: "Reinforce immediately for calm behavior and staying in space: low-key praise + earned break, then return to work.",
          score: 10,
          feedback: "Perfect. Reinforces coping with an unexpected change in preferred items.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement since he escalated.",
          score: 0,
          feedback: "Neutral. Calm return is good, but reinforcement strengthens future recovery.",
          ending: "mixed"
        },
        C: {
          text: "Discuss the incident publicly after he calms.",
          score: -10,
          feedback: "Public attention increases future escalation when preferred items change.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Preferred Item Change Managed", text: "CB used calmer behavior and earned reinforcement after an unexpected change in preferred items." },
    mixed: { title: "Mixed – Managed, Weak Reinforcement", text: "CB stabilized, but reinforcement was unclear, reducing future coping consistency." },
    fail: { title: "Fail – Attention Fueled Episode", text: "Public attention increased yelling and escalation after preferred item removal." }
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

// CB (attention-maintained yelling/destruction/elopement) — updated action steps

if (pct >= 80) {
  actionSteps = `
    <ul>
      <li>Keep front-loading supports before known triggers (lunch to whole group reading, afternoon whole group blocks, transitions and downtime).</li>
      <li>Stay consistent with short, neutral one-step directions plus a simple choice (front or back, book or pencil, write or dictate) instead of extended talking.</li>
      <li>Use the planned earn path every time: one calm minute earns a break, or 3 followed prompts earns a break. Keep the break immediate and low-key.</li>
      <li>Reinforce quickly and privately for safe hands, staying in space, low voice, and following the prompt (praise plus the earned break or full-size pencil).</li>
      <li>When early signs show up (volume rising, paper tearing, moving toward the door), your fast reset and audience reduction is working. Keep that timing.</li>
    </ul>`;
}
else if (pct >= 50) {
  actionSteps = `
    <ul>
      <li>Add pre-corrections earlier, especially before transitions into whole group, schedule changes, and unstructured moments.</li>
      <li>Prompt the replacement behavior sooner by giving a clear regulated option and an earn path: “In your space,” “Hands safe,” plus “one calm minute earns a break.”</li>
      <li>Shorten language to one step at a time and avoid repeated prompts. Reinforce immediately the moment he complies (break or full-size pencil plus specific praise).</li>
      <li>If attention-seeking starts, reduce the audience first (keep instruction moving, shift peers’ attention away) instead of explaining, negotiating, or correcting publicly.</li>
      <li>Use task limits and choices to prevent escalation (two sentences, pick materials, stand by me or behind a peer).</li>
    </ul>`;
}
else {
  actionSteps = `
    <ul>
      <li>Rebuild the proactive setup: clear expectations for voice, hands, and staying in space, plus a visible “how to earn” path (calm minute or prompt count to break).</li>
      <li>Practice the replacement routine outside tough moments: one-step prompt, choice, calm minute goal, and immediate reinforcement for compliance.</li>
      <li>During escalation, use minimal language and predictable steps only. Avoid public correction, long explanations, or debates that create a stage.</li>
      <li>If there is elopement risk or unsafe behavior, follow the safety plan exactly: notify the teams group, create space, maintain line-of-sight, and get support. Do not chase or block.</li>
      <li>Once calm, complete brief private restoration and immediately reinforce recovery and safe behavior.</li>
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
