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

 // SR (escape-maintained work avoidance + noises/talking) — updated summary statement

if (pct >= 80) {
  return "High fidelity. You stayed calm and brief, supported task entry (start together then fade), and prompted help-seeking early. SR had a clear path back to success and you reinforced quickly with a Yeehaw ticket and specific praise.";
}
if (pct >= 50) {
  return "Getting there. Use fewer words and move faster into the plan: prompt “If it’s hard, ask for help,” offer a tiny next step (one sentence, one problem), and reinforce immediately when SR re-enters with a Yeehaw ticket and specific praise.";
}
return "Not aligned yet. Reset your approach: keep language minimal, avoid public corrections or debates, and go straight to a predictable routine (quiet proximity cue, 1–10 effort check-in, start together for one step, then fade). Reinforce task start and help-seeking right away. If safety risk shows up, follow the safety steps exactly.";
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

  // === GET STUDENT FROM URL (e.g. ?student=SR) ===
  const url = new URL(window.location.href);
  const student = url.searchParams.get("student") || "SR";

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
 * DAILY SCENARIO 1 — ELA Independent Reading (Work Avoidance)
 **************************************************/
POOL.daily.push({
  id: "daily_1_ela_independent_reading_escape",
  title: "Daily Mission: ELA Independent Reading",
  start: "step1",
  steps: {

    step1: {
      text: "During ELA independent reading, SR flips to a longer passage, stares at it, and quietly pushes the paper away. He starts looking around for someone to talk to.",
      choices: {
        A: {
          text: "Start together: “Let’s do the hardest first sentence together, then you try the next one. If it feels hard, ask for help.”",
          score: 10,
          feedback: "Great fidelity. You reduce the demand and prompt the replacement behavior (do what you can, ask for help).",
          next: "step2A"
        },
        B: {
          text: "Say, “Just do your best and keep going,” and walk away.",
          score: 0,
          feedback: "Neutral. Encouraging, but it does not teach or prompt how to ask for help when it feels hard.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop stalling. Get to work,” where others can hear.",
          score: -10,
          feedback: "Public correction can increase avoidance and starts a power struggle.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR does the first sentence with you, then hesitates on the next one and glances toward a peer.",
      choices: {
        A: {
          text: "Prompt a help request: “If it’s hard, ask for help. Do you want help from me or a peer?”",
          score: 10,
          feedback: "Excellent. You prompt a clear, functional replacement and give a small choice.",
          next: "step3A"
        },
        B: {
          text: "Tell him, “Keep trying,” without offering a help option.",
          score: 0,
          feedback: "Neutral. He may still avoid if he cannot access help appropriately.",
          next: "step3B"
        },
        C: {
          text: "Say, “Do not talk. You are distracting people,” in a firm tone.",
          score: -10,
          feedback: "Focuses on talking before teaching how to respond when work feels hard, which can increase escape behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR slumps and starts whispering to a nearby student about something unrelated.",
      choices: {
        A: {
          text: "Use proximity and a quiet reminder: “Save conversation for later. If it’s hard, ask for help.”",
          score: 10,
          feedback: "Great. You keep attention low and prompt the exact expected behaviors.",
          next: "step3A"
        },
        B: {
          text: "Say softly, “Not right now,” and keep helping other students.",
          score: 0,
          feedback: "Neutral. It might pause the talking, but the help-seeking replacement is still missing.",
          next: "step3B"
        },
        C: {
          text: "Call out, “SR, stop talking,” from across the room.",
          score: -10,
          feedback: "Public attention can reinforce the off-task behavior and disrupt instruction.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR sighs loudly and responds with a drawn-out “Uhhhhhh,” then looks at peers to see who noticed.",
      choices: {
        A: {
          text: "Quietly reset with stop-and: “Let’s pause. 1–10, how hard are you working right now?” then prompt help.",
          score: 10,
          feedback: "Nice. You use your scale and redirect to help-seeking without giving a big audience moment.",
          next: "step3A"
        },
        B: {
          text: "Say, “Just focus,” and move on quickly.",
          score: 0,
          feedback: "Neutral. It avoids a debate, but it does not teach what to do when it feels hard.",
          next: "step3B"
        },
        C: {
          text: "Lecture him about attitude and being respectful.",
          score: -10,
          feedback: "Extended attention often increases escape behavior and keeps the cycle going.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR asks for help and starts working again, staying quiet.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Replacement behavior happened and work resumed.", next: "step4" }
      }
    },

    step3B: {
      text: "SR writes a little, then slows down and looks around again.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial engagement. He may need the routine prompted again.", next: "step4" }
      }
    },

    step3C: {
      text: "SR stops working and starts another quiet conversation with a peer.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Off-task talking is maintaining escape from the difficult task.", next: "step4" }
      }
    },

    step4: {
      text: "How do you wrap up this moment?",
      choices: {
        A: {
          text: "Praise specifically and deliver reinforcement: “Nice job doing what you could and asking for help.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect. Reinforces task persistence and appropriate help-seeking.",
          ending: "success"
        },
        B: {
          text: "Let him continue without praise or reinforcement.",
          score: 0,
          feedback: "Neutral. He is working, but the replacement behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the earlier avoidance again and warn about consequences.",
          score: -10,
          feedback: "Reintroduces attention and can restart escape behavior.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Help-Seeking Reinforced",
      text: "SR accessed help appropriately and re-engaged with the challenging task, then earned reinforcement."
    },
    mixed: {
      title: "Mixed Outcome – Working, But Not Strengthened",
      text: "SR worked, but without clear reinforcement the replacement behavior may not maintain."
    },
    fail: {
      title: "Fail – Escape Pattern Continued",
      text: "The interaction increased attention and avoidance, making future work refusal more likely."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 2 — Writing Block (Quit Working Then Talk)
 **************************************************/
POOL.daily.push({
  id: "daily_2_writing_quit_then_talk",
  title: "Daily Mission: Writing Block",
  start: "step1",
  steps: {

    step1: {
      text: "During writing, SR writes one sentence, then stops. He puts his pencil down, looks at the page, and turns to start a quiet conversation with a neighbor.",
      choices: {
        A: {
          text: "Use a quiet stop-and check-in: “1–10, how hard are you working right now?” Then: “Pick the hardest part and we will start together.”",
          score: 10,
          feedback: "Great match to your plan. You use the scale, reduce the demand, and re-start the work with support.",
          next: "step2A"
        },
        B: {
          text: "Say, “Keep writing,” and point to the prompt.",
          score: 0,
          feedback: "Neutral. It is a directive, but it does not teach what to do when it feels hard.",
          next: "step2B"
        },
        C: {
          text: "Tell him, “Stop talking. You never focus,” in front of others.",
          score: -10,
          feedback: "Public correction and global statements increase frustration and escape.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR says, “It’s like a 9,” and looks stuck. He still watches the peer like he wants to talk.",
      choices: {
        A: {
          text: "Give a choice plus help: “Do you want help from me or a peer? Then write one more sentence.”",
          score: 10,
          feedback: "Excellent. Clear replacement behavior plus a tiny, doable expectation.",
          next: "step3A"
        },
        B: {
          text: "Say, “Okay, just try,” without offering help or a next step.",
          score: 0,
          feedback: "Neutral. Acknowledges difficulty but does not give a path forward.",
          next: "step3B"
        },
        C: {
          text: "Say, “It’s not that hard,” and push him to keep going.",
          score: -10,
          feedback: "Invalidation increases avoidance and can trigger whining or shutdown.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR makes a quiet noise, “Uhhhhhh,” then begins whispering to the peer again.",
      choices: {
        A: {
          text: "Proximity + quiet prompt: “Save conversation for later. If it’s hard, ask for help.”",
          score: 10,
          feedback: "Great. You keep it private and cue both expectations.",
          next: "step3A"
        },
        B: {
          text: "Say, “Not now,” and walk away.",
          score: 0,
          feedback: "Neutral. It might pause behavior, but he still lacks the replacement response.",
          next: "step3B"
        },
        C: {
          text: "Call him out across the room for making noises and talking.",
          score: -10,
          feedback: "Public attention can reinforce the behavior and derail writing time.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR smirks slightly and keeps whispering, testing whether you will keep engaging.",
      choices: {
        A: {
          text: "Stop-and with private debrief: “We will talk after. Right now: one sentence, then check in.”",
          score: 10,
          feedback: "Nice repair. You reduce attention and set a small, clear step.",
          next: "step3A"
        },
        B: {
          text: "Give him a stern look and keep teaching.",
          score: 0,
          feedback: "Neutral. Might work, but it is not consistent prompting of the replacement behavior.",
          next: "step3B"
        },
        C: {
          text: "Argue about why he needs to do the assignment right now.",
          score: -10,
          feedback: "Debate increases attention and makes escape more efficient.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR asks for help and writes another sentence quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He used help-seeking and persisted with the task.", next: "step4" }
      }
    },

    step3B: {
      text: "SR writes a few words but pauses again and looks toward the peer.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial engagement. He may need another quick prompt and reinforcement.", next: "step4" }
      }
    },

    step3C: {
      text: "SR stops writing and continues the quiet conversation, fully off task.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Talking is functioning as escape from writing demands.", next: "step4" }
      }
    },

    step4: {
      text: "How do you conclude support for writing?",
      choices: {
        A: {
          text: "Deliver quick praise and a Yeehaw ticket: “Thanks for asking for help and sticking with it.”",
          score: 10,
          feedback: "Perfect reinforcement for persistence and help-seeking.",
          ending: "success"
        },
        B: {
          text: "Give a general “good job” later without tying it to the specific behavior.",
          score: 0,
          feedback: "Neutral. Praise is helpful, but the contingency is weaker.",
          ending: "mixed"
        },
        C: {
          text: "Remove help and tell him to do it alone since he was off task earlier.",
          score: -10,
          feedback: "Reduces supports when work is hard, increasing escape behavior next time.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Writing Persistence Reinforced",
      text: "SR practiced doing what he could, asked for help, and earned reinforcement."
    },
    mixed: {
      title: "Mixed Outcome – Some Work Done",
      text: "SR completed some writing, but replacement behavior was not clearly strengthened."
    },
    fail: {
      title: "Fail – Avoidance Strengthened",
      text: "Supports were inconsistent, making talking and quitting more likely in future writing tasks."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 3 — During Instruction (Mumbling and Noises)
 **************************************************/
POOL.daily.push({
  id: "daily_3_instruction_mumbling_noises",
  title: "Daily Mission: During Instruction",
  start: "step1",
  steps: {

    step1: {
      text: "You are giving directions for a task. SR begins low mumbling and small noises while looking down at his paper. A couple students glance at him.",
      choices: {
        A: {
          text: "Use proximity and a quiet reminder: “No noises during instruction. If it feels hard, ask for help.”",
          score: 10,
          feedback: "Great. Private, quick, and directly teaches expected behavior and replacement skill.",
          next: "step2A"
        },
        B: {
          text: "Pause and ask, “Are you okay?” in front of the group.",
          score: 0,
          feedback: "Neutral. Caring, but it can add attention during instruction and may not cue the plan.",
          next: "step2B"
        },
        C: {
          text: "Stop the class and say, “SR, stop making noises.”",
          score: -10,
          feedback: "Public correction increases attention and can escalate avoidance.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR nods slightly and quiets. He looks at the assignment directions again and hesitates.",
      choices: {
        A: {
          text: "Prompt a help request: “Do you want help from me or a peer to get started?”",
          score: 10,
          feedback: "Excellent. You pair calm expectation with a clear path to support.",
          next: "step3A"
        },
        B: {
          text: "Say, “Just listen,” and continue directions.",
          score: 0,
          feedback: "Neutral. It keeps class moving but may leave him stuck when work starts.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is wasting everyone’s time.",
          score: -10,
          feedback: "Shame and public attention can increase escape behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR responds with a long “Uhhhhhh,” and a few students look over again.",
      choices: {
        A: {
          text: "Quiet stop-and: “We will debrief after. Right now: show me which part is hardest.”",
          score: 10,
          feedback: "Great. You contain attention and move directly into a support step.",
          next: "step3A"
        },
        B: {
          text: "Ignore it and keep teaching.",
          score: 0,
          feedback: "Neutral. It avoids attention, but he may still be headed toward work refusal.",
          next: "step3B"
        },
        C: {
          text: "Respond with sarcasm or a reprimand about the noise.",
          score: -10,
          feedback: "Escalates emotion and attention during instruction.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR looks up, smirks slightly, then starts a quiet side comment to a peer.",
      choices: {
        A: {
          text: "Move closer and quietly redirect: “Save conversation for later. Track me for directions.”",
          score: 10,
          feedback: "Great fidelity. Proximity and quiet reminders match your plan.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and keep going.",
          score: 0,
          feedback: "Neutral. Might work, but the plan is not clearly prompted.",
          next: "step3B"
        },
        C: {
          text: "Engage in a back-and-forth about why he is talking.",
          score: -10,
          feedback: "Debate gives attention and can reinforce the behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR is quiet and follows directions, then signals he needs help to start.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He stayed quiet and accessed support appropriately.", next: "step4" }
      }
    },

    step3B: {
      text: "SR is quiet for now but looks disengaged and avoids eye contact with the work.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stable, but he may need a proactive check-in when work begins.", next: "step4" }
      }
    },

    step3C: {
      text: "SR resumes mumbling and peers are now reacting more.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Peer attention and escape are both being strengthened.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce instruction-following in this moment?",
      choices: {
        A: {
          text: "Deliver quick praise: “Thanks for staying quiet during directions.” Then give a Yeehaw ticket when he starts.",
          score: 10,
          feedback: "Perfect. Reinforces the exact expectation and task initiation.",
          ending: "success"
        },
        B: {
          text: "Move into the task without acknowledging the change.",
          score: 0,
          feedback: "Neutral. It keeps pace but misses reinforcement for the expected behavior.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the earlier noise again as a warning before starting work.",
          score: -10,
          feedback: "Reintroduces attention and can trigger renewed avoidance.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Quiet During Instruction Reinforced",
      text: "SR stayed quiet during directions and used support appropriately, strengthening instruction routines."
    },
    mixed: {
      title: "Mixed Outcome – Calm, But Not Strengthened",
      text: "SR stabilized, but reinforcement was not clearly tied to the expected behavior."
    },
    fail: {
      title: "Fail – Attention and Escape Increased",
      text: "Public engagement increased attention and made avoidance more likely during future instruction."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 4 — Lining Up (Hallway Trigger)
 **************************************************/
POOL.daily.push({
  id: "daily_4_lining_up_hallway_talking",
  title: "Daily Mission: Lining Up and Hallway",
  start: "step1",
  steps: {

    step1: {
      text: "It is time to line up. SR starts talking immediately, making quiet side comments and small noises while the class is forming the line. This is a known trigger time.",
      choices: {
        A: {
          text: "Pre-correct privately with proximity: “Quiet line. Save conversation for later. Show me you can do it.”",
          score: 10,
          feedback: "Great. Clear expectations, low attention, matches your hallway trigger area.",
          next: "step2A"
        },
        B: {
          text: "Say, “Let’s be quiet in the hall,” to the whole class.",
          score: 0,
          feedback: "Neutral. Classwide reminder helps, but it may not be enough for SR.",
          next: "step2B"
        },
        C: {
          text: "Call him out by name in front of the line: “SR, stop talking.”",
          score: -10,
          feedback: "Public attention can increase talking and invite peer reactions.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR quiets briefly but then makes a small “uhhh” noise as he looks at the students in front of him.",
      choices: {
        A: {
          text: "Use a quiet reminder: “No noises. Track forward.” Then move your attention away.",
          score: 10,
          feedback: "Excellent. Brief, neutral, and avoids building an audience.",
          next: "step3A"
        },
        B: {
          text: "Say, “Almost there,” and keep watching him closely.",
          score: 0,
          feedback: "Neutral. Monitoring helps, but the expectation is not clearly cued again.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is being annoying and needs to stop.",
          score: -10,
          feedback: "Negative attention can escalate and increase hallway issues.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR keeps talking quietly to the student behind him. A few kids begin talking too.",
      choices: {
        A: {
          text: "Proximity and quiet prompt to SR only: “Quiet line. Save it for later.”",
          score: 10,
          feedback: "Great. You target the student without turning it into a group attention moment.",
          next: "step3A"
        },
        B: {
          text: "Repeat the classwide reminder again.",
          score: 0,
          feedback: "Neutral. Might help, but it can become background noise and does not teach a replacement.",
          next: "step3B"
        },
        C: {
          text: "Stop the whole line and lecture about hallway expectations.",
          score: -10,
          feedback: "Big attention event that can reinforce SR and frustrate peers.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR grins and continues talking, now with more peers looking at him.",
      choices: {
        A: {
          text: "Quietly reset with stop-and: “We will debrief after. Right now: quiet line.” Then step away.",
          score: 10,
          feedback: "Nice repair. Private, brief, and consistent.",
          next: "step3A"
        },
        B: {
          text: "Give him a stern look and keep moving.",
          score: 0,
          feedback: "Neutral. Might pause behavior, but does not actively strengthen the routine.",
          next: "step3B"
        },
        C: {
          text: "Continue correcting him publicly until he stops.",
          score: -10,
          feedback: "Sustained attention in the hallway often strengthens the talking.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR walks in line quietly and keeps his eyes forward.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Successful hallway routine.", next: "step4" }
      }
    },

    step3B: {
      text: "SR is mostly quiet but still whispers a few comments.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Some improvement, but reinforcement may be needed to lock it in.", next: "step4" }
      }
    },

    step3C: {
      text: "SR continues talking and other students are now more distracted.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Talking is spreading and becoming more reinforcing through peer reactions.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce hallway success?",
      choices: {
        A: {
          text: "When you reach the destination, quietly praise SR: “Thanks for saving conversation for later.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect. Reinforces the desired hallway behavior.",
          ending: "success"
        },
        B: {
          text: "Praise the whole class generally for walking quietly.",
          score: 0,
          feedback: "Neutral. Helpful, but less targeted to SR’s plan.",
          ending: "mixed"
        },
        C: {
          text: "Debrief SR publicly in front of the line about his talking.",
          score: -10,
          feedback: "Public attention can increase future hallway talking.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Hallway Routine Strengthened",
      text: "SR followed the quiet line expectation and earned reinforcement for appropriate behavior."
    },
    mixed: {
      title: "Mixed Outcome – Some Improvement",
      text: "The hallway went okay, but SR did not receive strong, targeted reinforcement."
    },
    fail: {
      title: "Fail – Attention Maintained Talking",
      text: "Public attention increased the payoff for talking, making hallway behavior harder next time."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 5 — Independent Work (Scale + Stop-and Debrief)
 **************************************************/
POOL.daily.push({
  id: "daily_5_independent_work_scale_stop_and",
  title: "Daily Mission: Independent Work Time",
  start: "step1",
  steps: {

    step1: {
      text: "During independent work time, SR stops working, stares at his paper, and starts murmuring softly. He looks like he may begin talking to others.",
      choices: {
        A: {
          text: "Use a quick private check-in: “1–10, how hard are you working?” Then: “Show me the hardest part and we start together.”",
          score: 10,
          feedback: "Great fidelity. This matches your current supports and prevents escape from growing.",
          next: "step2A"
        },
        B: {
          text: "Say, “Get back to work,” and stand nearby.",
          score: 0,
          feedback: "Neutral. Proximity helps, but the replacement behavior and support steps are not activated.",
          next: "step2B"
        },
        C: {
          text: "Remove the work and say, “We will do this later,” to keep things calm.",
          score: -10,
          feedback: "Task removal can reinforce escape and increase future work refusal.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR says, “8,” and points to a paragraph. He is quiet but looks frustrated.",
      choices: {
        A: {
          text: "Model and prompt: “Ask for help.” Then help him start the first part and fade support quickly.",
          score: 10,
          feedback: "Excellent. Teach the help request and use the start-together strategy.",
          next: "step3A"
        },
        B: {
          text: "Tell him you will check back later and move away.",
          score: 0,
          feedback: "Neutral. It avoids attention, but he may stay stuck and disengage again.",
          next: "step3B"
        },
        C: {
          text: "Tell him to stop complaining and just do it.",
          score: -10,
          feedback: "Increases frustration and escape behavior risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR makes a quiet “uhhh” sound and begins whispering to a peer, trying to start a conversation.",
      choices: {
        A: {
          text: "Quiet reminder with proximity: “Save conversation for later. If it’s hard, ask for help.”",
          score: 10,
          feedback: "Strong fidelity. You correct the talking and prompt the replacement in one calm step.",
          next: "step3A"
        },
        B: {
          text: "Say, “Not now,” and stay standing over him.",
          score: 0,
          feedback: "Neutral. It may stop talking but can become attention-heavy without teaching skills.",
          next: "step3B"
        },
        C: {
          text: "Correct him publicly so others stop talking too.",
          score: -10,
          feedback: "Public correction adds attention and can increase SR’s behavior.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR relaxes when the task is removed and immediately starts talking, now smiling.",
      choices: {
        A: {
          text: "Re-present a smaller chunk: “One sentence, then we check in.” Prompt help-seeking.",
          score: 10,
          feedback: "Good repair. You restore a doable demand and teach the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Let him have a longer break since he was frustrated.",
          score: 0,
          feedback: "Neutral. Breaks can help, but without a return plan it can reinforce escape.",
          next: "step3B"
        },
        C: {
          text: "Decide to skip the work entirely to avoid problems today.",
          score: -10,
          feedback: "Strengthens escape and makes future independent work harder.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR asks for help, completes a small chunk, and stays quiet.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Replacement behavior plus persistence occurred.", next: "step4" }
      }
    },

    step3B: {
      text: "SR does a little work, but he keeps scanning for chances to talk or stop.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Some work, but reinforcement and clarity may be needed.", next: "step4" }
      }
    },

    step3C: {
      text: "SR stops working again and the talking returns quickly.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Escape and attention are both being reinforced.", next: "step4" }
      }
    },

    step4: {
      text: "How do you finish this support cycle?",
      choices: {
        A: {
          text: "Praise specifically and reinforce: “Nice job doing what you could and asking for help.” Give a Yeehaw ticket or note home later.",
          score: 10,
          feedback: "Perfect. Reinforces the desired behavior and builds future persistence.",
          ending: "success"
        },
        B: {
          text: "Give general praise at the end of class with no mention of help-seeking.",
          score: 0,
          feedback: "Neutral. Praise helps, but it is less connected to the replacement behavior.",
          ending: "mixed"
        },
        C: {
          text: "Focus only on what went wrong and give a corrective talk.",
          score: -10,
          feedback: "Increases attention to problem behavior and can restart avoidance.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Stop-and Routine Worked",
      text: "SR used help-seeking, completed a small chunk, and earned reinforcement for persistence."
    },
    mixed: {
      title: "Mixed Outcome – Some Work, Some Drift",
      text: "SR engaged partially, but the routine was not strongly reinforced or clarified."
    },
    fail: {
      title: "Fail – Escape Pattern Strengthened",
      text: "Task removal or high-attention correction increased the likelihood of future work avoidance."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 6 — Small Group Reading (Escape + Side Talk)
 **************************************************/
POOL.daily.push({
  id: "daily_6_small_group_reading_escape_sidetalk",
  title: "Daily Mission: Small Group Reading",
  start: "step1",
  steps: {

    step1: {
      text: "During small group reading, SR is asked to read a short section aloud. He looks down, makes a quiet noise, and starts whispering to a peer instead of reading.",
      choices: {
        A: {
          text: "Start together: “Let’s read the first sentence together, then you read the next one.” Prompt: “If it feels hard, ask for help.”",
          score: 10,
          feedback: "Great fidelity. You reduce the demand, avoid a power struggle, and cue help-seeking.",
          next: "step2A"
        },
        B: {
          text: "Say, “Come on, it’s your turn,” and wait.",
          score: 0,
          feedback: "Neutral. A directive alone may increase avoidance if he feels stuck.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop being silly and read,” where the group can hear clearly.",
          score: -10,
          feedback: "Public correction can increase escape behavior and peer attention.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR reads with you, then pauses before his independent sentence and glances at the peer again.",
      choices: {
        A: {
          text: "Give a small choice: “Do you want help from me or a peer for this sentence?”",
          score: 10,
          feedback: "Excellent. Clear replacement behavior with choice reduces escape.",
          next: "step3A"
        },
        B: {
          text: "Say, “Just try,” without offering help.",
          score: 0,
          feedback: "Neutral. He may still avoid if he cannot access support appropriately.",
          next: "step3B"
        },
        C: {
          text: "Correct the whispering and tell him to stop distracting others.",
          score: -10,
          feedback: "Focuses on behavior without teaching the help-seeking replacement.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR makes a longer “uhhh” sound and starts a side comment to the peer, trying to shift the group’s attention.",
      choices: {
        A: {
          text: "Use proximity and a quiet reminder: “Save conversation for later. If it’s hard, ask for help.”",
          score: 10,
          feedback: "Great. Private, quick, and directly prompts the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Ignore it and call on another student to keep moving.",
          score: 0,
          feedback: "Neutral. It avoids attention, but SR may learn escape works in group.",
          next: "step3B"
        },
        C: {
          text: "Stop the group and address SR’s noises in front of everyone.",
          score: -10,
          feedback: "Public attention increases the payoff and risks escalation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR smirks slightly and leans back, still not reading. A couple students look at him.",
      choices: {
        A: {
          text: "Quiet stop-and: “We will talk after. Right now: one sentence.” Then offer help to start.",
          score: 10,
          feedback: "Nice repair. You reduce attention and give a clear, doable step.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and wait silently.",
          score: 0,
          feedback: "Neutral. It may pause behavior, but it does not teach what to do when it feels hard.",
          next: "step3B"
        },
        C: {
          text: "Ask, “Why are you doing this?” and keep questioning.",
          score: -10,
          feedback: "Extended interaction often increases avoidance and attention.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR asks for help and reads the sentence, then settles back into the group quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He used help-seeking and completed the demand.", next: "step4" }
      }
    },

    step3B: {
      text: "SR reads a few words, then hesitates and looks around again.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial engagement. He may need quick reinforcement and another prompt.", next: "step4" }
      }
    },

    step3C: {
      text: "SR refuses to read and keeps making noises while the group watches.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Avoidance is increasing and peer attention may reinforce it.", next: "step4" }
      }
    },

    step4: {
      text: "How do you wrap up this small group moment?",
      choices: {
        A: {
          text: "Praise specifically: “Thanks for asking for help and reading your part.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect. Reinforces help-seeking and participation.",
          ending: "success"
        },
        B: {
          text: "Move on with the group and do not acknowledge the effort.",
          score: 0,
          feedback: "Neutral. He participated, but the replacement behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the refusal again in front of the group as a warning.",
          score: -10,
          feedback: "Public attention can restart avoidance and increase future refusal.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Group Participation Reinforced",
      text: "SR used help-seeking and completed reading demands, then earned reinforcement."
    },
    mixed: {
      title: "Mixed Outcome – Participated Without Reinforcement",
      text: "SR participated, but reinforcement was not clearly tied to the replacement behavior."
    },
    fail: {
      title: "Fail – Escape Cycle Increased",
      text: "Public attention and repeated correction made avoidance and refusal more likely next time."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 7 — Directions to Start Work (Off Task Before Beginning)
 **************************************************/
POOL.daily.push({
  id: "daily_7_start_work_stall_before_beginning",
  title: "Daily Mission: Getting Started",
  start: "step1",
  steps: {

    step1: {
      text: "You finish giving directions and tell students to begin. SR stares at the page, does not start, and begins making small noises under his breath.",
      choices: {
        A: {
          text: "Proximity check-in: “Show me the hardest part.” Start together for the first step, then fade: “Now you go on your own.”",
          score: 10,
          feedback: "Great fidelity. You prevent escape by reducing the start-up barrier and using the start-together strategy.",
          next: "step2A"
        },
        B: {
          text: "Say, “Start now,” and walk away.",
          score: 0,
          feedback: "Neutral. A directive alone may not help if he feels stuck.",
          next: "step2B"
        },
        C: {
          text: "Say, “You are already off task,” loudly enough for others to hear.",
          score: -10,
          feedback: "Public correction can increase attention and avoidance.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR points to one question and says quietly, “I don’t get it.”",
      choices: {
        A: {
          text: "Prompt help-seeking: “Ask for help.” Then give quick support and set a small goal: “Do two, then I check.”",
          score: 10,
          feedback: "Excellent. You teach the replacement and keep the task doable.",
          next: "step3A"
        },
        B: {
          text: "Tell him you will come back later and move away.",
          score: 0,
          feedback: "Neutral. He might stall again without a plan for immediate entry.",
          next: "step3B"
        },
        C: {
          text: "Tell him to figure it out on his own since it is independent work.",
          score: -10,
          feedback: "Removing support when the task feels hard increases escape behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR begins whispering to a peer about something unrelated, trying to avoid starting.",
      choices: {
        A: {
          text: "Quiet reminder: “Save conversation for later. If it’s hard, ask for help.”",
          score: 10,
          feedback: "Great. Private, calm, and directly prompts the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Stand by his desk and monitor without saying anything.",
          score: 0,
          feedback: "Neutral. Monitoring can help, but he may not learn the replacement response.",
          next: "step3B"
        },
        C: {
          text: "Correct him publicly so the whole class hears.",
          score: -10,
          feedback: "Public attention increases the payoff and can spread distraction.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR shrugs and makes a louder noise, then looks around to see who noticed.",
      choices: {
        A: {
          text: "Stop-and privately: “We will debrief after. Right now, 1–10, how hard are you working?” Then start together for one step.",
          score: 10,
          feedback: "Nice repair. You use your scale and return him to the plan without a debate.",
          next: "step3A"
        },
        B: {
          text: "Ignore and continue helping others.",
          score: 0,
          feedback: "Neutral. It avoids attention, but he may continue stalling.",
          next: "step3B"
        },
        C: {
          text: "Argue about how he needs to stop noises and be respectful.",
          score: -10,
          feedback: "Extended attention often strengthens avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR starts the first part and continues working quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He initiated work using support and replacement behavior.", next: "step4" }
      }
    },

    step3B: {
      text: "SR starts a little, then slows down and looks around again.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial engagement. He may need reinforcement to maintain effort.", next: "step4" }
      }
    },

    step3C: {
      text: "SR refuses to start and continues talking or making noises.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Avoidance is being reinforced and work initiation is breaking down.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce getting started?",
      choices: {
        A: {
          text: "Praise specifically: “Nice job starting right away and asking for help.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect. Reinforces the exact behavior you want to see again.",
          ending: "success"
        },
        B: {
          text: "Give general praise later with no mention of starting or help-seeking.",
          score: 0,
          feedback: "Neutral. Praise helps, but it is less connected to the replacement behavior.",
          ending: "mixed"
        },
        C: {
          text: "Focus only on the earlier stalling and give a corrective talk.",
          score: -10,
          feedback: "Attention to problem behavior can restart avoidance and reduce motivation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Work Initiation Reinforced",
      text: "SR started the task with support, used help-seeking, and earned reinforcement."
    },
    mixed: {
      title: "Mixed Outcome – Started, But Not Strengthened",
      text: "SR began work, but the replacement behavior was not clearly reinforced."
    },
    fail: {
      title: "Fail – Stalling Maintained",
      text: "Public attention or extended correction increased avoidance and reduced future work initiation."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 8 — Reading to Writing Transition (Refusal at Shift)
 **************************************************/
POOL.daily.push({
  id: "daily_8_reading_to_writing_transition_refusal",
  title: "Daily Mission: Reading to Writing Transition",
  start: "step1",
  steps: {

    step1: {
      text: "Reading time ends and students must switch to writing. SR groans, puts his head down, and says quietly, “I hate writing,” while looking to see who heard.",
      choices: {
        A: {
          text: "Calm transition support: “Writing feels hard sometimes. Pick the hardest part. We start together for one sentence, then you go on your own.”",
          score: 10,
          feedback: "Great fidelity. You validate briefly, reduce the demand, and prevent escape with structured support.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “It’s time to write,” and move on.",
          score: 0,
          feedback: "Neutral. It may not be enough if the shift is a trigger for avoidance.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop complaining,” in front of nearby students.",
          score: -10,
          feedback: "Public correction can increase attention and refusal behaviors.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR sits up but still looks stuck. He taps his pencil and glances at a peer like he wants to talk instead.",
      choices: {
        A: {
          text: "Prompt help-seeking: “If it’s hard, ask for help.” Then set a short goal: “One sentence, then quick check-in.”",
          score: 10,
          feedback: "Excellent. Clear replacement behavior plus a small, doable expectation.",
          next: "step3A"
        },
        B: {
          text: "Tell him to just write anything to get started.",
          score: 0,
          feedback: "Neutral. It may help, but help-seeking is still not clearly taught.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is wasting time and needs to hurry.",
          score: -10,
          feedback: "Pressure can increase avoidance and emotional escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR begins whispering to a peer and makes a quiet noise, avoiding the transition.",
      choices: {
        A: {
          text: "Proximity + quiet reminder: “Save conversation for later. Show me the hardest part and we start together.”",
          score: 10,
          feedback: "Great. Prevents escape and cues the start-together strategy privately.",
          next: "step3A"
        },
        B: {
          text: "Give him a stern look and keep circulating.",
          score: 0,
          feedback: "Neutral. Might work, but it does not teach the replacement behavior.",
          next: "step3B"
        },
        C: {
          text: "Call him out by name so others stop talking too.",
          score: -10,
          feedback: "Public attention increases the payoff and can escalate refusal.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR smirks and continues, now louder: “This is so dumb.” A few students glance over.",
      choices: {
        A: {
          text: "Quiet stop-and: “We will debrief after.” Then: “One sentence first.” Offer help to start.",
          score: 10,
          feedback: "Good repair. You reduce attention, avoid debate, and return to a clear step.",
          next: "step3A"
        },
        B: {
          text: "Tell him to lower his voice and keep moving.",
          score: 0,
          feedback: "Neutral. It reduces volume but does not address the escape function.",
          next: "step3B"
        },
        C: {
          text: "Lecture him about attitude and respecting class time.",
          score: -10,
          feedback: "Extended attention can reinforce the behavior and increase avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR writes one sentence with support and then continues quietly on his own.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He transitioned successfully using support and persistence.", next: "step4" }
      }
    },

    step3B: {
      text: "SR writes a few words, then pauses again and scans for distraction.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial engagement. Reinforcement may be needed to maintain effort.", next: "step4" }
      }
    },

    step3C: {
      text: "SR refuses to write and keeps trying to engage peers.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Avoidance is being maintained through peer attention and escape.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce a successful transition?",
      choices: {
        A: {
          text: "Praise specifically and reinforce: “Nice job switching to writing and sticking with it.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect reinforcement for flexibility and persistence.",
          ending: "success"
        },
        B: {
          text: "Move on once he is writing without acknowledging the transition.",
          score: 0,
          feedback: "Neutral. Transition happened, but it may not maintain without reinforcement.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier comments again as a warning.",
          score: -10,
          feedback: "Reintroduces attention and can restart avoidance in the next transition.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Transition Tolerance Reinforced",
      text: "SR transitioned from reading to writing with structured support and earned reinforcement for persistence."
    },
    mixed: {
      title: "Mixed Outcome – Transition Happened, Weakly Reinforced",
      text: "SR transitioned, but the replacement behaviors were not clearly reinforced."
    },
    fail: {
      title: "Fail – Transition Avoidance Increased",
      text: "Public attention and extended correction increased avoidance during future reading to writing shifts."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 9 — Class Discussion (Blurting and Peer Attention)
 **************************************************/
POOL.daily.push({
  id: "daily_9_class_discussion_blurt_peer_attention",
  title: "Daily Mission: Class Discussion",
  start: "step1",
  steps: {

    step1: {
      text: "During a class discussion, SR blurts a comment out of turn, then smirks and looks around to see who noticed.",
      choices: {
        A: {
          text: "Use a quiet reminder close by: “Save conversation for later. Raise your hand if you want to share.”",
          score: 10,
          feedback: "Great. Private, quick, and prompts the replacement behavior without giving a stage.",
          next: "step2A"
        },
        B: {
          text: "Say, “Please wait your turn,” from the front of the room.",
          score: 0,
          feedback: "Neutral. It is a reminder, but it gives attention during the behavior.",
          next: "step2B"
        },
        C: {
          text: "Stop and correct him publicly in front of the class.",
          score: -10,
          feedback: "Public attention can increase blurting and peer reactions.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR quiets and raises his hand halfway, then lowers it quickly like he is unsure.",
      choices: {
        A: {
          text: "Prompt and reinforce: “Thanks for raising your hand. I will call on you soon.”",
          score: 10,
          feedback: "Excellent. You reinforce the replacement behavior immediately.",
          next: "step3A"
        },
        B: {
          text: "Continue the discussion without acknowledging the hand raise.",
          score: 0,
          feedback: "Neutral. Hand-raising may not maintain without reinforcement.",
          next: "step3B"
        },
        C: {
          text: "Tell him he lost his chance because he blurted earlier.",
          score: -10,
          feedback: "Unpredictable access increases attention-seeking and frustration.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR makes a quiet noise and whispers to a peer, trying to keep attention on himself.",
      choices: {
        A: {
          text: "Proximity + quiet cue: “Raise your hand.” Then move your attention away.",
          score: 10,
          feedback: "Great. Clear prompt with minimal attention.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and continue teaching.",
          score: 0,
          feedback: "Neutral. Might work, but it is not explicit teaching or reinforcement.",
          next: "step3B"
        },
        C: {
          text: "Engage him in a back-and-forth about interrupting.",
          score: -10,
          feedback: "Extended attention can reinforce blurting and talking.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "Peers look over. SR smiles wider and blurts again to keep the attention.",
      choices: {
        A: {
          text: "Quiet repair: “Reset. Raise your hand if you want to share.” Then call on another student.",
          score: 10,
          feedback: "Nice repair. You remove the audience payoff and prompt the replacement.",
          next: "step3A"
        },
        B: {
          text: "Tell him to be quiet and keep going.",
          score: 0,
          feedback: "Neutral. It might stop the behavior but does not strengthen hand-raising.",
          next: "step3B"
        },
        C: {
          text: "Lecture the class about respect and listening.",
          score: -10,
          feedback: "Creates a big attention moment tied to SR’s behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR raises his hand appropriately and waits.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Replacement behavior is occurring.", next: "step4" }
      }
    },

    step3B: {
      text: "SR is quieter but still scanning for reactions from peers.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stable, but reinforcement may be needed to maintain the replacement.", next: "step4" }
      }
    },

    step3C: {
      text: "SR keeps talking out of turn and peers are starting to react more.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining the behavior.", next: "step4" }
      }
    },

    step4: {
      text: "How do you wrap up support during discussion?",
      choices: {
        A: {
          text: "Call on him soon and praise: “Thanks for raising your hand.” Give a Yeehaw ticket if appropriate.",
          score: 10,
          feedback: "Perfect. Reinforces the replacement behavior and reduces blurting next time.",
          ending: "success"
        },
        B: {
          text: "Call on him but do not praise the hand raise.",
          score: 0,
          feedback: "Neutral. He got attention, but the replacement behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Skip him entirely because of earlier blurting.",
          score: -10,
          feedback: "Inconsistent access can increase attention-seeking and frustration.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Hand-Raising Reinforced",
      text: "SR used the replacement behavior and received reinforcement for waiting appropriately."
    },
    mixed: {
      title: "Mixed Outcome – Participated, Weakly Reinforced",
      text: "SR participated, but reinforcement for the replacement behavior was unclear."
    },
    fail: {
      title: "Fail – Blurting Pattern Continued",
      text: "Inconsistent attention increased the likelihood of future blurting and peer-driven distractions."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 10 — End of Block Check-In (Stop-and Debrief After)
 **************************************************/
POOL.daily.push({
  id: "daily_10_end_block_debrief_follow_through",
  title: "Daily Mission: End of Block Follow-Through",
  start: "step1",
  steps: {

    step1: {
      text: "After a tough independent work block, SR is calmer but still looks frustrated. He mutters, “This was dumb,” and starts to pack up early to avoid finishing the last part.",
      choices: {
        A: {
          text: "Calm stop-and: “We will debrief after.” Then: “Finish this last small part with me, then you are done.”",
          score: 10,
          feedback: "Great fidelity. You follow through privately, reduce the demand, and prevent escape at the end.",
          next: "step2A"
        },
        B: {
          text: "Let him pack up to avoid an argument and move on.",
          score: 0,
          feedback: "Neutral. It keeps the peace, but it can reinforce escaping the last part of work.",
          next: "step2B"
        },
        C: {
          text: "Call him out in front of others: “You are not done, stop complaining.”",
          score: -10,
          feedback: "Public correction increases attention and can re-escalate him.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR sits back down and looks at the last problem, still hesitant.",
      choices: {
        A: {
          text: "Prompt help-seeking and effort: “Ask for help if you need it.” Then: “One problem, then we check your 1–10 and you are finished.”",
          score: 10,
          feedback: "Excellent. Clear replacement behavior and a predictable finish line.",
          next: "step3A"
        },
        B: {
          text: "Say, “Just do it,” and wait.",
          score: 0,
          feedback: "Neutral. Without support, he may stall again.",
          next: "step3B"
        },
        C: {
          text: "Tell him he should not be frustrated and needs to stop with the comments.",
          score: -10,
          feedback: "Invalidation increases avoidance and can restart the cycle.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR packs up quickly and relaxes. He starts chatting quietly since the work is over for him.",
      choices: {
        A: {
          text: "Re-present a tiny chunk: “One last problem with me, then you are done.” Prompt: “Ask for help if it’s hard.”",
          score: 10,
          feedback: "Good repair. You restore follow-through with a small, supported demand.",
          next: "step3A"
        },
        B: {
          text: "Let it go today and plan to start earlier tomorrow.",
          score: 0,
          feedback: "Neutral. Planning helps, but SR may still learn that packing up ends the demand.",
          next: "step3B"
        },
        C: {
          text: "Take away a privilege because he packed up early.",
          score: -10,
          feedback: "Punishment without teaching the replacement can increase avoidance next time.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR becomes more tense and mutters louder, looking to see if peers are watching.",
      choices: {
        A: {
          text: "Quiet repair: move closer and say, “We will talk after. Right now: one last part.” Then help him start.",
          score: 10,
          feedback: "Nice repair. You reduce the audience effect and return to a doable step.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and keep moving around the room.",
          score: 0,
          feedback: "Neutral. It may reduce attention, but he may still escape the final part.",
          next: "step3B"
        },
        C: {
          text: "Continue correcting him publicly until he complies.",
          score: -10,
          feedback: "Sustained public attention increases escalation and escape.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR completes the last small part and hands it in, calmer.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Follow-through happened with support and a clear finish.", next: "step4" }
      }
    },

    step3B: {
      text: "SR completes part of it but still tries to end early and avoid finishing.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Some follow-through, but reinforcement and structure may need to be clearer.", next: "step4" }
      }
    },

    step3C: {
      text: "SR refuses to finish and escalates his comments, now more attention-driven.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Public attention increased the payoff and strengthened avoidance.", next: "step4" }
      }
    },

    step4: {
      text: "How do you end the block and strengthen future success?",
      choices: {
        A: {
          text: "Praise and reinforce: “Thanks for finishing and asking for help.” Give a Yeehaw ticket, and do a brief private debrief later.",
          score: 10,
          feedback: "Perfect. Reinforces follow-through and keeps the debrief private and brief.",
          ending: "success"
        },
        B: {
          text: "Let him transition without acknowledgment since the block is over.",
          score: 0,
          feedback: "Neutral. It ends calmly, but the replacement behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Debrief the whole incident in front of peers before transitioning.",
          score: -10,
          feedback: "Public attention can make future end-of-block avoidance more likely.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Follow-Through Reinforced",
      text: "SR finished a small final demand with support, then earned reinforcement for persistence and help-seeking."
    },
    mixed: {
      title: "Mixed Outcome – Calm Ending, Weak Reinforcement",
      text: "The block ended calmly, but replacement behaviors were not clearly strengthened for next time."
    },
    fail: {
      title: "Fail – End-of-Block Avoidance Maintained",
      text: "Public attention and inconsistent follow-through increased avoidance and made future work completion harder."
    }
  }
});

/*************************************************
 * CRISIS SCENARIO 1 — Loud Work Refusal (ELA)
 **************************************************/
POOL.crisis.push({
  id: "crisis_1_loud_work_refusal_ela",
  title: "Crisis Drill: Loud Work Refusal (ELA)",
  start: "step1",
  steps: {

    step1: {
      text: "During ELA, SR looks at the assignment and says loudly, “No. I am not doing this.” A few peers look up.",
      choices: {
        A: {
          text: "Use calm, brief directive: “Start the first sentence with me. Then you do the next one.” Prompt: “If it’s hard, ask for help.”",
          score: 10,
          feedback: "Great fidelity. You reduce the start-up barrier and avoid an argument.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “You need to do your work,” and stand nearby.",
          score: 0,
          feedback: "Neutral. It is a directive, but it does not give a clear entry step or replacement behavior.",
          next: "step2B"
        },
        C: {
          text: "Correct publicly: “Stop it. You are being disrespectful.”",
          score: -10,
          feedback: "Public correction can increase attention and escalate refusal.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR crosses his arms but quiets. He looks at the page, still tense.",
      choices: {
        A: {
          text: "Private stop-and: “We will debrief after.” Then: “1–10, how hard are you working?” Offer a choice: “Start with #1 or #2.”",
          score: 10,
          feedback: "Excellent. You use your scale and give a small choice that supports re-entry.",
          next: "step3A"
        },
        B: {
          text: "Give him space and work with other students for a few minutes.",
          score: 0,
          feedback: "Neutral. Space can help, but without a clear entry plan he may stay stuck.",
          next: "step3B"
        },
        C: {
          text: "Ask, “Why are you refusing?” and continue questioning.",
          score: -10,
          feedback: "Extended interaction often reinforces refusal through attention and delay.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR makes a loud “Uhhhh” sound and looks around at peers, then pushes his paper away again.",
      choices: {
        A: {
          text: "Use proximity and calm directive: “Show me the hardest part. We start together.”",
          score: 10,
          feedback: "Great repair. You reduce demands and move him into action.",
          next: "step3A"
        },
        B: {
          text: "Repeat, “Do your work,” one more time and wait.",
          score: 0,
          feedback: "Neutral. It may not reduce escape if he feels stuck.",
          next: "step3B"
        },
        C: {
          text: "Call him out across the room and tell him to stop making noises.",
          score: -10,
          feedback: "Public attention increases the payoff and can escalate behavior.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR raises his voice: “This is dumb!” Peers are watching.",
      choices: {
        A: {
          text: "Calm and brief: “We will talk after.” Then: “One sentence with me.”",
          score: 10,
          feedback: "Strong repair. You reduce audience effect and give a clear next step.",
          next: "step3A"
        },
        B: {
          text: "Say, “Lower your voice,” and continue teaching.",
          score: 0,
          feedback: "Neutral. It may reduce volume but does not address the escape function.",
          next: "step3B"
        },
        C: {
          text: "Lecture about attitude and respect.",
          score: -10,
          feedback: "Extended attention can increase refusal and delay work re-entry.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR completes a small part with support and starts working quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He re-entered the task using support and replacement behavior.", next: "step4" }
      }
    },

    step3B: {
      text: "SR sits quietly but does not begin working yet.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stabilized, but he may need a clearer entry step and reinforcement.", next: "step4" }
      }
    },

    step3C: {
      text: "SR refuses again and tries to engage peers with comments.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Refusal is being reinforced through attention and escape.", next: "step4" }
      }
    },

    step4: {
      text: "How do you finalize support once he re-engages?",
      choices: {
        A: {
          text: "Praise specifically: “Thanks for doing what you could and asking for help.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect. Reinforces recovery, persistence, and help-seeking.",
          ending: "success"
        },
        B: {
          text: "Let him work without acknowledgment to keep things calm.",
          score: 0,
          feedback: "Neutral. Calm, but the replacement behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Re-address the refusal with a corrective talk.",
          score: -10,
          feedback: "Adds attention and can restart avoidance.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Re-entry Reinforced", text: "SR re-entered the task with structured support and earned reinforcement for recovery." },
    mixed: { title: "Mixed – Stabilized, Weakly Reinforced", text: "SR calmed and worked, but replacement behaviors were not clearly strengthened." },
    fail: { title: "Fail – Refusal Cycle Continued", text: "Public attention and extended correction increased escape and attention payoffs." }
  }
});


/*************************************************
 * CRISIS SCENARIO 2 — Shutdown (Head Down, Refuses Help)
 **************************************************/
POOL.crisis.push({
  id: "crisis_2_shutdown_head_down",
  title: "Crisis Drill: Shutdown (Head Down)",
  start: "step1",
  steps: {

    step1: {
      text: "During independent work, SR puts his head down and refuses to respond. He does not start any work. A peer whispers, “What’s he doing?”",
      choices: {
        A: {
          text: "Use quiet proximity: “We will debrief after.” Then offer a tiny entry: “Point to the hardest part. We start together.”",
          score: 10,
          feedback: "Great. Low attention, low verbal load, and a clear entry step.",
          next: "step2A"
        },
        B: {
          text: "Ask, “Are you okay?” and keep asking questions until he answers.",
          score: 0,
          feedback: "Neutral. Caring, but it can increase attention and delay work re-entry.",
          next: "step2B"
        },
        C: {
          text: "Say, “Sit up right now,” where others can hear.",
          score: -10,
          feedback: "Public demands can increase escalation and refusal.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR lifts his head slightly and points at a question, still quiet.",
      choices: {
        A: {
          text: "Prompt help-seeking: “Ask for help.” Then do the first part together and fade: “Now you do the next one.”",
          score: 10,
          feedback: "Excellent. You teach the replacement and use start-together then fade support.",
          next: "step3A"
        },
        B: {
          text: "Tell him you will come back later and move away.",
          score: 0,
          feedback: "Neutral. Space can help, but he may remain stuck without a clear plan.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is choosing to fail if he does not work.",
          score: -10,
          feedback: "Threat-based attention increases distress and avoidance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR stays silent and keeps his head down. He makes a small noise when you speak.",
      choices: {
        A: {
          text: "Reduce verbal load and offer the scale: show fingers and ask quietly, “1–10 effort?” Then prompt a tiny next step.",
          score: 10,
          feedback: "Great repair. Minimal talking and a structured check-in supports regulation.",
          next: "step3A"
        },
        B: {
          text: "Give him a few minutes with no plan and hope he starts.",
          score: 0,
          feedback: "Neutral. It might work, but it is less predictable.",
          next: "step3B"
        },
        C: {
          text: "Announce to the class that SR is not participating.",
          score: -10,
          feedback: "Public attention increases shame and escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR mutters, “No,” and peers are watching.",
      choices: {
        A: {
          text: "Quiet repair: move closer, lower voice, and say, “We will talk after. One small part with me.”",
          score: 10,
          feedback: "Strong repair. Removes the audience and gives a clear entry step.",
          next: "step3A"
        },
        B: {
          text: "Tell him again to sit up and start.",
          score: 0,
          feedback: "Neutral. Repetition can increase resistance if the task feels hard.",
          next: "step3B"
        },
        C: {
          text: "Argue about why he has to do it now.",
          score: -10,
          feedback: "Debate increases attention and keeps escape efficient.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR completes a small part and begins working quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Recovery and task initiation occurred.", next: "step4" }
      }
    },

    step3B: {
      text: "SR sits up but stays slow and does very little work.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial recovery. He may need reinforcement and another small entry step.", next: "step4" }
      }
    },

    step3C: {
      text: "SR stays shut down and begins trying to avoid the task completely.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Avoidance is being maintained.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce recovery?",
      choices: {
        A: {
          text: "Praise quietly: “Thanks for rejoining and trying.” Give a Yeehaw ticket for starting.",
          score: 10,
          feedback: "Perfect. Reinforces recovery and effort.",
          ending: "success"
        },
        B: {
          text: "Let him work without comment to avoid triggering him again.",
          score: 0,
          feedback: "Neutral. Calm, but less likely to strengthen recovery behavior.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the shutdown and correct him in front of others.",
          score: -10,
          feedback: "Public attention increases shame and future avoidance.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Shutdown Recovery", text: "SR rejoined with low-attention support and earned reinforcement for effort." },
    mixed: { title: "Mixed – Calmed, Weak Reinforcement", text: "SR stabilized but did not receive strong reinforcement for recovery." },
    fail: { title: "Fail – Avoidance Strengthened", text: "Public attention and pressure increased escape and refusal patterns." }
  }
});


/*************************************************
 * CRISIS SCENARIO 3 — Escalation via Noises and Peer Attention
 **************************************************/
POOL.crisis.push({
  id: "crisis_3_noises_peer_attention_escalation",
  title: "Crisis Drill: Noises Escalation (Peers Watching)",
  start: "step1",
  steps: {

    step1: {
      text: "During a quiet work block, SR starts making louder noises and comments under his breath. Two students turn and smirk.",
      choices: {
        A: {
          text: "Use proximity and quiet cue: “No noises. If it’s hard, ask for help.” Then shift your attention away.",
          score: 10,
          feedback: "Great. Private, brief, and matches the plan without building a stage.",
          next: "step2A"
        },
        B: {
          text: "Say from your desk, “SR, stop,” and keep watching.",
          score: 0,
          feedback: "Neutral. It addresses the behavior but can still provide attention.",
          next: "step2B"
        },
        C: {
          text: "Stop the class and address the noises publicly.",
          score: -10,
          feedback: "Public attention can reinforce the behavior and escalate.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR quiets briefly, then stares at the assignment and looks stuck.",
      choices: {
        A: {
          text: "Start together quickly: “Show me the hardest part.” Do the first step with him, then fade support.",
          score: 10,
          feedback: "Excellent. Addresses the root escape trigger and prevents the noise cycle.",
          next: "step3A"
        },
        B: {
          text: "Walk away to give space and hope he starts.",
          score: 0,
          feedback: "Neutral. Space can help but may not create entry if he is stuck.",
          next: "step3B"
        },
        C: {
          text: "Tell him, “You’re fine,” and insist he just do it.",
          score: -10,
          feedback: "Invalidation and pressure can increase escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR makes another loud noise and glances at peers again to see their reaction.",
      choices: {
        A: {
          text: "Stop-and privately: “We will debrief after.” Then prompt: “1–10 effort?” and give a tiny work goal.",
          score: 10,
          feedback: "Great repair. You cut attention and move him toward action with your routine.",
          next: "step3A"
        },
        B: {
          text: "Repeat, “Stop,” again and keep monitoring.",
          score: 0,
          feedback: "Neutral. Repetition can turn into a pattern of attention.",
          next: "step3B"
        },
        C: {
          text: "Correct him sarcastically or with frustration.",
          score: -10,
          feedback: "Adds emotion and attention, which increases the payoff.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR smiles and increases the volume, clearly enjoying the audience.",
      choices: {
        A: {
          text: "Shift class attention away, move closer, and quietly cue: “No noises. Show me the hardest part.”",
          score: 10,
          feedback: "Excellent. Removes peer reinforcement and redirects to the task support plan.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and continue teaching.",
          score: 0,
          feedback: "Neutral. Might reduce attention, but it does not teach the replacement behavior.",
          next: "step3B"
        },
        C: {
          text: "Lecture about how he is disrupting everyone.",
          score: -10,
          feedback: "Big attention moment that can lock in the behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR becomes quiet, completes a small chunk, and stays seated.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He regulated and re-entered work.", next: "step4" }
      }
    },

    step3B: {
      text: "SR quiets but stays slow and keeps looking around.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stable, but he may need reinforcement and a clearer work entry step.", next: "step4" }
      }
    },

    step3C: {
      text: "SR continues making noises and peers keep reacting.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining the escalation cycle.", next: "step4" }
      }
    },

    step4: {
      text: "How do you finalize support after he calms?",
      choices: {
        A: {
          text: "Praise specifically and reinforce: “Thanks for staying quiet and getting started.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect. Reinforces the calm behavior and work initiation.",
          ending: "success"
        },
        B: {
          text: "Let him work without comment to keep it calm.",
          score: 0,
          feedback: "Neutral. Calm, but less likely to strengthen future regulation.",
          ending: "mixed"
        },
        C: {
          text: "Revisit the noise behavior with a public correction.",
          score: -10,
          feedback: "Public attention can trigger the cycle again.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Noise Cycle Interrupted", text: "SR re-entered work with low attention support and earned reinforcement for calm behavior." },
    mixed: { title: "Mixed – Stabilized, Not Strengthened", text: "SR calmed, but reinforcement was unclear and future cycles may repeat." },
    fail: { title: "Fail – Escalation Maintained", text: "Public attention increased peer reinforcement and strengthened the pattern." }
  }
});


/*************************************************
 * CRISIS SCENARIO 4 — Hallway Transition Refusal
 **************************************************/
POOL.crisis.push({
  id: "crisis_4_hallway_transition_refusal",
  title: "Crisis Drill: Hallway Transition Refusal",
  start: "step1",
  steps: {

    step1: {
      text: "It is time to line up. SR stays seated and says, “I’m not going,” while peers are lining up and watching.",
      choices: {
        A: {
          text: "Calm, brief directive: “Stand up and join the line.” Then: “We will talk after.” Offer a tiny choice: “Front or back of line?”",
          score: 10,
          feedback: "Great. Clear direction, private debrief later, and a small choice reduces resistance.",
          next: "step2A"
        },
        B: {
          text: "Say, “It’s time,” and wait for him to comply.",
          score: 0,
          feedback: "Neutral. Waiting can work, but it may allow escape and peer attention to grow.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “SR is holding us up,” so the class hears.",
          score: -10,
          feedback: "Public pressure increases attention and escalates refusal.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR stands slowly, still tense, and looks at peers.",
      choices: {
        A: {
          text: "Use proximity and quiet cue: “Quiet line.” Then move attention away and start the line moving.",
          score: 10,
          feedback: "Excellent. You reduce audience and reinforce the routine with low attention.",
          next: "step3A"
        },
        B: {
          text: "Keep watching him closely the whole time.",
          score: 0,
          feedback: "Neutral. Monitoring helps, but it can become attention-heavy.",
          next: "step3B"
        },
        C: {
          text: "Remind him again about consequences if he refuses.",
          score: -10,
          feedback: "Threat-based attention can re-escalate him in the hallway.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR makes a loud noise, then looks around to see if anyone reacts.",
      choices: {
        A: {
          text: "Quiet repair: move closer and say, “Stand up now.” Then: “We will debrief after.”",
          score: 10,
          feedback: "Great. Brief and private, reduces peer attention.",
          next: "step3A"
        },
        B: {
          text: "Repeat the request again and keep waiting.",
          score: 0,
          feedback: "Neutral. May work, but it keeps attention on the refusal.",
          next: "step3B"
        },
        C: {
          text: "Argue about why he has to line up right now.",
          score: -10,
          feedback: "Debate increases attention and delays the transition, reinforcing escape.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "Peers stare. SR smirks and stays seated longer.",
      choices: {
        A: {
          text: "Shift class attention away, start the line moving, and quietly cue SR: “Join us now.”",
          score: 10,
          feedback: "Excellent. Removes the audience and reduces reinforcement for refusal.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and wait.",
          score: 0,
          feedback: "Neutral. Might work, but refusal may continue.",
          next: "step3B"
        },
        C: {
          text: "Continue the public correction and call out his behavior.",
          score: -10,
          feedback: "High attention increases escalation and refusal patterns.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR joins the line and walks quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Transition occurred with low attention support.", next: "step4" }
      }
    },

    step3B: {
      text: "SR joins but continues small noises and glances at peers.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial transition success. Reinforcement may be needed.", next: "step4" }
      }
    },

    step3C: {
      text: "SR refuses again and talks louder, now attention-driven.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Escape and attention payoffs are increasing.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce a successful transition?",
      choices: {
        A: {
          text: "At the destination, praise quietly: “Thanks for joining the line.” Give a Yeehaw ticket for a quiet transition.",
          score: 10,
          feedback: "Perfect. Reinforces the hallway routine and recovery.",
          ending: "success"
        },
        B: {
          text: "Move on without acknowledging to keep it calm.",
          score: 0,
          feedback: "Neutral. Calm, but less likely to strengthen future transitions.",
          ending: "mixed"
        },
        C: {
          text: "Debrief the refusal in front of peers.",
          score: -10,
          feedback: "Public attention increases the likelihood of future refusal in transitions.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Transition Restored", text: "SR joined the transition with low attention support and earned reinforcement for recovery." },
    mixed: { title: "Mixed – Transition Occurred, Weakly Reinforced", text: "SR transitioned, but reinforcement for recovery and quiet behavior was unclear." },
    fail: { title: "Fail – Refusal Reinforced", text: "Public attention and delays increased the payoff for refusal and escape." }
  }
});


/*************************************************
 * CRISIS SCENARIO 5 — Escalation After Correction (Power Struggle Risk)
 **************************************************/
POOL.crisis.push({
  id: "crisis_5_power_struggle_after_correction",
  title: "Crisis Drill: Power Struggle After Correction",
  start: "step1",
  steps: {

    step1: {
      text: "You give SR a quiet reminder to stop talking during work. SR snaps back, “Why do you always pick on me?” and looks around to see who is watching.",
      choices: {
        A: {
          text: "Stay calm and brief: “We will debrief after.” Then give the next step: “One small part, then check in.”",
          score: 10,
          feedback: "Excellent. You avoid the debate and move directly to a doable action.",
          next: "step2A"
        },
        B: {
          text: "Explain why you corrected him and try to convince him it is fair.",
          score: 0,
          feedback: "Neutral. It is well-meaning, but it can extend the attention and fuel the power struggle.",
          next: "step2B"
        },
        C: {
          text: "Respond emotionally: “Do not talk to me like that,” where others can hear.",
          score: -10,
          feedback: "Public emotional correction can escalate and reinforce attention-seeking.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR is still tense but looks back at the work and makes a small noise.",
      choices: {
        A: {
          text: "Use the scale privately: “1–10 effort?” Then: “Show me the hardest part. We start together.”",
          score: 10,
          feedback: "Great. Structured check-in and immediate entry to reduce escape.",
          next: "step3A"
        },
        B: {
          text: "Walk away to avoid conflict and hope he starts.",
          score: 0,
          feedback: "Neutral. Avoids a fight, but he may learn that pushback ends the demand.",
          next: "step3B"
        },
        C: {
          text: "Ask him to explain himself and keep pressing for an answer.",
          score: -10,
          feedback: "Extended back-and-forth increases attention and delays work re-entry.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR argues: “I wasn’t even talking. Everyone else talks!” Peers begin watching.",
      choices: {
        A: {
          text: "Cut debate calmly: “We will talk after.” Then point to the work: “Start here with me.”",
          score: 10,
          feedback: "Excellent repair. You end the argument and restore structure.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining why it is different and go back and forth.",
          score: 0,
          feedback: "Neutral. It may feel fair, but it keeps attention on the argument.",
          next: "step3B"
        },
        C: {
          text: "Publicly list his past behaviors or warn about consequences.",
          score: -10,
          feedback: "Public attention and shame can escalate and increase refusal.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR gets louder: “This class is stupid!” Peers react.",
      choices: {
        A: {
          text: "Shift attention away, move closer, and say quietly: “Reset. One small part with me.”",
          score: 10,
          feedback: "Strong repair. Removes the audience and sets a tiny action step.",
          next: "step3A"
        },
        B: {
          text: "Tell him to lower his voice and keep teaching.",
          score: 0,
          feedback: "Neutral. It addresses volume but not the escape function.",
          next: "step3B"
        },
        C: {
          text: "Lecture about respect and embarrassment in front of peers.",
          score: -10,
          feedback: "Public attention increases the payoff and can lock in the power struggle pattern.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR calms, completes a small part, and stops the argument.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He de-escalated and re-entered the task.", next: "step4" }
      }
    },

    step3B: {
      text: "SR quiets but stays rigid and does very little work.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Stabilized, but reinforcement and a clearer finish line may be needed.", next: "step4" }
      }
    },

    step3C: {
      text: "SR keeps arguing and tries to gain peer attention.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Attention and escape are both being reinforced.", next: "step4" }
      }
    },

    step4: {
      text: "How do you finalize support after de-escalation?",
      choices: {
        A: {
          text: "Praise recovery privately: “Thanks for resetting and getting started.” Give a Yeehaw ticket for re-entry.",
          score: 10,
          feedback: "Perfect. Reinforces de-escalation and task initiation.",
          ending: "success"
        },
        B: {
          text: "Let him move on without reinforcement to keep things calm.",
          score: 0,
          feedback: "Neutral. Calm, but less likely to strengthen recovery behavior.",
          ending: "mixed"
        },
        C: {
          text: "Revisit the argument publicly to teach him a lesson.",
          score: -10,
          feedback: "Public attention can restart the power struggle and increase future escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Power Struggle Avoided", text: "SR de-escalated with minimal attention and earned reinforcement for recovery and re-entry." },
    mixed: { title: "Mixed – Calmed, Weakly Reinforced", text: "SR stabilized, but reinforcement and structure were not strong enough to prevent future cycles." },
    fail: { title: "Fail – Power Struggle Reinforced", text: "Debate and public attention increased escape and attention payoffs, making escalation more likely next time." }
  }
});

/*************************************************
 * WILDCARD SCENARIO 1 — Surprise Schedule Change (Assembly)
 **************************************************/
POOL.wild.push({
  id: "wild_1_surprise_schedule_change_assembly_sr",
  title: "Wildcard Mission: Surprise Assembly",
  start: "step1",
  steps: {

    step1: {
      text: "An unexpected announcement comes over the intercom: the class must head to an assembly right now. SR freezes, then mutters, “Seriously?” and starts making quiet noises while looking around at peers.",
      choices: {
        A: {
          text: "Use calm directive with structure: “Line up now. We go together.” Then quietly pre-correct: “Quiet line.”",
          score: 10,
          feedback: "Great fidelity. Clear direction, low attention, and strong structure during a change.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “It’s fine, let’s go,” and move the class out.",
          score: 0,
          feedback: "Neutral. It moves things along, but does not pre-correct SR’s trigger behaviors.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop with the noises,” where others can hear.",
          score: -10,
          feedback: "Public correction can increase attention and escalate during an already unstructured moment.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR stands and joins the line, still tense, looking at peers as if to see who is watching.",
      choices: {
        A: {
          text: "Quietly cue: “Eyes forward. Save conversation for later.” Then shift attention away and move the line.",
          score: 10,
          feedback: "Excellent. Brief, private, and reduces audience reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Keep watching SR closely the whole time.",
          score: 0,
          feedback: "Neutral. Monitoring helps, but it can turn into attention.",
          next: "step3B"
        },
        C: {
          text: "Explain in detail why schedules change and why he needs to comply.",
          score: -10,
          feedback: "Extended talking can increase attention and delay, reinforcing escape.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR shuffles slowly and starts a quiet side comment to a peer to avoid lining up.",
      choices: {
        A: {
          text: "Use proximity and quiet reminder: “Quiet line. Join us now.”",
          score: 10,
          feedback: "Great. Private correction without creating a peer attention moment.",
          next: "step3A"
        },
        B: {
          text: "Repeat, “Let’s go,” to the class again.",
          score: 0,
          feedback: "Neutral. Classwide reminders can become background noise for SR.",
          next: "step3B"
        },
        C: {
          text: "Stop and call out SR’s behavior in front of the line.",
          score: -10,
          feedback: "Public attention can increase side talk and resistance.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR smirks slightly and makes a louder noise, clearly checking peer reactions.",
      choices: {
        A: {
          text: "Repair quietly: “We will debrief after.” Then: “Line up now.” Shift the class forward to reduce the audience.",
          score: 10,
          feedback: "Excellent repair. Removes the audience and gives a clear next step.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and keep moving.",
          score: 0,
          feedback: "Neutral. Might work, but it is not explicit prompting.",
          next: "step3B"
        },
        C: {
          text: "Continue correcting him publicly until he stops.",
          score: -10,
          feedback: "Sustained attention can escalate and reinforce the behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR walks with the class quietly and keeps his focus forward.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Successful transition during a schedule change.", next: "step4" }
      }
    },

    step3B: {
      text: "SR walks but continues small noises and glances around.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stabilization. Reinforcement may be needed.", next: "step4" }
      }
    },

    step3C: {
      text: "SR continues noises and peer attention increases.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Attention and escape payoffs are increasing.", next: "step4" }
      }
    },

    step4: {
      text: "How do you support SR during the assembly transition?",
      choices: {
        A: {
          text: "Quietly praise at the destination: “Thanks for walking quietly.” Give a Yeehaw ticket for the transition.",
          score: 10,
          feedback: "Perfect. Reinforces flexibility and hallway expectations.",
          ending: "success"
        },
        B: {
          text: "Let him settle without comment since things are busy.",
          score: 0,
          feedback: "Neutral. Calm, but the coping behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Discuss his noises in front of the group.",
          score: -10,
          feedback: "Public attention increases the chance of future noise behavior during schedule changes.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Change Managed", text: "SR followed the transition routine during a surprise change and earned reinforcement for coping." },
    mixed: { title: "Mixed – Managed, Weakly Reinforced", text: "SR made it through the change, but replacement behaviors were not clearly reinforced." },
    fail: { title: "Fail – Attention Fueled Escalation", text: "Public attention increased the payoff for noises and resistance during change." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 2 — Substitute Day (Lower Structure)
 **************************************************/
POOL.wild.push({
  id: "wild_2_substitute_day_structure_slips_sr",
  title: "Wildcard Mission: Substitute Teacher Day",
  start: "step1",
  steps: {

    step1: {
      text: "A substitute is leading the class. SR notices the lower structure and starts whispering to peers and making quiet noises while tasks are being explained.",
      choices: {
        A: {
          text: "Pre-correct privately: “Routine stays the same. Quiet during directions. If it’s hard, ask for help.”",
          score: 10,
          feedback: "Great. Preserves expectations without creating a spotlight.",
          next: "step2A"
        },
        B: {
          text: "Tell the substitute, “He can be off task sometimes,” in front of students.",
          score: 0,
          feedback: "Neutral, but it can increase attention on SR and invite peer reactions.",
          next: "step2B"
        },
        C: {
          text: "Publicly reprimand: “SR, stop trying to distract everyone.”",
          score: -10,
          feedback: "Public correction can make the behavior more reinforcing and escalate.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR quiets briefly but stares at the worksheet, then begins to stall before starting.",
      choices: {
        A: {
          text: "Start together quickly: “Show me the hardest part.” Do the first step together, then fade support.",
          score: 10,
          feedback: "Excellent. Keeps structure and prevents escape from starting.",
          next: "step3A"
        },
        B: {
          text: "Let him sit for a bit to see if he starts on his own.",
          score: 0,
          feedback: "Neutral. He may stall without a clear entry step.",
          next: "step3B"
        },
        C: {
          text: "Explain the worksheet in detail while he listens.",
          score: -10,
          feedback: "Extended attention can reinforce stalling and avoidance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR smirks and whispers, “See?” to a peer, then keeps talking quietly.",
      choices: {
        A: {
          text: "Quietly redirect with proximity: “Save conversation for later. Start with #1.”",
          score: 10,
          feedback: "Great repair. Low attention and clear direction.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and move away.",
          score: 0,
          feedback: "Neutral. Might work, but the replacement behaviors are not prompted.",
          next: "step3B"
        },
        C: {
          text: "Tell the class to ignore SR.",
          score: -10,
          feedback: "Creates a big attention moment for SR.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR laughs softly and increases whispering to peers because the class is watching.",
      choices: {
        A: {
          text: "Shift attention away, move closer, and quietly say, “We will debrief after. Start here with me.”",
          score: 10,
          feedback: "Excellent repair. Removes the audience and restores structure.",
          next: "step3A"
        },
        B: {
          text: "Tell him to lower his voice and keep going.",
          score: 0,
          feedback: "Neutral. May reduce volume but does not address escape or teach replacement behavior.",
          next: "step3B"
        },
        C: {
          text: "Lecture about respecting substitutes in front of the class.",
          score: -10,
          feedback: "Long public attention often reinforces the behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR starts the task and works quietly with minimal support.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Routine held even with a substitute.", next: "step4" }
      }
    },

    step3B: {
      text: "SR starts slowly and keeps scanning for peer attention.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial engagement. Reinforcement may be needed.", next: "step4" }
      }
    },

    step3C: {
      text: "SR continues whispering and avoids starting the work.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Low structure increased escape and attention payoffs.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce routine success with a substitute?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for starting and staying quiet during directions.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect. Reinforces coping with reduced structure.",
          ending: "success"
        },
        B: {
          text: "Let the substitute handle praise without tying it to the plan.",
          score: 0,
          feedback: "Neutral. Praise helps, but structure may be unclear.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier behavior publicly to teach a lesson.",
          score: -10,
          feedback: "Public attention increases the likelihood of future substitute-day issues.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Substitute Day Stability", text: "SR maintained expectations and earned reinforcement despite lower structure." },
    mixed: { title: "Mixed – Participated, Weak Structure", text: "SR engaged somewhat, but routines were not clearly reinforced." },
    fail: { title: "Fail – Attention Flew Wild", text: "Public attention and low structure increased avoidance and peer-driven behavior." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 3 — Technology Glitch (Frustration Trigger)
 **************************************************/
POOL.wild.push({
  id: "wild_3_technology_glitch_frustration_sr",
  title: "Wildcard Mission: Tech Glitch",
  start: "step1",
  steps: {

    step1: {
      text: "SR is working on a short online task. The page freezes and his work disappears. He sighs loudly and starts making noises under his breath while glancing at peers.",
      choices: {
        A: {
          text: "Calm directive: “Take a breath. Show me the problem.” Then: “We will fix it together, then you do the next part.”",
          score: 10,
          feedback: "Great. Calm structure reduces frustration and prevents escape behaviors.",
          next: "step2A"
        },
        B: {
          text: "Say, “That’s annoying,” and tell him to try again.",
          score: 0,
          feedback: "Neutral. Acknowledges, but does not provide a clear coping routine.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop making noises,” where others can hear.",
          score: -10,
          feedback: "Public correction increases attention and can escalate frustration.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR calms a little but still looks frustrated. He starts to stall and avoid reopening the assignment.",
      choices: {
        A: {
          text: "Use the scale quietly: “1–10 effort?” Then: “One small step: reopen it, then I check.”",
          score: 10,
          feedback: "Excellent. Structured check-in plus a tiny action step prevents avoidance.",
          next: "step3A"
        },
        B: {
          text: "Tell him to figure it out on his own since it is not hard.",
          score: 0,
          feedback: "Neutral. Might work, but could increase avoidance if he feels stuck.",
          next: "step3B"
        },
        C: {
          text: "Explain for a long time what he did wrong with technology.",
          score: -10,
          feedback: "Extended attention can increase escape and frustration.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR starts whispering to a peer about how “stupid” the computer is and avoids restarting the task.",
      choices: {
        A: {
          text: "Quiet reminder: “Save conversation for later.” Then: “Show me the hardest part and we start together.”",
          score: 10,
          feedback: "Great repair. Low attention and immediate re-entry support.",
          next: "step3A"
        },
        B: {
          text: "Let him vent a bit so he feels heard.",
          score: 0,
          feedback: "Neutral. Venting can help, but it may also reinforce delay and escape if it continues.",
          next: "step3B"
        },
        C: {
          text: "Publicly correct the complaining and call him out.",
          score: -10,
          feedback: "Public attention increases peer involvement and escalation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR smirks and makes another noise, now louder, testing for reactions.",
      choices: {
        A: {
          text: "Shift attention away, move close, and say quietly: “We will debrief after. One small step: reopen the page.”",
          score: 10,
          feedback: "Excellent repair. Removes audience and creates a clear next step.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and keep moving.",
          score: 0,
          feedback: "Neutral. Might reduce attention, but coping steps are unclear.",
          next: "step3B"
        },
        C: {
          text: "Lecture about attitude and technology in front of peers.",
          score: -10,
          feedback: "Extended attention strengthens escape and peer attention cycles.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR reopens the task, completes one small part, and settles back into work.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He recovered and re-entered the task successfully.", next: "step4" }
      }
    },

    step3B: {
      text: "SR reopens the task but stays slow and keeps glancing around.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial recovery. Reinforcement may be needed to maintain effort.", next: "step4" }
      }
    },

    step3C: {
      text: "SR refuses to restart the task and continues noises and peer comments.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Avoidance is being reinforced through delay and attention.", next: "step4" }
      }
    },

    step4: {
      text: "How do you reinforce coping after the glitch?",
      choices: {
        A: {
          text: "Praise specifically: “Nice job resetting and getting back to work.” Give a Yeehaw ticket.",
          score: 10,
          feedback: "Perfect. Reinforces coping and task re-entry.",
          ending: "success"
        },
        B: {
          text: "Let him continue without comment since he is back on track.",
          score: 0,
          feedback: "Neutral. Calm, but coping behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Bring up his earlier noises again with a corrective talk.",
          score: -10,
          feedback: "Reintroduces attention and can trigger avoidance again.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Tech Frustration Managed", text: "SR used a calm routine to recover from the glitch and earned reinforcement for re-entry." },
    mixed: { title: "Mixed – Back on Track, Weak Reinforcement", text: "SR resumed work, but coping behavior was not clearly reinforced for next time." },
    fail: { title: "Fail – Glitch Reinforced Avoidance", text: "Public attention and delays increased escape and attention payoffs." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 4 — Peer Teasing (Attention + Escape Combo)
 **************************************************/
POOL.wild.push({
  id: "wild_4_peer_teasing_trigger_sr",
  title: "Wildcard Mission: Peer Teasing Moment",
  start: "step1",
  steps: {

    step1: {
      text: "A peer quietly teases SR about his work. SR reacts by making noises and whispering back, trying to pull others into it instead of working.",
      choices: {
        A: {
          text: "Use calm proximity: “Save conversation for later.” Then redirect: “Show me the hardest part. We start together.”",
          score: 10,
          feedback: "Great. You reduce peer attention and return to task entry support.",
          next: "step2A"
        },
        B: {
          text: "Say to the group, “Stop teasing,” and keep teaching.",
          score: 0,
          feedback: "Neutral. Addresses peers, but SR may still escape the task without support steps.",
          next: "step2B"
        },
        C: {
          text: "Publicly ask SR to explain what happened.",
          score: -10,
          feedback: "Public attention can escalate peer dynamics and increase avoidance.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR quiets but stays tense and looks like he may start up again if peers look at him.",
      choices: {
        A: {
          text: "Quietly cue the scale: “1–10 effort?” Then set a tiny goal: “One problem, then check in.”",
          score: 10,
          feedback: "Excellent. Structured check-in plus a clear finish line reduces escape.",
          next: "step3A"
        },
        B: {
          text: "Tell him to ignore it and keep working.",
          score: 0,
          feedback: "Neutral. It may help, but he may still be stuck or escalated.",
          next: "step3B"
        },
        C: {
          text: "Tell him the teasing is his fault because he reacts.",
          score: -10,
          feedback: "Blame increases shame and can escalate behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR keeps whispering and now a second peer is watching. Work is not started.",
      choices: {
        A: {
          text: "Quietly separate the attention: move closer and cue: “Save conversation for later.” Then: “Start here with me.”",
          score: 10,
          feedback: "Great repair. Removes peer reinforcement and provides entry support.",
          next: "step3A"
        },
        B: {
          text: "Wait a minute and see if it stops.",
          score: 0,
          feedback: "Neutral. Waiting can allow peer attention to grow.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and lecture about bullying and respect.",
          score: -10,
          feedback: "Creates a big attention event and can reinforce SR’s reaction.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR gets louder, defending himself, and more peers are now looking over.",
      choices: {
        A: {
          text: "Shift class attention away and say quietly: “We will debrief after.” Then redirect to a tiny work goal.",
          score: 10,
          feedback: "Excellent. Removes audience and returns to structure.",
          next: "step3A"
        },
        B: {
          text: "Tell him to stop talking and keep moving.",
          score: 0,
          feedback: "Neutral. Volume may drop, but task avoidance may remain.",
          next: "step3B"
        },
        C: {
          text: "Argue in the moment about who started it.",
          score: -10,
          feedback: "Back-and-forth increases attention and delays work, reinforcing escape.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR returns to work and completes a small part quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He recovered and re-entered the task.", next: "step4" }
      }
    },

    step3B: {
      text: "SR is quieter but still not working consistently.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stabilization. He may need reinforcement and clearer entry steps.", next: "step4" }
      }
    },

    step3C: {
      text: "SR continues whispering and avoids the work, with peers still engaged.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Peer attention is maintaining avoidance and escalation.", next: "step4" }
      }
    },

    step4: {
      text: "How do you wrap up this peer situation?",
      choices: {
        A: {
          text: "Praise recovery privately: “Nice job resetting and getting back to work.” Give a Yeehaw ticket for re-entry.",
          score: 10,
          feedback: "Perfect. Reinforces coping and task re-entry without spotlighting the peer issue.",
          ending: "success"
        },
        B: {
          text: "Move on once he is quiet without reinforcement.",
          score: 0,
          feedback: "Neutral. Calm, but coping behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Process the teasing incident publicly in front of the group.",
          score: -10,
          feedback: "Public attention increases the likelihood of future peer-driven escalations.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Peer Moment Managed", text: "SR returned to work with low attention support and earned reinforcement for recovery." },
    mixed: { title: "Mixed – Quieter, Weak Reinforcement", text: "SR stabilized, but coping and re-entry were not clearly reinforced." },
    fail: { title: "Fail – Peer Attention Maintained", text: "Public processing increased attention and escape payoffs." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 5 — Fire Drill (Noise + Transition)
 **************************************************/
POOL.wild.push({
  id: "wild_5_fire_drill_noise_transition_sr",
  title: "Wildcard Mission: Fire Drill Noise and Transition",
  start: "step1",
  steps: {

    step1: {
      text: "The fire alarm blares unexpectedly. SR startles, makes loud noises, and looks around while the class begins lining up. Peers are watching.",
      choices: {
        A: {
          text: "Use calm directive: “Stand with me. We go together.” Then quietly cue: “Quiet line, eyes forward.”",
          score: 10,
          feedback: "Excellent. Anchors him with structure and keeps attention low during a high-noise event.",
          next: "step2A"
        },
        B: {
          text: "Say, “It’s just a drill,” and push the class to line up quickly.",
          score: 0,
          feedback: "Neutral. It may move things along, but SR may still escalate without a clear routine.",
          next: "step2B"
        },
        C: {
          text: "Tell him to stop making noises and hurry up where others can hear.",
          score: -10,
          feedback: "Public correction during overwhelm can escalate quickly.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "SR stands and stays close, still tense. He starts to whisper to a peer while walking.",
      choices: {
        A: {
          text: "Quiet reminder: “Save conversation for later. Stay with me.” Then shift attention away and keep moving.",
          score: 10,
          feedback: "Great. Brief and private, keeps the transition safe and structured.",
          next: "step3A"
        },
        B: {
          text: "Keep watching him closely the whole time.",
          score: 0,
          feedback: "Neutral. Monitoring helps, but it can become attention-heavy.",
          next: "step3B"
        },
        C: {
          text: "Explain why he should not talk during drills while walking.",
          score: -10,
          feedback: "Extended talking increases attention and can increase escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "SR makes another loud noise and slows down, looking around to see if peers react.",
      choices: {
        A: {
          text: "Repair with calm proximity: move beside him and gesture forward: “Right here with me.”",
          score: 10,
          feedback: "Excellent repair. Minimal verbal load and strong anchoring support.",
          next: "step3A"
        },
        B: {
          text: "Repeat, “Keep moving,” from ahead of the line.",
          score: 0,
          feedback: "Neutral. It may help, but SR may still be escalated.",
          next: "step3B"
        },
        C: {
          text: "Call out SR’s behavior so he stops.",
          score: -10,
          feedback: "Public attention increases peer involvement and escalates the moment.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "SR becomes more reactive and louder as the alarm continues. Peers are definitely watching now.",
      choices: {
        A: {
          text: "Shift class attention away and use a calm directive close to him: “With me. We are going now.”",
          score: 10,
          feedback: "Strong repair. Removes the audience and anchors him through the drill.",
          next: "step3A"
        },
        B: {
          text: "Ignore it and move the class out quickly.",
          score: 0,
          feedback: "Neutral. It avoids attention, but SR may freeze or lag behind.",
          next: "step3B"
        },
        C: {
          text: "Increase your volume to get him moving faster.",
          score: -10,
          feedback: "Adds intensity during overwhelm and can escalate behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "SR walks close and stays moving safely, quieter now.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "He stabilized and completed the transition safely.", next: "step4" }
      }
    },

    step3B: {
      text: "SR walks but stays tense and occasionally makes noises.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial stabilization. He may need reinforcement to strengthen coping.", next: "step4" }
      }
    },

    step3C: {
      text: "SR continues to escalate and peers keep watching.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Attention and overwhelm are maintaining the escalation pattern.", next: "step4" }
      }
    },

    step4: {
      text: "Outside, the alarm stops. How do you support SR now?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for staying with me and walking safely.” Give a Yeehaw ticket for coping.",
          score: 10,
          feedback: "Perfect. Reinforces safe coping and transition behavior.",
          ending: "success"
        },
        B: {
          text: "Let him recover without comment since things are busy.",
          score: 0,
          feedback: "Neutral. Calm, but coping behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Discuss his noises in front of peers while waiting outside.",
          score: -10,
          feedback: "Public attention increases future escalations during drills.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: { title: "Success – Drill Coping Reinforced", text: "SR stayed safe and regulated with structured support and earned reinforcement for coping." },
    mixed: { title: "Mixed – Safe, Weak Reinforcement", text: "SR completed the drill, but coping behaviors were not clearly reinforced." },
    fail: { title: "Fail – Overwhelm + Public Attention", text: "Public attention increased the likelihood of future escalation during drills." }
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

// SR (escape-maintained work avoidance + noises/talking) — updated action steps

if (pct >= 80) {
  actionSteps = `
    <ul>
      <li>Keep front-loading supports before known triggers (ELA reading and writing, starting independent work, lining up and hallway).</li>
      <li>Stay consistent with short, neutral directions plus “start-together then you go on your own” instead of repeating “just do it.”</li>
      <li>Prompt the replacement behavior early: “If it’s hard, ask for help” and “Save conversation for later.”</li>
      <li>Reinforce quickly and quietly with a Yeehaw ticket and specific praise for task start, persistence, and appropriate help-seeking.</li>
      <li>When early noises or side talk show up, your quick proximity cue and immediate task-entry support are working. Keep that timing.</li>
    </ul>`;
}
else if (pct >= 50) {
  actionSteps = `
    <ul>
      <li>Add pre-corrections earlier, especially before ELA transitions, independent work time, and lining up.</li>
      <li>Prompt the replacement behavior sooner (help request + “show me the hardest part”) before he shifts into noises or peer conversation.</li>
      <li>Shorten your language to one clear next step (one sentence, one problem, first step) and reinforce immediately with a Yeehaw ticket when he re-enters.</li>
      <li>Use the 1–10 effort check-in as soon as you see stalling so you can intervene before refusal escalates.</li>
      <li>If attention-seeking starts, reduce the audience with proximity and move class attention forward rather than explaining or debating.</li>
    </ul>`;
}
else {
  actionSteps = `
    <ul>
      <li>Rebuild the proactive setup for work blocks: a clear “start here” step, a small chunk goal, and a visible “how to earn” path (Yeehaw ticket for starting and sticking with it).</li>
      <li>Practice the replacement script outside tough moments: “If it’s hard, ask for help,” “Show me the hardest part,” and “Save conversation for later.”</li>
      <li>During escalation, use minimal language and predictable steps: “We will debrief after,” followed by one small supported action (start together for one step).</li>
      <li>Avoid public correction, extended explanations, or repeated directives that turn stalling into an attention routine.</li>
      <li>If you see leaving-area risk or unsafe behavior, follow the safety plan exactly (create space, maintain line of sight, and get support. Do not chase or block).</li>
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
