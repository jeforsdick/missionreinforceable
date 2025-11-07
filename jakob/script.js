/**********************************************************
 * Mission: Reinforceable — Jakob
 * - 3 options per decision: +10 / 0 / -10 (hidden scoring)
 * - 3 scenarios, each with 3 scored steps
 * - Branching endings + fidelity feedback
 * - Options are SHUFFLED so the best choice isn't always first
 * - Results emailed via Google Apps Script
 **********************************************************/

const storyText = document.getElementById('story-text');
const choicesDiv = document.getElementById('choices');
const scenarioTitle = document.getElementById('scenario-title');
const pointsEl = document.getElementById('points');

/********** Teacher / session info **********/
const params = new URLSearchParams(window.location.search);
// Default teacher code for Jakob's game; can override with ?t=CODE
const TEACHER_CODE = (params.get('t') || 'JF').toUpperCase();

const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let eventLog = [];
let resultsSent = false;

/********** Points + fidelity **********/
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
    maxPossible += 10; // each scored decision assumes a +10 best
    setPoints(points + delta);
  }
}

function resetGame() {
  points = 0;
  maxPossible = 0;
  eventLog = [];
  resultsSent = false;
  setPoints(0);
}

function percentScore() {
  return maxPossible > 0 ? Math.round((points / maxPossible) * 100) : 0;
}

function fidelityMessage() {
  const pct = percentScore();
  if (pct >= 80) {
    return "Nice work — your decisions closely matched Jakob's behavior plan.";
  } else if (pct >= 50) {
    return "Some moves were on-plan, but key supports were missed. Review Jakob's plan and try again.";
  }
  return "This run drifted from Jakob's plan. Replay and look for proactive supports, clear replacement skills, and consistent chart-move reinforcement.";
}

/********** Utility: non-destructive shuffle **********/
function shuffledOptions(options) {
  return options
    .map(o => ({ ...o })) // copy
    .sort(() => Math.random() - 0.5);
}

/********** Logging **********/
function logEvent(nodeId, option, deltaApplied) {
  eventLog.push({
    ts: new Date().toISOString(),
    session_id: SESSION_ID,
    teacher_code: TEACHER_CODE,
    node_id: nodeId,
    choice_text: option.text,
    delta: typeof option.delta === 'number' ? option.delta : null,
    delta_applied: !!deltaApplied,
    points_total: points,
    max_possible: maxPossible
  });
}

/********** Email results **********/
const RESULTS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbw0rHoBv6deNoy6avedLj5fj4JpCqt6r8B39UJmaNMeOYhRQfH6vbWKTgmTrhnC7cIy/exec';
const TO_EMAIL = 'jess.olson@utah.edu';

async function sendResultsIfNeeded() {
  if (resultsSent || !RESULTS_ENDPOINT || RESULTS_ENDPOINT.startsWith('PASTE_')) return;
  resultsSent = true;

  const payload = {
    teacher_code: TEACHER_CODE,
    session_id: SESSION_ID,
    student: "Jakob",
    points,
    max_possible: maxPossible,
    percent: percentScore(),
    timestamp: new Date().toISOString(),
    to_email: TO_EMAIL,
    log: eventLog
  };

  try {
    const json = JSON.stringify(payload);

    // Prefer sendBeacon
    let queued = false;
    if (navigator.sendBeacon) {
      const blob = new Blob([json], { type: 'text/plain;charset=UTF-8' });
      queued = navigator.sendBeacon(RESULTS_ENDPOINT, blob);
    }

    // Fallback: no-cors fetch
    if (!queued) {
      await fetch(RESULTS_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: json
      });
    }
  } catch (err) {
    // If it fails, allow another try on next summary
    resultsSent = false;
  }
}

/**********************************************************
 * Nodes — tailored for Jakob's BIP
 * Focus: chart moves, neutral prompting, replacement behaviors,
 * preventing/handling disruptive vocalizations, noncompliance,
 * elopement, and aggression.
 **********************************************************/

