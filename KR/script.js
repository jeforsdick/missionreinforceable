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
