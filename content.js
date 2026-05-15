/* MA — content.js */

GAME_CONFIG.resultEndpoint = "https://script.google.com/macros/s/AKfycbyZ4Z7Axzzb0hwMSJ2wQ1127sjNeeK3P9T-sOSr9P2teZpKyogHPOUAkZllVK13-XeR/exec";
GAME_CONFIG.defaultStudent = "KK";

GAME_CONFIG.fidelityHigh = `High fidelity. You stayed calm and brief, redirected without spotlighting, and reinforced the right behaviors quickly. Student got a clear path back to success.`;
GAME_CONFIG.fidelityMid  = `Getting there. Try fewer words and faster reinforcement. Prompt the replacement behavior right away, keep directions to one step, and use Chart Moves the moment you see safe hands or calm body.`;
GAME_CONFIG.fidelityLow  = `Not aligned yet. Reset your approach: one-step directive, prompt the replacement behavior, reinforce immediately with Chart Moves, and avoid public corrections or debates.`;

GAME_CONFIG.actionHigh = `<ul>
  <li>Keep front-loading supports before known triggers (whole group, transitions, downtime).</li>
  <li>Stay consistent with short, neutral directions and two-choice prompts instead of "no."</li>
  <li>Continue reinforcing quickly with Chart Moves for safe hands, task start, and appropriate requests.</li>
</ul>`;
GAME_CONFIG.actionMid = `<ul>
  <li>Add pre-corrections earlier — especially before line, unstructured time, and new activities.</li>
  <li>Prompt the replacement behavior sooner before peers become the audience.</li>
  <li>Shorten your language to one clear step and reinforce immediately with a Chart Move.</li>
</ul>`;
GAME_CONFIG.actionLow = `<ul>
  <li>Rebuild the proactive setup: clear expectations, defined space, and a visible path to earn reinforcement.</li>
  <li>Practice the replacement script outside of tough moments so it is ready during escalation.</li>
  <li>During escalation, use minimal language and predictable reset options — avoid public debates.</li>
</ul>`;

/* ---- DAILY SCENARIOS ---- */

