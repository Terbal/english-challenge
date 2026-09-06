// vocabulary.js — renders the day's vocabulary list as flashcard-style items
// with pronunciation (Web Speech API) and a Google Translate link (no API key).

const Vocabulary = (() => {
  function render(container, words) {
    container.innerHTML = "";
    const list = document.createElement("div");
    list.className = "vocab-list";
    words.forEach((w) => {
      const card = document.createElement("div");
      card.className = "vocab-card";
      card.innerHTML = `
        <div class="vocab-card-top">
          <div>
            <span class="vocab-en">${escapeHtml(w.en)}</span>
            <span class="vocab-fr">${escapeHtml(w.fr)}</span>
          </div>
          <div class="vocab-actions">
            <button class="icon-btn speak-btn" title="Listen" aria-label="Listen to pronunciation">${Icons.svg("volume", { size: 16 })}</button>
            <a class="icon-btn" target="_blank" rel="noopener" title="Google Translate" href="${Speech.translateLink(w.en)}">${Icons.svg("globe", { size: 16 })}</a>
          </div>
        </div>
        <p class="vocab-example">“${escapeHtml(w.example)}”</p>
      `;
      card.querySelector(".speak-btn").addEventListener("click", () => Speech.speak(w.en));
      list.appendChild(card);
    });
    container.appendChild(list);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { render };
})();