const NODES = [
  /********** INTRO **********/
  {
    id: 1,
    intro: true,
    text:
      "Welcome to Mission: Reinforceable — Jakob.\n\n" +
      "You’ll step through short, branching scenarios built directly from Jakob's Behavior Intervention Plan (BIP). " +
      "At each decision point, choose the teacher move that best aligns with:\n" +
      "• Using chart moves\n" +
      "• Teaching and prompting replacement behaviors\n" +
      "• Staying neutral while reinforcing expectations\n\n" +
      "Pick a scenario to begin.",
    options: [
      { text: "Proactive Morning Setup with Jakob", nextId: 10 },
      { text: "In-Class Escalation & Elopement Risk", nextId: 20 },
      { text: "Transition to Specials with Jakob", nextId: 30 }
    ]
  },

  /********** SCENARIO A: PROACTIVE MORNING (3 steps) **********/
  // Step 1
  {
    id: 10,
    scenario: "Proactive Morning Setup",
    text:
      "Arrival.\n\n" +
      "Jakob often engages in disruptive vocalizations, off-task behavior, or leaves his area when he’s unsure of expectations.\n" +
      "He walks in, looks around, and hesitates.\n\n" +
      "What do you do first?",
    options: [
      {
        text: "Greet Jakob by name, show his chart move sheet and schedule, and remind him how he can earn.",
        delta: +10,
        nextId: 11
      },
      {
        text: "Say 'Good morning' to the class and tell everyone to start work with no specific support for Jakob.",
        delta: 0,
        nextId: 12
      },
      {
        text: "Ignore arrival routines and begin giving rapid-fire directions.",
        delta: -10,
        nextId: 13
      }
    ]
  },
  // Step 2
  {
    id: 11,
    scenario: "Proactive Morning Setup",
    text:
      "Early success.\n\n" +
      "Jakob checks his schedule, sits where expected, and starts the first task.\n\n" +
      "What’s your next move to align with his plan?",
    options: [
      {
        text: "Give behavior-specific praise and mark a chart move for following expectations.",
        delta: +10,
        nextId: 14
      },
      {
        text: "Say a quick 'Nice job' and move on without using the chart.",
        delta: 0,
        nextId: 14
      },
      {
        text: "Say nothing; he should know this by now.",
        delta: -10,
        nextId: 15
      }
    ]
  },
  {
    id: 12,
    scenario: "Proactive Morning Setup",
    text:
      "Ambiguous start.\n\n" +
      "Jakob glances at the door and taps his pencil loudly.\n\n" +
      "How do you respond?",
    options: [
      {
        text: "Pause and show him: 'Here’s your chart, here’s how you earn today.'",
        delta: +10,
        nextId: 14
      },
      {
        text: "Hand him materials and hope the behavior settles.",
        delta: 0,
        nextId: 15
      },
      {
        text: "Correct him sharply for tapping and tell him to 'just get to work'.",
        delta: -10,
        nextId: 16
      }
    ]
  },
  {
    id: 13,
    scenario: "Proactive Morning Setup",
    text:
      "No preview.\n\n" +
      "During instructions, Jakob stares at the exit and mutters.\n\n" +
      "Next step?",
    options: [
      {
        text: "Introduce the chart and expectations now; reinforce being in his area.",
        delta: +10,
        nextId: 14
      },
      {
        text: "Repeat directions more firmly so he 'takes it seriously'.",
        delta: 0,
        nextId: 16
      },
      {
        text: "Ignore him completely unless he runs.",
        delta: -10,
        nextId: 17
      }
    ]
  },
  // Step 3 (several variants funnel to summary)
  {
    id: 14,
    scenario: "Proactive Morning Setup",
    text:
      "Decision point.\n\n" +
      "Jakob is in his area and looks to you when he finishes a small chunk.\n\n" +
      "What do you do?",
    options: [
      {
        text: "Mark a chart move immediately and describe exactly what he did right.",
        delta: +10,
        nextId: 901
      },
      {
        text: "Plan to give him something later instead of in the moment.",
        delta: 0,
        nextId: 901
      },
      {
        text: "Remind him he has a history of behavior and lower his chances to earn.",
        delta: -10,
        nextId: 901
      }
    ]
  },
  {
    id: 15,
    scenario: "Proactive Morning Setup",
    text:
      "Wobble.\n\n" +
      "Jakob is technically in place, but increasingly loud and watching peers.\n\n" +
      "Your move?",
    options: [
      {
        text: "Catch even partial on-track behavior and give a chart move + praise.",
        delta: +10,
        nextId: 901
      },
      {
        text: "Let it go since he hasn’t fully escalated.",
        delta: 0,
        nextId: 901
      },
      {
        text: "Scold him publicly for being annoying.",
        delta: -10,
        nextId: 901
      }
    ]
  },
  {
    id: 16,
    scenario: "Proactive Morning Setup",
    text:
      "Escalation.\n\n" +
      "Jakob raises his voice and edges out of his area.\n\n" +
      "How do you respond?",
    options: [
      {
        text: "Use a neutral prompt linked to the plan: 'Back to your spot and you earn a chart move.'",
        delta: +10,
        nextId: 901
      },
      {
        text: "Repeat the rule louder without offering a way to earn.",
        delta: 0,
        nextId: 901
      },
      {
        text: "Physically block and lecture him.",
        delta: -10,
        nextId: 901
      }
    ]
  },
  {
    id: 17,
    scenario: "Proactive Morning Setup",
    text:
      "Plan drift.\n\n" +
      "Jakob is half out of his seat and scanning exits.\n\n" +
      "What now?",
    options: [
      {
        text: "Reboot the system: prompt him back and reinforce the approximation.",
        delta: +10,
        nextId: 901
      },
      {
        text: "Ignore until he fully leaves.",
        delta: 0,
        nextId: 901
      },
      {
        text: "Threaten loss of all rewards.",
        delta: -10,
        nextId: 901
      }
    ]
  },

  /********** SCENARIO B: ESCALATION & ELOPEMENT RISK (3 steps) **********/
  {
    id: 20,
    scenario: "In-Class Escalation",
    text:
      "Work demand.\n\n" +
      "You present a non-preferred task. Jakob pushes materials aside and heads toward the door.\n\n" +
      "First response?",
    options: [
      {
        text: "Use a neutral, plan-based prompt: offer help or a small chunk + chart move if he returns.",
        delta: +10,
        nextId: 21
      },
      {
        text: "Raise your voice and tell him he must finish it all now.",
        delta: 0,
        nextId: 22
      },
      {
        text: "Ignore him completely as he moves toward the exit.",
        delta: -10,
        nextId: 23
      }
    ]
  },
  {
    id: 21,
    scenario: "In-Class Escalation",
    text:
      "Jakob pauses.\n\n" +
      "He hovers near the doorway, looking back at you.\n\n" +
      "Next move?",
    options: [
      {
        text: "Praise the pause, restate the offer, and reinforce coming back with a chart move.",
        delta: +10,
        nextId: 24
      },
      {
        text: "Remind him loudly he’s being unsafe.",
        delta: 0,
        nextId: 24
      },
      {
        text: "Grab his arm and pull him back.",
        delta: -10,
        nextId: 23
      }
    ]
  },
  {
    id: 22,
    scenario: "In-Class Escalation",
    text:
      "Coercive push.\n\n" +
      "Jakob glares, kicks a chair, and edges farther.\n\n" +
      "Your move?",
    options: [
      {
        text: "Shift to neutral: offer a smaller step + chart move to return.",
        delta: +10,
        nextId: 24
      },
      {
        text: "Continue arguing the whole assignment.",
        delta: 0,
        nextId: 23
      },
      {
        text: "Threaten office referral without any support.",
        delta: -10,
        nextId: 23
      }
    ]
  },
  {
    id: 24,
    scenario: "In-Class Escalation",
    text:
      "Turning point.\n\n" +
      "Jakob steps back toward you.\n\n" +
      "How do you lock in the plan?",
    options: [
      {
        text: "Calmly guide him to his spot, mark a chart move, and thank him for coming back.",
        delta: +10,
        nextId: 901
      },
      {
        text: "Walk him back while lecturing about how close he was to trouble.",
        delta: 0,
        nextId: 901
      },
      {
        text: "Tell him he’s lost all rewards anyway.",
        delta: -10,
        nextId: 901
      }
    ]
  },
  {
    id: 23,
    scenario: "In-Class Escalation",
    text:
      "Escalation.\n\n" +
      "Jakob’s behavior intensifies; the plan steps were not followed.\n\n" +
      "Time to reflect.",
    options: [
      {
        text: "Acknowledge the miss and consider how neutral prompts + chart moves could reduce risk.",
        delta: 0,
        nextId: 901
      },
      {
        text: "Conclude that Jakob is just defiant and nothing works.",
        delta: -10,
        nextId: 901
      },
      {
        text: "Restart this scenario and try the planned steps.",
        delta: 0,
        nextId: 20
      }
    ]
  },

  /********** SCENARIO C: TRANSITION SUPPORT (3 steps) **********/
  {
    id: 30,
    scenario: "Transition to Specials",
    text:
      "Before Specials.\n\n" +
      "Transitions are hard for Jakob and often linked to leaving his area.\n\n" +
      "What do you do before lining up?",
    options: [
      {
        text: "Preview where you're going, review expectations, and show how he can earn chart moves.",
        delta: +10,
        nextId: 31
      },
      {
        text: "Tell the class 'Line up for specials!' with no extra support.",
        delta: 0,
        nextId: 32
      },
      {
        text: "Say nothing until the last second, then rush everyone out.",
        delta: -10,
        nextId: 33
      }
    ]
  },
  {
    id: 31,
    scenario: "Transition to Specials",
    text:
      "Line up.\n\n" +
      "Jakob lingers at his desk, watching peers line up.\n\n" +
      "Your move?",
    options: [
      {
        text: "Offer a simple choice (spot in line) + remind him he earns a chart move for joining calmly.",
        delta: +10,
        nextId: 34
      },
      {
        text: "Tell him again to hurry and get in line.",
        delta: 0,
        nextId: 34
      },
      {
        text: "Warn he’ll lose specials if he doesn’t move now.",
        delta: -10,
        nextId: 33
      }
    ]
  },
  {
    id: 32,
    scenario: "Transition to Specials",
    text:
      "Minimal support.\n\n" +
      "Jakob shuffles to the back, looking unsure.\n\n",
    options: [
      {
        text: "Pause briefly to restate expectations and how he can earn.",
        delta: +10,
        nextId: 34
      },
      {
        text: "Keep walking; at least he's with the group.",
        delta: 0,
        nextId: 34
      },
      {
        text: "Call him out in front of peers for being slow.",
        delta: -10,
        nextId: 33
      }
    ]
  },
  {
    id: 34,
    scenario: "Transition to Specials",
    text:
      "At the door.\n\n" +
      "Jakob pauses and looks at you before going into the hallway.\n\n" +
      "What now?",
    options: [
      {
        text: "Reinforce his on-track behavior with praise and a chart move.",
        delta: +10,
        nextId: 901
      },
      {
        text: "Give a neutral 'okay' and keep walking.",
        delta: 0,
        nextId: 901
      },
      {
        text: "Ignore him unless there's a problem.",
        delta: -10,
        nextId: 901
      }
    ]
  },
  {
    id: 33,
    scenario: "Transition to Specials",
    text:
      "Plan drift.\n\n" +
      "Rushed or punitive responses increase Jakob's anxiety and risk.\n\n",
    options: [
      {
        text: "Reflect on how preview + choices + chart moves could support safer transitions.",
        delta: 0,
        nextId: 901
      },
      {
        text: "Decide transitions are his problem alone.",
        delta: -10,
        nextId: 901
      },
      {
        text: "Restart the transition scenario to try again.",
        delta: 0,
        nextId: 30
      }
    ]
  },

  /********** FEEDBACK **********/
  {
    id: 901,
    feedback: true,
    text: "Session Summary",
    options: [
      { text: "Play again from the beginning", nextId: 1 },
      { text: "Replay Proactive Morning", nextId: 10 },
      { text: "Replay In-Class Escalation", nextId: 20 }
    ]
  }
];

