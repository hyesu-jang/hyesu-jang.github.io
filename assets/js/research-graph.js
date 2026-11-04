// "Research journey" graph for the about page (_includes/research_graph.liquid).
// Papers are read from the rendered /publications/ page (data-pub-* attributes from
// _layouts/bib.liquid), so the graph updates whenever papers.bib changes. Projects without
// a paper and award markers come from _data/research_journey.yml via #rg-config.
(function () {
  "use strict";

  var root = document.getElementById("research-graph");
  if (!root) return;

  var SVG_NS = "http://www.w3.org/2000/svg";
  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

  // Bands top to bottom: the trail rises from underwater to the sea surface.
  var LANES = [
    { key: "surface", label: "Maritime Surface", cls: "rg-lane rg-lane-surface" },
    { key: "ground", label: "Ground", cls: "rg-lane rg-lane-ground" },
    { key: "under", label: "Underwater", cls: "rg-lane rg-lane-under" },
  ];
  var SENSORS = [
    { key: "radar", label: "Radar", color: "var(--rg-radar)" },
    { key: "lidar", label: "LiDAR", color: "var(--rg-lidar)" },
    { key: "sonar", label: "Sonar", color: "var(--rg-sonar)" },
    { key: "camera", label: "Camera", color: "var(--rg-camera)" },
  ];
  var TYPES = {
    journal: { label: "Journal", r: 12 },
    conference: { label: "Conference", r: 9 },
    "domestic-journal": { label: "Domestic journal", r: 7 },
    "domestic-conference": { label: "Domestic conference", r: 7 },
    workshop: { label: "Workshop / poster", r: 5.5 },
    other: { label: "Other", r: 5.5 },
  };
  var TAG_LABELS = { radar: "Radar", lidar: "LiDAR", sonar: "Sonar", slam: "SLAM", learning: "Learning" };
  var VENUE_NAMES = {
    "the journal of korea robotics society": "JKROS",
    "plos one": "PLOS ONE",
    "ifac-papersonline": "IFAC-PapersOnLine",
  };

  // Geometry (SVG user units; the SVG scales to the card width).
  var W = 900;
  var LABEL_W = 132; // lane name area inside each band
  var PLOT_L = LABEL_W + 14;
  var PLOT_R = W - 22;
  var AWARD_Y = 12;
  var LANE_TOP = 30;
  var LANE_H = 82;
  var LANE_GAP = 8;
  var LANES_BOTTOM = LANE_TOP + LANES.length * LANE_H + (LANES.length - 1) * LANE_GAP;
  var AXIS_Y = LANES_BOTTOM + 22;
  var H = AXIS_Y + 6;

  var svg = root.querySelector(".rg-svg");
  var tooltip = root.querySelector(".rg-tooltip");
  var statsEl = root.querySelector(".rg-stats");
  var legendEl = root.querySelector(".rg-legend");
  var fallback = root.querySelector(".rg-fallback");

  var config = { projects: [], awards: [] };
  try {
    var configEl = document.getElementById("rg-config");
    if (configEl) config = JSON.parse(configEl.textContent) || config;
  } catch (e) {
    // Projects and awards are optional.
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
      var type = TYPES[row.getAttribute("data-pub-type")] ? row.getAttribute("data-pub-type") : "other";

      papers.push({
        key: body.id,
        title: clean((body.querySelector(".title") || {}).textContent),
        venue: shortVenue((body.querySelector(".periodical") || {}).textContent),
        year: year,
        t: year + (month ? (month - 0.5) / 12 : 0.5),
        type: type,
        r: TYPES[type].r,
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

  // Place bubbles in a band without overlap. Newest first, so the latest work sits
  // exactly on its date; earlier bubbles in a crowded stretch nudge up/down and, if
  // needed, slightly left, which keeps the left-to-right order intact.
  function layoutLane(nodes, cy, halfHeight) {
    var placed = [];
    nodes
      .slice()
      .sort(function (a, b) {
        return b.x - a.x || b.r - a.r;
      })
      .forEach(function (n) {
        var maxDy = halfHeight - n.r - 4;
        var spots = [];
        for (var dx = 0; dx >= -30; dx -= 3) {
          for (var k = 0; k * 3.5 <= maxDy; k++) {
            var dyAbs = k * 3.5;
            spots.push({ dx: dx, dy: -dyAbs, cost: dyAbs - 2.5 * dx });
            if (k) spots.push({ dx: dx, dy: dyAbs, cost: dyAbs - 2.5 * dx + 0.01 });
          }
        }
        spots.sort(function (a, b) {
          return a.cost - b.cost;
        });
        var best = spots[0];
        for (var i = 0; i < spots.length; i++) {
          var sx = n.x + spots[i].dx;
          var sy = cy + spots[i].dy;
          if (sx + n.r > W - 8 || sx - n.r < PLOT_L - 8) continue;
          var hit = placed.some(function (p) {
            var ddx = p.x - sx;
            var ddy = p.y - sy;
            var min = p.r + n.r + 4;
            return ddx * ddx + ddy * ddy < min * min;
          });
          if (!hit) {
            best = spots[i];
            break;
          }
        }
        n.x += best.dx;
        n.y = cy + best.dy;
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
      var c = [p1.x + (p2.x - p0.x) / 6, p1.y + (p2.y - p0.y) / 6, p2.x - (p3.x - p1.x) / 6, p2.y - (p3.y - p1.y) / 6, p2.x, p2.y];
      d +=
        " C" +
        c
          .map(function (v) {
            return v.toFixed(1);
          })
          .join(",");
    }
    return d;
  }

  function halfDisc(cx, cy, r, side) {
    // side -1: left half, 1: right half
    return "M" + cx + "," + (cy - r) + " A" + r + "," + r + " 0 0," + (side < 0 ? 0 : 1) + " " + cx + "," + (cy + r) + " Z";
  }

  function starPoints(cx, cy, outer, inner) {
    var pts = [];
    for (var k = 0; k < 10; k++) {
      var rad = k % 2 ? inner : outer;
      var ang = -Math.PI / 2 + (k * Math.PI) / 5;
      pts.push((cx + rad * Math.cos(ang)).toFixed(1) + "," + (cy + rad * Math.sin(ang)).toFixed(1));
    }
    return pts.join(" ");
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function maxOf(list, fn) {
    return Math.max.apply(null, list.map(fn));
  }

  function minOf(list, fn) {
    return Math.min.apply(null, list.map(fn));
  }

  function drawBubble(parent, p) {
    var a = el("a", { href: p.href, class: "rg-node " + (p.lead ? "rg-lead" : "rg-co"), "aria-label": p.title + ", " + p.venue + " " + p.year }, parent);
    el("circle", { cx: p.x, cy: p.y, r: p.r + 7, class: "rg-hit" }, a);
    el("circle", { cx: p.x, cy: p.y, r: p.r + 3.5, class: "rg-hover-ring" }, a);
    var c0 = p.sensors[0].color;
    if (p.sensors.length > 1) {
      el("path", { d: halfDisc(p.x, p.y, p.r, -1), class: "rg-dot", style: "fill:" + c0 }, a);
      el("path", { d: halfDisc(p.x, p.y, p.r, 1), class: "rg-dot", style: "fill:" + p.sensors[1].color }, a);
      el("circle", { cx: p.x, cy: p.y, r: p.r, class: "rg-dot-outline", style: p.lead ? "" : "stroke:" + c0 }, a);
    } else {
      el("circle", { cx: p.x, cy: p.y, r: p.r, class: "rg-dot", style: "fill:" + c0 }, a);
      if (!p.lead) el("circle", { cx: p.x, cy: p.y, r: p.r, class: "rg-dot-outline", style: "stroke:" + c0 }, a);
    }
    return a;
  }

  // Midpoint of a "YYYY" or "YYYY-MM" date, so markers sit where the year/month is.
  function markerT(date) {
    var t = parseYm(date);
    if (t === null) return null;
    return /^\d{4}-\d/.test(String(date)) ? t + 0.5 / 12 : t + 0.5;
  }

  // Research without a paper (from _data/research_journey.yml).
  function parseProjects() {
    return (config.projects || [])
      .map(function (pr) {
        var t = markerT(pr.date);
        if (t === null || !pr.title) return null;
        var lane = LANES.filter(function (l) {
          return l.key === pr.lane;
        })[0];
        return {
          project: true,
          title: pr.title,
          detail: pr.detail || "",
          award: pr.award || "",
          date: String(pr.date),
          year: Math.floor(t),
          t: t,
          r: 8,
          lane: lane || LANES[1],
          tags: [lane ? lane.key : "ground"],
          sensors: [SENSORS[3]],
          lead: true,
        };
      })
      .filter(Boolean);
  }

  function drawProject(parent, p) {
    var g = el("g", { class: "rg-node rg-lead rg-project", tabindex: "0", role: "img", "aria-label": p.title + ", " + p.year + (p.award ? ", " + p.award : "") }, parent);
    el("circle", { cx: p.x, cy: p.y, r: p.r + 7, class: "rg-hit" }, g);
    el("rect", { x: p.x - p.r - 3.5, y: p.y - p.r - 3.5, width: 2 * p.r + 7, height: 2 * p.r + 7, rx: 7, class: "rg-hover-ring" }, g);
    el("rect", { x: p.x - p.r, y: p.y - p.r, width: 2 * p.r, height: 2 * p.r, rx: 4.5, class: "rg-dot", style: "fill:" + p.sensors[0].color }, g);
    return g;
  }

  function render(papers) {
    var projects = parseProjects();
    var items = papers.concat(projects);
    var minT = Math.floor(minOf(items, (p) => p.t));
    var now = new Date();
    var maxT = Math.ceil(Math.max(now.getFullYear() + now.getMonth() / 12, maxOf(items, (p) => p.t)) + 0.01);
    function x(t) {
      return PLOT_L + ((t - minT) / (maxT - minT)) * (PLOT_R - PLOT_L);
    }

    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.innerHTML = "";
    el("title", { id: "rg-svg-title" }, svg).textContent = "Publications over time by research domain";

    // Domain bands.
    var gLanes = el("g", {}, svg);
    LANES.forEach(function (lane, i) {
      var y0 = LANE_TOP + i * (LANE_H + LANE_GAP);
      lane.cy = y0 + LANE_H / 2;
      el("rect", { x: 0, y: y0, width: W, height: LANE_H, rx: 18, class: lane.cls }, gLanes);
      el("text", { x: 18, y: lane.cy - 3, class: "rg-lane-label" }, gLanes).textContent = lane.label;
      var count = papers.filter(function (p) {
        return p.lane === lane;
      }).length;
      var extra = projects.filter(function (p) {
        return p.lane === lane;
      }).length;
      el("text", { x: 18, y: lane.cy + 14, class: "rg-lane-count" }, gLanes).textContent =
        count + (count === 1 ? " paper" : " papers") + (extra ? " · " + extra + (extra === 1 ? " project" : " projects") : "");
    });

    // Years.
    var gAxis = el("g", {}, svg);
    for (var yr = minT; yr < maxT; yr++) {
      el("text", { x: x(yr + 0.5), y: AXIS_Y, class: "rg-axis-label" }, gAxis).textContent = yr;
    }

    // Awards above the bands.
    var gAwards = el("g", {}, svg);
    var awardNodes = [];
    var awards = (config.awards || []).concat(
      projects
        .filter(function (p) {
          return p.award;
        })
        .map(function (p) {
          return { label: p.award + " — " + p.title, date: p.date };
        })
    );
    awards.forEach(function (award) {
      var t = markerT(award.date);
      if (t === null || t < minT || t > maxT) return;
      var ax = x(t);
      var g = el("g", { class: "rg-award", tabindex: "0", role: "img", "aria-label": award.label }, gAwards);
      el("circle", { cx: ax, cy: AWARD_Y, r: 14, class: "rg-hit" }, g);
      el("circle", { cx: ax, cy: AWARD_Y, r: 10, class: "rg-award-bg" }, g);
      el("polygon", { points: starPoints(ax, AWARD_Y, 6, 2.6), class: "rg-award-star" }, g);
      awardNodes.push({ g: g, award: award, x: ax, y: AWARD_Y });
    });

    // Marker positions.
    items.forEach(function (p) {
      p.x = x(p.t);
    });
    LANES.forEach(function (lane) {
      layoutLane(
        items.filter(function (p) {
          return p.lane === lane;
        }),
        lane.cy,
        LANE_H / 2
      );
    });

    // Footprint trail through my projects and 1st / corresponding author papers.
    var leadPoints = items
      .filter(function (p) {
        return p.lead;
      })
      .sort(function (a, b) {
        return a.t - b.t;
      });
    var path = el("path", { d: smoothPath(leadPoints), class: "rg-path" }, svg);

    // Markers: co-authored first, then mine on top; larger ones underneath.
    var gDots = el("g", {}, svg);
    items
      .slice()
      .sort(function (a, b) {
        return a.lead - b.lead || b.r - a.r;
      })
      .forEach(function (p) {
        p.node = p.project ? drawProject(gDots, p) : drawBubble(gDots, p);
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
      tooltip.style.left = Math.min(Math.max(left - tw / 2, 8), root.clientWidth - tw - 8) + "px";
      tooltip.style.top = (top - th - 14 < 0 ? top + 22 : top - th - 14) + "px";
    }

    function showPaper(p) {
      var role = p.first && p.corresponding ? "First & corresponding author" : p.first ? "First author" : p.corresponding ? "Corresponding author" : "Co-author";
      var tags = p.tags
        .filter(function (t) {
          return TAG_LABELS[t];
        })
        .map(function (t) {
          return TAG_LABELS[t];
        })
        .join(" · ");
      tooltip.innerHTML =
        (p.thumb ? '<img class="rg-tip-thumb" alt="" src="' + escapeHtml(p.thumb) + '">' : "") +
        "<div>" +
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
        '<span class="rg-tip-role' +
        (p.lead ? " is-lead" : "") +
        '">' +
        role +
        "</span>" +
        (tags ? '<div class="rg-tip-tags">' + tags + "</div>" : "") +
        "</div>";
      place(p.x, p.y - p.r);
    }

    function showProject(p) {
      tooltip.innerHTML =
        "<div>" +
        '<div class="rg-tip-meta"><span class="rg-tip-venue">Undergraduate research</span> · ' +
        p.year +
        "</div>" +
        '<div class="rg-tip-title">' +
        escapeHtml(p.title) +
        "</div>" +
        (p.detail ? '<div class="rg-tip-detail">' + escapeHtml(p.detail) + "</div>" : "") +
        (p.award ? '<span class="rg-tip-award">★ ' + escapeHtml(p.award) + "</span>" : "") +
        "</div>";
      place(p.x, p.y - p.r);
    }

    function showAward(a) {
      tooltip.innerHTML =
        '<div><div class="rg-tip-meta">Award · ' + escapeHtml(a.award.date) + '</div><div class="rg-tip-title">' + escapeHtml(a.award.label) + "</div></div>";
      place(a.x, a.y + 26);
    }

    function hide() {
      tooltip.hidden = true;
    }

    function bindHover(node, show) {
      node.addEventListener("mouseenter", show);
      node.addEventListener("focus", show);
      node.addEventListener("mouseleave", hide);
      node.addEventListener("blur", hide);
    }
    items.forEach(function (p) {
      bindHover(p.node, function () {
        if (p.project) showProject(p);
        else showPaper(p);
      });
    });
    awardNodes.forEach(function (a) {
      bindHover(a.g, function () {
        showAward(a);
      });
    });

    // Highlight pills.
    var activeTag = "";
    var leadOnly = false;
    function applyHighlight() {
      items.forEach(function (p) {
        var on = (!activeTag || p.tags.indexOf(activeTag) !== -1) && (!leadOnly || p.lead);
        p.node.classList.toggle("is-dim", !on);
      });
      path.classList.toggle("is-dim", !!activeTag);
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
    var stats = [[papers.length, "papers"]];
    statsEl.innerHTML = stats
      .map(function (s) {
        return '<span class="rg-stat"><span class="rg-stat-value">' + s[0] + "</span>" + s[1] + "</span>";
      })
      .join("");

    // Legend.
    function dot(color, r, solid) {
      var s = r * 2 + 4;
      return (
        '<svg width="' +
        s +
        '" height="' +
        s +
        '" aria-hidden="true"><circle cx="' +
        s / 2 +
        '" cy="' +
        s / 2 +
        '" r="' +
        r +
        '" style="fill:' +
        color +
        ";fill-opacity:" +
        (solid ? 1 : 0.22) +
        (solid ? "" : ";stroke:" + color + ";stroke-width:1.5") +
        '"></circle></svg>'
      );
    }
    var sensorItems = SENSORS.filter(function (s) {
      return items.some(function (p) {
        return p.sensors.indexOf(s) !== -1;
      });
    }).map(function (s) {
      return '<span class="rg-legend-item">' + dot(s.color, 5, true) + s.label + "</span>";
    });
    // Row 2: one marker per venue type, drawn at the size it has in the chart.
    var scale = Math.max(svg.getBoundingClientRect().width / W, 0.6) || 1;
    var sizeItems = ["journal", "conference", "domestic-journal", "domestic-conference", "workshop"]
      .filter(function (k) {
        return papers.some(function (p) {
          return p.type === k;
        });
      })
      .map(function (k) {
        return '<span class="rg-legend-item">' + dot("var(--soft-muted)", TYPES[k].r * scale, false) + TYPES[k].label + "</span>";
      });
    legendEl.innerHTML =
      '<div class="rg-legend-row">' +
      sensorItems.join("") +
      '<span class="rg-legend-sep" aria-hidden="true"></span>' +
      '<span class="rg-legend-item">' +
      dot("var(--soft-muted)", 5, true) +
      "1st / corresponding author</span>" +
      '<span class="rg-legend-item">' +
      dot("var(--soft-muted)", 5, false) +
      "Co-author</span>" +
      (projects.length
        ? '<span class="rg-legend-item"><svg width="14" height="14" aria-hidden="true"><rect x="2" y="2" width="10" height="10" rx="3" style="fill:var(--soft-muted)"></rect></svg>Research project</span>'
        : "") +
      '<span class="rg-legend-item"><svg width="26" height="8" aria-hidden="true"><path d="M2,4 H24" class="rg-path"></path></svg>My trail</span>' +
      '<span class="rg-legend-item"><svg width="16" height="16" aria-hidden="true"><circle cx="8" cy="8" r="8" class="rg-award-bg"></circle><polygon points="' +
      starPoints(8, 8, 5, 2.2) +
      '" class="rg-award-star"></polygon></svg>Award</span>' +
      "</div>" +
      '<div class="rg-legend-row">' +
      sizeItems.join("") +
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
      if (!fallback) return;
      fallback.textContent = "The research timeline could not be loaded. ";
      var link = document.createElement("a");
      link.href = source;
      link.textContent = "See all publications.";
      fallback.appendChild(link);
    });
})();
