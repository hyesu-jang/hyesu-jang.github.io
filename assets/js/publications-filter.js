// Filterable publication list for /publications/.
// Each entry carries data-pub-type / data-pub-year / data-pub-month / data-pub-tags,
// written by _layouts/bib.liquid. This script groups entries by year, adds tag chips,
// and filters by the selects and search box in _pages/publications.md.
(function () {
  "use strict";

  var filterRoot = document.getElementById("pub-filter");
  var listRoot = document.getElementById("pub-list");
  if (!filterRoot || !listRoot) return;

  var MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  var FILTER_KEYS = ["type", "area", "domain", "year", "q"];

  var controls = {};
  FILTER_KEYS.forEach(function (key) {
    controls[key] = filterRoot.querySelector('[data-filter="' + key + '"]');
  });
  var countEl = filterRoot.querySelector(".pub-filter-count");
  var resetBtn = filterRoot.querySelector(".pub-filter-reset");
  var emptyEl = document.querySelector(".pub-filter-empty");

  function optionLabels(select) {
    var labels = {};
    Array.prototype.forEach.call(select.options, function (opt) {
      // Chips use the singular data-chip label when given ("Journal" vs. "Journals").
      if (opt.value) labels[opt.value] = (opt.getAttribute("data-chip") || opt.textContent).trim();
    });
    return labels;
  }

  function parseMonth(raw) {
    var value = (raw || "").trim().toLowerCase();
    if (!value) return 0;
    var num = parseInt(value, 10);
    if (!isNaN(num)) return num;
    return MONTHS[value.slice(0, 3)] || 0;
  }

  var typeLabels = optionLabels(controls.type);
  var areaLabels = optionLabels(controls.area);
  var domainLabels = optionLabels(controls.domain);

  // Collect entries.
  var entries = [];
  listRoot.querySelectorAll("li").forEach(function (li, index) {
    var row = li.querySelector(".row[data-pub-type]");
    if (!row) return;
    var tags = (row.getAttribute("data-pub-tags") || "").split(/\s+/).filter(Boolean);
    entries.push({
      li: li,
      row: row,
      index: index,
      type: row.getAttribute("data-pub-type"),
      year: (row.getAttribute("data-pub-year") || "").trim(),
      month: parseMonth(row.getAttribute("data-pub-month")),
      tags: tags,
      text: "",
    });
  });
  if (!entries.length) return;

  // Newest first: year, then month; keep source order for ties.
  entries.sort(function (a, b) {
    return (parseInt(b.year, 10) || 0) - (parseInt(a.year, 10) || 0) || b.month - a.month || a.index - b.index;
  });

  // Rebuild the list as year sections.
  var groups = document.createElement("div");
  groups.className = "pub-groups";
  var sections = {};
  var years = [];
  entries.forEach(function (entry) {
    var key = entry.year || "Other";
    if (!sections[key]) {
      var section = document.createElement("section");
      section.className = "pub-year";
      var heading = document.createElement("h2");
      heading.className = "pub-year-title";
      heading.textContent = key;
      var ol = document.createElement("ol");
      ol.className = "bibliography";
      section.appendChild(heading);
      section.appendChild(ol);
      groups.appendChild(section);
      sections[key] = { el: section, ol: ol };
      if (entry.year) years.push(entry.year);
    }
    sections[key].ol.appendChild(entry.li);
  });
  listRoot.innerHTML = "";
  listRoot.appendChild(groups);

  // Tag chips under each entry's venue line; clicking a chip applies that filter.
  function makeChip(label, filterKey, value, variantClass) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pub-chip " + variantClass;
    chip.textContent = label;
    chip.setAttribute("data-chip-filter", filterKey);
    chip.setAttribute("data-chip-value", value);
    chip.title = "Show only " + label;
    return chip;
  }

  entries.forEach(function (entry) {
    var body = entry.row.querySelector(":scope > div[id]") || entry.row;
    var wrap = document.createElement("div");
    wrap.className = "pub-tags";
    if (typeLabels[entry.type]) wrap.appendChild(makeChip(typeLabels[entry.type], "type", entry.type, "pub-chip-type"));
    entry.tags.forEach(function (tag) {
      if (areaLabels[tag]) wrap.appendChild(makeChip(areaLabels[tag], "area", tag, "pub-chip-area"));
    });
    entry.tags.forEach(function (tag) {
      if (domainLabels[tag]) wrap.appendChild(makeChip(domainLabels[tag], "domain", tag, "pub-chip-domain"));
    });
    var links = body.querySelector(".links");
    body.insertBefore(wrap, links || null);
    // Search text excludes the chips and link buttons.
    var clone = body.cloneNode(true);
    clone.querySelectorAll(".pub-tags, .links, .badges, .hidden").forEach(function (n) {
      n.remove();
    });
    entry.text = clone.textContent.replace(/\s+/g, " ").toLowerCase();
  });

  // Year options and per-option counts.
  years.forEach(function (year) {
    var opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    controls.year.appendChild(opt);
  });

  function countMatching(test) {
    return entries.filter(test).length;
  }

  function decorateOptions(select, test) {
    // Copy first: removing options from the live collection would skip the next one.
    Array.prototype.slice.call(select.options).forEach(function (opt) {
      if (!opt.value) return;
      var n = countMatching(function (e) {
        return test(e, opt.value);
      });
      opt.textContent = opt.textContent.replace(/\s*\(\d+\)$/, "") + " (" + n + ")";
      if (n === 0) opt.remove();
    });
  }

  decorateOptions(controls.type, function (e, v) {
    return e.type === v;
  });
  decorateOptions(controls.area, function (e, v) {
    return e.tags.indexOf(v) !== -1;
  });
  decorateOptions(controls.domain, function (e, v) {
    return e.tags.indexOf(v) !== -1;
  });
  decorateOptions(controls.year, function (e, v) {
    return e.year === v;
  });

  // Filtering.
  function readState() {
    var state = {};
    FILTER_KEYS.forEach(function (key) {
      state[key] = (controls[key].value || "").trim();
    });
    return state;
  }

  function matches(entry, state) {
    if (state.type && entry.type !== state.type) return false;
    if (state.area && entry.tags.indexOf(state.area) === -1) return false;
    if (state.domain && entry.tags.indexOf(state.domain) === -1) return false;
    if (state.year && entry.year !== state.year) return false;
    if (state.q) {
      var terms = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      for (var i = 0; i < terms.length; i++) {
        if (entry.text.indexOf(terms[i]) === -1) return false;
      }
    }
    return true;
  }

  function writeUrl(state) {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location.href);
    FILTER_KEYS.forEach(function (key) {
      if (state[key]) url.searchParams.set(key, state[key]);
      else url.searchParams.delete(key);
    });
    try {
      window.history.replaceState(null, "", url.href);
    } catch (e) {
      // URL sync is a convenience; filtering still works without it.
    }
  }

  function apply() {
    var state = readState();
    var visible = 0;
    entries.forEach(function (entry) {
      var show = matches(entry, state);
      entry.li.hidden = !show;
      if (show) visible++;
    });
    Object.keys(sections).forEach(function (key) {
      var section = sections[key];
      section.el.hidden = !section.ol.querySelector("li:not([hidden])");
    });

    var active = FILTER_KEYS.some(function (key) {
      return state[key];
    });
    countEl.textContent = active ? visible + " of " + entries.length + " publications" : entries.length + " publications";
    resetBtn.hidden = !active;
    if (emptyEl) emptyEl.hidden = visible !== 0;

    document.querySelectorAll(".pub-chip").forEach(function (chip) {
      var key = chip.getAttribute("data-chip-filter");
      chip.classList.toggle("is-active", state[key] === chip.getAttribute("data-chip-value"));
    });

    writeUrl(state);
  }

  function setControl(key, value) {
    var control = controls[key];
    if (control.tagName === "SELECT" && value && !control.querySelector('option[value="' + CSS.escape(value) + '"]')) {
      value = "";
    }
    control.value = value;
  }

  // Restore state from the URL (?type=journal&area=radar...).
  var params = new URLSearchParams(window.location.search);
  FILTER_KEYS.forEach(function (key) {
    if (params.has(key)) setControl(key, params.get(key));
  });

  ["type", "area", "domain", "year"].forEach(function (key) {
    controls[key].addEventListener("change", apply);
  });
  controls.q.addEventListener("input", apply);

  resetBtn.addEventListener("click", function () {
    FILTER_KEYS.forEach(function (key) {
      setControl(key, "");
    });
    apply();
  });

  groups.addEventListener("click", function (event) {
    var chip = event.target.closest(".pub-chip");
    if (!chip) return;
    var key = chip.getAttribute("data-chip-filter");
    var value = chip.getAttribute("data-chip-value");
    setControl(key, controls[key].value === value ? "" : value);
    apply();
    // Bring the filters back into view, below the fixed navbar.
    var top = filterRoot.getBoundingClientRect().top;
    if (top < 0) window.scrollTo({ top: top + window.scrollY - 80, behavior: "smooth" });
  });

  apply();
})();
