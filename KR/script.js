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

 // OC — updated summary statement

if (pct >= 80) {
  return "High fidelity. You stayed calm and brief, kept the interaction private, and used the plan supports fast (first-then, chunking, and a small choice). OC had a clear path back to success and you reinforced quickly with points (including bonus for safe body/safe words) and follow-through on the break after the chunk.";
}
if (pct >= 50) {
  return "Getting there. Use fewer words and move faster into the plan: one-step prompt, reduce the task immediately (tiny chunk), and offer a quick choice. Prompt the replacement behavior right away (break/help/calm space request) and reinforce the first safe step with points. Reduce the audience if peers start watching.";
}
return "Not aligned yet. Reset your approach: minimal language, no public corrections or long debates, and go straight to predictable steps (stay in the room, safe body/safe words, break/help request, calm space when needed, then a tiny re-entry chunk). If safety risk shows up (throwing, window/furniture, bolting), follow the safety plan exactly: clear peers, create space, maintain line-of-sight, activate support, and re-enter only after calm.";
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

  // === GET STUDENT FROM URL (e.g. ?student=OC) ===
  const url = new URL(window.location.href);
  const student = url.searchParams.get("student") || "OC";

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
   CONTENT POOLS — OC (Oliver) BRANCHING SCENARIOS
   Based on BIP: refusals, eloping, disruptive behavior
   Functions: escape/avoidance, sometimes attention
   Key supports: preview expectations, first-then, task chunking,
   choice-making, scheduled breaks, check-ins, calm space,
   point/contract system (70% goal) + bonus for safe body/safe words
   ============================================================ */

const POOL = {
  daily: [],
  crisis: [],
  wild: []
};

