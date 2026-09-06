// quiz.js — lightweight local spaced-repetition-flavored quiz over the
// vocabulary the user has already unlocked (i.e. words from completed days).

const Quiz = (() => {
  const STAGES = ["new", "learning", "review", "mastered"];

  function collectPool(state) {
    const pool = [];
    CHALLENGE_DAYS.forEach(dayObj => {
      if (!state.completedDays[dayObj.day]) return;
      dayObj.vocabulary.forEach((w, idx) => {
        const key = `${dayObj.day}-${idx}`;
        pool.push({ key, day: dayObj.day, en: w.en, fr: w.fr, example: w.example,
                    stage: state.vocabProgress[key] || "new" });
      });
    });
    return pool;
  }

  function pickDistractors(pool, correct, field, count) {
    const others = pool.filter(w => w[field] !== correct[field]);
    shuffle(others);
    return others.slice(0, count).map(o => o[field]);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildQuestions(pool, count) {
    if (pool.length === 0) return [];
    const shuffled = shuffle([...pool]);
    const chosen = shuffled.slice(0, Math.min(count, shuffled.length));
    const types = ["en2fr", "fr2en", "fillblank"];
    return chosen.map((word, i) => {
      const type = types[i % types.length];
      if (type === "en2fr") {
        const distractors = pickDistractors(pool, word, "fr", 3);
        const options = shuffle([word.fr, ...distractors]);
        return { type, word, prompt: word.en, options, answer: word.fr };
      } else if (type === "fr2en") {
        const distractors = pickDistractors(pool, word, "en", 3);
        const options = shuffle([word.en, ...distractors]);
        return { type, word, prompt: word.fr, options, answer: word.en };
      } else {
        const blanked = word.example.replace(new RegExp(word.en, "i"), "____");
        const distractors = pickDistractors(pool, word, "en", 3);
        const options = shuffle([word.en, ...distractors]);
        return { type, word, prompt: blanked, options, answer: word.en };
      }
    });
  }

  function nextStage(stage, correct) {
    const idx = STAGES.indexOf(stage);
    if (correct) return STAGES[Math.min(idx + 1, STAGES.length - 1)];
    return "learning";
  }

  function render(container, state, onStateChange) {
    container.innerHTML = "";
    const pool = collectPool(state);

    if (pool.length === 0) {
      container.innerHTML = `<p class="empty-hint">Complete a few days first — your quiz builds itself from the vocabulary you've already unlocked.</p>`;
      return;
    }

    const questions = buildQuestions(pool, 10);
    let qi = 0;
    let score = 0;

    const shell = document.createElement("div");
    shell.className = "quiz-shell";
    container.appendChild(shell);

    function renderStageBar() {
      const counts = { new: 0, learning: 0, review: 0, mastered: 0 };
      pool.forEach(w => counts[state.vocabProgress[w.key] || "new"]++);
      const bar = document.createElement("div");
      bar.className = "stage-bar";
      STAGES.forEach(s => {
        const seg = document.createElement("div");
        seg.className = `stage-seg stage-seg--${s}`;
        seg.textContent = `${s} ${counts[s]}`;
        bar.appendChild(seg);
      });
      return bar;
    }

    function renderQuestion() {
      shell.innerHTML = "";
      shell.appendChild(renderStageBar());

      if (qi >= questions.length) {
        shell.innerHTML += `
          <div class="quiz-done">
            <h3>Session complete</h3>
            <p>You got ${score} / ${questions.length} right.</p>
            <button class="btn btn-primary" id="quiz-restart">New session</button>
          </div>`;
        shell.querySelector("#quiz-restart").addEventListener("click", () => render(container, state, onStateChange));
        return;
      }

      const q = questions[qi];
      const card = document.createElement("div");
      card.className = "quiz-card";
      const typeLabel = { en2fr: "English → French", fr2en: "French → English", fillblank: "Fill in the blank" }[q.type];
      card.innerHTML = `
        <p class="quiz-progress">Question ${qi + 1} / ${questions.length}</p>
        <p class="quiz-type">${typeLabel}</p>
        <p class="quiz-prompt">${escapeHtml(q.prompt)}</p>
        <div class="quiz-options"></div>
      `;
      const optWrap = card.querySelector(".quiz-options");
      q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "quiz-option";
        btn.textContent = opt;
        btn.addEventListener("click", () => selectAnswer(opt, q, btn, optWrap));
        optWrap.appendChild(btn);
      });
      shell.appendChild(card);
    }

    function selectAnswer(chosen, q, btnEl, optWrap) {
      optWrap.querySelectorAll("button").forEach(b => {
        b.disabled = true;
        if (b.textContent === q.answer) b.classList.add("correct");
      });
      const correct = chosen === q.answer;
      if (!correct) btnEl.classList.add("incorrect");
      else score++;

      state.vocabProgress[q.word.key] = nextStage(q.word.stage, correct);
      state.quizStats.attempts++;
      if (correct) state.quizStats.correct++;
      Storage.save(state);
      if (onStateChange) onStateChange(state);

      setTimeout(() => { qi++; renderQuestion(); }, 850);
    }

    renderQuestion();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { render, collectPool };
})();
