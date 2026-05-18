/* daily-mission-1.js
 * Mission: Reinforceable Example Content
 * Daily Mission 1: First Mark on the Page
 *
 * Purpose:
 * - Practice implementation of the Example BIP during independent writing.
 * - Primary function pressure: escape from difficult writing.
 * - Secondary function pressure: peer attention during public delay/refusal.
 * - Teacher skill: reduce the first step, prompt task initiation, reinforce the first mark.
 *
 * Loading note:
 * - This file assumes the main engine has already created POOL.
 * - Load this file after the shared engine and after any shared config/BIP file.
 */

(function registerDailyMission1() {
  if (typeof POOL === "undefined") {
    throw new Error("POOL must be defined before loading daily-mission-1.js");
  }

  POOL.daily = POOL.daily || [];

  POOL.daily.push({
    id: "daily_1_first_mark_on_page",
    title: "Daily Mission: First Mark on the Page",
    start: "step1",
    focus: "Escape-maintained writing refusal; prompt first-step response and reinforce task initiation.",
    routine: "independent writing",
    functionPressure: ["escape", "peer attention"],
    bipTargets: ["Prevent", "Teach", "Reinforce", "Respond"],

    steps: {
      step1: {
        briefing: `Student's refusal during writing is most likely when the task has several written responses and no clear first step. The plan is to privately reduce the first step, prompt help or a brief break before refusal escalates, and reinforce task initiation within 5 seconds. Avoid removing the task unless there is a clear return step.`,

        scene: `It is 9:42, ten minutes before recess. The class is beginning a short written response about the science video they just watched. Student loved the video and answered questions out loud, but now the page has four blank lines. His pencil rolls to the edge of the desk. He presses his sleeve over the first line and whispers, "I'm not doing this." A nearby peer looks up and smirks.`,

        prompt: `You are holding the clipboard for reading groups, three students are waiting for help, and Student is about five seconds away from either starting or turning this into a public moment. What do you do first?`,

        choices: {
          A: {
            text: `Say, "You know this from the video. Take a minute, think of your idea, and try your best."`,
            score: 0,
            feedback: `Developing fidelity. This is warm, but it does not reduce the response effort or prompt the replacement behavior.`,
            studentOutcome: `Student hears kindness, but the page still looks like four blank lines with no doorway in. The peer's smirk remains available, and the task has not become smaller or clearer.`,
            wizard: `The Wizard watches the pencil stay still. Warmth helps the relationship, but the BIP needs an observable first step that competes with escape.`,
            next: "step2_wobble",
            meta: {
              bipComponent: "Prevent",
              mechanism: "Prompting",
              errorType: "warm but vague encouragement",
              function: "escape"
            }
          },
          B: {
            text: `Quietly say, "Write your name or circle your first idea. I will come back after the first mark."`,
            score: 10,
            feedback: `High fidelity. You reduced the first step, preserved the writing routine, and created a response to reinforce.`,
            studentOutcome: `Student does not have to finish the paragraph. He only has to make the first mark. The peer's smirk loses power because the moment stays private and the task is still available.`,
            wizard: `The Wizard taps the page and the blank lines shrink into one tiny doorway. You arranged an antecedent support and prompted task initiation before refusal contacted escape.`,
            next: "step2_supported",
            meta: {
              bipComponent: "Prevent",
              mechanism: "Prompting",
              errorType: "none",
              function: "escape"
            }
          },
          C: {
            text: `Quietly say, "You can take a break at the calm spot and start when you feel ready."`,
            score: -10,
            feedback: `Low fidelity. This sounds compassionate, but it may reinforce escape because the break has no timer or return step.`,
            studentOutcome: `Student leaves the page with no defined bridge back. The writing demand disappears right after refusal, and the calm spot becomes more powerful than the replacement request.`,
            wizard: `The Wizard's map folds in half. Breaks can be part of the BIP, but they must be brief, requested appropriately, and tied to a planned return.`,
            next: "step2_escape_opened",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "break without return step",
              function: "escape"
            }
          }
        }
      },

      step2_supported: {
        scene: `Student circles one word from his idea list but does not write yet. His shoulders are still tight, but the pencil is in his hand.`,
        prompt: `This is the fragile task-initiation window. What do you do next?`,
        choices: {
          A: {
            text: `Tell him, "Good choice. Now finish the sentence so we can keep moving."`,
            score: 0,
            feedback: `Developing fidelity. You acknowledged the choice, but the next demand grew too quickly before reinforcement landed.`,
            studentOutcome: `Student made one brave move, but now the full sentence rushes back at him. His pencil slows because the task has become large again before the first response was strengthened.`,
            wizard: `The Wizard sees the doorway widen too fast. Increase task demands gradually after reinforcement, not before.`,
            next: "step3_mixed",
            meta: {
              bipComponent: "Teach",
              mechanism: "Fluency building",
              errorType: "demand too large too soon",
              function: "escape"
            }
          },
          B: {
            text: `Stand nearby silently and wait because he has already touched the task and may continue independently.`,
            score: 0,
            feedback: `Developing fidelity. The first step occurred, but the plan's reinforcement window is closing.`,
            studentOutcome: `Student is close to success, but the first task response is fading without being named. A nearby peer shifts in his seat, and the peer audience starts to become interesting again.`,
            wizard: `The Wizard holds his breath. Delayed reinforcement is weaker for building task initiation.`,
            next: "step3_mixed",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "delayed reinforcement",
              function: "escape"
            }
          },
          C: {
            text: `Mark a Chart Move, privately praise the first mark, and give one next step: "Write the first word."`,
            score: 10,
            feedback: `High fidelity. You reinforced task initiation immediately and shaped the next small response.`,
            studentOutcome: `Student learns that the first brave mark, not refusal, changes the moment. The next step is small enough to follow before avoidance rebuilds.`,
            wizard: `The Wizard stamps the chart while the pencil is still warm. Immediate reinforcement strengthens the replacement pathway and supports fluency.`,
            next: "step3_strong",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "none",
              function: "escape"
            }
          }
        }
      },

      step2_wobble: {
        scene: `Student sighs louder and pushes the pencil toward the middle of the table. The nearby peer laughs under his breath.`,
        prompt: `The refusal is still small, but it has started to produce peer attention. What do you do next?`,
        choices: {
          A: {
            text: `Move close, block the audience with your body position, and offer a name-or-first-word choice.`,
            score: 10,
            feedback: `High fidelity. You reduced peer attention and returned to the first-step prompt.`,
            studentOutcome: `The smirk has less room to work. Student gets two doable paths back to the task before the refusal grows teeth.`,
            wizard: `The Wizard lowers a curtain between Student and the table audience. You reduced the attention payoff and re-established the antecedent support.`,
            next: "step3_recovered",
            meta: {
              bipComponent: "Prevent",
              mechanism: "Prompting",
              errorType: "none",
              function: "escape plus peer attention"
            }
          },
          B: {
            text: `Tell the peer to ignore him and remind Student that everyone is responsible for finishing writing.`,
            score: -10,
            feedback: `Low fidelity. This makes the peer audience explicit and gives the refusal more public attention.`,
            studentOutcome: `The peer is now officially part of the scene, and Student's writing refusal has become a group event. The paper is farther away than before.`,
            wizard: `The Wizard's spotlight swings to the table. Public correction can strengthen attention-maintained features of the behavior.`,
            next: "step3_risk",
            meta: {
              bipComponent: "Respond",
              mechanism: "Performance feedback",
              errorType: "public correction",
              function: "peer attention"
            }
          },
          C: {
            text: `Give Student one more minute to settle while you help the waiting reading group students.`,
            score: 0,
            feedback: `Developing fidelity. This reduces adult attention, but the task and replacement behavior are not actively supported.`,
            studentOutcome: `Nothing explodes, but the pencil stays away from Student and the page stays blank. The routine is quiet, not repaired.`,
            wizard: `The Wizard watches the minute stretch. Waiting may reduce adult attention, but it does not teach the first-step response.`,
            next: "step3_mixed",
            meta: {
              bipComponent: "Teach",
              mechanism: "Prompting",
              errorType: "missed replacement prompt",
              function: "escape"
            }
          }
        }
      },

      step2_escape_opened: {
        scene: `Student walks to the calm spot with no timer and no return step. He looks relieved. The writing page stays on the desk. Other students notice that Student is no longer writing.`,
        prompt: `The break is happening, but the return path is not yet clear. What do you do next?`,
        choices: {
          A: {
            text: `Let him stay until he looks ready, then invite him back to try writing again.`,
            score: 0,
            feedback: `Developing fidelity. The break may reduce escalation, but the return routine is vague.`,
            studentOutcome: `Student is quieter, but the writing demand is far away. Readiness becomes the rule, and escape has more time to settle in.`,
            wizard: `The Wizard watches the calm spot become comfortable. Breaks need duration, expectation, and re-entry criteria.`,
            next: "step3_mixed",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "vague re-entry",
              function: "escape"
            }
          },
          B: {
            text: `Set a two-minute timer, preview the return step, and reinforce when he walks back with the pencil.`,
            score: 10,
            feedback: `High fidelity repair. You converted an open-ended escape into a planned break with re-entry.`,
            studentOutcome: `Student can regulate, but the path leads back to one small writing action. The calm spot becomes a bridge instead of a tunnel.`,
            wizard: `The Wizard snaps the map back open. You preserved the break while restoring the function-based replacement sequence.`,
            next: "step3_recovered",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "none",
              function: "escape"
            }
          },
          C: {
            text: `Use the calm spot to explain why avoiding writing makes the task take longer.`,
            score: -10,
            feedback: `Low fidelity. Processing during a break can restart escalation and add adult attention.`,
            studentOutcome: `The calm spot stops being regulation and becomes a lecture zone. Student's eyes leave the return path and lock onto the argument instead.`,
            wizard: `The Wizard's timer melts. Process later, after regulation and re-entry are stable.`,
            next: "step3_risk",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "processing too early",
              function: "escape plus adult attention"
            }
          }
        }
      },

      step3_strong: {
        scene: `Student writes the first word. The sentence is not finished, but task initiation happened under the exact condition that usually triggers refusal.`,
        prompt: `You have a strong start. How do you protect the momentum?`,
        choices: {
          A: {
            text: `Say privately, "First word is on the page. Chart Move. Next, add one science detail."`,
            score: 10,
            feedback: `High fidelity. You reinforced the target behavior and shaped the next step without overloading him.`,
            studentOutcome: `Student sees that starting works. The page is still challenging, but the path is now mark, reinforcement, next small move.`,
            wizard: `The Wizard's staff glows over the first word. This is fluency building through repeated, reinforced task initiation.`,
            ending: "success",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Fluency building",
              errorType: "none",
              function: "escape"
            }
          },
          B: {
            text: `Say privately, "Great, keep going," and return to the reading group while he is engaged.`,
            score: 0,
            feedback: `Developing fidelity. The praise is supportive, but the next action is not specific enough for a fragile routine.`,
            studentOutcome: `Student has momentum, yet the plan's precision fades when the prompt becomes general. The next part of the page grows fuzzy again.`,
            wizard: `The Wizard nods as you step away. General praise is helpful, but the BIP calls for specific reinforcement and a clear next action.`,
            ending: "mixed",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "vague praise",
              function: "escape"
            }
          },
          C: {
            text: `Tell the table, "See how Student got started? Everyone can make a good choice."`,
            score: -10,
            feedback: `Low fidelity. Public praise can turn task initiation into a performance and rebuild the peer audience.`,
            studentOutcome: `Student's first word becomes public property. The peer audience returns, and the private success starts to feel like a show.`,
            wizard: `The Wizard's glow sputters as the table looks up. Reinforcement should be specific and private when peer attention is part of the behavior pathway.`,
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
        scene: `Student returns to the page and touches the pencil. The routine was wobbly, but you have a chance to reinforce recovery instead of refusal.`,
        prompt: `How do you strengthen re-entry without making the task too big too fast?`,
        choices: {
          A: {
            text: `Require him to finish one full sentence before earning anything else.`,
            score: -10,
            feedback: `Low fidelity. The demand jumps too far before re-entry is strengthened.`,
            studentOutcome: `Student came back, but the first step turns into a full sentence toll booth. The old escape route starts glowing again.`,
            wizard: `The Wizard sees the bridge crack. Shape re-entry gradually after reinforcing the replacement response.`,
            ending: "fail",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "demand too large after re-entry",
              function: "escape"
            }
          },
          B: {
            text: `Reinforce returning to the page, then prompt one tiny action he can complete immediately.`,
            score: 10,
            feedback: `High fidelity. You reinforced re-entry and rebuilt the task pathway.`,
            studentOutcome: `Student learns that coming back works, and the next action is small enough to contact success quickly.`,
            wizard: `The Wizard repairs the page one plank at a time. Reinforcing re-entry prevents the episode from ending with escape as the strongest outcome.`,
            ending: "success",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "none",
              function: "escape"
            }
          },
          C: {
            text: `Let him sit quietly with the pencil until he decides what he wants to write.`,
            score: 0,
            feedback: `Developing fidelity. The task is nearby, but the replacement routine is not fully taught.`,
            studentOutcome: `The crisis is over, but the skill is still thin. Student has proximity to writing, not yet a reinforced writing response.`,
            wizard: `The Wizard waits by the desk. Quiet is not the same as implementation fidelity.`,
            ending: "mixed",
            meta: {
              bipComponent: "Teach",
              mechanism: "Prompting",
              errorType: "missed first-action prompt",
              function: "escape"
            }
          }
        }
      },

      step3_mixed: {
        scene: `Student is calmer, but the page is still mostly blank. The class has moved on, and the writing routine remains fragile.`,
        prompt: `You still have a chance to turn calm into task re-entry. What do you do?`,
        choices: {
          A: {
            text: `Prompt one visible first action and reinforce it immediately when it happens.`,
            score: 10,
            feedback: `High fidelity repair. You converted partial calm into a reinforced task response.`,
            studentOutcome: `Student makes one visible move, and the Chart Move tells him exactly what worked.`,
            wizard: `The Wizard points to the smallest opening left. The plan can recover when reinforcement contacts the replacement response.`,
            ending: "success",
            meta: {
              bipComponent: "Reinforce",
              mechanism: "Performance feedback",
              errorType: "none",
              function: "escape"
            }
          },
          B: {
            text: `Allow him to finish later so the group can continue without another disruption.`,
            score: -10,
            feedback: `Low fidelity. This may make task delay the outcome of refusal.`,
            studentOutcome: `Student did not have to re-enter the writing task, and the routine lost its teaching moment. The escape pathway sparkles.`,
            wizard: `The Wizard closes the page. Delaying the task can reinforce refusal if re-entry is not practiced.`,
            ending: "fail",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "task delay after refusal",
              function: "escape"
            }
          },
          C: {
            text: `Keep expectations calm and check back after helping the rest of the group.`,
            score: 0,
            feedback: `Developing fidelity. Calm expectations help, but they are not enough without an observable response.`,
            studentOutcome: `You avoided escalation, which matters, but the task-initiation skill was not built as strongly as it could be. The page remains quiet.`,
            wizard: `The Wizard watches the page remain quiet. The BIP targets active re-entry, not just reduced disruption.`,
            ending: "mixed",
            meta: {
              bipComponent: "Teach",
              mechanism: "Prompting",
              errorType: "missed observable action",
              function: "escape"
            }
          }
        }
      },

      step3_risk: {
        scene: `Student is now oriented away from the page. The peer or adult interaction has become more interesting than writing.`,
        prompt: `The writing pathway is weak, but the mission can still be repaired. What do you do?`,
        choices: {
          A: {
            text: `Reduce language, remove the audience, and return to one tiny writing action with reinforcement.`,
            score: 10,
            feedback: `High fidelity repair. You lowered the payoff for refusal and rebuilt the task path.`,
            studentOutcome: `The mission is bruised, but Student still has a path back that does not require a bigger episode. Only one small markable step remains on stage.`,
            wizard: `The Wizard sweeps the stage clean. Repair means reducing maintaining consequences and prompting the replacement behavior.`,
            ending: "mixed",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "recovery repair",
              function: "escape plus attention"
            }
          },
          B: {
            text: `Explain calmly that writing is required and he needs to make a better choice now.`,
            score: -10,
            feedback: `Low fidelity. More language can maintain escape and adult attention.`,
            studentOutcome: `Student no longer has to write; he can manage the conversation instead. The page drifts farther away.`,
            wizard: `The Wizard hears the explanation become the task. Extended explanation can become the maintaining consequence.`,
            ending: "fail",
            meta: {
              bipComponent: "Respond",
              mechanism: "Performance feedback",
              errorType: "extended explanation",
              function: "adult attention plus escape"
            }
          },
          C: {
            text: `Give space and wait until the attention fades before trying writing again later.`,
            score: 0,
            feedback: `Developing fidelity. This may reduce escalation, but it does not rebuild the current writing routine.`,
            studentOutcome: `The audience may cool, but the writing task is no longer active. The plan will need a stronger re-entry bridge next time.`,
            wizard: `The Wizard waits with the room. Stabilization is useful, but it is not the same as replacement teaching.`,
            ending: "mixed",
            meta: {
              bipComponent: "Respond",
              mechanism: "Adaptation",
              errorType: "delayed re-entry",
              function: "escape"
            }
          }
        }
      }
    },

    endings: {
      success: {
        title: `Success - Task Initiation Strengthened`,
        text: `Student contacted reinforcement for the first small writing response, not for refusal or delay. The BIP pathway became stronger.`
      },
      mixed: {
        title: `Mixed - Routine Survived, Skill Still Fragile`,
        text: `Student stabilized or partially re-entered, but reinforcement or replacement teaching was delayed, vague, or incomplete.`
      },
      fail: {
        title: `Fail - Escape Pathway Strengthened`,
        text: `The response pattern made writing easier to avoid or made adult and peer attention more valuable than task initiation.`
      }
    }
  });
})();