/*************************************************
 * DAILY SCENARIO 1 — Independent Work (Refusal: "No" + Head Down)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_1_refusal_head_down",
  title: "Daily Mission: Independent Work Start",
  start: "step1",
  steps: {
    step1: {
      text: "You assign OC an independent math task. He looks at the page, says “No,” and puts his head down on his arms.",
      choices: {
        A: {
          text: "Preview + first-then + chunk: “First 3 problems, then 5-minute break.” Offer a choice: “Do #1–3 or #4–6 first?”",
          score: 10,
          feedback: "Strong fidelity. You reduce demand, clarify the path, and offer choice to support escape-maintained behavior.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “You need to do it,” and explain why the assignment matters.",
          score: 0,
          feedback: "Neutral. Explanation can add attention and does not reduce the task enough to restart work.",
          next: "step2B"
        },
        C: {
          text: "Publicly correct: “Stop refusing and get to work.”",
          score: -10,
          feedback: "Public correction can escalate arguing and increase disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC lifts his head slightly, still tense, and says, “It’s too hard,” while looking at the worksheet.",
      choices: {
        A: {
          text: "Adult check-in + support start: “Let’s do the first one together.” Then return him to the chunk with praise.",
          score: 10,
          feedback: "Great. Brief support to start reduces overwhelm and increases the chance he re-engages.",
          next: "step3A"
        },
        B: {
          text: "Tell him to try it on his own and walk away.",
          score: 0,
          feedback: "Neutral. He might comply, but he may also shut down again without a supported entry.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is losing points for refusing.",
          score: -10,
          feedback: "Jumping to loss can increase escalation before replacement behaviors are prompted.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC argues louder: “This is stupid. I’m not doing it.” A couple peers look over.",
      choices: {
        A: {
          text: "Reduce audience and return to plan: speak quietly, “First 3, then break.” Point to first-then/visual and offer the choice again.",
          score: 10,
          feedback: "Nice repair. You cut attention and re-establish a predictable escape alternative.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining and negotiating to convince him.",
          score: 0,
          feedback: "Neutral. Negotiation can prolong the attention cycle.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and address OC’s behavior publicly.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC pushes the paper away and mutters, escalating the refusal.",
      choices: {
        A: {
          text: "Calm prompt + coping option: “Use your break request.” Offer the 5-minute break in the designated spot, then restart with the chunk.",
          score: 10,
          feedback: "Strong. You prompt the replacement behavior and use the planned break instead of a power struggle.",
          next: "step3A"
        },
        B: {
          text: "Stand over him repeating directions.",
          score: 0,
          feedback: "Neutral. Repeated prompts can increase frustration and arguing.",
          next: "step3B"
        },
        C: {
          text: "Lecture him about attitude and effort.",
          score: -10,
          feedback: "Extended attention can maintain arguing and delay re-engagement.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC starts the first part of the work (or returns from break and starts), using a calmer voice.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Work initiation occurred with plan-aligned support.", next: "step4" } }
    },
    step3B: {
      text: "OC stays quiet but does not start. He looks stuck and overwhelmed.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but not engaged. He may need a clearer entry step or smaller chunk.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates into louder arguing or begins disrupting to escape the task.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased. The plan path was not re-established quickly.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up this work-start moment?",
      choices: {
        A: {
          text: "Reinforce immediately: specific praise for starting plus contract points (and bonus for safe body/safe words if used). Then deliver the planned break after the chunk.",
          score: 10,
          feedback: "Perfect. Reinforces replacement behavior and keeps the first-then system credible.",
          ending: "success"
        },
        B: {
          text: "Let him work without reinforcement and skip the break.",
          score: 0,
          feedback: "Neutral. This weakens the first-then routine and future willingness to start.",
          ending: "mixed"
        },
        C: {
          text: "Bring up the refusal again after he starts as a warning.",
          score: -10,
          feedback: "Rehashing can re-trigger arguing and avoidance.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Work Started With Supports", text: "OC re-engaged through chunking, first-then, and reinforcement aligned with the plan." },
    mixed: { title: "Mixed – Started, Weak Reinforcement", text: "OC started, but the earn path was unclear, making future work starts less predictable." },
    fail: { title: "Fail – Escalation Maintained", text: "The response increased attention or conflict and made refusal and disruption more likely next time." }
  }
});


/*************************************************
 * DAILY SCENARIO 2 — Writing (Task Feels Big, Avoidance Starts)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_2_writing_task_chunking",
  title: "Daily Mission: Writing Block",
  start: "step1",
  steps: {
    step1: {
      text: "Writing starts. OC looks at the prompt, sighs, and says, “I’m not doing this,” while sliding his paper away.",
      choices: {
        A: {
          text: "Reduce demand + choice: “First 1 sentence, then break.” Offer: “Write it or dictate it to me first.”",
          score: 10,
          feedback: "Great. You lower response effort and offer a supported entry to reduce escape behavior.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop complaining and start writing.",
          score: 0,
          feedback: "Neutral. It does not reduce the trigger or teach a replacement response.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “OC, you always refuse writing.”",
          score: -10,
          feedback: "Public attention and labeling can escalate arguing and disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC agrees to dictate but starts to argue about the prompt: “This is dumb,” and looks around to see if peers notice.",
      choices: {
        A: {
          text: "Keep it brief: “Say sentence one.” Praise and give points immediately when he completes it. Then return to first-then.",
          score: 10,
          feedback: "Excellent. You keep language minimal and reinforce task engagement quickly.",
          next: "step3A"
        },
        B: {
          text: "Discuss why writing is important and how he will need it later.",
          score: 0,
          feedback: "Neutral. Extended talk can maintain avoidance.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately for arguing.",
          score: -10,
          feedback: "Point loss without prompting coping or break requests can escalate distress.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC puts his head down again and starts to mutter loudly, “I hate this.”",
      choices: {
        A: {
          text: "Prompt the replacement: “Ask for help or a break.” Offer 5-minute break if requested appropriately, then restart with 1 sentence.",
          score: 10,
          feedback: "Strong repair. You teach the functional alternative and keep the routine predictable.",
          next: "step3A"
        },
        B: {
          text: "Ignore the muttering and continue teaching the class.",
          score: 0,
          feedback: "Neutral. Avoids attention, but he may remain stuck without a supported restart.",
          next: "step3B"
        },
        C: {
          text: "Correct him publicly for being negative.",
          score: -10,
          feedback: "Public correction can increase arguing and escalation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "Peers look over. OC smirks briefly, then pushes his chair back.",
      choices: {
        A: {
          text: "Reduce audience and reset privately: “First 1 sentence, then break.” Offer choice and begin with adult check-in for the first step.",
          score: 10,
          feedback: "Nice repair. You remove the stage and return to the plan supports.",
          next: "step3A"
        },
        B: {
          text: "Keep talking about his behavior while others watch.",
          score: 0,
          feedback: "Neutral. Attention may reinforce the episode.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in front of peers.",
          score: -10,
          feedback: "Power struggle increases escalation and avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC completes the first sentence (written or dictated) and stays calmer.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Task initiation occurred. Reinforce and follow through with first-then.", next: "step4" } }
    },
    step3B: {
      text: "OC stays quiet but does not begin writing.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but not engaged. He may need a smaller chunk and a supported first step.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates into arguing or disruptive behavior to escape writing.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and writing avoidance is likely to continue.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up writing support?",
      choices: {
        A: {
          text: "Immediate reinforcement: praise + points for starting and using safe words/body. Deliver the planned break after the chunk.",
          score: 10,
          feedback: "Perfect. Reinforces the replacement routine and keeps trust in the first-then system.",
          ending: "success"
        },
        B: {
          text: "Delay reinforcement and keep pushing writing without the break.",
          score: 0,
          feedback: "Neutral. Weakens the first-then routine and increases future refusal.",
          ending: "mixed"
        },
        C: {
          text: "Bring up earlier refusal again while he is trying.",
          score: -10,
          feedback: "Rehashing can re-trigger avoidance and arguing.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Writing Started", text: "OC started writing with a reduced demand, choice, and reinforcement aligned to the plan." },
    mixed: { title: "Mixed – Some Progress, Weak Routine", text: "OC participated, but reinforcement and follow-through were inconsistent." },
    fail: { title: "Fail – Avoidance Maintained", text: "The response increased attention/conflict and strengthened escape-maintained behavior." }
  }
});


/*************************************************
 * DAILY SCENARIO 3 — Teacher Attention Not Available (Calling Out, Arguing)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_3_attention_not_available_calling_out",
  title: "Daily Mission: Wait and Request Help",
  start: "step1",
  steps: {
    step1: {
      text: "You are helping another student. OC calls out repeatedly, “Help me right now!” then starts arguing when you do not respond immediately.",
      choices: {
        A: {
          text: "Prompt the replacement: “Use your help signal or ask once.” Then: “I will be there in 1 minute.” Follow through and reinforce appropriate requesting.",
          score: 10,
          feedback: "Great. Teaches a functional alternative and avoids reinforcing repeated calling out.",
          next: "step2A"
        },
        B: {
          text: "Respond immediately each time he calls out so he calms down.",
          score: 0,
          feedback: "Neutral. It may reduce the moment, but it can reinforce calling out for attention.",
          next: "step2B"
        },
        C: {
          text: "Publicly scold: “Stop interrupting.”",
          score: -10,
          feedback: "Public attention can escalate arguing and disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC asks once, but he is still tense and says, “This is too hard,” while waiting.",
      choices: {
        A: {
          text: "Quick adult check-in when you arrive: model the first step, then offer first-then: “First 2, then break.”",
          score: 10,
          feedback: "Excellent. You combine support to start with an escape alternative that stays plan-aligned.",
          next: "step3A"
        },
        B: {
          text: "Tell him to keep waiting and return later.",
          score: 0,
          feedback: "Neutral. He may escalate again if the wait is too long without a plan path.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is losing points for needing help.",
          score: -10,
          feedback: "This can increase distress and avoidance rather than teach a replacement.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC learns calling out works and starts doing it more, louder, with peers watching.",
      choices: {
        A: {
          text: "Repair: reduce audience and reset the expectation. Prompt: “Ask once or use the signal.” Reinforce when he does.",
          score: 10,
          feedback: "Good repair. Restores the replacement response and reduces attention payoff for calling out.",
          next: "step3A"
        },
        B: {
          text: "Keep helping him immediately so he stays quiet.",
          score: 0,
          feedback: "Neutral. Reinforces calling out as the fastest way to get attention.",
          next: "step3B"
        },
        C: {
          text: "Stop class and lecture about respect.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC argues louder: “You never help me!” and pushes his materials.",
      choices: {
        A: {
          text: "Reduce audience and prompt coping: “Ask for a break or help.” Offer the planned 5-minute break if requested appropriately, then reintroduce the task with chunking.",
          score: 10,
          feedback: "Strong repair. Prompts replacement behavior and keeps consequence plan-aligned.",
          next: "step3A"
        },
        B: {
          text: "Argue back to correct his thinking.",
          score: 0,
          feedback: "Neutral. Debate can maintain attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Publicly reprimand and remove him from the activity immediately.",
          score: -10,
          feedback: "Removal can become a powerful escape outcome without teaching the replacement first.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC requests help or a break appropriately and returns to the task with support.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Replacement behavior occurred and you followed through predictably.", next: "step4" } }
    },
    step3B: {
      text: "OC quiets briefly but stays irritated and likely to escalate again.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but fragile. He may need more predictable follow-through and reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates into disruptive behavior to escape and regain attention.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and the replacement routine was not strengthened.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up support after the help moment?",
      choices: {
        A: {
          text: "Reinforce the replacement response: specific praise + points for appropriate requesting and safe words/body.",
          score: 10,
          feedback: "Perfect. Reinforces the new way to access attention/help.",
          ending: "success"
        },
        B: {
          text: "Help him but give no reinforcement for appropriate requesting.",
          score: 0,
          feedback: "Neutral. He got help, but the replacement behavior is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Revisit the arguing again after he calms.",
          score: -10,
          feedback: "Rehashing can trigger a second wave of escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Appropriate Requesting Reinforced", text: "OC used an appropriate request and earned reinforcement for safe, plan-aligned behavior." },
    mixed: { title: "Mixed – Help Given, Skill Not Strengthened", text: "OC got support, but reinforcement for replacement behavior was unclear." },
    fail: { title: "Fail – Calling Out Maintained", text: "Public attention or inconsistent responses strengthened calling out and arguing." }
  }
});


/*************************************************
 * DAILY SCENARIO 4 — Denied Activity or Asked to Wait (Escalation Risk)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_4_waiting_denied_activity",
  title: "Daily Mission: Wait and Flex",
  start: "step1",
  steps: {
    step1: {
      text: "OC asks to switch activities. You tell him he needs to wait. He starts arguing loudly and kicking his chair.",
      choices: {
        A: {
          text: "First-then + choice: “First 2 minutes here, then break.” Offer: “Do you want to wait at your desk or the calm space?”",
          score: 10,
          feedback: "Great. Provides a predictable escape alternative and a controlled choice.",
          next: "step2A"
        },
        B: {
          text: "Keep explaining why he has to wait and how the schedule works.",
          score: 0,
          feedback: "Neutral. Explanation can maintain arguing and attention.",
          next: "step2B"
        },
        C: {
          text: "Publicly reprimand: “Stop it now.”",
          score: -10,
          feedback: "Public correction can escalate disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC takes a breath but still looks overwhelmed and says, “I can’t do this.”",
      choices: {
        A: {
          text: "Prompt coping language: “Ask for a break or help.” Honor the break request, then reintroduce the task with chunking.",
          score: 10,
          feedback: "Excellent. You teach the replacement response and follow through predictably.",
          next: "step3A"
        },
        B: {
          text: "Tell him he needs to calm down before you will listen.",
          score: 0,
          feedback: "Neutral. It can delay access to supports and increase escalation.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately for the chair kicking.",
          score: -10,
          feedback: "Point loss without replacement prompting can increase distress.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC argues louder and peers start watching.",
      choices: {
        A: {
          text: "Reduce audience and return to plan: speak quietly and restate first-then in one line. Offer the calm space option.",
          score: 10,
          feedback: "Nice repair. Minimal language and controlled options reduce escalation.",
          next: "step3A"
        },
        B: {
          text: "Continue the explanation until he agrees.",
          score: 0,
          feedback: "Neutral. Negotiation maintains attention and delay.",
          next: "step3B"
        },
        C: {
          text: "Stop the class to address OC’s behavior.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC begins to slide out of his area as if he might leave.",
      choices: {
        A: {
          text: "Calm safety prompt: “Stay in the room.” Offer “walk and talk” or calm space with supervision as planned, then return to first-then.",
          score: 10,
          feedback: "Strong. Uses the plan’s supervised calming option rather than unmanaged elopement.",
          next: "step3A"
        },
        B: {
          text: "Stand over him repeating demands.",
          score: 0,
          feedback: "Neutral. Can increase intensity and arguing.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in the moment.",
          score: -10,
          feedback: "Debate increases escalation and escape behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC uses a break/help request or goes to calm space appropriately, then returns to the task.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Replacement behavior and plan-aligned support occurred.", next: "step4" } }
    },
    step3B: {
      text: "OC quiets but remains tense and likely to escalate again.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stabilized but not strengthened. He needs a clearer earn path and reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates and the wait situation turns into a bigger disruption.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and the replacement routines were not reinforced.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up this waiting moment?",
      choices: {
        A: {
          text: "Reinforce: praise + points for safe body/safe words and for using break/help appropriately. Resume the schedule with first-then.",
          score: 10,
          feedback: "Perfect. Reinforces the replacement behaviors that match the function.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement after he calms.",
          score: 0,
          feedback: "Neutral. Calm happened, but the skill use is not strengthened.",
          ending: "mixed"
        },
        C: {
          text: "Revisit the arguing after he calms.",
          score: -10,
          feedback: "Rehashing can trigger a second escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Waiting Skill Strengthened", text: "OC accessed a break/help appropriately and returned to the task with predictable supports." },
    mixed: { title: "Mixed – Stabilized, Weak Reinforcement", text: "OC stabilized, but the replacement behavior was not clearly reinforced." },
    fail: { title: "Fail – Disruption Maintained", text: "Public attention or conflict increased escalation and strengthened escape patterns." }
  }
});


/*************************************************
 * DAILY SCENARIO 5 — Eloping Risk (Leaving Area, Heading Out)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_5_eloping_risk_leave_room",
  title: "Daily Mission: Stay in Area and Use Calm Space",
  start: "step1",
  steps: {
    step1: {
      text: "During a tough task, OC stands up and moves quickly toward the classroom door without permission.",
      choices: {
        A: {
          text: "Calm directive: “Stay in the room.” Offer the plan option: supervised calm space or walk-and-talk. Then return to first-then after calm.",
          score: 10,
          feedback: "Great. Safety first, and you route him into the plan’s supervised alternative instead of unmanaged elopement.",
          next: "step2A"
        },
        B: {
          text: "Call after him from across the room to come back.",
          score: 0,
          feedback: "Neutral. It may work, but it is less effective without a clear alternative and supervision plan.",
          next: "step2B"
        },
        C: {
          text: "Yell and threaten consequences as he heads to the door.",
          score: -10,
          feedback: "High intensity can escalate and increase eloping behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC pauses, breathing hard, and says he cannot do the work.",
      choices: {
        A: {
          text: "Prompt replacement: “Ask for a break.” Honor a 5-minute break in the designated space, then restart with a smaller chunk and support first step.",
          score: 10,
          feedback: "Excellent. He learns the safe, functional alternative that matches escape.",
          next: "step3A"
        },
        B: {
          text: "Tell him to come back and just do it now.",
          score: 0,
          feedback: "Neutral. It may restart refusal without offering the plan-based alternative.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately and lecture about leaving.",
          score: -10,
          feedback: "Can increase shame and escalation without teaching the replacement.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC keeps moving, testing if leaving will end the task.",
      choices: {
        A: {
          text: "Repair: move closer, keep language minimal, and guide him into the supervised calm space option. Alert designated support staff per plan if needed.",
          score: 10,
          feedback: "Strong repair. Routes him to the planned support and prevents reinforcement of unmanaged elopement.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Come back” several times.",
          score: 0,
          feedback: "Neutral. Repetition can become attention without re-establishing the plan path.",
          next: "step3B"
        },
        C: {
          text: "Stop instruction and address the eloping publicly.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates, shouting and knocking into a chair as he heads out.",
      choices: {
        A: {
          text: "Repair: reduce intensity, keep safety first, alert designated staff, and implement the supervised calm space/walk-and-talk plan steps.",
          score: 10,
          feedback: "Excellent. Matches the plan’s safety and de-escalation approach.",
          next: "step3A"
        },
        B: {
          text: "Keep yelling demands to return.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences while he is escalated.",
          score: -10,
          feedback: "Debate increases escalation and delays safe support.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC uses the calm space/break appropriately and returns to the task with a reduced chunk.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safe alternative used. Reinforce the return and restart.", next: "step4" } }
    },
    step3B: {
      text: "OC returns but stays tense and likely to bolt again.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stabilized but not strengthened. He needs a clearer first-then and reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates further and leaving becomes more likely.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Safety risk increased and plan-aligned alternatives were not established early.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after he returns from calm space/break?",
      choices: {
        A: {
          text: "Reinforce immediately: praise + points for staying in area, using the break request, and returning to the task (bonus for safe body/safe words).",
          score: 10,
          feedback: "Perfect. Reinforces the safe alternative to eloping and the return-to-work routine.",
          ending: "success"
        },
        B: {
          text: "Let him return without reinforcement and increase demands immediately.",
          score: 0,
          feedback: "Neutral. It can make breaks feel unsafe and increase future eloping.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the eloping after he returns.",
          score: -10,
          feedback: "Rehashing can re-trigger escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Safe Alternative to Eloping Reinforced", text: "OC used a plan-aligned calming option and returned to work with predictable supports." },
    mixed: { title: "Mixed – Returned, Weak Routine", text: "OC returned, but reinforcement and demand adjustments were unclear." },
    fail: { title: "Fail – Eloping Maintained", text: "The response increased conflict and made leaving the area more likely." }
  }
});

/*************************************************
 * DAILY SCENARIO 6 — Small Group (Crawling Under Table)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_6_crawl_under_table",
  title: "Daily Mission: Small Group Reset",
  start: "step1",
  steps: {
    step1: {
      text: "During small group, OC becomes overwhelmed and crawls under the table instead of working.",
      choices: {
        A: {
          text: "Stay calm and reduce demand: “OC, calm space or chair?” Then: “First 1 minute calm, then 2 problems.”",
          score: 10,
          feedback: "Strong fidelity. You give a regulated option and a tiny, predictable work entry.",
          next: "step2A"
        },
        B: {
          text: "Tell him to come out and explain why this is not appropriate.",
          score: 0,
          feedback: "Neutral. Explanation can add attention and does not reduce the demand enough to re-engage.",
          next: "step2B"
        },
        C: {
          text: "Pull him out or threaten consequences immediately.",
          score: -10,
          feedback: "Hands-on escalation or threats can increase dysregulation and avoidance.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC pauses, still under the table, and says, “No,” but his voice is quieter.",
      choices: {
        A: {
          text: "Prompt replacement: “Ask for a break.” Honor a short break in the calm space, then restart with a 2-item chunk and adult check-in for item #1.",
          score: 10,
          feedback: "Excellent. Teaches the functional alternative and keeps the work path credible.",
          next: "step3A"
        },
        B: {
          text: "Wait silently until he comes out on his own.",
          score: 0,
          feedback: "Neutral. Avoids conflict, but he may stay stuck without a structured path back.",
          next: "step3B"
        },
        C: {
          text: "Lecture him about wasting time and being disruptive.",
          score: -10,
          feedback: "Extended attention can reinforce avoidance and increase escalation risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC stays under the table longer and begins to mutter louder. Peers glance over.",
      choices: {
        A: {
          text: "Reduce audience and return to plan quietly: offer the calm space choice again and restate first-then in one sentence.",
          score: 10,
          feedback: "Nice repair. You remove the stage and re-establish the plan path.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to OC while the group waits.",
          score: 0,
          feedback: "Neutral. Waiting becomes attention and increases escape value.",
          next: "step3B"
        },
        C: {
          text: "Call out OC’s behavior publicly so the group stops watching.",
          score: -10,
          feedback: "Public attention can escalate and keep the avoidance going.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC kicks the table leg and refuses to come out.",
      choices: {
        A: {
          text: "Safety + minimal language: create space, keep voice low, and cue calm space/break request. Get support if safety escalates.",
          score: 10,
          feedback: "Strong repair. Safety first, minimal attention, and plan-aligned coping options.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder to come out now.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences while he is escalated.",
          score: -10,
          feedback: "Debate prolongs escalation and avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC uses calm space/break appropriately and returns to the table for a small chunk.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Replacement behavior occurred and work re-entry was supported.", next: "step4" } }
    },
    step3B: {
      text: "OC comes out but stays tense and avoids starting.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but fragile. He may need a smaller chunk and an adult-supported first step.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates into louder refusal and the group is disrupted.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and the plan path was not strengthened.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up this small-group moment?",
      choices: {
        A: {
          text: "Reinforce recovery and re-entry: praise + points for safe body/safe words and for returning to task. Deliver break as promised after the chunk.",
          score: 10,
          feedback: "Perfect. Reinforces the safe alternative to avoidance and maintains trust in first-then.",
          ending: "success"
        },
        B: {
          text: "Return to work without reinforcement and skip the break.",
          score: 0,
          feedback: "Neutral. Weakens the first-then routine.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the crawling under the table after he returns.",
          score: -10,
          feedback: "Rehashing can re-trigger avoidance and escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Calm Return and Work Re-Entry", text: "OC used a plan-aligned reset and re-entered work with predictable supports and reinforcement." },
    mixed: { title: "Mixed – Returned, Weak Routine", text: "OC returned but reinforcement and follow-through were inconsistent." },
    fail: { title: "Fail – Avoidance Maintained", text: "Attention/conflict increased escalation and strengthened avoidance." }
  }
});


/*************************************************
 * DAILY SCENARIO 7 — Work Time (Throwing Small Objects)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_7_throwing_small_objects",
  title: "Daily Mission: Keep Materials Safe",
  start: "step1",
  steps: {
    step1: {
      text: "During independent work, OC becomes frustrated and tosses a small object (pencil/eraser) toward the teacher area.",
      choices: {
        A: {
          text: "Safety first: create space, keep voice low. Prompt replacement: “Safe hands. Ask for break or help.” Offer calm space/break, then restart with a smaller chunk.",
          score: 10,
          feedback: "Strong fidelity. You prioritize safety, prompt the replacement response, and reduce demand to match escape function.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “That’s not okay,” and ask why he threw it.",
          score: 0,
          feedback: "Neutral. Questioning can add attention and may escalate.",
          next: "step2B"
        },
        C: {
          text: "Publicly scold and threaten consequences immediately.",
          score: -10,
          feedback: "Public attention and threats can escalate and increase disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC breathes hard but stays in his area. He says, “I can’t,” and looks at the work.",
      choices: {
        A: {
          text: "Support entry: “Let’s do the first one together.” Then: “First 2, then break.” Award points for safe hands and starting.",
          score: 10,
          feedback: "Excellent. You pair coping with a supported restart and reinforce safety.",
          next: "step3A"
        },
        B: {
          text: "Tell him to calm down and return later.",
          score: 0,
          feedback: "Neutral. He may calm, but the replacement behavior is not strengthened.",
          next: "step3B"
        },
        C: {
          text: "Remove points right away and lecture about throwing.",
          score: -10,
          feedback: "Point loss without replacement prompting can increase distress and escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC argues louder: “You made me!” A peer looks over.",
      choices: {
        A: {
          text: "Reduce audience and return to plan: “Safe hands. Break or help?” Keep it private and follow through with the option chosen.",
          score: 10,
          feedback: "Nice repair. Minimal language and plan-based choices reduce escalation.",
          next: "step3A"
        },
        B: {
          text: "Keep debating to correct his thinking.",
          score: 0,
          feedback: "Neutral. Debate can prolong attention and escalation.",
          next: "step3B"
        },
        C: {
          text: "Stop class to address OC’s throwing publicly.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC knocks materials off his desk and peers start watching.",
      choices: {
        A: {
          text: "Safety + minimal attention: create space, keep peers engaged elsewhere, prompt calm space/break request, and get support if needed per plan.",
          score: 10,
          feedback: "Excellent repair. Safety-first and reduces the audience payoff.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder to stop now.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in front of peers.",
          score: -10,
          feedback: "Debate increases attention and prolongs escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC uses safe hands and either takes a brief break or accepts help to restart the task.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safety and replacement behavior were supported and reinforced.", next: "step4" } }
    },
    step3B: {
      text: "OC quiets but remains tense and avoids restarting.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but not engaged. He may need a smaller chunk and a supported first step.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates and the work period becomes unsafe/disrupted.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and safety risk rose.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after safety is restored?",
      choices: {
        A: {
          text: "Reinforce recovery: points + praise for safe hands/safe words and for using break/help. Resume with a reduced chunk and planned break after it.",
          score: 10,
          feedback: "Perfect. Reinforces the safe alternative and keeps the plan credible.",
          ending: "success"
        },
        B: {
          text: "Resume work immediately with full demand and no reinforcement.",
          score: 0,
          feedback: "Neutral. Can increase avoidance and future escalation.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the throwing while he is trying to recover.",
          score: -10,
          feedback: "Rehashing can re-trigger escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Safe Hands and Recovery Reinforced", text: "OC used safer behavior and a plan-aligned break/help option, then returned to work with supports." },
    mixed: { title: "Mixed – Safety Restored, Weak Routine", text: "OC stabilized, but the replacement behavior was not clearly reinforced." },
    fail: { title: "Fail – Escalation Maintained", text: "Public attention/conflict increased the payoff for unsafe behavior." }
  }
});


/*************************************************
 * DAILY SCENARIO 8 — Transition (Leaving the Room to Escape)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_8_transition_leaving_room",
  title: "Daily Mission: Transition With Support",
  start: "step1",
  steps: {
    step1: {
      text: "It is time to transition to a new activity. OC says, “No,” and starts to leave the room to avoid the transition.",
      choices: {
        A: {
          text: "Safety prompt: “Stay in the room.” Offer plan alternative: calm space or supervised walk-and-talk, then return to transition with first-then.",
          score: 10,
          feedback: "Great fidelity. You prevent unmanaged leaving and provide a function-matched alternative.",
          next: "step2A"
        },
        B: {
          text: "Call after him from across the room to come back.",
          score: 0,
          feedback: "Neutral. Less effective without a clear alternative and supervision plan.",
          next: "step2B"
        },
        C: {
          text: "Yell and threaten consequences as he moves away.",
          score: -10,
          feedback: "High intensity can escalate and increase leaving behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC pauses near the doorway, breathing hard, and says, “I’m not doing it.”",
      choices: {
        A: {
          text: "Prompt replacement: “Ask for a break.” Honor a brief break, then reintroduce the transition with a clear first-then: “First line up, then break is done.”",
          score: 10,
          feedback: "Excellent. Teaches the functional alternative and keeps transitions predictable.",
          next: "step3A"
        },
        B: {
          text: "Tell him to come back and just line up now.",
          score: 0,
          feedback: "Neutral. May restart refusal without building the replacement routine.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately and lecture about leaving.",
          score: -10,
          feedback: "Point loss and lectures can increase escalation without teaching the alternative.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC keeps moving, testing whether leaving ends the demand.",
      choices: {
        A: {
          text: "Repair: move closer calmly, keep language minimal, and guide him into the supervised calm option. Alert support if needed per plan.",
          score: 10,
          feedback: "Strong repair. Routes him into the plan and prevents escape reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Come back” and keep talking from far away.",
          score: 0,
          feedback: "Neutral. Repetition can become attention without restoring the plan path.",
          next: "step3B"
        },
        C: {
          text: "Stop the class to address OC’s leaving publicly.",
          score: -10,
          feedback: "Creates a stage and escalates attention and conflict.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates, slamming a chair as he tries to leave.",
      choices: {
        A: {
          text: "Repair: reduce intensity, create space, prioritize safety, activate support, and implement the supervised calm option from the plan.",
          score: 10,
          feedback: "Excellent. Safety-first response aligned with crisis prevention and plan steps.",
          next: "step3A"
        },
        B: {
          text: "Keep yelling directions to return.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in the moment.",
          score: -10,
          feedback: "Debate increases escalation and delays a safe reset.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC uses the calm option or break request and then returns to complete the transition.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Replacement behavior used and transition completed with support.", next: "step4" } }
    },
    step3B: {
      text: "OC returns but stays tense and likely to bolt again during the transition.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stabilized but not strengthened. Needs clearer first-then and reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates and leaving becomes more likely again.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and the plan path was not established early.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after the transition is completed?",
      choices: {
        A: {
          text: "Reinforce: points + praise for staying in the room, safe body/safe words, and using break/help appropriately.",
          score: 10,
          feedback: "Perfect. Reinforces the replacement routine and makes future transitions more successful.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement since the transition took time.",
          score: 0,
          feedback: "Neutral. Misses a key reinforcement moment for the replacement behavior.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the leaving attempt after he transitions.",
          score: -10,
          feedback: "Rehashing can re-trigger escalation during the next activity.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Transition Completed Safely", text: "OC stayed in the room, used a plan-aligned alternative, and earned reinforcement for completing the transition." },
    mixed: { title: "Mixed – Transition Completed, Weak Reinforcement", text: "OC transitioned, but the replacement behavior was not clearly reinforced." },
    fail: { title: "Fail – Leaving Pattern Strengthened", text: "Public attention/conflict increased escape motivation and future leaving risk." }
  }
});


/*************************************************
 * DAILY SCENARIO 9 — Contract Reminder (After a “Bad Contract” Day)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_9_contract_home_reflection",
  title: "Daily Mission: Contract Check-In",
  start: "step1",
  steps: {
    step1: {
      text: "It is morning check-in after a hard day. OC looks anxious and says, “What is my dad going to think?”",
      choices: {
        A: {
          text: "Use a neutral, learning-focused prompt: “What happened yesterday when you took a contract home?” Then preview today’s goal and earn path.",
          score: 10,
          feedback: "Strong. Keeps tone neutral and focuses on learning and today’s plan, not shame.",
          next: "step2A"
        },
        B: {
          text: "Reassure him a lot and talk for a long time about dad and feelings.",
          score: 0,
          feedback: "Neutral. Supportive, but extended talk may increase anxiety or avoidance before instruction starts.",
          next: "step2B"
        },
        C: {
          text: "Use a shame-based statement about dad being disappointed.",
          score: -10,
          feedback: "Shame language can increase dysregulation and refusal.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC says quietly, “I had a bad day,” and avoids eye contact.",
      choices: {
        A: {
          text: "Preview a success plan: “Today we earn points for safe words, safe body, and trying.” Offer a choice for first task entry and a planned break.",
          score: 10,
          feedback: "Excellent. Builds motivation and clarity for the day and reduces escape risk.",
          next: "step3A"
        },
        B: {
          text: "Tell him to just do better today with no specifics.",
          score: 0,
          feedback: "Neutral. Encouraging but not specific enough to guide behavior.",
          next: "step3B"
        },
        C: {
          text: "Warn him that another bad contract will have bigger consequences.",
          score: -10,
          feedback: "Threats can increase anxiety and escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC starts to avoid the conversation and says, “Can we not talk about it?”",
      choices: {
        A: {
          text: "Repair: keep it short. “Okay. Today’s goal is ___. First task is ___. You can ask for help or break.” Then start the day.",
          score: 10,
          feedback: "Great repair. Keeps the check-in brief and plan-aligned.",
          next: "step3A"
        },
        B: {
          text: "Keep pressing him to talk about feelings before starting.",
          score: 0,
          feedback: "Neutral. Can increase avoidance and delay instruction.",
          next: "step3B"
        },
        C: {
          text: "Scold him for not wanting to talk.",
          score: -10,
          feedback: "Escalates shame and avoidance.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC becomes dysregulated and starts refusing morning work.",
      choices: {
        A: {
          text: "Repair: back to the plan. Offer calm space/break request and restart with a very small first-then chunk. Reinforce the first compliant step.",
          score: 10,
          feedback: "Excellent repair. Restores predictability and reduces demand to re-engage.",
          next: "step3A"
        },
        B: {
          text: "Keep talking about dad and consequences until he stops.",
          score: 0,
          feedback: "Neutral. Extended attention can maintain dysregulation.",
          next: "step3B"
        },
        C: {
          text: "Publicly call out the conversation so peers hear.",
          score: -10,
          feedback: "Public attention increases escalation and shame.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC starts the day with a clearer plan and calmer behavior.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Check-in supported regulation and motivation for the day.", next: "step4" } }
    },
    step3B: {
      text: "OC starts, but remains anxious and likely to refuse later.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but not strengthened. Needs clearer preview, choices, and reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates into refusal/disruption to escape morning work.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and set a difficult tone for the day.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up the contract check-in?",
      choices: {
        A: {
          text: "Keep it brief and reinforcing: praise participation in check-in, set the first small goal, and award points for safe words/body.",
          score: 10,
          feedback: "Perfect. Makes the check-in supportive and plan-aligned.",
          ending: "success"
        },
        B: {
          text: "End the check-in with no reinforcement and jump into demands.",
          score: 0,
          feedback: "Neutral. Misses a chance to build early momentum.",
          ending: "mixed"
        },
        C: {
          text: "End with a warning about dad or punishment.",
          score: -10,
          feedback: "Increases anxiety and escape motivation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Check-In Set Up a Better Day", text: "OC started with a neutral, learning-focused check-in and a clear earn path." },
    mixed: { title: "Mixed – Check-In Happened, Weak Support", text: "OC started, but the check-in did not clearly strengthen coping or motivation." },
    fail: { title: "Fail – Shame Increased Dysregulation", text: "The check-in increased anxiety and refusal, raising the risk of escalation." }
  }
});


/*************************************************
 * DAILY SCENARIO 10 — Property Disruption (Tossing Pencil Box / Desk)
 **************************************************/