POOL.daily.push({
  id: "daily_1_rug_time",
  title: "Daily Mission: Rug Time Start-Up",
  start: "step1",
  steps: {
    step1: {
      text: `During whole-group instruction, Student starts sliding backward and lightly pokes the student next to him. When you begin directions, he says he is not doing this and looks for reactions.`,
      choices: {
        A: { text: `Avoid "no" and give 2 choices: sit on your spot on the rug or sit in your chair spot.`, score: 10, feedback: `Great fidelity. You avoided a power struggle and used a safe two-choice prompt.`, next: "step2" },
        B: { text: `Say: Come on, be good and listen.`, score: 0, feedback: `Neutral. It is a prompt, but not specific and may increase negotiation.`, next: "step2" },
        C: { text: `Say: No. Stop it right now — in front of the group.`, score: -10, feedback: `Public correction can escalate and pull peer attention.`, next: "step2" }
      }
    },
    step2: {
      text: `Student moves to his assigned spot and quiets his hands. How do you follow up?`,
      choices: {
        A: { text: `Give a clear incompatible direction: put both hands on your knees and point to the first picture.`, score: 10, feedback: `Excellent. Clear action that competes with poking and gets him started.`, next: "step3" },
        B: { text: `Let it go and continue teaching without checking in.`, score: 0, feedback: `Neutral. Might work, but you missed a chance to lock in the routine.`, next: "step3" },
        C: { text: `Remind him about consequences if he pokes again.`, score: -10, feedback: `Threat talk often increases escape and attention cycles.`, next: "step3" }
      }
    },
    step3: {
      text: `Student is in his spot and starting the task. How do you reinforce?`,
      choices: {
        A: { text: `Brief private praise and mark a Chart Move, then give the next clear direction.`, score: 10, feedback: `Perfect. Reinforcement stays private and the lesson keeps moving.`, ending: "success" },
        B: { text: `Move on without marking anything.`, score: 0, feedback: `Okay, but missed a key reinforcement moment.`, ending: "mixed" },
        C: { text: `Bring up his earlier behavior in front of peers.`, score: -10, feedback: `Public attention can restart the cycle.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Routine Strengthened`, text: `Student started whole-group successfully using choices, incompatible directions, and Chart Move reinforcement.` },
    mixed:   { title: `Mixed — Stable but Under-Reinforced`, text: `Student complied, but the team missed a chance to strengthen the routine.` },
    fail:    { title: `Escalation — Peer Attention Maintained`, text: `Public attention and unclear structure increased the chance of issues continuing.` }
  }
});

POOL.daily.push({
  id: "daily_2_independent_work",
  title: "Daily Mission: Independent Work Start",
  start: "step1",
  steps: {
    step1: {
      text: `Independent work begins. Student looks at the worksheet, sighs loudly, and starts folding the corner of the paper while watching nearby peers.`,
      choices: {
        A: { text: `Offer two choices tied to starting: would you like to start with the top problem or the bottom problem?`, score: 10, feedback: `Great. Choices reduce escape behavior and get him started without pressure.`, next: "step2" },
        B: { text: `Say: let's get started, buddy.`, score: 0, feedback: `Neutral encouragement, but not specific enough to reduce avoidance.`, next: "step2" },
        C: { text: `Say: stop messing with your paper and do your work.`, score: -10, feedback: `Public correction may escalate escape behavior.`, next: "step2" }
      }
    },
    step2: {
      text: `Student pauses, then flattens the paper and looks at the bottom problem. What next?`,
      choices: {
        A: { text: `Say: write your name and circle the first problem.`, score: 10, feedback: `Excellent. Clear action that competes with property misuse.`, next: "step3" },
        B: { text: `Walk away to give him space.`, score: 0, feedback: `Neutral. May work, but misses a chance to lock in momentum.`, next: "step3" },
        C: { text: `Warn him not to crumple the paper.`, score: -10, feedback: `Threat-based reminders can increase avoidance.`, next: "step3" }
      }
    },
    step3: {
      text: `Student begins writing. How do you reinforce this moment?`,
      choices: {
        A: { text: `Brief praise and mark a Chart Move for starting work.`, score: 10, feedback: `Perfect reinforcement for task initiation.`, ending: "success" },
        B: { text: `Move on without feedback.`, score: 0, feedback: `Missed reinforcement opportunity.`, ending: "mixed" },
        C: { text: `Mention earlier behavior in front of peers.`, score: -10, feedback: `Public attention risks re-escalation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Work Started`, text: `Student initiated independent work using structured choices and clear directions.` },
    mixed:   { title: `Mixed — Partial Engagement`, text: `Student stayed regulated but reinforcement was missed.` },
    fail:    { title: `Fail — Avoidance Maintained`, text: `Escape and attention behaviors reduced work engagement.` }
  }
});

POOL.daily.push({
  id: "daily_3_partner_transition",
  title: "Daily Mission: Partner Work Transition",
  start: "step1",
  steps: {
    step1: {
      text: `You announce a transition to partner work. Student immediately says loudly that he does not want a partner and looks around for reactions.`,
      choices: {
        A: { text: `Pre-correct with choice: would you like to be partner A or partner B?`, score: 10, feedback: `Great — gives control within the routine.`, next: "step2" },
        B: { text: `Say: everyone needs a partner.`, score: 0, feedback: `Neutral, but may invite negotiation.`, next: "step2" },
        C: { text: `Say: stop complaining and pick a partner.`, score: -10, feedback: `Public correction increases attention-seeking.`, next: "step2" }
      }
    },
    step2: {
      text: `Student hesitates, then points to a partner. What do you do next?`,
      choices: {
        A: { text: `Say: sit next to your partner and open to page one.`, score: 10, feedback: `Excellent — clear and task-focused.`, next: "step3" },
        B: { text: `Let him move on his own.`, score: 0, feedback: `Neutral; may slow the transition.`, next: "step3" },
        C: { text: `Remind him to use a nicer tone.`, score: -10, feedback: `Tone policing adds attention without progress.`, next: "step3" }
      }
    },
    step3: {
      text: `Student sits with his partner and opens the materials. How do you reinforce the transition?`,
      choices: {
        A: { text: `Quiet praise and mark a Chart Move for joining partner work.`, score: 10, feedback: `Strong reinforcement for flexibility.`, ending: "success" },
        B: { text: `Move on without feedback.`, score: 0, feedback: `Routine not strengthened.`, ending: "mixed" },
        C: { text: `Bring up his refusal in front of peers.`, score: -10, feedback: `Public attention undermines transition success.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Transition Completed`, text: `Student transitioned to partner work using choices and clear structure.` },
    mixed:   { title: `Mixed — Partial Transition`, text: `Student transitioned but reinforcement was missed.` },
    fail:    { title: `Fail — Escalation`, text: `Peer attention reinforced refusal behaviors.` }
  }
});

POOL.daily.push({
  id: "daily_4_return_specials",
  title: "Daily Mission: Return From Specials",
  start: "step1",
  steps: {
    step1: {
      text: `The class returns from PE. Student is energized and begins wandering past his desk, bumping into chairs and drifting toward the door.`,
      choices: {
        A: { text: `Pre-correct with choice: desk spot or end-of-row seat — you choose.`, score: 10, feedback: `Great — proactive structure reduces wandering.`, next: "step2" },
        B: { text: `Say: everyone find your seat.`, score: 0, feedback: `Neutral, but not specific enough for him.`, next: "step2" },
        C: { text: `Say loudly: Student, get back to your seat.`, score: -10, feedback: `Public call-out may escalate movement.`, next: "step2" }
      }
    },
    step2: {
      text: `Student walks toward the end-of-row seat and pauses. What do you say?`,
      choices: {
        A: { text: `Say: sit down and put your feet flat on the floor.`, score: 10, feedback: `Clear physical direction competing with elopement.`, next: "step3" },
        B: { text: `Wait quietly.`, score: 0, feedback: `Neutral — may work but less support.`, next: "step3" },
        C: { text: `Remind him about expectations after PE.`, score: -10, feedback: `Extra verbal attention may escalate.`, next: "step3" }
      }
    },
    step3: {
      text: `Student sits down and stays in his seat. How do you reinforce?`,
      choices: {
        A: { text: `Quiet praise and mark a Chart Move for sitting safely.`, score: 10, feedback: `Reinforces regulation and safety.`, ending: "success" },
        B: { text: `Start the lesson without feedback.`, score: 0, feedback: `Routine not strengthened.`, ending: "mixed" },
        C: { text: `Mention his movement issues to the class.`, score: -10, feedback: `Public attention increases future risk.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Calm Re-Entry`, text: `Student returned from specials safely with structured support.` },
    mixed:   { title: `Mixed — Partial Regulation`, text: `Student re-entered but without reinforcement for safety.` },
    fail:    { title: `Fail — Movement Escalation`, text: `Attention and unclear structure increased elopement risk.` }
  }
});

POOL.daily.push({
  id: "daily_5_writing_task",
  title: "Daily Mission: Writing Task",
  start: "step1",
  steps: {
    step1: {
      text: `Student is given a writing prompt. He sighs loudly, pushes the paper slightly away, and says it is too hard while glancing at nearby peers.`,
      choices: {
        A: { text: `Chunk the task with choice: would you like to write one sentence or draw the first picture?`, score: 10, feedback: `Great. Reduces escape and gives a supported entry point.`, next: "step2" },
        B: { text: `Say: just try your best.`, score: 0, feedback: `Neutral encouragement but not specific enough.`, next: "step2" },
        C: { text: `Say: stop complaining and start writing.`, score: -10, feedback: `Public correction increases escape and attention-seeking.`, next: "step2" }
      }
    },
    step2: {
      text: `Student pulls the paper back toward him but keeps watching peers. What next?`,
      choices: {
        A: { text: `Say: write your name and underline it.`, score: 10, feedback: `Excellent — clear motor action that starts the task.`, next: "step3" },
        B: { text: `Give him space and walk away.`, score: 0, feedback: `Neutral; momentum may stall.`, next: "step3" },
        C: { text: `Remind him the assignment is graded.`, score: -10, feedback: `Pressure-based attention may escalate avoidance.`, next: "step3" }
      }
    },
    step3: {
      text: `Student begins writing quietly. How do you reinforce?`,
      choices: {
        A: { text: `Quiet praise and mark a Chart Move for starting writing.`, score: 10, feedback: `Strong reinforcement for effort and engagement.`, ending: "success" },
        B: { text: `Move on without feedback.`, score: 0, feedback: `Missed opportunity to strengthen the routine.`, ending: "mixed" },
        C: { text: `Bring up earlier refusal publicly.`, score: -10, feedback: `Public attention risks re-escalation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Writing Started`, text: `Student engaged in writing using structured choices and clear directions.` },
    mixed:   { title: `Mixed — Partial Engagement`, text: `Student stayed regulated but did not fully engage.` },
    fail:    { title: `Fail — Writing Avoidance`, text: `Escape-maintained behavior reduced writing engagement.` }
  }
});

POOL.daily.push({
  id: "daily_6_math_block",
  title: "Daily Mission: Math Block",
  start: "step1",
  steps: {
    step1: {
      text: `As you explain a math problem, Student blurts out that it is easy and looks around to see who noticed.`,
      choices: {
        A: { text: `Use neutral ignoring, then prompt quietly: hand up if you want to share.`, score: 10, feedback: `Great. No attention to the call-out, clear replacement cue.`, next: "step2" },
        B: { text: `Say: wait your turn.`, score: 0, feedback: `Neutral but still provides attention for the call-out.`, next: "step2" },
        C: { text: `Say loudly: stop interrupting.`, score: -10, feedback: `Public correction fuels attention-seeking.`, next: "step2" }
      }
    },
    step2: {
      text: `Student quiets and raises his hand. How do you respond?`,
      choices: {
        A: { text: `Acknowledge briefly: thanks, I will call on you soon.`, score: 10, feedback: `Reinforces the replacement behavior.`, next: "step3" },
        B: { text: `Ignore the raised hand and continue.`, score: 0, feedback: `Neutral but missed reinforcement.`, next: "step3" },
        C: { text: `Tell him to keep his hand down.`, score: -10, feedback: `Punishes appropriate behavior.`, next: "step3" }
      }
    },
    step3: {
      text: `Student waits quietly with his hand raised. How do you reinforce math participation?`,
      choices: {
        A: { text: `Call on him and mark a Chart Move for hand-raising.`, score: 10, feedback: `Perfect reinforcement of the replacement behavior.`, ending: "success" },
        B: { text: `Call on him without praise.`, score: 0, feedback: `Partial reinforcement.`, ending: "mixed" },
        C: { text: `Skip him because of earlier call-outs.`, score: -10, feedback: `Punishes appropriate behavior.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Hand-Raising Reinforced`, text: `Student earned attention by using the correct participation routine.` },
    mixed:   { title: `Mixed — Inconsistent Reinforcement`, text: `Student participated but without clear reinforcement.` },
    fail:    { title: `Fail — Call-Out Cycle Continues`, text: `Attention-seeking through blurting was reinforced.` }
  }
});

POOL.daily.push({
  id: "daily_7_morning_entry",
  title: "Daily Mission: Morning Entry",
  start: "step1",
  steps: {
    step1: {
      text: `Student enters the classroom with high energy, weaving between desks and calling out to peers instead of going to his seat.`,
      choices: {
        A: { text: `Greet briefly and offer choice: backpack hook or desk first?`, score: 10, feedback: `Great proactive structure for a high-energy moment.`, next: "step2" },
        B: { text: `Say: good morning — go sit down.`, score: 0, feedback: `Neutral but not grounding enough.`, next: "step2" },
        C: { text: `Say loudly: Student, stop running around.`, score: -10, feedback: `Public attention may escalate movement.`, next: "step2" }
      }
    },
    step2: {
      text: `Student heads to the backpack hook and slows slightly. What do you say?`,
      choices: {
        A: { text: `Say: hang it up and walk to your seat.`, score: 10, feedback: `Clear physical direction supports regulation.`, next: "step3" },
        B: { text: `Let him move independently.`, score: 0, feedback: `Neutral; may drift again.`, next: "step3" },
        C: { text: `Remind him of morning expectations verbally.`, score: -10, feedback: `Extra verbal attention can escalate.`, next: "step3" }
      }
    },
    step3: {
      text: `Student sits at his desk and stays seated. How do you reinforce morning entry?`,
      choices: {
        A: { text: `Quiet praise and mark a Chart Move for entering safely.`, score: 10, feedback: `Reinforces a strong start to the day.`, ending: "success" },
        B: { text: `Begin morning work without feedback.`, score: 0, feedback: `Routine not strengthened.`, ending: "mixed" },
        C: { text: `Mention earlier behavior publicly.`, score: -10, feedback: `Public attention undermines regulation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Calm Morning Entry`, text: `Student entered the classroom safely with structured support.` },
    mixed:   { title: `Mixed — Partial Regulation`, text: `Student entered the room but needed more reinforcement.` },
    fail:    { title: `Fail — Morning Escalation`, text: `Attention and unclear structure increased movement behavior.` }
  }
});

POOL.daily.push({
  id: "daily_8_whole_class_discussion",
  title: "Daily Mission: Whole-Class Discussion",
  start: "step1",
  steps: {
    step1: {
      text: `During a whole-class discussion, Student blurts out the answer loudly and looks around to see who noticed.`,
      choices: {
        A: { text: `Use neutral ignoring, then prompt quietly: hand up if you want to share.`, score: 10, feedback: `Great. No reinforcement for blurting, clear replacement cue.`, next: "step2" },
        B: { text: `Say: wait your turn.`, score: 0, feedback: `Neutral but still provides attention for the call-out.`, next: "step2" },
        C: { text: `Say loudly: stop interrupting.`, score: -10, feedback: `Public attention can increase future blurting.`, next: "step2" }
      }
    },
    step2: {
      text: `Student quiets and raises his hand. How do you respond?`,
      choices: {
        A: { text: `Acknowledge briefly: thanks, I will call on you soon.`, score: 10, feedback: `Reinforces the replacement behavior immediately.`, next: "step3" },
        B: { text: `Continue the discussion without acknowledging him.`, score: 0, feedback: `Neutral, but missed reinforcement for hand-raising.`, next: "step3" },
        C: { text: `Tell him to put his hand down because he blurted earlier.`, score: -10, feedback: `Punishes appropriate behavior.`, next: "step3" }
      }
    },
    step3: {
      text: `Student holds his hand up and stays quiet. How do you reinforce?`,
      choices: {
        A: { text: `Call on him soon and mark a Chart Move for hand-raising.`, score: 10, feedback: `Perfect reinforcement of the replacement behavior.`, ending: "success" },
        B: { text: `Call on him without praise or Chart Move.`, score: 0, feedback: `Partial reinforcement; less likely to stick.`, ending: "mixed" },
        C: { text: `Skip him because of earlier blurting.`, score: -10, feedback: `Punishes appropriate participation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Participation Routine Strengthened`, text: `Student earned attention by raising his hand and using a quiet voice.` },
    mixed:   { title: `Mixed — Participation Without Reinforcement`, text: `Student participated, but reinforcement was not clearly tied to replacement behavior.` },
    fail:    { title: `Fail — Blurting Maintained`, text: `Public attention and inconsistent reinforcement increased blurting behavior.` }
  }
});

POOL.daily.push({
  id: "daily_9_help_seeking",
  title: "Daily Mission: Help-Seeking During Work Time",
  start: "step1",
  steps: {
    step1: {
      text: `During independent work, Student gets stuck and calls out loudly across the room that he does not get this, looking around for reactions.`,
      choices: {
        A: { text: `Prompt the replacement quietly: use your help signal or help card.`, score: 10, feedback: `Great. Teaches the replacement behavior with minimal attention.`, next: "step2" },
        B: { text: `Say: just keep trying.`, score: 0, feedback: `Neutral but does not teach what to do instead.`, next: "step2" },
        C: { text: `Say loudly: stop yelling and figure it out.`, score: -10, feedback: `Public correction increases frustration and attention-seeking.`, next: "step2" }
      }
    },
    step2: {
      text: `Student hesitates, then uses the help signal and raises his hand quietly. How do you respond?`,
      choices: {
        A: { text: `Acknowledge quietly: thanks, I will be right there.`, score: 10, feedback: `Excellent. Reinforces the exact replacement routine.`, next: "step3" },
        B: { text: `Give a thumbs up but continue without acknowledgement.`, score: 0, feedback: `Neutral; may not reinforce the routine enough.`, next: "step3" },
        C: { text: `Tell him he should know this already.`, score: -10, feedback: `Critical attention undermines help-seeking.`, next: "step3" }
      }
    },
    step3: {
      text: `Student stays seated and waits using the help routine. How do you finalize support?`,
      choices: {
        A: { text: `Provide quick help, then mark a Chart Move for appropriate help-seeking.`, score: 10, feedback: `Perfect — help plus reinforcement tied to replacement behavior.`, ending: "success" },
        B: { text: `Help him but do not provide praise or Chart Move.`, score: 0, feedback: `Support provided, but replacement behavior not strengthened.`, ending: "mixed" },
        C: { text: `Delay help and bring up earlier yelling.`, score: -10, feedback: `Risks re-escalation and weakens help routine.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Help Routine Strengthened`, text: `Student learned that using the help routine results in quick support and reinforcement.` },
    mixed:   { title: `Mixed — Help Given Without Reinforcement`, text: `Student received support, but the help routine may not maintain without reinforcement.` },
    fail:    { title: `Fail — Disruption Replaced Help-Seeking`, text: `Calling out and avoidance behaviors were unintentionally reinforced.` }
  }
});

POOL.daily.push({
  id: "daily_10_end_of_day",
  title: "Daily Mission: End-of-Day Cleanup",
  start: "step1",
  steps: {
    step1: {
      text: `During end-of-day cleanup, Student leaves his area and drifts toward peers, touching items on other desks instead of packing up.`,
      choices: {
        A: { text: `Calm, specific directive: pack up first — backpack, folder, then line.`, score: 10, feedback: `Great. Clear sequence reduces wandering and keeps attention low.`, next: "step2" },
        B: { text: `Say: please pack up.`, score: 0, feedback: `Neutral but not structured enough.`, next: "step2" },
        C: { text: `Say loudly: stop touching other people's stuff.`, score: -10, feedback: `Public attention can increase the behavior.`, next: "step2" }
      }
    },
    step2: {
      text: `Student pauses and returns toward his desk. What do you say next?`,
      choices: {
        A: { text: `Say: sit and zip your backpack.`, score: 10, feedback: `Excellent. Clear motor action anchors him in place.`, next: "step3" },
        B: { text: `Give him space and hope he follows through.`, score: 0, feedback: `Neutral; may drift again.`, next: "step3" },
        C: { text: `Tell him he is being disruptive right now.`, score: -10, feedback: `Vague correction adds attention.`, next: "step3" }
      }
    },
    step3: {
      text: `Student packs up at his desk and stays there. How do you reinforce?`,
      choices: {
        A: { text: `Quiet praise and mark a Chart Move for packing up in his space.`, score: 10, feedback: `Perfect reinforcement for staying in location and completing routine.`, ending: "success" },
        B: { text: `Line the class up without feedback.`, score: 0, feedback: `Routine completed, but not strengthened for tomorrow.`, ending: "mixed" },
        C: { text: `Mention earlier wandering in front of the class as you dismiss.`, score: -10, feedback: `Public attention can restart the behavior.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — End-of-Day Routine Completed`, text: `Student stayed in his space, packed up, and earned reinforcement for following the routine.` },
    mixed:   { title: `Mixed — Routine Completed Without Reinforcement`, text: `Student packed up, but reinforcement was not tied to expected behaviors.` },
    fail:    { title: `Fail — Wandering Reinforced`, text: `Public attention and inconsistent reinforcement maintained wandering and peer-seeking.` }
  }
});

/* ---- CRISIS SCENARIOS ---- */

POOL.crisis.push({
  id: "crisis_1_peer_safety",
  title: "Crisis Drill: Peer Safety",
  start: "step1",
  steps: {
    step1: {
      text: `During line-up, Student suddenly kicks toward a peer and swings his arm when they get too close. Several students react.`,
      choices: {
        A: { text: `Immediately create space: calmly move peers away, give a brief directive — hands down, walk with me — and signal for support.`, score: 10, feedback: `Correct. Safety first: space, calm direction, and support activation.`, next: "step2" },
        B: { text: `Talk him through his feelings and ask why he is upset.`, score: 0, feedback: `Supportive, but too slow for immediate peer safety.`, next: "step2" },
        C: { text: `Yell and physically restrain him in front of peers.`, score: -10, feedback: `High risk escalation and unsafe practice.`, next: "step2" }
      }
    },
    step2: {
      text: `Peers move away. Student slows slightly but is still tense. What do you do?`,
      choices: {
        A: { text: `Repeat a brief incompatible direction and guide to the calm reset spot.`, score: 10, feedback: `Good — predictable, low-language guidance supports de-escalation.`, next: "step3" },
        B: { text: `Begin explaining consequences.`, score: 0, feedback: `Neutral, but adds verbal load during crisis.`, next: "step3" },
        C: { text: `Threaten loss of rewards.`, score: -10, feedback: `Escalates power struggle during crisis.`, next: "step3" }
      }
    },
    step3: {
      text: `Student is separated from peers and begins to calm. How do you support recovery?`,
      choices: {
        A: { text: `Allow a brief reset, then reinforce calm re-entry with a Chart Move.`, score: 10, feedback: `Excellent — reinforces recovery, not aggression.`, ending: "success" },
        B: { text: `Return him to class without comment.`, score: 0, feedback: `Neutral; recovery not reinforced.`, ending: "mixed" },
        C: { text: `Lecture about what he did wrong.`, score: -10, feedback: `Teaching during recovery can restart escalation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Crisis Managed Safely`, text: `Peer safety was prioritized and calm re-entry was reinforced.` },
    mixed:   { title: `Crisis Stabilized Without Reinforcement`, text: `Safety was restored, but recovery behavior was not strengthened.` },
    fail:    { title: `Crisis Escalation`, text: `Escalation increased due to attention, threats, or unsafe responses.` }
  }
});

POOL.crisis.push({
  id: "crisis_2_work_refusal",
  title: "Crisis Drill: Escalating Refusal",
  start: "step1",
  steps: {
    step1: {
      text: `During a challenging task, Student refuses, pushes materials away, and begins yelling that he is not doing this.`,
      choices: {
        A: { text: `Reduce language: offer a break or reset option and step back.`, score: 10, feedback: `Correct — reduces pressure and supports de-escalation.`, next: "step2" },
        B: { text: `Explain why the work is important.`, score: 0, feedback: `Neutral but adds verbal demand.`, next: "step2" },
        C: { text: `Insist he comply immediately.`, score: -10, feedback: `Escalates escape-maintained behavior.`, next: "step2" }
      }
    },
    step2: {
      text: `Student pauses and lowers his voice slightly. What do you do?`,
      choices: {
        A: { text: `Maintain calm presence and allow space.`, score: 10, feedback: `Good — keeps escalation from reigniting.`, next: "step3" },
        B: { text: `Start re-teaching expectations.`, score: 0, feedback: `Neutral but premature.`, next: "step3" },
        C: { text: `Remind him of consequences.`, score: -10, feedback: `Power struggle risk.`, next: "step3" }
      }
    },
    step3: {
      text: `Student calms and stops yelling. How do you support recovery?`,
      choices: {
        A: { text: `Allow a brief break, then reinforce calm re-engagement with a Chart Move.`, score: 10, feedback: `Excellent — reinforces recovery and flexibility.`, ending: "success" },
        B: { text: `Return to work without comment.`, score: 0, feedback: `Neutral but recovery not reinforced.`, ending: "mixed" },
        C: { text: `Discuss the refusal in detail.`, score: -10, feedback: `Risk of restarting escalation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Crisis De-Escalated`, text: `Student calmed with reduced demands and recovery was reinforced.` },
    mixed:   { title: `Crisis Ended Without Reinforcement`, text: `Behavior stabilized, but recovery was not strengthened.` },
    fail:    { title: `Crisis Maintained`, text: `Escalation continued due to pressure and attention.` }
  }
});

POOL.crisis.push({
  id: "crisis_3_unexpected_location",
  title: "Crisis Drill: Unexpected Location",
  start: "step1",
  steps: {
    step1: {
      text: `During work time, Student suddenly leaves his area and walks quickly toward the hallway.`,
      choices: {
        A: { text: `Maintain line-of-sight, notify support immediately, and use calm brief prompts.`, score: 10, feedback: `Correct — safety, support, and minimal language.`, next: "step2" },
        B: { text: `Follow him quietly without notifying anyone.`, score: 0, feedback: `Neutral; support delayed.`, next: "step2" },
        C: { text: `Chase and physically block him.`, score: -10, feedback: `Chasing increases risk.`, next: "step2" }
      }
    },
    step2: {
      text: `Student slows near the doorway but looks unsure. What do you offer?`,
      choices: {
        A: { text: `Offer a brief choice: walk with me back or wait here with support.`, score: 10, feedback: `Excellent — predictable options reduce flight.`, next: "step3" },
        B: { text: `Tell him to explain why he left.`, score: 0, feedback: `Neutral but adds verbal load.`, next: "step3" },
        C: { text: `Threaten consequences for leaving.`, score: -10, feedback: `Escalation risk increases.`, next: "step3" }
      }
    },
    step3: {
      text: `Student stops and waits with support nearby. How do you support recovery?`,
      choices: {
        A: { text: `Reinforce safe return and calm behavior with a Chart Move.`, score: 10, feedback: `Excellent — reinforces recovery and safety.`, ending: "success" },
        B: { text: `Return to class without feedback.`, score: 0, feedback: `Neutral but recovery not strengthened.`, ending: "mixed" },
        C: { text: `Discuss the danger in detail.`, score: -10, feedback: `Teaching during recovery may re-escalate.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Crisis Managed — Safe Return`, text: `Unexpected location was handled with safety and reinforcement of recovery.` },
    mixed:   { title: `Crisis Ended Without Reinforcement`, text: `Safety restored, but recovery behavior not strengthened.` },
    fail:    { title: `Crisis Escalated`, text: `Escalation increased due to chasing, threats, or attention.` }
  }
});

POOL.crisis.push({
  id: "crisis_4_property_misuse",
  title: "Crisis Drill: Property Misuse",
  start: "step1",
  steps: {
    step1: {
      text: `During a demanding task, Student grabs classroom materials and begins throwing them onto the floor. Peers turn to watch.`,
      choices: {
        A: { text: `Reduce audience: calmly move peers back, remove throwable items, use a brief directive — hands down, step back — and signal for support.`, score: 10, feedback: `Correct. You reduce risk, reduce attention, and keep language minimal.`, next: "step2" },
        B: { text: `Tell him to stop and explain why it is not okay.`, score: 0, feedback: `Neutral, but too much language for an active crisis.`, next: "step2" },
        C: { text: `Scold him loudly in front of the class.`, score: -10, feedback: `Public attention and intensity can escalate property misuse.`, next: "step2" }
      }
    },
    step2: {
      text: `With peers moved away, Student pauses and breathes hard. What do you do?`,
      choices: {
        A: { text: `Offer a reset or break with a calm gesture and minimal words.`, score: 10, feedback: `Excellent. Low language and a predictable option support de-escalation.`, next: "step3" },
        B: { text: `Ask him to explain what happened.`, score: 0, feedback: `Neutral, but increases verbal load while still activated.`, next: "step3" },
        C: { text: `Tell him he has to clean up immediately.`, score: -10, feedback: `Demand during peak escalation can restart behavior.`, next: "step3" }
      }
    },
    step3: {
      text: `Student moves toward the reset space and stops throwing. How do you support recovery?`,
      choices: {
        A: { text: `Reinforce calm recovery with a Chart Move, then do cleanup later when fully regulated.`, score: 10, feedback: `Excellent. Reinforces recovery first and avoids re-triggering escalation.`, ending: "success" },
        B: { text: `Have him clean immediately without reinforcement.`, score: 0, feedback: `Neutral; may work but risks re-escalation if too soon.`, ending: "mixed" },
        C: { text: `Lecture about respect and make him apologize publicly.`, score: -10, feedback: `Public attention and demands can restart escalation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Crisis Managed — Recovery Reinforced`, text: `Safety was restored, attention was reduced, and calm recovery was reinforced before demands resumed.` },
    mixed:   { title: `Stabilized — Recovery Not Strengthened`, text: `Behavior stopped, but recovery behaviors were not reinforced and demands may have returned too quickly.` },
    fail:    { title: `Escalation Maintained`, text: `High attention, threats, or premature demands prolonged the episode or increased risk.` }
  }
});

POOL.crisis.push({
  id: "crisis_5_aggression_leaving",
  title: "Crisis Drill: Aggression and Leaving Area",
  start: "step1",
  steps: {
    step1: {
      text: `Student becomes escalated, kicks toward a peer, then immediately turns and moves quickly toward the door.`,
      choices: {
        A: { text: `Prioritize safety: move peers back, maintain line-of-sight, use a brief directive — stop, with me — and signal for immediate support.`, score: 10, feedback: `Correct. This is a high-risk combo — safety and support activation is essential.`, next: "step2" },
        B: { text: `Follow him into the hall without notifying anyone.`, score: 0, feedback: `Neutral but unsafe — support is delayed.`, next: "step2" },
        C: { text: `Chase him and grab his arm to stop him.`, score: -10, feedback: `High risk escalation and injury.`, next: "step2" }
      }
    },
    step2: {
      text: `With peers separated and support signaled, Student pauses at the doorway breathing hard. What do you offer?`,
      choices: {
        A: { text: `Offer a brief safe choice: reset here or walk with me back. Keep your voice calm and minimal.`, score: 10, feedback: `Excellent — predictable options reduce flight and aggression.`, next: "step3" },
        B: { text: `Ask him to explain what he was thinking.`, score: 0, feedback: `Neutral but too much language during high activation.`, next: "step3" },
        C: { text: `Tell him he is in big trouble and cannot leave.`, score: -10, feedback: `Threats often increase fleeing and aggression.`, next: "step3" }
      }
    },
    step3: {
      text: `Student slows and begins to calm with support present. What is the best next step?`,
      choices: {
        A: { text: `Reinforce calm recovery with a Chart Move, then re-enter with a low-demand task before returning to full demands.`, score: 10, feedback: `Excellent. Reinforces recovery and prevents immediate re-triggering.`, ending: "success" },
        B: { text: `Return to the original task without reinforcement.`, score: 0, feedback: `Neutral; recovery is not strengthened and demands may be too fast.`, ending: "mixed" },
        C: { text: `Have him explain the behavior and apologize to peers immediately.`, score: -10, feedback: `High-language social demands can restart escalation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Crisis Managed — Safe Recovery`, text: `Peers were protected, flight risk was contained, support was activated, and calm recovery was reinforced.` },
    mixed:   { title: `Stabilized — Risk of Repeat`, text: `Safety was restored, but recovery was not reinforced and demands may have returned too quickly.` },
    fail:    { title: `Escalation Continued`, text: `Chasing, threats, or high-language demands maintained or increased crisis behavior.` }
  }
});

/* ---- WILDCARD SCENARIOS ---- */

POOL.wild.push({
  id: "wild_1_unexpected_location_change",
  title: "Wildcard Mission: Unexpected Location Change",
  start: "step1",
  steps: {
    step1: {
      text: `An announcement comes over the intercom: your class must move to a different room right away. Student tenses, steps away from the line, and loudly asks why you are going there.`,
      choices: {
        A: { text: `Use a brief calm directive with predictability: we go together, stay with me — and gesture where to stand.`, score: 10, feedback: `Great fidelity. Low language, clear anchor, reduces escalation during unexpected transitions.`, next: "step2" },
        B: { text: `Explain the reason for the change and reassure him it will be fine.`, score: 0, feedback: `Neutral, but extra talking can increase activation during uncertainty.`, next: "step2" },
        C: { text: `Say sharply: stop arguing and get in line.`, score: -10, feedback: `High-intensity correction during a change can escalate behavior and increase risk of leaving area.`, next: "step2" }
      }
    },
    step2: {
      text: `Student steps closer but keeps scanning the hallway and peers. What do you offer?`,
      choices: {
        A: { text: `Offer a simple choice: walk next to me or walk behind me — gesture both options.`, score: 10, feedback: `Excellent. Choices increase compliance without a debate and reduce flight risk.`, next: "step3" },
        B: { text: `Tell him he is okay repeatedly while walking.`, score: 0, feedback: `Neutral; repeated verbal attention may not help regulation.`, next: "step3" },
        C: { text: `Warn him he will lose a privilege if he does not comply.`, score: -10, feedback: `Threats during high uncertainty can increase escalation.`, next: "step3" }
      }
    },
    step3: {
      text: `Student arrives at the new location and is calm enough to participate. What is the best next step?`,
      choices: {
        A: { text: `Reinforce coping and compliance with a Chart Move and start with a low-demand entry task.`, score: 10, feedback: `Perfect. Reinforces flexibility and prevents immediate re-triggering.`, ending: "success" },
        B: { text: `Proceed immediately with full expectations without reinforcement.`, score: 0, feedback: `Neutral; participation may occur, but flexibility coping is not strengthened.`, ending: "mixed" },
        C: { text: `Process the refusal publicly and require an apology before he can join.`, score: -10, feedback: `High language and public attention can restart escalation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Flexibility Reinforced`, text: `Student tolerated an unexpected location change with predictable structure, and coping was reinforced with a Chart Move.` },
    mixed:   { title: `Mixed — Moved But Not Strengthened`, text: `Student complied, but flexibility and coping were not clearly reinforced.` },
    fail:    { title: `Fail — Escalation Maintained`, text: `Public attention, threats, or high demands increased escalation and risk of leaving area.` }
  }
});

POOL.wild.push({
  id: "wild_2_unstructured_time",
  title: "Wildcard Mission: Unstructured Time Surge",
  start: "step1",
  steps: {
    step1: {
      text: `A planned activity ends early and you suddenly have 10 minutes of open time. Student seeks a peer, gets too close, and begins bumping bodies. The peer says stop, and Student's posture stiffens.`,
      choices: {
        A: { text: `Pre-correct and structure immediately: assign a clear option such as drawing or a puzzle, and set a boundary — hands to self.`, score: 10, feedback: `Excellent. You remove ambiguity that fuels behavior and set expectations before escalation.`, next: "step2" },
        B: { text: `Say: be nice — and hope it settles.`, score: 0, feedback: `Neutral; not enough structure for a known risk time.`, next: "step2" },
        C: { text: `Call him out loudly in front of peers for being unsafe.`, score: -10, feedback: `Public attention can increase peer-maintained behavior and intensify risk.`, next: "step2" }
      }
    },
    step2: {
      text: `Student hesitates, then looks at the activity options, still buzzing with energy. What do you offer?`,
      choices: {
        A: { text: `Offer a small choice with proximity: pick your spot — table or rug — and stay nearby without hovering.`, score: 10, feedback: `Great. Structured choice and calm proximity reduces peer-driven escalation.`, next: "step3" },
        B: { text: `Let him roam as long as he is not hurting anyone.`, score: 0, feedback: `Neutral; roaming can quickly trigger peer conflict.`, next: "step3" },
        C: { text: `Tell him he is on a last warning and watch him closely.`, score: -10, feedback: `Threat-based attention can intensify performance behaviors.`, next: "step3" }
      }
    },
    step3: {
      text: `Student moves to a chosen activity spot and begins engaging with materials. How do you finish the block?`,
      choices: {
        A: { text: `Reinforce safe participation with a Chart Move and preview the next structured activity.`, score: 10, feedback: `Excellent. Reinforces the right behavior and bridges to the next transition.`, ending: "success" },
        B: { text: `Let time run out and move on without reinforcement or preview.`, score: 0, feedback: `Neutral; does not strengthen safe unstructured behavior.`, ending: "mixed" },
        C: { text: `Publicly remind everyone about Student's behavior before transitioning.`, score: -10, feedback: `Public attention can re-trigger peer-maintained behavior.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Unstructured Time Stabilized`, text: `Student stayed safe during an unstructured block because structure was added quickly and safe behavior was reinforced.` },
    mixed:   { title: `Mixed — Safe Enough But Weak Support`, text: `The moment passed without a major incident, but structure and reinforcement were not strong enough.` },
    fail:    { title: `Fail — Peer Attention Fueled Escalation`, text: `Public attention and weak structure allowed peer conflict to grow.` }
  }
});

POOL.wild.push({
  id: "wild_3_substitute_day",
  title: "Wildcard Mission: New Adult / Substitute Day",
  start: "step1",
  steps: {
    step1: {
      text: `A substitute is in the room. Student notices immediately and begins testing limits — refusing a direction and grinning at peers like he is performing.`,
      choices: {
        A: { text: `Keep routine predictable: give the sub a quick script and use a brief directive to Student — same routine, start now.`, score: 10, feedback: `Excellent. Predictability reduces attention-seeking and prevents limit-testing from escalating.`, next: "step2" },
        B: { text: `Tell the sub that he can be difficult — within earshot of peers.`, score: 0, feedback: `Neutral but risks reinforcing behavior by giving him a public spotlight.`, next: "step2" },
        C: { text: `Publicly confront him: do not try that today.`, score: -10, feedback: `Public challenge can escalate and increase peer attention.`, next: "step2" }
      }
    },
    step2: {
      text: `Student hesitates, then starts moving but watches peers to see if they are impressed. How do you respond?`,
      choices: {
        A: { text: `Reinforce quickly and quietly: brief specific praise and a Chart Move once he initiates.`, score: 10, feedback: `Perfect. You reinforce task initiation under new-adult conditions.`, next: "step3" },
        B: { text: `Let him start without any reinforcement.`, score: 0, feedback: `Neutral; initiation is not strengthened and testing may return.`, next: "step3" },
        C: { text: `Add extra rules and reminders because it is a sub day.`, score: -10, feedback: `More talk and more rules can increase activation and resistance.`, next: "step3" }
      }
    },
    step3: {
      text: `Student begins participating in the routine with the substitute present. How do you conclude the period?`,
      choices: {
        A: { text: `Reinforce participation with a Chart Move and briefly preview that the same routine will stay in place next time.`, score: 10, feedback: `Excellent. Reinforces stability across adult changes and builds generalization.`, ending: "success" },
        B: { text: `Let the period end without reinforcement or preview.`, score: 0, feedback: `Neutral; does not strengthen generalization.`, ending: "mixed" },
        C: { text: `Debrief publicly about how he acted with the substitute.`, score: -10, feedback: `Public attention can reinforce the performance and increase future testing.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Routine Generalized`, text: `Student followed the routine with a new adult present and earned reinforcement for task initiation and coping.` },
    mixed:   { title: `Mixed — Participated But Testing May Return`, text: `Student participated, but generalization was not clearly reinforced.` },
    fail:    { title: `Fail — Spotlight Increased Escalation`, text: `Public attention, threats, or labeling increased peer reinforcement and escalated behavior.` }
  }
});

POOL.wild.push({
  id: "wild_4_technology_glitch",
  title: "Wildcard Mission: Technology Glitch",
  start: "step1",
  steps: {
    step1: {
      text: `Student is using a Chromebook for an activity. The screen freezes. He jabs the keys, raises his voice, and says it is not working while looking around to see who is watching.`,
      choices: {
        A: { text: `Use calm brief directive and support: hands down, show me — move closer with a low voice.`, score: 10, feedback: `Great fidelity. You reduce intensity, cue safe hands, and offer help without a big attention moment.`, next: "step2" },
        B: { text: `Say: just be patient — from across the room.`, score: 0, feedback: `Neutral; it does not give him a clear action or coping step.`, next: "step2" },
        C: { text: `Say loudly: stop yelling, you are fine.`, score: -10, feedback: `Public correction and invalidation can escalate frustration and increase peer attention.`, next: "step2" }
      }
    },
    step2: {
      text: `Student lowers his hands but keeps breathing fast and glancing at peers. What do you offer?`,
      choices: {
        A: { text: `Offer a simple choice: reset for one minute or swap to the paper version.`, score: 10, feedback: `Excellent — gives control, reduces frustration, and prevents escalation.`, next: "step3" },
        B: { text: `Keep troubleshooting while talking him through every step.`, score: 0, feedback: `Neutral — helpful, but lots of talk can prolong attention and activation.`, next: "step3" },
        C: { text: `Tell him he is losing tech time because of his attitude.`, score: -10, feedback: `Threats during frustration can trigger aggression or refusal.`, next: "step3" }
      }
    },
    step3: {
      text: `Student chooses an option and his breathing slows. He is able to re-engage. What is the best wrap-up?`,
      choices: {
        A: { text: `Reinforce coping and re-entry with a Chart Move and a brief private praise.`, score: 10, feedback: `Perfect. Reinforces the skill you want when frustration hits.`, ending: "success" },
        B: { text: `Move on without reinforcement to avoid making it a big deal.`, score: 0, feedback: `Neutral; coping happened, but it will not be strengthened.`, ending: "mixed" },
        C: { text: `Rehash what he did wrong and require an apology before continuing.`, score: -10, feedback: `High language and attention can restart escalation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Frustration Coping Strengthened`, text: `Student used a coping option and rejoined successfully; coping was reinforced with a Chart Move.` },
    mixed:   { title: `Mixed — Re-Engaged But Not Strengthened`, text: `Student returned to task, but without reinforcement the coping routine may not generalize.` },
    fail:    { title: `Fail — Escalation Reinforced`, text: `Public attention, threats, or shame increased escalation and made future tech glitches more likely to trigger unsafe behavior.` }
  }
});

POOL.wild.push({
  id: "wild_5_guest_observation",
  title: "Wildcard Mission: Guest in the Room",
  start: "step1",
  steps: {
    step1: {
      text: `A visitor enters and sits in the back of the room. Student notices instantly. He starts narrating loudly, making jokes, and watching peers to see if they laugh.`,
      choices: {
        A: { text: `Pre-correct quietly and keep the routine: same expectations, start with number one. Give the visitor a neutral update out of earshot if needed.`, score: 10, feedback: `Excellent. You avoid spotlighting Student and keep structure predictable.`, next: "step2" },
        B: { text: `Tell the visitor in front of Student that he sometimes struggles with behavior.`, score: 0, feedback: `Neutral, but it can create a performance stage and reinforce peer attention behavior.`, next: "step2" },
        C: { text: `Publicly correct Student: stop trying to show off because someone is here.`, score: -10, feedback: `Public calling-out increases attention and can escalate behavior.`, next: "step2" }
      }
    },
    step2: {
      text: `Student quiets slightly and starts the task, but keeps glancing at the visitor. How do you respond?`,
      choices: {
        A: { text: `Tighten reinforcement: provide a quick low-key Chart Move when he initiates and stays on-task.`, score: 10, feedback: `Perfect. Reinforces task initiation under audience conditions.`, next: "step3" },
        B: { text: `Ignore all of it so it does not become a big deal.`, score: 0, feedback: `Neutral; could work, but you might miss a key reinforcement opportunity.`, next: "step3" },
        C: { text: `Give him lots of reminders about the visitor watching.`, score: -10, feedback: `Too much attention and talk can maintain the performance.`, next: "step3" }
      }
    },
    step3: {
      text: `Student stabilizes and works within expectations with the visitor present. How do you end the observation period?`,
      choices: {
        A: { text: `Reinforce regulation and on-task behavior with a Chart Move and a short private praise.`, score: 10, feedback: `Excellent. Reinforces coping under audience conditions without spotlighting.`, ending: "success" },
        B: { text: `End class as normal without reinforcement.`, score: 0, feedback: `Neutral; does not strengthen future guest-day coping.`, ending: "mixed" },
        C: { text: `Discuss his attention-seeking in front of the visitor and peers.`, score: -10, feedback: `Public processing can reinforce performance behavior and increase future risk.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success — Guest Day Coping Reinforced`, text: `Student stayed regulated and engaged with routines even with a visitor present, and coping was reinforced privately.` },
    mixed:   { title: `Mixed — Got Through It`, text: `Student managed, but without reinforcement guest days may still trigger attention-seeking.` },
    fail:    { title: `Fail — Audience Reinforced Escalation`, text: `Public attention and threats turned the guest into a performance trigger, increasing risk of unsafe behavior.` }
  }
});
