// mindmap.js — interactive mind map: "What ideas can I use to talk about
// this topic for one minute?" Renders an SVG radial diagram; clicking a
// branch reveals keywords / expressions / a question in a side panel,
// rather than dumping the whole speech onto the screen at once.

const MindMap = (() => {
  function render(container, mindMapData, opts = {}) {
    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "mindmap";

    const svgWrap = document.createElement("div");
    svgWrap.className = "mindmap-svg-wrap";
    wrap.appendChild(svgWrap);

    const panel = document.createElement("div");
    panel.className = "mindmap-panel";
    panel.innerHTML = `<p class="mindmap-panel-hint">Tap a branch to see ideas you can use.</p>`;
    wrap.appendChild(panel);

    const branches = mindMapData.branches;
    const n = branches.length;
    const size = opts.mobile ? 340 : 460;
    const cx = size / 2, cy = size / 2;
    const radius = size * 0.36;
    const nodeR = opts.mobile ? 8 : 9;

    const svgns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgns, "svg");
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.setAttribute("class", "mindmap-canvas");

    // lines from center to each branch
    branches.forEach((b, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      const line = document.createElementNS(svgns, "line");
      line.setAttribute("x1", cx); line.setAttribute("y1", cy);
      line.setAttribute("x2", x); line.setAttribute("y2", y);
      line.setAttribute("class", "mindmap-line");
      svg.appendChild(line);
    });

    // center node
    const centerG = document.createElementNS(svgns, "g");
    const centerCircle = document.createElementNS(svgns, "circle");
    centerCircle.setAttribute("cx", cx); centerCircle.setAttribute("cy", cy);
    centerCircle.setAttribute("r", opts.mobile ? 46 : 56);
    centerCircle.setAttribute("class", "mindmap-center-circle");
    centerG.appendChild(centerCircle);
    const centerText = document.createElementNS(svgns, "text");
    centerText.setAttribute("x", cx); centerText.setAttribute("y", cy);
    centerText.setAttribute("class", "mindmap-center-text");
    wrapSvgText(centerText, mindMapData.center, opts.mobile ? 12 : 15, svgns);
    centerG.appendChild(centerText);
    svg.appendChild(centerG);

    // branch nodes
    branches.forEach((b, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);

      const g = document.createElementNS(svgns, "g");
      g.setAttribute("class", "mindmap-node");
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", b.label);

      const circle = document.createElementNS(svgns, "circle");
      circle.setAttribute("cx", x); circle.setAttribute("cy", y);
      circle.setAttribute("r", nodeR);
      circle.setAttribute("class", "mindmap-node-circle");
      g.appendChild(circle);

      const labelX = cx + (radius + (opts.mobile ? 34 : 46)) * Math.cos(angle);
      const labelY = cy + (radius + (opts.mobile ? 34 : 46)) * Math.sin(angle);
      const text = document.createElementNS(svgns, "text");
      text.setAttribute("x", labelX);
      text.setAttribute("y", labelY);
      text.setAttribute("class", "mindmap-node-label");
      text.setAttribute("text-anchor", "middle");
      wrapSvgText(text, b.label, opts.mobile ? 10 : 12.5, svgns, 14);
      g.appendChild(text);

      const activate = () => {
        svg.querySelectorAll(".mindmap-node-circle").forEach(c => c.classList.remove("active"));
        circle.classList.add("active");
        renderPanel(panel, b);
      };
      g.addEventListener("click", activate);
      g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } });

      svg.appendChild(g);
    });

    svgWrap.appendChild(svg);
    container.appendChild(wrap);
  }

  function wrapSvgText(textEl, str, fontSize, svgns, maxCharsPerLine = 12) {
    textEl.setAttribute("font-size", fontSize);
    const words = str.split(" ");
    let lines = [];
    let current = "";
    words.forEach(w => {
      if ((current + " " + w).trim().length > maxCharsPerLine && current) {
        lines.push(current.trim());
        current = w;
      } else {
        current = (current + " " + w).trim();
      }
    });
    if (current) lines.push(current);
    const lineHeight = fontSize * 1.15;
    const startDy = -((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(svgns, "tspan");
      tspan.setAttribute("x", textEl.getAttribute("x"));
      tspan.setAttribute("dy", i === 0 ? startDy : lineHeight);
      tspan.textContent = line;
      textEl.appendChild(tspan);
    });
  }

  function renderPanel(panel, branch) {
    const kw = (branch.keywords || []).map(k => `<span class="chip">${escapeHtml(k)}</span>`).join("");
    const expr = (branch.expressions || []).map(e => `<li>${escapeHtml(e)}</li>`).join("");
    const q = (branch.questions || []).map(q => `<li>${escapeHtml(q)}</li>`).join("");
    panel.innerHTML = `
      <h4>${escapeHtml(branch.label)}</h4>
      ${kw ? `<div class="chip-row">${kw}</div>` : ""}
      ${expr ? `<p class="panel-subhead">Ideas you could say</p><ul class="panel-list">${expr}</ul>` : ""}
      ${q ? `<p class="panel-subhead">Ask yourself</p><ul class="panel-list">${q}</ul>` : ""}
    `;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  return { render };
})();
