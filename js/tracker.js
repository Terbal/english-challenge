// tracker.js — 100-day progress tracker: streaks, unlock logic, grid rendering.

const Tracker = (() => {
  const TOTAL_DAYS = 100;

  function completedCount(state) {
    return Object.keys(state.completedDays).length;
  }

  function progressPercent(state) {
    return Math.round((completedCount(state) / TOTAL_DAYS) * 100);
  }

  function currentPhase(day) {
    return PHASES_INFO.find(p => day >= p.range[0] && day <= p.range[1]) || PHASES_INFO[PHASES_INFO.length - 1];
  }

  // A day is unlocked if it's day 1, or the previous day is completed,
  // or the day is already completed (so users can revisit/replay it).
  function dayState(day, state) {
    if (state.completedDays[day]) return "completed";
    if (day === state.currentDay) return "current";
    if (day < state.currentDay) return "missed"; // was current before but user moved past without completing (rare, e.g. after a reset)
    if (day === 1) return "current";
    const prevCompleted = !!state.completedDays[day - 1];
    return prevCompleted ? "unlocked" : "locked";
  }

  function isUnlocked(day, state) {
    const s = dayState(day, state);
    return s === "completed" || s === "current" || s === "unlocked" || s === "missed";
  }

  function completeDay(state, day, { difficulty, confidence, note } = {}) {
    const today = Storage.todayISO();
    const wasAlready = !!state.completedDays[day];
    state.completedDays[day] = {
      completedAt: new Date().toISOString(),
      difficulty: difficulty || null,
      confidence: confidence || null,
      note: note || "",
    };

    if (!wasAlready) {
      // Update streak: if the last completion was yesterday, extend; if today already logged, keep; else reset to 1.
      if (state.lastCompletedDate) {
        const diff = Storage.daysBetween(state.lastCompletedDate, today);
        if (diff === 0) {
          // already logged a completion today, streak unchanged
        } else if (diff === 1) {
          state.streak += 1;
        } else {
          state.streak = 1;
        }
      } else {
        state.streak = 1;
      }
      state.lastCompletedDate = today;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
    }

    if (day >= state.currentDay && day < TOTAL_DAYS) {
      state.currentDay = day + 1;
    } else if (day === TOTAL_DAYS) {
      state.currentDay = TOTAL_DAYS; // stays put, challenge finished
    }
    Storage.save(state);
    return state;
  }

  function renderGrid(container, state, onSelectDay) {
    container.innerHTML = "";
    const grid = document.createElement("div");
    grid.className = "day-grid";
    for (let d = 1; d <= TOTAL_DAYS; d++) {
      const cell = document.createElement("button");
      const st = dayState(d, state);
      cell.className = `day-cell day-cell--${st}`;
      cell.textContent = d;
      cell.setAttribute("aria-label", `Day ${d} - ${st}`);
      if (st === "locked") {
        cell.disabled = true;
      } else {
        cell.addEventListener("click", () => onSelectDay(d));
      }
      grid.appendChild(cell);
    }
    container.appendChild(grid);
  }

  return { TOTAL_DAYS, completedCount, progressPercent, currentPhase, dayState, isUnlocked, completeDay, renderGrid };
})();