POOL.daily.push({
  id: "oc_daily_10_toss_pencilbox_desk",
  title: "Daily Mission: Reset After Property Disruption",
  start: "step1",
  steps: {
    step1: {
      text: "During a tough task, OC becomes dysregulated and tosses his pencil box or shoves his desk materials.",
      choices: {
        A: {
          text: "Safety first: create space, keep voice low. Prompt: “Safe hands.” Offer calm space/break request. Then restart with a smaller chunk and adult-supported first step.",
          score: 10,
          feedback: "Strong fidelity. You reduce danger, prompt the replacement, and match supports to escape function.",
          next: "step2A"
        },
        B: {
          text: "Tell him to clean it up and explain why it is disrespectful.",
          score: 0,
          feedback: "Neutral. It may add attention and does not reduce demand or teach coping first.",
          next: "step2B"
        },
        C: {
          text: "Publicly scold and threaten consequences immediately.",
          score: -10,
          feedback: "Public attention can escalate and increase disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC breathes hard and says, “I can’t,” but he is not escalating further.",
      choices: {
        A: {
          text: "Teach and reinforce coping: “Ask for help or break.” Honor the request, then do the first item together and award points for safe hands/body.",
          score: 10,
          feedback: "Excellent. Reinforces the replacement behavior and builds a supported restart.",
          next: "step3A"
        },
        B: {
          text: "Wait until he is totally calm before offering any support.",
          score: 0,
          feedback: "Neutral. Waiting can leave him stuck without a clear path back.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately and lecture about the pencil box.",
          score: -10,
          feedback: "Point loss without replacement prompting can increase distress and future escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC argues and refuses to clean up. A peer watches.",
      choices: {
        A: {
          text: "Repair: reduce audience and keep it brief. “Safe hands.” Then: “Break or help?” After calm, do a quick private restore/clean up together.",
          score: 10,
          feedback: "Great repair. Handles safety first and delays cleanup until regulated.",
          next: "step3A"
        },
        B: {
          text: "Keep insisting on cleanup while explaining rules.",
          score: 0,
          feedback: "Neutral. Can increase attention and escalation.",
          next: "step3B"
        },
        C: {
          text: "Stop class and make him clean up publicly.",
          score: -10,
          feedback: "Public spotlight increases escalation and shame.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates and kicks or hits nearby furniture (risk of damage).",
      choices: {
        A: {
          text: "Safety + support: create space, keep peers away, use minimal language, and activate support per plan. Route him to calm space when safe.",
          score: 10,
          feedback: "Excellent. Safety-first and aligned with crisis-prevention steps.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating demands louder to stop now.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences while he is escalated.",
          score: -10,
          feedback: "Debate prolongs escalation and increases risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC returns to calm space/break or accepts help and begins a small chunk of work safely.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safe behavior and replacement responses were supported.", next: "step4" } }
    },
    step3B: {
      text: "OC quiets but remains tense and avoids restarting.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but not strengthened. Needs a smaller chunk and immediate reinforcement for the first safe step.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates again and class disruption continues.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and safety risk rose.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after things settle?",
      choices: {
        A: {
          text: "Reinforce recovery: points + praise for safe hands/safe body and using break/help. Complete a brief private restore/cleanup, then return to a reduced chunk.",
          score: 10,
          feedback: "Perfect. Reinforces the replacement and restores routines without spotlighting.",
          ending: "success"
        },
        B: {
          text: "Return to full demands with no reinforcement and no break follow-through.",
          score: 0,
          feedback: "Neutral. Increases future avoidance and escalation risk.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the behavior and consequences at length while he is trying to recover.",
          score: -10,
          feedback: "Rehashing can re-trigger escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Recovery and Safe Restart", text: "OC used safer behavior and plan-aligned coping options, then returned to work with predictable supports." },
    mixed: { title: "Mixed – Stabilized, Weak Routine", text: "OC stabilized, but reinforcement and follow-through were inconsistent." },
    fail: { title: "Fail – Escalation Maintained", text: "Public attention/conflict increased the payoff and prolonged disruption." }
  }
});

/*************************************************
 * CRISIS SCENARIO 1 — Punching/Kicking Window (Immediate Safety)
 **************************************************/
POOL.crisis.push({
  id: "oc_crisis_1_window_aggression",
  title: "Crisis Drill: Window Aggression",
  start: "step1",
  steps: {
    step1: {
      text: "OC escalates quickly and begins punching or kicking at the classroom window or nearby glass.",
      choices: {
        A: {
          text: "Safety first: clear peers, create space, keep your voice low, and activate support per plan. Use minimal language: “Stop. Safe body.”",
          score: 10,
          feedback: "Excellent. You prioritize safety, reduce audience attention, and use minimal language during high-risk behavior.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop and explain why it is dangerous.",
          score: 0,
          feedback: "Neutral. Explanation can add attention and may not reduce risk quickly enough.",
          next: "step2B"
        },
        C: {
          text: "Yell and threaten consequences immediately.",
          score: -10,
          feedback: "High intensity can escalate and increase danger with glass.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC pauses for a second but is still visibly dysregulated and breathing hard.",
      choices: {
        A: {
          text: "Guide to the calm space when safe. Prompt coping: “Break or help.” Keep demands off until calm, then restart with a reduced chunk.",
          score: 10,
          feedback: "Strong. You route him into the plan’s de-escalation option and prevent escape from becoming unmanaged.",
          next: "step3A"
        },
        B: {
          text: "Try to process what happened and ask why he did it.",
          score: 0,
          feedback: "Neutral. Processing during dysregulation can reignite escalation.",
          next: "step3B"
        },
        C: {
          text: "Require an apology immediately before he can calm.",
          score: -10,
          feedback: "Demands and social pressure can escalate and prolong the crisis.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC becomes more upset and kicks again. A few students are watching.",
      choices: {
        A: {
          text: "Repair: stop explaining, clear peers, create space, activate support, and use minimal safety language only.",
          score: 10,
          feedback: "Excellent repair. You reduce risk and remove the audience payoff.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Stop” multiple times while standing close.",
          score: 0,
          feedback: "Neutral. Repetition may not reduce risk and can add attention.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and threaten removal or punishment.",
          score: -10,
          feedback: "Threats can escalate and increase danger near glass.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates further, yelling and continuing to strike the window area.",
      choices: {
        A: {
          text: "Repair: immediately move peers, create maximum space, activate support, and maintain minimal language focused on safety.",
          score: 10,
          feedback: "Excellent. Safety and support are the priority in this moment.",
          next: "step3A"
        },
        B: {
          text: "Keep repeating consequences and demands.",
          score: 0,
          feedback: "Neutral. May prolong escalation and keep attention on the crisis.",
          next: "step3B"
        },
        C: {
          text: "Argue with OC about behavior choices.",
          score: -10,
          feedback: "Debate increases escalation and delays safety response.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "With space and support, OC slows down and stops striking the window area.",
      choices: { A: { text: "Continue.", score: 10, feedback: "De-escalation is occurring. Keep demands low and follow plan steps.", next: "step4" } }
    },
    step3B: {
      text: "OC pauses but remains tense and may re-escalate.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stabilized but fragile. He needs calm space and minimal interaction.", next: "step4" } }
    },
    step3C: {
      text: "OC continues aggressive behavior toward the window and peers remain aware.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Safety risk remains high and escalation is maintained.", next: "step4" } }
    },

    step4: {
      text: "After safety is restored, how do you wrap up?",
      choices: {
        A: {
          text: "Once calm, use brief private re-entry steps: calm space → small first-then chunk. Reinforce safe body/safe words and returning appropriately (points).",
          score: 10,
          feedback: "Perfect. Reinforces recovery and prevents the crisis from becoming a reliable escape routine.",
          ending: "success"
        },
        B: {
          text: "Return him to full demands immediately with no reinforcement.",
          score: 0,
          feedback: "Neutral. Can increase avoidance and future escalation.",
          ending: "mixed"
        },
        C: {
          text: "Do a long public debrief about what happened.",
          score: -10,
          feedback: "Public attention can increase shame and future escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Safety Restored and Recovery Reinforced", text: "You prioritized safety, activated support, and reinforced calm recovery and re-entry." },
    mixed: { title: "Mixed – Safety Restored, Weak Routine", text: "The crisis ended, but the return-to-calm routine was not clearly reinforced." },
    fail: { title: "Fail – Escalation Prolonged", text: "Public attention or high intensity increased risk and maintained escalation." }
  }
});


/*************************************************
 * CRISIS SCENARIO 2 — Throwing Objects (Escalating Disruption)
 **************************************************/
POOL.crisis.push({
  id: "oc_crisis_2_throwing_objects",
  title: "Crisis Drill: Throwing Objects",
  start: "step1",
  steps: {
    step1: {
      text: "OC begins throwing objects (pencils, supplies) during a demand, and peers are watching.",
      choices: {
        A: {
          text: "Safety first: clear peers, create space, keep voice low, and prompt: “Safe hands.” Offer calm space/break request and activate support if needed.",
          score: 10,
          feedback: "Excellent. Safety-focused, minimal language, and a plan-aligned alternative to escape.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop and explain why throwing is unsafe.",
          score: 0,
          feedback: "Neutral. Explanation can add attention and may not reduce risk quickly.",
          next: "step2B"
        },
        C: {
          text: "Publicly threaten consequences and point loss immediately.",
          score: -10,
          feedback: "Public attention can escalate and increase throwing.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC pauses but remains dysregulated and says, “I’m done,” while looking at the task.",
      choices: {
        A: {
          text: "Prompt replacement: “Ask for break or help.” Honor break in calm space, then restart with a reduced chunk and adult-supported first item.",
          score: 10,
          feedback: "Strong. Teaches the functional alternative and supports re-entry.",
          next: "step3A"
        },
        B: {
          text: "Tell him to calm down and keep working without changes.",
          score: 0,
          feedback: "Neutral. Maintaining full demand can restart throwing.",
          next: "step3B"
        },
        C: {
          text: "Require cleanup and apology immediately.",
          score: -10,
          feedback: "Demands during dysregulation can re-escalate quickly.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC throws again and a peer gasps. The room’s attention is on him.",
      choices: {
        A: {
          text: "Repair: stop explaining, move peers, create space, and use only safety language + calm option. Activate support as needed.",
          score: 10,
          feedback: "Excellent repair. Removes audience and prioritizes safety.",
          next: "step3A"
        },
        B: {
          text: "Repeat “Stop throwing” multiple times while standing close.",
          score: 0,
          feedback: "Neutral. Repetition may add attention and maintain escalation.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences and blame.",
          score: -10,
          feedback: "Debate increases attention and prolongs the episode.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates and begins sweeping more materials off the desk.",
      choices: {
        A: {
          text: "Repair: increase distance, reduce peers’ attention, activate support, and keep prompts to: “Safe hands. Calm space.”",
          score: 10,
          feedback: "Excellent. Safety-first response aligned with crisis prevention.",
          next: "step3A"
        },
        B: {
          text: "Keep threatening point loss and removal.",
          score: 0,
          feedback: "Neutral. Threats can escalate and maintain behavior.",
          next: "step3B"
        },
        C: {
          text: "Stop class for a public lecture.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC stops throwing and moves to calm space with support.",
      choices: { A: { text: "Continue.", score: 10, feedback: "De-escalation occurred. Keep demands low and follow through with the plan.", next: "step4" } }
    },
    step3B: {
      text: "OC stops briefly but remains tense and likely to throw again.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stabilized but fragile. Needs calm option and predictable re-entry steps.", next: "step4" } }
    },
    step3C: {
      text: "OC continues throwing and peers remain focused on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Safety risk remains high and escalation continues.", next: "step4" } }
    },

    step4: {
      text: "Once calm, how do you support re-entry?",
      choices: {
        A: {
          text: "After calm space, do a brief private restore/cleanup, then restart with a small first-then chunk. Reinforce safe hands and returning (points).",
          score: 10,
          feedback: "Perfect. Reinforces recovery and teaches a safe way back to work.",
          ending: "success"
        },
        B: {
          text: "Return to full demands immediately and skip reinforcement.",
          score: 0,
          feedback: "Neutral. Can increase escape and future escalation.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the throwing and consequences at length.",
          score: -10,
          feedback: "Rehashing can trigger a second escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Safe Hands Restored", text: "You reduced risk, used calm space, and reinforced safe recovery and re-entry." },
    mixed: { title: "Mixed – Calmed, Weak Routine", text: "OC calmed, but the replacement routine was not clearly reinforced." },
    fail: { title: "Fail – Escalation Maintained", text: "Public attention or demands during dysregulation prolonged the crisis." }
  }
});


/*************************************************
 * CRISIS SCENARIO 3 — Eloping (Leaving the Room)
 **************************************************/
POOL.crisis.push({
  id: "oc_crisis_3_eloping_leave_room",
  title: "Crisis Drill: Leaving the Room",
  start: "step1",
  steps: {
    step1: {
      text: "OC bolts toward the door and leaves the room during a demand. This has happened before as an escape response.",
      choices: {
        A: {
          text: "Follow the safety plan: maintain line-of-sight, alert designated support staff, keep language minimal, and guide him to the supervised calm option.",
          score: 10,
          feedback: "Excellent. Safety-first response prevents reinforcement of unmanaged elopement and routes him to plan-aligned support.",
          next: "step2A"
        },
        B: {
          text: "Call after him to come back while staying with the class.",
          score: 0,
          feedback: "Neutral. Less effective if he is already out; lacks the plan’s supervision steps.",
          next: "step2B"
        },
        C: {
          text: "Yell and threaten consequences while he leaves.",
          score: -10,
          feedback: "High intensity can escalate and increase future eloping.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC stops in the hallway, breathing hard, and says he is not doing the work.",
      choices: {
        A: {
          text: "Prompt replacement: “Ask for break or help.” Honor a brief calm break, then return to class with a reduced chunk and adult-supported first step.",
          score: 10,
          feedback: "Strong. Teaches a functional alternative and ensures re-entry is predictable.",
          next: "step3A"
        },
        B: {
          text: "Lecture about leaving and rules before returning.",
          score: 0,
          feedback: "Neutral. Extended talk can add attention and re-trigger escalation.",
          next: "step3B"
        },
        C: {
          text: "Insist on immediate return with full demand and point loss.",
          score: -10,
          feedback: "Increases escape motivation and may trigger another bolt.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC keeps moving and leaving appears to be working to end the task.",
      choices: {
        A: {
          text: "Repair: activate support immediately, establish line-of-sight, and route to supervised calm option. Keep demands off until calm.",
          score: 10,
          feedback: "Excellent repair. Prevents escape reinforcement and increases safety.",
          next: "step3A"
        },
        B: {
          text: "Repeat directions to return without moving closer or activating support.",
          score: 0,
          feedback: "Neutral. May not be sufficient to stop eloping.",
          next: "step3B"
        },
        C: {
          text: "Publicly announce what OC is doing to the class.",
          score: -10,
          feedback: "Public attention can increase escalation and shame.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates while leaving, yelling and kicking a chair near the doorway.",
      choices: {
        A: {
          text: "Repair: create space, maintain line-of-sight, activate support, and keep language to safety only. Route to calm option when safe.",
          score: 10,
          feedback: "Excellent. Prioritizes safety and plan-aligned crisis response.",
          next: "step3A"
        },
        B: {
          text: "Keep yelling demands to return.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate further.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in the hallway.",
          score: -10,
          feedback: "Debate increases attention and prolongs escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC calms with supervision and returns to class ready for a small chunk.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safe re-entry is happening. Reinforce recovery and re-engagement.", next: "step4" } }
    },
    step3B: {
      text: "OC returns but remains tense and likely to leave again.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stabilized but fragile. Needs clearer first-then and reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC continues resisting and attempts to leave again.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation and escape patterns increased.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after he returns?",
      choices: {
        A: {
          text: "Reinforce recovery: points + praise for returning, safe body/safe words, and using break/help appropriately. Restart with a reduced chunk and planned break after it.",
          score: 10,
          feedback: "Perfect. Reinforces the safe alternative and makes re-entry predictable.",
          ending: "success"
        },
        B: {
          text: "Return to full demand immediately with no reinforcement.",
          score: 0,
          feedback: "Neutral. Can increase escape motivation and future eloping.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the eloping and consequences at length.",
          score: -10,
          feedback: "Rehashing can trigger another escalation cycle.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Safe Re-Entry Reinforced", text: "You followed safety steps, routed to a supervised calm option, and reinforced safe return to learning." },
    mixed: { title: "Mixed – Returned, Weak Routine", text: "OC returned, but reinforcement and demand adjustments were unclear." },
    fail: { title: "Fail – Eloping Reinforced", text: "High attention/conflict increased escape value and future leaving risk." }
  }
});


/*************************************************
 * CRISIS SCENARIO 4 — Under Table + Throwing (Combo Escalation)
 **************************************************/
POOL.crisis.push({
  id: "oc_crisis_4_under_table_throwing_combo",
  title: "Crisis Drill: Under Table + Throwing",
  start: "step1",
  steps: {
    step1: {
      text: "OC crawls under the table and begins tossing nearby items to escape the task and control the situation.",
      choices: {
        A: {
          text: "Safety first: clear peers, create space, keep voice low. Use minimal language: “Safe hands.” Offer calm space when safe and activate support if needed.",
          score: 10,
          feedback: "Excellent. You reduce risk and remove audience attention while following plan-aligned de-escalation.",
          next: "step2A"
        },
        B: {
          text: "Tell him to come out and explain why this is inappropriate.",
          score: 0,
          feedback: "Neutral. Explanation can add attention and may not reduce danger.",
          next: "step2B"
        },
        C: {
          text: "Threaten consequences loudly and demand he come out now.",
          score: -10,
          feedback: "High intensity can escalate and increase throwing.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC stops throwing for a moment but stays under the table, breathing hard.",
      choices: {
        A: {
          text: "Prompt replacement: “Ask for break or help.” Honor calm space/break, then restart with a tiny first-then chunk and adult-supported first step.",
          score: 10,
          feedback: "Strong. Teaches the functional alternative and supports re-entry without power struggle.",
          next: "step3A"
        },
        B: {
          text: "Try to process what happened right now.",
          score: 0,
          feedback: "Neutral. Processing during dysregulation can reignite escalation.",
          next: "step3B"
        },
        C: {
          text: "Demand cleanup and apology before he calms.",
          score: -10,
          feedback: "Demands can trigger another escalation cycle.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC throws again and peers react. Attention shifts to him.",
      choices: {
        A: {
          text: "Repair: stop talking, move peers away, create space, activate support, and keep prompts to safety only.",
          score: 10,
          feedback: "Excellent repair. Removes the stage and reduces risk.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder to come out and stop.",
          score: 0,
          feedback: "Neutral. Repetition can add attention and escalate.",
          next: "step3B"
        },
        C: {
          text: "Stop class for a public lecture about OC.",
          score: -10,
          feedback: "Creates a stage and escalates attention and conflict.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates further, shouting and throwing more items from under the table.",
      choices: {
        A: {
          text: "Repair: increase distance, keep peers safe, activate support, and route to calm space when safe. Minimal safety language only.",
          score: 10,
          feedback: "Excellent. Safety-first approach aligned with crisis prevention.",
          next: "step3A"
        },
        B: {
          text: "Keep threatening consequences.",
          score: 0,
          feedback: "Neutral. Threats can maintain escalation.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences and blame.",
          score: -10,
          feedback: "Debate increases attention and prolongs crisis.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC stops throwing and uses calm space with supervision.",
      choices: { A: { text: "Continue.", score: 10, feedback: "De-escalation occurred. Keep demands low and follow plan re-entry steps.", next: "step4" } }
    },
    step3B: {
      text: "OC pauses but stays tense and may throw again.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stabilized but fragile. Needs calm option and predictable steps.", next: "step4" } }
    },
    step3C: {
      text: "OC continues throwing and the room’s attention stays on him.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation and safety risk remain high.", next: "step4" } }
    },

    step4: {
      text: "After calm space, what is the best wrap-up?",
      choices: {
        A: {
          text: "Brief private restoration/cleanup, then restart with a tiny chunk and first-then. Reinforce safe hands and using break/help (points).",
          score: 10,
          feedback: "Perfect. Reinforces recovery and safe re-entry without spotlighting.",
          ending: "success"
        },
        B: {
          text: "Return to full demands immediately and skip reinforcement.",
          score: 0,
          feedback: "Neutral. Can increase escape and future escalation.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the incident in front of peers.",
          score: -10,
          feedback: "Public attention can trigger shame and future escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Combo Escalation Resolved", text: "You reduced risk, used calm space, and reinforced safe recovery and re-entry." },
    mixed: { title: "Mixed – Ended, Weak Routine", text: "The episode ended, but the replacement routine was not clearly reinforced." },
    fail: { title: "Fail – Stage Created", text: "Public attention/conflict prolonged escalation and increased future risk." }
  }
});


/*************************************************
 * CRISIS SCENARIO 5 — Property Damage Risk (Desk Toss / Furniture)
 **************************************************/
POOL.crisis.push({
  id: "oc_crisis_5_property_damage_risk",
  title: "Crisis Drill: Property Damage Risk",
  start: "step1",
  steps: {
    step1: {
      text: "OC escalates and begins shoving or tipping furniture (desk/chair), creating a property damage and safety risk.",
      choices: {
        A: {
          text: "Safety first: clear peers, create space, activate support, and keep language minimal: “Stop. Safe body.” Route to calm space when safe.",
          score: 10,
          feedback: "Excellent. Safety and support are the priority in a high-risk moment.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop and explain why he cannot do that.",
          score: 0,
          feedback: "Neutral. Explanation adds attention and may not reduce danger quickly.",
          next: "step2B"
        },
        C: {
          text: "Threaten consequences loudly and demand he stop now.",
          score: -10,
          feedback: "High intensity can escalate and increase risk.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC stops moving furniture but remains tense and says he is done with the task.",
      choices: {
        A: {
          text: "Prompt replacement: “Ask for break or help.” Honor calm space/break, then restart with a reduced chunk and adult-supported entry.",
          score: 10,
          feedback: "Strong. Uses the plan-aligned alternative and supports safe re-entry.",
          next: "step3A"
        },
        B: {
          text: "Tell him to return immediately to full work demands.",
          score: 0,
          feedback: "Neutral. Full demands may re-trigger escalation.",
          next: "step3B"
        },
        C: {
          text: "Demand cleanup and apology before he calms.",
          score: -10,
          feedback: "Demands can restart escalation quickly.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC shoves again as peers watch and the room’s attention focuses on him.",
      choices: {
        A: {
          text: "Repair: stop explaining, move peers, create space, activate support, and use minimal safety language only.",
          score: 10,
          feedback: "Excellent repair. Removes the stage and reduces danger.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder to stop.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Stop class for a public lecture about behavior.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates further, yelling and pushing furniture again.",
      choices: {
        A: {
          text: "Repair: increase distance, keep peers safe, activate support, and route to calm space when safe. Minimal language only.",
          score: 10,
          feedback: "Excellent. Safety-first, support activated, and escalation contained.",
          next: "step3A"
        },
        B: {
          text: "Keep threatening consequences and point loss.",
          score: 0,
          feedback: "Neutral. Threats can maintain escalation.",
          next: "step3B"
        },
        C: {
          text: "Argue about behavior choices and consequences.",
          score: -10,
          feedback: "Debate increases attention and prolongs crisis.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC de-escalates with support and can return to learning with a small chunk.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Safe recovery occurred. Reinforce and restart predictably.", next: "step4" } }
    },
    step3B: {
      text: "OC calms briefly but remains tense and avoidant.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stabilized but fragile. Needs clear first-then and reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC continues escalated behavior and safety risk remains.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation and safety risk remain high.", next: "step4" } }
    },

    step4: {
      text: "Once calm, what is the best wrap-up?",
      choices: {
        A: {
          text: "Brief private restoration, then restart with a tiny chunk and first-then. Reinforce safe body/safe words and returning appropriately (points).",
          score: 10,
          feedback: "Perfect. Reinforces recovery and prevents furniture behavior from becoming a reliable escape routine.",
          ending: "success"
        },
        B: {
          text: "Return to full demands immediately and skip reinforcement.",
          score: 0,
          feedback: "Neutral. Can increase escape and future escalation.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the episode publicly in front of peers.",
          score: -10,
          feedback: "Public attention can increase shame and future escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Safety Restored and Recovery Reinforced", text: "You reduced risk, activated support, and reinforced safe recovery and re-entry." },
    mixed: { title: "Mixed – Ended, Weak Routine", text: "The episode ended, but the replacement routine was not strengthened." },
    fail: { title: "Fail – Escalation Maintained", text: "Public attention/conflict prolonged escalation and increased future risk." }
  }
});

/*************************************************
 * WILDCARD SCENARIO 1 — Surprise Schedule Change (Assembly/Testing)
 **************************************************/
POOL.wild.push({
  id: "oc_wild_1_surprise_schedule_change",
  title: "Wildcard Mission: Surprise Schedule Change",
  start: "step1",
  steps: {
    step1: {
      text: "A surprise schedule change happens (assembly/testing). OC immediately says, “No,” pushes his materials, and starts to stand up like he might leave.",
      choices: {
        A: {
          text: "Preview + first-then: “Change happened. First 2 minutes here, then calm space/break.” Offer a choice: “Desk or calm space first?”",
          score: 10,
          feedback: "Great. You acknowledge the change briefly and give a predictable path plus controlled choice.",
          next: "step2A"
        },
        B: {
          text: "Explain the change and why everyone has to do it.",
          score: 0,
          feedback: "Neutral. Explanation can add attention and delay de-escalation.",
          next: "step2B"
        },
        C: {
          text: "Publicly reprimand him for being negative about the change.",
          score: -10,
          feedback: "Public correction can escalate refusal and disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC stays in the room but looks overwhelmed and says, “I can’t do this.”",
      choices: {
        A: {
          text: "Prompt replacement: “Ask for break or help.” Honor the request, then return with a tiny chunk and adult-supported first step.",
          score: 10,
          feedback: "Excellent. Teaches the functional alternative and supports re-entry.",
          next: "step3A"
        },
        B: {
          text: "Tell him he has to deal with it and stay where he is.",
          score: 0,
          feedback: "Neutral. It may restart refusal without offering the plan-based alternative.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately because he complained.",
          score: -10,
          feedback: "Point loss without replacement prompting can increase escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC argues louder and peers begin watching.",
      choices: {
        A: {
          text: "Repair: reduce audience and restate first-then in one line. Offer calm space as the regulated option.",
          score: 10,
          feedback: "Great repair. Minimal language and controlled options reduce escalation.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining until he agrees.",
          score: 0,
          feedback: "Neutral. Negotiation prolongs attention and delay.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and address OC publicly.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates and kicks his chair back, making a loud noise.",
      choices: {
        A: {
          text: "Safety + minimal language: create space, keep peers engaged elsewhere, prompt calm space/break request, and activate support if needed.",
          score: 10,
          feedback: "Excellent. Safety-first and reduces the audience payoff.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder to stop now.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in front of peers.",
          score: -10,
          feedback: "Debate increases attention and prolongs escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC uses calm space/break appropriately and returns ready for a small chunk.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Replacement behavior used and transition supported.", next: "step4" } }
    },
    step3B: {
      text: "OC stays in the room but remains tense and avoidant.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but fragile. Needs clearer first-then and reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates and the schedule change becomes a bigger disruption.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and the plan path was not strengthened.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after the schedule change is managed?",
      choices: {
        A: {
          text: "Reinforce: points + praise for staying in room, safe body/safe words, and using break/help appropriately.",
          score: 10,
          feedback: "Perfect. Reinforces coping and flexibility aligned to the plan.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement since it took time.",
          score: 0,
          feedback: "Neutral. Misses a key reinforcement moment for coping behavior.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the behavior after he calms.",
          score: -10,
          feedback: "Rehashing can re-trigger escalation during the next demand.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Change Managed With Coping Skills", text: "OC used plan-aligned coping options and earned reinforcement for safe behavior and flexibility." },
    mixed: { title: "Mixed – Managed, Weak Reinforcement", text: "OC stabilized, but reinforcement for coping was unclear." },
    fail: { title: "Fail – Escalation Maintained", text: "Public attention/conflict increased the payoff and made changes harder next time." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 2 — Substitute Teacher (Structure Changes)
 **************************************************/
POOL.wild.push({
  id: "oc_wild_2_substitute_day",
  title: "Wildcard Mission: Substitute Day",
  start: "step1",
  steps: {
    step1: {
      text: "A substitute is in the room. OC tests the structure by refusing a direction and saying, “I’m not doing this,” while peers watch.",
      choices: {
        A: {
          text: "Keep it consistent: first-then + choice. “First 2 minutes/2 problems, then break.” Offer: “Which two first?”",
          score: 10,
          feedback: "Great. Preserves the plan routine and reduces escape behavior without a power struggle.",
          next: "step2A"
        },
        B: {
          text: "Explain the rules to the substitute and talk about OC in front of him.",
          score: 0,
          feedback: "Neutral. Public adult discussion can increase attention and escalation.",
          next: "step2B"
        },
        C: {
          text: "Publicly reprimand OC to show control.",
          score: -10,
          feedback: "Public attention can escalate refusal and disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC complies briefly but starts muttering and pushing materials again.",
      choices: {
        A: {
          text: "Keep it minimal: prompt safe words/body and offer break/help if needed. Reinforce first compliant step with points and follow through with the break after the chunk.",
          score: 10,
          feedback: "Excellent. Reinforces the routine and keeps the earn path credible.",
          next: "step3A"
        },
        B: {
          text: "Wait and hope it settles without giving supports.",
          score: 0,
          feedback: "Neutral. May work, but he may escalate without a clear path.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately for muttering.",
          score: -10,
          feedback: "Point loss without replacement prompting can increase escalation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC smirks and escalates because adults are talking about him. Peers look over.",
      choices: {
        A: {
          text: "Repair: handle privately. Use first-then in one line and offer a break/help request option. Keep peers focused on instruction.",
          score: 10,
          feedback: "Great repair. Removes the stage and returns to plan supports.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining OC’s behavior to the substitute.",
          score: 0,
          feedback: "Neutral. Maintains the attention and could escalate.",
          next: "step3B"
        },
        C: {
          text: "Tell the class to ignore OC and stop watching him.",
          score: -10,
          feedback: "Public attention can increase escalation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates into refusal and begins to stand up to leave the area.",
      choices: {
        A: {
          text: "Safety + minimal language: “Stay in the room.” Offer supervised calm option and activate support if needed per plan.",
          score: 10,
          feedback: "Excellent. Prevents unmanaged eloping and routes him to plan-aligned support.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder until he sits.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in front of peers.",
          score: -10,
          feedback: "Debate increases attention and escalation risk.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC uses plan supports and re-engages with a small chunk safely.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Replacement behavior and re-entry were supported.", next: "step4" } }
    },
    step3B: {
      text: "OC quiets but stays tense and avoidant.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but fragile. Needs clearer reinforcement and follow-through.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates and class disruption increases.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and the plan path was not strengthened.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up substitute-day support?",
      choices: {
        A: {
          text: "Reinforce the replacement behavior: points + praise for safe body/safe words and for using break/help. Keep the plan consistent all day.",
          score: 10,
          feedback: "Perfect. Builds predictability on a low-structure day.",
          ending: "success"
        },
        B: {
          text: "Let it go without reinforcement since it is a substitute day.",
          score: 0,
          feedback: "Neutral. Misses key reinforcement moments when structure is harder.",
          ending: "mixed"
        },
        C: {
          text: "Publicly debrief behavior so the substitute sees consequences.",
          score: -10,
          feedback: "Public attention can escalate and increase avoidance.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Plan Held on Substitute Day", text: "OC used plan-aligned supports and earned reinforcement for coping and re-engagement." },
    mixed: { title: "Mixed – Managed, Weak Routine", text: "OC stabilized, but reinforcement and follow-through were inconsistent." },
    fail: { title: "Fail – Structure Breakdown", text: "Public attention/conflict increased escape behavior and disruption." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 3 — Tech Issue (Computer/Assignment Glitch)
 **************************************************/
POOL.wild.push({
  id: "oc_wild_3_tech_issue_task_glitch",
  title: "Wildcard Mission: Tech Issue",
  start: "step1",
  steps: {
    step1: {
      text: "OC is working on a computer-based task when the program glitches. He slams the keyboard lightly and says, “I’m done,” trying to escape the task.",
      choices: {
        A: {
          text: "Calm support + choice: “Tech problem.” Offer: “Break for 2 minutes or switch to paper for 2 items.” Then return to first-then.",
          score: 10,
          feedback: "Great. Acknowledges the trigger and offers a controlled, plan-aligned alternative to escape.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop overreacting and just try again.",
          score: 0,
          feedback: "Neutral. Does not reduce frustration or give a structured path forward.",
          next: "step2B"
        },
        C: {
          text: "Publicly reprimand him for slamming the keyboard.",
          score: -10,
          feedback: "Public attention can escalate and increase disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC chooses a break but stays tense and says, “This always happens,” while looking for peer reactions.",
      choices: {
        A: {
          text: "Keep it brief and private: “Thanks for choosing break.” After break: “First 2 items, then done.” Reinforce safe words/body with points.",
          score: 10,
          feedback: "Excellent. Keeps the routine predictable and reinforces coping.",
          next: "step3A"
        },
        B: {
          text: "Talk through the problem for a long time while he vents.",
          score: 0,
          feedback: "Neutral. Extended attention can maintain avoidance and anger.",
          next: "step3B"
        },
        C: {
          text: "Remove points for complaining.",
          score: -10,
          feedback: "Point loss without replacement prompting can escalate.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC argues louder and pushes the mouse away. A peer looks over.",
      choices: {
        A: {
          text: "Repair: reduce audience and offer the planned options again: brief break or 2-item switch. Keep language minimal.",
          score: 10,
          feedback: "Nice repair. Removes attention and restores a predictable choice/escape alternative.",
          next: "step3A"
        },
        B: {
          text: "Keep insisting he try again without changes.",
          score: 0,
          feedback: "Neutral. Likely to increase escape-maintained refusal.",
          next: "step3B"
        },
        C: {
          text: "Stop class and address his behavior publicly.",
          score: -10,
          feedback: "Creates a stage and increases escalation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates and begins sweeping items off the desk.",
      choices: {
        A: {
          text: "Safety + minimal language: create space, keep peers away, activate support if needed, and route to calm space/break when safe.",
          score: 10,
          feedback: "Excellent repair. Safety-first and plan-aligned de-escalation steps.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder to stop.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in the moment.",
          score: -10,
          feedback: "Debate increases attention and prolongs escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC takes a brief break and returns to complete a small chunk safely.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Coping and re-entry were supported and reinforced.", next: "step4" } }
    },
    step3B: {
      text: "OC quiets but remains avoidant and tense.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but fragile. Needs clearer first-then and reinforcement for the first safe step.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates and the tech issue becomes a major disruption.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and safety risk rose.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after the tech issue is resolved?",
      choices: {
        A: {
          text: "Reinforce safe coping: points + praise for safe words/body and using break/help. Return to first-then and complete a small chunk.",
          score: 10,
          feedback: "Perfect. Reinforces coping and reduces future avoidance with tech issues.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement and increase demands immediately.",
          score: 0,
          feedback: "Neutral. Can increase future escape behavior.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the behavior after he calms.",
          score: -10,
          feedback: "Rehashing can trigger a second escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Tech Frustration Managed", text: "OC used plan-aligned coping and returned to a small chunk with reinforcement for safe behavior." },
    mixed: { title: "Mixed – Managed, Weak Routine", text: "OC stabilized, but reinforcement and follow-through were inconsistent." },
    fail: { title: "Fail – Escalation Maintained", text: "Public attention/conflict increased avoidance and disruption." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 4 — Peer Conflict (Provocation During Work)
 **************************************************/
POOL.wild.push({
  id: "oc_wild_4_peer_conflict_provocation",
  title: "Wildcard Mission: Peer Conflict During Work",
  start: "step1",
  steps: {
    step1: {
      text: "A peer makes a comment that annoys OC during work time. OC snaps back and starts escalating, pushing materials away.",
      choices: {
        A: {
          text: "De-escalate privately: “Safe words.” Offer: “Calm space for 2 minutes or break request.” Then return to the chunked task.",
          score: 10,
          feedback: "Great. You address safety and coping first, then return to the work routine predictably.",
          next: "step2A"
        },
        B: {
          text: "Tell OC to ignore it and keep working without supports.",
          score: 0,
          feedback: "Neutral. He may escalate without a coping path.",
          next: "step2B"
        },
        C: {
          text: "Publicly correct OC in front of the peer and class.",
          score: -10,
          feedback: "Public attention can escalate peer conflict and refusal.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC takes a breath but says, “I’m not doing this,” trying to escape the work now that he is upset.",
      choices: {
        A: {
          text: "First-then + reduce demand: “First 2 items, then break.” Offer choice: “Do these two or those two?” Reinforce safe words/body with points.",
          score: 10,
          feedback: "Excellent. You prevent peer conflict from turning into full task escape.",
          next: "step3A"
        },
        B: {
          text: "Process the peer conflict at length before returning to work.",
          score: 0,
          feedback: "Neutral. Extended attention can maintain avoidance.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately for snapping at the peer.",
          score: -10,
          feedback: "Point loss without replacement prompting can escalate.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC escalates and peers begin watching the conflict.",
      choices: {
        A: {
          text: "Repair: reduce audience (separate attention), prompt calm space/break request, and return to first-then in one line.",
          score: 10,
          feedback: "Great repair. Removes the stage and re-establishes the plan path.",
          next: "step3A"
        },
        B: {
          text: "Keep telling both students to stop while the class watches.",
          score: 0,
          feedback: "Neutral. Keeps attention on conflict and can escalate.",
          next: "step3B"
        },
        C: {
          text: "Stop the class and publicly address the conflict.",
          score: -10,
          feedback: "Creates a stage and increases escalation risk.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC becomes more dysregulated and begins to stand like he might leave the area.",
      choices: {
        A: {
          text: "Safety + minimal language: “Stay in the room.” Route to calm space with supervision and activate support if needed.",
          score: 10,
          feedback: "Excellent. Prevents unmanaged leaving and supports de-escalation.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder to sit down.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences and blame.",
          score: -10,
          feedback: "Debate increases attention and prolongs escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC uses coping supports and returns to work with a small chunk.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Coping and re-entry supported. Reinforce safe behavior.", next: "step4" } }
    },
    step3B: {
      text: "OC quiets but remains tense and avoidant.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but fragile. Needs clearer reinforcement and follow-through.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates and the peer conflict turns into a major disruption.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased and escape behavior was strengthened.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up after the peer conflict is resolved?",
      choices: {
        A: {
          text: "Reinforce: points + praise for safe words/safe body and returning to work. Resume the planned first-then routine.",
          score: 10,
          feedback: "Perfect. Reinforces coping and prevents conflict from becoming an escape trigger.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement since it was a conflict.",
          score: 0,
          feedback: "Neutral. Misses a key reinforcement moment for coping.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the conflict publicly after it ends.",
          score: -10,
          feedback: "Public attention can restart escalation or shame.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – Conflict Managed and Work Re-Entry Reinforced", text: "OC used coping supports and returned to learning with reinforcement for safe behavior." },
    mixed: { title: "Mixed – Managed, Weak Routine", text: "OC stabilized, but reinforcement and follow-through were inconsistent." },
    fail: { title: "Fail – Conflict Became Escape Trigger", text: "Public attention/conflict increased avoidance and future escalation risk." }
  }
});


/*************************************************
 * WILDCARD SCENARIO 5 — End-of-Day Fatigue (Lower Coping, Higher Avoidance)
 **************************************************/
POOL.wild.push({
  id: "oc_wild_5_end_of_day_fatigue",
  title: "Wildcard Mission: End-of-Day Fatigue",
  start: "step1",
  steps: {
    step1: {
      text: "It is late in the day. OC looks tired and irritable. When you assign a short wrap-up task, he says, “No,” and begins pushing materials away.",
      choices: {
        A: {
          text: "Reduce demand + first-then: “First 1 minute/1 item, then done.” Offer choice: “Do the first one with me or alone?”",
          score: 10,
          feedback: "Great. Fatigue-sensitive support reduces escape motivation and increases compliance.",
          next: "step2A"
        },
        B: {
          text: "Tell him he has to do it like everyone else.",
          score: 0,
          feedback: "Neutral. Does not reduce demand or offer a coping path.",
          next: "step2B"
        },
        C: {
          text: "Publicly correct him for refusing at the end of the day.",
          score: -10,
          feedback: "Public attention can escalate and increase disruption.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "OC starts but mutters, “This is stupid,” and looks for reactions.",
      choices: {
        A: {
          text: "Keep it brief and reinforce: praise + points for safe words/body and completing the tiny chunk. Then end the task as promised.",
          score: 10,
          feedback: "Excellent. Reinforces coping and maintains trust in first-then.",
          next: "step3A"
        },
        B: {
          text: "Correct the muttering and keep the task going longer.",
          score: 0,
          feedback: "Neutral. Extending demands can increase avoidance.",
          next: "step3B"
        },
        C: {
          text: "Remove points immediately for the comment.",
          score: -10,
          feedback: "Point loss can escalate when coping is already low due to fatigue.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "OC argues louder and begins to stand like he might leave.",
      choices: {
        A: {
          text: "Repair: safety + minimal language. “Stay in the room.” Offer calm space/break request and reduce demand to a single item first-then.",
          score: 10,
          feedback: "Great repair. Prevents unmanaged leaving and restores a predictable path.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining why it must be done.",
          score: 0,
          feedback: "Neutral. Explanation can maintain attention and avoidance.",
          next: "step3B"
        },
        C: {
          text: "Stop class and address OC publicly.",
          score: -10,
          feedback: "Creates a stage and escalates disruption.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "OC escalates and sweeps materials off the desk as peers watch.",
      choices: {
        A: {
          text: "Safety first: create space, clear peers, activate support if needed, and route to calm space. Keep demands off until calm.",
          score: 10,
          feedback: "Excellent. Safety-first response aligned with plan steps during low coping time.",
          next: "step3A"
        },
        B: {
          text: "Repeat demands louder to stop.",
          score: 0,
          feedback: "Neutral. Increased intensity can escalate.",
          next: "step3B"
        },
        C: {
          text: "Argue about consequences in the moment.",
          score: -10,
          feedback: "Debate increases escalation and delays safe reset.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "OC completes the tiny chunk (or returns from calm space) and is calmer.",
      choices: { A: { text: "Continue.", score: 10, feedback: "Fatigue-sensitive supports worked. Reinforce and end as promised.", next: "step4" } }
    },
    step3B: {
      text: "OC quiets but remains tense and avoidant.",
      choices: { A: { text: "Continue.", score: 0, feedback: "Stable but fragile. Needs smaller demand and immediate reinforcement.", next: "step4" } }
    },
    step3C: {
      text: "OC escalates and end-of-day becomes highly disruptive.",
      choices: { A: { text: "Continue.", score: -10, feedback: "Escalation increased during low coping time.", next: "step4" } }
    },

    step4: {
      text: "How do you wrap up the day after this moment?",
      choices: {
        A: {
          text: "Reinforce recovery: points + praise for safe body/safe words and completing the small chunk. End the demand as promised and transition to dismissal calmly.",
          score: 10,
          feedback: "Perfect. Reinforces coping and prevents end-of-day tasks from becoming a major trigger.",
          ending: "success"
        },
        B: {
          text: "Move on without reinforcement and extend demands.",
          score: 0,
          feedback: "Neutral. Can increase future avoidance and escalation at the end of the day.",
          ending: "mixed"
        },
        C: {
          text: "Rehash the behavior publicly before dismissal.",
          score: -10,
          feedback: "Public attention can trigger shame and next-day avoidance.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: "Success – End-of-Day Coping Reinforced", text: "OC used plan-aligned coping supports and earned reinforcement for safe behavior and completion." },
    mixed: { title: "Mixed – Managed, Weak Routine", text: "OC stabilized, but reinforcement and follow-through were inconsistent." },
    fail: { title: "Fail – End-of-Day Escalation Increased", text: "Public attention/conflict increased avoidance and disruption." }
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

// OC — escape-driven refusal/eloping + disruptive behavior
// Supports: preview expectations, first-then, chunking, choices, break/help requests, calm space, contract points (70% goal) + bonus for safe body/safe words

if (pct >= 80) {
  actionSteps = `
    <ul>
      <li>Keep front-loading supports before known triggers (independent work starts, writing, transitions, end-of-day, and any schedule change).</li>
      <li>Stay consistent with short, neutral one-step directions paired with first-then and a small choice (which two first, write or dictate, desk or calm space first) instead of “no” or negotiation.</li>
      <li>Use the planned escape alternative every time: prompt a break/help request and deliver the break as promised after the chunk (keep it calm and low-key).</li>
      <li>Reinforce immediately with points (and bonus points) for safe body, safe words, staying in the room, task start, and appropriate requests. Keep it private.</li>
      <li>When early signs show up (head down, arguing starts, chair push, standing to leave), your quick reset + re-entry chunk is working. Keep that timing.</li>
    </ul>`;
} 
else if (pct >= 50) {
  actionSteps = `
    <ul>
      <li>Add pre-corrections earlier, especially right before demands and transitions: preview the next step and the earn path (small chunk → break).</li>
      <li>Prompt the replacement behavior sooner (request break/help, calm space, “I need help”) before arguing grows or peers become the audience.</li>
      <li>Shorten language to one clear step at a time and reduce the task fast (2 items, 1 sentence, do the first one together). Reinforce immediately with points for the first compliant step.</li>
      <li>If the behavior shifts toward attention (peer conflict, muttering for reactions), reduce the audience first and keep your response private and brief.</li>
      <li>Follow through on first-then consistently so the earn path stays trustworthy.</li>
    </ul>`;
} 
else {
  actionSteps = `
    <ul>
      <li>Rebuild the proactive setup: clear expectations for safe body/safe words/staying in the room, plus a visible “how to earn” path (tiny chunk → break) and the 70% daily goal.</li>
      <li>Practice the replacement routine outside tough moments: one-step prompt, small choice, break/help request, calm space, then a tiny re-entry chunk with adult support.</li>
      <li>During escalation, use minimal language and predictable steps only. Avoid public correction, long explanations, or debates that create a stage.</li>
      <li>If there is leaving-area risk or unsafe behavior (throwing, window/furniture), follow the safety plan exactly: clear peers, create space, maintain line-of-sight, activate support, and route to the supervised calm option when safe.</li>
      <li>Once calm, do a brief private restore and immediately reinforce recovery and re-entry with points.</li>
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
