/* -------- DOM refs -------- */
const storyText       = document.getElementById('story-text');
const choicesDiv      = document.getElementById('choices');
const scenarioTitle   = document.getElementById('scenario-title');
const pointsEl        = document.getElementById('points');
const feedbackEl      = document.getElementById('feedback');
const feedbackTextEl  = document.getElementById('feedback-text');
const coachImgEl      = document.getElementById('coach-img');

/* -------- Wizard -------- */
const WIZ = {
  plus:  'mr-wizard-plus10.png',
  meh:   'mr-wizard-0.png',
  minus: 'mr-wizard-minus10.png'
};
function setWizardSprite(state) {
  const src = (state === 'plus') ? WIZ.plus : (state === 'minus') ? WIZ.minus : WIZ.meh;
  if (coachImgEl) coachImgEl.src = `${src}?v=${Date.now()}`;
}
setWizardSprite('meh');

/* -------- Scoring -------- */
let points = 0;
let maxPossible = 0;
function addPoints(delta) {
  if (typeof delta === 'number') {
    maxPossible += 10;
    points += delta;
    if (pointsEl) pointsEl.textContent = points;
  }
}
function resetGame() {
  points = 0; maxPossible = 0;
  if (pointsEl) pointsEl.textContent = '0';
}

/* -------- Feedback -------- */
function showFeedback(text, scoreHint) {
  if (!feedbackTextEl) return;
  const state = scoreHint > 0 ? 'plus' : scoreHint < 0 ? 'minus' : 'meh';
  setWizardSprite(state);
  feedbackTextEl.textContent = text || '';
}

/* -------- Content Pool (Just 1 scenario to test) -------- */
const POOL = { daily: [{
  id: "test1",
  title: "Test: Morning Work",
  start: "step1",
  steps: {
    step1: {
      text: "JM looks overwhelmed at his desk.",
      choices: {
        A: { text: "Reduce work to 50%", score: 10, feedback: "Great!", next: "end" },
        B: { text: "Tell him to try", score: 0, feedback: "Neutral.", next: "end" },
        C: { text: "Make him do all", score: -10, feedback: "Too much!", next: "end" }
      }
    }
  },
  endings: {
    end: { title: "Done", text: "Test complete." }
  }
}]};

/* -------- Engine -------- */
let DYN = { nodes: [] };
function startMission(scn) {
  DYN.nodes = [];
  let idMap = {};
  let id = 1000;
  for (let k in scn.steps) idMap[k] = id++;
  for (let k in scn.endings) idMap[k] = id++;

  for (let k in scn.steps) {
    let step = scn.steps[k];
    let node = { id: idMap[k], text: step.text, options: [] };
    for (let c in step.choices) {
      let ch = step.choices[c];
      node.options.push({
        text: ch.text,
        delta: ch.score,
        feedback: ch.feedback,
        nextId: ch.next ? idMap[ch.next] : idMap[ch.ending]
      });
    }
    DYN.nodes.push(node);
  }
  for (let k in scn.endings) {
    let end = scn.endings[k];
    DYN.nodes.push({ id: idMap[k], feedback: true, customMsg: end.text, options: [{ text: "Home", nextId: 'home' }] });
  }
  showNode(idMap[scn.start]);
}

function getNode(id) { return DYN.nodes.find(n => n.id === id); }

function showNode(id) {
  const node = getNode(id);
  if (!node) return;

  if (node.feedback) {
    storyText.style.display = 'none';
    const panel = document.createElement('div');
    panel.innerHTML = `<strong>${node.customMsg}</strong><br><button onclick="location.reload()">Play Again</button>`;
    choicesDiv.innerHTML = ''; choicesDiv.appendChild(panel);
  } else {
    storyText.style.display = 'block';
    storyText.textContent = node.text;
    choicesDiv.innerHTML = '';
    node.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.text;
      btn.className = 'scenario-btn primary big';
      btn.onclick = () => {
        if (typeof opt.delta === 'number') addPoints(opt.delta);
        showFeedback(opt.feedback, opt.delta);
        setTimeout(() => showNode(opt.nextId), 800);
      };
      choicesDiv.appendChild(btn);
    });
  }
}

/* -------- Init -------- */
document.addEventListener('DOMContentLoaded', () => {
  storyText.innerHTML = `Welcome! Click below to start.`;
  const btn = document.createElement('button');
  btn.textContent = 'Start Test Mission';
  btn.className = 'scenario-btn primary big';
  btn.onclick = () => { resetGame(); startMission(POOL.daily[0]); };
  choicesDiv.appendChild(btn);
});
