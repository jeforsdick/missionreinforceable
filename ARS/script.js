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
  return "Strong run. You stayed calm and brief, kept it private, and helped AC get back on track fast. You also followed through with the earning plan (stickers) when he met the goal.";
}
if (pct >= 50) {
  return "Solid progress. Next time, step in a little earlier and use fewer words. Prompt the exact skill you want (\"Help or break,\" \"With me,\" \"Safe hands,\" or \"Hand up and wait\") and follow through quickly when he does it.";
}
return "Keep practicing. Go back to the basics: stay calm, give one short direction, and prompt the replacement skill right away. Focus on safety, reduce the audience, and return to the earning routine as soon as he is calm. If there is any risk of leaving the area, follow the safety plan and get support.";
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

  // === GET STUDENT FROM URL (e.g. ?student=AC) ===
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
 * DAILY SCENARIO 1 - Independent Reading (Hard Task + Asking for Help or Break)
 **************************************************/
POOL.daily.push({
  id: "daily_1_independent_reading_help_or_break",
  title: "Daily Mission: Independent Reading",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "It is independent reading time. AC looks at the page for a few seconds, then pushes his book away and says, “This is stupid.” He starts tapping his pencil and watching you closely.",
      choices: {
        A: {
          text: "Move closer and stay calm. Say quietly, “Looks like you need help or a break. Which one?” Remind him, “Safe body in class for 5 to 10 minutes earns a Minecraft sticker.”",
          score: 10,
          feedback: "Great. You support him early, keep it low-key, and remind him how to earn a sticker.",
          next: "step2A"
        },
        B: {
          text: "Say from across the room, “Just do your best,” and keep working with other students.",
          score: 0,
          feedback: "This might be fine sometimes, but he is showing early signs he needs support and attention.",
          next: "step2B"
        },
        C: {
          text: "Say, “Stop being rude. If you do not read, you will not get any stickers today.”",
          score: -10,
          feedback: "This can make things bigger and it turns into a power struggle. The plan also says stickers should not be removed as a consequence.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC says, “Help,” but his body is still tense. He lightly kicks the trash can under his desk.",
      choices: {
        A: {
          text: "Keep your voice calm. Say, “Thanks for asking for help.” Help him do the very first step. Then remind him, “When your body stays safe, you earn a sticker.”",
          score: 10,
          feedback: "Perfect. You reinforce the right words and help him get started without making it a big moment.",
          next: "step3A"
        },
        B: {
          text: "Ignore the trash can kicking and focus only on the reading.",
          score: 0,
          feedback: "You supported the work, but he also needs a quick reminder for safe body to prevent property problems.",
          next: "step3B"
        },
        C: {
          text: "Tell him, “If you kick that again, you are going to the office.”",
          score: -10,
          feedback: "Threats can raise stress and increase the chance he runs or escalates.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC slides his book onto the floor. A nearby student looks over.",
      choices: {
        A: {
          text: "Walk over right away. Calmly say, “Try again.” Prompt him to use words: “Help” or “Break.” Then reset the book and restart with one tiny step.",
          score: 10,
          feedback: "Nice recovery. You keep the room calm and teach him what to do instead.",
          next: "step3A"
        },
        B: {
          text: "Pick up the book for him and say, “Come on,” without prompting help or break.",
          score: 0,
          feedback: "This may calm things, but it misses practice for asking the right way.",
          next: "step3B"
        },
        C: {
          text: "Talk to him in front of others about respecting the classroom.",
          score: -10,
          feedback: "This can give the behavior extra attention and make it more likely next time.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC gets louder and says, “I hate this!” He pushes his chair back and looks toward the door.",
      choices: {
        A: {
          text: "Stay calm and get close enough to support safety. Say quietly, “Try again. Use words. Help or break?” Then follow through with a short break or quick help once he asks the right way.",
          score: 10,
          feedback: "Good. You focus on safety and teach the skill he needs in the moment.",
          next: "step3A"
        },
        B: {
          text: "Let him leave the area so he can cool off, then deal with it later.",
          score: 0,
          feedback: "This may avoid a scene, but leaving can become a habit if it works as an escape.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice: “Sit down right now.”",
          score: -10,
          feedback: "This often escalates situations and increases the risk of bolting or aggression.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC uses words and stays in the room. He completes the first small step and his body is calmer.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. You are set up to reinforce safe body and work-starting.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC is calmer, but he is not really working and keeps looking for attention.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the game skill was not clearly practiced and rewarded.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and attention in the room increases. The risk of property problems or leaving the area goes up.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward a bigger incident. Prevention and calm prompting are key.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you finish this moment?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for staying in class and using words.” Give a Minecraft sticker if he met the 5 to 10 minute goal (and a second sticker if he was on task too).",
          score: 10,
          feedback: "Perfect. This matches the plan and strengthens the routine.",
          ending: "success"
        },
        B: {
          text: "Give a general “good job” and move on.",
          score: 0,
          feedback: "Supportive, but less clear what he did right and less likely to build the routine.",
          ending: "mixed"
        },
        C: {
          text: "Skip praise and skip stickers because the start of the time was messy.",
          score: -10,
          feedback: "Missed reinforcement makes the right skills less likely next time.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Started Work and Used Words",
      text: "AC stayed in class, used words to get help or a break, and you followed through with the sticker plan."
    },
    mixed: {
      title: "Mixed Outcome: Calm, But Skill Practice Was Light",
      text: "The moment settled, but AC did not get clear practice and reinforcement for the plan’s key skills."
    },
    fail: {
      title: "Escalation More Likely Next Time",
      text: "The routine was not strengthened, so AC is more likely to use bigger behavior to escape or get attention again."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 2 - “Not Yet” Practice (Waiting Without Big Behavior)
 **************************************************/
POOL.daily.push({
  id: "daily_2_not_yet_waiting_practice",
  title: "Daily Mission: Practicing “Not Yet”",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "AC asks, “Can I have my Legos now?” You know Lego time is earned after stickers, not right away. He looks nervous and starts bouncing in his seat.",
      choices: {
        A: {
          text: "Say calmly, “Not yet. First we do 5 minutes of safe body and trying. Then you earn a sticker.” Offer a quick choice: “Do you want to start with the first problem or have me read the directions?”",
          score: 10,
          feedback: "Great. You practice “not yet,” give a clear path to earning, and keep it simple.",
          next: "step2A"
        },
        B: {
          text: "Say, “Maybe later,” without a clear plan for how he earns it.",
          score: 0,
          feedback: "He may feel unsure and push harder because he does not know what will work.",
          next: "step2B"
        },
        C: {
          text: "Say, “No. Stop asking,” and turn away.",
          score: -10,
          feedback: "This can spike frustration fast and increase unsafe behavior or bolting.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC grumbles, but he stays seated. He says, “I want it now,” and starts to shove his paper.",
      choices: {
        A: {
          text: "Keep it calm. Prompt a better phrase: “Try again. Say: ‘Not yet, I can wait.’” Then coach one coping strategy (deep breath, squeeze ball) and start the first tiny step with him.",
          score: 10,
          feedback: "Perfect. This directly teaches the waiting skill and keeps him moving forward.",
          next: "step3A"
        },
        B: {
          text: "Ignore the grumbling and hope it passes.",
          score: 0,
          feedback: "Sometimes fine, but he might need a quick prompt to keep it from growing.",
          next: "step3B"
        },
        C: {
          text: "Say, “If you keep this up, you are not getting anything.”",
          score: -10,
          feedback: "Threats often increase escalation and do not teach waiting.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC repeats louder, “I said I want it now!” A peer looks over.",
      choices: {
        A: {
          text: "Walk closer and keep it private. Say, “Not yet.” Point to the sticker goal and prompt: “Help or break?” Then start with one tiny step so he can earn.",
          score: 10,
          feedback: "Nice recovery. You make the plan clear and prevent a big class moment.",
          next: "step3A"
        },
        B: {
          text: "Tell him, “Stop,” and keep teaching.",
          score: 0,
          feedback: "This might pause him, but it does not teach the waiting routine.",
          next: "step3B"
        },
        C: {
          text: "Explain to the whole class that we do not get rewards right away.",
          score: -10,
          feedback: "This gives the situation a lot of attention and can make it bigger.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC’s body gets tight. He pushes his chair back and looks toward the hallway.",
      choices: {
        A: {
          text: "Stay calm and move closer for safety. Say quietly, “Try again. Not yet.” Prompt: “Help or break?” Give a short break if he asks the right way, then restart with one tiny step.",
          score: 10,
          feedback: "Good. You protect safety and teach the words and routine he needs.",
          next: "step3A"
        },
        B: {
          text: "Let him leave to cool off.",
          score: 0,
          feedback: "This may calm things short term, but leaving can become the go-to response.",
          next: "step3B"
        },
        C: {
          text: "Tell him, “Go to the office,” to end it quickly.",
          score: -10,
          feedback: "This can reward escalation with a preferred place and adult attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC stays with you, uses words, and starts the task.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now reinforce the waiting and trying.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC stays seated, but he is not really engaged and keeps checking to see if you will give in.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the “not yet” skill was not clearly taught and reinforced.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and attention increases. The chance of property problems or leaving the area goes up.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is heading toward a bigger behavior chain. Calm, clear routines help prevent that.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "How do you wrap up after a few minutes?",
      choices: {
        A: {
          text: "Praise quietly: “You waited and tried.” Then give a sticker if he met the 5 minute safe-body goal (and a second sticker if he was working too).",
          score: 10,
          feedback: "Perfect. This directly builds the “not yet” skill and matches the sticker plan.",
          ending: "success"
        },
        B: {
          text: "Move on without mentioning the waiting part.",
          score: 0,
          feedback: "You got through it, but you missed a chance to strengthen the waiting skill.",
          ending: "mixed"
        },
        C: {
          text: "Say nothing and do not give a sticker because he complained at first.",
          score: -10,
          feedback: "Missed reinforcement makes the waiting skill less likely next time.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: “Not Yet” Skill Grew",
      text: "AC practiced waiting without big behavior and earned stickers by staying safe and trying."
    },
    mixed: {
      title: "Mixed Outcome: Got Through It",
      text: "The moment passed, but the waiting skill was not clearly reinforced."
    },
    fail: {
      title: "Escalation More Likely",
      text: "Without clear reinforcement for waiting, AC may escalate faster the next time he hears “not yet.”"
    }
  }
});


/*************************************************
 * DAILY SCENARIO 3 - Specials Transition (Staying With Adults + Safe Routing)
 **************************************************/
POOL.daily.push({
  id: "daily_3_specials_transition_safe_routing",
  title: "Daily Mission: Going to Specials",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "It is time to go to specials. AC is excited but bouncy. As you line up, he starts drifting toward a hallway he is not supposed to go down.",
      choices: {
        A: {
          text: "Move right next to him. Keep it calm and quiet: “With me.” Remind him, “Safe body with the class earns a Minecraft sticker.” Make sure another adult is nearby if possible before the transition.",
          score: 10,
          feedback: "Great. You prevent elopement early and set up support for safety during transitions.",
          next: "step2A"
        },
        B: {
          text: "Call from the line, “AC, come back,” while continuing to move the group.",
          score: 0,
          feedback: "This might work, but being close and calm is safer during transitions.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “Do not you dare run,” in front of students.",
          score: -10,
          feedback: "Big public attention can raise the chance he bolts or escalates.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC slows down, then says, “I want to go to the office,” and starts to pull away from the line.",
      choices: {
        A: {
          text: "Keep it calm. Say, “Not yet. First specials.” Prompt: “If you need help or a break, ask.” If he asks, give a short break in a safe spot, then rejoin the line.",
          score: 10,
          feedback: "Perfect. You use the plan language and teach the better option without turning it into a big moment.",
          next: "step3A"
        },
        B: {
          text: "Tell him, “No,” and keep walking.",
          score: 0,
          feedback: "Simple, but he may need a clear replacement like asking for a break to stay safe.",
          next: "step3B"
        },
        C: {
          text: "Say, “Fine, go,” to avoid a struggle.",
          score: -10,
          feedback: "This can teach him that pulling away gets him to a preferred place and adult attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC moves faster and gets several steps ahead of the class.",
      choices: {
        A: {
          text: "Close the distance quickly and stay calm. Say, “With me.” Prompt: “Help or break?” Then restart the walk with him beside you.",
          score: 10,
          feedback: "Nice recovery. You prioritize safety and redirect him into the routine.",
          next: "step3A"
        },
        B: {
          text: "Assume he will stop at specials and continue with the group.",
          score: 0,
          feedback: "Risky. Transitions are a common time for him to leave the area.",
          next: "step3B"
        },
        C: {
          text: "Yell his name down the hall so he hears you.",
          score: -10,
          feedback: "Loud attention can escalate and can turn it into a chase situation.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC smirks and moves faster, like he is testing you. A few peers notice.",
      choices: {
        A: {
          text: "Step closer and keep it quiet. Say, “Try again. With me.” Prompt: “Help or break?” Then reinforce as soon as he is back with you.",
          score: 10,
          feedback: "Great recovery. You keep it private and shift him back into the skill routine.",
          next: "step3A"
        },
        B: {
          text: "Give him a stern look and keep walking.",
          score: 0,
          feedback: "This may not be enough support during a risky moment.",
          next: "step3B"
        },
        C: {
          text: "Stop the whole class and talk about rules until he returns.",
          score: -10,
          feedback: "This adds a lot of attention to the behavior and can make it happen again.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC stays with you and arrives at specials safely. He looks calmer once you enter the room.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with the sticker plan for the transition success.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC arrives, but he is tense and still looking for a way out.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the routine was not clearly taught or reinforced during the risky moment.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC’s behavior escalates and adult attention increases. The risk of leaving the area goes up.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is a safety concern during transitions. Prevention and calm prompting are key.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "Once specials begins, what do you do?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for staying with me and walking safely.” Then give a Minecraft sticker if he met the 5 to 10 minute safe-body goal during the transition and start of specials.",
          score: 10,
          feedback: "Perfect. This matches the plan and strengthens safe transitions.",
          ending: "success"
        },
        B: {
          text: "Move on without commenting so you do not restart the behavior.",
          score: 0,
          feedback: "Understandable, but you miss an easy chance to reinforce the right behavior.",
          ending: "mixed"
        },
        C: {
          text: "Tell him he lost his chance at stickers because he tried to leave the line.",
          score: -10,
          feedback: "The plan says stickers should not be removed as a consequence. Focus on earning and restarting instead.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Safe Transition to Specials",
      text: "AC stayed with adults during a high-risk time and you reinforced the exact behavior you want during transitions."
    },
    mixed: {
      title: "Mixed Outcome: Arrived, But Routine Was Not Strengthened",
      text: "Specials started, but AC did not get clear practice and reinforcement for staying with the group."
    },
    fail: {
      title: "Escalation More Likely During Transitions",
      text: "Without reinforcement and a clean restart, AC is more likely to test leaving the area again next time."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 4 - Whole-Group Lesson (Staying With the Group + Getting Attention the Right Way)
 **************************************************/
POOL.daily.push({
  id: "daily_4_whole_group_stay_with_group_attention",
  title: "Daily Mission: Whole-Group Lesson",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "You start a whole-group lesson. AC is sitting, but he keeps looking at you, waving his hand without waiting, and trying to talk over you. You can tell he wants your attention.",
      choices: {
        A: {
          text: "Move closer and keep it calm. Quietly say, “If you want me, raise your hand and wait.” Give him a small job (holding the book, pointing, passing out papers) and remind him, “Safe body in class for 5 to 10 minutes earns a Minecraft sticker.”",
          score: 10,
          feedback: "Nice job. You give attention in a helpful way and set AC up to be successful in whole group.",
          next: "step2A"
        },
        B: {
          text: "Keep teaching and hope he settles once the lesson gets going.",
          score: 0,
          feedback: "This might work sometimes, but AC is already showing signs he needs support to stay calm and engaged.",
          next: "step2B"
        },
        C: {
          text: "Call him out in front of everyone: “Stop interrupting and pay attention!”",
          score: -10,
          feedback: "Public correction can make the moment bigger and can lead to louder behavior or unsafe choices.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC takes the job, but he still blurts out once and looks around to see who noticed.",
      choices: {
        A: {
          text: "Keep it private. Quietly say, “Try again. Hand up and wait.” Then notice the next correct moment right away with a quick whisper: “That’s it.”",
          score: 10,
          feedback: "Perfect. You reset fast without making it a big class moment.",
          next: "step3A"
        },
        B: {
          text: "Give him a look and keep teaching.",
          score: 0,
          feedback: "This might pause him, but it does not clearly teach what you want him to do next.",
          next: "step3B"
        },
        C: {
          text: "Take away his job because he blurted out.",
          score: -10,
          feedback: "This can increase frustration and does not teach him the next right step. It may also make whole group harder for him.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC blurts again, louder. A couple of students look at him.",
      choices: {
        A: {
          text: "Walk closer and keep your voice quiet. Say, “Try again. Hand up and wait.” Then give him something to do (job or quick choice) so he can stay with the group.",
          score: 10,
          feedback: "Nice recovery. You reduce attention from others and give him a clear next step.",
          next: "step3A"
        },
        B: {
          text: "Say, “Stop,” from across the room and keep teaching.",
          score: 0,
          feedback: "This might stop it briefly, but it is not as clear and AC still may escalate to get your attention.",
          next: "step3B"
        },
        C: {
          text: "Pause the lesson and talk to the whole class about interrupting.",
          score: -10,
          feedback: "This gives a lot of attention to the problem and can make it happen more often.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC smirks and gets louder, like he is testing what you will do next.",
      choices: {
        A: {
          text: "Reset calmly. Move closer and say quietly, “Try again. Hand up and wait.” Then watch for the next correct hand-raise and give quick positive feedback.",
          score: 10,
          feedback: "Great recovery. You bring it back to the skill without feeding the big moment.",
          next: "step3A"
        },
        B: {
          text: "Ignore him completely and keep teaching.",
          score: 0,
          feedback: "This sometimes helps, but AC may escalate if he is seeking your attention and does not know what to do instead.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is not getting any stickers today if he keeps it up.",
          score: -10,
          feedback: "This can escalate the situation and moves away from the plan’s focus on earning and restarting.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC raises his hand and waits. His body looks calmer and he stays with the group.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with the sticker plan when he meets the time goal.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC stays seated but keeps trying to get your attention and looks restless.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the “hand up and wait” routine was not clearly practiced and noticed.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC gets louder and the class is paying attention to him. The chance of unsafe choices increases.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward a bigger disruption. Calm, quick resets help prevent that.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "After 5 to 10 minutes of whole group, what do you do?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for staying with the group and raising your hand.” Give a Minecraft sticker if he met the safe-body goal (and a second sticker if he also stayed on task).",
          score: 10,
          feedback: "Perfect. This matches the plan and strengthens the routine for next time.",
          ending: "success"
        },
        B: {
          text: "Give a quick “thanks” and keep teaching.",
          score: 0,
          feedback: "Supportive, but less clear and the sticker follow-through may be missed.",
          ending: "mixed"
        },
        C: {
          text: "Skip stickers because he had a rough start.",
          score: -10,
          feedback: "If he meets the goal, follow-through matters. It helps the routine get stronger over time.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Whole Group Went Smoothly",
      text: "AC stayed with the group and used the attention routine the right way. You followed through with stickers."
    },
    mixed: {
      title: "Mixed Outcome: Lesson Continued",
      text: "Whole group continued, but the key routine was not clearly strengthened with feedback and stickers."
    },
    fail: {
      title: "Next Whole Group May Be Harder",
      text: "Without clear follow-through, AC may use louder behavior again to get attention or escape the group."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 5 - Returning From Specials (Transition Back to Class + “Not Yet”)
 **************************************************/
POOL.daily.push({
  id: "daily_5_return_from_specials_not_yet",
  title: "Daily Mission: Returning From Specials",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "Specials ends. AC wants to stop by the office on the way back. He starts drifting away from the group and says, “I’m going to the office.”",
      choices: {
        A: {
          text: "Move right next to him and keep your voice calm. Say, “Not yet. First class.” Remind him, “Stay with me and keep a safe body for 5 to 10 minutes, and you earn a Minecraft sticker.”",
          score: 10,
          feedback: "Great. You use the plan language and give a clear goal to earn a sticker.",
          next: "step2A"
        },
        B: {
          text: "Call from behind, “AC, come back,” while you keep the rest of the group moving.",
          score: 0,
          feedback: "This might work, but being closer is safer during transitions.",
          next: "step2B"
        },
        C: {
          text: "Say loudly, “You are not going to the office, stop it!”",
          score: -10,
          feedback: "Public correction can escalate and increase the chance he bolts.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC stays close for a moment, then says, “I hate class,” and speeds up.",
      choices: {
        A: {
          text: "Keep it calm. Give a short direction: “With me.” Then prompt: “If you need help or a break, ask.” If he asks the right way, give a short pause in a safe spot, then rejoin the group.",
          score: 10,
          feedback: "Perfect. You keep the transition safe and teach him what to do instead of pulling away.",
          next: "step3A"
        },
        B: {
          text: "Try to talk him into it while walking: “It will be fine, we’re almost there.”",
          score: 0,
          feedback: "Supportive, but it does not clearly guide him to the break or help routine.",
          next: "step3B"
        },
        C: {
          text: "Say, “Fine, go to the office,” to avoid a problem.",
          score: -10,
          feedback: "This can make office-seeking more likely because it works for him.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC gets several steps ahead. He looks back like he is checking if anyone will stop him.",
      choices: {
        A: {
          text: "Close the distance quickly and stay calm. Say, “With me.” Then use, “Not yet. First class.” Prompt: “Help or break?”",
          score: 10,
          feedback: "Nice recovery. You keep it safe and keep the message simple and consistent.",
          next: "step3A"
        },
        B: {
          text: "Let him walk ahead as long as he stays in the hallway.",
          score: 0,
          feedback: "Risky. This can turn into a safety issue quickly if he chooses a different direction.",
          next: "step3B"
        },
        C: {
          text: "Shout his name down the hallway so he hears you.",
          score: -10,
          feedback: "Loud attention can make it a bigger moment and increase bolting risk.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC smirks and moves faster. A few students notice and start watching.",
      choices: {
        A: {
          text: "Move closer and keep it private. Say, “Try again. With me. Not yet.” Prompt: “Help or break?” Then notice the first moment he stays with you.",
          score: 10,
          feedback: "Great recovery. You reduce the audience and return to the routine.",
          next: "step3A"
        },
        B: {
          text: "Stop the whole group and wait for him to come back.",
          score: 0,
          feedback: "This can become a bigger attention moment and increase stress for everyone.",
          next: "step3B"
        },
        C: {
          text: "Threaten consequences like losing stickers.",
          score: -10,
          feedback: "This can escalate and does not help him practice the “not yet” and break routine.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC stays with you and returns to class safely.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with stickers if he meets the time goal in class.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC returns, but he is tense and keeps checking the hallway.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the routine was not clearly practiced and strengthened.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates during the transition and adult attention increases.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is a safety concern. Calm, consistent routines help prevent these moments.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "Once AC is back in class and has stayed safe for 5 to 10 minutes, what do you do?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for coming back with the group.” Give a Minecraft sticker for safe body (and a second sticker if he got started on work too).",
          score: 10,
          feedback: "Perfect. This matches the plan and strengthens the transition routine.",
          ending: "success"
        },
        B: {
          text: "Move on without commenting so you do not restart the issue.",
          score: 0,
          feedback: "Understandable, but you miss an easy chance to build the routine with a quick positive comment.",
          ending: "mixed"
        },
        C: {
          text: "Skip stickers because he tried to go to the office earlier.",
          score: -10,
          feedback: "If he meets the goal later, follow-through matters. The plan is about earning and restarting.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Transition Back to Class",
      text: "AC returned with the group and you followed through with the sticker plan once he met the goal."
    },
    mixed: {
      title: "Mixed Outcome: Back in Class",
      text: "AC made it back, but the routine was not clearly strengthened with feedback and stickers."
    },
    fail: {
      title: "Office-Seeking May Increase",
      text: "Without a clear earning routine, AC may try harder next time to get to the office or leave the group."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 6 - Sticker Moment (Following Through Without Taking Stickers Away)
 **************************************************/
POOL.daily.push({
  id: "daily_6_sticker_follow_through_no_taking_away",
  title: "Daily Mission: Sticker Follow-Through",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "AC has had a rocky start, but he has now stayed in class with a safe body for about 5 to 10 minutes. He looks at the sticker chart and says, “Do I get my Minecraft sticker?”",
      choices: {
        A: {
          text: "Say calmly, “Yes.” Give the sticker right away and quietly tell him what he did right: “You stayed in class and kept your body safe.”",
          score: 10,
          feedback: "Perfect. You followed through and made it clear what he did to earn it.",
          next: "step2A"
        },
        B: {
          text: "Say, “Maybe later,” because earlier he had a hard moment.",
          score: 0,
          feedback: "This can confuse him. If he met the goal, clear follow-through helps the plan work.",
          next: "step2B"
        },
        C: {
          text: "Say, “No, you lost it earlier,” and do not give a sticker.",
          score: -10,
          feedback: "This goes against the plan’s idea of earning and restarting. It can also trigger bigger behavior.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC smiles and looks proud. Then he asks, “Can I go to the calm room now?”",
      choices: {
        A: {
          text: "Say, “Not yet.” Point to the goal: “When you earn 10 stickers, then you get 10 to 20 minutes.” Offer a short choice: “Do you want help starting, or a quick break?”",
          score: 10,
          feedback: "Great. You keep the rule clear and you give him a positive next step.",
          next: "step3A"
        },
        B: {
          text: "Say, “We’ll see,” without telling him what he needs to do next.",
          score: 0,
          feedback: "He may keep asking because the plan feels unclear in the moment.",
          next: "step3B"
        },
        C: {
          text: "Say, “Stop asking,” and turn away.",
          score: -10,
          feedback: "This can escalate frustration and increase problem behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC’s face changes. He asks again, louder: “Where is my sticker?” He starts pushing his paper around.",
      choices: {
        A: {
          text: "Reset calmly. Say, “Try again.” Then give the sticker if he met the goal and state the reason: “You stayed in class with a safe body.”",
          score: 10,
          feedback: "Nice recovery. You keep it calm and put the routine back on track.",
          next: "step3A"
        },
        B: {
          text: "Tell him to calm down first and then you will decide.",
          score: 0,
          feedback: "This can turn into a long debate and the earning rule feels unpredictable.",
          next: "step3B"
        },
        C: {
          text: "Threaten to take away stickers if he keeps asking.",
          score: -10,
          feedback: "This can escalate the situation and moves away from the plan’s structure.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC gets upset. He pushes his chair back and looks like he might bolt or knock things over.",
      choices: {
        A: {
          text: "Stay calm and get close enough for safety. Say quietly, “Try again.” Prompt: “Help or break?” Once he uses words and settles, go back to the clear sticker rule.",
          score: 10,
          feedback: "Good recovery. You focus on safety and teach him how to get what he wants the right way.",
          next: "step3A"
        },
        B: {
          text: "Give the sticker just to stop the behavior, even if he did not meet the goal.",
          score: 0,
          feedback: "This may stop the moment, but it can teach him that getting upset is how to get stickers.",
          next: "step3B"
        },
        C: {
          text: "Send him out right away to calm down.",
          score: -10,
          feedback: "This can make leaving the area more likely when he is frustrated.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC understands the rule and settles. He is ready to move forward.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. The sticker system stays clear and predictable.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC calms a bit, but he keeps testing the sticker rule and asking repeatedly.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the plan may feel inconsistent, which can lead to more testing.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and the situation becomes a bigger moment with more attention.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward a bigger behavior chain. Clear rules and calm resets help prevent it.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "What is the best way to finish this situation?",
      choices: {
        A: {
          text: "Keep the sticker rule clear: earn for safe body and getting started, do not take stickers away, and use “not yet” with a clear path to the 10-sticker reward.",
          score: 10,
          feedback: "Perfect. This matches the plan and helps AC learn what works.",
          ending: "success"
        },
        B: {
          text: "Be flexible day-to-day and decide stickers based on how the day feels.",
          score: 0,
          feedback: "This can work sometimes, but AC usually does better when the rule is predictable and the same each time.",
          ending: "mixed"
        },
        C: {
          text: "Use stickers as a consequence by removing them when behavior is tough.",
          score: -10,
          feedback: "This often escalates behavior and moves away from the plan’s structure of earning and restarting.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Sticker System Stayed Strong",
      text: "AC learned that safe body and trying earns stickers, and “not yet” comes with a clear path to the bigger reward."
    },
    mixed: {
      title: "Mixed Outcome: Some Confusion",
      text: "The moment passed, but the sticker rule was not as clear and AC may test it again soon."
    },
    fail: {
      title: "Sticker Battles May Increase",
      text: "Using stickers as a punishment can increase frustration and make behavior worse, especially when AC is already upset."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 7 - Teacher Is Busy (Getting Attention the Right Way)
 **************************************************/
POOL.daily.push({
  id: "daily_7_teacher_busy_attention_routine",
  title: "Daily Mission: When You Are Helping Someone Else",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "You are working 1:1 with another student. AC notices and starts making noises, tapping loudly, and calling your name. He is clearly trying to pull you back.",
      choices: {
        A: {
          text: "Give AC a quick, calm check-in without stopping everything: walk by, point to the break/help card, and whisper, “If you need me, raise your hand or ask for help or a break. I will be there in one minute.”",
          score: 10,
          feedback: "Nice job. You give him a clear way to get your attention without turning it into a big moment.",
          next: "step2A"
        },
        B: {
          text: "Keep helping the other student and hope AC stops on his own.",
          score: 0,
          feedback: "This might work sometimes, but AC often needs a quick reminder and a clear plan to stay calm.",
          next: "step2B"
        },
        C: {
          text: "Call across the room, “AC, stop!” so everyone hears.",
          score: -10,
          feedback: "This can make the behavior bigger and pull peer attention into it.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC pauses. He looks at the card, then says, “Help,” and keeps his body in his space.",
      choices: {
        A: {
          text: "Say quietly, “Thanks for using words.” Tell him, “I will help you next.” Give him a tiny first step he can start now, and remind him he can earn a Minecraft sticker for staying safe for 5 to 10 minutes.",
          score: 10,
          feedback: "Perfect. You quickly praise the right skill and keep him moving forward.",
          next: "step3A"
        },
        B: {
          text: "Tell him to wait with no other support.",
          score: 0,
          feedback: "Waiting is hard for him. A small first step or quick break option can prevent escalation.",
          next: "step3B"
        },
        C: {
          text: "Say, “Stop bothering me,” and turn away.",
          score: -10,
          feedback: "This can spike frustration and increase unsafe behavior or leaving the area.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC gets louder and starts pushing his materials toward the edge of his desk. A peer looks over.",
      choices: {
        A: {
          text: "Walk over calmly and keep it private. Say, “Try again.” Prompt, “Help or break?” Then give a tiny first step to start, or a short break if he asks the right way.",
          score: 10,
          feedback: "Nice recovery. You reset quickly and guide him to a better option.",
          next: "step3A"
        },
        B: {
          text: "Give him a stern look and continue helping the other student.",
          score: 0,
          feedback: "This may not be enough support when he is already ramping up.",
          next: "step3B"
        },
        C: {
          text: "Tell the peer to ignore him and keep teaching.",
          score: -10,
          feedback: "Peer attention matters, but you still need to step in early for safety and support.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC smirks, like he got the attention he wanted. He keeps going and starts talking louder.",
      choices: {
        A: {
          text: "Reset calmly and privately. Walk over and say quietly, “Try again.” Prompt, “Raise your hand or ask for help or a break.” Then notice the first correct attempt right away.",
          score: 10,
          feedback: "Great recovery. You bring it back to the routine without making it a bigger class moment.",
          next: "step3A"
        },
        B: {
          text: "Ignore him completely so he does not get attention.",
          score: 0,
          feedback: "This can work sometimes, but AC often needs a clear prompt for what to do instead.",
          next: "step3B"
        },
        C: {
          text: "Tell him he will not get stickers today if he keeps it up.",
          score: -10,
          feedback: "This can escalate and moves away from the plan’s focus on earning and restarting.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC uses the routine and stays in the room safely. He starts his work or waits appropriately for your turn.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with stickers once he meets the time goal.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC stays in his seat but keeps testing for attention and looks tense.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the routine was not clearly practiced and strengthened.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and the room starts paying attention to him. The chance of knocking things over or leaving the area increases.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward a bigger chain. Early calm prompts help prevent that.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "After AC has stayed safe for 5 to 10 minutes, what do you do?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for using words and staying safe.” Give a Minecraft sticker for safe body (and a second sticker if he also got started and worked).",
          score: 10,
          feedback: "Perfect. This matches the plan and builds the routine for next time.",
          ending: "success"
        },
        B: {
          text: "Say, “Good job,” and move on.",
          score: 0,
          feedback: "Supportive, but it is less clear what you are praising and stickers may be missed.",
          ending: "mixed"
        },
        C: {
          text: "Skip stickers because earlier he was loud.",
          score: -10,
          feedback: "If he met the goal, follow-through matters. The plan is about earning and restarting.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Attention Routine Worked",
      text: "AC got your attention the right way and stayed safe. You followed through with the sticker plan."
    },
    mixed: {
      title: "Mixed Outcome: Stable, But Less Clear",
      text: "The moment passed, but AC did not get clear practice and feedback for the routine."
    },
    fail: {
      title: "Attention-Seeking May Increase",
      text: "Without clear follow-through, AC may use louder behavior again to pull attention."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 8 - Lining Up for Lunch (Safe Transition + Staying With Adults)
 **************************************************/
POOL.daily.push({
  id: "daily_8_lunch_line_transition_safe",
  title: "Daily Mission: Lining Up for Lunch",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "It is time to line up for lunch. The hallway is busy. AC starts moving ahead of the line and looks toward the office area.",
      choices: {
        A: {
          text: "Move next to him right away and keep your voice calm and quiet. Say, “With me.” Remind him, “Safe body with the group for 5 to 10 minutes earns a Minecraft sticker.”",
          score: 10,
          feedback: "Nice job. You step in early and make the goal clear.",
          next: "step2A"
        },
        B: {
          text: "Call to him from the line, “AC, get back here,” while moving the class forward.",
          score: 0,
          feedback: "This might work, but being close is safer during busy transitions.",
          next: "step2B"
        },
        C: {
          text: "Yell, “Stop!” so everyone in the hallway hears.",
          score: -10,
          feedback: "Loud attention can make it a bigger moment and increase bolting risk.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC slows down but says, “I want to go to the office,” and tries to drift away again.",
      choices: {
        A: {
          text: "Say calmly, “Not yet. First lunch.” Prompt, “If you need help or a break, ask.” If he asks, give a short pause in a safe spot, then rejoin the line.",
          score: 10,
          feedback: "Perfect. You keep it safe, use the plan language, and give him a better option.",
          next: "step3A"
        },
        B: {
          text: "Tell him, “No,” and keep walking.",
          score: 0,
          feedback: "Simple, but he often needs the clear help or break option to stay with you.",
          next: "step3B"
        },
        C: {
          text: "Let him go toward the office so you can keep the class moving.",
          score: -10,
          feedback: "This can make office-seeking and leaving the group more likely next time.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC gets several steps ahead and turns his head like he is checking if you will chase him.",
      choices: {
        A: {
          text: "Close the distance quickly and stay calm. Say, “With me.” Prompt, “Help or break?” Then continue with him beside you.",
          score: 10,
          feedback: "Nice recovery. You prevent it from becoming a chase situation.",
          next: "step3A"
        },
        B: {
          text: "Keep moving the class and hope he stops at lunch.",
          score: 0,
          feedback: "Risky. He may choose a different direction quickly.",
          next: "step3B"
        },
        C: {
          text: "Send another student to get an adult while you stay with the class.",
          score: -10,
          feedback: "This can split supervision and raise safety risk.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC smirks and moves faster. A few students start watching.",
      choices: {
        A: {
          text: "Make it private again. Move close and say quietly, “Try again. With me.” Prompt, “Help or break?” Then notice the first moment he stays with you.",
          score: 10,
          feedback: "Great recovery. You reduce the audience and return to the routine.",
          next: "step3A"
        },
        B: {
          text: "Stop and wait for him to come back on his own.",
          score: 0,
          feedback: "This can be risky in a busy hallway and may let him get farther away.",
          next: "step3B"
        },
        C: {
          text: "Threaten to take away stickers.",
          score: -10,
          feedback: "This can escalate and moves away from the plan’s focus on earning and restarting.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC stays with you and arrives at lunch safely.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with stickers after he meets the time goal.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC arrives, but he is tense and keeps looking for a way out.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the routine was not clearly practiced and strengthened.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "Adult attention increases and AC’s behavior escalates in the hallway.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is a safety concern. Calm, consistent routines help prevent it.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "After lunch begins and AC has stayed safe for 5 to 10 minutes, what do you do?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for staying with me and walking safely.” Give a Minecraft sticker for safe body (and a second sticker if he also started the next routine without trouble).",
          score: 10,
          feedback: "Perfect. This matches the plan and strengthens safe transitions.",
          ending: "success"
        },
        B: {
          text: "Move on without commenting.",
          score: 0,
          feedback: "Understandable, but you miss a chance to build the routine with quick positive feedback.",
          ending: "mixed"
        },
        C: {
          text: "Skip stickers because the hallway was messy at first.",
          score: -10,
          feedback: "If he meets the goal later, follow-through matters. The plan is about earning and restarting.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Safe Lunch Transition",
      text: "AC stayed with adults during a busy transition and you followed through with the sticker plan."
    },
    mixed: {
      title: "Mixed Outcome: Got There",
      text: "Lunch happened, but the routine was not clearly strengthened with feedback and stickers."
    },
    fail: {
      title: "Transitions May Get Harder",
      text: "Without clear follow-through, AC may test leaving the group again during the next transition."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 9 - Center Time (Safe Hands and Getting Started)
 **************************************************/
POOL.daily.push({
  id: "daily_9_center_time_safe_hands_get_started",
  title: "Daily Mission: Center Time",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "During centers, AC gets a reading activity. He frowns, pushes the materials away, and starts sliding items toward the edge of the table.",
      choices: {
        A: {
          text: "Move closer and stay calm. Say quietly, “Safe hands.” Then prompt, “Help or break?” Give him a tiny first step to start.",
          score: 10,
          feedback: "Nice job. You prevent a mess and give him a clear next step.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Just do it,” and continue running the center for everyone.",
          score: 0,
          feedback: "This might work sometimes, but he is showing early signs he needs support to get started safely.",
          next: "step2B"
        },
        C: {
          text: "Say, “If you throw that, you are going to the office,” in front of others.",
          score: -10,
          feedback: "Threats can make the moment bigger and increase the chance of escalation or leaving the area.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC pauses and says, “Help,” but he still looks angry and nudges the materials again.",
      choices: {
        A: {
          text: "Say quietly, “Try again.” Prompt him to use words and keep hands safe. Help him do the first tiny step, then remind him he can earn a Minecraft sticker for staying safe for 5 to 10 minutes.",
          score: 10,
          feedback: "Perfect. You reset quickly, keep it calm, and help him get started.",
          next: "step3A"
        },
        B: {
          text: "Move the materials away so he cannot knock them over, but do not prompt help or break.",
          score: 0,
          feedback: "This can prevent a mess, but he still needs the routine for how to handle hard work.",
          next: "step3B"
        },
        C: {
          text: "Tell him he will not get any stickers if he keeps acting like this.",
          score: -10,
          feedback: "This can escalate and moves away from the plan’s focus on earning and restarting.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC swipes the materials to the floor. Another student looks over.",
      choices: {
        A: {
          text: "Stay calm. Make it private. Say, “Try again.” Prompt, “Help or break?” Then restart with one tiny step once he uses words.",
          score: 10,
          feedback: "Nice recovery. You help him reset without turning it into a big class moment.",
          next: "step3A"
        },
        B: {
          text: "Pick up the materials and restart without saying much.",
          score: 0,
          feedback: "This may calm the moment, but he misses practice for using words and restarting the right way.",
          next: "step3B"
        },
        C: {
          text: "Stop the center and lecture about respecting materials.",
          score: -10,
          feedback: "This gives a lot of attention to the problem and can make it happen more often.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC uses inappropriate language and looks at you like he is waiting for a big reaction.",
      choices: {
        A: {
          text: "Keep your voice calm and small. Prompt, “Use words. Help or break?” Reduce the audience by redirecting peers, then do “try again” and restart with one tiny step.",
          score: 10,
          feedback: "Great recovery. You keep it calm and guide him back to what to do next.",
          next: "step3A"
        },
        B: {
          text: "Tell him to apologize right now before you will help him.",
          score: 0,
          feedback: "This can drag the moment out. A quick reset and restart often works better in the moment.",
          next: "step3B"
        },
        C: {
          text: "React strongly to the language so he knows it is not allowed.",
          score: -10,
          feedback: "Big reactions can keep the behavior going and increase attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC keeps his hands safe, stays in the area, and starts the activity with support.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with stickers once he meets the time goal.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC is calmer, but he is not really working and keeps watching you.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the help or break routine and restart were not clearly strengthened.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates again and attention increases. The chance of throwing materials or leaving the area goes up.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward a bigger chain. Early calm prompts help prevent that.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "After 5 to 10 minutes, what do you do?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for safe hands and staying in class.” Give a Minecraft sticker for safe body (and a second sticker if he also got started and worked).",
          score: 10,
          feedback: "Perfect. This matches the plan and strengthens both goals.",
          ending: "success"
        },
        B: {
          text: "Give a general “good job” and move on.",
          score: 0,
          feedback: "Supportive, but less clear what he did right and stickers may be missed.",
          ending: "mixed"
        },
        C: {
          text: "Skip stickers because the center started rough.",
          score: -10,
          feedback: "If he met the goal later, follow-through matters. The plan is about earning and restarting.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Safe Hands and Started Work",
      text: "AC kept his body safe, used words to get help or a break, and you followed through with stickers."
    },
    mixed: {
      title: "Mixed Outcome: Calmer Moment",
      text: "The moment settled, but the routine was not clearly strengthened with feedback and stickers."
    },
    fail: {
      title: "Materials Problems May Increase",
      text: "Without clear follow-through, AC may use bigger behavior again when a task feels hard."
    }
  }
});

/*************************************************
 * DAILY SCENARIO 10 - Big Reward Time (10 Stickers) and Ending It Smoothly
 **************************************************/
POOL.daily.push({
  id: "daily_10_big_reward_timer_transition_back",
  title: "Daily Mission: Big Reward Time",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "AC just earned his 10th Minecraft sticker. He says, “Yes! Calm room now!” He looks excited and ready to go right away.",
      choices: {
        A: {
          text: "Celebrate briefly and set it up clearly: “You earned it.” Tell him where you are going, set a timer for 10 to 20 minutes, and remind him, “When the timer ends, we come back.”",
          score: 10,
          feedback: "Perfect. You follow through and make the start and end clear right away.",
          next: "step2A"
        },
        B: {
          text: "Say, “Sure,” and go without setting a timer or talking about coming back.",
          score: 0,
          feedback: "He gets the reward, but without a clear end point it may be harder to transition back later.",
          next: "step2B"
        },
        C: {
          text: "Say, “Not right now, maybe later,” because you are busy.",
          score: -10,
          feedback: "This can trigger a big reaction because he met the goal and expects follow-through.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC starts playing. After a few minutes, you give a quick reminder: “Five minutes left.” He keeps playing but looks up to check your face.",
      choices: {
        A: {
          text: "Keep it calm and predictable. Give another reminder at 2 minutes. Tell him what comes next: “Then we go back and start with one small step.”",
          score: 10,
          feedback: "Great. Clear warnings and a simple next step make the ending smoother.",
          next: "step3A"
        },
        B: {
          text: "Let it run and do not remind him again, so he stays happy.",
          score: 0,
          feedback: "Understandable, but surprise endings often lead to bigger reactions.",
          next: "step3B"
        },
        C: {
          text: "End it early because you need him back now.",
          score: -10,
          feedback: "Ending early can make the next reward time harder because it feels unpredictable.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC is deep into the reward. When you say, “Time to go,” he freezes and clutches the item.",
      choices: {
        A: {
          text: "Add the missing piece now: “Timer is done.” Offer a simple next step: “Back to class, then one small step.” Keep your voice calm and steady.",
          score: 10,
          feedback: "Nice recovery. You make the transition clear and keep it calm.",
          next: "step3A"
        },
        B: {
          text: "Try to negotiate: “Just one more minute, okay, but then really we go.”",
          score: 0,
          feedback: "This can turn into repeated bargaining and make the ending harder next time.",
          next: "step3B"
        },
        C: {
          text: "Say, “Give it to me now,” and take it immediately.",
          score: -10,
          feedback: "This can spike escalation quickly and increase unsafe behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC’s face changes fast. He yells, pushes a chair, and looks toward the hallway like he might bolt.",
      choices: {
        A: {
          text: "Reset calmly: “Try again.” Use, “Not yet,” and give a clear path: “First safe body in class for 5 minutes, then you can earn your next sticker.” Offer help or a short break to get started.",
          score: 10,
          feedback: "Good recovery. You keep the rule clear and give him a way to earn again without a power struggle.",
          next: "step3A"
        },
        B: {
          text: "Give the reward anyway so he calms down.",
          score: 0,
          feedback: "This may calm the moment, but it can teach him that escalation is how to get the reward.",
          next: "step3B"
        },
        C: {
          text: "Tell him he will lose stickers if he acts like this.",
          score: -10,
          feedback: "Threats can escalate and move away from the plan’s focus on earning and restarting.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC returns to class with support and stays in the room safely. He is ready for a small next step.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. You kept it predictable and set him up for the next success.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC returns, but he keeps testing and asking for the reward again and again.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the routine may feel unclear and get tested more often.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and the transition turns into a bigger moment. The risk of unsafe behavior or leaving the area increases.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward a crisis moment. Predictable timers and calm transitions help prevent this.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "What is the best way to finish this situation?",
      choices: {
        A: {
          text: "Keep rewards predictable: follow through when earned, use a timer, give warnings, and return with one small next step. Use “not yet” with a clear path to earning again.",
          score: 10,
          feedback: "Perfect. This builds trust in the system and makes reward time smoother over time.",
          ending: "success"
        },
        B: {
          text: "Be flexible and decide reward timing based on the mood of the day.",
          score: 0,
          feedback: "This can work sometimes, but AC often does best when the routine is the same each time.",
          ending: "mixed"
        },
        C: {
          text: "Avoid rewards when you think it might cause problems later.",
          score: -10,
          feedback: "If he earns it and it does not happen, the system can lose power and behavior may increase.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Reward Time Stayed Predictable",
      text: "AC earned the reward, used a timer, and transitioned back with support. The routine got stronger."
    },
    mixed: {
      title: "Mixed Outcome: Some Confusion",
      text: "AC got through it, but the reward routine may feel less predictable and get tested more often."
    },
    fail: {
      title: "Reward Routine Weakened",
      text: "Without clear follow-through and predictable endings, reward times may trigger bigger behavior in the future."
    }
  }
});


/*************************************************
 * CRISIS SCENARIO 1 - Bolting Risk in the Building (Leaving the Classroom Area)
 **************************************************/
POOL.crisis.push({
  id: "crisis_1_bolting_in_building",
  title: "Red Alert: Bolting Risk",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "AC gets upset during a hard reading task. He shouts, pushes his chair back, and moves quickly toward the door.",
      choices: {
        A: {
          text: "Call for support right away and get a second adult if possible. Keep your voice calm and short: “Stop. With me.” Position yourself to block unsafe routes without grabbing him. Keep eyes on him and reduce attention from other students.",
          score: 10,
          feedback: "Great. You prioritize safety, call for help early, and keep your language calm and simple.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop and ask him why he is doing this.",
          score: 0,
          feedback: "Asking questions in the moment can add fuel. He needs calm, short directions and support.",
          next: "step2B"
        },
        C: {
          text: "Chase after him and yell his name so he knows you mean it.",
          score: -10,
          feedback: "Chasing and yelling can make bolting worse and can turn it into a chase game.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC slows down when you are close and calm, but he is still tense. He says, “I’m going to the office!”",
      choices: {
        A: {
          text: "Use plan language: “Not yet. First safe body.” Offer one simple option: “Help or break?” If he uses words, guide him to a safe, supervised break spot and keep it short.",
          score: 10,
          feedback: "Perfect. You keep it calm, give a clear option, and reduce the chance he bolts.",
          next: "step3A"
        },
        B: {
          text: "Let him go to the office because it is safer than arguing.",
          score: 0,
          feedback: "This may stop the moment, but office-seeking can become the go-to if it works repeatedly.",
          next: "step3B"
        },
        C: {
          text: "Tell him, “If you do that, you will be in big trouble,” and keep talking.",
          score: -10,
          feedback: "Long lectures and threats can increase escalation and make bolting more likely.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC moves into the hallway. Other students are watching, and the noise level increases.",
      choices: {
        A: {
          text: "Call for support now and reduce the audience. Use short, calm directions: “With me.” Offer “help or break” once you are in safe proximity.",
          score: 10,
          feedback: "Nice recovery. Support and a calm reset help you regain safety quickly.",
          next: "step3A"
        },
        B: {
          text: "Follow him and keep asking him to explain himself.",
          score: 0,
          feedback: "This can keep the energy high. Calm, short directions usually work better.",
          next: "step3B"
        },
        C: {
          text: "Send a student to get help while you stay far away.",
          score: -10,
          feedback: "This can reduce supervision and create a safety risk. Adults should manage this, not students.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC speeds up and looks back like he is checking if you are chasing him.",
      choices: {
        A: {
          text: "Stop the chase energy. Call for support and move into calm, safe proximity. Keep words minimal: “Stop. With me.”",
          score: 10,
          feedback: "Good recovery. You reduce chase dynamics and focus on safety and support.",
          next: "step3A"
        },
        B: {
          text: "Keep chasing until he stops.",
          score: 0,
          feedback: "Chasing can increase bolting and make future incidents harder.",
          next: "step3B"
        },
        C: {
          text: "Yell louder so he knows you are serious.",
          score: -10,
          feedback: "Loud attention can escalate and pull in more audience.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC stays in the building area with adults and begins to settle. He uses words for help or a break.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Keep it calm, short, and supervised.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC stays nearby but keeps testing the hallway and arguing.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the situation may last longer without clear calm routines and support.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and the situation stretches on. The risk of aggression or leaving the supervised area increases.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving deeper into crisis. Early support, calm language, and reducing the audience help prevent this.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "If the crisis continues and does not improve, what do you do?",
      choices: {
        A: {
          text: "Follow the safety plan. Keep calling for adult support. If the incident lasts around 20 minutes with little calming, use the agreed code word “Luigi” and call Grandpa as planned. Document and debrief later.",
          score: 10,
          feedback: "Perfect. This matches the plan and keeps safety the top priority.",
          ending: "success"
        },
        B: {
          text: "Handle it alone until it ends so you do not bother anyone.",
          score: 0,
          feedback: "It is understandable, but the plan expects you to get support early for safety.",
          ending: "mixed"
        },
        C: {
          text: "Threaten bigger consequences to force compliance quickly.",
          score: -10,
          feedback: "Threats often escalate crisis behavior and can make safety worse.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed: Safety First",
      text: "You got adult support early, used calm short directions, and followed the safety plan if the incident continued."
    },
    mixed: {
      title: "Crisis Managed: But Support Was Late",
      text: "AC did not leave supervision, but the situation lasted longer because support and routines were not used early."
    },
    fail: {
      title: "Crisis Escalated",
      text: "Chasing, public attention, or threats increased escalation and made future bolting more likely."
    }
  }
});


/*************************************************
 * CRISIS SCENARIO 2 - Aggression Risk (Protect Others and Reduce the Audience)
 **************************************************/
POOL.crisis.push({
  id: "crisis_2_aggression_risk_safe_space",
  title: "Red Alert: Aggression Risk",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "AC is very upset. He yells, uses inappropriate language, and swings his arm toward an adult who is close by. Other students are nearby.",
      choices: {
        A: {
          text: "Call for support immediately. Move other students away and create space. Keep your voice calm and short. Give one clear message: “I’m keeping everyone safe.” Avoid long talking.",
          score: 10,
          feedback: "Great. You protect others, get help, and lower the intensity by keeping language short.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop and explain why hitting is not allowed.",
          score: 0,
          feedback: "Explaining in the moment can add fuel. Safety and calm come first.",
          next: "step2B"
        },
        C: {
          text: "Raise your voice and argue with him to show you are in charge.",
          score: -10,
          feedback: "Escalation from adults can escalate the student further and increase danger.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "With space and fewer eyes on him, AC is still upset but not as activated. He is breathing hard and watching your face.",
      choices: {
        A: {
          text: "Keep it simple and calm. Offer one choice: “Help or break?” If he uses words, guide him to the planned safe break area with adult supervision.",
          score: 10,
          feedback: "Perfect. One calm choice helps him move out of danger and into a safer routine.",
          next: "step3A"
        },
        B: {
          text: "Tell him he needs to apologize before anything happens.",
          score: 0,
          feedback: "Apologies can happen later. Right now, getting calm and safe is the priority.",
          next: "step3B"
        },
        C: {
          text: "Keep talking and listing consequences so he understands this is serious.",
          score: -10,
          feedback: "Long lectures can keep the crisis going and increase risk.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC stays activated and the room is still watching. He swats at a nearby item and steps forward quickly.",
      choices: {
        A: {
          text: "Get support now and reduce the audience. Create more space and keep your words short. Offer “help or break” once it is safer.",
          score: 10,
          feedback: "Nice recovery. Space, support, and calm language reduce risk.",
          next: "step3A"
        },
        B: {
          text: "Keep trying to talk him down while other students stay close.",
          score: 0,
          feedback: "This keeps others at risk. Space and support help more than talking right now.",
          next: "step3B"
        },
        C: {
          text: "Physically try to control his movement without support.",
          score: -10,
          feedback: "Do not do this. Follow your training and safety plan. Get help and create space.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC escalates more. He gets louder and more intense, and the chance of someone getting hurt increases.",
      choices: {
        A: {
          text: "Reset to safety. Call for support, move others away, and keep your voice calm and short. Focus on creating space and supervision.",
          score: 10,
          feedback: "Good recovery. Safety and support come first.",
          next: "step3A"
        },
        B: {
          text: "Keep arguing until he stops.",
          score: 0,
          feedback: "Arguing usually increases crisis behavior and puts others at risk.",
          next: "step3B"
        },
        C: {
          text: "Threaten a major consequence to force it to end quickly.",
          score: -10,
          feedback: "Threats often increase escalation and make safety worse.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC begins to settle with space and adult support. He can use words for help or a break.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Keep it calm, supervised, and predictable.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC calms a little but stays upset and keeps re-escalating.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "This can drag on when support and calm routines are not consistent.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC stays in crisis and the incident stretches on. The risk of injury remains high.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is a high-risk situation. Adult support and space are critical.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "If the incident continues for a long time with little calming, what do you do?",
      choices: {
        A: {
          text: "Follow the safety plan. Keep adult support in place. If it lasts around 20 minutes with little sign of calming, use the code word “Luigi” and call Grandpa as planned. Debrief and document later.",
          score: 10,
          feedback: "Perfect. This matches the plan and keeps safety the priority.",
          ending: "success"
        },
        B: {
          text: "Wait it out alone and hope it ends soon.",
          score: 0,
          feedback: "It is understandable, but the plan expects you to use support early for safety.",
          ending: "mixed"
        },
        C: {
          text: "Use consequences and shame to try to stop it fast.",
          score: -10,
          feedback: "This can escalate crisis behavior and harm the relationship.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed: Protected Safety",
      text: "You created space, moved others away, got adult support, and followed the safety plan if the incident continued."
    },
    mixed: {
      title: "Crisis Managed: But Support Was Limited",
      text: "The situation improved eventually, but it lasted longer because support and space were not used early."
    },
    fail: {
      title: "Crisis Escalated",
      text: "Public attention, arguing, or threats increased escalation and made future crises more likely."
    }
  }
});
/*************************************************
 * CRISIS SCENARIO 3 - Property Destruction (Keep Everyone Safe, Keep It Calm)
 **************************************************/
POOL.crisis.push({
  id: "crisis_3_property_destruction",
  title: "Red Alert: Property Destruction",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "AC gets upset and starts kicking a trash can and sweeping materials off a table. Students nearby stop and stare.",
      choices: {
        A: {
          text: "Call for support right away and get a second adult if possible. Move other students away and clear the area. Keep your voice calm and short: “I’m keeping everyone safe.”",
          score: 10,
          feedback: "Great. You focus on safety first and reduce the audience, which often helps the behavior come down sooner.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Stop it,” and start picking things up while you talk to him.",
          score: 0,
          feedback: "Picking up during the moment can keep the attention on the behavior. Safety and space usually work better first.",
          next: "step2B"
        },
        C: {
          text: "Raise your voice and tell him he will have major consequences if he does not stop.",
          score: -10,
          feedback: "Loud talking and threats often make crisis behavior bigger and last longer.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "With fewer students watching, AC is still upset but slows down. He is breathing hard and watching you closely.",
      choices: {
        A: {
          text: "Keep it simple. Offer one clear option: “Help or break?” If he uses words, guide him to the planned safe break spot with adult supervision.",
          score: 10,
          feedback: "Perfect. One calm option gives him a way out without making it a power struggle.",
          next: "step3A"
        },
        B: {
          text: "Ask him to explain what happened so you can solve it right now.",
          score: 0,
          feedback: "Problem-solving can happen later. Right now, he needs calm and safety.",
          next: "step3B"
        },
        C: {
          text: "Tell him he needs to clean up before he can take a break.",
          score: -10,
          feedback: "Cleanup can come later. Requiring it during crisis can keep him escalated.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC kicks again while you pick things up. He looks like he might tip over a chair.",
      choices: {
        A: {
          text: "Stop picking up for now. Call for support and move others away. Keep your voice calm and short. Offer “help or break” once it is safer.",
          score: 10,
          feedback: "Nice recovery. Safety and space matter most in this moment.",
          next: "step3A"
        },
        B: {
          text: "Keep picking up quickly so the room looks normal again.",
          score: 0,
          feedback: "Understandable, but it can accidentally keep the behavior going if AC is watching your reaction.",
          next: "step3B"
        },
        C: {
          text: "Tell him you are taking away stickers because he is making a mess.",
          score: -10,
          feedback: "This can spike frustration and is not the direction of the plan. Focus on calming and earning again later.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC escalates. He throws an item and yells. Students keep watching and talking about it.",
      choices: {
        A: {
          text: "Reset to safety. Call for support, move students away, and keep words minimal. Focus on creating space and supervision.",
          score: 10,
          feedback: "Good recovery. Reducing the audience and staying calm helps protect safety.",
          next: "step3A"
        },
        B: {
          text: "Keep talking to him so he understands how serious it is.",
          score: 0,
          feedback: "Long talking often keeps crisis going longer.",
          next: "step3B"
        },
        C: {
          text: "Argue with him until he stops.",
          score: -10,
          feedback: "Arguing usually increases crisis behavior and puts others at risk.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC begins to calm with space and adult support. He can use words for help or a break.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Keep it calm, supervised, and predictable.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC calms slightly, but keeps ramping back up and testing reactions.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "This often lasts longer when the audience stays and there is too much talking.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC stays in high crisis. The risk of someone getting hurt remains high.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is a safety concern. Adult support and space are critical.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "If the crisis keeps going and does not improve, what do you do?",
      choices: {
        A: {
          text: "Follow the safety plan. Keep adult support in place. If it lasts around 20 minutes with little sign of calming, use the code word “Luigi” and call Grandpa as planned. Debrief and document later.",
          score: 10,
          feedback: "Perfect. This keeps everyone safe and follows the plan.",
          ending: "success"
        },
        B: {
          text: "Handle it alone until it ends.",
          score: 0,
          feedback: "It is understandable, but the plan expects you to get support early for safety.",
          ending: "mixed"
        },
        C: {
          text: "Threaten bigger consequences to force it to end quickly.",
          score: -10,
          feedback: "Threats often escalate crisis behavior and can make safety worse.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed: Safety and Support",
      text: "You reduced the audience, got support, and used calm, short language until AC could settle."
    },
    mixed: {
      title: "Crisis Managed: But Took Longer",
      text: "The situation improved, but it lasted longer because support and space were not used early."
    },
    fail: {
      title: "Crisis Escalated",
      text: "Public attention, arguing, or threats increased escalation and made future incidents more likely."
    }
  }
});


/*************************************************
 * CRISIS SCENARIO 4 - Outside Elopement Risk (Recess or Lunch, Leaving the Area)
 **************************************************/
POOL.crisis.push({
  id: "crisis_4_outside_elopement_risk",
  title: "Red Alert: Outside Elopement Risk",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "You are outside at recess or walking near an outside exit. AC gets upset and suddenly runs toward a gate or an exit, away from the supervised area.",
      choices: {
        A: {
          text: "Call for adult support immediately. Keep your voice calm and short: “Stop. With me.” Move into safe proximity without turning it into a chase. Position yourself to block unsafe routes if you can do so safely.",
          score: 10,
          feedback: "Great. You keep it calm, get help, and avoid chase energy.",
          next: "step2A"
        },
        B: {
          text: "Yell his name and sprint after him to catch him quickly.",
          score: 0,
          feedback: "You are trying to keep him safe, but chasing can make him run faster and farther.",
          next: "step2B"
        },
        C: {
          text: "Stay with the rest of the class and assume someone else will handle it.",
          score: -10,
          feedback: "This is a major safety risk. AC needs immediate adult supervision and support.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC slows when you are close and calm, but he is still ready to bolt again. He yells, “I’m leaving!”",
      choices: {
        A: {
          text: "Use plan language: “Not yet.” Keep it short. Offer one option: “Help or break?” If he uses words, guide him to the nearest safe, supervised spot and keep the break short.",
          score: 10,
          feedback: "Perfect. You keep it predictable and give him a way to calm without escaping supervision.",
          next: "step3A"
        },
        B: {
          text: "Try to reason with him and explain why running is dangerous.",
          score: 0,
          feedback: "Reasoning usually works better after he is calm. Right now he needs short, calm directions.",
          next: "step3B"
        },
        C: {
          text: "Threaten a big consequence if he runs again.",
          score: -10,
          feedback: "Threats can increase escalation and make him more likely to bolt.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC looks back and speeds up, like the chase is fueling the run.",
      choices: {
        A: {
          text: "Stop the chase energy. Call for support and shift to calm, short language. Move into safe proximity and block unsafe routes if you can do so safely.",
          score: 10,
          feedback: "Nice recovery. The calmer the adults, the faster many students settle.",
          next: "step3A"
        },
        B: {
          text: "Keep chasing until he stops.",
          score: 0,
          feedback: "Chasing can increase running and make future incidents harder.",
          next: "step3B"
        },
        C: {
          text: "Yell louder so he knows you mean it.",
          score: -10,
          feedback: "Loud attention can escalate and increase running.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC gets farther away. Other students notice and start talking about it.",
      choices: {
        A: {
          text: "Immediately call for adult support and follow the safety plan. Do not send students. Adults respond, create safety, and reduce the audience.",
          score: 10,
          feedback: "Good recovery. This situation requires adult support right away.",
          next: "step3A"
        },
        B: {
          text: "Send a student to get help while you keep teaching.",
          score: 0,
          feedback: "Students should not manage emergencies. Adults should respond directly.",
          next: "step3B"
        },
        C: {
          text: "Wait to see if AC comes back on his own.",
          score: -10,
          feedback: "This is unsafe. Outside elopement needs immediate adult response.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC is back under adult supervision. He begins to calm and can use words for help or a break.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Keep it calm, supervised, and predictable.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC stays nearby but continues to test limits and tries to pull away again.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "This may last longer when adults are talking a lot or the area stays crowded.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC keeps attempting to leave supervision. Safety risk remains high.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is a serious safety situation. Adult support and calm routines are critical.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "If the situation continues and does not improve, what do you do?",
      choices: {
        A: {
          text: "Follow the safety plan. Keep adult support and supervision in place. If it lasts around 20 minutes with little sign of calming, use the code word “Luigi” and call Grandpa as planned. Document and debrief later.",
          score: 10,
          feedback: "Perfect. This matches the plan and keeps safety the priority.",
          ending: "success"
        },
        B: {
          text: "Handle it alone so it is not a big deal.",
          score: 0,
          feedback: "It is understandable, but the plan expects you to use support early for safety.",
          ending: "mixed"
        },
        C: {
          text: "Use threats to force compliance quickly.",
          score: -10,
          feedback: "Threats often escalate and can make outside elopement more likely.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed: Elopement Prevented",
      text: "You got support quickly, avoided chase energy, and kept AC under adult supervision until he could calm."
    },
    mixed: {
      title: "Crisis Managed: But Took Longer",
      text: "AC returned to supervision, but the situation lasted longer because support and calm routines were not used early."
    },
    fail: {
      title: "Safety Risk Increased",
      text: "Chasing, yelling, or delayed response increased risk and can make future elopement more likely."
    }
  }
});


/*************************************************
 * CRISIS SCENARIO 5 - High-Intensity Escalation (Long Duration, Follow the Call Plan)
 **************************************************/
POOL.crisis.push({
  id: "crisis_5_prolonged_escalation_call_plan",
  title: "Red Alert: Prolonged Escalation",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "AC is in a high-intensity moment. He is yelling, using inappropriate language, and refusing to move. The incident is not improving and adults are starting to feel stuck.",
      choices: {
        A: {
          text: "Call for support if you have not already. Reduce the audience, create space, and keep words short and calm. Focus on safety and supervision, not teaching or arguing.",
          score: 10,
          feedback: "Great. In prolonged moments, fewer words and more structure helps.",
          next: "step2A"
        },
        B: {
          text: "Keep explaining expectations and consequences until he gives in.",
          score: 0,
          feedback: "Long talking often keeps crisis going longer.",
          next: "step2B"
        },
        C: {
          text: "Try to solve the problem with a long conversation while he is still escalated.",
          score: -10,
          feedback: "This usually increases frustration. Problem-solving works better after he is calm.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "Time passes and AC is still highly upset. It is approaching the point where the plan says to make the call if there is little sign of calming.",
      choices: {
        A: {
          text: "Follow the plan. Use the code word “Luigi” and have the agreed adult call Grandpa if the incident is around 20 minutes with little calming. Keep supervising and keeping others safe.",
          score: 10,
          feedback: "Perfect. This matches the plan and supports safety when the situation is not improving.",
          next: "step3A"
        },
        B: {
          text: "Wait longer because you do not want to bother anyone.",
          score: 0,
          feedback: "It is understandable, but the plan is there to guide you and keep everyone safe.",
          next: "step3B"
        },
        C: {
          text: "Threaten a major consequence to try to end it fast.",
          score: -10,
          feedback: "Threats often escalate and can make the incident last longer.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC stays escalated. The room keeps reacting to him, and adults are talking a lot.",
      choices: {
        A: {
          text: "Reset to the plan: reduce words, reduce the audience, call for support, and prepare to use the call plan if the incident continues without calming.",
          score: 10,
          feedback: "Nice recovery. Getting back to the plan helps when things feel stuck.",
          next: "step3A"
        },
        B: {
          text: "Keep talking and wait for him to tire out.",
          score: 0,
          feedback: "This can stretch the incident and keep attention high.",
          next: "step3B"
        },
        C: {
          text: "Try to shame him into stopping.",
          score: -10,
          feedback: "Shame can escalate crisis behavior and damages trust.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC escalates again. The incident becomes longer and harder to manage. Safety risk stays high.",
      choices: {
        A: {
          text: "Reset immediately to safety supports and the call plan. Get adult support, reduce the audience, and prepare to use “Luigi” and call Grandpa if the incident continues without calming.",
          score: 10,
          feedback: "Good recovery. When intensity is high, structure and support matter most.",
          next: "step3A"
        },
        B: {
          text: "Keep trying to talk through it in the moment.",
          score: 0,
          feedback: "This often keeps the incident going longer.",
          next: "step3B"
        },
        C: {
          text: "Handle it alone and do not call anyone.",
          score: -10,
          feedback: "This increases safety risk and goes against the support plan.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "With support and a clear plan, the situation starts to shift. AC begins to calm enough to respond to short prompts.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Keep it calm and predictable until he is fully settled.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC is still escalated and adults feel like the incident is dragging on.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "This can happen when routines are unclear or support is delayed.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "The incident stays intense and the risk of aggression or elopement remains high.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is a high-risk situation. Support and the call plan are critical.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "After the incident ends, what is the best next step?",
      choices: {
        A: {
          text: "Debrief with the team when everyone is calm. Note what happened before the crisis, what helped, and what to adjust. Then return to the earning system and predictable routines.",
          score: 10,
          feedback: "Perfect. Calm reflection helps the plan get stronger over time.",
          ending: "success"
        },
        B: {
          text: "Move on and do not talk about it again.",
          score: 0,
          feedback: "Sometimes you need to move on, but a quick debrief can prevent the same crisis next time.",
          ending: "mixed"
        },
        C: {
          text: "Lecture AC about the behavior once he is tired so he learns his lesson.",
          score: -10,
          feedback: "Lectures often restart conflict and do not teach the replacement skills in a usable way.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Crisis Managed: Plan Followed",
      text: "You used support, reduced the audience, followed the call plan when needed, and debriefed after to strengthen routines."
    },
    mixed: {
      title: "Crisis Ended: But Learning Was Missed",
      text: "The incident ended, but without debriefing the team may miss a chance to prevent the next one."
    },
    fail: {
      title: "Crisis Pattern May Repeat",
      text: "Without support and a clear plan, long incidents may happen again and may increase risk for everyone."
    }
  }
});

/*************************************************
 * WILDCARD SCENARIO 1 - Surprise Change (Schedule Change)
 **************************************************/
POOL.wild.push({
  id: "wildcard_1_surprise_change_schedule",
  title: "Wildcard Mission: Surprise Schedule Change",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "Right before an activity, you learn there is a schedule change. The class will not be doing the planned activity. When you announce it, AC says, “No!” and starts ripping up his paper.",
      choices: {
        A: {
          text: "Stay calm and keep it short. Say, “Change.” Show him what is happening next and give a simple choice: “Do you want a quick break or help to start?” Remind him he can earn a Minecraft sticker for staying in class with a safe body for 5 to 10 minutes.",
          score: 10,
          feedback: "Great. You keep it calm, make the change clear, and give him a path to success.",
          next: "step2A"
        },
        B: {
          text: "Try to talk him through why the schedule changed and convince him it is fine.",
          score: 0,
          feedback: "Supportive, but too much talking can make the change feel bigger and more frustrating.",
          next: "step2B"
        },
        C: {
          text: "Tell him, “Stop acting like a baby,” so he knows it is not acceptable.",
          score: -10,
          feedback: "Harsh language can escalate quickly and does not teach what to do next.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC slows down but stays tense. He says, “I want the real one,” and looks toward the door.",
      choices: {
        A: {
          text: "Use plan language: “Not yet.” Keep it simple. Offer one option: “Help or break?” If he chooses break, keep it short and then restart with one tiny step.",
          score: 10,
          feedback: "Perfect. You keep it predictable and teach him what to do when he hears “not yet.”",
          next: "step3A"
        },
        B: {
          text: "Ignore him and move on with the new activity.",
          score: 0,
          feedback: "This might work sometimes, but he is showing signs of bolting risk and needs support.",
          next: "step3B"
        },
        C: {
          text: "Say, “Fine, you can go to the office,” so the class can move on.",
          score: -10,
          feedback: "This can make office-seeking more likely when plans change.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "While you explain, AC gets louder and rips more paper. Peers look over.",
      choices: {
        A: {
          text: "Stop the extra talking. Make it private. Say, “Try again.” Offer “help or break” and show the next step. Reduce the audience by redirecting peers.",
          score: 10,
          feedback: "Nice recovery. You bring it back to calm routines and reduce attention.",
          next: "step3A"
        },
        B: {
          text: "Keep explaining until he understands.",
          score: 0,
          feedback: "Explaining often does not work in the moment when he is escalated.",
          next: "step3B"
        },
        C: {
          text: "Threaten to take away stickers because he is ripping paper.",
          score: -10,
          feedback: "This can escalate and moves away from the plan’s focus on earning and restarting.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC gets more upset and starts knocking items off his desk.",
      choices: {
        A: {
          text: "Reset calmly. Create space and reduce the audience. Offer “help or break.” Keep words short and steady.",
          score: 10,
          feedback: "Good recovery. You protect safety and return to the routine.",
          next: "step3A"
        },
        B: {
          text: "Argue with him so he knows you mean it.",
          score: 0,
          feedback: "Arguing usually makes it worse.",
          next: "step3B"
        },
        C: {
          text: "Threaten a major consequence to force it to stop.",
          score: -10,
          feedback: "Threats often escalate and can increase unsafe behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC uses words and stays in the room. He takes a breath and can try the next step.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with stickers when he meets the time goal.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC calms a bit, but keeps complaining and testing the change.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the routine was not clearly strengthened.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and the class attention increases. The risk of leaving the area goes up.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward a bigger chain. Calm, predictable routines help prevent it.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "After 5 to 10 minutes of safe body in class, what do you do?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for handling the change and staying safe.” Give a Minecraft sticker for safe body (and a second sticker if he also got started).",
          score: 10,
          feedback: "Perfect. This strengthens coping with changes.",
          ending: "success"
        },
        B: {
          text: "Move on without mentioning the change.",
          score: 0,
          feedback: "Understandable, but you miss a chance to reinforce coping skills.",
          ending: "mixed"
        },
        C: {
          text: "Skip stickers because the change started rough.",
          score: -10,
          feedback: "If he meets the goal later, follow-through matters. The plan is about earning and restarting.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Handled a Change",
      text: "AC used help or break, stayed in class safely, and you reinforced his coping skills with the sticker plan."
    },
    mixed: {
      title: "Mixed Outcome: Change Happened",
      text: "The class moved on, but the coping routine was not clearly strengthened."
    },
    fail: {
      title: "Changes May Trigger Bigger Behavior",
      text: "Without clear routines and follow-through, schedule changes may lead to more escalation in the future."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 2 - Substitute Teacher (New Adult, Same Plan)
 **************************************************/
POOL.wild.push({
  id: "wildcard_2_substitute_teacher_same_plan",
  title: "Wildcard Mission: Substitute Day",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "There is a substitute teacher today. AC notices right away. He starts testing limits by walking around, touching items, and saying, “You can’t tell me what to do.”",
      choices: {
        A: {
          text: "Keep it calm and simple. The sub uses the same plan language: “Safe body in class earns a Minecraft sticker.” Offer “help or break,” and show the sticker chart so the rules feel familiar.",
          score: 10,
          feedback: "Great. The biggest help on sub days is keeping routines the same and predictable.",
          next: "step2A"
        },
        B: {
          text: "Let things slide because it is a different day and the sub is learning.",
          score: 0,
          feedback: "Understandable, but AC often does better when rules are the same, even with a new adult.",
          next: "step2B"
        },
        C: {
          text: "The sub raises their voice and tries to “take control” quickly.",
          score: -10,
          feedback: "Big reactions can make testing behavior worse and increase bolting or escalation.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC slows down but says, “I want the calm room now,” and looks toward the door.",
      choices: {
        A: {
          text: "Use plan language: “Not yet.” Point to the sticker chart: “When you earn stickers, then reward time.” Offer a small choice to start: “Do you want help starting or a quick break?”",
          score: 10,
          feedback: "Perfect. You keep the reward rules clear and give him a path to earning.",
          next: "step3A"
        },
        B: {
          text: "Say, “Maybe later,” without telling him how to earn it.",
          score: 0,
          feedback: "He may keep testing because the rule feels unclear.",
          next: "step3B"
        },
        C: {
          text: "Say, “No, and stop asking,” and turn away.",
          score: -10,
          feedback: "This can spike frustration and increase unsafe behavior.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC starts taking classroom items and peers watch. The sub looks unsure what to do.",
      choices: {
        A: {
          text: "Step in quickly and keep it calm. Say, “Try again.” Prompt “help or break,” and guide him back to his space. Remind about earning a sticker for safe body.",
          score: 10,
          feedback: "Nice recovery. You protect safety and help the sub keep routines consistent.",
          next: "step3A"
        },
        B: {
          text: "Let the sub handle it without support so they learn.",
          score: 0,
          feedback: "AC may escalate if the routine is unclear. A quick assist can prevent a crisis.",
          next: "step3B"
        },
        C: {
          text: "Have the sub threaten consequences to stop it fast.",
          score: -10,
          feedback: "Threats often escalate and can make sub days harder.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC gets louder and bolder. The room attention increases.",
      choices: {
        A: {
          text: "Reset to calm routines. Reduce the audience, keep words short, offer “help or break,” and follow the earning system once AC settles.",
          score: 10,
          feedback: "Good recovery. Calm and predictable is the goal, even with a new adult.",
          next: "step3A"
        },
        B: {
          text: "Keep pushing the power struggle until AC gives in.",
          score: 0,
          feedback: "Power struggles usually make the behavior bigger.",
          next: "step3B"
        },
        C: {
          text: "Send AC out of the room immediately to avoid disruption.",
          score: -10,
          feedback: "Leaving the room can become the go-to response if it works often.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC stays in class and follows the routine with support. The day becomes more predictable.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Consistency is your best friend on substitute days.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC calms a little, but keeps testing and the sub feels unsure.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the day may stay bumpy without consistent routines.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and the day becomes chaotic. Safety concerns increase.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward a crisis chain. Consistency and calm routines help prevent it.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "What is the best way to wrap up the sub-day moment?",
      choices: {
        A: {
          text: "Keep the same routines: safe body earns stickers, “not yet” with a clear path, and calm prompts for help or break. Follow through when AC meets the goal.",
          score: 10,
          feedback: "Perfect. Predictability reduces testing on sub days.",
          ending: "success"
        },
        B: {
          text: "Let the day be different and hope AC returns to normal tomorrow.",
          score: 0,
          feedback: "Sometimes that happens, but AC usually does better when today still has clear, familiar routines.",
          ending: "mixed"
        },
        C: {
          text: "Avoid rewards and focus only on consequences for the rest of the day.",
          score: -10,
          feedback: "This often increases escalation and makes it harder to get back to learning.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Sub Day Stayed Predictable",
      text: "AC responded to the same routines, and the team used calm prompts and follow-through to keep the day safe."
    },
    mixed: {
      title: "Mixed Outcome: Bumpy but Managed",
      text: "The day continued, but without strong consistency AC may keep testing with new adults."
    },
    fail: {
      title: "Sub Days Become High Risk",
      text: "Without calm, consistent routines, substitute days can trigger bigger behavior and safety concerns."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 3 - Peer Conflict (Keep Safety, Teach a Simple Script)
 **************************************************/
POOL.wild.push({
  id: "wildcard_3_peer_conflict_simple_script",
  title: "Wildcard Mission: Peer Conflict",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "A peer bumps AC’s chair. AC snaps, yells, and raises his hand like he might hit. Other kids freeze and watch.",
      choices: {
        A: {
          text: "Step in calmly, create space, and move the peer away. Keep it short: “Safe body.” Prompt a simple phrase: “Say, ‘Stop’ or ‘I need help.’” Call for another adult if you need support.",
          score: 10,
          feedback: "Great. You protect safety and give AC a simple replacement phrase that works in the moment.",
          next: "step2A"
        },
        B: {
          text: "Tell the peer to apologize right away so it is over.",
          score: 0,
          feedback: "Apologies can help later, but right now you need to make sure AC is calm and safe first.",
          next: "step2B"
        },
        C: {
          text: "Yell at AC to stop so he knows it is serious.",
          score: -10,
          feedback: "Loud attention can escalate the moment and increase aggression risk.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC breathes hard but stays in place. He says, “He did it on purpose!” and points at the peer.",
      choices: {
        A: {
          text: "Keep it short: “Not talking about it right now.” Offer “help or break.” Then return with one small step, like moving seats or starting the next activity.",
          score: 10,
          feedback: "Perfect. You avoid a back-and-forth and help him reset safely.",
          next: "step3A"
        },
        B: {
          text: "Ask him to explain every detail so you can decide who is right.",
          score: 0,
          feedback: "Problem-solving can happen later. Right now, too much talking can keep it heated.",
          next: "step3B"
        },
        C: {
          text: "Make him apologize immediately to the peer.",
          score: -10,
          feedback: "This can restart the conflict while he is still upset.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "The peer apologizes, but AC is still upset and continues yelling. Other students are watching.",
      choices: {
        A: {
          text: "Reset calmly. Create more space and reduce the audience. Prompt “safe body” and “help or break.”",
          score: 10,
          feedback: "Nice recovery. Safety and calm come before solving the conflict.",
          next: "step3A"
        },
        B: {
          text: "Keep trying to talk it out with both students in front of everyone.",
          score: 0,
          feedback: "This can keep attention high and the conflict may keep going.",
          next: "step3B"
        },
        C: {
          text: "Tell AC he will lose stickers if he yells.",
          score: -10,
          feedback: "This can escalate and moves away from the plan’s focus on earning and restarting.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC escalates more. He steps toward the peer and the risk of hitting increases.",
      choices: {
        A: {
          text: "Reset to safety. Call for support, create space, and keep your words short. Focus on keeping everyone safe and reducing the audience.",
          score: 10,
          feedback: "Good recovery. Safety first.",
          next: "step3A"
        },
        B: {
          text: "Keep scolding until he stops.",
          score: 0,
          feedback: "Scolding often escalates and increases aggression risk.",
          next: "step3B"
        },
        C: {
          text: "Tell the peer to deal with it because they started it.",
          score: -10,
          feedback: "This increases conflict and can make the moment unsafe.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC settles with space and support. He can use a simple phrase and stay in class safely.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with stickers once he meets the safe-body time goal.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC calms slightly but keeps re-starting the argument and watching for reactions.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "This may drag on without clear, calm routines and space.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "The conflict escalates and the room attention stays high. Safety risk increases.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward crisis. Space, support, and short calm language are critical.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "What is the best way to wrap up after everyone is calm?",
      choices: {
        A: {
          text: "Quickly teach a simple script for next time: “Stop,” “I need help,” or “I need a break.” Then return to the earning routine and follow through with stickers if AC meets the goal.",
          score: 10,
          feedback: "Perfect. You build a usable skill and keep the plan consistent.",
          ending: "success"
        },
        B: {
          text: "Move on and hope it does not happen again.",
          score: 0,
          feedback: "Sometimes you need to move on, but a quick script helps prevent the next conflict.",
          ending: "mixed"
        },
        C: {
          text: "Lecture AC about respect for a long time.",
          score: -10,
          feedback: "Long lectures can restart frustration and do not teach a simple next step he can use.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Conflict Was Managed Safely",
      text: "You protected safety, reduced the audience, taught a simple phrase, and returned to the earning routine."
    },
    mixed: {
      title: "Mixed Outcome: Conflict Ended",
      text: "The conflict ended, but the replacement phrase and routine were not clearly strengthened."
    },
    fail: {
      title: "Conflict May Escalate Again",
      text: "Without a clear script and calm routines, peer conflicts may lead to bigger behavior next time."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 4 - Late Arrival (Entering Calmly and Joining the Routine)
 **************************************************/
POOL.wild.push({
  id: "wildcard_4_late_arrival_join_routine",
  title: "Wildcard Mission: Late Arrival",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "AC arrives late. The class is already working. AC bursts in, talks loudly, and heads straight toward the door area like he might leave again.",
      choices: {
        A: {
          text: "Meet him quietly at the door and keep it calm. Say, “Welcome.” Give one clear direction: “With me.” Offer “help or break,” then guide him to one easy first step so he can earn a Minecraft sticker for safe body in class.",
          score: 10,
          feedback: "Great. You prevent the hallway loop and help him enter calmly with a simple plan.",
          next: "step2A"
        },
        B: {
          text: "Let him come in and figure it out while you keep teaching.",
          score: 0,
          feedback: "This might work sometimes, but late arrivals can be a high-risk moment for leaving or disruption.",
          next: "step2B"
        },
        C: {
          text: "Tell him in front of everyone, “You’re late again,” and lecture him about it.",
          score: -10,
          feedback: "Public attention can escalate and make it harder for him to settle into the routine.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC slows down but complains, “This is dumb.” He looks around to see if peers are watching.",
      choices: {
        A: {
          text: "Keep it private. Say, “Try again.” Prompt him to use words: “Help” or “Break.” Then start with one tiny task step and praise the first safe, calm moment.",
          score: 10,
          feedback: "Perfect. You reset fast and guide him into the routine.",
          next: "step3A"
        },
        B: {
          text: "Ignore the comment and hand him the full assignment.",
          score: 0,
          feedback: "He may need a smaller first step to settle and get started.",
          next: "step3B"
        },
        C: {
          text: "Tell him he will not get stickers if he talks like that.",
          score: -10,
          feedback: "Threats can escalate and do not teach a better entry routine.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC wanders, touches items, and starts talking to peers. The noise level rises.",
      choices: {
        A: {
          text: "Step in calmly and redirect privately: “With me.” Offer “help or break,” then give one simple step to start and remind him about earning a sticker for safe body for 5 to 10 minutes.",
          score: 10,
          feedback: "Nice recovery. You bring him into the routine without making it a big scene.",
          next: "step3A"
        },
        B: {
          text: "Keep teaching and address it when you have time.",
          score: 0,
          feedback: "It may grow into a bigger disruption if he does not get support quickly.",
          next: "step3B"
        },
        C: {
          text: "Call him out loudly so the class knows you are handling it.",
          score: -10,
          feedback: "Public attention can increase disruption and peer attention.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC gets louder and starts pushing a chair. He looks toward the hallway.",
      choices: {
        A: {
          text: "Reset calmly. Keep words short. Create space and prompt “help or break.” Get a second adult if you need support for safety.",
          score: 10,
          feedback: "Good recovery. Safety and calm routines first.",
          next: "step3A"
        },
        B: {
          text: "Keep lecturing until he calms down.",
          score: 0,
          feedback: "Lectures often keep the situation going longer.",
          next: "step3B"
        },
        C: {
          text: "Tell him to leave the room to cool down.",
          score: -10,
          feedback: "Leaving can become the go-to response if it works repeatedly.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC settles and joins the routine. He stays in class safely and starts a small task step.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Now follow through with stickers when he meets the time goal.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC is calmer but not engaged. He keeps looking for attention and wandering.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "Stable, but the entry routine was not clearly strengthened.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and attention increases. The risk of leaving the room goes up.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward crisis. Calm, predictable entry routines help prevent it.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "After 5 to 10 minutes of safe body in class, what do you do?",
      choices: {
        A: {
          text: "Quietly praise: “Thanks for coming in and joining the routine.” Give a Minecraft sticker for safe body (and a second sticker if he also got started on work).",
          score: 10,
          feedback: "Perfect. This strengthens late-arrival routines.",
          ending: "success"
        },
        B: {
          text: "Move on without mentioning it.",
          score: 0,
          feedback: "Understandable, but you miss a chance to reinforce a tough transition.",
          ending: "mixed"
        },
        C: {
          text: "Skip stickers because the arrival was messy.",
          score: -10,
          feedback: "If he meets the goal later, follow-through matters. The plan is about earning and restarting.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Late Arrival Went Smoothly",
      text: "AC entered calmly, used help or break, stayed in class safely, and you reinforced the routine with stickers."
    },
    mixed: {
      title: "Mixed Outcome: Entered, But Routine Was Light",
      text: "AC got in the room, but the routine was not clearly strengthened with feedback and stickers."
    },
    fail: {
      title: "Late Arrivals Stay High Risk",
      text: "Without calm entry routines and follow-through, late arrivals may trigger bigger disruption or leaving."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 5 - Fire Drill or Loud Alarm (Noise Trigger + Safety)
 **************************************************/
POOL.wild.push({
  id: "wildcard_5_fire_drill_noise_trigger",
  title: "Wildcard Mission: Fire Drill or Loud Alarm",
  start: "step1",
  steps: {

    // ---------- STEP 1 ----------
    step1: {
      text: "A loud alarm goes off. The class lines up quickly. AC covers his ears, starts yelling, and tries to push past the line toward the hallway.",
      choices: {
        A: {
          text: "Move right next to him and keep it calm and short: “With me.” Offer a simple support like headphones or covering ears. Focus on staying together and getting outside safely. Get a second adult if possible.",
          score: 10,
          feedback: "Great. During alarms, safety and calm, short directions matter most.",
          next: "step2A"
        },
        B: {
          text: "Tell him to stop yelling and get in line like everyone else.",
          score: 0,
          feedback: "He may not be able to calm yet. Short directions and supports work better during loud triggers.",
          next: "step2B"
        },
        C: {
          text: "Yell over the alarm so he hears you clearly.",
          score: -10,
          feedback: "More loud sound and big attention can increase panic and bolting risk.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A ----------
    step2A: {
      text: "AC stays close but is very tense. He tries to bolt again when the line starts moving.",
      choices: {
        A: {
          text: "Keep words minimal. Stay beside him, block unsafe routes if you can do so safely, and keep him moving with the group. Once outside, guide him to a safe spot with adult supervision until the noise stops.",
          score: 10,
          feedback: "Perfect. You keep him safe and limit extra talking during the drill.",
          next: "step3A"
        },
        B: {
          text: "Try to explain the fire drill and reassure him with lots of talking.",
          score: 0,
          feedback: "Reassurance is kind, but too much talking can raise stress during loud noise.",
          next: "step3B"
        },
        C: {
          text: "Let him run ahead so he gets away from the noise faster.",
          score: -10,
          feedback: "This increases safety risk. Staying with adults is the priority.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B ----------
    step2B: {
      text: "AC yells louder and pushes past peers. The line breaks and other students react.",
      choices: {
        A: {
          text: "Reset to safety. Move close, keep words short, and create space around him. Get adult support if available and guide him back to the line with you.",
          score: 10,
          feedback: "Nice recovery. Space and calm support help the line get back on track.",
          next: "step3A"
        },
        B: {
          text: "Keep correcting him while the line keeps moving.",
          score: 0,
          feedback: "Corrections alone may not work during a loud trigger.",
          next: "step3B"
        },
        C: {
          text: "Yell at him in front of everyone to stop the behavior fast.",
          score: -10,
          feedback: "Public yelling can increase panic and increase bolting risk.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C ----------
    step2C: {
      text: "AC gets more frantic and tries to break away. The situation becomes unsafe.",
      choices: {
        A: {
          text: "Call for adult support and reset to safety steps. Keep words short and calm. Focus on supervision, space, and staying together.",
          score: 10,
          feedback: "Good recovery. Safety is the priority during loud alarms.",
          next: "step3A"
        },
        B: {
          text: "Keep yelling so he listens.",
          score: 0,
          feedback: "More loud talking can make it worse.",
          next: "step3B"
        },
        C: {
          text: "Let him go and deal with it after the drill.",
          score: -10,
          feedback: "This is unsafe. He needs adult supervision and support immediately.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A ----------
    step3A: {
      text: "AC stays with adults and gets through the drill safely. Once it is quieter, he can use words again.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice. Keep it calm until everyone returns inside safely.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B ----------
    step3B: {
      text: "AC stays nearby but remains upset and keeps trying to pull away.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "This may last longer without calm proximity and safety supports.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C ----------
    step3C: {
      text: "AC escalates and safety risk remains high during the drill.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "This is moving toward crisis. Adult support and supervision are critical.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (ENDINGS) ----------
    step4: {
      text: "After the drill, what do you do next?",
      choices: {
        A: {
          text: "Once calm, praise the safety behavior: “Thanks for staying with me.” Then return to the earning routine. If he meets the safe-body time goal after the drill, follow through with a sticker.",
          score: 10,
          feedback: "Perfect. You reinforce safety and keep routines predictable.",
          ending: "success"
        },
        B: {
          text: "Move on quickly and do not mention it.",
          score: 0,
          feedback: "Sometimes needed, but a short praise can strengthen the safety routine for the next drill.",
          ending: "mixed"
        },
        C: {
          text: "Lecture him about how he behaved during the drill.",
          score: -10,
          feedback: "Lectures can restart stress. Short praise and returning to routine usually works better.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success: Drill Stayed Safe",
      text: "AC stayed with adults during a loud trigger and you reinforced the safety routine once he was calm."
    },
    mixed: {
      title: "Mixed Outcome: Got Through It",
      text: "The drill ended, but the safety routine was not clearly strengthened with feedback and follow-through."
    },
    fail: {
      title: "Drills Remain High Risk",
      text: "Without calm support and predictable routines, loud alarms may keep triggering unsafe behavior."
    }
  }
});


/* ============================================================
   DYNAMIC MISSION BUILDER — ADAPTED FOR BRANCHING
   ============================================================ */
function renderIntroCards() {
  // Make sure the welcome text is visible again (it gets hidden on feedback screens)
  if (storyText) storyText.style.display = 'block';

  // Remove any old summary panel if it exists
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

  showFeedback("The Wizard will chime in after every move.", "correct", +10);

  const rnd = srandom(seedFromDate());

  const drillBtn  = document.getElementById('btn-drill');
  const crisisBtn = document.getElementById('btn-crisis');
  const randomBtn = document.getElementById('btn-random');

  if (drillBtn) {
    drillBtn.onclick = () => {
      resetGame();
      startDynamicMission('Daily Drill', pickScenario(POOL.daily, rnd));
    };
  }

  if (crisisBtn) {
    crisisBtn.onclick = () => {
      resetGame();
      startDynamicMission('Emergency Sim', pickScenario(POOL.crisis, rnd));
    };
  }

  if (randomBtn) {
    randomBtn.onclick = () => {
      resetGame();
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
      <li><strong>Keep setting AC up for success</strong> before predictable hard moments (whole group, transitions, waiting, unstructured time).</li>
      <li><strong>Keep directions short and calm</strong> and use simple prompts like “With me,” “Try again,” and “Help or break” instead of long explanations.</li>
      <li><strong>Keep the earning system strong</strong>: follow through on Minecraft stickers quickly for safe body and getting started, and keep praise quiet and private.</li>
      <li><strong>Your quick resets are working</strong>. When you notice early signs, stepping in early and calmly is helping him get back on track.</li>
    </ul>`;
} 
else if (pct >= 50) {
  actionSteps = `
    <ul>
      <li><strong>Prompt earlier</strong> before known tough moments (lining up, coming back from specials, new activities, waiting).</li>
      <li><strong>Coach the “what to do instead” right away</strong>: “Help or break,” “Hand up and wait,” or “Safe hands,” before peers start watching.</li>
      <li><strong>Use one clear step</strong> (one short direction at a time), then notice it fast when he does it and follow through with the sticker plan.</li>
      <li><strong>If behavior starts to get big</strong>, make it smaller: move closer, lower your voice, reduce the audience, and avoid debates.</li>
    </ul>`;
} 
else {
  actionSteps = `
    <ul>
      <li><strong>Rebuild the basics</strong>: clear expectations, clear adult proximity during transitions, and a visible “how to earn” path (safe body for 5 to 10 minutes earns a sticker).</li>
      <li><strong>Practice the key phrases when things are calm</strong> so they are ready in tough moments: “Help,” “Break,” “With me,” and “Not yet.”</li>
      <li><strong>During escalation, go calm and simple</strong>: short words, minimal talking, create space, reduce the audience, and focus on safety first.</li>
      <li><strong>If there is any leaving-the-area risk</strong>, follow the safety plan exactly: get adult support, keep eyes on AC, avoid chasing, and use the call plan (“Luigi” and Grandpa) if the incident is long and not improving.</li>
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
