/* wildcard-mission-1.js
 * Mission: Reinforceable Example Content
 * Wildcard Mission 1: Unexpected Room Change
 *
 * Purpose:
 * - Practice implementation of the Example BIP during an unexpected location change.
 * - Primary function pressure: escape from uncertainty and transition demands.
 * - Secondary function pressure: adult attention and possible flight risk.
 * - Teacher skill: use first-then preview, offer a job or safe transition choice, reinforce flexible movement.
 *
 * Loading note:
 * - This file assumes the main engine has already created POOL.
 * - Later, the engine/html can load this file after the shared config and Example BIP file.
 * - For the current single-file version, paste this after POOL.wild has been initialized.
 */

(function registerWildcardMission1() {
  if (typeof POOL === "undefined") {
    throw new Error("POOL must be defined before loading wildcard-mission-1.js");
  }

  POOL.wild = POOL.wild || [];

  POOL.wild.push({
    id: "wild_1_unexpected_room_change",
    title: "Wildcard Mission: Unexpected Room Change",
    start: "step1",
    focus: "Unexpected transition; use predictability, job choice, and reinforcement to support flexible movement.",
    routine: "unexpected location change",
    functionPressure: ["escape", "uncertainty", "adult attention"],
    bipTargets: ["Prevent", "Teach", "Reinforce", "Respond"],

    steps: {
      step1: {
        text: `BIP Briefing: Unexpected changes are hard for Student because the first step is unclear and the routine feels unpredictable. The plan is to use a brief first-then preview, offer a safe job or line position choice, and reinforce flexible movement. Avoid lengthy explanations, public pressure, or allowing repeated questions to delay the transition.\n\nScene: Your class is halfway through math centers when the office calls. The library needs your room for a testing group, and your class has to move to the art room for the next 20 minutes. Chairs scrape as students begin to clean up. Student freezes by his desk, looks toward the hallway, and asks loudly, "Why are we going there?" A few students stop to listen.\n\nThe change is sudden, and Student is starting to become the center of the transition. What do you do first?`,
        choices: {
          A: {
            text: `Explain why the room changed and reassure Student that the art room will be fine.`,
            score: 5,
            feedback: `Developing fidelity. Reassurance is kind, but extra explanation may increase verbal load during uncertainty.`,
            wizard: `The Wizard unrolls a long scroll, but Student's body is still frozen. The more the explanation grows, the farther away the first step feels. The class waits, and the transition becomes a conversation instead of movement. During uncertainty, the BIP calls for brief predictability and an observable first action.`,
            next: "step2_wobble",
            meta: {
              bipComponent: "Prevent",
              mechanism: "Prompting",
              errorType: "over-explaining",
              function: "escape from uncertainty"
            }
          },
          B: {
            text: `Say, "First line up by the door, then art room. Door holder or line checker?"`,
            score: 10,
            feedback: `High fidelity. You made the change predictable and gave control within the transition.`,
            wizard: `The Wizard snaps the long scroll into a two-step map. First door, then art room. Student gets a job that keeps him with the class instead of outside the routine. First-then language and job choice reduce uncertainty while preserving access to the transition.`,
            next: "step2_supported",
            meta: {
              bipComponent: "Prevent",
              mechanism: "Prompting",
              errorType: "none",
              function: "escape from uncertainty"
            }
          },
          C: {
            text: `Tell Student, "There is no time for questions. Get in line now."`,
            score: 0,
            feedback: `Low fidelity. Public pressure can increase refusal, adult attention, or flight risk.`,
            wizard: `The Wizard's warning flame lights the doorway. The unexpected change now feels like a public demand, and Student has more reason to resist it. Several students watch to see what happens next. Pressure without predictability can make escape more valuable.`,
            next: "step2_escalated",
            meta: {
              bipComponent: "Respond",
              mechanism: "Performance feedback",
              errorType: "public pressure",
              function: "escape plus adult attention"
            }
          }
        }
      },

      step2_supported: {
        text: `Student chooses line checker and walks toward the door, but he keeps looking over his shoulder at the room. He is moving, but the change is still making him tense.`,
        choices: {
          A: {
            text: `Say quietly, "Line checker job. Count three quiet walkers, then stand behind me."`,
            score: 10,
            feedback: `High fidelity. You turned the job choice into a clear transition action.`,
            wizard: `The Wizard places three glowing footprints by the door. Student now has a job, a number, and a destination. The transition becomes something to do, not something to debate. A visible first action helps Student contact success during uncertainty.`,
            next: "step3_strong",
            meta: {
              bipComponent: "Teach",
              mechanism: "Fluency building",
              errorType: "none",
              function: "escape from uncertainty"
            }
          },
          B: {
            text: `Walk beside him and keep repeating, "You're okay, we're just going to art."`,
            score: 5,
            feedback: `Developing fidelity. The support is calm, but repeated reassurance can keep adult attention high.`,
            wizard: `The Wizard walks beside the line, but the reassurance becomes the soundtrack of the change. Student keeps checking your face instead of using the job. Adult support should point Student toward the replacement behavior, not become the whole coping strategy.`,
            next: "step3_mixed",
            meta: {
              bipComponent: "Teach",
              mechanism: "Prompting",
              errorType: "reassurance dependence",
              function: "adult attention"
            }
          },
          C: {
            text: `Tell the class, "Student is our line checker today, so everyone help him do it right."`,
            score: 0,
            feedback: `Low fidelity. This makes Student's role public and may increase the audience.`,
            wizard: `The Wizard sees the job card turn into a spotlight. The whole class now knows Student's performance matters. What could have been quiet structure becomes public pressure. When attention is part of the pathway, jobs should be supportive, not spotlighted.`,
            next: "step3_mixed",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "public spotlight",
              function: "peer attention plus adult attention"
            }
          }
        }
      },

      step2_wobble: {
        text: `Student asks another question: "But why can't we stay here?" The class is halfway lined up, and two students turn around to listen. The transition is losing momentum.`,
        choices: {
          A: {
            text: `Answer one more question, then ask Student to show you safe walking.`,
            score: 5,
            feedback: `Developing fidelity. Safe walking is relevant, but the question loop has already been reinforced again.`,
            wizard: `The Wizard sees the question door open twice. Student receives more explanation, and the hallway waits. Safe walking may still happen, but repeated questions are becoming a way to slow the change. Repeated explanation can maintain delay when uncertainty is high.`,
            next: "step3_mixed",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "question loop reinforced",
              function: "escape from transition"
            }
          },
          B: {
            text: `Stop answering questions, point to the line spot, and say, "First door, then art. Choose door holder or line checker."`,
            score: 10,
            feedback: `High fidelity repair. You shifted from discussion to predictable action and job choice.`,
            wizard: `The Wizard closes the question scroll and opens a map. Student gets the next step without needing the whole story. The transition starts moving again. First-then language plus choice interrupts delay and prompts flexible movement.`,
            next: "step3_recovered",
            meta: {
              bipComponent: "Prevent",
              mechanism: "Prompting",
              errorType: "none",
              function: "escape from uncertainty"
            }
          },
          C: {
            text: `Tell Student the questions need to stop because the whole class is waiting.`,
            score: 0,
            feedback: `Low fidelity. This adds public pressure and may intensify uncertainty or refusal.`,
            wizard: `The Wizard hears the hallway go quiet. Student feels every peer waiting on him, and the transition becomes heavier. The question is no longer about the art room. It is about the audience. Public pressure can strengthen attention and escape pathways.`,
            next: "step3_risk",
            meta: {
              bipComponent: "Respond",
              mechanism: "Performance feedback",
              errorType: "public pressure",
              function: "peer attention plus escape"
            }
          }
        }
      },

      step2_escalated: {
        text: `Student steps away from the line and says, "I'm not going." He looks toward the hallway, then back at you. The class is now watching the transition stall.`,
        choices: {
          A: {
            text: `Reduce language, create space, and offer a safe choice: walk with you or walk with support.`,
            score: 10,
            feedback: `High fidelity repair. You lowered the contest and rebuilt a safe transition path.`,
            wizard: `The Wizard cuts the audience cord. Student gets a way to move without losing face. The mission can still recover because both choices lead back to the transition. Safe choices preserve access while reducing escalation.`,
            next: "step3_recovered",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "none",
              function: "escape from transition"
            }
          },
          B: {
            text: `Let the class go ahead while you wait nearby for Student to calm.`,
            score: 5,
            feedback: `Developing fidelity. The audience shrinks, but the transition routine is not actively taught.`,
            wizard: `The Wizard watches the class leave. The audience gets smaller, which helps, but Student also escaped the group transition. The return path still needs rebuilding. Stabilization should be followed by a low-demand re-entry step.`,
            next: "step3_mixed",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "delayed re-entry",
              function: "escape"
            }
          },
          C: {
            text: `Tell Student he will lose a preferred activity if he refuses the room change.`,
            score: 0,
            feedback: `Low fidelity. Threats during uncertainty can intensify refusal or movement away from the routine.`,
            wizard: `The Wizard's red flame rises. The art room now predicts losing something. Student digs in because the transition feels even more dangerous. Threats add pressure without teaching the replacement response.`,
            next: "step3_risk",
            meta: {
              bipComponent: "Respond",
              mechanism: "Performance feedback",
              errorType: "threat of loss",
              function: "escape plus adult attention"
            }
          }
        }
      },

      step3_strong: {
        text: `Student counts three quiet walkers and stands behind you. The class starts down the hallway. Student is still alert, but he is moving with the group and using his job.`,
        choices: {
          A: {
            text: `Privately mark a Chart Move and say, "Flexible move. Line checker job is working."`,
            score: 10,
            feedback: `High fidelity. You reinforced flexible movement and the replacement job.`,
            wizard: `The Wizard lights the hallway like a safe path. Student learns that moving with the group and using the job earns reinforcement. The unexpected change becomes practice, not escape. Reinforcing flexibility during the change builds future transition fluency.`,
            ending: "success",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "none",
              function: "escape from uncertainty"
            }
          },
          B: {
            text: `Keep walking and save praise until the class reaches the art room.`,
            score: 5,
            feedback: `Developing fidelity. The transition is moving, but the flexible response needs closer reinforcement.`,
            wizard: `The Wizard watches the job success travel down the hall without a signal. Student is doing the hard part now, but the consequence is waiting somewhere else. Reinforce the flexible response while it is happening.`,
            ending: "mixed",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "delayed reinforcement",
              function: "escape"
            }
          },
          C: {
            text: `Tell the class, "Student is doing much better with changes today."`,
            score: 0,
            feedback: `Low fidelity. Public praise can turn flexibility into a spotlight.`,
            wizard: `The Wizard's hallway lights swing toward Student. The class hears his history with changes, and the quiet job becomes public performance. Reinforcement should be private when public attention can strengthen behavior.`,
            ending: "mixed",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "public praise",
              function: "peer attention"
            }
          }
        }
      },

      step3_recovered: {
        text: `Student moves toward the line after hesitation. He is still tense, but he is no longer refusing. The transition is available again.`,
        choices: {
          A: {
            text: `Reinforce the move toward the line and give one low-demand job action.`,
            score: 10,
            feedback: `High fidelity. You reinforced re-entry and shaped the next transition response.`,
            wizard: `The Wizard rebuilds the hallway bridge one plank at a time. Student gets credit for moving toward the routine, then receives a small job that keeps him with the class. Re-entry plus a low-demand action builds flexible transition behavior.`,
            ending: "success",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Fluency building",
              errorType: "none",
              function: "escape from uncertainty"
            }
          },
          B: {
            text: `Let him join silently so the transition does not become a bigger deal.`,
            score: 5,
            feedback: `Developing fidelity. Low attention helps, but the flexible return is not reinforced.`,
            wizard: `The Wizard keeps the hallway quiet, which matters. But Student's successful return slips by without a clear signal. Reinforcement can be private and still be immediate.`,
            ending: "mixed",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "missed reinforcement",
              function: "escape"
            }
          },
          C: {
            text: `Review why he cannot refuse before allowing him to walk with the class.`,
            score: 0,
            feedback: `Low fidelity. Processing before re-entry can restart resistance and delay the transition.`,
            wizard: `The Wizard sees the bridge pause just before Student crosses it. The refusal story returns, and the art room waits in the distance. Process later, after regulation and successful re-entry.`,
            ending: "mixed",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "processing before re-entry",
              function: "adult attention plus escape"
            }
          }
        }
      },

      step3_mixed: {
        text: `Student is calmer, but the transition depended heavily on adult waiting, reassurance, or delay. The class is moving, but Student's flexible transition skill is still fragile.`,
        choices: {
          A: {
            text: `Prompt one independent transition action and reinforce it as soon as he does it.`,
            score: 10,
            feedback: `High fidelity repair. You shifted from adult support to Student's own flexible action.`,
            wizard: `The Wizard hands Student a small piece of the map. One independent step gets reinforced, and adult support can begin to fade. The goal is not just calm movement, but reinforced flexible participation.`,
            ending: "success",
            meta: {
              bipComponent: "Teach",
              mechanism: "Fluency building",
              errorType: "none",
              function: "escape from uncertainty"
            }
          },
          B: {
            text: `Continue reassuring Student until he appears fully comfortable with the change.`,
            score: 5,
            feedback: `Developing fidelity. Reassurance may keep calm, but adult attention is doing most of the work.`,
            wizard: `The Wizard watches the support stretch. Student stays near the routine, but he keeps borrowing your calm instead of practicing his own transition step. Adult support should fade toward a reinforced replacement behavior.`,
            ending: "mixed",
            meta: {
              bipComponent: "Teach",
              mechanism: "Prompting",
              errorType: "over-reassurance",
              function: "adult attention"
            }
          },
          C: {
            text: `Remind Student that next time he needs to handle changes faster.`,
            score: 0,
            feedback: `Low fidelity. This adds pressure after a difficult transition and may make future changes more aversive.`,
            wizard: `The Wizard's glow dims. The transition ends with pressure, not confidence. Student may dread the next surprise even more. Feedback after difficulty should strengthen the replacement path, not increase aversiveness.`,
            ending: "fail",
            meta: {
              bipComponent: "Respond",
              mechanism: "Performance feedback",
              errorType: "pressure after transition",
              function: "escape"
            }
          }
        }
      },

      step3_risk: {
        text: `Student is delayed, tense, or separated from the group. The transition has become emotionally loaded, and the next move could either repair access or strengthen refusal.`,
        choices: {
          A: {
            text: `Use a low-demand transition job and reinforce the first calm movement toward the group.`,
            score: 10,
            feedback: `High fidelity repair. You reduced pressure and reinforced re-entry.`,
            wizard: `The Wizard places a small job at the doorway. Student can rejoin without having to prove he is over it. The mission stabilizes because the next step is tiny and reinforced. Low-demand re-entry protects access while reducing escape payoff.`,
            ending: "mixed",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "recovery repair",
              function: "escape from uncertainty"
            }
          },
          B: {
            text: `Wait quietly and avoid interaction until Student looks more settled.`,
            score: 5,
            feedback: `Developing fidelity. This may prevent escalation, but the coping path remains unclear.`,
            wizard: `The Wizard keeps the room dim. Nothing gets worse, but nothing is taught yet. The next unexpected change may look the same. Stabilization needs to be followed by replacement practice.`,
            ending: "mixed",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "stabilization without re-entry",
              function: "escape"
            }
          },
          C: {
            text: `Have Student explain why the transition became difficult before he rejoins.`,
            score: 0,
            feedback: `Low fidelity. Explanation demands can restart escalation and delay re-entry.`,
            wizard: `The Wizard sounds the alarm. The new room becomes another conversation about failure. Student moves farther from participation and closer to escape. Reflection belongs after regulation, re-entry, and reinforcement.`,
            ending: "fail",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "processing too early",
              function: "adult attention plus escape"
            }
          }
        }
      }
    },

    endings: {
      success: {
        title: `Success - Flexibility Reinforced`,
        text: `Student managed the unexpected change because predictability, job choice, and immediate reinforcement supported flexible movement.`
      },
      mixed: {
        title: `Mixed - Transition Completed, Skill Still Fragile`,
        text: `Student moved with the group or stabilized, but flexible transition behavior was not reinforced as clearly as it could have been.`
      },
      fail: {
        title: `Fail - Uncertainty Escalated`,
        text: `The response pattern made escape, adult attention, or public pressure more powerful than flexible transition behavior.`
      }
    }
  });
})();
