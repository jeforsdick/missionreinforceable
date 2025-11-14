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

  setWizardSprite(state);

  feedbackEl.classList.remove('state-plus','state-meh','state-minus','flash');
  feedbackEl.classList.add(`state-${state}`);
  feedbackTextEl.textContent = text || '';
  requestAnimationFrame(() => feedbackEl.classList.add('flash'));
}

/* ===== RESULTS: client → GAS webhook ===== */
const RESULT_ENDPOINT = "https://script.google.com/macros/s/AKfycbx1XP42217uss-Uhnj1ELfZkCd6PABaXLnsxbG-9mNY9iuQzAdkw2_P8t6T52APiEBz/exec";

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

  // === GET STUDENT FROM URL (e.g. ?student=LF) ===
  const url = new URL(window.location.href);
  const student = url.searchParams.get("student") || "LF";

  const payload = {
    teacher_code: getTeacherCode(),
    session_id: SESSION_ID,
    points,
    max_possible: maxPossible,
    percent: percentScore(),
    timestamp: new Date().toISOString(),
    log: events,
    mode: mode, // NEW: Daily / Crisis / Wildcard
    student: student // NEW: LF, Sarah, etc.
  };

  try {
    fetch(RESULT_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Failed to send results:", e); // For debugging
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
POOL.daily.push({
  id: "daily_1_whole_group_callouts",
  title: "Daily Mission: Whole-Group Instruction",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During whole-group instruction, LF sits near two preferred peers. As you begin explaining a math concept, she blurts out, “I know the answer!” without raising her hand.",
      choices: {
        A: {
          text: "Use neutral planned ignoring, then prompt: “Try again—hand up first.”",
          score: 10,
          feedback: "Great fidelity. You avoid giving peer attention and guide her into replacement behavior.",
          next: "step2A"
        },
        B: {
          text: "Give a gentle reminder to “Wait your turn” without referencing hand-raising.",
          score: 0,
          feedback: "Neutral. LF gets teacher attention, but the core skill isn’t cued.",
          next: "step2B"
        },
        C: {
          text: "Say publicly, “Stop shouting out!”",
          score: -10,
          feedback: "Public correction increases peer attention and escalates attention-seeking behavior.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF pauses, then looks at her hand and glances toward you.",
      choices: {
        A: {
          text: "Pre-correct: “Remember—red card means quiet. Hand up if you want to share.”",
          score: 10,
          feedback: "Clear expectations + card check strengthens the routine.",
          next: "step3A"
        },
        B: {
          text: "Move on with the lesson and hope she follows.",
          score: 0,
          feedback: "Neutral. She may follow, but no explicit support was given.",
          next: "step3B"
        },
        C: {
          text: "Tell her, “You need to stop or you’ll lose points.”",
          score: -10,
          feedback: "Threats increase peer attention and reduce motivation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF leans toward a peer and whispers, “I still knew it first.”",
      choices: {
        A: {
          text: "Prompt: “Check your card. What color is it right now?”",
          score: 10,
          feedback: "Excellent. This directs her to the routine without giving more attention.",
          next: "step3A"
        },
        B: {
          text: "Give her a look to signal quiet behavior.",
          score: 0,
          feedback: "Neutral cue, but still some attention.",
          next: "step3B"
        },
        C: {
          text: "Say, “No talking right now.” loudly.",
          score: -10,
          feedback: "Public correction increases peer attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers look over, some smiling. LF smirks and leans back in her chair.",
      choices: {
        A: {
          text: "Redirect privately: “Let’s reset. Hand up if you want to share.”",
          score: 10,
          feedback: "Nice repair—quiet, brief, not feeding peer attention.",
          next: "step3A"
        },
        B: {
          text: "Give her a stern look and gesture to be quiet.",
          score: 0,
          feedback: "Neutral. Mild attention may reinforce behavior.",
          next: "step3B"
        },
        C: {
          text: "Tell the whole class to stop encouraging her.",
          score: -10,
          feedback: "This gives LF a huge attention moment from peers.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF raises her hand appropriately and waits.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She used her replacement behavior!",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF stays mostly quiet but still fidgets and looks toward peers.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Behavior is stable but not fully engaged.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF calls out again: “I KNOW THIS PART!”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "She is escalating—more peer attention likely.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you finalize support in this moment?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for raising your hand!” and award a point.",
          score: 10,
          feedback: "Perfect. Reinforces replacement behavior and keeps attention low-key.",
          ending: "success"
        },
        B: {
          text: "Let her share after a delay and give a neutral acknowledgment.",
          score: 0,
          feedback: "Moderate support. Not reinforcing the replacement behavior clearly.",
          ending: "mixed"
        },
        C: {
          text: "Ignore her raised hand and move on.",
          score: -10,
          feedback: "Missed reinforcement reduces future appropriate behavior.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Hand-Raising Routine Strengthened",
      text: "LF followed the hand-raising routine and received reinforcement without gaining peer attention for shout-outs."
    },
    mixed: {
      title: "Mixed Outcome – Partial Support",
      text: "LF participated but without clear reinforcement for replacement behavior, leading to uneven engagement."
    },
    fail: {
      title: "Escalation – Attention Maintained",
      text: "LF gained peer attention for call-outs with little reinforcement for appropriate behavior, increasing future call-outs."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 2 — Independent Work (Peer Talking)
 **************************************************/
POOL.daily.push({
  id: "daily_2_independent_peer_talking",
  title: "Daily Mission: Independent Work",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "LF begins independent reading work during a red-card period (quiet work). She immediately turns to a peer and whispers, “Did you see that video?”",
      choices: {
        A: {
          text: "Use neutral correction: point to the card and say, “Check the card.” Then walk away.",
          score: 10,
          feedback: "Great fidelity. Brief, neutral, removes peer attention, cues the system.",
          next: "step2A"
        },
        B: {
          text: "Say softly, “Not right now—keep working.”",
          score: 0,
          feedback: "Neutral. Redirects, but still adds attention.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop talking during work time!”",
          score: -10,
          feedback: "Public correction increases peer attention and makes the behavior more likely.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF frowns slightly, checks the red card, and glances back at her work.",
      choices: {
        A: {
          text: "Chunk the task: “Complete the first 3 questions, then you’ll earn a green break.”",
          score: 10,
          feedback: "Excellent. Gives incentive for quiet work and meets attention function safely later.",
          next: "step3A"
        },
        B: {
          text: "Give her space and hope she starts working.",
          score: 0,
          feedback: "Neutral. She may comply, but no active support.",
          next: "step3B"
        },
        C: {
          text: "Tell her she’ll lose a point if she talks again.",
          score: -10,
          feedback: "Threatening without teaching replacement behavior fuels attention-seeking.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF spins her pencil dramatically and leans slightly toward a peer.",
      choices: {
        A: {
          text: "Prompt the routine: “What do you earn when you finish this chunk?”",
          score: 10,
          feedback: "Great cue—redirects to work-first → green-break routine.",
          next: "step3A"
        },
        B: {
          text: "Tap her desk lightly as a reminder to work.",
          score: 0,
          feedback: "Neutral but still gives attention.",
          next: "step3B"
        },
        C: {
          text: "Tell her she is distracting the whole class.",
          score: -10,
          feedback: "Adds peer attention and criticism—highly reinforcing for her.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers giggle. LF smiles and whispers, “Shhh don’t tell her.”",
      choices: {
        A: {
          text: "Quietly redirect: “Let’s reset. Red card = quiet work. Green talk after your chunk.”",
          score: 10,
          feedback: "Nice repair. You avoid public attention and keep the system intact.",
          next: "step3A"
        },
        B: {
          text: "Move her to another seat temporarily.",
          score: 0,
          feedback: "Neutral. Might help but doesn’t teach the routine.",
          next: "step3B"
        },
        C: {
          text: "Lecture her about interrupting learning.",
          score: -10,
          feedback: "Long attention episode = behavior jackpot.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF turns back to her work and begins the first question.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She re-engaged and followed the work-first routine.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF grabs her pencil but still glances toward her peers occasionally.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "She’s compliant but not fully engaged.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF whispers loudly, “I bet you can’t finish before me!”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Peer attention maintained—escalation is likely.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you wrap up this moment?",
      choices: {
        A: {
          text: "When she finishes 3 questions, praise her quietly and flip the card to green for peer break.",
          score: 10,
          feedback: "Beautiful reinforcement of the BIP routine.",
          ending: "success"
        },
        B: {
          text: "Let her finish her work and then give neutral acknowledgment.",
          score: 0,
          feedback: "Moderate support, less tied to the system.",
          ending: "mixed"
        },
        C: {
          text: "Do not provide green time even if she completes the chunk.",
          score: -10,
          feedback: "Breaks the reinforcement system—future compliance drops.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Green Break Earned",
      text: "LF followed the card routine and earned peer time, reinforcing quiet, focused work."
    },
    mixed: {
      title: "Mixed Outcome – Partial Routine Use",
      text: "LF worked but didn’t clearly connect the effort to the system, reducing future motivation."
    },
    fail: {
      title: "Fail – Routine Breakdown",
      text: "LF did not receive predictable reinforcement, making peer-seeking and off-task talking more likely."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 3 — Transition to Partner Work
 **************************************************/
POOL.daily.push({
  id: "daily_3_partner_transition",
  title: "Daily Mission: Transition to Partner Work",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "You announce that students will transition from quiet reading (red card) to partner comprehension checks (green card). LF immediately hops up and says loudly, “Who wants to be my partner?!”, drawing peer attention.",
      choices: {
        A: {
          text: "Pre-correct privately: “Green card in a minute—first directions, then choose a partner.”",
          score: 10,
          feedback: "Great step. You structure the transition and avoid feeding the attention burst.",
          next: "step2A"
        },
        B: {
          text: "Say, “Sit down until it’s time to pick partners.”",
          score: 0,
          feedback: "Neutral. Corrects behavior but still gives attention.",
          next: "step2B"
        },
        C: {
          text: "Tell the class, “Stop responding to LF when she calls out!”",
          score: -10,
          feedback: "Creates a big peer attention moment—highly reinforcing.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF freezes mid-jump, laughs quietly, and returns to her seat.",
      choices: {
        A: {
          text: "Model the routine: “When the green card flips, you’ll ask a partner in a quiet voice.”",
          score: 10,
          feedback: "Beautiful proactive teaching.",
          next: "step3A"
        },
        B: {
          text: "Flip the green card early to move things along.",
          score: 0,
          feedback: "Neutral. Might work but removes structure.",
          next: "step3B"
        },
        C: {
          text: "Tell her she is already being disruptive.",
          score: -10,
          feedback: "Adds attention and may escalate.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF sighs loudly, then whispers to a peer, “I call you first.”",
      choices: {
        A: {
          text: "Prompt: “What color is the card right now?”",
          score: 10,
          feedback: "Excellent. Redirects her to the expectations.",
          next: "step3A"
        },
        B: {
          text: "Signal with a quiet finger to lips.",
          score: 0,
          feedback: "Neutral but adds mild attention.",
          next: "step3B"
        },
        C: {
          text: "Move her seat away from everyone.",
          score: -10,
          feedback: "Punishment during a transition increases stress and attention-seeking.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Several peers giggle. LF grins and says, “I’m the best partner anyway!”",
      choices: {
        A: {
          text: "Quietly redirect: “Let’s reset—the directions come first.”",
          score: 10,
          feedback: "Good repair. Low attention, clear expectation.",
          next: "step3A"
        },
        B: {
          text: "Give her a stern look.",
          score: 0,
          feedback: "Neutral but may inadvertently reinforce behavior.",
          next: "step3B"
        },
        C: {
          text: "Address the whole class about following expectations.",
          score: -10,
          feedback: "Broad attention fuels the behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF waits—still excited, but quiet—as you explain partner directions.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Great regulation and following of expectations.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF fidgets but stays mostly seated. She occasionally glances back at peers.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "She’s semi-regulated but needs reinforcement soon.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF whispers loudly, “I’m going to pick Chloe before anyone else can!”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Attention-seeking increasing—risk of bigger disruption.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you finalize the transition?",
      choices: {
        A: {
          text: "Flip the green card, praise her quiet waiting, and let her choose a partner appropriately.",
          score: 10,
          feedback: "Excellent reinforcement of the routine.",
          ending: "success"
        },
        B: {
          text: "Allow partner choice without specific praise.",
          score: 0,
          feedback: "Neutral. Doesn’t reinforce the waiting behavior.",
          ending: "mixed"
        },
        C: {
          text: "Assign her a partner as a consequence for calling out earlier.",
          score: -10,
          feedback: "Punishment tied to attention behavior risks escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Smooth Partner Transition",
      text: "LF waited appropriately, followed the red→green routine, and earned partner time safely."
    },
    mixed: {
      title: "Mixed Outcome – Uneven Structure",
      text: "LF participated but without clear reinforcement or structure, reducing future consistency."
    },
    fail: {
      title: "Escalation – Attention Gained",
      text: "LF gained attention and partner time without following expectations, reinforcing the call-out behavior."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 4 — Transition Back From Specials
 **************************************************/
POOL.daily.push({
  id: "daily_4_specials_transition",
  title: "Daily Mission: Transition Back From Specials",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "Students return from art. The hallway was loud, and LF is energized. As the class enters, she sidles up to two preferred peers and whispers jokes instead of going to her seat.",
      choices: {
        A: {
          text: "Pre-correct quietly: “Red card right now—head to your seat.”",
          score: 10,
          feedback: "Excellent—neutral and clear without adding peer attention.",
          next: "step2A"
        },
        B: {
          text: "Say from across the room, “Go sit down, please.”",
          score: 0,
          feedback: "Neutral but adds teacher attention.",
          next: "step2B"
        },
        C: {
          text: "Tell the peers, “Stop talking to LF during transitions.”",
          score: -10,
          feedback: "Public attention increases the behavior’s payoff.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF pauses and glances at the red card posted on the board.",
      choices: {
        A: {
          text: "Prompt: “What do you earn after quiet start-up?”",
          score: 10,
          feedback: "Great connection to incentives without over-verbalizing.",
          next: "step3A"
        },
        B: {
          text: "Give her space to follow through.",
          score: 0,
          feedback: "Neutral. She may comply but with less clarity.",
          next: "step3B"
        },
        C: {
          text: "Tell her she is already off-task and needs to focus.",
          score: -10,
          feedback: "Criticism adds attention and risks escalation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF walks slowly to her seat but continues teasing a peer behind her.",
      choices: {
        A: {
          text: "Use neutral correction: point silently to the red card.",
          score: 10,
          feedback: "Great. No verbal attention, clear direction.",
          next: "step3A"
        },
        B: {
          text: "Say, “Not right now” while she walks.",
          score: 0,
          feedback: "Neutral, but attention may reinforce behavior.",
          next: "step3B"
        },
        C: {
          text: "Say, “You’re keeping us from starting!” loudly.",
          score: -10,
          feedback: "Gives the whole class’s attention to her.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers giggle. LF smirks, clearly enjoying the moment.",
      choices: {
        A: {
          text: "Quiet redirection: “Let’s reset—seat first, then directions.”",
          score: 10,
          feedback: "Good repair. Low attention and high clarity.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and wait.",
          score: 0,
          feedback: "Neutral. May or may not work.",
          next: "step3B"
        },
        C: {
          text: "Address the class about behavior expectations.",
          score: -10,
          feedback: "Accidentally reinforces LF’s attention-seeking.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF sits and looks toward you, waiting for what’s next.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She successfully followed the transition routine.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF sits but swivels in her chair and glances toward peers.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "She complied but is still lightly seeking attention.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF blurts, “Are we doing something fun?!” loudly.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation—peer attention is driving behavior.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you settle the class and support LF?",
      choices: {
        A: {
          text: "Give quiet praise: “Thanks for getting seated quickly,” and award a point.",
          score: 10,
          feedback: "Reinforces transition behavior cleanly.",
          ending: "success"
        },
        B: {
          text: "Move into the lesson without additional feedback.",
          score: 0,
          feedback: "Gets things going but doesn’t reinforce expected behaviors.",
          ending: "mixed"
        },
        C: {
          text: "Call out LF publicly for the earlier talking.",
          score: -10,
          feedback: "Adds more peer attention and undermines expectations.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Smooth Re-Entry",
      text: "LF transitioned back from specials with quiet support and earned reinforcement."
    },
    mixed: {
      title: "Mixed – Some Compliance",
      text: "LF followed the transition but didn’t get clear reinforcement, reducing consistency."
    },
    fail: {
      title: "Escalation – Peer Attention Maintained",
      text: "Peer interactions drove behavior, and public corrections reinforced attention-seeking."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 5 — Writing Task (Work Avoidance + Peer Attention)
 **************************************************/
POOL.daily.push({
  id: "daily_5_writing_task",
  title: "Daily Mission: Writing Task",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "LF receives a writing prompt and immediately looks around the room with an exaggerated sigh. She whispers to a nearby peer, “This is soooo boring.”",
      choices: {
        A: {
          text: "Chunk the task: “Write the first two sentences, then you’ll earn green time.”",
          score: 10,
          feedback: "Great support—ties effort to peer-time reinforcement.",
          next: "step2A"
        },
        B: {
          text: "Quietly say, “Let’s get started.”",
          score: 0,
          feedback: "Neutral but offers attention without teaching routine.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop complaining and get to work.”",
          score: -10,
          feedback: "Public correction increases peer attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF opens her notebook slowly but looks at peers as if expecting reactions.",
      choices: {
        A: {
          text: "Prompt: “Check your card—red means quiet. Green after the two sentences.”",
          score: 10,
          feedback: "Strong fidelity. Predictable routine supports engagement.",
          next: "step3A"
        },
        B: {
          text: "Give her space and watch quietly.",
          score: 0,
          feedback: "Neutral. May or may not lead to action.",
          next: "step3B"
        },
        C: {
          text: "Tell her she needs to finish or she’ll lose points.",
          score: -10,
          feedback: "Threats increase attention-seeking.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF doodles on her paper and whispers, “I bet I can finish before you,” to a peer.",
      choices: {
        A: {
          text: "Cue the system: “What do you earn when you finish your chunk?”",
          score: 10,
          feedback: "Redirects her into the structured routine.",
          next: "step3A"
        },
        B: {
          text: "Give a quiet finger-to-lips signal.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Move her away from the peer immediately.",
          score: -10,
          feedback: "Reactive removal delivers attention and undermines proactive routines.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers smirk. LF smacks her pencil dramatically and says, “This is torture.”",
      choices: {
        A: {
          text: "Quiet redirection: “Reset—two sentences first.”",
          score: 10,
          feedback: "Good repair. Keeps attention low and expectations clear.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look.",
          score: 0,
          feedback: "Neutral but still adds attention.",
          next: "step3B"
        },
        C: {
          text: "Engage in a long discussion about effort.",
          score: -10,
          feedback: "Long verbal attention magnifies the escape + attention function.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF writes the first few words quietly.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Great independent engagement.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF writes a single word, then looks around the room again.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial engagement; routine not fully locked in.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF pushes her paper away slightly and turns to a peer again.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Attention behavior escalating.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you conclude this writing block?",
      choices: {
        A: {
          text: "When she completes her two sentences, give quiet praise and flip the card to green for earned peer time.",
          score: 10,
          feedback: "Strong reinforcement of both effort and quiet routine.",
          ending: "success"
        },
        B: {
          text: "Let her do partner talk later but without explicit praise.",
          score: 0,
          feedback: "Moderate but not connected to the routine.",
          ending: "mixed"
        },
        C: {
          text: "Deny green time even if she did the work.",
          score: -10,
          feedback: "Breaks reinforcement predictability and decreases future effort.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Writing Routine Followed",
      text: "LF completed her chunk and earned peer time through the predictable system."
    },
    mixed: {
      title: "Mixed – Some Movement",
      text: "LF worked but without strong reinforcement, decreasing future motivation."
    },
    fail: {
      title: "Fail – Routine Breakdown",
      text: "Without predictable green time, LF is more likely to seek peer attention next writing block."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 6 — Math Block (Shout-Out + Peer Reaction)
 **************************************************/
POOL.daily.push({
  id: "daily_6_math_shoutout",
  title: "Daily Mission: Math Block",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "You introduce a new math problem. Before you finish giving directions, LF blurts out, “This one is easy, everyone watch how fast I do it!” Peers look over immediately.",
      choices: {
        A: {
          text: "Use planned ignoring, then quietly prompt: “Try again — hand up first.”",
          score: 10,
          feedback: "Great fidelity: no attention, quick prompt toward replacement.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “Wait your turn, please.”",
          score: 0,
          feedback: "Neutral redirect but still delivers teacher attention.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop showing off and let me teach.”",
          score: -10,
          feedback: "Public correction delivers peer attention and fuels behavior.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF freezes and lowers her hands. Peers lose interest.",
      choices: {
        A: {
          text: "Pre-correct: “Red card until problem #1 is done.”",
          score: 10,
          feedback: "Great structure; connects expectations to the card system.",
          next: "step3A"
        },
        B: {
          text: "Continue instruction without comment.",
          score: 0,
          feedback: "Neutral and avoids attention, but doesn’t teach expectations.",
          next: "step3B"
        },
        C: {
          text: "Warn her publicly to stop interrupting.",
          score: -10,
          feedback: "Adds attention and increases risk of repeat shout-outs.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF leans back in her chair and theatrically yawns, glancing at peers.",
      choices: {
        A: {
          text: "Prompt: “What color is the card? What does that mean?”",
          score: 10,
          feedback: "Excellent redirect to system expectations.",
          next: "step3A"
        },
        B: {
          text: "Tap her desk lightly while continuing instruction.",
          score: 0,
          feedback: "Neutral cue but still teacher attention.",
          next: "step3B"
        },
        C: {
          text: "Tell her she is disrupting your teaching.",
          score: -10,
          feedback: "Public reprimand = strong attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers laugh. LF beams and taps her pencil loudly.",
      choices: {
        A: {
          text: "Quietly say, “Reset — directions first.”",
          score: 10,
          feedback: "Good repair; minimal attention, clear expectations.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look and continue.",
          score: 0,
          feedback: "Neutral but may reinforce behavior subtly.",
          next: "step3B"
        },
        C: {
          text: "Address the whole class about respecting instruction time.",
          score: -10,
          feedback: "Big attention moment for LF.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF opens her math book and begins writing her name quietly.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Great independent re-engagement.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF picks up her pencil but watches a peer out of the corner of her eye.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial compliance with lingering attention motivation.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF loudly whispers, “I bet I finish before all of you!”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalating attention-seeking.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you reinforce the start of math?",
      choices: {
        A: {
          text: "When she completes problem #1, quietly give a point and praise her focus.",
          score: 10,
          feedback: "Strong reinforcement for quiet work.",
          ending: "success"
        },
        B: {
          text: "Let her continue working without specific praise.",
          score: 0,
          feedback: "Neutral; doesn’t reinforce replacement behavior clearly.",
          ending: "mixed"
        },
        C: {
          text: "Ignore her completion because of earlier behaviors.",
          score: -10,
          feedback: "Unpredictable reinforcement decreases future compliance.",
          ending: "fail"
        }
      }
    }

  },

  endings: {
    success: {
      title: "Success – Quiet Start Reinforced",
      text: "LF completed the first problem and earned attention through positive behavior rather than shout-outs."
    },
    mixed: {
      title: "Mixed – Routine Partially Used",
      text: "LF’s behavior stabilized, but reinforcement was unclear."
    },
    fail: {
      title: "Fail – Attention Cycle Continues",
      text: "LF did not receive structured reinforcement, encouraging future shout-outs."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 7 — Morning Entry (High Social Energy)
 **************************************************/
POOL.daily.push({
  id: "daily_7_morning_entry",
  title: "Daily Mission: Morning Entry",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "LF enters the room excited, talking rapidly to peers about something that happened at recess. The class is supposed to start with a quiet morning routine (red card). LF’s voice is getting louder as she gathers an audience.",
      choices: {
        A: {
          text: "Greet her quietly and pre-correct: “Red card — start-up jobs first.”",
          score: 10,
          feedback: "Great proactive framing and attention-neutral greeting.",
          next: "step2A"
        },
        B: {
          text: "Say, “Inside voices please.”",
          score: 0,
          feedback: "Neutral correction but still adds attention.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop yelling across the room!”",
          score: -10,
          feedback: "Public reprimand = peer attention boost.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF pauses mid-sentence and glances at the red card posted.",
      choices: {
        A: {
          text: "Prompt: “What do you earn once jobs are done?”",
          score: 10,
          feedback: "Connects expectations with reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Walk away to give her space.",
          score: 0,
          feedback: "Neutral; may work but doesn’t strengthen routine.",
          next: "step3B"
        },
        C: {
          text: "Tell her she’s starting the day off wrong.",
          score: -10,
          feedback: "Negative attention fuels the function.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF dramatically lowers her voice but keeps talking to peers.",
      choices: {
        A: {
          text: "Point to the red card silently.",
          score: 10,
          feedback: "Clear, attention-neutral cue.",
          next: "step3A"
        },
        B: {
          text: "Say, “Please get started on your routine.”",
          score: 0,
          feedback: "Neutral redirection but gives attention.",
          next: "step3B"
        },
        C: {
          text: "Assign her a seating change immediately.",
          score: -10,
          feedback: "Punitive and increases attention-seeking at start of day.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers giggle. LF grins widely and continues narrating her recess story.",
      choices: {
        A: {
          text: "Quietly say, “Reset — jobs first, story later.”",
          score: 10,
          feedback: "Good repair; minimal attention and clear expectations.",
          next: "step3A"
        },
        B: {
          text: "Give a ‘stop’ gesture from across the room.",
          score: 0,
          feedback: "Neutral cue but still some attention.",
          next: "step3B"
        },
        C: {
          text: "Address the class about appropriate volume levels.",
          score: -10,
          feedback: "Turns LF’s behavior into a classwide spotlight.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF gets out her notebook and begins the start-up job.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Excellent engagement with routine.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF begins slowly but keeps looking at peers.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Some compliance, but routine needs reinforcement.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF walks toward a peer to keep talking.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation — attention-seeking persists.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you reinforce morning routines?",
      choices: {
        A: {
          text: "Quietly praise her for starting jobs and award a point.",
          score: 10,
          feedback: "Reinforces expectation and routine clearly.",
          ending: "success"
        },
        B: {
          text: "Let her finish without specific acknowledgment.",
          score: 0,
          feedback: "Neutral — reduces future motivation.",
          ending: "mixed"
        },
        C: {
          text: "Bring up her earlier behavior in front of peers.",
          score: -10,
          feedback: "Public attention reinforces calling-out behavior.",
          ending: "fail"
        }
      }
    }

  },

  endings: {
    success: {
      title: "Success – Strong Start to the Day",
      text: "LF entered successfully into the red-card routine with positive structure."
    },
    mixed: {
      title: "Mixed – Routine Partially Reinforced",
      text: "LF complied but without clear reinforcement for the routine."
    },
    fail: {
      title: "Fail – Attention Cycle Begins Early",
      text: "Public correction increased attention and set an inconsistent tone."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 8 — Group Discussion (Hand-Raise Routine)
 **************************************************/
POOL.daily.push({
  id: "daily_8_group_discussion",
  title: "Daily Mission: Group Discussion",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During a whole-class discussion, you ask an open-ended question. Several students raise their hands. LF blurts out loudly, “OH I KNOW THIS ONE!” while bouncing in her seat.",
      choices: {
        A: {
          text: "Use planned ignoring, then prompt quietly: “Try again — hand up first.”",
          score: 10,
          feedback: "Great: no attention delivered, clear reminder of replacement behavior.",
          next: "step2A"
        },
        B: {
          text: "Say, “Please wait your turn.”",
          score: 0,
          feedback: "Neutral. Still gives LF teacher attention.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “LF, stop interrupting the discussion!”",
          score: -10,
          feedback: "Public correction = strong peer attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF pauses and slowly raises her hand while watching you expectantly.",
      choices: {
        A: {
          text: "Pre-correct: “Thanks — keep your hand up, I’ll call on you soon.”",
          score: 10,
          feedback: "Great reinforcement of the replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Move on to another student without acknowledgment.",
          score: 0,
          feedback: "Neutral. Hand-raise is not reinforced.",
          next: "step3B"
        },
        C: {
          text: "Tell her the class will not continue until she stops shouting out.",
          score: -10,
          feedback: "Creates a power struggle and public attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF sighs loudly and whispers, “Ugh, I knew it first.”",
      choices: {
        A: {
          text: "Point silently to her raised-hand peers as a cue.",
          score: 10,
          feedback: "Nonverbal cue avoids added attention.",
          next: "step3A"
        },
        B: {
          text: "Give her a brief “shh” gesture.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Tell her she’s being rude in front of the class.",
          score: -10,
          feedback: "Public reprimand reinforces peer-attention behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers giggle. LF dramatically pretends to 'zip her mouth' while still making noises.",
      choices: {
        A: {
          text: "Quiet redirect: “Reset — hand up if you want to share.”",
          score: 10,
          feedback: "Good repair with minimal attention.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look.",
          score: 0,
          feedback: "Neutral but may reinforce LF through attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture the whole class about discussion behavior.",
          score: -10,
          feedback: "Broad attention dramatically reinforces LF.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF holds her hand up quietly and waits.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Strong replacement behavior.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF raises her hand but keeps looking around for peer reactions.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Acceptable but not reinforced yet.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF loudly whispers, “I BET you pick me next!”",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Attention behavior resurfaces.", next: "step4" }
      }
    },

    // ---------- STEP 4 ----------
    step4: {
      text: "How do you wrap up support?",
      choices: {
        A: {
          text: "Call on her soon and praise: “Thanks for raising your hand.”",
          score: 10,
          feedback: "Perfect reinforcement for replacement behavior.",
          ending: "success"
        },
        B: {
          text: "Call on her without praise.",
          score: 0,
          feedback: "Neutral; missed reinforcement opportunity.",
          ending: "mixed"
        },
        C: {
          text: "Skip her turn entirely because of earlier behaviors.",
          score: -10,
          feedback: "Unpredictable reinforcement weakens her hand-raising.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Discussion Skills Strengthened",
      text: "LF used hand-raising appropriately and earned teacher attention through the correct behavior."
    },
    mixed: {
      title: "Mixed – Partial Reinforcement",
      text: "Hand-raising occurred, but without explicit praise it may not maintain."
    },
    fail: {
      title: "Fail – Reinforcement Breakdown",
      text: "Hand-raising was not reinforced, increasing the chance of future call-outs."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 9 — Reading Groups (Quiet Signal for Help)
 **************************************************/
POOL.daily.push({
  id: "daily_9_reading_groups",
  title: "Daily Mission: Reading Groups",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During small reading groups, LF works independently at her desk. She begins calling across the room, “Do I highlight the WHOLE paragraph?!” seeking peer reactions.",
      choices: {
        A: {
          text: "Use neutral ignoring, then prompt quietly: “Use your quiet signal for help.”",
          score: 10,
          feedback: "Excellent — teaches the replacement behavior clearly.",
          next: "step2A"
        },
        B: {
          text: "Say softly, “Just try your best for now.”",
          score: 0,
          feedback: "Neutral but adds attention and doesn’t reinforce the quiet signal.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop shouting across the room!”",
          score: -10,
          feedback: "Public reprimand reinforces peer-attention seeking.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF stops shouting and hesitantly puts up the quiet help signal.",
      choices: {
        A: {
          text: "Acknowledge quietly: “Thanks for the signal — I’ll be there in a moment.”",
          score: 10,
          feedback: "Reinforces the exact replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Give her a thumbs up but keep helping another student.",
          score: 0,
          feedback: "Neutral — not a strong reinforcer.",
          next: "step3B"
        },
        C: {
          text: "Tell her she should know this by now.",
          score: -10,
          feedback: "Critical attention undermines skill use.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF sighs dramatically and says, “Someone help me!”",
      choices: {
        A: {
          text: "Point silently to the quiet-signal visual.",
          score: 10,
          feedback: "Cues the replacement behavior without attention.",
          next: "step3A"
        },
        B: {
          text: "Tell her, “I'll come in a minute.”",
          score: 0,
          feedback: "Neutral; still verbal attention.",
          next: "step3B"
        },
        C: {
          text: "Tell peers not to respond to LF's questions.",
          score: -10,
          feedback: "Public attention inadvertently rewards the behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers look over. LF smiles smugly.",
      choices: {
        A: {
          text: "Quiet redirect: “Reset — quiet signal for help.”",
          score: 10,
          feedback: "Good repair with low attention.",
          next: "step3A"
        },
        B: {
          text: "Give her a sharp look.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Address the class about expectations.",
          score: -10,
          feedback: "Large attention burst for LF.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF keeps the quiet signal raised appropriately.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Strong replacement behavior.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF raises the quiet signal briefly but then waves it dramatically.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Some compliance with attention-seeking mixed in.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF calls out again: “HELLO? I need help!”",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Escalating behavior, attention-driven.", next: "step4" }
      }
    },

    // ---------- STEP 4 ----------
    step4: {
      text: "How do you finalize support?",
      choices: {
        A: {
          text: "Respond to the quiet signal first and give quick, positive help.",
          score: 10,
          feedback: "Solid reinforcement of replacement skill.",
          ending: "success"
        },
        B: {
          text: "Help her eventually but without specific praise.",
          score: 0,
          feedback: "Neutral; reduces future consistency.",
          ending: "mixed"
        },
        C: {
          text: "Ignore her quiet signal due to earlier behaviors.",
          score: -10,
          feedback: "Inconsistent reinforcement weakens the skill completely.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Quiet Signal Strengthened",
      text: "LF learned that using the quiet signal results in fast, positive help."
    },
    mixed: {
      title: "Mixed – Inconsistent Reinforcement",
      text: "LF used the signal but didn't receive strong reinforcement."
    },
    fail: {
      title: "Fail – Signal Undermined",
      text: "Quiet help-seeking was not reinforced, increasing future calling-out."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 10 — End-of-Day Cleanup (Delay + Peer Attention)
 **************************************************/
POOL.daily.push({
  id: "daily_10_cleanup_energy",
  title: "Daily Mission: End-of-Day Cleanup",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During end-of-day cleanup, LF has high social energy. Instead of packing up, she spins around and jokingly taps a peer’s backpack, saying, “Bet you can’t catch me!” Peers laugh.",
      choices: {
        A: {
          text: "Quietly redirect: “Red card — pack up first, then talk.”",
          score: 10,
          feedback: "Excellent: clear expectations, minimal attention.",
          next: "step2A"
        },
        B: {
          text: "Say, “Please just get your things ready.”",
          score: 0,
          feedback: "Neutral but adds attention.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Knock it off and pack up!”",
          score: -10,
          feedback: "Public reprimand gives LF more peer attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF glances at the red card and slows down.",
      choices: {
        A: {
          text: "Prompt: “What do you earn once you’re packed?”",
          score: 10,
          feedback: "Ties compliance to reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Walk away to let her follow through.",
          score: 0,
          feedback: "Neutral; doesn’t actively reinforce routine.",
          next: "step3B"
        },
        C: {
          text: "Warn her that she’s losing end-of-day points.",
          score: -10,
          feedback: "Threat-based attention fuels peer-seeking.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF picks up a folder but immediately looks for peer reactions.",
      choices: {
        A: {
          text: "Nonverbal cue: point to the red card.",
          score: 10,
          feedback: "Clear, attention-neutral routine cue.",
          next: "step3A"
        },
        B: {
          text: "Tell her again to pack up.",
          score: 0,
          feedback: "Neutral but repeated verbal attention.",
          next: "step3B"
        },
        C: {
          text: "Tell peers to stop encouraging LF.",
          score: -10,
          feedback: "Big peer attention moment.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "LF laughs loudly and taps another student’s shoulder.",
      choices: {
        A: {
          text: "Quiet redirect: “Reset — pack-up routine first.”",
          score: 10,
          feedback: "Good repair with minimal attention.",
          next: "step3A"
        },
        B: {
          text: "Give her a firm look.",
          score: 0,
          feedback: "Neutral but gives attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture her in front of peers about appropriate behavior.",
          score: -10,
          feedback: "Provides high levels of attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF starts packing up quietly.",
      choices: {
        A: { text: "Continue.", score: 10, feedback: "Excellent independent compliance.", next: "step4" }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF packs slowly, occasionally glancing at peers.",
      choices: {
        A: { text: "Continue.", score: 0, feedback: "Partial compliance.", next: "step4" }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF tosses a pencil to a peer and giggles.",
      choices: {
        A: { text: "Continue.", score: -10, feedback: "Escalating peer-attention behavior.", next: "step4" }
      }
    },

    // ---------- STEP 4 ----------
    step4: {
      text: "How do you finish the routine?",
      choices: {
        A: {
          text: "Quietly praise her for packing up and award a point.",
          score: 10,
          feedback: "Strong reinforcement of routine.",
          ending: "success"
        },
        B: {
          text: "Simply tell her to line up.",
          score: 0,
          feedback: "Neutral; no reinforcement.",
          ending: "mixed"
        },
        C: {
          text: "Bring up earlier misbehavior before dismissal.",
          score: -10,
          feedback: "Public attention undermines routine.",
          ending: "fail"
        }
      }
    }

  },

  endings: {
    success: {
      title: "Success – Calm End-of-Day Routine",
      text: "LF followed the pack-up routine with clear reinforcement."
    },
    mixed: {
      title: "Mixed – Some Compliance",
      text: "LF packed up but didn’t get strong reinforcement."
    },
    fail: {
      title: "Fail – Attention Reignited",
      text: "Public correction boosted peer attention and undermined the expectation."
    }
  }
});
/*************************************************
 * CRISIS SCENARIO 1 — Argument About the Card
 **************************************************/
POOL.crisis.push({
  id: "crisis_1_card_argument",
  title: "Crisis Drill: Arguing About the Card",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During independent work, LF notices the red card and immediately protests: “Ugh, why is it red AGAIN? It’s always red! This is unfair!” Peers look over.",
      choices: {
        A: {
          text: "Use calm, brief directive: “Start your first part. Green after the chunk.”",
          score: 10,
          feedback: "Great fidelity — non-argumentative, minimal attention.",
          next: "step2A"
        },
        B: {
          text: "Explain why the card is red and walk her through the schedule.",
          score: 0,
          feedback: "Well-intentioned, but extended talking fuels attention.",
          next: "step2B"
        },
        C: {
          text: "Say firmly, “Stop complaining. Sit down and work.”",
          score: -10,
          feedback: "Public reprimand increases peer attention and escalation.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF rolls her eyes but stops talking. She stares at the red card with crossed arms.",
      choices: {
        A: {
          text: "Offer a simple choice: “Start with #1 or #2.”",
          score: 10,
          feedback: "Excellent — reduces resistance and supports re-engagement.",
          next: "step3A"
        },
        B: {
          text: "Give her space and return to other students.",
          score: 0,
          feedback: "Neutral; could help but may leave her stuck.",
          next: "step3B"
        },
        C: {
          text: "Tell her she’s being disrespectful.",
          score: -10,
          feedback: "Adds attention and accelerates escalation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "As you try explaining, LF starts debating: “Then just make it green! I’ll work faster if it’s green!”",
      choices: {
        A: {
          text: "Cut debate: “Break space is open if you need it.” (pointing calmly).",
          score: 10,
          feedback: "Excellent redirection to the plan without engaging the argument.",
          next: "step3A"
        },
        B: {
          text: "Continue explaining why she can’t have green yet.",
          score: 0,
          feedback: "Unintentionally reinforces the debate with attention.",
          next: "step3B"
        },
        C: {
          text: "Say, “You’re being manipulative, go sit down.”",
          score: -10,
          feedback: "Criticism increases emotional intensity.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "LF raises her voice: “This is STUPID!” Peers stare.",
      choices: {
        A: {
          text: "Use calm reset prompt: “You can take a reset. You rejoin when ready.”",
          score: 10,
          feedback: "Right step — minimizes attention and follows plan.",
          next: "step3A"
        },
        B: {
          text: "Say, “Lower your voice right now.”",
          score: 0,
          feedback: "Neutral; may or may not de-escalate.",
          next: "step3B"
        },
        C: {
          text: "Scold her loudly for being disrespectful.",
          score: -10,
          feedback: "Creates the exact attention spike the behavior seeks.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF takes a breath, grabs her pencil, and looks at her work.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She is de-escalating and returning to task.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF slumps but stays mostly quiet.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Neutral stabilization.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF mutters loudly: “I hate this class.”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation continues — attention cycle activated.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you finalize the support?",
      choices: {
        A: {
          text: "Once she starts working, quietly praise the restart and award a point.",
          score: 10,
          feedback: "Excellent — reinforces de-escalation.",
          ending: "success"
        },
        B: {
          text: "Let her work without specific acknowledgement.",
          score: 0,
          feedback: "Neutral — stabilization but no reinforcement.",
          ending: "mixed"
        },
        C: {
          text: "Re-address her earlier argument with a lecture.",
          score: -10,
          feedback: "Re-escalates and reinforces attention-seeking.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Calm Directive Worked",
      text: "LF de-escalated with minimal attention and re-engaged in work."
    },
    mixed: {
      title: "Mixed – Stabilized but Unreinforced",
      text: "LF calmed but didn’t receive reinforcement for recovery."
    },
    fail: {
      title: "Fail – Escalation Maintained",
      text: "The argument cycle stayed active due to high attention and inconsistent reinforcement."
    }
  }
});
/*************************************************
 * CRISIS SCENARIO 2 — Work Refusal + Peers Watching
 **************************************************/
POOL.crisis.push({
  id: "crisis_2_work_refusal",
  title: "Crisis Drill: Work Refusal with Peer Attention",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "You assign a short reading task. LF pushes her paper away and loudly says, “NOPE. Not doing ANY of this.” Several peers look up.",
      choices: {
        A: {
          text: "Use calm directive: “Start with the first sentence. I’ll check in after that.”",
          score: 10,
          feedback: "Excellent — short directive, avoids argument.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “Just try your best.”",
          score: 0,
          feedback: "Neutral but doesn’t activate the plan.",
          next: "step2B"
        },
        C: {
          text: "Say, “You’re being dramatic. Stop it.”",
          score: -10,
          feedback: "Public correction increases attention and escalation.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF glares but doesn’t argue. She taps her pencil loudly.",
      choices: {
        A: {
          text: "Offer a reset: “Reset space is open — rejoin when ready.”",
          score: 10,
          feedback: "Good — minimal verbal engagement and good containment.",
          next: "step3A"
        },
        B: {
          text: "Ignore the tapping and help another student.",
          score: 0,
          feedback: "Neutral; could stabilize or escalate.",
          next: "step3B"
        },
        C: {
          text: "Tell her she is disrupting the whole class.",
          score: -10,
          feedback: "Immediate peer attention, fueling the function.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF exaggerates a groan and says loudly, “This assignment is dumb.”",
      choices: {
        A: {
          text: "Gesture calmly toward reset: “Take a break if you need it.”",
          score: 10,
          feedback: "Great — reduces verbal attention and prevents argument.",
          next: "step3A"
        },
        B: {
          text: "Say, “It’s not dumb, it’s important.”",
          score: 0,
          feedback: "Neutral but engages the debate.",
          next: "step3B"
        },
        C: {
          text: "Tell her you’re disappointed in her attitude.",
          score: -10,
          feedback: "Adds emotional attention she may find reinforcing.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "LF dramatically sighs, “Can YOU just do the work for me?” while looking at peers.",
      choices: {
        A: {
          text: "Use minimal attention: “Reset is open.”",
          score: 10,
          feedback: "Excellent non-engagement.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Say, “This behavior is unacceptable.”",
          score: -10,
          feedback: "Public attention increases escalation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF gets up, takes 1–2 deep breaths, and returns to her desk.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She is de-escalating independently.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF slumps but remains relatively quiet.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Neutral stabilization.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF loudly says, “Whatever, I hate reading anyway.”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Attention cycle active.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 ----------
    step4: {
      text: "How do you finalize support once she re-engages?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for getting started,” and award a point.",
          score: 10,
          feedback: "Reinforces recovery and task initiation.",
          ending: "success"
        },
        B: {
          text: "Let her begin working without comment.",
          score: 0,
          feedback: "Neutral; stabilization but no reinforcement.",
          ending: "mixed"
        },
        C: {
          text: "Re-address the refusal with a lecture.",
          score: -10,
          feedback: "Adds attention and risks re-escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Reset Used Effectively",
      text: "LF recovered calmly and re-engaged with minimal attention."
    },
    mixed: {
      title: "Mixed – Stabilized Without Reinforcement",
      text: "LF calmed down but didn’t get reinforcement for re-engaging."
    },
    fail: {
      title: "Fail – Escalation Maintained",
      text: "Attention and lecturing reinforced refusal behaviors."
    }
  }
});
/*************************************************
 * CRISIS SCENARIO 3 — Escalation During Partner Work
 **************************************************/
POOL.crisis.push({
  id: "crisis_3_partner_escalation",
  title: "Crisis Drill: Partner Work Escalation",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During a partner activity, LF loudly says, “Why do I ALWAYS get the boring partner?!” A few nearby students laugh, and LF smirks.",
      choices: {
        A: {
          text: "Use minimal verbal attention: “Reset is open.” and step away.",
          score: 10,
          feedback: "Excellent fidelity — you avoid feeding peer-attention behavior.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “Please use kind words.”",
          score: 0,
          feedback: "Neutral but still gives attention during attention-maintained behavior.",
          next: "step2B"
        },  
        C: {
          text: "Reprimand: “We do NOT talk to peers like that.”",
          score: -10,
          feedback: "Public scolding = huge attention delivery.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF huffs dramatically but moves a few feet toward the reset space.",
      choices: {
        A: {
          text: "Calm directive: “Rejoin when ready.”",
          score: 10,
          feedback: "Clear, non-engaging support for self-regulation.",
          next: "step3A"
        },
        B: {
          text: "Give space and walk to another group.",
          score: 0,
          feedback: "Neutral — may or may not support re-entry.",
          next: "step3B"
        },
        C: {
          text: "Ask, “Why did you say that to your partner?”",
          score: -10,
          feedback: "Invites debate, increases attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF shrugs dramatically and says, “Whatever, this whole thing is dumb.”",
      choices: {
        A: {
          text: "Gesture silently toward reset.",
          score: 10,
          feedback: "Nice repair — minimal verbal attention.",
          next: "step3A"
        },
        B: {
          text: "Tell her the assignment is important.",
          score: 0,
          feedback: "Neutral but adds verbal engagement.",
          next: "step3B"
        },
        C: {
          text: "Warn her she’ll lose points if she keeps it up.",
          score: -10,
          feedback: "Adds drama + attention = escalation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers snicker; LF smiles wider and tosses her hair with a flourish.",
      choices: {
        A: {
          text: "Move toward the class and reduce audience attention while signaling reset.",
          score: 10,
          feedback: "Excellent — removes peer reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Give an annoyed look.",
          score: 0,
          feedback: "Still attention, but low-level.",
          next: "step3B"
        },
        C: {
          text: "Lecture the class about kindness.",
          score: -10,
          feedback: "Mass attention = jackpot for LF.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF sits on the reset chair, breathing loudly but staying put.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She is de-escalating independently.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF slowly drags her feet near the reset area but glares at peers.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial stabilization.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF mutters loudly about her partner and slams a marker cap.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation still active.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you support re-entry?",
      choices: {
        A: {
          text: "Quietly praise the reset and reintegrate her with a neutral partner role.",
          score: 10,
          feedback: "Excellent — reinforces de-escalation, not drama.",
          ending: "success"
        },
        B: {
          text: "Let her rejoin on her own without positive feedback.",
          score: 0,
          feedback: "Neutral but doesn’t strengthen recovery.",
          ending: "mixed"
        },
        C: {
          text: "Publicly correct her behavior before letting her rejoin.",
          score: -10,
          feedback: "Reinforces the attention-seeking pattern.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Partner Issue Resolved",
      text: "LF used the reset space and rejoined without attention-seeking."
    },
    mixed: {
      title: "Mixed – Stabilized but Not Reinforced",
      text: "LF rejoined, but future cycles may repeat without reinforcement."
    },
    fail: {
      title: "Fail – Peer Attention Drove Escalation",
      text: "Public correction maintained the attention function."
    }
  }
});
/*************************************************
 * CRISIS SCENARIO 4 — Emotional Overload (Shutdown/Crying)
 **************************************************/
POOL.crisis.push({
  id: "crisis_4_emotional_overload",
  title: "Crisis Drill: Emotional Overload",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "After a difficult transition, LF suddenly puts her head down and begins crying softly. Peers look over with concern.",
      choices: {
        A: {
          text: "Quietly offer: “Reset is open — take space if you need it.”",
          score: 10,
          feedback: "Low-attention support that respects her emotional state.",
          next: "step2A"
        },
        B: {
          text: "Ask, “What’s wrong? Talk to me.”",
          score: 0,
          feedback: "Well-meaning but increases sustained 1:1 attention.",
          next: "step2B"
        },
        C: {
          text: "Tell her to sit up and stop crying.",
          score: -10,
          feedback: "Invalidation increases distress and escalation.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF stands slowly and walks to the reset space, wiping her eyes.",
      choices: {
        A: {
          text: "Give quiet space and supervise indirectly.",
          score: 10,
          feedback: "Excellent — calm, low-attention containment.",
          next: "step3A"
        },
        B: {
          text: "Ask if she wants to talk about it right now.",
          score: 0,
          feedback: "Neutral but increases verbal load.",
          next: "step3B"
        },
        C: {
          text: "Tell her she needs to get it together quickly.",
          score: -10,
          feedback: "Harsh phrasing intensifies emotional overload.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF cries harder as you ask questions, now hiding her face.",
      choices: {
        A: {
          text: "Switch to calm directive: “Reset is open.”",
          score: 10,
          feedback: "Great repair — reduces interaction load.",
          next: "step3A"
        },
        B: {
          text: "Ask more gently, “Do you want to tell me why you're upset?”",
          score: 0,
          feedback: "Still increases attention during overload.",
          next: "step3B"
        },
        C: {
          text: "Say, “Crying won’t fix anything.”",
          score: -10,
          feedback: "Escalates shame and distress.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "LF stiffens and wipes her face angrily.",
      choices: {
        A: {
          text: "Say calmly, “Reset is open — you can rejoin when ready.”",
          score: 10,
          feedback: "Excellent soft redirection.",
          next: "step3A"
        },
        B: {
          text: "Ignore the crying and continue the lesson.",
          score: 0,
          feedback: "Neutral; may or may not help her regulate.",
          next: "step3B"
        },
        C: {
          text: "Tell her she is disrupting the class.",
          score: -10,
          feedback: "Adds attention + guilt, increasing overload.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "In the reset space, LF breathes deeply and begins slowing her crying.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "De-escalation is occurring independently.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF remains hunched and tearful but quiet.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stabilized but not progressing.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF mutters angrily through tears: “Nobody cares anyway.”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation still active.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you support her return?",
      choices: {
        A: {
          text: "Quietly say, “Nice reset. Ready to rejoin?” and award a point for re-entry.",
          score: 10,
          feedback: "Excellent reinforcement of recovery.",
          ending: "success"
        },
        B: {
          text: "Let her come back without positive acknowledgment.",
          score: 0,
          feedback: "Neutral but doesn’t reinforce emotional regulation.",
          ending: "mixed"
        },
        C: {
          text: "Discuss the crying episode in front of classmates.",
          score: -10,
          feedback: "Shame + attention = future escalation more likely.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Calm Recovery",
      text: "LF emotionally regulated and rejoined the class with supported autonomy."
    },
    mixed: {
      title: "Mixed – Stabilized with Minimal Reinforcement",
      text: "LF recovered but didn’t receive reinforcement for self-regulation."
    },
    fail: {
      title: "Fail – Emotional Escalation Cycle",
      text: "Public discussion or invalidation intensified the emotional overload."
    }
  }
});
/*************************************************
 * CRISIS SCENARIO 5 — Refusal to Transition + Peer Attention
 **************************************************/
POOL.crisis.push({
  id: "crisis_5_transition_refusal",
  title: "Crisis Drill: Transition Refusal",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "It’s time to transition from reading to science. LF stays seated and loudly says, “Nope. Not moving. This class is boring!” Peers stare.",
      choices: {
        A: {
          text: "Use calm directive: “Stand up and join us — green after first part.”",
          score: 10,
          feedback: "Clear, structured, low-attention cue.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “It’s time to move.”",
          score: 0,
          feedback: "Neutral; may not address attention-seeking.",
          next: "step2B"
        },
        C: {
          text: "Say sharply, “Stop being dramatic and get up.”",
          score: -10,
          feedback: "Public reprimand = high attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF sighs and knocks her pencil to the floor but stays seated.",
      choices: {
        A: {
          text: "Point silently toward the reset space.",
          score: 10,
          feedback: "Excellent — minimal verbal input.",
          next: "step3A"
        },
        B: {
          text: "Give her 10 seconds and repeat the directive.",
          score: 0,
          feedback: "Neutral but risks attention delivery.",
          next: "step3B"
        },
        C: {
          text: "Tell her the whole class is waiting on her.",
          score: -10,
          feedback: "Peer-based pressure fuels escalation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF crosses her arms and says loudly, “Make me.”",
      choices: {
        A: {
          text: "Gesture toward reset: “Rejoin when ready.”",
          score: 10,
          feedback: "Great — avoids argument.",
          next: "step3A"
        },
        B: {
          text: "Say, “I’m not going to argue with you.”",
          score: 0,
          feedback: "Neutral but still extends interaction.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice and say, “Do NOT talk to me like that.”",
          score: -10,
          feedback: "Large verbal attention + emotion = escalation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers giggle; LF grins and leans back in her chair.",
      choices: {
        A: {
          text: "Shift class attention away, then gesture reset.",
          score: 10,
          feedback: "Strong repair — removes audience reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Give her a stern look.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture the class about transitions.",
          score: -10,
          feedback: "Mass attention reinforces behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF steps into the reset area and breathes heavily but stays put.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She is de-escalating independently.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF remains seated but quiets down, arms still crossed.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial stabilization.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF kicks her chair lightly and mutters.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation continues.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you reintegrate her?",
      choices: {
        A: {
          text: "Quietly praise the restart and give a point for joining science calmly.",
          score: 10,
          feedback: "Reinforces recovery and transition.",
          ending: "success"
        },
        B: {
          text: "Let her join without reinforcement.",
          score: 0,
          feedback: "Neutral; doesn’t strengthen transition success.",
          ending: "mixed"
        },
        C: {
          text: "Bring up her refusal publicly as she rejoins.",
          score: -10,
          feedback: "Re-escalation risk + attention reinforcement.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Transition Restored",
      text: "LF transitioned with minimal attention and earned reinforcement for recovery."
    },
    mixed: {
      title: "Mixed – Transition Occurred Without Reinforcement",
      text: "LF joined the class, but future refusals may persist."
    },
    fail: {
      title: "Fail – Attention Maintained Refusal",
      text: "Public correction strengthened attention-seeking cycles."
    }
  }
});
/*************************************************
 * WILDCARD SCENARIO 1 — Surprise Schedule Change (Assembly)
 **************************************************/
POOL.wild.push({
  id: "wild_1_surprise_assembly",
  title: "Wildcard Mission: Surprise Assembly",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "An unexpected announcement comes over the intercom: all classes must head to an assembly immediately. LF freezes, eyes widening, then says loudly, “Wait—WHAT? We didn’t plan this!” Peers murmur.",
      choices: {
        A: {
          text: "Use calm directive: “We’re going together — I’ll show the steps.”",
          score: 10,
          feedback: "Great — clear, low-attention direction reduces anxiety.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “It’s okay, let’s line up.”",
          score: 0,
          feedback: "Neutral but doesn’t address the uncertainty driving escalation.",
          next: "step2B"
        },
        C: {
          text: "Say firmly, “Stop overreacting and just line up.”",
          score: -10,
          feedback: "Adds attention and increases emotional intensity.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF breathes quickly and stands but looks overwhelmed.",
      choices: {
        A: {
          text: "Pre-correct quietly: “Stay close to me.”",
          score: 10,
          feedback: "Excellent — support without added attention.",
          next: "step3A"
        },
        B: {
          text: "Let her walk to the line on her own.",
          score: 0,
          feedback: "Neutral; she may feel unanchored.",
          next: "step3B"
        },
        C: {
          text: "Tell her she should be used to changes by now.",
          score: -10,
          feedback: "Dismissive, increases stress.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF mutters, “Ugh, this is going to be boring,” and drags her feet.",
      choices: {
        A: {
          text: "Quietly point to the green card visual in your hand.",
          score: 10,
          feedback: "Nice repair — gives a concrete signal of expectations.",
          next: "step3A"
        },
        B: {
          text: "Say, “We don’t talk like that.”",
          score: 0,
          feedback: "Neutral correction but adds attention.",
          next: "step3B"
        },
        C: {
          text: "Scold her for her attitude.",
          score: -10,
          feedback: "High public attention, increases escalation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers glance at LF. She tosses her hair and says dramatically, “This is SO dumb.”",
      choices: {
        A: {
          text: "Redirect attention away (address the line) and gesture for her to join.",
          score: 10,
          feedback: "Good — removes peer audience.",
          next: "step3A"
        },
        B: {
          text: "Give her a stern look.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture the class about manners.",
          score: -10,
          feedback: "Public stage = reinforcement jackpot.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF lines up close to you, breathing slower.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She’s stabilizing.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF lines up but continues small grumbles.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Neutral stabilization.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF says loudly, “Everyone is walking too slow!”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation still running on peer attention.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you support her during the assembly?",
      choices: {
        A: {
          text: "Quietly praise her for staying close and award a point.",
          score: 10,
          feedback: "Excellent reinforcement for regulation.",
          ending: "success"
        },
        B: {
          text: "Let her sit with the class without specific reinforcement.",
          score: 0,
          feedback: "Neutral; helps but doesn’t strengthen coping.",
          ending: "mixed"
        },
        C: {
          text: "Talk to her publicly about her earlier comments.",
          score: -10,
          feedback: "Adds embarrassment + attention = future escalation likely.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Schedule Change Managed",
      text: "LF handled the unexpected assembly with support and low attention, staying regulated."
    },
    mixed: {
      title: "Mixed – Managed but Not Reinforced",
      text: "LF managed the change but without reinforcement for coping."
    },
    fail: {
      title: "Fail – Attention Fueled Escalation",
      text: "Public correction during a surprise change increased attention cycles."
    }
  }
});
/*************************************************
 * WILDCARD SCENARIO 2 — Fire Drill (Noise Overwhelm)
 **************************************************/
POOL.wild.push({
  id: "wild_2_fire_drill_noise",
  title: "Wildcard Mission: Fire Drill Overwhelm",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "The fire alarm blares suddenly during writing time. LF startles, covers her ears, and says loudly, “TOO LOUD! TOO LOUD!” Peers stare.",
      choices: {
        A: {
          text: "Use calm directive: “Stand with me — we’re going together.”",
          score: 10,
          feedback: "Excellent — anchors her without adding attention.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “It’s just a drill, let’s go.”",
          score: 0,
          feedback: "Neutral but doesn’t support sensory overload.",
          next: "step2B"
        },
        C: {
          text: "Tell her to stop yelling and move now.",
          score: -10,
          feedback: "Adds verbal intensity to an already overwhelming moment.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF stands shakily and steps close to you, hands still over ears.",
      choices: {
        A: {
          text: "Keep her close with a calm gesture forward.",
          score: 10,
          feedback: "Excellent sensory-informed support.",
          next: "step3A"
        },
        B: {
          text: "Let her walk behind the class.",
          score: 0,
          feedback: "Neutral but may increase distress.",
          next: "step3B"
        },
        C: {
          text: "Say, “It’s not that loud, you’re fine.”",
          score: -10,
          feedback: "Dismissal increases emotional overload.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF flinches again as the alarm continues, saying, “Make it STOP.”",
      choices: {
        A: {
          text: "Move to her side and gesture forward: “Right here.”",
          score: 10,
          feedback: "Strong repair — minimal verbal load.",
          next: "step3A"
        },
        B: {
          text: "Repeat, “Come on, it’s just a drill.”",
          score: 0,
          feedback: "Neutral, but still verbal pressure.",
          next: "step3B"
        },
        C: {
          text: "Say, “If you don’t move now, you’ll get a consequence.”",
          score: -10,
          feedback: "Threats + loud noise = escalation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "LF stomps once and refuses to move, tears starting in her eyes.",
      choices: {
        A: {
          text: "Stand beside her and say quietly, “Right here with me.”",
          score: 10,
          feedback: "Low-attention, high-anchoring support.",
          next: "step3A"
        },
        B: {
          text: "Ignore her and move the class out.",
          score: 0,
          feedback: "Neutral but unsafe — she may freeze.",
          next: "step3B"
        },
        C: {
          text: "Say sharply, “Stop crying and MOVE!”",
          score: -10,
          feedback: "Overwhelming and invalidating.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF walks close beside you, still covering her ears but moving in a regulated way.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Great — she’s stabilizing.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF walks slowly and hesitantly, looking overwhelmed.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial stabilization.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF cries loudly as she walks, drawing peer attention.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation continues — attention + overwhelm.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "Outside, the alarm stops. How do you support LF?",
      choices: {
        A: {
          text: "Quietly praise her for staying close and award a point for safe walking.",
          score: 10,
          feedback: "Reinforces coping under stress.",
          ending: "success"
        },
        B: {
          text: "Let her recover without comment.",
          score: 0,
          feedback: "Neutral; doesn’t strengthen future coping.",
          ending: "mixed"
        },
        C: {
          text: "Discuss her crying in front of the class.",
          score: -10,
          feedback: "Public attention increases future escalation in drills.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Fire Drill Managed",
      text: "LF stayed safe and regulated with quiet anchoring support."
    },
    mixed: {
      title: "Mixed – Safe but Not Reinforced",
      text: "LF managed the drill but without reinforcement for coping."
    },
    fail: {
      title: "Fail – Overwhelm + Public Attention",
      text: "Public correction strengthened emotional overload patterns."
    }
  }
});
/*************************************************
 * WILDCARD SCENARIO 3 — Random Partner Switch
 **************************************************/
POOL.wild.push({
  id: "wild_3_partner_switch",
  title: "Wildcard Mission: Random Partner Switch",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "The counselor enters and asks the class to switch partners for a quick SEL activity. LF gasps and whispers loudly, “NO! I want MY partner — not THEM.” Peers look over.",
      choices: {
        A: {
          text: "Use calm directive: “Start with the new partner — green after check-in.”",
          score: 10,
          feedback: "Clear, low-attention direction with reinforcement path.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “It’ll be fine — just switch for today.”",
          score: 0,
          feedback: "Neutral but doesn’t address attention-seeking.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop complaining. You don’t always get your way.”",
          score: -10,
          feedback: "Adds attention and emotional charge.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF stomps once but sits by the new partner, arms crossed.",
      choices: {
        A: {
          text: "Pre-correct quietly: “First question only.”",
          score: 10,
          feedback: "Reduces demand + prevents escape bids.",
          next: "step3A"
        },
        B: {
          text: "Let her sit without comment.",
          score: 0,
          feedback: "Neutral stabilization.",
          next: "step3B"
        },
        C: {
          text: "Tell her she is being rude.",
          score: -10,
          feedback: "Public correction adds peer attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF scoots her chair loudly away from the new partner.",
      choices: {
        A: {
          text: "Point silently to reset.",
          score: 10,
          feedback: "Minimal attention; supports regulation.",
          next: "step3A"
        },
        B: {
          text: "Say, “Scoot back into place.”",
          score: 0,
          feedback: "Neutral correction.",
          next: "step3B"
        },
        C: {
          text: "Say, “You’re embarrassing yourself.”",
          score: -10,
          feedback: "High shame + attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "LF loudly whispers, “I’m NOT working with them,” glancing to peers.",
      choices: {
        A: {
          text: "Redirect class attention, then cue reset.",
          score: 10,
          feedback: "Strong peer-attention management.",
          next: "step3A"
        },
        B: {
          text: "Give a stern look.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture her about cooperation.",
          score: -10,
          feedback: "Long attention moment = reinforces behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF takes a breath, sits up, and looks toward the new partner.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Great de-escalation.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF sits stiffly, avoiding eye contact.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Neutral stabilization.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF mutters about how unfair the switch is.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation still active.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you support the activity’s success?",
      choices: {
        A: {
          text: "Quietly praise the first question completed and award a point.",
          score: 10,
          feedback: "Reinforces coping + participation.",
          ending: "success"
        },
        B: {
          text: "Let her participate without reinforcement.",
          score: 0,
          feedback: "Neutral; doesn’t strengthen acceptance of change.",
          ending: "mixed"
        },
        C: {
          text: "Bring up her earlier behavior in front of the group.",
          score: -10,
          feedback: "Public reflection reinforces the attention cycle.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Partner Switch Managed",
      text: "LF participated with minimal attention and earned reinforcement for flexibility."
    },
    mixed: {
      title: "Mixed – Tolerated Change",
      text: "LF participated, but flexibility wasn’t reinforced."
    },
    fail: {
      title: "Fail – Public Attention Fueled Escalation",
      text: "Attention-seeking behaviors escalated with peer involvement."
    }
  }
});
/*************************************************
 * WILDCARD SCENARIO 4 — Indoor Recess (High Energy)
 **************************************************/
POOL.wild.push({
  id: "wild_4_indoor_recess",
  title: "Wildcard Mission: Indoor Recess",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "Indoor recess starts due to rain. LF immediately runs toward peers yelling, “Let’s play CHASE!” A cluster of students turns to watch her.",
      choices: {
        A: {
          text: "Give calm directive: “Games stay seated — choose one spot.”",
          score: 10,
          feedback: "Excellent — clear boundary without attention burst.",
          next: "step2A"
        },
        B: {
          text: "Say neutrally, “No running.”",
          score: 0,
          feedback: "Neutral but gives verbal attention.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Stop it RIGHT NOW!”",
          score: -10,
          feedback: "Public reprimand = high peer attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF stops running but spins dramatically and flops onto a beanbag.",
      choices: {
        A: {
          text: "Pre-correct quietly: “Pick one game — stay with it.”",
          score: 10,
          feedback: "Gives structure + keeps attention low.",
          next: "step3A"
        },
        B: {
          text: "Let her flop and walk away.",
          score: 0,
          feedback: "Neutral stabilization.",
          next: "step3B"
        },
        C: {
          text: "Tell her to stop being dramatic.",
          score: -10,
          feedback: "Criticism during attention-seeking increases behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF laughs loudly, grabs a stuffed animal, and tosses it in the air.",
      choices: {
        A: {
          text: "Point silently to the 'calm play' rules visual.",
          score: 10,
          feedback: "Great nonverbal redirection — minimal attention.",
          next: "step3A"
        },
        B: {
          text: "Say, “Don’t throw toys.”",
          score: 0,
          feedback: "Neutral but gives attention.",
          next: "step3B"
        },
        C: {
          text: "Explain to her why throwing is unsafe.",
          score: -10,
          feedback: "Long verbal attention = reinforcement.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "Peers giggle. LF bows dramatically like a performer.",
      choices: {
        A: {
          text: "Redirect the class’s attention away, then cue her to pick a game.",
          score: 10,
          feedback: "Excellent — cuts off peer reinforcement.",
          next: "step3A"
        },
        B: {
          text: "Give a sharp look.",
          score: 0,
          feedback: "Neutral; still attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture the class on safe recess behavior.",
          score: -10,
          feedback: "Creates a stage for LF.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF chooses coloring materials and sits with them, still buzzing with energy.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Strong de-escalation and engagement.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF sits awkwardly with a toy but keeps glancing back at peers.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial stabilization.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF tosses the stuffed animal again, loudly laughing.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation through peer attention.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you reinforce indoor recess behavior?",
      choices: {
        A: {
          text: "Quietly praise her for choosing a calm game and award a point.",
          score: 10,
          feedback: "Reinforces regulation under tough conditions.",
          ending: "success"
        },
        B: {
          text: "Let her keep playing without acknowledgment.",
          score: 0,
          feedback: "Neutral; doesn’t strengthen calm play.",
          ending: "mixed"
        },
        C: {
          text: "Publicly call out her earlier misbehavior.",
          score: -10,
          feedback: "Reintroduces attention and risk of re-escalation.",
          ending: "fail"
        }
      }
    }

  },

  endings: {
    success: {
      title: "Success – Calm Indoor Recess",
      text: "LF regulated her energy with minimal attention and reinforcement for calm play."
    },
    mixed: {
      title: "Mixed – Stable but Not Reinforced",
      text: "LF participated appropriately but didn’t receive reinforcement."
    },
    fail: {
      title: "Fail – Attention Reinforced Escalation",
      text: "Public corrections increased peer attention and escalatory patterns."
    }
  }
});
/*************************************************
 * WILDCARD SCENARIO 5 — Substitute Teacher Day
 **************************************************/
POOL.wild.push({
  id: "wild_5_substitute_day",
  title: "Wildcard Mission: Substitute Teacher",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "You’re unexpectedly out, and a substitute is leading the class. LF immediately senses the lowered structure and loudly says, “We don’t HAVE to do the card thing today — she doesn’t know!” Peers look intrigued.",
      choices: {
        A: {
          text: "Step in briefly before leaving: “Routine stays the same — red to start.”",
          score: 10,
          feedback: "Excellent — preserves predictability and limits attention.",
          next: "step2A"
        },
        B: {
          text: "Tell the sub, “She needs reminders sometimes.”",
          score: 0,
          feedback: "Neutral but publicly points LF out.",
          next: "step2B"
        },
        C: {
          text: "Directly reprimand: “LF, stop trying to get out of the system.”",
          score: -10,
          feedback: "Public scolding adds peer attention.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "LF groans dramatically but quiets a little.",
      choices: {
        A: {
          text: "Prompt quietly to the sub: “Flip to green after first task.”",
          score: 10,
          feedback: "Keeps structure tight without highlighting LF.",
          next: "step3A"
        },
        B: {
          text: "Say nothing and let the sub take over.",
          score: 0,
          feedback: "Neutral; may work or may loosen structure.",
          next: "step3B"
        },
        C: {
          text: "Warn LF again about following rules.",
          score: -10,
          feedback: "Additional attention = reinforcement.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "LF smirks and says, “See? She’s talking about ME.”",
      choices: {
        A: {
          text: "Quietly redirect: point to the red card.",
          score: 10,
          feedback: "Minimal attention; clear routine cue.",
          next: "step3A"
        },
        B: {
          text: "Tell LF to be respectful.",
          score: 0,
          feedback: "Neutral correction but adds attention.",
          next: "step3B"
        },
        C: {
          text: "Tell the class to ignore LF’s comments.",
          score: -10,
          feedback: "Huge attention event.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "LF laughs loudly, riding the peer attention wave.",
      choices: {
        A: {
          text: "Shift class attention back to tasks, cue reset discreetly.",
          score: 10,
          feedback: "Excellent peer-attention management.",
          next: "step3A"
        },
        B: {
          text: "Give an annoyed stare.",
          score: 0,
          feedback: "Neutral but still attention.",
          next: "step3B"
        },
        C: {
          text: "Lecture about respecting substitutes.",
          score: -10,
          feedback: "Large audience = strong reinforcement.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "LF starts the first task quietly but rolls her eyes.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "She’s engaging within the system.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "LF starts the task but whispers jokes to a peer.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Partial compliance with attention leakage.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "LF loudly says, “This sub lets us do ANYTHING.”",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation pattern continuing.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you reinforce the substitute-day routine?",
      choices: {
        A: {
          text: "Quietly praise LF for starting the task and award a point for staying in routine.",
          score: 10,
          feedback: "Excellent reinforcement for stability with a sub.",
          ending: "success"
        },
        B: {
          text: "Let the substitute praise her without structure.",
          score: 0,
          feedback: "Neutral; structure unclear.",
          ending: "mixed"
        },
        C: {
          text: "Address her earlier behavior in front of peers.",
          score: -10,
          feedback: "Reinforces attention-seeking on sub days.",
          ending: "fail"
        }
      }
    }

  },

  endings: {
    success: {
      title: "Success – Substitute Day Stability",
      text: "LF maintained the routine with low attention and strong structure."
    },
    mixed: {
      title: "Mixed – Participated Lightly",
      text: "LF engaged, but reinforcement inconsistencies may affect future sub days."
    },
    fail: {
      title: "Fail – Attention Flew Wild",
      text: "Public correction heightened peer attention and escalatory behavior."
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
