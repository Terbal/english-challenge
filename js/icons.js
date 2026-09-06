// icons.js — a small, dependency-free icon set (outline + a few solid "badge"
// icons) used everywhere the app previously used emoji. Every icon is a
// 24x24 viewBox SVG using currentColor, so it inherits text color / theme.

const Icons = (() => {
  const OUTLINE = {
    home: `<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5a1 1 0 0 0 1 1H9.5v-6h5v6H17.5a1 1 0 0 0 1-1V10"/>`,
    map: `<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z"/><path d="M9 3v16M15 5v16"/>`,
    book: `<path d="M12 6.2C10.2 4.9 8 4.2 5.5 4.2A2.5 2.5 0 0 0 3 6.7v11.6a1 1 0 0 0 1.3 1c1.9-.7 3.9-1 5.7.1.6.4 1.4.4 2 0 1.8-1.1 3.8-.8 5.7-.1a1 1 0 0 0 1.3-1V6.7a2.5 2.5 0 0 0-2.5-2.5c-2.5 0-4.7.7-6.5 2Z"/><path d="M12 6.2v14"/>`,
    brain: `<path d="M9.5 4A2.75 2.75 0 0 0 7 6.9a2.4 2.4 0 0 0-1 4.4A2.75 2.75 0 0 0 7.6 16 2.75 2.75 0 0 0 12 14.2V6.2A2.2 2.2 0 0 0 9.5 4Z"/><path d="M14.5 4A2.75 2.75 0 0 1 17 6.9a2.4 2.4 0 0 1 1 4.4 2.75 2.75 0 0 1-1.6 4.7A2.75 2.75 0 0 1 12 14.2"/>`,
    volume: `<path d="M4 9.5v5h3.3l4.7 3.6V5.9L7.3 9.5H4Z"/><path d="M16.7 8.3a5 5 0 0 1 0 7.4"/><path d="M19.3 5.8a9 9 0 0 1 0 12.4"/>`,
    globe: `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.2 2.3 3.4 5.2 3.4 8.5s-1.2 6.2-3.4 8.5"/><path d="M12 3.5c-2.2 2.3-3.4 5.2-3.4 8.5s1.2 6.2 3.4 8.5"/>`,
    mic: `<rect x="9.3" y="3" width="5.4" height="10.5" rx="2.7"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/><path d="M8.7 21h6.6"/>`,
    square: `<rect x="6" y="6" width="12" height="12" rx="2.5"/>`,
    trash: `<path d="M4.5 7h15"/><path d="M10 11.2v5.8"/><path d="M14 11.2v5.8"/><path d="M6.3 7l.9 12.1A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.9L18.7 7"/><path d="M9.3 7V4.8A1 1 0 0 1 10.3 4h3.4a1 1 0 0 1 1 1V7"/>`,
    "arrow-left": `<path d="M20 12H5.5"/><path d="m11 18-6-6 6-6"/>`,
    refresh: `<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 3.5V9h-5.5"/>`,
    settings: `<circle cx="12" cy="12" r="3.2"/>
      <g stroke-linecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5.2"/>
        <line x1="12" y1="18.8" x2="12" y2="21.5"/>
        <line x1="2.5" y1="12" x2="5.2" y2="12"/>
        <line x1="18.8" y1="12" x2="21.5" y2="12"/>
        <line x1="5.1" y1="5.1" x2="7" y2="7"/>
        <line x1="17" y1="17" x2="18.9" y2="18.9"/>
        <line x1="18.9" y1="5.1" x2="17" y2="7"/>
        <line x1="7" y1="17" x2="5.1" y2="18.9"/>
      </g>`,
    sun: `<circle cx="12" cy="12" r="4.2"/>
      <g stroke-linecap="round">
        <line x1="12" y1="2.5" x2="12" y2="4.8"/>
        <line x1="12" y1="19.2" x2="12" y2="21.5"/>
        <line x1="2.5" y1="12" x2="4.8" y2="12"/>
        <line x1="19.2" y1="12" x2="21.5" y2="12"/>
        <line x1="5.1" y1="5.1" x2="6.7" y2="6.7"/>
        <line x1="17.3" y1="17.3" x2="18.9" y2="18.9"/>
        <line x1="18.9" y1="5.1" x2="17.3" y2="6.7"/>
        <line x1="6.7" y1="17.3" x2="5.1" y2="18.9"/>
      </g>`,
    moon: `<path d="M20 14.7A8.6 8.6 0 1 1 9.3 4a7 7 0 0 0 10.7 10.7Z"/>`,
    lock: `<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.3 10.5V7.3a3.7 3.7 0 0 1 7.4 0v3.2"/>`,
    "check-circle": `<circle cx="12" cy="12" r="8.7"/><path d="m8 12.3 2.6 2.6L16.3 9"/>`,
  };

  // Solid (filled) icons for "achievement" style badges — flame, trophy, star.
  const SOLID = {
    flame: `<path d="M12 2.2c.9 3-2.6 3.9-2.6 7.6a2.6 2.6 0 0 0 5.2 0c0-1.2-.8-1.8-.8-3 1.9 1 3.2 3.3 3.2 5.7a5 5 0 0 1-10 0c0-4.3 3.4-6.2 5-10.3Z"/>`,
    trophy: `<path d="M7.5 4h9v4.2a4.5 4.5 0 0 1-9 0V4Z"/><path d="M7.5 5.3H4.8a2.7 2.7 0 0 0 2.9 4.4"/><path d="M16.5 5.3h2.7a2.7 2.7 0 0 1-2.9 4.4"/><path d="M10.3 13.9v1.8a1.7 1.7 0 0 0 3.4 0v-1.8"/><path d="M8.3 20h7.4"/><path d="M12 17.6V20"/>`,
    star: `<path d="m12 2.5 2.7 5.8 6.3.7-4.7 4.3 1.4 6.2L12 16.3l-5.7 3.2 1.4-6.2-4.7-4.3 6.3-.7Z"/>`,
  };

  function svg(name, { size = 18, strokeWidth = 1.8, className = "" } = {}) {
    if (SOLID[name]) {
      return `<svg class="icon icon--solid ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${SOLID[name]}</svg>`;
    }
    const body = OUTLINE[name];
    if (!body) return "";
    return `<svg class="icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
  }

  // Replace every element with a data-icon attribute (used for static markup in index.html).
  function hydrate(root = document) {
    root.querySelectorAll("[data-icon]").forEach(el => {
      const name = el.getAttribute("data-icon");
      const size = parseInt(el.getAttribute("data-icon-size") || "18", 10);
      el.innerHTML = svg(name, { size });
    });
  }

  return { svg, hydrate };
})();
