// "Research journey" graph for the about page (_includes/research_graph.liquid).
// Papers are read from the rendered /publications/ page (data-pub-* attributes from
// _layouts/bib.liquid), so the graph updates whenever papers.bib changes. Career phases
// and awards come from _data/research_journey.yml via #rg-config.
(function () {
  "use strict";

  var root = document.getElementById("research-graph");
  if (!root) return;

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

  // Lanes top to bottom: the path rises from underwater to the sea surface.
  var LANES = [
    { key: "surface", label: "Maritime Surface" },
    { key: "ground", label: "Ground" },
    { key: "under", label: "Underwater" },
  ];
  var SENSORS = [
    { key: "radar", label: "Radar", cls: "rg-fill-radar" },
    { key: "lidar", label: "LiDAR", cls: "rg-fill-lidar" },
    { key: "sonar", label: "Sonar", cls: "rg-fill-sonar" },
    { key: "vision", label: "Camera / other", cls: "rg-fill-vision" },
  ];
  var TYPES = {
    journal: { label: "Journal", r: 10 },
    conference: { label: "Conference", r: 7.5 },
    "domestic-journal": { label: "Domestic journal", r: 6 },
    "domestic-conference": { label: "Domestic conference", r: 6 },
    workshop: { label: "Workshop / poster", r: 5 },
    other: { label: "Other", r: 5 },
  };
  var TAG_LABELS = { radar: "Radar", lidar: "LiDAR", sonar: "Sonar", slam: "SLAM", learning: "Learning" };
  var VENUE_NAMES = {
    "the journal of korea robotics society": "JKROS",
    "plos one": "PLOS ONE",
    "ifac-papersonline": "IFAC-PapersOnLine",
  };

  var W = 960;
  var M = { left: 128, right: 24 };
  var PHASE_Y = 6;
  var PHASE_H = 24;
  var PLOT_TOP = 52;
  var LANE_H = 96;
  var AXIS_H = 30;
  var H = PLOT_TOP + LANES.length * LANE_H + AXIS_H;

  var svg = root.querySelector(".rg-svg");
  var tooltip = root.querySelector(".rg-tooltip");
  var statsEl = root.querySelector(".rg-stats");
  var legendEl = root.querySelector(".rg-legend");
  var fallback = root.querySelector(".rg-fallback");

  var config = { phases: [], awards: [] };
  try {
    var configEl = document.getElementById("rg-config");
    if (configEl) config = JSON.parse(configEl.textContent) || config;
  } catch (e) {
    // Phases and awards are optional decoration.
  }

  function el(name, attrs, parent) {
    var node = document.createElementNS(SVG_NS, name);
    Object.keys(attrs || {}).forEach(function (k) {
      node.setAttribute(k, attrs[k]);
    });
    if (parent) parent.appendChild(node);
    return node;
  }

  function parseYm(value) {
    if (!value) return null;
    if (String(value).toLowerCase() === "present") {
      var now = new Date();
      return now.getFullYear() + now.getMonth() / 12;
    }
    var m = String(value).match(/^(\d{4})(?:-(\d{1,2}))?/);
    if (!m) return null;
    return parseInt(m[1], 10) + ((m[2] ? parseInt(m[2], 10) : 1) - 1) / 12;
  }

  function parseMonth(raw) {
    var value = (raw || "").trim().toLowerCase();
    if (!value) return 0;
    var num = parseInt(value, 10);
    if (!isNaN(num)) return num;
    return MONTHS[value.slice(0, 3)] || 0;
  }

  function clean(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function shortVenue(periodical) {
    var text = clean(periodical)
      .replace(/^In\s+/, "")
      .replace(/\s*,\s*([A-Za-z]{3}\s+)?\d{4}\s*$/, "");
    var paren = text.match(/\(([^()]+)\)\s*$/);
    if (paren) return paren[1].replace(/\s+Issue$/i, "");
    if (VENUE_NAMES[text.toLowerCase()]) return VENUE_NAMES[text.toLowerCase()];
    var ws = text.match(/^(\w+)\s+(Workshop|Poster)/i);
    if (ws) return ws[1] + " " + ws[2];
    return text.length > 28 ? text.slice(0, 26) + "…" : text;
  }

  function parsePapers(doc, baseUrl) {
    var papers = [];
    doc.querySelectorAll(".row[data-pub-type]").forEach(function (row) {
      var body = row.querySelector(":scope > div[id]");
      if (!body) return;
      var tags = (row.getAttribute("data-pub-tags") || "").split(/\s+/).filter(Boolean);
      var year = parseInt(row.getAttribute("data-pub-year"), 10);
      if (!year) return;
      var month = parseMonth(row.getAttribute("data-pub-month"));

      var authorEl = body.querySelector(".author");
      var authorText = clean(authorEl && authorEl.textContent);
      var me = authorEl && authorEl.querySelector("em");
      var meText = clean(me && me.textContent);
      var first = !!meText && authorText.indexOf(meText) === 0;
      var corresponding = !!meText && meText.indexOf("†") !== -1;

      var lane = LANES.filter(function (l) {
        return tags.indexOf(l.key) !== -1;
      })[0];
      if (!lane) lane = tags.indexOf("sonar") !== -1 ? LANES[2] : LANES[1];

      var sensors = SENSORS.filter(function (s) {
        return tags.indexOf(s.key) !== -1;
      });
      if (!sensors.length) sensors = [SENSORS[3]];

      var img = row.querySelector("img");
      var thumb = img && img.getAttribute("src") ? new URL(img.getAttribute("src"), baseUrl).href : "";

      papers.push({
        key: body.id,
        title: clean((body.querySelector(".title") || {}).textContent),
        venue: shortVenue((body.querySelector(".periodical") || {}).textContent),
        year: year,
        month: month,
        t: year + (month ? (month - 0.5) / 12 : 0.5),
        type: TYPES[row.getAttribute("data-pub-type")] ? row.getAttribute("data-pub-type") : "other",
        tags: tags,
        lane: lane,
        sensors: sensors.slice(0, 2),
        first: first,
        corresponding: corresponding,
        lead: first || corresponding,
        thumb: thumb,
        href: new URL("#" + encodeURIComponent(body.id), baseUrl).href,
      });
    });
    return papers;
  }

  // Place dots in a lane without overlap: nudge up/down from the lane centre.
  function layoutLane(nodes, cy, halfHeight) {
    var placed = [];
    nodes
      .slice()
      .sort(function (a, b) {
        return a.x - b.x || b.r - a.r;
      })
      .forEach(function (n) {
        var step = 0;
        var y = cy;
        for (var tries = 0; tries < 40; tries++) {
          var offset = Math.ceil(step / 2) * 7 * (step % 2 ? -1 : 1);
          y = cy + offset;
          var hit = placed.some(function (p) {
            var dx = p.x - n.x;
            var dy = p.y - y;
            var min = p.r + n.r + 4;
            return dx * dx + dy * dy < min * min;
          });
          if (!hit || Math.abs(offset) > halfHeight - n.r) break;
          step++;
        }
        n.y = y;
        placed.push(n);
      });
  }

  // Smooth curve through points (Catmull-Rom converted to cubic Béziers).
  function smoothPath(points) {
    if (points.length < 2) return "";
    var d = "M" + points[0].x.toFixed(1) + "," + points[0].y.toFixed(1);
    for (var i = 0; i < points.length - 1; i++) {
      var p0 = points[i - 1] || points[i];
      var p1 = points[i];
      var p2 = points[i + 1];
      var p3 = points[i + 2] || p2;
      var c1x = p1.x + (p2.x - p0.x) / 6;
      var c1y = p1.y + (p2.y - p0.y) / 6;
      var c2x = p2.x - (p3.x - p1.x) / 6;
      var c2y = p2.y - (p3.y - p1.y) / 6;
      d += " C" + [c1x, c1y, c2x, c2y, p2.x, p2.y].map(function (v) {
        return v.toFixed(1);
      }).join(",");
    }
    return d;
  }

  function halfDisc(cx, cy, r, side) {
    // side -1: left half, 1: right half
    return (
      "M" + cx + "," + (cy - r) + " A" + r + "," + r + " 0 0," + (side < 0 ? 0 : 1) + " " + cx + "," + (cy + r) + " Z"
    );
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function render(papers) {
    var minT = Math.floor(Math.min.apply(null, papers.map(function (p) { return p.t; })));
    var nowT = new Date().getFullYear() + new Date().getMonth() / 12;
    var maxT = Math.ceil(Math.max(nowT, Math.max.apply(null, papers.map(function (p) { return p.t; }))) + 0.01);
    var plotW = W - M.left - M.right;
    function x(t) {
      return M.left + ((t - minT) / (maxT - minT)) * plotW;
    }
    var plotBottom = PLOT_TOP + LANES.length * LANE_H;

    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML = "";
    var title = el("title", { id: "rg-svg-title" }, svg);
    title.textContent = "Publications over time by research domain";

    // Career phases: a labelled band on top and a faint wash behind the lanes.
    var gPhases = el("g", { class: "rg-phases" }, svg);
    (config.phases || []).forEach(function (phase, i) {
      var s = Math.max(parseYm(phase.start), minT);
      var e = Math.min(parseYm(phase.end), maxT);
      if (!(e > s)) return;
      var x0 = x(s) + 1;
      var x1 = x(e) - 1;
      el("rect", { x: x0, y: PLOT_TOP, width: x1 - x0, height: plotBottom - PLOT_TOP, class: i % 2 ? "rg-phase-wash rg-phase-alt" : "rg-phase-wash" }, gPhases);
      var band = el("rect", { x: x0, y: PHASE_Y, width: x1 - x0, height: PHASE_H, rx: 6, class: "rg-phase-band" }, gPhases);
      var tip = el("title", {}, band);
      tip.textContent = phase.label + " (" + phase.start + " – " + phase.end + ")";
      var label = String(phase.label);
      if (label.length * 6.4 + 14 < x1 - x0) {
        var text = el("text", { x: (x0 + x1) / 2, y: PHASE_Y + PHASE_H / 2 + 4, class: "rg-phase-label" }, gPhases);
        text.textContent = label;
      }
    });

    // Year grid and axis.
    var gAxis = el("g", { class: "rg-axis" }, svg);
    for (var yr = minT; yr <= maxT; yr++) {
      el("line", { x1: x(yr), x2: x(yr), y1: PLOT_TOP, y2: plotBottom, class: "rg-grid" }, gAxis);
      if (yr < maxT) {
        var t = el("text", { x: x(yr + 0.5), y: plotBottom + 20, class: "rg-axis-label" }, gAxis);
        t.textContent = yr;
      }
    }

    // Lanes.
    var gLanes = el("g", { class: "rg-lanes" }, svg);
    LANES.forEach(function (lane, i) {
      var y0 = PLOT_TOP + i * LANE_H;
      lane.cy = y0 + LANE_H / 2;
      if (i > 0) el("line", { x1: M.left, x2: W - M.right, y1: y0, y2: y0, class: "rg-lane-line" }, gLanes);
      var name = el("text", { x: 0, y: lane.cy - 2, class: "rg-lane-label" }, gLanes);
      name.textContent = lane.label;
      var count = papers.filter(function (p) {
        return p.lane === lane;
      }).length;
      var sub = el("text", { x: 0, y: lane.cy + 14, class: "rg-lane-count" }, gLanes);
      sub.textContent = count + (count === 1 ? " paper" : " papers");
    });
    el("line", { x1: M.left, x2: W - M.right, y1: plotBottom, y2: plotBottom, class: "rg-baseline" }, gLanes);

    // Awards: a star on the phase band and a faint guide down through the lanes.
    var gAwards = el("g", { class: "rg-awards" }, svg);
    var awardNodes = [];
    (config.awards || []).forEach(function (award) {
      var t = parseYm(award.date);
      if (t === null || t < minT || t > maxT) return;
      var ax = x(t + 0.5 / 12);
      el("line", { x1: ax, x2: ax, y1: PHASE_Y + PHASE_H + 4, y2: plotBottom, class: "rg-award-guide" }, gAwards);
      var g = el("g", { class: "rg-award", tabindex: "0", role: "img", "aria-label": award.label }, gAwards);
      var cy = PHASE_Y + PHASE_H + 10;
      var pts = [];
      for (var k = 0; k < 10; k++) {
        var rad = k % 2 ? 3 : 7;
        var ang = -Math.PI / 2 + (k * Math.PI) / 5;
        pts.push((ax + rad * Math.cos(ang)).toFixed(1) + "," + (cy + rad * Math.sin(ang)).toFixed(1));
      }
      el("circle", { cx: ax, cy: cy, r: 12, class: "rg-hit" }, g);
      el("polygon", { points: pts.join(" "), class: "rg-award-star" }, g);
      awardNodes.push({ g: g, award: award, x: ax, y: cy });
    });

    // Paper positions.
    papers.forEach(function (p) {
      p.x = x(p.t);
      p.r = TYPES[p.type].r;
    });
    LANES.forEach(function (lane) {
      layoutLane(
        papers.filter(function (p) {
          return p.lane === lane;
        }),
        lane.cy,
        LANE_H / 2
      );
    });

    // Research path through the papers I led.
    var leadPoints = papers
      .filter(function (p) {
        return p.lead;
      })
      .sort(function (a, b) {
        return a.t - b.t;
      });
    var path = el("path", { d: smoothPath(leadPoints), class: "rg-path" }, svg);

    // Dots.
    var gDots = el("g", { class: "rg-dots" }, svg);
    papers
      .slice()
      .sort(function (a, b) {
        return b.r - a.r;
      })
      .forEach(function (p) {
        var a = el("a", { href: p.href, class: "rg-node", "aria-label": p.title + ", " + p.venue + " " + p.year }, gDots);
        el("circle", { cx: p.x, cy: p.y, r: p.r + 7, class: "rg-hit" }, a);
        if (p.lead) el("circle", { cx: p.x, cy: p.y, r: p.r + 3, class: "rg-lead-ring" }, a);
        if (p.sensors.length > 1) {
          el("path", { d: halfDisc(p.x, p.y, p.r, -1), class: "rg-dot " + p.sensors[0].cls }, a);
          el("path", { d: halfDisc(p.x, p.y, p.r, 1), class: "rg-dot " + p.sensors[1].cls }, a);
          el("circle", { cx: p.x, cy: p.y, r: p.r, class: "rg-dot-outline" }, a);
        } else {
          el("circle", { cx: p.x, cy: p.y, r: p.r, class: "rg-dot " + p.sensors[0].cls }, a);
        }
        p.node = a;
      });

    // Tooltip.
    function place(px, py) {
      var box = svg.getBoundingClientRect();
      var rootBox = root.getBoundingClientRect();
      var scale = box.width / W;
      var left = box.left - rootBox.left + px * scale;
      var top = box.top - rootBox.top + py * scale;
      tooltip.hidden = false;
      var tw = tooltip.offsetWidth;
      var th = tooltip.offsetHeight;
      var l = Math.min(Math.max(left - tw / 2, 4), root.clientWidth - tw - 4);
      var t = top - th - 14;
      if (t < 0) t = top + 18;
      tooltip.style.left = l + "px";
      tooltip.style.top = t + "px";
    }

    function showPaper(p) {
      var role = p.first && p.corresponding ? "First & corresponding author" : p.first ? "First author" : p.corresponding ? "Corresponding author" : "Co-author";
      var tags = p.tags
        .filter(function (t) {
          return TAG_LABELS[t];
        })
        .map(function (t) {
          return '<span class="rg-tip-tag">' + TAG_LABELS[t] + "</span>";
        })
        .join("");
      tooltip.innerHTML =
        (p.thumb ? '<img class="rg-tip-thumb" alt="" src="' + escapeHtml(p.thumb) + '">' : "") +
        '<div class="rg-tip-body">' +
        '<div class="rg-tip-meta"><span class="rg-tip-venue">' +
        escapeHtml(p.venue) +
        "</span> · " +
        p.year +
        " · " +
        TYPES[p.type].label +
        "</div>" +
        '<div class="rg-tip-title">' +
        escapeHtml(p.title) +
        "</div>" +
        '<div class="rg-tip-role' +
        (p.lead ? " is-lead" : "") +
        '">' +
        role +
        "</div>" +
        (tags ? '<div class="rg-tip-tags">' + tags + "</div>" : "") +
        "</div>";
      place(p.x, p.y - p.r);
    }

    function showAward(a) {
      tooltip.innerHTML = '<div class="rg-tip-body"><div class="rg-tip-meta">Award · ' + escapeHtml(a.award.date) + '</div><div class="rg-tip-title">' + escapeHtml(a.award.label) + "</div></div>";
      place(a.x, a.y - 6);
    }

    function hide() {
      tooltip.hidden = true;
    }

    papers.forEach(function (p) {
      p.node.addEventListener("mouseenter", function () {
        showPaper(p);
      });
      p.node.addEventListener("focus", function () {
        showPaper(p);
      });
      p.node.addEventListener("mouseleave", hide);
      p.node.addEventListener("blur", hide);
    });
    awardNodes.forEach(function (a) {
      a.g.addEventListener("mouseenter", function () {
        showAward(a);
      });
      a.g.addEventListener("focus", function () {
        showAward(a);
      });
      a.g.addEventListener("mouseleave", hide);
      a.g.addEventListener("blur", hide);
    });

    // Highlight controls.
    var activeTag = "";
    var leadOnly = false;
    function applyHighlight() {
      papers.forEach(function (p) {
        var on = (!activeTag || p.tags.indexOf(activeTag) !== -1) && (!leadOnly || p.lead);
        p.node.classList.toggle("is-dim", !on);
      });
      path.classList.toggle("is-strong", leadOnly);
      path.classList.toggle("is-dim", !!activeTag && !leadOnly);
      root.querySelectorAll(".rg-toggle[data-rg-tag]").forEach(function (btn) {
        var on = btn.getAttribute("data-rg-tag") === activeTag;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var leadBtn = root.querySelector("[data-rg-lead]");
      leadBtn.classList.toggle("is-active", leadOnly);
      leadBtn.setAttribute("aria-pressed", leadOnly ? "true" : "false");
    }
    root.querySelector(".rg-controls").addEventListener("click", function (event) {
      var btn = event.target.closest(".rg-toggle");
      if (!btn) return;
      if (btn.hasAttribute("data-rg-lead")) {
        leadOnly = !leadOnly;
      } else {
        var tag = btn.getAttribute("data-rg-tag");
        activeTag = tag && activeTag === tag ? "" : tag;
      }
      applyHighlight();
    });
    applyHighlight();

    // Headline numbers.
    var leadCount = leadPoints.length;
    var journals = papers.filter(function (p) {
      return p.type === "journal";
    }).length;
    var stats = [
      [papers.length, "publications"],
      [journals, "international journals"],
      [leadCount, "led as first or corresponding author"],
      [minT + "–" + Math.max.apply(null, papers.map(function (p) { return p.year; })), "underwater → ground → sea surface"],
    ];
    statsEl.innerHTML = stats
      .map(function (s) {
        return '<div class="rg-stat"><div class="rg-stat-value">' + s[0] + '</div><div class="rg-stat-label">' + s[1] + "</div></div>";
      })
      .join("");

    // Legend.
    var sensorItems = SENSORS.filter(function (s) {
      return papers.some(function (p) {
        return p.sensors.indexOf(s) !== -1;
      });
    })
      .map(function (s) {
        return '<span class="rg-legend-item"><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="5" class="' + s.cls + '"></circle></svg>' + s.label + "</span>";
      })
      .join("");
    var sizeItems = ["journal", "conference", "domestic-journal", "workshop"]
      .filter(function (k) {
        return papers.some(function (p) {
          return p.type === k;
        });
      })
      .map(function (k) {
        var r = TYPES[k].r;
        var s = r * 2 + 2;
        return '<span class="rg-legend-item"><svg width="' + s + '" height="' + s + '" aria-hidden="true"><circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" class="rg-legend-size"></circle></svg>' + TYPES[k].label + "</span>";
      })
      .join("");
    legendEl.innerHTML =
      '<div class="rg-legend-group"><span class="rg-legend-title">Sensor</span>' +
      sensorItems +
      '<span class="rg-legend-item rg-legend-note">half-and-half = two sensors</span></div>' +
      '<div class="rg-legend-group"><span class="rg-legend-title">Venue</span>' +
      sizeItems +
      "</div>" +
      '<div class="rg-legend-group"><span class="rg-legend-title">Mine</span>' +
      '<span class="rg-legend-item"><svg width="18" height="18" aria-hidden="true"><circle cx="9" cy="9" r="4.5" class="rg-fill-vision"></circle><circle cx="9" cy="9" r="7.5" class="rg-lead-ring"></circle></svg>Led by me</span>' +
      '<span class="rg-legend-item"><svg width="22" height="10" aria-hidden="true"><path d="M1,8 C7,8 13,2 21,2" class="rg-path"></path></svg>My research path</span>' +
      '<span class="rg-legend-item"><svg width="14" height="14" aria-hidden="true"><polygon points="7,0 8.8,4.6 13.7,4.8 9.9,7.9 11.2,12.6 7,9.9 2.8,12.6 4.1,7.9 0.3,4.8 5.2,4.6" class="rg-award-star"></polygon></svg>Award</span>' +
      "</div>";
  }

  var source = root.getAttribute("data-source");
  fetch(source, { credentials: "same-origin" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var papers = parsePapers(doc, new URL(source, window.location.href).href);
      if (!papers.length) throw new Error("no papers");
      render(papers);
      root.classList.add("is-ready");
      if (fallback) fallback.hidden = true;
    })
    .catch(function () {
      if (fallback) fallback.textContent = "The research timeline could not be loaded. ";
      if (fallback) {
        var link = document.createElement("a");
        link.href = source;
        link.textContent = "See all publications.";
        fallback.appendChild(link);
      }
    });
})();
