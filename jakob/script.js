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
 * REQUIRED GLOBAL ELEMENT REFERENCES & SCORING
 **************************************************/

// These must match your HTML IDs exactly
const storyText      = document.getElementById("story-text");
const choicesDiv     = document.getElementById("choices");
const scenarioTitle  = document.getElementById("scenario-title");
const pointsEl       = document.getElementById("points");

// global points tracking
let points = 0;
let maxPossible = 0;

// updates the number in the toolbar
function setPoints(v) {
  points = v;
  if (pointsEl) {
    pointsEl.textContent = points;
    pointsEl.classList.remove("flash");
    requestAnimationFrame(() => pointsEl.classList.add("flash"));
  }
}

// apply delta (+10, 0, -10)
function addPoints(delta) {
  if (typeof delta === "number") {
    maxPossible += 10;
    setPoints(points + delta);
  }
}

/*************************************************
 * RANDOM SCENARIO SELECTORS
 * (Needed for the mission buttons to work)
 **************************************************/
function getDailyScenario() {
  const arr = POOL.daily;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getCrisisScenario() {
  const arr = POOL.crisis;
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWildcardScenario() {
  const arr = POOL.wild;
  return arr[Math.floor(Math.random() * arr.length)];
}

/*************************************************
 * DAILY SCENARIO 1 — Morning Independent Work
 * Hybrid branching: step1 → step2A/B/C → step3A/B/C → step4 endings
 **************************************************/
POOL.daily.push({
  id: "daily_1_morning_independent",
  title: "Daily Mission: Morning Independent Work",
  start: "step1",
  steps: {
    // ---------- STEP 1 ----------
    step1: {
      text: "JM enters the classroom and sees his morning work on his desk. He looks overwhelmed, shifts in his seat, and glances toward the door.",
      choices: {
        A: {
          text: "Remind him he only needs to complete 50% and review how he earns Mario coins.",
          score: 10,
          feedback: "Great job! You reduced the task demand and made expectations clear. This supports JM’s replacement behavior and lowers the chance of escape. He takes a deep breath and slows his movements.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Try your best,” without reviewing expectations.",
          score: 0,
          feedback: "This is a neutral choice. JM hears that he should try, but he still doesn’t know what is expected. He keeps tapping his pencil and looks unsure.",
          next: "step2B"
        },
        C: {
          text: "Tell him he needs to complete all of the work today.",
          score: -10,
          feedback: "This increases the demand and makes escape more likely. JM pushes his chair back and looks toward the door, showing signs of avoidance.",
          next: "step2C"
        }
      }
    },

    // ---------- STEP 2A (improving path) ----------
    step2A: {
      text: "JM slows his movement and looks at you for reassurance.",
      choices: {
        A: {
          text: "Prompt him to request a break before starting work.",
          score: 10,
          feedback: "Excellent! Prompting a break keeps JM in the replacement behavior pathway. He considers the option calmly and prepares to ask.",
          next: "step3A"
        },
        B: {
          text: "Wait quietly to see if he begins working on his own.",
          score: 0,
          feedback: "Neutral choice. Giving space is not harmful, but JM still seems unsure about what to do. He hesitates over the paper.",
          next: "step3B"
        },
        C: {
          text: "Say, “No breaks yet—let’s get going.”",
          score: -10,
          feedback: "Denying breaks removes access to his replacement behavior. This increases anxiety and escape motivation. JM stiffens and looks away.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2B (neutral path) ----------
    step2B: {
      text: "JM taps his pencil and glances toward the calm-down corner.",
      choices: {
        A: {
          text: "Prompt a break request before he escalates.",
          score: 10,
          feedback: "Nice move. You offer an appropriate escape option that matches his BIP. JM starts to calm and look more regulated.",
          next: "step3A"
        },
        B: {
          text: "Give him space to see if he settles.",
          score: 0,
          feedback: "Neutral. This might help, but JM still looks uncertain and hasn’t engaged with the work yet.",
          next: "step3B"
        },
        C: {
          text: "Tell him he needs to stay in his seat.",
          score: -10,
          feedback: "Redirecting without offering the replacement behavior increases the chance of avoidance. JM’s tapping becomes more intense.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 2C (escalation path) ----------
    step2C: {
      text: "JM pushes his chair and starts pacing across the room.",
      choices: {
        A: {
          text: "Offer a prompt to request a break calmly.",
          score: 10,
          feedback: "Great repair strategy. You give JM a safe way to escape the task without eloping. He slows slightly and listens.",
          next: "step3A"
        },
        B: {
          text: "Tell him you’ll help him in a moment.",
          score: 0,
          feedback: "Neutral. This may or may not help him calm down, but it doesn’t teach or reinforce his replacement behavior.",
          next: "step3B"
        },
        C: {
          text: "Redirect him back to his desk.",
          score: -10,
          feedback: "Redirecting during escalation can increase running or aggression. JM pulls away and speeds up his pacing.",
          next: "step3C"
        }
      }
    },

    // ---------- STEP 3A (positive path, merge) ----------
    step3A: {
      text: "JM uses his replacement behavior and requests a break appropriately.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice work. JM accessed his replacement behavior and is ready to regulate with a break.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3B (neutral path, merge) ----------
    step3B: {
      text: "JM stays near his desk but doesn’t start working. He looks stuck.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He has not escalated, but he also hasn’t engaged. He may need a clear, supportive next step.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 3C (escalated path, merge) ----------
    step3C: {
      text: "JM begins jogging in small circles or moving toward the classroom door.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "JM is escalating. A supportive response is needed quickly to prevent elopement or aggression.",
          next: "step4"
        }
      }
    },

    // ---------- STEP 4 (final decision & endings) ----------
    step4: {
      text: "You now decide how to respond to JM’s current behavior and his need for a break.",
      choices: {
        A: {
          text: "Honor his break immediately, start the 5-minute timer, and reinforce his return.",
          score: 10,
          feedback: "Excellent fidelity to the BIP. You reinforce JM’s replacement behavior, support regulation, and keep him engaged in the routine.",
          ending: "success"
        },
        B: {
          text: "Allow a break after a short delay and offer help when you can.",
          score: 0,
          feedback: "Partial implementation. JM eventually gets a break and some support, but the delay may increase stress and reduce instructional time.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to return to work independently without a break.",
          score: -10,
          feedback: "Break access is removed, which increases escape-maintained behavior. JM is more likely to escalate or leave his area, and additional staff support may be needed.",
          ending: "fail"
        }
      }
    }
  },

  // ---------- ENDINGS ----------
  endings: {
    success: {
      title: "Success – High-Fidelity Morning Routine",
      text: "You followed JM’s BIP closely. He accessed his break through the replacement behavior, regulated in the calm-down corner, and returned to finish part of his work. The class routine stayed mostly on track."
    },
    mixed: {
      title: "Mixed Outcome – Some Support, Some Escalation Risk",
      text: "You used pieces of the BIP, but delays and unclear expectations made the routine less smooth. JM eventually worked with support, but stress and lost instructional time were higher than they needed to be."
    },
    fail: {
      title: "Escalation – Low-Fidelity Implementation",
      text: "JM did not have consistent access to his replacement behavior or break. His behavior escalated, increasing the likelihood of elopement or aggression. Reviewing proactive strategies, reduced demands, and timely breaks could improve outcomes next time."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 2 — Writing Task Avoidance
 **************************************************/
POOL.daily.push({
  id: "daily_2_writing",
  title: "Daily Mission: Writing Task Avoidance",
  start: "step1",
  steps: {
    step1: {
      text: "During writing time, JM is asked to write three sentences about his weekend. He looks away, slouches, and taps his pencil rapidly.",
      choices: {
        A: {
          text: "Remind him he only needs to complete 50% and offer sentence starters.",
          score: 10,
          feedback: "Great job! You reduced the task demand and helped JM access success. He looks more willing to try.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Just write a little bit.”",
          score: 0,
          feedback: "Neutral choice. JM may start, but expectations are still unclear. He looks unsure.",
          next: "step2B"
        },
        C: {
          text: "Tell him he must write all three sentences.",
          score: -10,
          feedback: "Increased demand raises escape motivation. JM pushes his paper away and looks toward the door.",
          next: "step2C"
        }
      }
    },

    /* ---------- STEP 2A (improving path) ---------- */
    step2A: {
      text: "JM looks at the sentence starter you provided.",
      choices: {
        A: {
          text: "Prompt him to request a break before writing.",
          score: 10,
          feedback: "Excellent! Prompting a break supports regulation and reduces avoidance.",
          next: "step3A"
        },
        B: {
          text: "Wait to see if he begins independently.",
          score: 0,
          feedback: "Neutral. JM hesitates and looks uncertain.",
          next: "step3B"
        },
        C: {
          text: "Tell him to start writing now.",
          score: -10,
          feedback: "Directing him increases escape-driven behavior. JM taps his pencil harder.",
          next: "step3C"
        }
      }
    },

    /* ---------- STEP 2B (neutral path) ---------- */
    step2B: {
      text: "JM twirls his pencil and looks at his backpack.",
      choices: {
        A: {
          text: "Prompt a break request before he escalates.",
          score: 10,
          feedback: "Nice move. You're supporting his replacement behavior early.",
          next: "step3A"
        },
        B: {
          text: "Allow a little time to see if he starts.",
          score: 0,
          feedback: "Neutral. He still seems stuck.",
          next: "step3B"
        },
        C: {
          text: "Redirect him to begin the sentence.",
          score: -10,
          feedback: "Redirecting during avoidance can increase stress. JM scoots in his chair.",
          next: "step3C"
        }
      }
    },

    /* ---------- STEP 2C (escalation path) ---------- */
    step2C: {
      text: "JM pushes his paper off the desk.",
      choices: {
        A: {
          text: "Offer a break prompt to help him regulate.",
          score: 10,
          feedback: "Great repair strategy! Prompting a break gives JM a safe alternative.",
          next: "step3A"
        },
        B: {
          text: "Tell him you'll help in a moment.",
          score: 0,
          feedback: "Neutral. He remains uncertain.",
          next: "step3B"
        },
        C: {
          text: "Ask him firmly to pick the paper up.",
          score: -10,
          feedback: "Redirecting during escalation may worsen behavior. JM stiffens.",
          next: "step3C"
        }
      }
    },

    /* ---------- STEP 3A/B/C → MERGE ---------- */
    step3A: {
      text: "JM requests a break appropriately.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice—JM used his replacement behavior.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM stays seated but looks frozen.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He hasn’t escalated but still needs support.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM starts sliding off his chair or walking away.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "JM is escalating. Quick support is needed.",
          next: "step4"
        }
      }
    },

    /* ---------- STEP 4 (ENDING) ---------- */
    step4: {
      text: "How do you respond to JM’s behavior now?",
      choices: {
        A: {
          text: "Honor his break immediately and reinforce his return.",
          score: 10,
          feedback: "Excellent support aligned with his BIP.",
          ending: "success"
        },
        B: {
          text: "Allow a break after a delay.",
          score: 0,
          feedback: "Partial support, but delayed assistance increases stress.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to return to work independently.",
          score: -10,
          feedback: "This removes access to replacement behavior and increases escalation risk.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Regulated Writing Routine",
      text: "JM takes a calm break, returns, and completes some writing with support."
    },
    mixed: {
      title: "Mixed Outcome – Partial Support",
      text: "JM eventually writes with help, but delays increased frustration."
    },
    fail: {
      title: "Escalation – Low Fidelity",
      text: "JM escalates into avoidance behaviors and may require assistance."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 3 — Math Work With Peer Support
 **************************************************/
POOL.daily.push({
  id: "daily_3_math",
  title: "Daily Mission: Math Task Support",
  start: "step1",
  steps: {
    step1: {
      text: "During math, JM sees a worksheet with many problems. He taps rapidly and avoids looking at the page.",
      choices: {
        A: {
          text: "Remind him he only needs 50% and offer to start the first problem with him.",
          score: 10,
          feedback: "Nice proactive support! JM looks at the worksheet calmly.",
          next: "step2A"
        },
        B: {
          text: "Tell him to pick any problem he wants to start with.",
          score: 0,
          feedback: "Neutral. JM still looks unsure.",
          next: "step2B"
        },
        C: {
          text: "Tell him he must finish the whole worksheet.",
          score: -10,
          feedback: "Increasing the demand raises escape motivation. JM pulls his chair away.",
          next: "step2C"
        }
      }
    },

    /* STEP 2A — Improving */
    step2A: {
      text: "JM looks at the first problem with you.",
      choices: {
        A: {
          text: "Prompt him to ask for a break if he needs one.",
          score: 10,
          feedback: "Great! Prompting his replacement behavior reduces avoidance.",
          next: "step3A"
        },
        B: {
          text: "Wait silently for him to start.",
          score: 0,
          feedback: "Neutral—he hesitates.",
          next: "step3B"
        },
        C: {
          text: "Tell him to finish this line of problems.",
          score: -10,
          feedback: "Direct commands during avoidance increase stress.",
          next: "step3C"
        }
      }
    },

    /* STEP 2B — Neutral */
    step2B: {
      text: "JM flips his pencil over and over.",
      choices: {
        A: {
          text: "Prompt an appropriate break request.",
          score: 10,
          feedback: "Good support. JM listens.",
          next: "step3A"
        },
        B: {
          text: "Give him space.",
          score: 0,
          feedback: "Neutral—he still looks unsure.",
          next: "step3B"
        },
        C: {
          text: "Tell him to stop fidgeting and begin.",
          score: -10,
          feedback: "Redirecting increases avoidance pressure.",
          next: "step3C"
        }
      }
    },

    /* STEP 2C — Escalation */
    step2C: {
      text: "JM pushes the worksheet off the desk.",
      choices: {
        A: {
          text: "Prompt a break request calmly.",
          score: 10,
          feedback: "Great repair—breaks reduce escalation.",
          next: "step3A"
        },
        B: {
          text: "Tell him you'll help soon.",
          score: 0,
          feedback: "Neutral.",
          next: "step3B"
        },
        C: {
          text: "Direct him to pick up the worksheet.",
          score: -10,
          feedback: "Redirecting during escalation increases pacing risk.",
          next: "step3C"
        }
      }
    },

    /* STEP 3A/B/C → merge */
    step3A: {
      text: "JM uses his replacement behavior and requests a break politely.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice job! He's using his supports.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM stays close but doesn't start the task.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He needs some structured help.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM begins moving around the room.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "He's escalating. More support needed.",
          next: "step4"
        }
      }
    },

    /* STEP 4 ENDINGS */
    step4: {
      text: "How do you support JM now?",
      choices: {
        A: {
          text: "Honor his break now and reinforce his return.",
          score: 10,
          feedback: "Excellent BIP fidelity!",
          ending: "success"
        },
        B: {
          text: "Allow a break after a short delay.",
          score: 0,
          feedback: "Partial support.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to continue working independently.",
          score: -10,
          feedback: "This removes access to his replacement behavior.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Math Support",
      text: "JM takes a break, returns calmly, and completes part of his math work."
    },
    mixed: {
      title: "Mixed – Delayed Support",
      text: "JM manages with help but remains somewhat dysregulated."
    },
    fail: {
      title: "Escalation – Support Needed",
      text: "JM escalates into avoidance and may need staff help."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 4 — Transition Back From Recess
 **************************************************/
POOL.daily.push({
  id: "daily_4_recess_transition",
  title: "Daily Mission: Transition Back from Recess",
  start: "step1",
  steps: {
    step1: {
      text: "Recess ends. JM lines up slowly, drags his feet, and hesitates at the classroom door.",
      choices: {
        A: {
          text: "Review expectations and how he earns Mario coins.",
          score: 10,
          feedback: "Great proactive support! JM enters more calmly.",
          next: "step2A"
        },
        B: {
          text: "Tell him to come inside with the class.",
          score: 0,
          feedback: "Neutral. He enters but looks hesitant.",
          next: "step2B"
        },
        C: {
          text: "Tell him he needs to hurry up.",
          score: -10,
          feedback: "Rushing increases anxiety and avoidance behaviors.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM enters slowly but cooperatively.",
      choices: {
        A: {
          text: "Prompt a break request once inside.",
          score: 10,
          feedback: "Great support—break prompts reduce transition stress.",
          next: "step3A"
        },
        B: {
          text: "Wait and see if he settles.",
          score: 0,
          feedback: "Neutral. JM hesitates at his desk.",
          next: "step3B"
        },
        C: {
          text: "Tell him to get straight to work.",
          score: -10,
          feedback: "This increases pressure and escape likelihood.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM enters but circles near his desk.",
      choices: {
        A: {
          text: "Prompt a break request.",
          score: 10,
          feedback: "Nice support—this redirects him into regulation.",
          next: "step3A"
        },
        B: {
          text: "Give him a moment.",
          score: 0,
          feedback: "Neutral. He stays uncertain.",
          next: "step3B"
        },
        C: {
          text: "Redirect him to begin quiet work.",
          score: -10,
          feedback: "This may push him into avoidance.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM stops in the doorway and steps backward.",
      choices: {
        A: {
          text: "Offer a break prompt.",
          score: 10,
          feedback: "Good repair strategy.",
          next: "step3A"
        },
        B: {
          text: "Tell him you’ll help soon.",
          score: 0,
          feedback: "Neutral.",
          next: "step3B"
        },
        C: {
          text: "Direct him firmly inside.",
          score: -10,
          feedback: "Directives during hesitation increase avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM requests a break appropriately.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He’s using his replacement behavior.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM lingers near his desk.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He may escalate without support.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM begins pacing.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Escalation risk rising.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How do you support JM now?",
      choices: {
        A: {
          text: "Honor a break now and reinforce his return.",
          score: 10,
          feedback: "Excellent!",
          ending: "success"
        },
        B: {
          text: "Allow a break after a short delay.",
          score: 0,
          feedback: "Partial support.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to start working independently.",
          score: -10,
          feedback: "Break access removed, increasing escalation.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Smooth Transition",
      text: "JM transitions calmly and rejoins class with support."
    },
    mixed: {
      title: "Mixed – Moderate Success",
      text: "Transition occurs, but with some dysregulation."
    },
    fail: {
      title: "Escalation – Assistance Needed",
      text: "JM becomes avoidant or escalates further."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 5 — Token Board Motivation
 **************************************************/
POOL.daily.push({
  id: "daily_5_token_motivation",
  title: "Daily Mission: Token Board Motivation",
  start: "step1",
  steps: {
    step1: {
      text: "JM enters the classroom unfocused during whole-group instruction. He wanders and peers at items on shelves.",
      choices: {
        A: {
          text: "Remind him how he earns Mario coins.",
          score: 10,
          feedback: "Great proactive reinforcement! JM looks more focused.",
          next: "step2A"
        },
        B: {
          text: "Say, “Let’s get started.”",
          score: 0,
          feedback: "Neutral. Not quite enough structure.",
          next: "step2B"
        },
        C: {
          text: "Tell him he doesn't get coins if he's moving around.",
          score: -10,
          feedback: "This introduces a punitive tone and increases avoidance.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM comes closer to the group.",
      choices: {
        A: {
          text: "Prompt a break request if he grows restless.",
          score: 10,
          feedback: "Smart support—prevents escalation.",
          next: "step3A"
        },
        B: {
          text: "Give space to see if he settles.",
          score: 0,
          feedback: "Neutral.",
          next: "step3B"
        },
        C: {
          text: "Ask him to sit still.",
          score: -10,
          feedback: "Directives increase avoidance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM wiggles and looks behind him.",
      choices: {
        A: {
          text: "Prompt a break request.",
          score: 10,
          feedback: "Great support.",
          next: "step3A"
        },
        B: {
          text: "Wait for him to settle.",
          score: 0,
          feedback: "Neutral.",
          next: "step3B"
        },
        C: {
          text: "Redirect him to focus.",
          score: -10,
          feedback: "Potentially escalating.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM begins wandering further.",
      choices: {
        A: {
          text: "Prompt a break request immediately.",
          score: 10,
          feedback: "Great repair!",
          next: "step3A"
        },
        B: {
          text: "Tell him you’ll help him soon.",
          score: 0,
          feedback: "Neutral.",
          next: "step3B"
        },
        C: {
          text: "Direct him to sit with the group.",
          score: -10,
          feedback: "Directives often increase avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM uses his replacement behavior and requests a break.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He’s regulated and ready.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM stays near the group but looks unsure.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He may need more support soon.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM wanders away from the carpet.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "He's escalating; break access is needed.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How do you support JM now?",
      choices: {
        A: {
          text: "Honor his break and reinforce his return.",
          score: 10,
          feedback: "Excellent implementation.",
          ending: "success"
        },
        B: {
          text: "Allow a break after a slight delay.",
          score: 0,
          feedback: "Partial support.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to return without a break.",
          score: -10,
          feedback: "Escalation likely.",
          ending: "fail"
        }
      }
    }
  },

  endings: {
    success: {
      title: "Success – Motivated & Regulated",
      text: "JM earns coins, takes a break, and re-engages smoothly."
    },
    mixed: {
      title: "Mixed – Partial Support",
      text: "JM manages but with lower regulation and reduced learning time."
    },
    fail: {
      title: "Escalation – Low Fidelity",
      text: "JM shows increased avoidance and may require assistance."
    }
  }
});
/*************************************************
 * DAILY SCENARIO 6 — Small Group Instruction
 **************************************************/
POOL.daily.push({
  id: "daily_6_small_group",
  title: "Daily Mission: Small Group Instruction",
  start: "step1",
  steps: {
    step1: {
      text: "During small group reading, JM is asked to join a group at the back table. He begins pacing near the shelves instead of sitting.",
      choices: {
        A: {
          text: "Review expectations and how he earns Mario coins before starting group.",
          score: 10,
          feedback: "Great proactive move. Clear expectations and reinforcement reduce anxiety about small group tasks. JM slows his pacing and looks toward the table.",
          next: "step2A"
        },
        B: {
          text: "Ask him to come sit with the group so you can start.",
          score: 0,
          feedback: "Neutral. He moves a little closer but still looks hesitant.",
          next: "step2B"
        },
        C: {
          text: "Tell him he needs to stay seated at the group table the whole time.",
          score: -10,
          feedback: "This increases pressure and may raise escape-maintained behavior. JM takes a step back from the table.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM moves closer to the table and touches the back of a chair.",
      choices: {
        A: {
          text: "Prompt him to request a break if he starts to feel overwhelmed.",
          score: 10,
          feedback: "Excellent support. Prompting a break gives him a safe option before behavior escalates.",
          next: "step3A"
        },
        B: {
          text: "Wait and see if he sits on his own.",
          score: 0,
          feedback: "Neutral. He hovers behind the chair and hesitates.",
          next: "step3B"
        },
        C: {
          text: "Tell him to sit down so group can start.",
          score: -10,
          feedback: "Directing him without support increases stress. He grips the chair tightly.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM comes partway over but begins pacing in a small circle near the group table.",
      choices: {
        A: {
          text: "Prompt an appropriate break request.",
          score: 10,
          feedback: "Nice move. You support his replacement behavior and reduce the need for escape.",
          next: "step3A"
        },
        B: {
          text: "Give him a minute and focus on other students.",
          score: 0,
          feedback: "Neutral. JM continues pacing and glancing at the table.",
          next: "step3B"
        },
        C: {
          text: "Remind him he needs to sit to participate.",
          score: -10,
          feedback: "This may feel like pressure and can trigger more avoidance.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM walks away from the table area and looks toward the door.",
      choices: {
        A: {
          text: "Offer a calm prompt to request a break.",
          score: 10,
          feedback: "Good repair. You give him a safer alternative than leaving the area.",
          next: "step3A"
        },
        B: {
          text: "Tell him you’ll get started with the group and he can join when ready.",
          score: 0,
          feedback: "Neutral. He hovers near the edge of the group space.",
          next: "step3B"
        },
        C: {
          text: "Direct him to come back and sit immediately.",
          score: -10,
          feedback: "Directives during escalation can increase elopement or refusal.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM uses his replacement behavior and asks for a break before joining.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice work—he is using the plan to regulate.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM stays near the table area but doesn’t sit. He watches the group quietly.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is not escalating but still not engaged. Support is still needed.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM moves further away from the group area and glances toward the classroom door.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "He is at higher risk for elopement or refusal.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How will you respond to support JM’s participation in small group?",
      choices: {
        A: {
          text: "Honor a break now and reinforce his return to the group afterward.",
          score: 10,
          feedback: "Excellent fidelity. Breaks and positive reinforcement help him rejoin instruction successfully.",
          ending: "success"
        },
        B: {
          text: "Allow a break after he attempts a small part of the activity.",
          score: 0,
          feedback: "Partial support. He may participate somewhat, but with more stress and less instruction time.",
          ending: "mixed"
        },
        C: {
          text: "Tell him he needs to join the group without taking a break.",
          score: -10,
          feedback: "Removing access to the replacement behavior increases the chance of avoidance or escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Supported Small Group Participation",
      text: "JM accesses a break, then returns to the table and participates in small group reading with support."
    },
    mixed: {
      title: "Mixed Outcome – Partial Engagement",
      text: "JM engages for a short time, but stress and limited support reduce the quality of instruction."
    },
    fail: {
      title: "Escalation – Limited Small Group Access",
      text: "JM avoids or escalates, missing most of the small group instruction and potentially needing additional staff support."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 7 — Teacher Busy With Another Student
 **************************************************/
POOL.daily.push({
  id: "daily_7_teacher_busy",
  title: "Daily Mission: Supporting JM While You’re Busy",
  start: "step1",
  steps: {
    step1: {
      text: "You are working 1:1 with another student when JM begins wandering around the room, looking at posters on the wall.",
      choices: {
        A: {
          text: "Give a quick reminder of expectations and his token board before returning to the other student.",
          score: 10,
          feedback: "Nice proactive reminder. This keeps expectations clear even while your attention is divided. JM pauses and looks at his token board.",
          next: "step2A"
        },
        B: {
          text: "Say, “Give me a minute, I’m helping someone else.”",
          score: 0,
          feedback: "Neutral. JM hears you but still doesn’t know what to do.",
          next: "step2B"
        },
        C: {
          text: "Tell him to sit down and wait quietly until you are done.",
          score: -10,
          feedback: "This increases waiting demands without clear support. Avoidance or escalation is more likely.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM moves closer to his desk but continues to look around the room.",
      choices: {
        A: {
          text: "Prompt him to request a break if he is feeling restless.",
          score: 10,
          feedback: "Great! You support his replacement behavior even while busy.",
          next: "step3A"
        },
        B: {
          text: "Keep working with the other student and watch JM from a distance.",
          score: 0,
          feedback: "Neutral. He may stay regulated, but he still looks unsure.",
          next: "step3B"
        },
        C: {
          text: "Tell him he needs to sit and wait until you are done.",
          score: -10,
          feedback: "This adds delay without support and may increase escape behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM walks slowly between desks and hums quietly.",
      choices: {
        A: {
          text: "Prompt an appropriate break request from across the room.",
          score: 10,
          feedback: "Nice distance support. You cue his replacement behavior without stopping instruction.",
          next: "step3A"
        },
        B: {
          text: "Let him wander as long as he isn’t disruptive.",
          score: 0,
          feedback: "Neutral. It keeps the room calm, but doesn’t teach or reinforce expectations.",
          next: "step3B"
        },
        C: {
          text: "Redirect him sharply to sit down.",
          score: -10,
          feedback: "Sharp redirection increases anxiety and escape motivation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM stops near the classroom door and looks back at you.",
      choices: {
        A: {
          text: "Offer a quick prompt to request a break and point to the calm-down corner.",
          score: 10,
          feedback: "Excellent repair. You provide a safe, replacement-based option instead of elopement.",
          next: "step3A"
        },
        B: {
          text: "Tell him you’ll talk with him when you are finished.",
          score: 0,
          feedback: "Neutral, but leaves him waiting and unsupervised at the door.",
          next: "step3B"
        },
        C: {
          text: "Tell him firmly to move away from the door and sit.",
          score: -10,
          feedback: "Firm directives near the exit can increase resistance or elopement.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM uses his replacement behavior and asks for a break appropriately, even while you are busy.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Great work teaching independence in using his plan.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM lingers and continues low-level wandering.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is not in crisis, but he is also not fully engaged or supported.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM becomes more restless and moves further from his work area.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "His behavior is escalating, and he may soon need more intensive support.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "Now that you can shift your attention back to JM, how do you respond?",
      choices: {
        A: {
          text: "Briefly honor his break and then help him re-engage with work.",
          score: 10,
          feedback: "Excellent balancing of support and instruction. You follow his BIP while keeping the class moving.",
          ending: "success"
        },
        B: {
          text: "Ask him to try a small amount of work and then offer a break.",
          score: 0,
          feedback: "Partial support that may work but with more stress and less clarity.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to sit and get to work without offering a break.",
          score: -10,
          feedback: "This removes access to his replacement behavior and increases escalation risk.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Managed While Busy",
      text: "JM uses his replacement behavior and receives a brief, meaningful break. He returns to his work with support while you still meet other students’ needs."
    },
    mixed: {
      title: "Mixed Outcome – Some Support, Some Stress",
      text: "JM eventually engages in work, but limited support while you were busy led to more stress and less efficient instruction."
    },
    fail: {
      title: "Escalation – Competing Demands",
      text: "Without access to planned supports while you were busy, JM escalates and may need additional staff help, making it hard to serve both him and the other student."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 8 — End-of-Day Routine
 **************************************************/
POOL.daily.push({
  id: "daily_8_end_of_day",
  title: "Daily Mission: End-of-Day Routine",
  start: "step1",
  steps: {
    step1: {
      text: "It is the end of the day. Students are cleaning up and packing. JM is wandering and lightly touching materials on other students’ desks instead of cleaning up.",
      choices: {
        A: {
          text: "Review end-of-day expectations and remind him how he can still earn Mario coins.",
          score: 10,
          feedback: "Great proactive reminder. Clear expectations and reinforcement even at the end of the day help JM stay engaged.",
          next: "step2A"
        },
        B: {
          text: "Say, “Time to clean up and pack.”",
          score: 0,
          feedback: "Neutral. JM hears the directive but may still feel unsure or unmotivated.",
          next: "step2B"
        },
        C: {
          text: "Tell him he needs to clean up quickly or he’ll miss dismissal.",
          score: -10,
          feedback: "Time pressure can increase stress and escape-maintained behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM moves toward his desk and looks at his materials.",
      choices: {
        A: {
          text: "Prompt a break request if he appears overwhelmed.",
          score: 10,
          feedback: "Nice support. You allow him to regulate before finishing tasks.",
          next: "step3A"
        },
        B: {
          text: "Wait to see if he starts cleaning independently.",
          score: 0,
          feedback: "Neutral. He hesitates and picks up one item slowly.",
          next: "step3B"
        },
        C: {
          text: "Tell him he should be able to handle this without a break.",
          score: -10,
          feedback: "This removes access to his replacement behavior and may increase avoidance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM looks around the room and lightly taps a nearby chair.",
      choices: {
        A: {
          text: "Prompt a break request before he escalates.",
          score: 10,
          feedback: "Good early support that keeps the routine calm.",
          next: "step3A"
        },
        B: {
          text: "Let him wander for a short time.",
          score: 0,
          feedback: "Neutral. The room stays calm, but JM still isn’t following expectations.",
          next: "step3B"
        },
        C: {
          text: "Redirect him sharply to start cleaning up.",
          score: -10,
          feedback: "Sharp redirection near the end of the day can increase refusal.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM stops and looks frozen in the middle of the room.",
      choices: {
        A: {
          text: "Offer a calm prompt to request a short break before finishing.",
          score: 10,
          feedback: "Great repair. A brief break can help him finish successfully.",
          next: "step3A"
        },
        B: {
          text: "Tell him you’ll check on him after helping another student.",
          score: 0,
          feedback: "Neutral. He remains unsure what to do.",
          next: "step3B"
        },
        C: {
          text: "Remind him that everyone else is already finished.",
          score: -10,
          feedback: "Social comparison can increase anxiety and avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM asks for a short break appropriately.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is using his replacement behavior even at the end of the day.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM slowly picks up one or two items but then stops.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is partially engaging but still needs support.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM drops the items and walks away from his area.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "He is moving toward avoidance and may escalate without support.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How do you support JM in finishing the end-of-day routine?",
      choices: {
        A: {
          text: "Honor a short break now and then help him finish cleaning up.",
          score: 10,
          feedback: "Excellent BIP alignment. A brief break followed by support allows him to complete the routine successfully.",
          ending: "success"
        },
        B: {
          text: "Ask him to finish a small part and then allow a break.",
          score: 0,
          feedback: "Partial support that may work, but with more stress and less predictability for JM.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to finish cleaning up without a break.",
          score: -10,
          feedback: "Removing break access increases the chance of refusal or dysregulation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Smooth End-of-Day Routine",
      text: "JM uses his supports to take a short break and then completes the end-of-day tasks with your help."
    },
    mixed: {
      title: "Mixed Outcome – Some Cleanup, Some Stress",
      text: "JM finishes some tasks but with more stress and less structure than needed for an ideal routine."
    },
    fail: {
      title: "Escalation – Unfinished Routine",
      text: "JM avoids or escalates during clean-up, leaving tasks incomplete and increasing end-of-day stress."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 9 — Whole-Group Carpet Lesson
 **************************************************/
POOL.daily.push({
  id: "daily_9_carpet_lesson",
  title: "Daily Mission: Whole-Group Carpet Lesson",
  start: "step1",
  steps: {
    step1: {
      text: "During a whole-group story on the carpet, JM sits at the edge and begins to lean back and look around the room.",
      choices: {
        A: {
          text: "Review expectations for carpet time and how he can earn Mario coins.",
          score: 10,
          feedback: "Great proactive strategy. Clear expectations and reinforcement reduce the chance of wandering.",
          next: "step2A"
        },
        B: {
          text: "Ask him to scoot closer to the group.",
          score: 0,
          feedback: "Neutral. He moves a little but still seems restless.",
          next: "step2B"
        },
        C: {
          text: "Tell him he needs to sit still and listen for the whole story.",
          score: -10,
          feedback: "High demands for stillness increase discomfort and escape behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM shifts closer and looks at the book.",
      choices: {
        A: {
          text: "Prompt a break request if he starts to look restless again.",
          score: 10,
          feedback: "Nice foresight. Prompting a break helps him regulate before he wanders.",
          next: "step3A"
        },
        B: {
          text: "Wait and see if he stays engaged.",
          score: 0,
          feedback: "Neutral. He listens, but his body still wiggles.",
          next: "step3B"
        },
        C: {
          text: "Remind him that he needs to sit up and not move around.",
          score: -10,
          feedback: "Extra directives can increase discomfort and avoidance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM scoots in slightly but starts to lean on his hands and glance behind him.",
      choices: {
        A: {
          text: "Prompt an appropriate break request.",
          score: 10,
          feedback: "Good support. You keep the lesson calm while supporting his needs.",
          next: "step3A"
        },
        B: {
          text: "Ignore the restlessness as long as he is quiet.",
          score: 0,
          feedback: "Neutral. This may be okay, but it doesn’t teach or reinforce expectations.",
          next: "step3B"
        },
        C: {
          text: "Tell him to stop moving and pay attention.",
          score: -10,
          feedback: "Directives may lead him to leave the carpet.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM shifts further away and starts edging toward the back of the carpet area.",
      choices: {
        A: {
          text: "Offer a calm prompt to request a break.",
          score: 10,
          feedback: "Great repair. You offer a replacement-aligned way to step away without wandering.",
          next: "step3A"
        },
        B: {
          text: "Tell him you’ll talk with him after the story.",
          score: 0,
          feedback: "Neutral, but does not give him support in the moment.",
          next: "step3B"
        },
        C: {
          text: "Direct him to come back to his spot immediately.",
          score: -10,
          feedback: "This can feel threatening and may trigger escape.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM uses his replacement behavior and asks for a break from the carpet.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "Nice! He is using the plan to stay regulated.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM remains on the carpet but looks increasingly uncomfortable.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is holding it together, but support would help.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM leaves the carpet area and moves toward the shelves.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "He is now avoiding the group activity. Extra support is needed.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How do you respond to JM’s behavior during the carpet lesson?",
      choices: {
        A: {
          text: "Allow a brief break and then support him to rejoin the carpet or a nearby seat.",
          score: 10,
          feedback: "Excellent support. He stays connected to the lesson with appropriate breaks.",
          ending: "success"
        },
        B: {
          text: "Ask him to sit through a bit more of the story, then offer a break.",
          score: 0,
          feedback: "Partial support. He may manage, but with more discomfort and less clarity.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to stay on the carpet without a break.",
          score: -10,
          feedback: "Removing break access increases the chance of wandering or refusal.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Supported Carpet Participation",
      text: "JM takes brief, planned breaks and returns to the lesson, staying mostly engaged and regulated."
    },
    mixed: {
      title: "Mixed Outcome – Some Engagement, Some Stress",
      text: "JM participates but with more discomfort and less consistent support than his BIP allows."
    },
    fail: {
      title: "Escalation – Carpet Avoidance",
      text: "JM avoids or leaves the carpet and may need additional support to rejoin or participate in another way."
    }
  }
});


/*************************************************
 * DAILY SCENARIO 10 — Using the Calm-Down Corner Effectively
 **************************************************/
POOL.daily.push({
  id: "daily_10_calm_corner",
  title: "Daily Mission: Using the Calm-Down Corner",
  start: "step1",
  steps: {
    step1: {
      text: "JM appears frustrated during independent work and glances repeatedly at the calm-down corner.",
      choices: {
        A: {
          text: "Review how to use the calm-down corner and how he earns Mario coins when he returns.",
          score: 10,
          feedback: "Great proactive teaching. You clarify how the space works and connect it to positive reinforcement.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “Use the calm-down corner if you need it.”",
          score: 0,
          feedback: "Neutral. He has permission, but expectations are less clear.",
          next: "step2B"
        },
        C: {
          text: "Tell him the calm-down corner is only for serious problems.",
          score: -10,
          feedback: "Restricting access can reduce his use of replacement behaviors and increase escalation.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM nods and continues working for a moment.",
      choices: {
        A: {
          text: "Prompt him to request a break if he is still feeling upset.",
          score: 10,
          feedback: "Nice support. You encourage appropriate use of the corner before escalation.",
          next: "step3A"
        },
        B: {
          text: "Wait quietly to see if he chooses to use the corner.",
          score: 0,
          feedback: "Neutral. He may or may not use it effectively on his own.",
          next: "step3B"
        },
        C: {
          text: "Tell him to keep working and not worry about breaks right now.",
          score: -10,
          feedback: "Discouraging breaks increases the chance of escape-maintained behavior later.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM stands and walks slowly toward the calm-down corner.",
      choices: {
        A: {
          text: "Remind him briefly of expectations for using the space.",
          score: 10,
          feedback: "Good support. Clear expectations help him use the space appropriately.",
          next: "step3A"
        },
        B: {
          text: "Let him go without saying anything else.",
          score: 0,
          feedback: "Neutral. He may use it well or may play instead of regulating.",
          next: "step3B"
        },
        C: {
          text: "Tell him to make it quick because there is work to finish.",
          score: -10,
          feedback: "Time pressure reduces the calming effect and may increase stress.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM sighs heavily and begins tapping loudly on his desk.",
      choices: {
        A: {
          text: "Offer a calm prompt to request a break in the calm-down corner.",
          score: 10,
          feedback: "Great repair. You bring the calm-down corner back in as a proactive support.",
          next: "step3A"
        },
        B: {
          text: "Tell him to try to push through and finish his work.",
          score: 0,
          feedback: "Neutral, but not aligned with his BIP supports.",
          next: "step3B"
        },
        C: {
          text: "Remind him that the corner is not for small frustrations.",
          score: -10,
          feedback: "This discourages appropriate self-regulation and may increase escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM requests a break and goes to the calm-down corner, sitting quietly.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is using the calm-down space as intended.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM goes to the calm-down corner but begins playing with items instead of calming.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is not fully dysregulated, but the purpose of the space is not clear.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM stays at his desk and becomes more visibly upset.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Without access to the corner, his frustration is more likely to escalate.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How do you help JM transition out of the calm-down corner or back to his work?",
      choices: {
        A: {
          text: "After a short, calm break, praise his use of the corner, give a Mario coin, and help him ease back into the task.",
          score: 10,
          feedback: "Excellent BIP fidelity. You support regulation, reinforce replacement behavior, and scaffold the return to work.",
          ending: "success"
        },
        B: {
          text: "Tell him the break is over and ask him to return to work with a brief reminder.",
          score: 0,
          feedback: "Partial support. He may return, but without clear reinforcement or scaffolding.",
          ending: "mixed"
        },
        C: {
          text: "Tell him to get back to work on his own without additional support.",
          score: -10,
          feedback: "This makes the transition harder and may lead to renewed avoidance or escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Effective Calm-Down Corner Use",
      text: "JM uses the calm-down corner to regulate, then returns to his work with your support and earns reinforcement for doing so."
    },
    mixed: {
      title: "Mixed Outcome – Some Regulation, Less Support",
      text: "JM returns to work, but without strong reinforcement or structured transition, the benefit of the corner is reduced."
    },
    fail: {
      title: "Escalation – Missed Regulation Opportunity",
      text: "JM either escalates or returns to work without real regulation, making future work demands more challenging."
    }
  }
});
/*************************************************
 * CRISIS SCENARIO 1 — Elopement Out of Classroom
 **************************************************/
POOL.crisis.push({
  id: "crisis_1_elopement",
  title: "Crisis Mission: Elopement Out of Classroom",
  start: "step1",
  steps: {
    step1: {
      text: "When you hand JM a new assignment, he suddenly bolts out of the classroom doorway into the hall.",
      choices: {
        A: {
          text: "Call the office immediately per the crisis plan while ensuring another adult supervises the class.",
          score: 10,
          feedback: "Excellent crisis response. You follow the plan, request support, and protect supervision for the rest of the class.",
          next: "step2A"
        },
        B: {
          text: "Step into the hall to see where he went while leaving the class briefly.",
          score: 0,
          feedback: "Neutral. You monitor JM, but the classroom briefly lacks full supervision and you have not yet called for help.",
          next: "step2B"
        },
        C: {
          text: "Follow him down the hallway alone without calling the office.",
          score: -10,
          feedback: "Risky choice. The class is left unsupervised and you are managing elopement alone, increasing safety risks.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "Office staff answer the phone and begin sending help. You stand at the doorway where you can see both JM in the hallway and your class.",
      choices: {
        A: {
          text: "Maintain visual contact from a safe distance without chasing JM.",
          score: 10,
          feedback: "Great job. You reduce attention that can reinforce elopement while still monitoring safety.",
          next: "step3A"
        },
        B: {
          text: "Call his name and ask him to come back.",
          score: 0,
          feedback: "Neutral. This may or may not help, but gives extra attention to the elopement.",
          next: "step3B"
        },
        C: {
          text: "Walk quickly toward JM to try to guide him back.",
          score: -10,
          feedback: "Approaching can accidentally turn elopement into a chase, increasing running and safety risk.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "You see JM at the far end of the hallway. The class is momentarily unsupervised.",
      choices: {
        A: {
          text: "Quickly return to the room, call the office, and monitor JM from the doorway.",
          score: 10,
          feedback: "Good correction. You secure supervision for the class and bring in support.",
          next: "step3A"
        },
        B: {
          text: "Stay in the hall and continue trying to talk JM into coming back.",
          score: 0,
          feedback: "Neutral. You are engaged with JM, but the class is unsupervised and no support has been called.",
          next: "step3B"
        },
        C: {
          text: "Follow JM further down the hall, leaving the room completely.",
          score: -10,
          feedback: "This increases risk for both JM and the unsupervised class.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "You follow JM down the hallway. The rest of the class is alone in the room.",
      choices: {
        A: {
          text: "Stop, call the office from the hall, and ask another adult to supervise your room.",
          score: 10,
          feedback: "Good repair. You bring support into the crisis and address supervision for the class.",
          next: "step3A"
        },
        B: {
          text: "Continue walking behind JM and verbally ask him to stop and come back.",
          score: 0,
          feedback: "Neutral. You may slow him down, but you are still managing the crisis alone.",
          next: "step3B"
        },
        C: {
          text: "Run after JM and attempt to physically block his path.",
          score: -10,
          feedback: "Running and blocking can escalate the crisis and increase risk of injury.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM slows and stands near the end of the hall as additional staff arrive to help.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "You have followed the plan and now have support to help JM return safely.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM continues moving unpredictably down the hall while you try to talk with him.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "You are engaged, but the crisis is not well-contained and support is limited.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM speeds up, turning the situation into a chase. He approaches exits and other classrooms.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "The elopement is escalating, with increased safety risks and disruption.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "Support is beginning to arrive or could be called. How do you finalize your response?",
      choices: {
        A: {
          text: "Coordinate with support staff, maintain a calm presence, and help JM walk back safely once he slows.",
          score: 10,
          feedback: "Excellent crisis management. You used the plan, prioritized safety, and allowed JM to de-escalate with minimal extra attention.",
          ending: "success"
        },
        B: {
          text: "Ask another staff member to help while you walk with JM back to class.",
          score: 0,
          feedback: "Moderate response. JM returns, but the crisis relied on informal support rather than the full plan.",
          ending: "mixed"
        },
        C: {
          text: "Continue managing the situation mostly alone until the crisis team must step in.",
          score: -10,
          feedback: "The situation escalates enough that the full crisis team is required to bring JM back and restore safety.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Crisis Managed with Plan & Support",
      text: "You followed the crisis plan, notified the office, and coordinated support. JM de-escalated and walked back safely with minimal disruption, and your class remained supervised."
    },
    mixed: {
      title: "Mixed Outcome – Crisis Resolved with Moderate Disruption",
      text: "JM returned safely with some staff assistance, but aspects of supervision or communication could be improved next time to reduce disruption and risk."
    },
    fail: {
      title: "Crisis Team Activation – High-Intensity Response",
      text: "The elopement escalated and required full crisis team intervention. Reviewing the crisis plan, supervision procedures, and early responses could help prevent this level of escalation in the future."
    }
  }
});


/*************************************************
 * CRISIS SCENARIO 2 — Running Around Classroom
 **************************************************/
POOL.crisis.push({
  id: "crisis_2_running_classroom",
  title: "Crisis Mission: Running Around the Classroom",
  start: "step1",
  steps: {
    step1: {
      text: "During independent work, JM suddenly leaves his seat and begins sprinting between desk clusters, weaving around classmates.",
      choices: {
        A: {
          text: "Clear a safe path and quietly move other students out of his way.",
          score: 10,
          feedback: "Great crisis move. You prioritize safety for all students while avoiding additional attention to JM.",
          next: "step2A"
        },
        B: {
          text: "Ask JM to stop running and come sit down.",
          score: 0,
          feedback: "Neutral. You give a directive, but it may not be effective once he is already running.",
          next: "step2B"
        },
        C: {
          text: "Stand in his path to block him from running.",
          score: -10,
          feedback: "Physically blocking increases the risk of collision or aggression and can escalate the crisis.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "Students are moved to safer spots. JM continues running but with fewer obstacles.",
      choices: {
        A: {
          text: "Call the office according to the crisis plan while keeping visual contact.",
          score: 10,
          feedback: "Excellent. You add structured support while maintaining safety and distance.",
          next: "step3A"
        },
        B: {
          text: "Reduce your verbal attention, staying calm and monitoring JM.",
          score: 0,
          feedback: "Neutral-positive. You avoid fueling behavior, but haven’t yet requested backup.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice to demand he stop immediately.",
          score: -10,
          feedback: "Raised voice and urgency can increase arousal and running.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM glances at you but keeps running in circles.",
      choices: {
        A: {
          text: "Calmly move students to safe areas and call the office for support.",
          score: 10,
          feedback: "Good correction. You initiate the crisis plan and protect the rest of the class.",
          next: "step3A"
        },
        B: {
          text: "Continue repeating directions for him to sit down.",
          score: 0,
          feedback: "Neutral. Repeated directions may not reduce behavior and can add attention.",
          next: "step3B"
        },
        C: {
          text: "Move closer and try to grab his arm as he runs by.",
          score: -10,
          feedback: "This significantly increases risk of injury and escalation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "You step in front of JM. He veers sharply, knocking into a chair.",
      choices: {
        A: {
          text: "Back away, move students to safety, and call the office.",
          score: 10,
          feedback: "Good repair. You step out of his path and follow the crisis protocol.",
          next: "step3A"
        },
        B: {
          text: "Continue trying to block his path more carefully.",
          score: 0,
          feedback: "Neutral to risky. You might slow him, but physical blocking keeps risk high.",
          next: "step3B"
        },
        C: {
          text: "Physically restrain him to stop the running.",
          score: -10,
          feedback: "Physical restraint without support and training can be dangerous and is generally outside teacher role.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "Additional staff are on their way while you supervise from a distance with the class secured.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "You have contained risk and activated support.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM continues running, occasionally bumping into furniture or nearly colliding with items.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "The crisis remains active with moderate risk.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM becomes more agitated, yelling or flailing as he moves.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "The crisis is intensifying, and high-level support is likely needed.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "Support is available or en route. How is the crisis ultimately resolved?",
      choices: {
        A: {
          text: "Coordinate with support staff to calmly contain the area, give space, and help JM slow and sit when he is ready.",
          score: 10,
          feedback: "Excellent team-based response. Behavior de-escalates with safety and minimal attention.",
          ending: "success"
        },
        B: {
          text: "Have another staff member escort the class out while you and one other staff member remain with JM.",
          score: 0,
          feedback: "Moderate solution. The situation is contained, but requires additional class disruption.",
          ending: "mixed"
        },
        C: {
          text: "The crisis team is fully activated to manage JM’s behavior and restore safety.",
          score: -10,
          feedback: "A high-intensity response was needed. Reviewing early steps may help reduce future escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Contained Classroom Running",
      text: "You quickly implemented safety procedures, moved students, and coordinated support. JM slowed and sat with help, and the class remained as safe and calm as possible."
    },
    mixed: {
      title: "Mixed Outcome – Crisis Contained with Disruption",
      text: "JM’s behavior was managed with staff support and additional class disruption. Future planning can further reduce risk and disruption."
    },
    fail: {
      title: "Crisis Team Activation – High Risk Running",
      text: "JM’s running escalated to the point of requiring full crisis team intervention. Reviewing proactive supports and early steps can improve safety and outcomes in future incidents."
    }
  }
});


/*************************************************
 * CRISIS SCENARIO 3 — Aggression When Blocked
 **************************************************/
POOL.crisis.push({
  id: "crisis_3_aggression_blocked",
  title: "Crisis Mission: Aggression When Blocked",
  start: "step1",
  steps: {
    step1: {
      text: "JM moves quickly toward a restricted area of the room. When you step near him to redirect, he swings his arm and kicks toward you.",
      choices: {
        A: {
          text: "Move back out of range to keep yourself safe and reduce immediate conflict.",
          score: 10,
          feedback: "Excellent safety-first response. Increasing distance reduces risk of injury and may lower his arousal.",
          next: "step2A"
        },
        B: {
          text: "Ask him to calm down and tell him that hitting is not okay.",
          score: 0,
          feedback: "Neutral. The message is appropriate, but verbal reasoning alone may not de-escalate aggression.",
          next: "step2B"
        },
        C: {
          text: "Stay close and attempt to physically guide him away from the restricted area.",
          score: -10,
          feedback: "Physical guidance during active aggression increases safety risk and may escalate behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "You maintain distance while still watching JM carefully.",
      choices: {
        A: {
          text: "Call the office to request assistance per the crisis plan.",
          score: 10,
          feedback: "Great adherence to the plan. You are not handling aggression alone.",
          next: "step3A"
        },
        B: {
          text: "Reduce verbal interaction and give him some space to de-escalate.",
          score: 0,
          feedback: "Neutral-positive. Giving space helps, but you still may need support.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is going to lose privileges because of this behavior.",
          score: -10,
          feedback: "Consequences in the moment of crisis can escalate aggression rather than reduce it.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM yells and continues to swing, not responding to your words.",
      choices: {
        A: {
          text: "Step back to a safer distance and call the office for help.",
          score: 10,
          feedback: "Good correction. You prioritize safety and request support.",
          next: "step3A"
        },
        B: {
          text: "Continue telling him to calm down and stop hitting.",
          score: 0,
          feedback: "Neutral. Verbal reminders alone are unlikely to change his behavior in the moment.",
          next: "step3B"
        },
        C: {
          text: "Attempt to block his arms or legs with your hands.",
          score: -10,
          feedback: "Blocking increases physical contact and risk of injury for both of you.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "As you try to guide him, JM kicks harder and swings toward your torso.",
      choices: {
        A: {
          text: "Immediately release contact, move to a safer distance, and call the office.",
          score: 10,
          feedback: "Strong repair. You stop physical contact and access support.",
          next: "step3A"
        },
        B: {
          text: "Hold on more firmly and attempt to contain his movements.",
          score: 0,
          feedback: "Neutral to risky. Containment without support can escalate behavior and injury risk.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice to warn him about serious consequences.",
          score: -10,
          feedback: "Escalated tone plus physical contact can intensify the crisis.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "You maintain distance while help is contacted or arriving. JM’s swings become less intense.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "You are using distance and support to allow de-escalation.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM continues at a moderate level of aggression and shouting.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "The crisis is active and not yet fully contained.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM’s aggression increases, with louder yelling and more intense swings.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "The situation is worsening and more intensive crisis responses are likely needed.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "Support is available or could be activated. How is this crisis resolved?",
      choices: {
        A: {
          text: "Coordinate with support staff to maintain distance, provide a safe space, and allow JM to calm before discussing next steps.",
          score: 10,
          feedback: "Excellent team-based, de-escalation-focused response.",
          ending: "success"
        },
        B: {
          text: "Have another staff member help monitor him while you attend to the class and then return.",
          score: 0,
          feedback: "Moderate solution. The crisis ends with staff help but with some disruption to class and support roles.",
          ending: "mixed"
        },
        C: {
          text: "The crisis team is fully activated to manage the aggressive episode and ensure safety.",
          score: -10,
          feedback: "High-intensity intervention was needed. Reviewing early distance, support, and de-escalation strategies may reduce future crises.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Aggression Safely De-escalated",
      text: "You maintained safety, used distance, and coordinated with support to help JM calm without additional injury or escalation."
    },
    mixed: {
      title: "Mixed Outcome – Crisis Resolved with Support",
      text: "Aggression decreased with staff assistance, but there was moderate disruption. Future practice can improve early distance and calling procedures."
    },
    fail: {
      title: "Crisis Team Activation – Aggression Episode",
      text: "JM’s aggression required crisis team intervention. A review of early responses, distance, and attention patterns can guide improved responses next time."
    }
  }
});


/*************************************************
 * CRISIS SCENARIO 4 — Refusal to Re-enter After Break
 **************************************************/
POOL.crisis.push({
  id: "crisis_4_refusal_return",
  title: "Crisis Mission: Refusal to Re-enter After Break",
  start: "step1",
  steps: {
    step1: {
      text: "JM is in the calm-down corner after a difficult moment. The break timer has ended, but he refuses to leave the corner and return to his seat.",
      choices: {
        A: {
          text: "Provide space and maintain visibility while keeping your voice calm and neutral.",
          score: 10,
          feedback: "Great start. You avoid power struggles while still monitoring his safety.",
          next: "step2A"
        },
        B: {
          text: "Remind him that the timer is over and it’s time to return.",
          score: 0,
          feedback: "Neutral. The reminder is accurate but may create pressure without added support.",
          next: "step2B"
        },
        C: {
          text: "Walk over and try to physically guide him out of the corner.",
          score: -10,
          feedback: "Physical prompting can escalate refusal into aggression or a more intense crisis.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM stays in the corner, curled up but not moving toward his seat.",
      choices: {
        A: {
          text: "Briefly prompt him to use his words to request more break time if he needs it.",
          score: 10,
          feedback: "Nice. You prompt a replacement behavior instead of forcing the transition.",
          next: "step3A"
        },
        B: {
          text: "Continue giving him space without further interaction.",
          score: 0,
          feedback: "Neutral. He may calm, but also may stay stuck.",
          next: "step3B"
        },
        C: {
          text: "Tell him he is taking too long and must leave now.",
          score: -10,
          feedback: "This increases pressure and can escalate the situation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM pulls a cushion in front of his face and stays silent.",
      choices: {
        A: {
          text: "Shift to a calm prompt to use his break-request language for more time or help.",
          score: 10,
          feedback: "Good repair. You redirect the moment into a replacement-behavior opportunity.",
          next: "step3A"
        },
        B: {
          text: "Wait quietly a bit longer to see if he moves.",
          score: 0,
          feedback: "Neutral. The situation is unchanged.",
          next: "step3B"
        },
        C: {
          text: "Tell him that if he doesn't leave now, there will be consequences.",
          score: -10,
          feedback: "Adding threats increases stress and resistance.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "As you approach to guide him, JM tenses and pulls away from you.",
      choices: {
        A: {
          text: "Step back, give space, and switch to a calm verbal prompt for break-request language.",
          score: 10,
          feedback: "Solid repair. You reduce physical contact and focus on replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Hold your position near him and keep asking him to come out.",
          score: 0,
          feedback: "Neutral to slightly risky. Your presence may feel like pressure.",
          next: "step3B"
        },
        C: {
          text: "Continue trying to pull him gently out of the corner area.",
          score: -10,
          feedback: "Physical attempts to move him can escalate the crisis and risk aggression.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM uses his words to request a little more time or signals he needs extra support.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is using a more appropriate behavior to communicate his needs.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM remains withdrawn in the corner, neither escalating nor returning.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is stuck, and additional support or a plan adjustment may be needed.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM becomes louder, kicking the wall or pushing items in the corner.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "The situation is escalating into a more intense crisis.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How is this crisis around refusal to leave the corner ultimately resolved?",
      choices: {
        A: {
          text: "Honor a brief extension of break time with clear limits, then calmly support JM’s transition back to his seat.",
          score: 10,
          feedback: "Excellent. You balance flexibility with structure and help him return without power struggles.",
          ending: "success"
        },
        B: {
          text: "Ask for support from another staff member to help encourage JM back to his seat.",
          score: 0,
          feedback: "Moderate solution. The situation resolves with added help, though it could be smoother with earlier replacement prompts.",
          ending: "mixed"
        },
        C: {
          text: "Call the crisis team because the situation has escalated and he is not leaving the corner.",
          score: -10,
          feedback: "High-level intervention was needed. Reviewing transition language, break timings, and prompts may reduce future crises.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Supported Return from Break",
      text: "JM used his communication skills to ask for support, and you helped him return from the calm-down corner with minimal escalation."
    },
    mixed: {
      title: "Mixed Outcome – Resolved with Extra Support",
      text: "JM eventually returned with help from another adult. The situation ended safely but required more staff time and disruption than necessary."
    },
    fail: {
      title: "Crisis Team Activation – Corner Standoff",
      text: "Refusal escalated to a level requiring crisis team support. Future planning can focus on earlier prompts, flexible timing, and structured transitions."
    }
  }
});


/*************************************************
 * CRISIS SCENARIO 5 — Unsafe Behavior Near Doors
 **************************************************/
POOL.crisis.push({
  id: "crisis_5_unsafe_doors",
  title: "Crisis Mission: Unsafe Behavior Near the Door",
  start: "step1",
  steps: {
    step1: {
      text: "During a difficult work period, JM begins moving toward the classroom door, lingering near the handle and looking back at you.",
      choices: {
        A: {
          text: "Position yourself where you can see the door and JM without standing right next to him.",
          score: 10,
          feedback: "Great move. You monitor safety and reduce the chance of elopement without creating a power struggle at the door.",
          next: "step2A"
        },
        B: {
          text: "Tell him to move away from the door and go back to his seat.",
          score: 0,
          feedback: "Neutral. You set a limit, but may not address his underlying need to escape.",
          next: "step2B"
        },
        C: {
          text: "Stand directly between JM and the door, blocking his access.",
          score: -10,
          feedback: "Standing directly between him and the exit can increase tension and may escalate attempts to leave.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM rests his hand lightly on the door frame but does not open it.",
      choices: {
        A: {
          text: "Calmly prompt him to request a break away from the door area.",
          score: 10,
          feedback: "Excellent. You redirect him to a safer break option using his replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Watch quietly without adding additional prompts.",
          score: 0,
          feedback: "Neutral. The situation does not immediately worsen, but support is limited.",
          next: "step3B"
        },
        C: {
          text: "Remind him that being by the door is unsafe and he needs to move now.",
          score: -10,
          feedback: "Directives at the door can increase stress and elopement motivation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM looks at you when you tell him to move, but keeps one hand near the door.",
      choices: {
        A: {
          text: "Shift to a calm prompt to request a break in a different part of the room.",
          score: 10,
          feedback: "Nice repair. You offer a safe escape path that matches his BIP.",
          next: "step3A"
        },
        B: {
          text: "Repeat that he should move away from the door.",
          score: 0,
          feedback: "Neutral. Repetition may not change his behavior and can increase tension.",
          next: "step3B"
        },
        C: {
          text: "Walk over and place your hand on the door handle to prevent him from opening it.",
          score: -10,
          feedback: "Directly guarding the handle increases physical proximity and may escalate attempts to grab or push.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "You stand between JM and the door. He moves closer and reaches around you.",
      choices: {
        A: {
          text: "Step back to a safer position and prompt a break request away from the door.",
          score: 10,
          feedback: "Good repair. You increase space and reintroduce a safe replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Stay firmly in place and repeat that he cannot go out.",
          score: 0,
          feedback: "Neutral to risky. This may increase his frustration and attempts to push past you.",
          next: "step3B"
        },
        C: {
          text: "Use your body to keep the door fully blocked and hold the handle.",
          score: -10,
          feedback: "High risk for physical struggle and escalation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM steps slightly away from the door and begins to consider the break option.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is moving toward a safer behavior pattern.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM lingers close to the door, unsure whether to stay or attempt to leave.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "The situation is fragile and could escalate or de-escalate depending on next steps.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM pushes or pulls more intensely near the door, raising the risk of elopement or physical struggle.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "The crisis is intensifying and may require higher-level support.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "Support may be needed. How is this crisis around the door resolved?",
      choices: {
        A: {
          text: "Guide JM to take a supervised break away from the door with support from another adult if available.",
          score: 10,
          feedback: "Excellent. You redirect him to safety, use the BIP supports, and reduce door-related risks.",
          ending: "success"
        },
        B: {
          text: "Ask another staff member to monitor the door area while you support the rest of the class.",
          score: 0,
          feedback: "Moderate solution. The situation is contained but uses additional staff and splits attention.",
          ending: "mixed"
        },
        C: {
          text: "Activate the crisis team because behavior near the door has become unsafe and unresponsive to your prompts.",
          score: -10,
          feedback: "A high-level response was required. Reviewing proactive supports and early prompting near the door can improve future outcomes.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Door Safety Maintained",
      text: "You redirected JM away from the door using replacement behavior and support, keeping him and the class safe without major escalation."
    },
    mixed: {
      title: "Mixed Outcome – Door Area Managed with Support",
      text: "The situation was contained with help from another adult and ended safely, though with moderate disruption and staff time."
    },
    fail: {
      title: "Crisis Team Activation – Unsafe Door Behavior",
      text: "Behavior near the door escalated until the crisis team was needed. Future planning can focus on early prompts, space, and proactive break options away from exits."
    }
  }
});
/*************************************************
 * WILDCARD SCENARIO 1 — Assembly Day Schedule Change
 **************************************************/
POOL.wild.push({
  id: "wild_1_assembly",
  title: "Wildcard Mission: Assembly Day Schedule Change",
  start: "step1",
  steps: {
    step1: {
      text: "It’s assembly day. The schedule is different, and JM looks confused as students line up to leave the classroom at an unusual time.",
      choices: {
        A: {
          text: "Review the schedule change with JM and remind him how he can still earn Mario coins during the assembly.",
          score: 10,
          feedback: "Great proactive strategy. You give predictability and connect the new routine to his reinforcement system, reducing anxiety.",
          next: "step2A"
        },
        B: {
          text: "Tell him, “We’re going to an assembly now—let’s go.”",
          score: 0,
          feedback: "Neutral. He knows what’s happening, but doesn’t understand how it fits his plan.",
          next: "step2B"
        },
        C: {
          text: "Tell him there’s no time to explain; he just needs to keep up with the class.",
          score: -10,
          feedback: "Lack of explanation and added pressure increase JM’s uncertainty and escape motivation.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM nods and lines up near the middle of the line, still glancing back at the classroom.",
      choices: {
        A: {
          text: "Prompt him to use break-request language if he feels overwhelmed in the assembly.",
          score: 10,
          feedback: "Excellent. You generalize his replacement behavior to a new setting, preventing escalation.",
          next: "step3A"
        },
        B: {
          text: "Let him stay in line and move with the class without further support.",
          score: 0,
          feedback: "Neutral. He may be okay, but still looks unsure.",
          next: "step3B"
        },
        C: {
          text: "Remind him that he needs to stay quiet and still the whole time.",
          score: -10,
          feedback: "High demands in a new setting increase pressure and escape-maintained behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM lines up but stands near the back, looking restless and shifting his weight.",
      choices: {
        A: {
          text: "Walk briefly to the back of the line and remind him how he can earn Mario coins during the assembly.",
          score: 10,
          feedback: "Nice repair. You bring reinforcement and expectations to where he is.",
          next: "step3A"
        },
        B: {
          text: "Keep the line moving and hope he follows along.",
          score: 0,
          feedback: "Neutral. He moves but stays uneasy.",
          next: "step3B"
        },
        C: {
          text: "Tell him firmly to stop fidgeting and stay with the class.",
          score: -10,
          feedback: "Firm directives without support increase stress in a crowded setting.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM lags behind and looks as if he might step out of line or turn back toward the classroom.",
      choices: {
        A: {
          text: "Pause briefly to explain where you are going and when you will return, and offer a break prompt if he feels overwhelmed.",
          score: 10,
          feedback: "Good repair. You give clarity, predictability, and access to his replacement behavior.",
          next: "step3A"
        },
        B: {
          text: "Encourage him to keep walking with the line without additional detail.",
          score: 0,
          feedback: "Neutral. He may follow, but his anxiety stays high.",
          next: "step3B"
        },
        C: {
          text: "Tell him sharply that he must keep up or risk missing the assembly.",
          score: -10,
          feedback: "Threatening consequences during transitions increases avoidance.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM walks with the class into the assembly space and sits in the designated area, still a bit alert but staying with the group.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is managing the schedule change with support.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM enters the assembly space but sits on the edge, glancing around and shifting frequently.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is present but may need more support to remain regulated.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM hesitates at the doorway or steps to the side, unsure whether to join the group.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "He is close to avoiding the assembly and may escalate without support.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "Students are seated and the assembly begins. How do you support JM during the event?",
      choices: {
        A: {
          text: "Quietly remind him of break options (e.g., brief staff-supported walk) and how he’ll earn Mario coins for staying with the group.",
          score: 10,
          feedback: "Excellent support. You maintain safety, engagement, and BIP alignment in a new setting.",
          ending: "success"
        },
        B: {
          text: "Let him stay on the edge and watch, stepping in only if he becomes disruptive.",
          score: 0,
          feedback: "Moderate approach. He may stay regulated, but support and learning opportunities are limited.",
          ending: "mixed"
        },
        C: {
          text: "Insist that he sit perfectly still and silent or else there will be consequences later.",
          score: -10,
          feedback: "Rigid expectations in a difficult setting increase the chance of escalation or escape behavior.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Assembly Managed with Flexibility",
      text: "JM stayed with the group, used his supports in the new setting, and earned reinforcement for managing a tricky schedule change."
    },
    mixed: {
      title: "Mixed Outcome – Assembly with Some Strain",
      text: "JM attended the assembly but remained anxious and received limited proactive support. Reviewing how to bring his BIP into specials and assemblies could improve future experiences."
    },
    fail: {
      title: "Escalation – Assembly Stress",
      text: "JM struggled with the schedule change and expectations, leading to avoidance or disruptive behavior. Planning ahead for assemblies, seating, and break options can reduce stress next time."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 2 — Fire Drill During Work Time
 **************************************************/
POOL.wild.push({
  id: "wild_2_fire_drill",
  title: "Wildcard Mission: Fire Drill During Work Time",
  start: "step1",
  steps: {
    step1: {
      text: "During independent work, the fire alarm suddenly sounds. JM startles and looks around wide-eyed, hands over his ears.",
      choices: {
        A: {
          text: "Calmly say the practiced fire drill steps to the class, including JM, and remind him you’ll walk together.",
          score: 10,
          feedback: "Excellent. Safety and predictability both increase while you anchor him in the routine.",
          next: "step2A"
        },
        B: {
          text: "Tell everyone to line up quickly at the door without further explanation.",
          score: 0,
          feedback: "Neutral. The class moves, but JM still looks panicked and confused.",
          next: "step2B"
        },
        C: {
          text: "Focus on getting everyone out as fast as possible and do not address JM specifically.",
          score: -10,
          feedback: "You keep the class moving, but JM’s fear and confusion remain unsupported, increasing risk of bolting or freezing.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM stands up, still covering his ears, and moves slowly toward the line.",
      choices: {
        A: {
          text: "Prompt a quick break-type strategy for him (e.g., stand near you, use a visual, or walk at the front).",
          score: 10,
          feedback: "Great use of his support strategies within a safety drill. You reduce his fear while maintaining safety.",
          next: "step3A"
        },
        B: {
          text: "Let him join the line wherever he ends up.",
          score: 0,
          feedback: "Neutral. He is in line, but not anchored with specific supports.",
          next: "step3B"
        },
        C: {
          text: "Tell him he needs to move faster because this is important.",
          score: -10,
          feedback: "Extra pressure during a loud, unexpected alarm increases panic and escape behavior.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM stands halfway up from his seat, unsure whether to go to the line or stay put.",
      choices: {
        A: {
          text: "Move closer and briefly remind him: “We practiced this—stand with me and we’ll walk together.”",
          score: 10,
          feedback: "Nice repair. You connect the drill to prior practice and give him a safe anchor.",
          next: "step3A"
        },
        B: {
          text: "Repeat instructions to line up quickly.",
          score: 0,
          feedback: "Neutral. He may join the line but still feel panicked.",
          next: "step3B"
        },
        C: {
          text: "Call his name sharply and point to the line.",
          score: -10,
          feedback: "Sharp commands in a stressful moment raise his anxiety and may increase freezing or bolting.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "The class is lining up. JM remains at his desk, frozen and covering his ears.",
      choices: {
        A: {
          text: "Quickly move to his side, use calm, brief language, and guide him to stand near you in line.",
          score: 10,
          feedback: "Good repair. You blend safety, gentle guidance, and emotional support.",
          next: "step3A"
        },
        B: {
          text: "Tell him from across the room to follow everyone else.",
          score: 0,
          feedback: "Neutral, but distance and noise make it hard for him to process.",
          next: "step3B"
        },
        C: {
          text: "Direct the rest of the class out and plan to return for him if needed.",
          score: -10,
          feedback: "Leaving him behind in a drill is unsafe and increases fear.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM lines up close to you with his hands still near his ears but moving with the class toward the exit.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is following the drill with strong support.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM joins the line but stays tense and looks like he might try to run ahead or fall behind.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is moving, but his regulation is fragile.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM hesitates or moves unpredictably as the line exits, increasing safety risk.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "His fear and confusion remain high, and additional support is urgently needed.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "Outside at the meeting spot, the alarm is still sounding or just ending. How do you support JM now?",
      choices: {
        A: {
          text: "Use calm language to praise his safe walking, briefly review the drill, and connect it back to his plan and Mario coins.",
          score: 10,
          feedback: "Excellent. You reinforce his safe behavior and help him process the event.",
          ending: "success"
        },
        B: {
          text: "Allow him to stand close to you until the drill ends without further discussion.",
          score: 0,
          feedback: "Moderate support. He stays safe, but misses a chance to connect the drill to his coping strategies.",
          ending: "mixed"
        },
        C: {
          text: "Tell him that even though he was scared, he needs to handle drills better next time.",
          score: -10,
          feedback: "Critiquing his response in the moment can increase his fear and avoidance of future drills.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Fire Drill with Safety & Support",
      text: "JM followed the fire drill routine with your calm support and left the building safely. He received reinforcement and a chance to process the experience."
    },
    mixed: {
      title: "Mixed Outcome – Safe but Stressed",
      text: "JM exited safely, but remained very distressed. Additional practice, visuals, and BIP-aligned supports can help future drills go more smoothly."
    },
    fail: {
      title: "Escalation – Drill Distress",
      text: "JM’s distress created safety concerns or major dysregulation. Planning individualized fire drill supports and previewing drills can reduce future risk."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 3 — Testing Day (High Demand)
 **************************************************/
POOL.wild.push({
  id: "wild_3_testing_day",
  title: "Wildcard Mission: Testing Day",
  start: "step1",
  steps: {
    step1: {
      text: "It’s testing day with a longer, more demanding assessment. JM sees the test packet and immediately slumps in his chair, staring at the ceiling.",
      choices: {
        A: {
          text: "Explain how today’s test will work, what part he is responsible for, and how his usual BIP supports (like breaks) still apply.",
          score: 10,
          feedback: "Excellent. You reduce uncertainty and show that his supports are still available even on testing days.",
          next: "step2A"
        },
        B: {
          text: "Tell him to just do his best and start on page one.",
          score: 0,
          feedback: "Neutral. The encouragement is kind but leaves demands and supports unclear.",
          next: "step2B"
        },
        C: {
          text: "Tell him he needs to finish the entire test without breaks.",
          score: -10,
          feedback: "Removing supports on a high-demand day increases anxiety and escape-maintained behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM nods slowly and looks at the first page of the test.",
      choices: {
        A: {
          text: "Offer a clear plan: work for a short amount of time or a few questions, then take a brief BIP-aligned break.",
          score: 10,
          feedback: "Great scaffolding. You chunk the test and protect his regulation.",
          next: "step3A"
        },
        B: {
          text: "Let him begin on his own without additional structure.",
          score: 0,
          feedback: "Neutral. He may start, but is still vulnerable to feeling overwhelmed.",
          next: "step3B"
        },
        C: {
          text: "Remind him the test is very important and he needs to focus the whole time.",
          score: -10,
          feedback: "High-stakes language can increase stress and shutdown.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM flips the first page but then sighs and stares at the floor.",
      choices: {
        A: {
          text: "Clarify that he can still use his break-request behavior during testing following specific guidelines.",
          score: 10,
          feedback: "Nice repair. You reintroduce his BIP supports into a high-pressure context.",
          next: "step3A"
        },
        B: {
          text: "Encourage him again to ‘just try a little’ without specifying supports.",
          score: 0,
          feedback: "Neutral. He still may not understand how to cope with the length of the test.",
          next: "step3B"
        },
        C: {
          text: "Tell him that this time he has to push through without breaks so he can show what he knows.",
          score: -10,
          feedback: "This discourages self-regulation and increases avoidance.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM pushes the test packet away and leans over his desk.",
      choices: {
        A: {
          text: "Reassure him that the BIP still applies today and prompt a break request before starting.",
          score: 10,
          feedback: "Great repair. You calm him and reconnect the test to familiar supports.",
          next: "step3A"
        },
        B: {
          text: "Give him a minute with the test in front of him without saying more.",
          score: 0,
          feedback: "Neutral. His distress may or may not decrease on its own.",
          next: "step3B"
        },
        C: {
          text: "Remind him sharply that everyone else is working and he needs to start too.",
          score: -10,
          feedback: "Social comparison and pressure can increase shutdown or escape.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM requests a break appropriately or agrees to a short work-break cycle.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is using his plan even under high testing demands.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM holds his pencil but doesn’t begin writing. He seems frozen.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is not escalating, but he is also not accessing his supports.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM puts his head down or pushes the test off the desk.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "He is moving into stronger avoidance and may soon engage in more disruptive escape behavior.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How do you structure JM’s participation in the test for the rest of the session?",
      choices: {
        A: {
          text: "Use a clear, visual work-break routine (e.g., a few questions then a short break), reinforcing his effort and completion.",
          score: 10,
          feedback: "Excellent high-demand-day adaptation. You protect regulation and allow meaningful participation.",
          ending: "success"
        },
        B: {
          text: "Encourage him to complete a portion of the test without a formal work-break structure.",
          score: 0,
          feedback: "Moderate support. He may complete some work, but with more stress and less predictability.",
          ending: "mixed"
        },
        C: {
          text: "Insist that he completes as much as possible without breaks so he doesn’t fall behind.",
          score: -10,
          feedback: "High pressure without supports likely leads to shutdown, avoidance, or behavioral escalation.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Testing with Supports",
      text: "JM participated in the assessment using his work-break routine and replacement behaviors, allowing a more accurate and regulated performance."
    },
    mixed: {
      title: "Mixed Outcome – Partial Test Engagement",
      text: "JM completed some test items but with less structure and more stress than ideal. Planning explicit BIP-aligned testing plans can strengthen future outcomes."
    },
    fail: {
      title: "Escalation – Test Overload",
      text: "Testing demands without supports led to significant avoidance or escalation. A tailored testing plan and proactive communication about supports are needed."
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
    step1: {
      text: "It’s raining, so recess is indoors. The classroom is louder and more crowded. JM begins running between desks, weaving around other students.",
      choices: {
        A: {
          text: "Set clear indoor recess expectations and remind JM how he can earn Mario coins for safe movement and following the plan.",
          score: 10,
          feedback: "Great proactive support. You define success and connect it to reinforcement in this new context.",
          next: "step2A"
        },
        B: {
          text: "Tell him to slow down and be careful around others.",
          score: 0,
          feedback: "Neutral. He has a warning, but no clear alternative behavior.",
          next: "step2B"
        },
        C: {
          text: "Tell him that running is not allowed and he will lose privileges if he continues.",
          score: -10,
          feedback: "Threatening loss of privileges increases stress and may not provide a replacement behavior.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "JM pauses and looks at you, then at a quieter play area.",
      choices: {
        A: {
          text: "Prompt him to choose a structured, calmer activity (like a game, drawing, or building) and show how it fits his plan.",
          score: 10,
          feedback: "Excellent. You offer an immediate replacement for unsafe running.",
          next: "step3A"
        },
        B: {
          text: "Let him decide where to go now that you’ve reminded him of expectations.",
          score: 0,
          feedback: "Neutral. He may choose well, but may also drift back into running.",
          next: "step3B"
        },
        C: {
          text: "Tell him he must sit at his desk for the rest of indoor recess.",
          score: -10,
          feedback: "Using desk sitting as a consequence can feel punitive and increase future avoidance.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM slows briefly but then starts jogging again around a cluster of desks.",
      choices: {
        A: {
          text: "Re-set the indoor recess expectations with the whole group and identify safe movement options or zones.",
          score: 10,
          feedback: "Nice repair. You adjust the whole environment and provide alternatives.",
          next: "step3A"
        },
        B: {
          text: "Continue giving him verbal reminders when he runs.",
          score: 0,
          feedback: "Neutral. Reminders alone may not sustain safer behavior.",
          next: "step3B"
        },
        C: {
          text: "Move him to a corner of the room and tell him to sit alone.",
          score: -10,
          feedback: "Isolation during play time can increase dysregulation and resentment.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "JM runs faster, narrowly missing a chair as another student moves it.",
      choices: {
        A: {
          text: "Pause the class briefly, clear a safer space, and give JM a structured movement option (e.g., jumping jacks, wall push-ups) with clear limits.",
          score: 10,
          feedback: "Great repair. You meet his movement needs safely and with structure.",
          next: "step3A"
        },
        B: {
          text: "Stand in his path and redirect him to stop running immediately.",
          score: 0,
          feedback: "Neutral to risky. It may stop him, but also risks collision and conflict.",
          next: "step3B"
        },
        C: {
          text: "Raise your voice to scold him for running indoors.",
          score: -10,
          feedback: "Scolding in a loud, chaotic environment increases his arousal and may escalate behavior.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM engages in a safer, structured indoor activity (like a game or movement break) and seems more regulated.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is still active but within safe, BIP-aligned boundaries.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM alternates between partial compliance and bursts of running.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is in a gray area and may escalate or calm depending on further support.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM becomes louder and more restless, bumping into desks or peers more frequently.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "Indoor recess is turning into a higher-risk situation for him and others.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How do you wrap up indoor recess for JM?",
      choices: {
        A: {
          text: "Praise his safe choices, use his token system, and give a short, calm transition back to the regular schedule.",
          score: 10,
          feedback: "Excellent. You reinforce replacement behaviors and ease the transition back to learning.",
          ending: "success"
        },
        B: {
          text: "End recess and move straight into the next activity with a brief reminder of expectations.",
          score: 0,
          feedback: "Moderate approach. He transitions, but with less explicit reinforcement or closure.",
          ending: "mixed"
        },
        C: {
          text: "End recess with a lecture about how indoor behavior should be better next time.",
          score: -10,
          feedback: "Lengthy corrections at the end of an unstructured time can increase frustration and reduce buy-in.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Indoor Recess, Safely Managed",
      text: "JM stayed active in safer, structured ways and transitioned back to learning with reinforcement for his efforts."
    },
    mixed: {
      title: "Mixed Outcome – Some Safe Play, Some Stress",
      text: "JM had periods of safe play but also unstructured running. More proactive, structured options can support smoother indoor recesses."
    },
    fail: {
      title: "Escalation – Indoor Recess Chaos",
      text: "Indoor recess became stressful and unsafe for JM and peers. Clear routines and planned movement activities can improve future days."
    }
  }
});


/*************************************************
 * WILDCARD SCENARIO 5 — Substitute Teacher Day
 **************************************************/
POOL.wild.push({
  id: "wild_5_sub_day",
  title: "Wildcard Mission: Substitute Teacher Day",
  start: "step1",
  steps: {
    step1: {
      text: "You are absent, and a substitute teacher is leading the class. JM notices you are not there, paces at the back of the room, and watches the substitute closely.",
      choices: {
        A: {
          text: "Before your absence (or via a plan), you left the substitute a brief BIP overview and a simple script to explain JM’s plan and supports.",
          score: 10,
          feedback: "Excellent systems-level planning. The substitute can implement key parts of the BIP, even without you present.",
          next: "step2A"
        },
        B: {
          text: "The substitute simply tells the class that you are out and they should follow the usual rules.",
          score: 0,
          feedback: "Neutral. The class has a general direction, but JM’s specific needs are not addressed.",
          next: "step2B"
        },
        C: {
          text: "The substitute expects the class to behave the same as always with no additional information or supports.",
          score: -10,
          feedback: "Lack of plan or information about JM’s needs increases the risk of confusion and escalation.",
          next: "step2C"
        }
      }
    },

    step2A: {
      text: "The substitute reads the script and explains to JM that his usual break options and token system are still in place today.",
      choices: {
        A: {
          text: "Prompt JM to show the substitute where his calm-down corner or break space is.",
          score: 10,
          feedback: "Great. You empower JM to participate in his own support system and help the substitute learn the environment.",
          next: "step3A"
        },
        B: {
          text: "Allow the substitute to proceed and hope JM uses his plan independently.",
          score: 0,
          feedback: "Neutral. JM has supports, but the substitute might not cue them effectively.",
          next: "step3B"
        },
        C: {
          text: "Note in the plan that JM should get no extra breaks today to keep things simple.",
          score: -10,
          feedback: "Removing supports specifically on a substitute day increases his vulnerability to dysregulation.",
          next: "step3C"
        }
      }
    },

    step2B: {
      text: "JM continues pacing and looking unsure. The substitute is not yet aware of his BIP details.",
      choices: {
        A: {
          text: "Your written sub plans include a note to quickly review JM’s BIP with the classroom aide or another staff member.",
          score: 10,
          feedback: "Good repair. You build in a way for the substitute to get quick coaching on JM’s needs.",
          next: "step3A"
        },
        B: {
          text: "The substitute continues the lesson and gives JM general reminders to sit down.",
          score: 0,
          feedback: "Neutral. Without specific supports, JM’s anxiety may remain high.",
          next: "step3B"
        },
        C: {
          text: "The substitute tells JM he needs to behave like everyone else and stop pacing.",
          score: -10,
          feedback: "This approach ignores his BIP needs and can increase avoidance or escalation.",
          next: "step3C"
        }
      }
    },

    step2C: {
      text: "With no plan in place, the substitute asks JM to take a seat and follow along like everyone else.",
      choices: {
        A: {
          text: "A nearby staff member (aide or specialist) steps in and quietly shares key parts of JM’s BIP.",
          score: 10,
          feedback: "Great repair supported by the team. The substitute now has important information.",
          next: "step3A"
        },
        B: {
          text: "JM is left to manage his anxiety alone with only general classroom rules.",
          score: 0,
          feedback: "Neutral, but risky. He may cope or may escalate.",
          next: "step3B"
        },
        C: {
          text: "The substitute responds to JM’s pacing with strict warnings about consequences.",
          score: -10,
          feedback: "Strict responses without BIP knowledge often increase dysregulation.",
          next: "step3C"
        }
      }
    },

    step3A: {
      text: "JM learns that his usual supports (breaks, calm-down space, tokens) are still available and that the substitute understands them.",
      choices: {
        A: {
          text: "Continue.",
          score: 10,
          feedback: "He is more likely to stay regulated despite the staff change.",
          next: "step4"
        }
      }
    },
    step3B: {
      text: "JM remains uncertain, sometimes sitting and sometimes pacing near the back of the room.",
      choices: {
        A: {
          text: "Continue.",
          score: 0,
          feedback: "He is managing, but with more anxiety than usual.",
          next: "step4"
        }
      }
    },
    step3C: {
      text: "JM’s pacing grows more intense, and he starts talking loudly or moving toward the door.",
      choices: {
        A: {
          text: "Continue.",
          score: -10,
          feedback: "His behavior is escalating in the absence of familiar supports.",
          next: "step4"
        }
      }
    },

    step4: {
      text: "How is JM supported for the rest of the substitute day?",
      choices: {
        A: {
          text: "The substitute, supported by written plans or staff, consistently uses JM’s BIP (breaks, calm-down corner, tokens) throughout the day.",
          score: 10,
          feedback: "Excellent systems-level fidelity. JM experiences consistency even when staff changes.",
          ending: "success"
        },
        B: {
          text: "The substitute uses some informal strategies and JM gets through the day with a mix of support and stress.",
          score: 0,
          feedback: "Moderate outcome. He manages, but with less consistency than usual.",
          ending: "mixed"
        },
        C: {
          text: "JM has frequent difficulties, and staff are called multiple times because his usual supports were not used.",
          score: -10,
          feedback: "Low-fidelity implementation on a sub day leads to higher risk and disruption.",
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: {
      title: "Success – Sub Day with Consistent Supports",
      text: "Even with a substitute teacher, JM’s BIP was implemented and he stayed mostly regulated and engaged throughout the day."
    },
    mixed: {
      title: "Mixed Outcome – Sub Day with Gaps",
      text: "JM got through the sub day with some success but also extra stress. Clearer sub plans and quick staff coaching can strengthen future days."
    },
    fail: {
      title: "Escalation – Sub Day Struggles",
      text: "Without consistent use of his BIP, JM had significant difficulties during the sub day. Planning simple, sub-friendly BIP instructions is a key next step."
    }
  }
});

/*************************************************
 * RANDOM SCENARIO SELECTORS
 **************************************************/
function getDailyScenario() {
  const arr = POOL.daily;
  return arr[Math.floor(Math.random() * arr.length)];
}
function getCrisisScenario() {
  const arr = POOL.crisis;
  return arr[Math.floor(Math.random() * arr.length)];
}
function getWildcardScenario() {
  const arr = POOL.wild;
  return arr[Math.floor(Math.random() * arr.length)];
}

/*************************************************
 * CORE ENGINE — required for branching steps
 **************************************************/
let currentScenario = null;
let currentStep = null;

/* Start a scenario */
function startScenario(scn) {
  currentScenario = scn;
  currentStep = scn.start;

  scenarioTitle.textContent = scn.title;
  setPoints(0);

  renderStep();
}

/*************************************************
 * STEP RENDERER
 **************************************************/
function renderStep() {
  const stepObj = currentScenario.steps[currentStep];

  // Set the story text
  storyText.innerHTML = `
    <div class="mission-step-text">
      ${stepObj.text}
    </div>
  `;

  // Clear old buttons
  choicesDiv.innerHTML = "";

  // Each choice button
  Object.entries(stepObj.choices).forEach(([key, choice]) => {
    const btn = document.createElement("button");
    btn.className = "scenario-btn option-btn";
    btn.textContent = choice.text;

    btn.onclick = () => {
      // Apply score
      addPoints(choice.score);

      // Wizard feedback color
      updateWizard(choice.score);

      // Show the why/explanation
      showFeedback(choice.feedback);

      // If this choice triggers an ending
      if (choice.ending) {
        renderEnding(choice.ending);
        return;
      }

      // Otherwise continue to next step
      currentStep = choice.next;
      renderStep();
    };

    choicesDiv.appendChild(btn);
  });
}

/*************************************************
 * ENDING SCREEN
 **************************************************/
function renderEnding(endKey) {
  const end = currentScenario.endings[endKey];

  storyText.innerHTML = `
    <h3>${end.title}</h3>
    <p>${end.text}</p>
    <p><strong>Your final score: ${points}</strong></p>
  `;

  choicesDiv.innerHTML = `
    <button id="return-home" class="next-btn">Return to Mission Select</button>
  `;

  document.getElementById("return-home").onclick = () => {
    renderHomeScreen();
  };
}

/*************************************************
 * WIZARD STATE UPDATE (+10 / 0 / -10)
 **************************************************/
function updateWizard(score) {
  const img = document.getElementById("wizard-img");
  img.classList.remove("wizard-good", "wizard-meh", "wizard-bad");

  if (score > 0)      img.classList.add("wizard-good");
  else if (score < 0) img.classList.add("wizard-bad");
  else                img.classList.add("wizard-meh");
}

/*************************************************
 * HOME / MISSION SCREEN + BUTTON HOOKS
 **************************************************/

// This assumes you already have these at the top of your file:
// const storyText   = document.getElementById('story-text');
// const choicesDiv  = document.getElementById('choices');
// const scenarioTitle = document.getElementById('scenario-title');

function hookMissionButtons() {
  const btnDaily  = document.getElementById('btn-drill');   // Daily Mission
  const btnCrisis = document.getElementById('btn-crisis');  // Crisis Mission
  const btnWild   = document.getElementById('btn-random');  // Wildcard Mission

  if (btnDaily) {
    btnDaily.onclick = () => {
      const scn = getDailyScenario();
      startScenario(scn);
    };
  }

  if (btnCrisis) {
    btnCrisis.onclick = () => {
      const scn = getCrisisScenario();
      startScenario(scn);
    };
  }

  if (btnWild) {
    btnWild.onclick = () => {
      const scn = getWildcardScenario();
      startScenario(scn);
    };
  }
}

// Draw the landing screen (the one from your nice screenshot)
function renderHomeScreen() {
  if (scenarioTitle) {
    scenarioTitle.textContent = "Behavior Intervention Simulator - Example Game";
  }

  if (storyText) {
    storyText.innerHTML = `
      <div class="mission-intro">
        <p>Welcome to Mission: Reinforceable.</p>
        <p>You’ll step through short, branching scenarios based on your Behavior Intervention Plan.</p>
        <p>Choose your mission below.</p>
      </div>
    `;
  }

  if (choicesDiv) {
    choicesDiv.innerHTML = `
      <div class="mission-grid">
        <article class="mission-card">
          <h3>Daily Mission</h3>
          <p>
            BIP Skill Run — practice proactive, teaching, reinforcement, and
            follow-through steps for everyday classroom routines.
          </p>
          <div class="action">
            <button id="btn-drill" class="scenario-btn">Start Daily Mission</button>
          </div>
        </article>

        <article class="mission-card">
          <h3>Red Alert</h3>
          <p>
            Crisis Drill — rehearse safe elopement support, aggression response,
            and recovery steps while following the crisis plan.
          </p>
          <div class="action">
            <button id="btn-crisis" class="scenario-btn">Start Crisis Drill</button>
          </div>
        </article>

        <article class="mission-card">
          <h3>Wildcard</h3>
          <p>
            Mystery Mission — a mixed set, including curveballs like assemblies,
            fire drills, testing days, and other schedule shifts.
          </p>
          <div class="action">
            <button id="btn-random" class="scenario-btn">Start Wildcard Mission</button>
          </div>
        </article>
      </div>
    `;
  }

  // Now that the buttons exist, wire them up
  hookMissionButtons();
}

// Run once when the page loads
window.addEventListener('DOMContentLoaded', () => {
  renderHomeScreen();   // show the mission cards on load

  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.onclick = () => {
      // Reset points if you want, or leave as-is:
      // setPoints(0);
      renderHomeScreen();
    };
  }
});