/**********************************************************
 * Engine
 **********************************************************/

function showNode(id) {
  const node = NODES.find(n => n.id === id);
  if (!node) return;

  // Title
  if (scenarioTitle) {
    if (node.intro) {
      scenarioTitle.textContent = "Behavior Intervention Simulator — Jakob";
    } else if (node.feedback) {
      scenarioTitle.textContent = "Fidelity Feedback";
    } else if (node.scenario) {
      scenarioTitle.textContent = node.scenario;
    } else {
      scenarioTitle.textContent = "Choose Your Next Move";
    }
  }

  // Text or feedback
  if (node.feedback) {
    const pct = percentScore();
    const msg = fidelityMessage();
    storyText.textContent =
      `Your score: ${points} / ${maxPossible} (${pct}%)\n\n${msg}\n\nResults have been recorded for this session.`;
    sendResultsIfNeeded();
  } else {
    storyText.textContent = node.text;
  }

  // Clear old buttons
  while (choicesDiv.firstChild) choicesDiv.removeChild(choicesDiv.firstChild);

  // Shuffle options each time
  const options = shuffledOptions(node.options);

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.addEventListener('click', () => {
      let deltaApplied = false;
      if (typeof opt.delta === 'number') {
        addPoints(opt.delta);
        deltaApplied = true;
      }
      if (opt.nextId === 1) {
        // restart to intro
        resetGame();
      }
      logEvent(node.id, opt, deltaApplied);
      showNode(opt.nextId);
    });
    choicesDiv.appendChild(btn);
  });
}

/********** INIT + HOME BUTTON **********/
window.addEventListener('load', () => {
  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      resetGame();
      showNode(1); // intro / scenario select
    });
  }

  resetGame();
  showNode(1);
});
