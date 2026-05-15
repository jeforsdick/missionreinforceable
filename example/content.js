/* MA - content.js
 * Example game version with 3 Daily, 3 Crisis, and 3 Wildcard missions.
 * Each mission uses true branching: teacher choices change the next scene.
 */

GAME_CONFIG.resultEndpoint = "https://script.google.com/macros/s/AKfycbzC5K61n8NjERZCiqSIF8iPUl20_VxM2pJNRzo3CLGVe5ODwbvGk8fT3P-_TlYzrLDy/exec";
GAME_CONFIG.defaultStudent = "Test";

GAME_CONFIG.fidelityHigh = `High fidelity. You stayed calm, brief, and plan-aligned. You protected access to instruction, reduced the audience for behavior, and reinforced the replacement behavior quickly enough for Student to stay connected to the routine.`;
GAME_CONFIG.fidelityMid  = `Developing fidelity. Some parts of your response matched the plan, but the timing, specificity, or reinforcement was not strong enough yet. Tighten the next move: fewer words, clearer action, and immediate reinforcement for the replacement behavior.`;
GAME_CONFIG.fidelityLow  = `Low fidelity. The response pattern drifted from the plan and increased the chance that escape, peer attention, or adult attention would maintain the behavior. Reset with one clear directive, prompt the replacement behavior, and reinforce the first safe step back.`;

GAME_CONFIG.actionHigh = `<ul>
  <li>Keep using brief, private prompts before predictable triggers.</li>
  <li>Pair clear one-step directions with fast Chart Move reinforcement.</li>
  <li>Continue protecting the student's access to instruction, peers, and classroom routines.</li>
</ul>`;
GAME_CONFIG.actionMid = `<ul>
  <li>Prompt the replacement behavior earlier, before peers become the audience.</li>
  <li>Make directions more observable, such as hands down, open page one, or stand by me.</li>
  <li>Deliver the Chart Move immediately when Student shows safe hands, calm body, task start, or appropriate requesting.</li>
</ul>`;
GAME_CONFIG.actionLow = `<ul>
  <li>Reduce public correction and adult attention during escalation.</li>
  <li>Return to the plan sequence: prevent, prompt, reinforce, then reset if needed.</li>
  <li>Practice the replacement script outside difficult moments so it is available during stress.</li>
</ul>`;

POOL.daily = [];
POOL.crisis = [];
POOL.wild = [];

/* ============================================================
   DAILY MISSIONS
   ============================================================ */

