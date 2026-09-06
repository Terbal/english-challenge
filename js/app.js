// app.js — main application controller. Ties storage, tracker, mindmap,
// vocabulary, speech, recorder and quiz together into the coaching flow:
// Understand → Ideas → Vocabulary → Patterns → Build → Practice → Questions → Review → Complete.

(function () {
  let state = Storage.load();
  let activeDay = state.currentDay <= Tracker.TOTAL_DAYS ? state.currentDay : Tracker.TOTAL_DAYS;
  let dayStep = "prepare"; // prepare | learn | practice | questions | complete

  const root = document.getElementById("app");
  const isMobile = window.matchMedia("(max-width: 640px)").matches;

  function getDay(n) {
    return CHALLENGE_DAYS.find(d => d.day === n);
  }

  function saveState() { Storage.save(state); }

  // ---------------------------------------------------------------------
  // ROUTER
  // ---------------------------------------------------------------------
  function navigate(view, opts = {}) {
    if (view === "day") {
      activeDay = opts.day || activeDay;
      dayStep = opts.step || "prepare";
    }
    render(view);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function render(view) {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    switch (view) {
      case "dashboard": renderDashboard(); break;
      case "day": renderDayFlow(); break;
      case "tracker": renderTracker(); break;
      case "phrasebank": renderPhraseBank(); break;
      case "quiz": renderQuiz(); break;
      default: renderDashboard();
    }
  }

  // ---------------------------------------------------------------------
  // DASHBOARD
  // ---------------------------------------------------------------------
  function renderDashboard() {
    const day = getDay(state.currentDay <= Tracker.TOTAL_DAYS ? state.currentDay : Tracker.TOTAL_DAYS);
    const pct = Tracker.progressPercent(state);
    const phase = Tracker.currentPhase(day.day);
    const finished = state.currentDay > Tracker.TOTAL_DAYS || Tracker.completedCount(state) >= Tracker.TOTAL_DAYS;

    root.innerHTML = `
      <section class="view view-dashboard">
        <div class="hero-card">
          <div class="hero-top">
            <span class="hero-day-label">DAY</span>
            <span class="hero-day-number">${day.day}<span class="hero-day-total">/100</span></span>
          </div>
          <p class="hero-phase">${escapeHtml(phase.name)}</p>
          <h2 class="hero-topic">${escapeHtml(day.topic)}</h2>
          <div class="hero-progress-track">
            <div class="hero-progress-fill" style="width:${pct}%"></div>
          </div>
          <p class="hero-progress-label">${pct}% of the challenge complete</p>
          <button class="btn btn-primary btn-large" id="start-day-btn">
            ${finished ? "Review the challenge" : (Tracker.dayState(day.day, state) === "completed" ? "Revisit this day" : "Start today's session")}
          </button>
        </div>

        <div class="stat-row">
          <div class="stat-box">
            <span class="stat-value">${Icons.svg("flame", { size: 18, className: "stat-icon stat-icon--flame" })} ${state.streak}</span>
            <span class="stat-label">Current streak</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${Icons.svg("trophy", { size: 18, className: "stat-icon stat-icon--trophy" })} ${state.bestStreak}</span>
            <span class="stat-label">Best streak</span>
          </div>
          <div class="stat-box">
            <span class="stat-value">${Icons.svg("check-circle", { size: 18, className: "stat-icon stat-icon--check" })} ${Tracker.completedCount(state)}</span>
            <span class="stat-label">Days done</span>
          </div>
        </div>

        <div class="dashboard-nav-row">
          <button class="nav-tile" id="goto-tracker">
            <span class="nav-tile-icon">${Icons.svg("map", { size: 22 })}</span>
            <span>100-Day Map</span>
          </button>
          <button class="nav-tile" id="goto-phrasebank">
            <span class="nav-tile-icon">${Icons.svg("book", { size: 22 })}</span>
            <span>Phrase Bank</span>
          </button>
          <button class="nav-tile" id="goto-quiz">
            <span class="nav-tile-icon">${Icons.svg("brain", { size: 22 })}</span>
            <span>Quiz &amp; Review</span>
          </button>
        </div>

        ${renderRecentDaysNav()}
      </section>
    `;

    root.querySelector("#start-day-btn").addEventListener("click", () => navigate("day", { day: day.day, step: "prepare" }));
    root.querySelector("#goto-tracker").addEventListener("click", () => navigate("tracker"));
    root.querySelector("#goto-phrasebank").addEventListener("click", () => navigate("phrasebank"));
    root.querySelector("#goto-quiz").addEventListener("click", () => navigate("quiz"));
    const prevBtn = root.querySelector("#prev-day-btn");
    if (prevBtn) prevBtn.addEventListener("click", () => navigate("day", { day: day.day - 1, step: "prepare" }));
  }

  function renderRecentDaysNav() {
    const day = state.currentDay <= Tracker.TOTAL_DAYS ? state.currentDay : Tracker.TOTAL_DAYS;
    if (day <= 1) return "";
    const prev = getDay(day - 1);
    return `
      <div class="quick-review">
        <p class="quick-review-label">Yesterday</p>
        <button class="quick-review-card" id="prev-day-btn">
          <span>Day ${prev.day} · ${escapeHtml(prev.topic)}</span>
          ${Icons.svg("refresh", { size: 16 })}
        </button>
      </div>
    `;
  }

  // ---------------------------------------------------------------------
  // DAY FLOW: prepare -> learn -> practice -> questions -> complete
  // ---------------------------------------------------------------------
  const STEP_ORDER = ["prepare", "learn", "practice", "questions", "complete"];
  const STEP_LABELS = { prepare: "Ideas", learn: "Learn", practice: "Speak", questions: "Questions", complete: "Done" };

  function renderDayFlow() {
    const day = getDay(activeDay);
    if (!day) { navigate("dashboard"); return; }
    const unlocked = Tracker.isUnlocked(activeDay, state);
    if (!unlocked) {
      root.innerHTML = `<section class="view"><p class="empty-hint">Day ${activeDay} is still locked. Finish the previous day first.</p>
        <button class="btn btn-secondary" id="back-dash">Back to dashboard</button></section>`;
      root.querySelector("#back-dash").addEventListener("click", () => navigate("dashboard"));
      return;
    }

    root.innerHTML = `
      <section class="view view-day">
        <div class="day-flow-header">
          <button class="icon-btn back-btn" id="day-back" aria-label="Back to dashboard">${Icons.svg("arrow-left", { size: 16 })}</button>
          <div>
            <p class="day-flow-eyebrow">Day ${day.day} · ${escapeHtml(day.phase)}</p>
            <h2 class="day-flow-topic">${escapeHtml(day.topic)}</h2>
          </div>
        </div>
        <div class="step-tabs" id="step-tabs"></div>
        <div id="step-content" class="step-content"></div>
      </section>
    `;
    root.querySelector("#day-back").addEventListener("click", () => navigate("dashboard"));
    renderStepTabs(day);
    renderStepContent(day);
  }

  function renderStepTabs(day) {
    const tabs = root.querySelector("#step-tabs");
    tabs.innerHTML = STEP_ORDER.map(step => `
      <button class="step-tab ${step === dayStep ? "active" : ""}" data-step="${step}">
        ${STEP_LABELS[step]}
      </button>
    `).join("");
    tabs.querySelectorAll(".step-tab").forEach(btn => {
      btn.addEventListener("click", () => { dayStep = btn.dataset.step; renderStepTabs(day); renderStepContent(day); });
    });
  }

  function renderStepContent(day) {
    const el = root.querySelector("#step-content");
    el.innerHTML = "";
    if (dayStep === "prepare") return renderPrepareStep(el, day);
    if (dayStep === "learn") return renderLearnStep(el, day);
    if (dayStep === "practice") return renderPracticeStep(el, day);
    if (dayStep === "questions") return renderQuestionsStep(el, day);
    if (dayStep === "complete") return renderCompleteStep(el, day);
  }

  function stepNavButtons(el, day, nextStep) {
    const nav = document.createElement("div");
    nav.className = "step-next-row";
    nav.innerHTML = `<button class="btn btn-primary" id="step-next-btn">Continue → ${STEP_LABELS[nextStep]}</button>`;
    el.appendChild(nav);
    nav.querySelector("#step-next-btn").addEventListener("click", () => {
      dayStep = nextStep;
      renderStepTabs(day);
      renderStepContent(day);
    });
  }

  // Step 1 — IDEAS (mind map)
  function renderPrepareStep(el, day) {
    const intro = document.createElement("div");
    intro.className = "step-intro";
    intro.innerHTML = `
      <p class="step-kicker">Step 1 · Ideas</p>
      <h3>What do you want to say?</h3>
      <p class="step-copy">Explore the mind map below. Each branch gives you keywords and ready-to-adapt phrases — don't memorize a script, collect ideas.</p>
    `;
    el.appendChild(intro);
    const mapContainer = document.createElement("div");
    el.appendChild(mapContainer);
    MindMap.render(mapContainer, day.mindMap, { mobile: isMobile });
    stepNavButtons(el, day, "learn");
  }

  // Step 2 & 3 — VOCABULARY + SENTENCE PATTERNS
  function renderLearnStep(el, day) {
    const intro = document.createElement("div");
    intro.className = "step-intro";
    intro.innerHTML = `
      <p class="step-kicker">Step 2 · Vocabulary &amp; patterns</p>
      <h3>Learn just enough to speak</h3>
      <p class="step-copy">${day.vocabulary.length} words — enough to actually use, not enough to forget. Tap ${Icons.svg("volume", { size: 13, className: "inline-icon" })} to hear them.</p>
    `;
    el.appendChild(intro);

    const vocabContainer = document.createElement("div");
    el.appendChild(vocabContainer);
    Vocabulary.render(vocabContainer, day.vocabulary);

    const patternsWrap = document.createElement("div");
    patternsWrap.className = "patterns-block";
    patternsWrap.innerHTML = `
      <h4>Sentence patterns for today</h4>
      <ul class="pattern-list">
        ${day.phrases.map(p => `<li><span>${escapeHtml(p)}</span><button class="icon-btn tiny-speak" data-text="${escapeHtml(p)}">${Icons.svg("volume", { size: 15 })}</button></li>`).join("")}
      </ul>
      <p class="see-also">Need more general structures? Check the <button class="link-btn" id="open-phrasebank">Phrase Bank</button>.</p>
    `;
    el.appendChild(patternsWrap);
    patternsWrap.querySelectorAll(".tiny-speak").forEach(btn => btn.addEventListener("click", () => Speech.speak(btn.dataset.text)));
    patternsWrap.querySelector("#open-phrasebank").addEventListener("click", () => navigate("phrasebank"));

    stepNavButtons(el, day, "practice");
  }

  // Step 4 & 5 — CONNECT IDEAS + SPEAK (1-minute timer + recording)
  let timerInterval = null;
  function renderPracticeStep(el, day) {
    const prepMin = day.prepTimeMinutes;
    const intro = document.createElement("div");
    intro.className = "step-intro";
    intro.innerHTML = `
      <p class="step-kicker">Step 3 · Speak</p>
      <h3>Connect your ideas, then speak for about a minute</h3>
      <p class="step-copy">${prepMin > 0
        ? `Take up to ${prepMin} minute${prepMin > 1 ? "s" : ""} to silently plan idea → sentence → transition → next idea. Then hit Start and speak for 60 seconds.`
        : `No preparation today — this is a real spontaneity test. Hit Start and speak for 60 seconds right now.`}</p>
    `;
    el.appendChild(intro);

    const practiceCard = document.createElement("div");
    practiceCard.className = "practice-card";
    practiceCard.innerHTML = `
      <div class="timer-display" id="timer-display">60</div>
      <p class="timer-state" id="timer-state">Ready when you are</p>
      <div class="practice-controls">
        <button class="btn btn-primary btn-large" id="timer-start">Start 1-minute speech</button>
        <button class="btn btn-secondary" id="timer-stop" disabled>${Icons.svg("square", { size: 14 })} Stop</button>
      </div>
      <details class="mini-mindmap-toggle">
        <summary>Peek at the mind map</summary>
        <div id="mini-mindmap"></div>
      </details>
      <div class="recording-block" id="recording-block"></div>
    `;
    el.appendChild(practiceCard);

    MindMap.render(practiceCard.querySelector("#mini-mindmap"), day.mindMap, { mobile: true });
    renderRecordingControls(practiceCard.querySelector("#recording-block"), day);

    const display = practiceCard.querySelector("#timer-display");
    const stateLabel = practiceCard.querySelector("#timer-state");
    const startBtn = practiceCard.querySelector("#timer-start");
    const stopBtn = practiceCard.querySelector("#timer-stop");
    let secondsLeft = 60;

    startBtn.addEventListener("click", () => {
      secondsLeft = 60;
      display.textContent = secondsLeft;
      stateLabel.textContent = "Speak now!";
      startBtn.disabled = true;
      stopBtn.disabled = false;
      practiceCard.classList.add("practice-live");
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        secondsLeft--;
        display.textContent = secondsLeft;
        if (secondsLeft <= 0) finishTimer();
      }, 1000);
    });

    stopBtn.addEventListener("click", finishTimer);

    function finishTimer() {
      clearInterval(timerInterval);
      startBtn.disabled = false;
      stopBtn.disabled = true;
      practiceCard.classList.remove("practice-live");
      stateLabel.innerHTML = `Time's up! ${Icons.svg("star", { size: 14, className: "inline-icon" })}`;
      display.textContent = "0";
    }

    stepNavButtons(el, day, "questions");
  }

  function renderRecordingControls(container, day) {
    if (!Recorder.isSupported()) {
      container.innerHTML = `<p class="empty-hint">Audio recording isn't supported in this browser.</p>`;
      return;
    }
    const micLabel = `${Icons.svg("mic", { size: 15 })} Record my speech`;
    const stopLabel = `${Icons.svg("square", { size: 14 })} Stop recording`;
    container.innerHTML = `
      <div class="recorder-row">
        <button class="btn btn-secondary" id="rec-toggle">${micLabel}</button>
      </div>
      <div class="recordings-list" id="recordings-list"></div>
    `;
    const toggleBtn = container.querySelector("#rec-toggle");
    const list = container.querySelector("#recordings-list");
    let recording = false;

    toggleBtn.addEventListener("click", async () => {
      if (!recording) {
        try {
          await Recorder.start();
          recording = true;
          toggleBtn.innerHTML = stopLabel;
          toggleBtn.classList.add("recording-active");
        } catch (e) {
          alert("Microphone access was denied or is unavailable.");
        }
      } else {
        const blob = await Recorder.stop();
        recording = false;
        toggleBtn.innerHTML = micLabel;
        toggleBtn.classList.remove("recording-active");
        if (blob) { await Recorder.save(day.day, blob); loadRecordings(); }
      }
    });

    async function loadRecordings() {
      const recs = await Recorder.listForDay(day.day);
      list.innerHTML = recs.length === 0 ? "" : recs.map((r, i) => `
        <div class="recording-item" data-id="${r.id}">
          <span>Take ${i + 1} — ${new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <audio controls src=""></audio>
          <button class="icon-btn delete-rec" aria-label="Delete recording">${Icons.svg("trash", { size: 15 })}</button>
        </div>
      `).join("");
      list.querySelectorAll(".recording-item").forEach((itemEl, i) => {
        const audioEl = itemEl.querySelector("audio");
        audioEl.src = URL.createObjectURL(recs[i].blob);
        itemEl.querySelector(".delete-rec").addEventListener("click", async () => {
          await Recorder.remove(recs[i].id);
          loadRecordings();
        });
      });
    }
    loadRecordings();
  }

  // Step — SPONTANEOUS QUESTIONS
  function renderQuestionsStep(el, day) {
    const intro = document.createElement("div");
    intro.className = "step-intro";
    intro.innerHTML = `
      <p class="step-kicker">Step 4 · Unexpected questions</p>
      <h3>Now answer without preparation</h3>
      <p class="step-copy">This is what turns memorized speeches into real conversation. Answer out loud — don't write it down.</p>
    `;
    el.appendChild(intro);

    const qCard = document.createElement("div");
    qCard.className = "question-card";
    el.appendChild(qCard);

    let pool = shuffleCopy(day.questions);
    let qi = 0;
    function showQuestion() {
      if (qi >= pool.length) qi = 0;
      qCard.innerHTML = `
        <p class="question-text">${escapeHtml(pool[qi])}</p>
        <div class="question-actions">
          <button class="icon-btn" id="q-speak">${Icons.svg("volume", { size: 16 })}</button>
          <button class="btn btn-secondary" id="q-next">Show another question</button>
        </div>
      `;
      qCard.querySelector("#q-speak").addEventListener("click", () => Speech.speak(pool[qi]));
      qCard.querySelector("#q-next").addEventListener("click", () => { qi++; showQuestion(); });
    }
    showQuestion();

    stepNavButtons(el, day, "complete");
  }

  function shuffleCopy(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Step — COMPLETE (self-assessment)
  function renderCompleteStep(el, day) {
    const already = state.completedDays[day.day];
    const intro = document.createElement("div");
    intro.className = "step-intro";
    intro.innerHTML = `
      <p class="step-kicker">Step 5 · Review</p>
      <h3>How did it go?</h3>
      <p class="step-copy">Rating honestly helps the app (and you) track real progress across the 100 days.</p>
    `;
    el.appendChild(intro);

    const form = document.createElement("div");
    form.className = "complete-form";
    form.innerHTML = `
      <p class="form-label">Did you finish speaking for about a minute?</p>
      <div class="pill-row" id="finished-row">
        <button class="pill" data-val="yes">Yes</button>
        <button class="pill" data-val="no">Not quite</button>
      </div>

      <p class="form-label">Difficulty</p>
      <div class="pill-row" id="difficulty-row">
        <button class="pill" data-val="Easy">Easy</button>
        <button class="pill" data-val="Medium">Medium</button>
        <button class="pill" data-val="Hard">Hard</button>
      </div>

      <p class="form-label">Confidence</p>
      <div class="pill-row" id="confidence-row">
        ${[1,2,3,4,5].map(n => `<button class="pill pill-num" data-val="${n}">${n}</button>`).join("")}
      </div>

      <p class="form-label">Optional note</p>
      <textarea id="complete-note" rows="3" placeholder="Words I struggled with, ideas for next time...">${already ? escapeHtml(already.note || "") : ""}</textarea>

      <button class="btn btn-primary btn-large" id="mark-complete-btn">Mark Day ${day.day} as complete</button>
    `;
    el.appendChild(form);

    let difficulty = already ? already.difficulty : null;
    let confidence = already ? already.confidence : null;

    function wireRow(id, apply) {
      const rowEl = form.querySelector(id);
      rowEl.querySelectorAll(".pill").forEach(btn => {
        btn.addEventListener("click", () => {
          rowEl.querySelectorAll(".pill").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          apply(btn.dataset.val);
        });
      });
    }
    wireRow("#difficulty-row", v => difficulty = v);
    wireRow("#confidence-row", v => confidence = parseInt(v, 10));
    wireRow("#finished-row", () => {});

    if (already && already.difficulty) {
      form.querySelector(`#difficulty-row [data-val="${already.difficulty}"]`)?.classList.add("selected");
    }
    if (already && already.confidence) {
      form.querySelector(`#confidence-row [data-val="${already.confidence}"]`)?.classList.add("selected");
    }

    form.querySelector("#mark-complete-btn").addEventListener("click", () => {
      const note = form.querySelector("#complete-note").value;
      state = Tracker.completeDay(state, day.day, { difficulty, confidence, note });
      showCelebration(day);
    });
  }

  function showCelebration(day) {
    const el = root.querySelector("#step-content");
    const nextDay = day.day + 1;
    const hasNext = nextDay <= Tracker.TOTAL_DAYS;
    el.innerHTML = `
      <div class="celebration">
        <div class="celebration-badge">${Icons.svg("star", { size: 46 })}</div>
        <h3>Day ${day.day} complete!</h3>
        <p>Streak: ${state.streak} day${state.streak === 1 ? "" : "s"} · ${Tracker.completedCount(state)}/100 done</p>
        ${hasNext
          ? `<button class="btn btn-primary btn-large" id="go-next-day">Go to Day ${nextDay}</button>`
          : `<p class="step-copy">You finished all 100 days. That's the whole challenge — congratulations!</p>`}
        <button class="btn btn-secondary" id="go-dashboard">Back to dashboard</button>
      </div>
    `;
    root.querySelector("#go-dashboard").addEventListener("click", () => navigate("dashboard"));
    const nextBtn = root.querySelector("#go-next-day");
    if (nextBtn) nextBtn.addEventListener("click", () => navigate("day", { day: nextDay, step: "prepare" }));
  }

  // ---------------------------------------------------------------------
  // TRACKER VIEW
  // ---------------------------------------------------------------------
  function renderTracker() {
    root.innerHTML = `
      <section class="view view-tracker">
        <h2 class="view-title">100-Day Map</h2>
        <p class="view-subtitle">${Tracker.completedCount(state)}/100 completed · streak ${state.streak} ${Icons.svg("flame", { size: 13, className: "inline-icon" })}</p>
        <div class="legend">
          <span><i class="legend-dot legend-dot--completed"></i>Completed</span>
          <span><i class="legend-dot legend-dot--current"></i>Current</span>
          <span><i class="legend-dot legend-dot--unlocked"></i>Unlocked</span>
          <span><i class="legend-dot legend-dot--locked"></i>Locked</span>
        </div>
        <div id="grid-container"></div>
        <div id="day-preview" class="day-preview"></div>
      </section>
    `;
    Tracker.renderGrid(root.querySelector("#grid-container"), state, (d) => showDayPreview(d));
  }

  function showDayPreview(d) {
    const day = getDay(d);
    const preview = root.querySelector("#day-preview");
    const status = Tracker.dayState(d, state);
    preview.innerHTML = `
      <p class="preview-eyebrow">Day ${day.day} · ${escapeHtml(day.phase)}</p>
      <h3>${escapeHtml(day.topic)}</h3>
      <button class="btn btn-primary" id="preview-open">${status === "completed" ? "Review this day" : "Open this day"}</button>
    `;
    preview.querySelector("#preview-open").addEventListener("click", () => navigate("day", { day: day.day, step: "prepare" }));
  }

  // ---------------------------------------------------------------------
  // PHRASE BANK VIEW
  // ---------------------------------------------------------------------
  function renderPhraseBank() {
    root.innerHTML = `
      <section class="view view-phrasebank">
        <h2 class="view-title">Phrase Bank</h2>
        <p class="view-subtitle">Reusable structures for every day of the challenge.</p>
        <div class="phrasebank-grid">
          ${Object.entries(PHRASE_BANK).map(([cat, phrases]) => `
            <div class="phrasebank-cat">
              <h4>${escapeHtml(cat)}</h4>
              <ul class="pattern-list">
                ${phrases.map(p => `<li><span>${escapeHtml(p)}</span><button class="icon-btn tiny-speak" data-text="${escapeHtml(p)}">${Icons.svg("volume", { size: 15 })}</button></li>`).join("")}
              </ul>
            </div>
          `).join("")}
        </div>
      </section>
    `;
    root.querySelectorAll(".tiny-speak").forEach(btn => btn.addEventListener("click", () => Speech.speak(btn.dataset.text)));
  }

  // ---------------------------------------------------------------------
  // QUIZ VIEW
  // ---------------------------------------------------------------------
  function renderQuiz() {
    root.innerHTML = `
      <section class="view view-quiz">
        <h2 class="view-title">Quiz &amp; Review</h2>
        <p class="view-subtitle">Built automatically from the vocabulary in the days you've completed.</p>
        <div id="quiz-container"></div>
      </section>
    `;
    Quiz.render(root.querySelector("#quiz-container"), state, (s) => { state = s; });
  }

  // ---------------------------------------------------------------------
  // BOTTOM NAV + VOICE SETTINGS
  // ---------------------------------------------------------------------
  function wireBottomNav() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => navigate(btn.dataset.view));
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute("content", theme === "light" ? "#f4f7fc" : "#0a0f1c");
  }

  function wireThemeToggle() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;
    applyTheme(state.settings.theme || "dark");
    btn.addEventListener("click", () => {
      const next = (state.settings.theme || "dark") === "dark" ? "light" : "dark";
      state.settings.theme = next;
      saveState();
      applyTheme(next);
    });
  }

  function wireVoicePicker() {
    const select = document.getElementById("voice-select");
    if (!select) return;
    function populate() {
      const voices = Speech.englishVoices();
      select.innerHTML = `<option value="">Default English voice</option>` +
        voices.map(v => `<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join("");
      if (state.settings.voiceURI) select.value = state.settings.voiceURI;
    }
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = populate;
    populate();
    select.addEventListener("change", () => {
      state.settings.voiceURI = select.value || null;
      Speech.setPreferredVoice(state.settings.voiceURI);
      saveState();
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ---------------------------------------------------------------------
  // INIT
  // ---------------------------------------------------------------------
  function init() {
    Icons.hydrate(document);
    wireThemeToggle();
    wireBottomNav();
    wireVoicePicker();
    if (state.settings.voiceURI) Speech.setPreferredVoice(state.settings.voiceURI);

    const resetBtn = document.getElementById("reset-progress-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (confirm("This will erase all your progress on this device. Are you sure?")) {
          state = Storage.reset();
          activeDay = 1; dayStep = "prepare";
          navigate("dashboard");
        }
      });
    }

    navigate("dashboard");

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js").catch(err => console.warn("SW registration failed", err));
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