POOL.daily.push({
  id: "daily_1_rug_time_pressure",
  title: "Daily Mission: Rug Time Pressure",
  start: "step1",
  steps: {
    step1: {
      text: `The class is gathered on the rug for a short phonics lesson. The room is mostly calm, but Student is seated near two peers who often laugh when he performs. As you lift the first picture card, Student slides backward, taps a peer's shoe, and says, "I'm not doing this," just loud enough for nearby students to hear.\n\nYou have a few seconds to keep the routine from becoming a peer-attention moment. What do you do first?`,
      choices: {
        A: {
          text: `Move near Student, keep your voice low, and offer two acceptable spots for joining the lesson.`,
          score: 10,
          feedback: `Strong fidelity. You reduced the audience and gave Student a structured way back into the routine.`,
          wizard: `The Wizard lowers his staff as the room steadies. Student glances toward the peers, but there is no public spotlight to perform into. Two clear choices make the next move feel possible instead of like a demand to fight. The rug routine is still intact.`,
          next: "step2_supported"
        },
        B: {
          text: `Pause the lesson, remind Student of the rug rule, and ask him to show you expected behavior.`,
          score: 0,
          feedback: `Partially aligned. You named the expectation, but pausing the lesson gives the behavior more attention.`,
          wizard: `The Wizard tilts his head. The class waits, and that waiting becomes interesting. Student's eyes flick to the two peers beside him. He may still recover, but the moment now has more audience energy than it needed.`,
          next: "step2_wobble"
        },
        C: {
          text: `Address Student by name from the front and tell him to stop touching peers immediately.`,
          score: -10,
          feedback: `Not aligned. Public correction increases attention and can intensify the behavior.`,
          wizard: `The Wizard's robe snaps in the air. Several heads turn at once. Student has the audience now, and his shoulders lift like he has been challenged. The lesson pauses, peers watch, and the behavior just became more powerful.`,
          next: "step2_escalated"
        }
      }
    },
    step2_supported: {
      text: `Student chooses the chair spot beside the rug. He is not fully engaged yet, but his hands are quiet and he is close enough to participate. The class is still with you.`,
      choices: {
        A: {
          text: `Give one action step: hands on knees and point to the first sound card.`,
          score: 10,
          feedback: `Excellent. You gave an incompatible response and moved Student into participation.`,
          wizard: `The Wizard smiles. Student has something concrete to do with his hands, and the peer audience fades because the action is simple and immediate. He points to the card, and the lesson keeps its rhythm.`,
          next: "step3_strong"
        },
        B: {
          text: `Stay nearby, continue teaching, and wait to see if Student joins on his own.`,
          score: 0,
          feedback: `Possible but weak. You preserved calm, but missed the chance to prompt the replacement behavior.`,
          wizard: `The Wizard watches the moment stretch. Student stays quiet, but the routine is not locked in yet. Without a clear action, his attention drifts back toward the peers who reacted earlier.`,
          next: "step3_mixed"
        },
        C: {
          text: `Tell Student he made the right choice, then remind him not to bother peers again.`,
          score: -10,
          feedback: `Risky. The reminder brings attention back to the problem behavior instead of strengthening the replacement.`,
          wizard: `The Wizard winces. The first half helps, but the second half pulls the old behavior back onstage. Student hears the warning, peers hear the history, and the calm moment starts to wobble.`,
          next: "step3_mixed"
        }
      }
    },
    step2_wobble: {
      text: `The class is quiet, but the pause has grown noticeable. Student looks at you, then at the peers, and gives a small grin. He has not poked again, but he has not rejoined either.`,
      choices: {
        A: {
          text: `Move closer, lower your voice, and offer a chair-or-rug choice with a clear first action.`,
          score: 10,
          feedback: `Good recovery. You shifted from public rule talk to private structure and action.`,
          wizard: `The Wizard taps the floor, and the scene narrows back down. Your proximity shrinks the audience. The clear choice gives Student a way to save face and rejoin without winning a debate.`,
          next: "step3_recovered"
        },
        B: {
          text: `Repeat the expectation once and continue the lesson while watching him from the front.`,
          score: 0,
          feedback: `Partially aligned. You avoided arguing, but the support is still not specific enough.`,
          wizard: `The Wizard's eyes narrow. The lesson moves, but Student is still outside the routine. He can feel your attention from across the rug, and the peers are still close enough to matter.`,
          next: "step3_mixed"
        },
        C: {
          text: `Ask Student whether he wants to lose his rug privilege if he keeps disrupting.`,
          score: -10,
          feedback: `Not aligned. Threats can trigger escape and increase the value of peer attention.`,
          wizard: `The Wizard sounds the alarm. Student's grin hardens into refusal. The question invites a power struggle, and now the class is waiting to see who wins.`,
          next: "step3_risk"
        }
      }
    },
    step2_escalated: {
      text: `Student says, "I didn't even do anything," louder this time. A few students shift and look between you and him. The lesson has lost momentum, but you can still repair.`,
      choices: {
        A: {
          text: `Stop debating, reduce language, and offer one private reset choice with a calm first step.`,
          score: 10,
          feedback: `Strong repair. You stopped feeding the audience and created a path back to regulation.`,
          wizard: `The Wizard plants his staff. The argument loses oxygen. Student still looks irritated, but the private reset choice gives him a way out of the spotlight before the behavior grows.`,
          next: "step3_recovered"
        },
        B: {
          text: `Say you will talk later, continue the lesson, and monitor Student from a distance.`,
          score: 0,
          feedback: `This may reduce the immediate exchange, but Student still needs a clear replacement cue.`,
          wizard: `The Wizard studies the room. The public exchange stops, which helps, but Student remains loose in the routine. Without a specific action, the next peer glance may restart the performance.`,
          next: "step3_mixed"
        },
        C: {
          text: `Move Student away from the rug while explaining that he lost the chance to participate.`,
          score: -10,
          feedback: `Not aligned. Removing access after public correction can strengthen escape from instruction.`,
          wizard: `The Wizard's warning bell rings. Student leaves the rug with every peer watching. The task disappears, the audience is huge, and the behavior has just purchased escape from the lesson.`,
          next: "step3_risk"
        }
      }
    },
    step3_strong: {
      text: `Student points to the card and keeps his hands on his knees. You are back in the lesson. This is the small moment that can strengthen tomorrow's routine.`,
      choices: {
        A: { text: `Give brief private praise, mark a Chart Move, and continue with the next sound card.`, score: 10, feedback: `Excellent. You reinforced the exact behavior you want to see again.`, wizard: `The Wizard beams. The reinforcement lands while the behavior is fresh. Student sees that quiet hands and participation pay off, and the class barely notices the repair because the lesson never stopped moving.`, ending: "success" },
        B: { text: `Continue teaching and save praise for later so the moment does not become too big.`, score: 0, feedback: `Understandable, but delayed reinforcement is weaker for building the routine.`, wizard: `The Wizard nods slowly. The calm moment survives, but it fades without being named. Student did the right thing, yet the routine misses a chance to become more rewarding.`, ending: "mixed" },
        C: { text: `Praise the choice, then tell the group Student is doing better now.`, score: -10, feedback: `Public attention can restart the peer-audience cycle.`, wizard: `The Wizard grimaces. The class turns back toward Student. What was almost private reinforcement turns into a spotlight, and the peer audience starts to glow again.`, ending: "mixed" }
      }
    },
    step3_recovered: {
      text: `Student takes the reset choice and returns close enough to participate. The room is not as smooth as before, but the mission can still be saved.`,
      choices: {
        A: { text: `Reinforce calm return with a Chart Move and give one simple participation step.`, score: 10, feedback: `Good recovery. You reinforced regulation and re-entry, not the disruption.`, wizard: `The Wizard steadies the scene. Student gets credit for returning, not for escalating. The class regains direction, and the routine has a repair path instead of a failure ending.`, ending: "success" },
        B: { text: `Let Student rejoin quietly and continue without mentioning what just happened.`, score: 0, feedback: `Calm but incomplete. Re-entry occurred, but the replacement behavior was not strengthened.`, wizard: `The Wizard exhales. The room is safe, but the learning moment slips by. Student rejoined, yet the plan's reinforcement piece never fully arrived.`, ending: "mixed" },
        C: { text: `Once Student is calm, review what he did wrong before allowing participation.`, score: -10, feedback: `Too much processing too soon can reignite the behavior.`, wizard: `The Wizard raises a warning hand. The calm is fragile. As the review begins, Student's face tightens again and the lesson risks sliding back into a public exchange.`, ending: "mixed" }
      }
    },
    step3_mixed: {
      text: `Student is quiet but loosely connected. He is near the routine, yet still scanning for peer reactions. Your final move determines whether this becomes practice or merely survival.`,
      choices: {
        A: { text: `Prompt one visible action and reinforce immediately when Student does it.`, score: 10, feedback: `Strong finish. You converted partial compliance into teachable replacement behavior.`, wizard: `The Wizard points to the opening. Student finally has a concrete move, and the Chart Move makes that move matter. The routine becomes more than quiet compliance.`, ending: "success" },
        B: { text: `Keep the lesson moving and plan to reinforce if Student participates more later.`, score: 0, feedback: `Reasonable but weak. Later reinforcement may miss the behavior you want to build.`, wizard: `The Wizard watches the moment dim. The class continues, but Student floats at the edge of engagement. The plan works best when reinforcement is close to the behavior.`, ending: "mixed" },
        C: { text: `Remind Student privately that the next disruption will lead to a consequence.`, score: -10, feedback: `Not aligned. Threats add attention without teaching the replacement.`, wizard: `The Wizard's cloak darkens. The reminder shifts Student's focus from participating to avoiding punishment. The routine becomes tense instead of reinforcing.`, ending: "fail" }
      }
    },
    step3_risk: {
      text: `Student is now more activated. He is farther from the task, peers are more aware, and you need a repair response that lowers attention quickly.`,
      choices: {
        A: { text: `Use minimal language, create a quiet reset option, and reinforce the first calm step back.`, score: 10, feedback: `Best available repair. You reduced attention and reinforced recovery.`, wizard: `The Wizard braces the room. The reset option lowers the temperature. It is not perfect, but Student gets a path back without needing to win the audience.`, ending: "mixed" },
        B: { text: `Wait silently until Student settles, then restart the lesson without feedback.`, score: 0, feedback: `This may stop the exchange, but recovery is not taught or reinforced.`, wizard: `The Wizard waits with you. The behavior may fade, but the replacement path remains blurry. Student calms because time passes, not because the routine became clearer.`, ending: "mixed" },
        C: { text: `Keep explaining the expectation until Student agrees to return appropriately.`, score: -10, feedback: `Not aligned. Extended explanation can maintain escalation and delay instruction.`, wizard: `The Wizard's alarm grows louder. The explanation becomes the event. Student argues, peers watch, and the lesson continues to slip away.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success - Routine Strengthened`, text: `Student returned to instruction with a clearer replacement path. Your choices protected the lesson and reinforced participation.` },
    mixed:   { title: `Mixed - Routine Survived`, text: `Student stabilized, but some reinforcement or replacement teaching was delayed or missed.` },
    fail:    { title: `Fail - Audience and Escape Increased`, text: `The response pattern increased peer attention, adult attention, or escape from instruction.` }
  }
});

POOL.daily.push({
  id: "daily_2_independent_work_start",
  title: "Daily Mission: Independent Work Start",
  start: "step1",
  steps: {
    step1: {
      text: `It is the first five minutes of independent work. The worksheet is short, but Student sees several written responses and freezes. He folds the paper corner, sighs loudly, and watches the students across the table. This is a common escape point, but it is also a good moment to build task initiation.\n\nWhat do you do first?`,
      choices: {
        A: { text: `Move close, lower your voice, and offer two starting points that both lead into the task.`, score: 10, feedback: `Strong fidelity. You reduced escape pressure while keeping the task available.`, wizard: `The Wizard leans over the worksheet. The task no longer looks like a wall. Student gets control within the assignment instead of control through refusal. His eyes move from the peers back to the page.`, next: "step2_supported" },
        B: { text: `Encourage effort, tell Student to try his best, and give him a moment to begin.`, score: 0, feedback: `Kind but incomplete. Encouragement alone may not reduce avoidance.`, wizard: `The Wizard watches the pencil stay still. Your tone is warm, but the task is still too vague. Student has room to drift, stall, or look for a reaction.`, next: "step2_wobble" },
        C: { text: `Tell Student the work is required and he needs to stop playing with the paper.`, score: -10, feedback: `Not aligned. The correction may increase escape and peer attention.`, wizard: `The Wizard's eyes flash. Student's shoulders stiffen. The worksheet has become a confrontation, and the folded corner is now the center of everyone's attention.`, next: "step2_escalated" }
      }
    },
    step2_supported: {
      text: `Student chooses the bottom problem and pulls the paper closer. His pencil is still down, but the task is no longer being pushed away.`,
      choices: {
        A: { text: `Give one concrete start action: write your name, then circle the first problem you chose.`, score: 10, feedback: `Excellent. You turned willingness into an observable task response.`, wizard: `The Wizard points to the first tiny step. Student's hand moves before avoidance can rebuild. The task begins with a motor action, not a lecture.`, next: "step3_strong" },
        B: { text: `Stand nearby and wait quietly because Student already chose where to start.`, score: 0, feedback: `Possible but weak. The choice helped, but momentum still needs support.`, wizard: `The Wizard waits beside you. The choice opened the door, but Student is still standing in the doorway. Without a first action, hesitation can turn back into escape.`, next: "step3_mixed" },
        C: { text: `Tell Student he picked the problem, so now he has no reason to delay.`, score: -10, feedback: `Risky. This shifts from support to pressure and can restart refusal.`, wizard: `The Wizard frowns. The choice stops feeling like control and starts feeling like a trap. Student's pencil hand slows as the demand pressure rises again.`, next: "step3_mixed" }
      }
    },
    step2_wobble: {
      text: `Student looks at the page for a few seconds, then folds the corner tighter. A peer notices and smiles. The avoidance has not exploded, but it is gaining shape.`,
      choices: {
        A: { text: `Return with a task choice and a first action that can be completed in ten seconds.`, score: 10, feedback: `Good recovery. You added structure before refusal became louder.`, wizard: `The Wizard moves quickly. The ten-second action makes starting feel possible. Student has less time to recruit the peer audience and more reason to touch the task.`, next: "step3_recovered" },
        B: { text: `Quietly remind Student that everyone is working and give another minute to start.`, score: 0, feedback: `Partially aligned. You stayed calm, but the replacement response remains unclear.`, wizard: `The Wizard studies the table. The room stays calm, but Student still does not know the next tiny move. Waiting may help, or it may give avoidance more time to grow.`, next: "step3_mixed" },
        C: { text: `Remove the folded paper and give a clean copy while explaining the expectation again.`, score: -10, feedback: `Not aligned. Adult attention and task reset may strengthen paper misuse.`, wizard: `The Wizard's alarm flickers. The folded paper just produced a new paper and a full adult explanation. Student learns that messing with materials can restart the task and pull you in.`, next: "step3_risk" }
      }
    },
    step2_escalated: {
      text: `Student says, "I can't do this," and pushes the worksheet farther away. Nearby students glance over. The work demand is now paired with public attention.`,
      choices: {
        A: { text: `Reduce language, place the paper within reach, and offer a brief break-or-first-problem choice.`, score: 10, feedback: `Strong repair. You lowered pressure without removing the path back to work.`, wizard: `The Wizard steadies the table. The demand gets smaller, not louder. Student can reset without escaping the whole routine, and the worksheet remains part of the path forward.`, next: "step3_recovered" },
        B: { text: `Move the worksheet aside briefly and say you will check back after helping another student.`, score: 0, feedback: `May reduce conflict, but the task initiation routine is not taught.`, wizard: `The Wizard notes the tradeoff. The conflict cools, but the worksheet also disappears from the immediate routine. Student may calm, but starting work has not become more likely yet.`, next: "step3_mixed" },
        C: { text: `Tell Student the assignment must be finished before any preferred activity happens.`, score: -10, feedback: `Not aligned. Threatening loss can intensify escape-maintained refusal.`, wizard: `The Wizard's staff strikes the floor. The worksheet becomes the gatekeeper to everything Student wants. Refusal grows stronger because the situation now feels bigger and harder to escape calmly.`, next: "step3_risk" }
      }
    },
    step3_strong: {
      text: `Student writes his name and circles the first problem. The pencil is moving. This is the exact task-initiation behavior the plan is trying to build.`,
      choices: {
        A: { text: `Mark a Chart Move immediately and give the next small step while momentum is high.`, score: 10, feedback: `Excellent. You reinforced task initiation at the right moment.`, wizard: `The Wizard grins. The reinforcement arrives while the pencil is still warm. Student learns that starting, not stalling, is what makes good things happen.`, ending: "success" },
        B: { text: `Let Student keep working quietly and save the Chart Move for more completed work.`, score: 0, feedback: `Understandable, but waiting may miss the behavior you most need to build.`, wizard: `The Wizard pauses. More work would be great, but initiation was the fragile skill. The moment passes without being strengthened as clearly as it could be.`, ending: "mixed" },
        C: { text: `Tell Student this is what he should have done the first time and then continue.`, score: -10, feedback: `Not aligned. Criticism after compliance can weaken future task initiation.`, wizard: `The Wizard winces. The pencil stops for a beat. Student did the right thing and received a reminder of failure, making the next start feel less safe.`, ending: "mixed" }
      }
    },
    step3_recovered: {
      text: `Student touches the pencil and completes the first small action. The recovery is not perfect, but the task has restarted.`,
      choices: {
        A: { text: `Reinforce the start with a Chart Move and preview the next single step.`, score: 10, feedback: `Good recovery. You reinforced the replacement response after avoidance.`, wizard: `The Wizard lifts the page like a map. Student sees the path again: small step, reinforcement, next step. The refusal loses power because re-entry is now rewarding.`, ending: "success" },
        B: { text: `Continue circulating and check back after Student completes a larger section.`, score: 0, feedback: `Partial support. The task is moving, but the replacement response was not reinforced quickly.`, wizard: `The Wizard nods with caution. The work may continue, but the first brave step back was the teachable moment. It needed a stronger signal.`, ending: "mixed" },
        C: { text: `Use the calm moment to explain why avoiding work makes the task harder.`, score: -10, feedback: `Risky. Processing too soon can pull Student back into avoidance.`, wizard: `The Wizard raises a hand. Student's eyes leave the paper as the explanation begins. The task fades again, and the conversation becomes the new escape route.`, ending: "mixed" }
      }
    },
    step3_mixed: {
      text: `Student is calmer, but work output is still thin. He may comply if supported, or stall again if the routine stays vague.`,
      choices: {
        A: { text: `Give a concrete ten-second action and reinforce immediately when Student completes it.`, score: 10, feedback: `Strong finish. You created a clear replacement response and reinforced it.`, wizard: `The Wizard points to the opening. A tiny action restarts the task, and quick reinforcement makes the start matter. The mission pulls back from drifting.`, ending: "success" },
        B: { text: `Keep expectations calm and wait for Student to show more independent work first.`, score: 0, feedback: `Calm, but the routine may remain under-reinforced.`, wizard: `The Wizard watches quietly. Nothing explodes, but nothing strengthens much either. The next hard worksheet may look exactly like this one.`, ending: "mixed" },
        C: { text: `Remind Student that continued delay will mean finishing during a preferred time.`, score: -10, feedback: `Not aligned. Threats can make work avoidance more emotionally loaded.`, wizard: `The Wizard darkens the room. The worksheet now carries a future punishment. Student may comply today, but the next worksheet just became more aversive.`, ending: "fail" }
      }
    },
    step3_risk: {
      text: `Student is no longer oriented to the task. The paper has become part of the conflict, and peer attention is starting to collect around the table.`,
      choices: {
        A: { text: `Reset privately with a brief break, then return to one small task action and reinforce it.`, score: 10, feedback: `Best repair. You lowered escalation and preserved a path back to work.`, wizard: `The Wizard guides the mission back from the edge. The break lowers the heat, but the task does not disappear forever. Student gets a new way back that does not require more refusal.`, ending: "mixed" },
        B: { text: `Give space until Student is quiet, then place the worksheet back without comment.`, score: 0, feedback: `May reduce interaction, but replacement behavior is not taught.`, wizard: `The Wizard waits. Silence returns, but the routine remains fragile. Student may restart or may avoid quietly, because the path forward is still unclear.`, ending: "mixed" },
        C: { text: `Insist Student begin immediately so the class sees that refusal does not work.`, score: -10, feedback: `Not aligned. This increases public stakes and can intensify refusal.`, wizard: `The Wizard's alarm blares. The class is now part of the demand. Student digs in harder because the task has become a public contest.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success - Work Started`, text: `Student initiated work because the task was structured, specific, and reinforced quickly.` },
    mixed:   { title: `Mixed - Work Partly Recovered`, text: `Student stabilized, but task initiation was not reinforced as clearly or quickly as it could have been.` },
    fail:    { title: `Fail - Avoidance Strengthened`, text: `The response pattern increased escape pressure, adult attention, or the emotional weight of the task.` }
  }
});

POOL.daily.push({
  id: "daily_3_partner_transition",
  title: "Daily Mission: Partner Work Transition",
  start: "step1",
  steps: {
    step1: {
      text: `You are moving from mini-lesson to partner work. The class is excited, chairs scrape, and the noise level rises. Student often struggles when roles are unclear and peers are watching. As you announce partners, Student says, "I'm not working with anybody," and looks around to see who reacts.\n\nHow do you protect the transition?`,
      choices: {
        A: { text: `Move close, keep your voice low, and offer two role choices within the partner routine.`, score: 10, feedback: `Strong fidelity. You gave control within the expected routine.`, wizard: `The Wizard raises a glowing card labeled Agency. Student gets a choice that does not remove partner work. The peer audience has less to watch because the response is private and brief.`, next: "step2_supported" },
        B: { text: `Remind Student that everyone has a partner and ask him to choose quickly.`, score: 0, feedback: `Partially aligned. The direction is relevant, but it may invite negotiation.`, wizard: `The Wizard hears the clock ticking. The transition keeps moving around Student, but the wording leaves room for debate. Student can still turn this into a public negotiation.`, next: "step2_wobble" },
        C: { text: `Tell Student to stop refusing and join the partner activity like everyone else.`, score: -10, feedback: `Not aligned. Public correction can increase refusal and peer attention.`, wizard: `The Wizard's warning flame flares. The words land in front of the audience Student was looking for. Several peers glance over, and refusal now has a stage.`, next: "step2_escalated" }
      }
    },
    step2_supported: {
      text: `Student chooses to be Partner B. He is moving, but slowly, and he is still watching the peer group.`,
      choices: {
        A: { text: `Give one concrete action: sit beside your partner and open the shared page.`, score: 10, feedback: `Excellent. You turned the choice into a task-focused action.`, wizard: `The Wizard opens the book with a snap. Student now has a visible job. The transition becomes about where to sit and what to open, not whether he can refuse.`, next: "step3_strong" },
        B: { text: `Let Student move at his own pace while you help the rest of the class settle.`, score: 0, feedback: `Maybe workable, but the transition remains loosely supported.`, wizard: `The Wizard watches Student hover at the edge. The class is settling, but Student still has space to drift or perform. Momentum is not guaranteed.`, next: "step3_mixed" },
        C: { text: `Tell Student he chose Partner B, so he needs to stop dragging his feet.`, score: -10, feedback: `Risky. This adds pressure and attention after a good first choice.`, wizard: `The Wizard grimaces. A useful choice starts to feel like a trap. Student's pace slows, and the audience begins to matter again.`, next: "step3_mixed" }
      }
    },
    step2_wobble: {
      text: `Student says, "I don't care," and stands between his desk and the partner area. The class is mostly moving, but this spot is becoming visible.`,
      choices: {
        A: { text: `Offer two role choices quietly and point to the exact seat where Student can start.`, score: 10, feedback: `Good recovery. You added privacy, structure, and a clear first step.`, wizard: `The Wizard narrows the path. Student can stop performing and simply choose a role. The seat cue makes the transition physical and doable.`, next: "step3_recovered" },
        B: { text: `Tell Student you will check back in one minute and continue organizing partners.`, score: 0, feedback: `This reduces attention, but it delays active support for the transition.`, wizard: `The Wizard marks the delay. The public pressure drops, which helps, but Student remains outside the activity. A minute can become an escape window.`, next: "step3_mixed" },
        C: { text: `Ask Student in front of the class why partner work is such a problem today.`, score: -10, feedback: `Not aligned. Public questioning increases attention and verbal load.`, wizard: `The Wizard throws up a shield too late. The question hands Student a microphone. The transition stalls while the class waits for his answer.`, next: "step3_risk" }
      }
    },
    step2_escalated: {
      text: `Student crosses his arms and says, "Make me." A few peers laugh under their breath. The partner activity is now competing with a public power struggle.`,
      choices: {
        A: { text: `Drop the debate, reduce language, and give a private choice between role card and seat card.`, score: 10, feedback: `Strong repair. You removed the contest and returned to structured choice.`, wizard: `The Wizard cuts the spotlight in half. The challenge has nowhere to grow because you do not challenge back. Student gets a face-saving route into the routine.`, next: "step3_recovered" },
        B: { text: `Give Student space to cool down while partners begin, then invite him in quietly.`, score: 0, feedback: `May lower escalation, but the routine is delayed and under-taught.`, wizard: `The Wizard steadies the room, but Student is now outside the learning routine. Cooling down helps, yet partner participation still needs a clear bridge.`, next: "step3_mixed" },
        C: { text: `Move Student away from the group and tell him partner work is no longer available.`, score: -10, feedback: `Not aligned. This may reinforce escape from peer work.`, wizard: `The Wizard's alarm rings. Student escapes the partner task and the peers saw the whole exit. Refusal just changed the schedule.`, next: "step3_risk" }
      }
    },
    step3_strong: {
      text: `Student sits beside the partner and opens the shared page. The transition is almost complete, and reinforcement now can make flexibility more likely next time.`,
      choices: {
        A: { text: `Mark a Chart Move for joining partner work and give the first partner task step.`, score: 10, feedback: `Excellent. You reinforced flexibility and moved into instruction.`, wizard: `The Wizard's staff glows. Student learns that joining, not refusing, produces reinforcement and a clear role. The partner routine becomes safer and more predictable.`, ending: "success" },
        B: { text: `Let the pair begin and save reinforcement until Student completes the first item.`, score: 0, feedback: `Reasonable, but joining the routine was the critical behavior to strengthen.`, wizard: `The Wizard nods, but softly. The pair starts, yet the flexible transition passes without a strong signal. Tomorrow's partner shift may need the same help again.`, ending: "mixed" },
        C: { text: `Tell the partner to thank Student for finally joining so the group can start.`, score: -10, feedback: `Not aligned. This makes the repair public and socially loaded.`, wizard: `The Wizard winces as the spotlight returns. Student joined, but now the peer has been pulled into the correction. The routine feels more embarrassing than reinforcing.`, ending: "mixed" }
      }
    },
    step3_recovered: {
      text: `Student accepts the role card and moves to the partner space. He is still tense, but the task is available again.`,
      choices: {
        A: { text: `Reinforce the move with a Chart Move and preview the first low-demand partner action.`, score: 10, feedback: `Good recovery. You reinforced re-entry and reduced the immediate demand.`, wizard: `The Wizard opens a small doorway back into the mission. Student gets credit for recovering, and the low-demand first action keeps the transition from reigniting.`, ending: "success" },
        B: { text: `Let Student join without comment so you do not draw more attention.`, score: 0, feedback: `Calm, but the replacement behavior is not clearly reinforced.`, wizard: `The Wizard understands the instinct. The room stays calm, but Student's flexible return is almost invisible to the reinforcement system.`, ending: "mixed" },
        C: { text: `Review the refusal privately before Student begins working with the partner.`, score: -10, feedback: `Risky. Processing before re-entry can restart resistance.`, wizard: `The Wizard raises a caution flag. Student was almost back in. The review pulls him away from the task and back into the refusal story.`, ending: "mixed" }
      }
    },
    step3_mixed: {
      text: `Student is near the partner area but not fully participating. He may still join, but the moment needs a decisive, low-attention bridge.`,
      choices: {
        A: { text: `Give one role-based action and reinforce immediately when Student starts it.`, score: 10, feedback: `Strong finish. You created an entry response and reinforced it.`, wizard: `The Wizard points to the role card. Student finally has a job that fits the routine. The Chart Move turns partial presence into participation.`, ending: "success" },
        B: { text: `Keep the activity moving and wait to reinforce once the pair completes something.`, score: 0, feedback: `Possible, but the transition behavior remains weakly reinforced.`, wizard: `The Wizard watches the pair wobble forward. Work might happen, but the transition skill itself is still underbuilt.`, ending: "mixed" },
        C: { text: `Warn Student that refusing partner work will affect the next preferred activity.`, score: -10, feedback: `Not aligned. Threats can increase resistance and make partner work more aversive.`, wizard: `The Wizard darkens the role card. Partner work now predicts losing something later. The routine becomes heavier, not easier.`, ending: "fail" }
      }
    },
    step3_risk: {
      text: `Student is now separated from the partner routine and peers are aware of the disruption. You need to reduce attention while preserving a route back.`,
      choices: {
        A: { text: `Use a brief reset, then offer one quiet partner role with immediate reinforcement for re-entry.`, score: 10, feedback: `Best repair. You reduced escalation and rebuilt access to the routine.`, wizard: `The Wizard restores a narrow bridge. Student can return without a public apology tour. The mission is bruised, but not lost.`, ending: "mixed" },
        B: { text: `Let Student observe the partner task quietly and invite participation later.`, score: 0, feedback: `May reduce conflict, but escape from active participation remains likely.`, wizard: `The Wizard watches from the sideline. Observation is calmer, but it is not the same as joining. The avoidance pathway is still partly open.`, ending: "mixed" },
        C: { text: `Require Student to apologize to the partner before he can rejoin the activity.`, score: -10, feedback: `Not aligned during activation. Social demands can prolong escalation.`, wizard: `The Wizard sounds the alarm. The apology demand adds language, audience, and pressure. Student moves farther from the partner task.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success - Partner Routine Protected`, text: `Student joined partner work because choices, role clarity, and reinforcement made participation possible.` },
    mixed:   { title: `Mixed - Participation Was Fragile`, text: `Student moved closer to the routine, but reinforcement or role clarity was not strong enough.` },
    fail:    { title: `Fail - Refusal Gained Power`, text: `Public attention, threats, or removal from the task increased the value of refusing partner work.` }
  }
});

/* ============================================================
   CRISIS MISSIONS
   ============================================================ */

POOL.crisis.push({
  id: "crisis_1_peer_safety_line",
  title: "Crisis Drill: Peer Safety in Line",
  start: "step1",
  steps: {
    step1: {
      text: `The class is lining up after a noisy activity. Bodies are close, backpacks brush shoulders, and Student is already breathing fast. A peer bumps him by accident. Student kicks toward the peer and swings an arm as several students gasp.

This is no longer a teaching moment first. It is a safety moment. What do you do?`,
      choices: {
        A: {
          text: `Create space, move peers back, use one brief safety directive, and signal for support.`,
          score: 10,
          feedback: `Correct. Safety, space, minimal language, and support come first.`,
          wizard: `The Wizard throws a shield between Student and the line. Peers move out of reach, the audience shrinks, and your words stay short enough for Student to process. The crisis has a chance to slow down.`,
          next: "step2_safe"
        },
        B: {
          text: `Stand close, ask what happened, and remind Student that kicking is unsafe.`,
          score: 0,
          feedback: `Well intended, but too much language and proximity during immediate safety risk.`,
          wizard: `The Wizard stiffens. Your intent is supportive, but the questions arrive while Student is still activated. The peer is still close, and Student's body is not ready for a conversation.`,
          next: "step2_wobble"
        },
        C: {
          text: `Grab Student's arm, tell him to stop, and direct the line to keep moving.`,
          score: -10,
          feedback: `Unsafe. Physical grabbing and movement demands can intensify aggression.`,
          wizard: `The Wizard's alarm explodes. Student feels trapped, peers are still near, and the moving line adds chaos. The crisis now has more touch, more audience, and more risk.`,
          next: "step2_escalated"
        }
      }
    },

    step2_safe: {
      text: `Peers step back. Student is still tense, but the immediate strike zone is clear. Support is on the way.`,
      choices: {
        A: {
          text: `Repeat one brief directive and guide Student toward the reset area with space.`,
          score: 10,
          feedback: `Strong. You kept language low and shifted toward de-escalation.`,
          wizard: `The Wizard lowers the volume of the scene. Student hears one direction, not a lecture. The reset area becomes the next safe destination.`,
          next: "step3_recovery"
        },
        B: {
          text: `Tell Student he is safe now and wait for him to explain what he needs.`,
          score: 0,
          feedback: `Supportive, but explanation may be too demanding during activation.`,
          wizard: `The Wizard watches Student's breathing. The words are kind, but the expectation to explain may come too early. Regulation is still the first job.`,
          next: "step3_stable"
        },
        C: {
          text: `Tell Student the line cannot move until he shows everyone calm behavior.`,
          score: -10,
          feedback: `Risky. This makes Student responsible for the whole group's waiting.`,
          wizard: `The Wizard points to the watching class. The pressure grows. Student can feel every peer waiting on him, and that audience can fuel the next burst.`,
          next: "step3_risk"
        }
      }
    },

    step2_wobble: {
      text: `Student yells, "He hit me first!" and steps toward the peer again. The line tightens and students are watching.`,
      choices: {
        A: {
          text: `Stop the discussion, clear peers away, use one safety directive, and call support.`,
          score: 10,
          feedback: `Good recovery. You returned to safety instead of continuing the conversation.`,
          wizard: `The Wizard snaps the shield back up. The story of blame can wait. Bodies move apart, language shrinks, and the crisis loses some fuel.`,
          next: "step3_recovery"
        },
        B: {
          text: `Tell both students you will solve it after they each calm their bodies.`,
          score: 0,
          feedback: `Partially aligned, but peer separation still needs to happen immediately.`,
          wizard: `The Wizard sees the missing piece. The words are reasonable, but the peer is still too close. Safety needs more than a future promise.`,
          next: "step3_stable"
        },
        C: {
          text: `Tell Student he is making it worse and needs to take responsibility now.`,
          score: -10,
          feedback: `Not aligned. Blame language can intensify crisis behavior.`,
          wizard: `The Wizard's warning bell rings. Student's face tightens. The crisis shifts from safety to shame, and aggression risk rises again.`,
          next: "step3_risk"
        }
      }
    },

    step2_escalated: {
      text: `Student pulls away and yells louder. A few peers step back on their own, but the scene is disorganized. The crisis has intensified.`,
      choices: {
        A: {
          text: `Release pressure, increase space, use minimal language, and wait for support before moving him.`,
          score: 10,
          feedback: `Best repair. You reduced physical and verbal escalation.`,
          wizard: `The Wizard opens the space around Student. The mission is risky, but removing pressure slows the spiral. Support can now enter a less chaotic scene.`,
          next: "step3_recovery"
        },
        B: {
          text: `Stand between Student and peers while repeating that everyone needs to stay calm.`,
          score: 0,
          feedback: `You are trying to protect peers, but repeated language may keep activation high.`,
          wizard: `The Wizard holds the line with effort. Peers are safer, but Student keeps hearing words while his body is still in alarm mode.`,
          next: "step3_stable"
        },
        C: {
          text: `Hold your position and insist Student walk with you before anyone else moves.`,
          score: -10,
          feedback: `Not aligned. Insistence during high activation can increase aggression or flight.`,
          wizard: `The Wizard's red signal flashes. Student sees no exit except escalation. The demand to move now becomes another trigger.`,
          next: "step3_risk"
        }
      }
    },

    step3_recovery: {
      text: `Student reaches the reset area with space from peers. His breathing is still heavy, but his hands are down. This is the recovery window.`,
      choices: {
        A: {
          text: `Reinforce calm body with a Chart Move and offer a low-demand re-entry plan.`,
          score: 10,
          feedback: `Excellent. You reinforced recovery and planned a safe return.`,
          wizard: `The Wizard's shield fades into a doorway. Student learns that calm recovery, not aggression, opens the path back. The next step is small enough to be safe.`,
          ending: "success"
        },
        B: {
          text: `Let Student rest quietly and return him once the line has already left.`,
          score: 0,
          feedback: `May keep safety, but recovery is not clearly reinforced or taught.`,
          wizard: `The Wizard nods cautiously. The crisis ends, but the recovery skill is quiet and unmarked. Student may calm, yet the plan did not fully teach what worked.`,
          ending: "mixed"
        },
        C: {
          text: `Process the kick immediately so Student understands why the reset happened.`,
          score: -10,
          feedback: `Too soon. Processing during recovery can reignite escalation.`,
          wizard: `The Wizard raises both hands. Student's calm is still thin. The discussion pulls him back toward the hot moment before his body is ready.`,
          ending: "mixed"
        }
      }
    },

    step3_stable: {
      text: `The immediate danger is lower, but Student is still activated. Peers are somewhat separated, and you need to avoid restarting the crisis.`,
      choices: {
        A: {
          text: `Use one calm directive, increase space, and reinforce the first visible calm response.`,
          score: 10,
          feedback: `Strong finish. You moved from stabilization to recovery.`,
          wizard: `The Wizard guides the scene toward safety. One calm response becomes the new target, and reinforcement gives Student a reason to stay there.`,
          ending: "success"
        },
        B: {
          text: `Maintain space and wait for support without adding more directions.`,
          score: 0,
          feedback: `Safe but incomplete. Waiting may be appropriate, but recovery behavior is not strengthened.`,
          wizard: `The Wizard stands watch. The scene may stay safe, but Student is not learning the next replacement step yet.`,
          ending: "mixed"
        },
        C: {
          text: `Tell Student he must apologize before returning to any group activity.`,
          score: -10,
          feedback: `Not aligned. Social demands can restart escalation during crisis recovery.`,
          wizard: `The Wizard blocks the apology demand. Student's body is barely regulated, and the social pressure risks lighting the crisis again.`,
          ending: "fail"
        }
      }
    },

    step3_risk: {
      text: `Student remains tense and the peer audience is still part of the scene. A poor next move could trigger another unsafe response.`,
      choices: {
        A: {
          text: `Stop all discussion, clear more space, and wait for support while using minimal prompts.`,
          score: 10,
          feedback: `Best available repair. You reduced stimulation and protected safety.`,
          wizard: `The Wizard pulls the mission back from danger. Fewer words and more space remove the fuel. It is not elegant, but it is safer.`,
          ending: "mixed"
        },
        B: {
          text: `Keep Student away from peers and monitor quietly until the group transitions.`,
          score: 0,
          feedback: `Safety may be preserved, but active recovery support is limited.`,
          wizard: `The Wizard keeps one eye on the line. The risk lowers, but Student is mostly contained rather than taught a recovery path.`,
          ending: "mixed"
        },
        C: {
          text: `Continue explaining the safety concern until Student acknowledges what happened.`,
          score: -10,
          feedback: `Not aligned. Extended language can prolong or restart crisis behavior.`,
          wizard: `The Wizard sounds the final alarm. The explanation becomes another demand. Student's breathing spikes, and the crisis remains alive.`,
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: `Crisis Managed - Safety and Recovery`, text: `Peers were protected, language stayed low, and calm recovery was reinforced.` },
    mixed:   { title: `Crisis Stabilized - Teaching Was Limited`, text: `Safety improved, but the recovery behavior was not strengthened as clearly as possible.` },
    fail:    { title: `Crisis Escalated - Risk Increased`, text: `Attention, pressure, or premature demands increased the risk of aggression or renewed crisis behavior.` }
  }
});

POOL.crisis.push({
  id: "crisis_2_escalating_refusal",
  title: "Crisis Drill: Escalating Refusal",
  start: "step1",
  steps: {
    step1: {
      text: `A writing task has become too hard. Student pushes the paper away, raises his voice, and says, "I am not doing this." His chair scrapes backward. Peers look up from their work.

This is moving from avoidance into escalation. What is your first move?`,
      choices: {
        A: {
          text: `Reduce language, lower the demand briefly, and offer a reset-or-first-step choice.`,
          score: 10,
          feedback: `Correct. You reduced pressure while keeping a path back to work.`,
          wizard: `The Wizard lowers the heat in the room. Student still wants out, but the task is no longer a mountain. The choice gives him a way to recover without needing to fight harder.`,
          next: "step2_safe"
        },
        B: {
          text: `Tell Student the work is important and encourage him to try one problem.`,
          score: 0,
          feedback: `Supportive, but still verbal and demand-heavy during escalation.`,
          wizard: `The Wizard hears the kindness, but Student hears more task pressure. The pencil does not move. The room waits to see whether the refusal grows.`,
          next: "step2_wobble"
        },
        C: {
          text: `Tell Student he cannot leave the task until the writing is finished.`,
          score: -10,
          feedback: `Not aligned. Blocking escape verbally can intensify refusal.`,
          wizard: `The Wizard's warning flame rises. The task just became a locked gate. Student pushes back harder because the only escape route now appears to be escalation.`,
          next: "step2_escalated"
        }
      }
    },

    step2_safe: {
      text: `Student chooses a one-minute reset but keeps the paper nearby. His voice lowers, though his body is still tense.`,
      choices: {
        A: {
          text: `Honor the reset briefly, then return with one small writing action and immediate reinforcement.`,
          score: 10,
          feedback: `Strong. You supported regulation and planned re-entry.`,
          wizard: `The Wizard starts the timer. The reset is not escape from writing. It is a bridge back. Student gets a short recovery window and a tiny next action he can actually complete.`,
          next: "step3_recovery"
        },
        B: {
          text: `Let Student reset as long as needed and check back after the rest of the class is working.`,
          score: 0,
          feedback: `May reduce conflict, but the re-entry plan is too loose.`,
          wizard: `The Wizard watches the bridge stretch too far. Student calms, but the writing task drifts away. Without a clear return point, reset can become avoidance.`,
          next: "step3_stable"
        },
        C: {
          text: `Use the reset time to explain why refusing work makes the task take longer.`,
          score: -10,
          feedback: `Risky. Teaching during reset can restart escalation.`,
          wizard: `The Wizard's timer cracks. The reset stops feeling like regulation and starts feeling like a lecture. Student's shoulders rise again.`,
          next: "step3_risk"
        }
      }
    },

    step2_wobble: {
      text: `Student says, "You do it then," and slides the pencil away. He is not yelling now, but the task is still rejected.`,
      choices: {
        A: {
          text: `Shift to one concrete action and offer a supported choice for how to start.`,
          score: 10,
          feedback: `Good recovery. You moved from encouragement to actionable support.`,
          wizard: `The Wizard points to the pencil. The demand becomes smaller and clearer. Student can start with action instead of arguing about the whole assignment.`,
          next: "step3_recovery"
        },
        B: {
          text: `Give Student a little space and say you will come back when he is ready.`,
          score: 0,
          feedback: `Calm, but it may allow avoidance to continue without replacement teaching.`,
          wizard: `The Wizard steps back with you. The conflict lowers, but the task remains untouched. Student may calm, or he may learn that waiting makes writing disappear.`,
          next: "step3_stable"
        },
        C: {
          text: `Remind Student that refusing now means missing a preferred activity later.`,
          score: -10,
          feedback: `Not aligned. Threats can increase emotional responding around the task.`,
          wizard: `The Wizard darkens the page. Writing now predicts losing something later. The task becomes heavier, and Student's refusal gains emotional fuel.`,
          next: "step3_risk"
        }
      }
    },

    step2_escalated: {
      text: `Student pushes the chair back farther and says, "I hate this class." Several peers are now watching. The task demand has become public.`,
      choices: {
        A: {
          text: `Stop the debate, reduce words, and offer a brief reset with the paper still available.`,
          score: 10,
          feedback: `Best repair. You reduced attention while preserving a route back.`,
          wizard: `The Wizard pulls the spotlight down. You do not argue with the statement. The reset gives Student an off-ramp while the paper remains part of the mission path.`,
          next: "step3_recovery"
        },
        B: {
          text: `Move the paper aside and wait quietly until Student stops talking.`,
          score: 0,
          feedback: `May lower the exchange, but the work routine is not repaired yet.`,
          wizard: `The Wizard sees the room quieting, but the paper has vanished from the immediate routine. Calm may return, yet writing has not been rebuilt.`,
          next: "step3_stable"
        },
        C: {
          text: `Tell Student the comment was disrespectful and must be fixed before work continues.`,
          score: -10,
          feedback: `Not aligned during escalation. This adds social pressure and verbal load.`,
          wizard: `The Wizard's alarm rings. The mission shifts from writing to disrespect. Student now has a bigger conflict to escape, and peers are still watching.`,
          next: "step3_risk"
        }
      }
    },

    step3_recovery: {
      text: `Student's voice is lower. He has not started writing yet, but he is close enough to the task that re-entry is possible.`,
      choices: {
        A: {
          text: `Prompt one tiny writing action and reinforce immediately when Student completes it.`,
          score: 10,
          feedback: `Excellent. You reinforced re-entry and task initiation.`,
          wizard: `The Wizard lights the first word. Student does something small and successful. The refusal loses power because re-entry is now the behavior that gets reinforced.`,
          ending: "success"
        },
        B: {
          text: `Let Student stay calm a bit longer before bringing the writing demand back.`,
          score: 0,
          feedback: `Understandable, but re-entry may become delayed or unclear.`,
          wizard: `The Wizard waits beside the desk. Calm is useful, but the task bridge is fading. The longer writing stays away, the harder it may be to return.`,
          ending: "mixed"
        },
        C: {
          text: `Ask Student to explain what made the task feel so frustrating before restarting.`,
          score: -10,
          feedback: `Too much verbal processing too soon can restart avoidance.`,
          wizard: `The Wizard raises a hand. Student was almost back. The explanation demand pulls him into talking about the task instead of starting it.`,
          ending: "mixed"
        }
      }
    },

    step3_stable: {
      text: `Student is quieter, but the writing task has not restarted. The class is working again, and you have a chance to recover the routine.`,
      choices: {
        A: {
          text: `Return with one supported start option and reinforce the first mark on the page.`,
          score: 10,
          feedback: `Strong finish. You rebuilt the task-initiation path.`,
          wizard: `The Wizard places the pencil back in the story. The first mark matters. Student learns that calm return to work, not refusal, changes the outcome.`,
          ending: "success"
        },
        B: {
          text: `Let Student observe quietly and try the writing again during the next work period.`,
          score: 0,
          feedback: `Safe, but the current avoidance sequence is only partly repaired.`,
          wizard: `The Wizard closes the notebook halfway. The crisis is quieter, but the assignment escaped the moment. Tomorrow may bring the same battle.`,
          ending: "mixed"
        },
        C: {
          text: `Tell Student he can rejoin after he agrees not to refuse the assignment again.`,
          score: -10,
          feedback: `Not aligned. Requiring verbal agreement can restart the power struggle.`,
          wizard: `The Wizard's warning light returns. The task has become a promise Student must make under pressure. The refusal story comes back to life.`,
          ending: "fail"
        }
      }
    },

    step3_risk: {
      text: `Student is still activated. The paper is aversive, adult attention is high, and the next move could either lower the pressure or extend the episode.`,
      choices: {
        A: {
          text: `Use minimal language, offer a brief reset, and return later with one tiny action.`,
          score: 10,
          feedback: `Best available repair. You reduced pressure and planned re-entry.`,
          wizard: `The Wizard pulls the mission away from the cliff. It is not a clean win, but the episode stops growing. A small re-entry path remains possible.`,
          ending: "mixed"
        },
        B: {
          text: `Stop talking and wait nearby until Student's body is calm enough to continue.`,
          score: 0,
          feedback: `May reduce escalation, but replacement behavior is not yet taught.`,
          wizard: `The Wizard stands quietly. Waiting may prevent more damage, but the routine remains unfinished. Student is contained more than coached.`,
          ending: "mixed"
        },
        C: {
          text: `Continue explaining the expectation so Student understands that refusal is not an option.`,
          score: -10,
          feedback: `Not aligned. Continued explanation can maintain the escalation cycle.`,
          wizard: `The Wizard's alarm grows louder. The explanation becomes the new demand. Student argues, the task stays gone, and the cycle strengthens.`,
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: `Crisis De-escalated - Re-entry Built`, text: `Student recovered because the task was reduced, the language stayed brief, and task initiation was reinforced.` },
    mixed:   { title: `Crisis Stabilized - Re-entry Was Weak`, text: `Student became calmer, but the path back to work was delayed or unclear.` },
    fail:    { title: `Crisis Maintained - Refusal Strengthened`, text: `The response pattern increased task pressure, adult attention, or escape from writing.` }
  }
});

POOL.crisis.push({
  id: "crisis_3_leaving_area",
  title: "Crisis Drill: Leaving the Area",
  start: "step1",
  steps: {
    step1: {
      text: `During work time, Student suddenly stands and moves quickly toward the classroom door. His face is tight, and he does not respond when you say his name. The hallway is busy.

You need to protect safety without turning this into a chase. What do you do?`,
      choices: {
        A: {
          text: `Maintain line of sight, signal support, and use one calm directional prompt.`,
          score: 10,
          feedback: `Correct. You prioritized safety without chasing or escalating.`,
          wizard: `The Wizard moves like a shadow, not a storm. Student is visible, support is coming, and your voice stays calm enough to avoid turning movement into flight.`,
          next: "step2_safe"
        },
        B: {
          text: `Follow Student closely and ask where he is going while keeping him in view.`,
          score: 0,
          feedback: `Line of sight helps, but close following and questions can increase flight risk.`,
          wizard: `The Wizard moves carefully. You can still see Student, but the questions and proximity may feel like pursuit. His pace may quicken.`,
          next: "step2_wobble"
        },
        C: {
          text: `Move quickly to block the doorway and tell Student he cannot leave.`,
          score: -10,
          feedback: `Not aligned. Blocking can increase panic, aggression, or bolting.`,
          wizard: `The Wizard's warning flare lights the doorway. Student sees the exit closing. His body may choose speed or force before language can help.`,
          next: "step2_escalated"
        }
      }
    },

    step2_safe: {
      text: `Student slows near the doorway. Support has been signaled. He is not calm, but he has paused.`,
      choices: {
        A: {
          text: `Offer a brief safe choice: walk with me back or wait here with support.`,
          score: 10,
          feedback: `Excellent. Predictable choices reduce flight risk.`,
          wizard: `The Wizard creates two safe paths. Student does not have to invent an escape route. Both choices keep him supervised and connected to support.`,
          next: "step3_recovery"
        },
        B: {
          text: `Ask Student whether he needs a break or wants to talk in the hallway.`,
          score: 0,
          feedback: `Supportive, but talking in the hallway may reinforce leaving the area.`,
          wizard: `The Wizard sees the risk. The question is caring, but the hallway is becoming the place where support happens. That can make leaving more useful next time.`,
          next: "step3_stable"
        },
        C: {
          text: `Tell Student he will lose privileges if he steps into the hallway.`,
          score: -10,
          feedback: `Not aligned. Threats can increase flight or emotional escalation.`,
          wizard: `The Wizard's alarm echoes down the hall. Student is already on the edge of leaving, and the threat adds pressure right at the exit point.`,
          next: "step3_risk"
        }
      }
    },

    step2_wobble: {
      text: `Student glances back and moves faster. Your presence is now part of the chase feeling, even though you are trying to help.`,
      choices: {
        A: {
          text: `Increase distance, keep line of sight, reduce language, and signal support clearly.`,
          score: 10,
          feedback: `Good recovery. You reduced pursuit cues while maintaining safety.`,
          wizard: `The Wizard slows the scene down. More space makes your presence less threatening. Student can pause without feeling caught.`,
          next: "step3_recovery"
        },
        B: {
          text: `Keep following and repeat that Student needs to stop walking now.`,
          score: 0,
          feedback: `Safety intent is clear, but repeated prompts may increase flight.`,
          wizard: `The Wizard keeps pace uneasily. Each repeated prompt may sound like the chase is still on. Student's feet remain ready to move.`,
          next: "step3_stable"
        },
        C: {
          text: `Call loudly for Student to stop before he gets himself in trouble.`,
          score: -10,
          feedback: `Not aligned. Public intensity can increase speed and shame.`,
          wizard: `The Wizard's cloak snaps. The hallway turns into a stage. Student hears volume, urgency, and trouble, which can make running more likely.`,
          next: "step3_risk"
        }
      }
    },

    step2_escalated: {
      text: `Student lunges around your position and reaches toward the door. His movement is faster now, and the classroom has gone quiet.`,
      choices: {
        A: {
          text: `Back off the block, maintain sight, clear nearby peers, and wait for support.`,
          score: 10,
          feedback: `Best repair. You reduced physical pressure and protected safety.`,
          wizard: `The Wizard opens space before the collision happens. The mission is tense, but the physical contest ends. Support can now help without a blocked doorway battle.`,
          next: "step3_recovery"
        },
        B: {
          text: `Stand aside but continue telling Student he needs to make a safe choice.`,
          score: 0,
          feedback: `Better than blocking, but repeated language may keep activation high.`,
          wizard: `The Wizard watches the doorway. The pressure lowers somewhat, but Student is still hearing demands while his body is in motion.`,
          next: "step3_stable"
        },
        C: {
          text: `Hold the doorway position and insist Student return to his desk first.`,
          score: -10,
          feedback: `Unsafe. Continuing to block may escalate into aggression or bolting.`,
          wizard: `The Wizard sounds the red alarm. The doorway becomes a contest. Student's safest path is no longer obvious, and the risk climbs.`,
          next: "step3_risk"
        }
      }
    },

    step3_recovery: {
      text: `Student stops with support nearby. He is not ready for a full task demand, but he is no longer moving toward the hall.`,
      choices: {
        A: {
          text: `Reinforce safe stopping and offer a low-demand return to the classroom routine.`,
          score: 10,
          feedback: `Excellent. You reinforced safety and rebuilt access to the routine.`,
          wizard: `The Wizard lights the return path. Student learns that stopping safely is powerful. The next demand is small enough that re-entry feels possible.`,
          ending: "success"
        },
        B: {
          text: `Let support stay with Student until he seems ready to return on his own.`,
          score: 0,
          feedback: `Safe, but the return routine is not actively strengthened.`,
          wizard: `The Wizard waits by the door. Safety is preserved, but the plan's replacement path is faint. Student may calm without learning how to return.`,
          ending: "mixed"
        },
        C: {
          text: `Ask Student to explain why he tried to leave before he can come back.`,
          score: -10,
          feedback: `Too soon. Explanation demands can restart leaving or refusal.`,
          wizard: `The Wizard blocks the question. Student's body just stopped moving. Asking for reasons now may push him back toward escape.`,
          ending: "mixed"
        }
      }
    },

    step3_stable: {
      text: `Student is supervised and no longer moving quickly, but the hallway is still functioning as an escape space.`,
      choices: {
        A: {
          text: `Prompt one safe return step and reinforce immediately when Student takes it.`,
          score: 10,
          feedback: `Strong finish. You taught and reinforced the return behavior.`,
          wizard: `The Wizard turns the hallway into a bridge instead of a reward. One safe step back earns reinforcement, and the classroom routine becomes reachable again.`,
          ending: "success"
        },
        B: {
          text: `Allow a longer hallway reset and plan to re-enter once the class is quiet.`,
          score: 0,
          feedback: `May preserve calm, but hallway escape may remain valuable.`,
          wizard: `The Wizard watches the reset stretch. Calm improves, but the hallway is doing a lot of work. The routine needs a clearer return signal.`,
          ending: "mixed"
        },
        C: {
          text: `Tell Student he can only return after promising not to leave again.`,
          score: -10,
          feedback: `Not aligned. Verbal contracts during activation can become another demand.`,
          wizard: `The Wizard's warning light returns. The promise becomes a hurdle. Student is asked to talk his way back before his body is ready.`,
          ending: "fail"
        }
      }
    },

    step3_risk: {
      text: `Student is still near the exit, tense and reactive. The situation needs fewer words, more space, and support.`,
      choices: {
        A: {
          text: `Reduce language, keep line of sight, and let support help create a calm return path.`,
          score: 10,
          feedback: `Best available repair. You reduced escalation and preserved safety.`,
          wizard: `The Wizard steadies the doorway. The scene is not fully recovered, but it is safer. The chase energy drains away, and support can rebuild the path back.`,
          ending: "mixed"
        },
        B: {
          text: `Monitor quietly while support arrives and delay the classroom return demand.`,
          score: 0,
          feedback: `May reduce immediate danger, but teaching is limited.`,
          wizard: `The Wizard stands guard. Safety is the priority, but the replacement routine will need more practice later.`,
          ending: "mixed"
        },
        C: {
          text: `Continue insisting Student return immediately so leaving does not work.`,
          score: -10,
          feedback: `Not aligned. Immediate insistence can intensify flight or aggression.`,
          wizard: `The Wizard's alarm fills the doorway. The demand to return becomes another reason to flee. The crisis remains active.`,
          ending: "fail"
        }
      }
    }
  },
  endings: {
    success: { title: `Crisis Managed - Safe Return`, text: `Student stopped safely and returned toward the routine through clear prompts and reinforcement.` },
    mixed:   { title: `Crisis Stabilized - Return Was Fragile`, text: `Safety improved, but the hallway or support adult may still be doing too much of the work.` },
    fail:    { title: `Crisis Escalated - Flight Risk Increased`, text: `Blocking, threats, or public intensity increased the risk of bolting or renewed escalation.` }
  }
});

/* ============================================================
   WILDCARD MISSIONS
   ============================================================ */

POOL.wild.push({
  id: "wild_1_unexpected_location_change",
  title: "Wildcard Mission: Unexpected Location Change",
  start: "step1",
  steps: {
    step1: {
      text: `An announcement interrupts the lesson: your class needs to move to another room immediately. The class murmurs, chairs scrape, and Student freezes. Unexpected location changes are hard for him. He steps away from the line and asks loudly, "Why are we going there?"

This could become refusal, flight, or a successful flexibility practice. What do you do first?`,
      choices: {
        A: {
          text: `Use a brief predictable cue, show where to stand, and offer two safe line positions.`,
          score: 10,
          feedback: `Strong fidelity. You added predictability and choice without debating the change.`,
          wizard: `The Wizard unrolls a map through the chaos. Student can see where his body should go next. The change is still unexpected, but it is no longer shapeless.`,
          next: "step2_supported"
        },
        B: {
          text: `Explain why the room changed and reassure Student that the new room will be fine.`,
          score: 0,
          feedback: `Kind, but extra explanation may increase verbal load during uncertainty.`,
          wizard: `The Wizard hears your reassurance, but Student's eyes are still scanning the room. More words may not build the predictability his body needs right now.`,
          next: "step2_wobble"
        },
        C: {
          text: `Tell Student there is no time to argue and he needs to get in line now.`,
          score: -10,
          feedback: `Not aligned. Pressure and public correction can increase refusal or flight.`,
          wizard: `The Wizard's warning light flashes. The unexpected change now feels like a public demand. Student has more reason to resist and more peers watching him do it.`,
          next: "step2_escalated"
        }
      }
    },
    step2_supported: {
      text: `Student moves closer to the line but keeps looking toward the hallway. He is not settled, but he has not left the group.`,
      choices: {
        A: { text: `Offer a simple walking choice and preview the first thing that will happen in the new room.`, score: 10, feedback: `Excellent. You supported transition and predictability.`, wizard: `The Wizard lights the hallway path. Student knows how to walk and what comes next. The transition becomes a sequence instead of a mystery.`, next: "step3_success_path" },
        B: { text: `Walk nearby and repeat that everything is okay until the class reaches the room.`, score: 0, feedback: `Supportive, but repeated reassurance may become extra attention.`, wizard: `The Wizard walks beside you. The tone is calm, but the repeated words keep the uncertainty alive. Student may still depend on adult reassurance to move.`, next: "step3_mixed_path" },
        C: { text: `Tell Student he is doing better, then remind him not to make this difficult.`, score: -10, feedback: `Risky. The reminder pulls attention back to problem behavior.`, wizard: `The Wizard winces. The first words help, but the warning turns the spotlight back on. Student hears that difficulty is expected from him.`, next: "step3_mixed_path" }
      }
    },
    step2_wobble: {
      text: `Student asks another question and slows the line. He is not refusing yet, but the transition is losing momentum.`,
      choices: {
        A: { text: `Stop answering repeated questions and give a visual or gestural cue for the next step.`, score: 10, feedback: `Good recovery. You shifted from discussion to predictable action.`, wizard: `The Wizard closes the debate scroll. The gesture gives Student something to follow without turning the hallway into a question-and-answer stage.`, next: "step3_success_path" },
        B: { text: `Answer one more question and ask Student to show you safe walking.`, score: 0, feedback: `Partially aligned, but repeated answering can maintain questioning.`, wizard: `The Wizard nods cautiously. You ask for safe walking, which helps, but the question loop has already been rewarded again.`, next: "step3_mixed_path" },
        C: { text: `Tell Student the questions need to stop because the class is waiting.`, score: -10, feedback: `Not aligned. Public pressure can escalate uncertainty.`, wizard: `The Wizard hears the hallway go quiet. Student feels the class waiting on him, and the transition becomes more socially loaded.`, next: "step3_risk_path" }
      }
    },
    step2_escalated: {
      text: `Student steps farther from the line and says, "I'm not going." Peers begin to turn around. The transition is now at risk.`,
      choices: {
        A: { text: `Reduce language, create space, and offer a safe choice to walk with you or support.`, score: 10, feedback: `Strong repair. You lowered the contest and rebuilt a safe transition path.`, wizard: `The Wizard cuts the audience cord. Student gets a way to move without losing face. The mission can still recover if the next step stays small.`, next: "step3_recovered_path" },
        B: { text: `Let the class go ahead while you wait nearby for Student to calm.`, score: 0, feedback: `May reduce audience, but the transition routine is not actively taught.`, wizard: `The Wizard watches the class leave. The audience shrinks, which helps, but Student also escaped the group transition. The return path needs rebuilding.`, next: "step3_mixed_path" },
        C: { text: `Tell Student he will lose a privilege if he refuses the room change.`, score: -10, feedback: `Not aligned. Threats during uncertainty can intensify refusal.`, wizard: `The Wizard's red flame rises. The new room now predicts losing something. Student digs in because the transition feels even more dangerous.`, next: "step3_risk_path" }
      }
    },
    step3_success_path: {
      text: `Student walks with the group and enters the new room. He is still alert, but he is available for instruction.`,
      choices: {
        A: { text: `Reinforce flexible walking with a Chart Move and begin with a low-demand entry task.`, score: 10, feedback: `Excellent. You reinforced flexibility and protected re-entry.`, wizard: `The Wizard opens the new room like a safe level. Student learns that flexible transitions lead to quick reinforcement and manageable first steps.`, ending: "success" },
        B: { text: `Begin the planned lesson immediately so the class regains normal routine.`, score: 0, feedback: `Efficient, but flexibility was not reinforced.`, wizard: `The Wizard nods at the routine, but the brave transition disappears unmarked. Student made it through, yet the coping skill did not get stronger.`, ending: "mixed" },
        C: { text: `Tell Student the move was not a big deal and he handled it better than usual.`, score: -10, feedback: `Risky. This can sound corrective and draw attention to past difficulty.`, wizard: `The Wizard tilts his head. The praise carries a reminder of the old pattern. Student may hear the history more than the success.`, ending: "mixed" }
      }
    },
    step3_recovered_path: {
      text: `Student walks with support and arrives after the class. The transition was rough, but he is back near the routine.`,
      choices: {
        A: { text: `Reinforce safe arrival and preview one easy action in the new room.`, score: 10, feedback: `Good recovery. You reinforced re-entry after a difficult transition.`, wizard: `The Wizard repairs the doorway. The transition was not perfect, but the recovery is now the behavior that pays off.`, ending: "success" },
        B: { text: `Let Student settle silently before asking him to participate.`, score: 0, feedback: `May preserve calm, but coping and re-entry are not clearly reinforced.`, wizard: `The Wizard waits in the new room. Calm may return, but the plan's reinforcement moment is faint.`, ending: "mixed" },
        C: { text: `Review the refusal privately before allowing Student to join the activity.`, score: -10, feedback: `Too soon. Processing may restart refusal.`, wizard: `The Wizard blocks the review. Student just crossed the threshold. The refusal story can pull him right back out of the routine.`, ending: "mixed" }
      }
    },
    step3_mixed_path: {
      text: `Student reaches the new location, but the transition depended heavily on adult support and reassurance.`,
      choices: {
        A: { text: `Reinforce the first independent coping step and fade back into the group routine.`, score: 10, feedback: `Strong finish. You shifted from adult support to student coping.`, wizard: `The Wizard hands Student a small piece of the map. One independent coping step gets reinforced, and the adult support can begin to fade.`, ending: "success" },
        B: { text: `Continue reassuring Student until he appears fully comfortable in the new room.`, score: 0, feedback: `Supportive, but may increase dependence on adult reassurance.`, wizard: `The Wizard watches the support stretch. Student stays calm, but the adult voice is doing most of the work.`, ending: "mixed" },
        C: { text: `Remind Student that next time he needs to handle changes faster.`, score: -10, feedback: `Not aligned. This adds pressure after a difficult transition.`, wizard: `The Wizard's glow dims. The transition ends with pressure, not confidence. Student may dread the next surprise even more.`, ending: "fail" }
      }
    },
    step3_risk_path: {
      text: `Student is in the new room but tense, delayed, or separated from the group. The transition has become emotionally loaded.`,
      choices: {
        A: { text: `Use a low-demand entry task and reinforce the first calm participation response.`, score: 10, feedback: `Best repair. You reduced pressure and reinforced re-entry.`, wizard: `The Wizard places a small task at the doorway. Student can rejoin without having to prove he is over it. The mission stabilizes.`, ending: "mixed" },
        B: { text: `Wait quietly and avoid additional interaction until Student looks more settled.`, score: 0, feedback: `May prevent escalation, but the coping path remains unclear.`, wizard: `The Wizard keeps the room dim. Nothing gets worse, but nothing is taught yet. The next surprise may look the same.`, ending: "mixed" },
        C: { text: `Have Student explain why the transition became difficult before joining.`, score: -10, feedback: `Not aligned. Explanation demands can restart escalation.`, wizard: `The Wizard sounds the alarm. The new room becomes another conversation about failure. Student moves farther from participation.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success - Flexibility Reinforced`, text: `Student managed the unexpected change because predictability, choice, and reinforcement supported flexible behavior.` },
    mixed:   { title: `Mixed - Transition Completed With Heavy Support`, text: `Student arrived, but coping and flexible re-entry were not strengthened as clearly as possible.` },
    fail:    { title: `Fail - Uncertainty Escalated`, text: `Public pressure, threats, or repeated discussion increased refusal risk during the unexpected change.` }
  }
});

POOL.wild.push({
  id: "wild_2_unstructured_time",
  title: "Wildcard Mission: Unstructured Time Surge",
  start: "step1",
  steps: {
    step1: {
      text: `The planned activity ends early, and you suddenly have ten open minutes before lunch. The room gets louder. Student drifts toward a peer, bumps shoulders, and laughs when the peer reacts. Unstructured time is a known trigger.

What is your first move?`,
      choices: {
        A: { text: `Add structure quickly with two activity choices and a clear hands-to-self boundary.`, score: 10, feedback: `Strong fidelity. You reduced ambiguity before the behavior grew.`, wizard: `The Wizard drops a game board onto the chaos. Student now has a place to go and a rule that is concrete. The peer audience has less room to take over.`, next: "step2_supported" },
        B: { text: `Remind the class to be kind and monitor Student while finishing another task.`, score: 0, feedback: `Partially aligned, but not structured enough for a known trigger.`, wizard: `The Wizard hears the reminder float over the room. It is not wrong, but it is too soft for this moment. Student still has open space, peer attention, and no clear job.`, next: "step2_wobble" },
        C: { text: `Call Student out for bumping and tell him to stay away from that peer.`, score: -10, feedback: `Not aligned. Public attention can strengthen peer-maintained behavior.`, wizard: `The Wizard's alarm flashes. Student got exactly what the behavior was reaching for: attention from adults and peers. The bumping now has a bigger stage.`, next: "step2_escalated" }
      }
    },
    step2_supported: {
      text: `Student chooses drawing but hovers near the peer instead of moving fully to the activity area.`,
      choices: {
        A: { text: `Point to the exact drawing spot and reinforce when Student moves there safely.`, score: 10, feedback: `Excellent. You turned the choice into a safe location response.`, wizard: `The Wizard marks the landing zone. Student has a clear place to be, and the Chart Move makes safe movement more powerful than bumping.`, next: "step3_success_path" },
        B: { text: `Let Student transition independently because he already picked an activity.`, score: 0, feedback: `Maybe, but the location response is still weak.`, wizard: `The Wizard watches Student hover. The choice was a good start, but the peer is still pulling like a magnet.`, next: "step3_mixed_path" },
        C: { text: `Tell Student he chose drawing, so he needs to stop wandering around.`, score: -10, feedback: `Risky. This adds attention without teaching the next response.`, wizard: `The Wizard winces. The correction keeps the wandering in the spotlight. Student hears more attention before he has a clear landing place.`, next: "step3_mixed_path" }
      }
    },
    step2_wobble: {
      text: `Student bumps the peer again, softer this time. The peer says, "Stop," but also laughs. The behavior is starting to pay off.`,
      choices: {
        A: { text: `Move closer, structure the space, and prompt Student to choose a defined activity spot.`, score: 10, feedback: `Good recovery. You added structure and reduced the peer payoff.`, wizard: `The Wizard pulls the peer audience out of the center. Student gets a defined spot and an activity before the bumping becomes the main event.`, next: "step3_recovered_path" },
        B: { text: `Tell the peer to ignore it and remind Student to keep his body calm.`, score: 0, feedback: `Partially aligned, but it still relies on weak structure.`, wizard: `The Wizard sees the peer trying, but the room is still loose. Ignoring helps only if Student has something better to do.`, next: "step3_mixed_path" },
        C: { text: `Warn Student that one more bump means losing the open-time choice.`, score: -10, feedback: `Not aligned. Threats can add attention and make the moment more dramatic.`, wizard: `The Wizard's red light glows. The behavior now controls the stakes of open time. Student may push once more just to test the boundary.`, next: "step3_risk_path" }
      }
    },
    step2_escalated: {
      text: `Student says, "I didn't do anything," and bumps the peer again while looking toward you. More students are watching now.`,
      choices: {
        A: { text: `Reduce the audience, move near Student, and offer a structured activity away from the peer.`, score: 10, feedback: `Strong repair. You reduced attention and added a safer alternative.`, wizard: `The Wizard sweeps the spotlight away from the peer. Student gets a route to something else before the performance becomes the whole recess-before-lunch routine.`, next: "step3_recovered_path" },
        B: { text: `Separate Student from the peer and wait silently until the group settles.`, score: 0, feedback: `Safety may improve, but replacement behavior is not taught clearly.`, wizard: `The Wizard steadies the room. The bumping may stop, but Student has not learned what to do during open time instead.`, next: "step3_mixed_path" },
        C: { text: `Explain publicly that bumping is unsafe and Student needs to apologize now.`, score: -10, feedback: `Not aligned. Public processing can intensify peer-maintained behavior.`, wizard: `The Wizard's alarm rings. The whole room is now part of the consequence. Student has more audience than before, and the peer conflict grows.`, next: "step3_risk_path" }
      }
    },
    step3_success_path: {
      text: `Student moves to the drawing spot and starts using the materials. The room is still busy, but he is no longer using peers for stimulation.`,
      choices: {
        A: { text: `Mark a Chart Move for safe participation and preview the upcoming lunch transition.`, score: 10, feedback: `Excellent. You reinforced safe unstructured behavior and prepared the next transition.`, wizard: `The Wizard places a bright marker on the map. Student learns that safe participation during loose time works. The lunch transition is now less likely to surprise him.`, ending: "success" },
        B: { text: `Let Student draw quietly and avoid interrupting the calm moment with reinforcement.`, score: 0, feedback: `Calm, but the safe behavior is not strengthened.`, wizard: `The Wizard whispers, almost. The quiet is good, but the plan needs the safe behavior to be noticed before it fades into the noise.`, ending: "mixed" },
        C: { text: `Tell nearby peers to notice that Student is finally making a better choice.`, score: -10, feedback: `Not aligned. This returns peer attention to Student's behavior.`, wizard: `The Wizard blocks the spotlight, but too late. Peers look over again. The safe choice becomes a performance instead of a routine.`, ending: "mixed" }
      }
    },
    step3_recovered_path: {
      text: `Student accepts the structured spot after some hesitation. He is calmer, but the peer interaction was already reinforced once.`,
      choices: {
        A: { text: `Reinforce safe body and engagement, then stay nearby through the next transition.`, score: 10, feedback: `Good recovery. You reinforced the replacement and planned for the next risk point.`, wizard: `The Wizard repairs the open-time routine. Student gets credit for moving away and engaging safely. The next transition is guarded before it becomes another trigger.`, ending: "success" },
        B: { text: `Let Student continue the activity and monitor from across the room.`, score: 0, feedback: `May be okay, but support fades before the routine is strong.`, wizard: `The Wizard watches from a distance. Student is safer, but the peer magnet is still in the room. The routine may hold, or it may wobble again.`, ending: "mixed" },
        C: { text: `Use the calm moment to explain why bumping peers causes problems.`, score: -10, feedback: `Risky. Processing may pull attention back to the peer behavior.`, wizard: `The Wizard raises a warning hand. Student was almost out of the peer loop. The explanation brings the bumping story back to center stage.`, ending: "mixed" }
      }
    },
    step3_mixed_path: {
      text: `Student is no longer bumping, but he is only loosely engaged. Open time still feels fragile.`,
      choices: {
        A: { text: `Prompt one specific activity action and reinforce safe engagement immediately.`, score: 10, feedback: `Strong finish. You turned loose time into reinforced engagement.`, wizard: `The Wizard locks a piece into place. Student has a concrete action, and the safe engagement finally has a payoff.`, ending: "success" },
        B: { text: `Keep the room calm and wait to see whether Student stays settled.`, score: 0, feedback: `May preserve calm, but the replacement routine remains weak.`, wizard: `The Wizard waits with the room. Nothing explodes, but the skill is still thin. Open time may be hard again tomorrow.`, ending: "mixed" },
        C: { text: `Tell Student the next open time will be removed if this happens again.`, score: -10, feedback: `Not aligned. Threats may make unstructured time more aversive.`, wizard: `The Wizard darkens the open-time card. The routine now predicts future loss, not supported success.`, ending: "fail" }
      }
    },
    step3_risk_path: {
      text: `The peer interaction has become the center of the room. Student is activated by the audience and the unstructured time is slipping away.`,
      choices: {
        A: { text: `Create a brief reset, remove the audience, and return with one structured activity choice.`, score: 10, feedback: `Best repair. You reduced attention and rebuilt structure.`, wizard: `The Wizard sweeps the stage clean. The audience fades, the reset cools the moment, and Student gets a safer route back into open time.`, ending: "mixed" },
        B: { text: `Separate Student and wait quietly until the lunch transition begins.`, score: 0, feedback: `May prevent more conflict, but replacement behavior is not practiced.`, wizard: `The Wizard contains the scene. It may prevent more bumping, but open time became something to survive rather than something to learn.`, ending: "mixed" },
        C: { text: `Require Student to apologize to the peer before he can do another activity.`, score: -10, feedback: `Not aligned during activation. Social demands can prolong the performance.`, wizard: `The Wizard's alarm returns. The peer is now even more central. Student is pulled deeper into the social conflict instead of toward safe engagement.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success - Open Time Structured`, text: `Student used a safe activity because the open time became predictable, reinforced, and connected to the next transition.` },
    mixed:   { title: `Mixed - Conflict Reduced But Routine Weak`, text: `The moment stabilized, but safe engagement was not reinforced strongly enough.` },
    fail:    { title: `Fail - Peer Attention Took Over`, text: `Public attention, threats, or peer processing allowed the interaction to become more reinforcing.` }
  }
});

POOL.wild.push({
  id: "wild_3_guest_in_room",
  title: "Wildcard Mission: Guest in the Room",
  start: "step1",
  steps: {
    step1: {
      text: `A visitor enters and sits in the back of the room with a clipboard. Student notices immediately. His voice gets louder, he narrates what he is doing, and he glances at peers to see who is entertained.

The visitor has become an audience cue. What do you do first?`,
      choices: {
        A: { text: `Pre-correct privately, keep the routine moving, and give Student one clear task action.`, score: 10, feedback: `Strong fidelity. You reduced the audience effect and anchored Student in the routine.`, wizard: `The Wizard dims the spotlight. The visitor stays boring, the task stays clear, and Student has something to do besides perform.`, next: "step2_supported" },
        B: { text: `Ignore the narration and continue teaching while watching Student closely.`, score: 0, feedback: `May reduce attention, but Student still needs a replacement cue.`, wizard: `The Wizard stands quietly. Ignoring helps, but the performance still has oxygen from peers and the visitor. Student needs a clearer job.`, next: "step2_wobble" },
        C: { text: `Tell Student to stop showing off because someone is observing today.`, score: -10, feedback: `Not aligned. This confirms the audience and increases public attention.`, wizard: `The Wizard's alarm lights the visitor's chair. Student now knows everyone knows he is performing. The stage gets brighter.`, next: "step2_escalated" }
      }
    },
    step2_supported: {
      text: `Student lowers his voice and starts the task, but he keeps checking whether the visitor is watching.`,
      choices: {
        A: { text: `Reinforce task start quietly and give the next short step before attention drifts.`, score: 10, feedback: `Excellent. You reinforced task engagement under audience conditions.`, wizard: `The Wizard slips reinforcement into the routine like a secret key. Student gets attention for working, not performing, and the task keeps moving.`, next: "step3_success_path" },
        B: { text: `Let Student work without feedback so the visitor does not become a bigger deal.`, score: 0, feedback: `Understandable, but the replacement behavior is not strengthened.`, wizard: `The Wizard nods cautiously. The room stays calm, but Student's successful task start passes without a strong signal.`, next: "step3_mixed_path" },
        C: { text: `Praise Student loudly so the visitor sees he can make a good choice.`, score: -10, feedback: `Risky. Loud praise can still function as public attention.`, wizard: `The Wizard winces as the spotlight swings back. The praise is positive, but it is big, public, and tied to the visitor's gaze.`, next: "step3_mixed_path" }
      }
    },
    step2_wobble: {
      text: `Student makes another comment, and two peers smile. The visitor looks up briefly. The performance is getting small payoffs.`,
      choices: {
        A: { text: `Move closer, cue the task privately, and reinforce the first quiet work response.`, score: 10, feedback: `Good recovery. You reduced the audience and reinforced the replacement.`, wizard: `The Wizard steps between Student and the stage. A private cue gives Student a way back, and the first quiet response gets paid quickly.`, next: "step3_recovered_path" },
        B: { text: `Continue planned ignoring and hope the peer reactions fade quickly.`, score: 0, feedback: `Sometimes useful, but peer attention may continue to reinforce the behavior.`, wizard: `The Wizard watches the peer smiles. Adult attention is low, but peer attention is still alive. Ignoring alone may not be enough.`, next: "step3_mixed_path" },
        C: { text: `Remind the class not to laugh because Student is trying to get attention.`, score: -10, feedback: `Not aligned. This publicly labels the behavior and increases attention.`, wizard: `The Wizard throws up his hands. The whole class has now been told the performance is happening. The audience gets organized instead of reduced.`, next: "step3_risk_path" }
      }
    },
    step2_escalated: {
      text: `Student grins and says, "I'm not showing off," loud enough for the visitor to hear. Several students look back at the observer.`,
      choices: {
        A: { text: `Drop the public exchange, redirect privately to the task, and reinforce quiet re-entry.`, score: 10, feedback: `Strong repair. You stopped feeding the audience and rebuilt task focus.`, wizard: `The Wizard cuts the stage lights. You do not argue about showing off. The task becomes the path out of the spotlight.`, next: "step3_recovered_path" },
        B: { text: `Turn attention back to the lesson and wait to address Student privately later.`, score: 0, feedback: `May reduce the exchange, but Student still needs a task cue now.`, wizard: `The Wizard redirects the camera to the lesson. That helps, but Student is still holding a little microphone unless the task cue arrives soon.`, next: "step3_mixed_path" },
        C: { text: `Tell Student the visitor is here to watch learning, not disruptive behavior.`, score: -10, feedback: `Not aligned. This increases the visitor's role as an audience.`, wizard: `The Wizard's alarm flashes around the clipboard. The visitor becomes part of the consequence, and the performance grows more meaningful.`, next: "step3_risk_path" }
      }
    },
    step3_success_path: {
      text: `Student is working quietly with the visitor present. This is a strong generalization opportunity.`,
      choices: {
        A: { text: `Mark a Chart Move privately and continue the routine without spotlighting the visitor.`, score: 10, feedback: `Excellent. You reinforced coping under audience conditions.`, wizard: `The Wizard stores the win. Student learns that quiet work with a guest present earns reinforcement without becoming a show.`, ending: "success" },
        B: { text: `Continue teaching and mention the success later after the visitor leaves.`, score: 0, feedback: `Delayed feedback is weaker for building the coping routine.`, wizard: `The Wizard nods, but the magic is faint. The success is real, yet the reinforcement arrives after the moment has cooled.`, ending: "mixed" },
        C: { text: `Tell the visitor Student is doing much better now than at the start.`, score: -10, feedback: `Risky. This brings the visitor back into Student's behavior story.`, wizard: `The Wizard blocks the clipboard. Student's behavior becomes visitor commentary again, and the audience cue regains power.`, ending: "mixed" }
      }
    },
    step3_recovered_path: {
      text: `Student returns to the task after the private cue. The performance has faded, but it could restart if the spotlight comes back.`,
      choices: {
        A: { text: `Reinforce quiet task engagement and give the next short academic response.`, score: 10, feedback: `Good recovery. You reinforced the replacement and moved forward.`, wizard: `The Wizard closes the curtain. Student gets a reward for working, then immediately gets a next step that keeps him in the routine.`, ending: "success" },
        B: { text: `Let the calm continue and avoid adding any attention to the moment.`, score: 0, feedback: `Calm, but the replacement behavior may not be strengthened.`, wizard: `The Wizard whispers. The moment survives, but the skill stays underpowered. Student may not know exactly what worked.`, ending: "mixed" },
        C: { text: `Use the calm moment to remind Student not to perform for visitors.`, score: -10, feedback: `Risky. This reintroduces the visitor as the focus.`, wizard: `The Wizard's curtain opens again. The visitor returns to the center of the story, and Student remembers the audience.`, ending: "mixed" }
      }
    },
    step3_mixed_path: {
      text: `Student is quieter, but still glancing toward the visitor and peers. The performance is smaller, not gone.`,
      choices: {
        A: { text: `Give one private task cue and reinforce the first quiet response immediately.`, score: 10, feedback: `Strong finish. You converted partial calm into reinforced engagement.`, wizard: `The Wizard points to the small opening. A private cue plus quick reinforcement gives Student a better way to access attention.`, ending: "success" },
        B: { text: `Keep ignoring the visitor-related behavior and continue the lesson.`, score: 0, feedback: `May prevent adult attention, but peer attention may still maintain it.`, wizard: `The Wizard watches the room carefully. Adult attention is low, but the peer audience may still be enough to keep the performance alive.`, ending: "mixed" },
        C: { text: `Tell Student he can take a break if he cannot handle having a visitor in class.`, score: -10, feedback: `Not aligned. This may reinforce escape from guest-day routines.`, wizard: `The Wizard's alarm returns. The visitor now predicts escape from class expectations. Future observations may become even harder.`, ending: "fail" }
      }
    },
    step3_risk_path: {
      text: `The visitor has become a strong audience cue. Student is watching reactions more than the task.`,
      choices: {
        A: { text: `Reduce the audience, cue a low-demand task response, and reinforce quiet re-entry.`, score: 10, feedback: `Best repair. You lowered the performance value and rebuilt task focus.`, wizard: `The Wizard dims the room and lights the task. The performance loses power as Student gets a quieter route back to success.`, ending: "mixed" },
        B: { text: `Let Student sit quietly without task demands until the visitor leaves.`, score: 0, feedback: `May reduce disruption, but escape from task demands is likely reinforced.`, wizard: `The Wizard closes the book halfway. The performance stops, but so does the work. The visitor may now signal a way out of demands.`, ending: "mixed" },
        C: { text: `Ask the visitor to ignore Student while you explain the expected behavior again.`, score: -10, feedback: `Not aligned. This keeps the visitor and behavior in the spotlight.`, wizard: `The Wizard's alarm lights the whole room. The visitor, the behavior, and the expectation all become public. The stage is fully built.`, ending: "fail" }
      }
    }
  },
  endings: {
    success: { title: `Success - Guest-Day Coping Reinforced`, text: `Student stayed engaged because the visitor was kept boring and quiet task engagement was reinforced.` },
    mixed:   { title: `Mixed - Performance Reduced But Not Fully Replaced`, text: `Student became quieter, but the replacement behavior was not reinforced strongly enough.` },
    fail:    { title: `Fail - Visitor Became the Audience`, text: `Public attention, commentary, or escape made guest-day behavior more likely in the future.` }
  }
});
